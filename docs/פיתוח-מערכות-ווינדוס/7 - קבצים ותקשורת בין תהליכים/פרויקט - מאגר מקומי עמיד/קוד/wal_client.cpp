#include "wal_lab.hpp"

int wmain(int argc, wchar_t** argv) {
    if (argc != 5) return 2;
    try {
        const std::wstring command = argv[1];
        if (command != L"put" && command != L"get") return 2;
        auto number = [](const wchar_t* text) {
            const std::wstring input(text);
            if (input.empty() ||
                input.find_first_not_of(L"0123456789") != std::wstring::npos)
                throw std::invalid_argument("decimal number required");
            std::size_t used = 0;
            const auto value = std::stoull(input, &used);
            if (used != input.size()) throw std::invalid_argument("trailing input");
            return static_cast<std::uint64_t>(value);
        };
        const auto id = number(argv[2]);
        const auto key = number(argv[3]);
        const auto value = number(argv[4]);
        if (key > 0xffffffffULL || value > 0xffffffffULL) return 2;
        constexpr auto name = L"\\\\.\\pipe\\AmitTech.WalLab";
        if (!WaitNamedPipeW(name, 2000)) fail("wait pipe");
        Handle pipe(CreateFileW(name, GENERIC_READ | GENERIC_WRITE, 0,
            nullptr, OPEN_EXISTING, FILE_FLAG_OVERLAPPED |
                SECURITY_SQOS_PRESENT | SECURITY_IDENTIFICATION, nullptr));
        if (pipe.value == INVALID_HANDLE_VALUE) fail("open pipe");
        DWORD mode = PIPE_READMODE_MESSAGE;
        if (!SetNamedPipeHandleState(pipe.value, &mode, nullptr, nullptr))
            fail("pipe mode");
        std::array<std::byte, 24> request{};
        request[0] = std::byte{'K'}; request[1] = std::byte{'V'};
        request[2] = std::byte{'P'}; request[3] = std::byte{'1'};
        put(request, 4, 1, 2); put(request, 6, command == L"put" ? 1 : 2, 2);
        put(request, 8, id, 8); put(request, 16, key, 4); put(request, 20, value, 4);
        const auto sent = pipe_io(pipe.value, true, request.data(), 24);
        if (sent.error || sent.bytes != 24) throw std::runtime_error("send failed");
        std::array<std::byte, 24> response{};
        const auto received = pipe_io(pipe.value, false, response.data(), 24);
        if (received.error || received.bytes != 24)
            throw std::runtime_error("result unknown: receive failed");
        if (response[0] != std::byte{'K'} || response[1] != std::byte{'V'} ||
            response[2] != std::byte{'R'} || response[3] != std::byte{'1'} ||
            get(response, 8, 8) != id || get(response, 4, 4) > 4 ||
            get(response, 20, 4) > 1)
            throw std::runtime_error("invalid response");
        const auto status = get(response, 4, 4);
        const auto flags = get(response, 20, 4);
        if (status == 0 && flags != 1)
            throw std::runtime_error("success lacks durable state flag");
        std::byte ack{0xac};
        const auto acknowledged = pipe_io(pipe.value, true, &ack, 1);
        if (acknowledged.error || acknowledged.bytes != 1)
            std::cerr << "ack failed; received result remains known\n";
        std::cout << "status=" << status << " value=" << get(response, 16, 4)
                  << " durable=" << flags << '\n';
        return status == 0 ? 0 : 3;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}
