#include "wal_lab.hpp"

struct Saved { std::uint32_t key, value; };
struct Reply { std::uint32_t status, value, flags; };

class Store {
    HANDLE file_;
    std::map<std::uint32_t, std::uint32_t> values_;
    std::map<std::uint32_t, Saved> requests_;
    std::wstring crash_;

    void crash_at(const wchar_t* point) const {
        if (crash_ == point) ExitProcess(70);
    }

public:
    Store(HANDLE file, std::wstring crash) : file_(file), crash_(std::move(crash)) {
        LARGE_INTEGER size{};
        if (!GetFileSizeEx(file_, &size)) fail("journal size");
        if (size.QuadPart < 0 || size.QuadPart > 128 * 64)
            throw std::runtime_error("journal exceeds bounded format");
        std::vector<std::byte> bytes(static_cast<std::size_t>(size.QuadPart));
        std::size_t read = 0;
        while (read < bytes.size()) {
            DWORD count = 0;
            if (!ReadFile(file_, bytes.data() + read,
                    static_cast<DWORD>(bytes.size() - read), &count, nullptr))
                fail("journal read");
            if (count == 0) throw std::runtime_error("journal changed");
            read += count;
        }
        std::size_t valid_end = 0;
        while (bytes.size() - valid_end >= 64) {
            const auto data = std::span(bytes).subspan(valid_end, 32);
            const auto commit = std::span(bytes).subspan(valid_end + 32, 32);
            if (!valid_record(data, 1) || !valid_record(commit, 2))
                throw std::runtime_error("corrupt full transaction");
            const auto id = static_cast<std::uint32_t>(get(data, 8, 4));
            const auto key = static_cast<std::uint32_t>(get(data, 16, 4));
            const auto value = static_cast<std::uint32_t>(get(data, 20, 4));
            if (id == 0 || get(commit, 8, 4) != id ||
                get(commit, 16, 4) != key || get(commit, 20, 4) != value ||
                requests_.contains(id))
                throw std::runtime_error("invalid transaction identity");
            values_[key] = value;
            requests_.emplace(id, Saved{key, value});
            valid_end += 64;
        }
        if (valid_end != bytes.size()) {
            const auto tail = std::span(bytes).subspan(valid_end);
            if (tail.size() >= 32 && !valid_record(tail.first(32), 1))
                throw std::runtime_error("corrupt tail data record");
            std::cerr << "discarding incomplete unacknowledged tail: "
                      << bytes.size() - valid_end << " bytes\n";
            LARGE_INTEGER end{};
            end.QuadPart = static_cast<LONGLONG>(valid_end);
            if (!SetFilePointerEx(file_, end, nullptr, FILE_BEGIN) ||
                !SetEndOfFile(file_) || !FlushFileBuffers(file_))
                fail("truncate incomplete tail");
        }
        LARGE_INTEGER zero{};
        if (!SetFilePointerEx(file_, zero, nullptr, FILE_END))
            fail("seek append");
    }

    Reply get_value(std::uint32_t key) const {
        const auto found = values_.find(key);
        if (found == values_.end()) return {1, 0, 0};
        return {0, found->second, 1};
    }

    Reply put_value(std::uint64_t wide_id, std::uint32_t key,
                    std::uint32_t value) {
        if (wide_id == 0 || wide_id > std::numeric_limits<std::uint32_t>::max())
            return {3, 0, 0};
        const auto id = static_cast<std::uint32_t>(wide_id);
        if (auto found = requests_.find(id); found != requests_.end()) {
            if (found->second.key != key || found->second.value != value)
                return {2, 0, 0};
            return {0, found->second.value, 1};
        }
        if (requests_.size() >= 128) return {4, 0, 0};

        auto next_values = values_;
        auto next_requests = requests_;
        next_values[key] = value;
        next_requests.emplace(id, Saved{key, value});
        const auto data = record(1, id, key, value);
        const auto commit = record(2, id, key, value);
        write_all(file_, data);
        crash_at(L"--crash-after-data");
        write_all(file_, commit);
        crash_at(L"--crash-after-commit");
        if (!FlushFileBuffers(file_)) fail("journal flush");
        crash_at(L"--crash-after-flush");
        values_.swap(next_values);
        requests_.swap(next_requests);
        return {0, value, 1};
    }
};

