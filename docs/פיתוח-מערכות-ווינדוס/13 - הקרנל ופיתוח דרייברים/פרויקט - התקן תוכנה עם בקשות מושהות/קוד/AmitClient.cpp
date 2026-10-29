#define UNICODE
#define _UNICODE
#include <Windows.h>
#include <winioctl.h>
#include <setupapi.h>
#include <iostream>
#include <vector>
#include <string>
#include <system_error>
#include "AmitProtocol.h"
#pragma comment(lib,"Setupapi.lib")

struct Handle {
    HANDLE value=INVALID_HANDLE_VALUE;
    explicit Handle(HANDLE h=INVALID_HANDLE_VALUE):value(h){}
    ~Handle(){ if(value && value!=INVALID_HANDLE_VALUE) CloseHandle(value); }
    Handle(const Handle&)=delete;
    Handle& operator=(const Handle&)=delete;
    void close(){ if(value && value!=INVALID_HANDLE_VALUE) CloseHandle(value);
                  value=INVALID_HANDLE_VALUE; }
};
[[noreturn]] void fail(const char* api) {
    throw std::system_error(static_cast<int>(GetLastError()),
                            std::system_category(),api);
}
std::wstring devicePath() {
    HDEVINFO raw=SetupDiGetClassDevsW(&GUID_DEVINTERFACE_AMIT_ECHO,nullptr,
                       nullptr,DIGCF_PRESENT|DIGCF_DEVICEINTERFACE);
    if(raw==INVALID_HANDLE_VALUE) fail("SetupDiGetClassDevs");
    struct Set { HDEVINFO h; ~Set(){SetupDiDestroyDeviceInfoList(h);} } set{raw};
    SP_DEVICE_INTERFACE_DATA interfaceData{};
    interfaceData.cbSize=sizeof(interfaceData);
    if(!SetupDiEnumDeviceInterfaces(raw,nullptr,
            &GUID_DEVINTERFACE_AMIT_ECHO,0,&interfaceData))
        fail("SetupDiEnumDeviceInterfaces");
    DWORD size=0;
    SetupDiGetDeviceInterfaceDetailW(raw,&interfaceData,nullptr,0,&size,nullptr);
    if(GetLastError()!=ERROR_INSUFFICIENT_BUFFER || size==0)
        fail("SetupDiGetDeviceInterfaceDetail(size)");
    // Default operator new supplies alignment sufficient for this SDK struct.
    std::vector<unsigned char> storage(size);
    auto* detail=reinterpret_cast<SP_DEVICE_INTERFACE_DETAIL_DATA_W*>(storage.data());
    detail->cbSize=sizeof(*detail);
    if(!SetupDiGetDeviceInterfaceDetailW(raw,&interfaceData,detail,size,
                                        nullptr,nullptr))
        fail("SetupDiGetDeviceInterfaceDetail");
    return detail->DevicePath;
}

int wmain(int argc,wchar_t** argv) {
    try {
        const std::wstring mode=argc>1 ? argv[1] : L"--normal";
        if(mode!=L"--normal" && mode!=L"--cancel" &&
           mode!=L"--close" && mode!=L"--badlength") {
            std::wcerr<<L"Use --normal, --cancel, --close or --badlength\n";
            return 2;
        }
        Handle port(CreateIoCompletionPort(INVALID_HANDLE_VALUE,nullptr,0,1));
        if(!port.value) fail("CreateIoCompletionPort");
        const auto path=devicePath();
        Handle file(CreateFileW(path.c_str(),GENERIC_READ|GENERIC_WRITE,
                  FILE_SHARE_READ|FILE_SHARE_WRITE,nullptr,OPEN_EXISTING,
                  FILE_FLAG_OVERLAPPED,nullptr));
        if(file.value==INVALID_HANDLE_VALUE) fail("CreateFile");
        constexpr ULONG_PTR key=17;
        if(!CreateIoCompletionPort(file.value,port.value,key,0))
            fail("Associate IOCP");
        AMIT_INPUT input{1,41};
        AMIT_OUTPUT output{};
        OVERLAPPED ov{};
        DWORD ignored=0;
        BOOL submitted=DeviceIoControl(file.value,IOCTL_AMIT_NEXT,
                    &input,mode==L"--badlength"?4:sizeof(input),
                    &output,sizeof(output),&ignored,&ov);
        if(!submitted) {
            DWORD error=GetLastError();
            if(error!=ERROR_IO_PENDING) {
                std::cout<<"Immediate error: "<<error<<"\n";
                return mode==L"--badlength" ? 0 : 1;
            }
        }
        if(mode==L"--cancel") {
            if(!CancelIoEx(file.value,&ov)) {
                DWORD error=GetLastError();
                std::cout<<"CancelIoEx: "<<error<<"\n";
                // Still drain: failure to cancel does not prove completion.
            }
        }
        if(mode==L"--close") file.close();
        DWORD bytes=0;
        ULONG_PTR receivedKey=0;
        OVERLAPPED* received=nullptr;
        BOOL ok=GetQueuedCompletionStatus(port.value,&bytes,
                                      &receivedKey,&received,5000);
        DWORD error=ok?ERROR_SUCCESS:GetLastError();
        if(!received && !ok && error==WAIT_TIMEOUT) {
            std::cerr<<"Timeout; cancelling and draining before releasing buffers\n";
            if(file.value!=INVALID_HANDLE_VALUE) CancelIoEx(file.value,&ov);
            ok=GetQueuedCompletionStatus(port.value,&bytes,
                                         &receivedKey,&received,INFINITE);
            error=ok?ERROR_SUCCESS:GetLastError();
        }
        if(received!=&ov || receivedKey!=key) {
            // Unexpected port failure cannot establish the request's lifetime.
            // Keep storage alive for inspection instead of unwinding it.
            std::cerr<<"Unexpected completion state; inspect the VM\n";
            for(;;) Sleep(INFINITE);
        }
        if(!ok) {
            std::cout<<"Terminal error: "<<error<<"\n";
            if(mode==L"--badlength") return 0;
            return (mode==L"--cancel" || mode==L"--close") &&
                    error==ERROR_OPERATION_ABORTED ? 0 : 1;
        }
        std::cout<<"bytes="<<bytes<<" version="<<output.Version
                 <<" value="<<output.Value<<"\n";
        return bytes==sizeof(output) && output.Version==1 &&
               output.Value==42 ? 0 : 1;
    } catch(const std::exception& e) {
        std::cerr<<e.what()<<"\n";
        return 1;
    }
}
