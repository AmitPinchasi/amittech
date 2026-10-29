#pragma once
#define WIN32_LEAN_AND_MEAN
#include <Windows.h>
#include <sddl.h>
#include <algorithm>
#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <cwchar>
#include <iostream>
#include <limits>
#include <map>
#include <memory>
#include <span>
#include <stdexcept>
#include <string>
#include <system_error>
#include <vector>
#include <utility>
#pragma comment(lib, "Advapi32.lib")

[[noreturn]] inline void fail(const char* operation) {
    const DWORD error = GetLastError();
    throw std::system_error(static_cast<int>(error),
                            std::system_category(), operation);
}
struct Handle {
    HANDLE value;
    explicit Handle(HANDLE v) : value(v) {}
    ~Handle() {
        if (value && value != INVALID_HANDLE_VALUE) CloseHandle(value);
    }
    Handle(const Handle&) = delete;
    Handle& operator=(const Handle&) = delete;
};
struct LocalDelete {
    void operator()(void* p) const noexcept { if (p) LocalFree(p); }
};
using LocalMemory = std::unique_ptr<void, LocalDelete>;

inline LocalMemory current_user_security() {
    HANDLE raw = nullptr;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &raw))
        fail("OpenProcessToken");
    Handle token(raw);
    DWORD required = 0;
    GetTokenInformation(token.value, TokenUser, nullptr, 0, &required);
    if (GetLastError() != ERROR_INSUFFICIENT_BUFFER) fail("token size");
    std::vector<std::max_align_t> storage(
        (required + sizeof(std::max_align_t) - 1) / sizeof(std::max_align_t));
    if (!GetTokenInformation(token.value, TokenUser, storage.data(),
                             required, &required)) fail("TokenUser");
    auto* user = reinterpret_cast<TOKEN_USER*>(storage.data());
    wchar_t* raw_sid = nullptr;
    if (!ConvertSidToStringSidW(user->User.Sid, &raw_sid)) fail("SID text");
    LocalMemory sid(raw_sid);
    const std::wstring text =
        L"D:P(A;;GA;;;SY)(A;;GA;;;" + std::wstring(raw_sid) + L")";
    PSECURITY_DESCRIPTOR raw_descriptor = nullptr;
    if (!ConvertStringSecurityDescriptorToSecurityDescriptorW(
            text.c_str(), SDDL_REVISION_1, &raw_descriptor, nullptr))
        fail("security descriptor");
    return LocalMemory(raw_descriptor);
}

inline std::uint64_t get(std::span<const std::byte> bytes,
                         std::size_t offset, unsigned width) {
    if (width > 8 || offset > bytes.size() ||
        width > bytes.size() - offset) throw std::runtime_error("field range");
    std::uint64_t value = 0;
    for (unsigned i = 0; i < width; ++i)
        value |= std::uint64_t(std::to_integer<unsigned char>(
            bytes[offset + i])) << (i * 8);
    return value;
}
inline void put(std::span<std::byte> bytes, std::size_t offset,
                std::uint64_t value, unsigned width) {
    if (width > 8 || offset > bytes.size() ||
        width > bytes.size() - offset) throw std::runtime_error("field range");
    for (unsigned i = 0; i < width; ++i)
        bytes[offset + i] = std::byte((value >> (i * 8)) & 0xffu);
}
inline std::uint32_t crc32(std::span<const std::byte> bytes) {
    std::uint32_t crc = 0xffffffffu;
    for (auto byte : bytes) {
        crc ^= std::to_integer<unsigned char>(byte);
        for (int bit = 0; bit < 8; ++bit)
            crc = (crc >> 1) ^ (0xedb88320u & (0u - (crc & 1u)));
    }
    return ~crc;
}
using Record = std::array<std::byte, 32>;
inline Record record(unsigned kind, std::uint32_t id,
                     std::uint32_t key, std::uint32_t value) {
    Record bytes{};
    bytes[0] = std::byte{'A'}; bytes[1] = std::byte{'W'};
    bytes[2] = std::byte{'L'}; bytes[3] = std::byte{'1'};
    put(bytes, 4, kind, 1); put(bytes, 5, 1, 1); put(bytes, 6, 32, 2);
    put(bytes, 8, id, 4); put(bytes, 16, key, 4); put(bytes, 20, value, 4);
    put(bytes, 28, crc32(std::span(bytes).first(28)), 4);
    return bytes;
}
inline bool valid_record(std::span<const std::byte> bytes, unsigned kind) {
    if (bytes.size() != 32) return false;
    if (bytes[0] != std::byte{'A'} || bytes[1] != std::byte{'W'} ||
        bytes[2] != std::byte{'L'} || bytes[3] != std::byte{'1'} ||
        get(bytes, 4, 1) != kind || get(bytes, 5, 1) != 1 ||
        get(bytes, 6, 2) != 32 || get(bytes, 12, 4) != 0 ||
        get(bytes, 24, 4) != 0) return false;
    return get(bytes, 28, 4) == crc32(bytes.first(28));
}
inline void write_all(HANDLE file, std::span<const std::byte> bytes) {
    while (!bytes.empty()) {
        DWORD count = 0;
        const auto request = static_cast<DWORD>(
            std::min<std::size_t>(bytes.size(), 1024 * 1024));
        if (!WriteFile(file, bytes.data(), request, &count, nullptr))
            fail("journal write");
        if (count == 0 || count > request)
            throw std::runtime_error("invalid write progress");
        bytes = bytes.subspan(count);
    }
}
struct IoResult { DWORD error; DWORD bytes; };
inline IoResult finish_pending(HANDLE pipe, OVERLAPPED& operation,
                               DWORD timeout) {
    if (WaitForSingleObject(operation.hEvent, timeout) != WAIT_OBJECT_0) {
        if (!CancelIoEx(pipe, &operation) && GetLastError() != ERROR_NOT_FOUND)
            std::cerr << "cancel request failed\n";
    }
    DWORD count = 0;
    if (!GetOverlappedResult(pipe, &operation, &count, TRUE))
        return {GetLastError(), count};
    return {ERROR_SUCCESS, count};
}
inline IoResult pipe_io(HANDLE pipe, bool writing, void* bytes,
                        DWORD count, DWORD timeout = 5000) {
    Handle event(CreateEventW(nullptr, TRUE, FALSE, nullptr));
    if (!event.value) return {GetLastError(), 0};
    OVERLAPPED operation{};
    operation.hEvent = event.value;
    DWORD immediate = 0;
    const BOOL ok = writing
        ? WriteFile(pipe, bytes, count, &immediate, &operation)
        : ReadFile(pipe, bytes, count, &immediate, &operation);
    if (ok) return {ERROR_SUCCESS, immediate};
    const DWORD error = GetLastError();
    if (error != ERROR_IO_PENDING) return {error, immediate};
    return finish_pending(pipe, operation, timeout);
}
inline DWORD connect_pipe(HANDLE pipe) {
    Handle event(CreateEventW(nullptr, TRUE, FALSE, nullptr));
    if (!event.value) return GetLastError();
    OVERLAPPED operation{};
    operation.hEvent = event.value;
    if (ConnectNamedPipe(pipe, &operation)) return ERROR_SUCCESS;
    const DWORD error = GetLastError();
    if (error == ERROR_PIPE_CONNECTED) return ERROR_SUCCESS;
    if (error != ERROR_IO_PENDING) return error;
    return finish_pending(pipe, operation, 30000).error;
}