int wmain(int argc, wchar_t** argv) {
    if (argc < 3 || argc > 4) return 2;
    const bool create = std::wcscmp(argv[1], L"create") == 0;
    const bool open = std::wcscmp(argv[1], L"open") == 0;
    if (!create && !open) return 2;
    const std::wstring crash = argc == 4 ? argv[3] : L"";
    if (!crash.empty() && crash != L"--crash-after-data" &&
        crash != L"--crash-after-commit" && crash != L"--crash-after-flush")
        return 2;
    try {
        Handle journal(CreateFileW(argv[2], GENERIC_READ | GENERIC_WRITE, 0,
            nullptr, create ? CREATE_NEW : OPEN_EXISTING,
            FILE_ATTRIBUTE_NORMAL, nullptr));
        if (journal.value == INVALID_HANDLE_VALUE) fail("open journal");
        Store store(journal.value, crash);
        auto descriptor = current_user_security();
        SECURITY_ATTRIBUTES attributes{sizeof(attributes), descriptor.get(), FALSE};
        Handle pipe(CreateNamedPipeW(L"\\\\.\\pipe\\AmitTech.WalLab",
            PIPE_ACCESS_DUPLEX | FILE_FLAG_OVERLAPPED | FILE_FLAG_FIRST_PIPE_INSTANCE,
            PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT |
                PIPE_REJECT_REMOTE_CLIENTS,
            1, 256, 256, 5000, &attributes));
        if (pipe.value == INVALID_HANDLE_VALUE) fail("create pipe");

        for (unsigned connection = 0; connection < 8; ++connection) {
            const DWORD connected = connect_pipe(pipe.value);
            if (connected != ERROR_SUCCESS) {
                std::cerr << "connect: " << connected << '\n';
                break;
            }
            struct Disconnect {
                HANDLE pipe;
                ~Disconnect() { DisconnectNamedPipe(pipe); }
            } disconnect{pipe.value};

            std::array<std::byte, 24> request{};
            const auto received = pipe_io(pipe.value, false, request.data(), 24);
            if (received.error != ERROR_SUCCESS || received.bytes != 24)
                continue;
            if (request[0] != std::byte{'K'} || request[1] != std::byte{'V'} ||
                request[2] != std::byte{'P'} || request[3] != std::byte{'1'} ||
                get(request, 4, 2) != 1) continue;
            const auto operation = get(request, 6, 2);
            const auto id = get(request, 8, 8);
            const auto key = static_cast<std::uint32_t>(get(request, 16, 4));
            const auto value = static_cast<std::uint32_t>(get(request, 20, 4));
            Reply result{3, 0, 0};
            if (operation == 1) result = store.put_value(id, key, value);
            else if (operation == 2 && value == 0) result = store.get_value(key);

            std::array<std::byte, 24> response{};
            response[0] = std::byte{'K'}; response[1] = std::byte{'V'};
            response[2] = std::byte{'R'}; response[3] = std::byte{'1'};
            put(response, 4, result.status, 4);
            put(response, 8, id, 8);
            put(response, 16, result.value, 4);
            put(response, 20, result.flags, 4);
            const auto sent = pipe_io(pipe.value, true, response.data(), 24);
            if (sent.error != ERROR_SUCCESS || sent.bytes != 24) continue;

            std::byte acknowledgment{};
            const auto ack = pipe_io(pipe.value, false, &acknowledgment, 1);
            if (ack.error != ERROR_SUCCESS || ack.bytes != 1 ||
                acknowledgment != std::byte{0xac})
                std::cerr << "reply acknowledgment not received\n";
        }
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}
