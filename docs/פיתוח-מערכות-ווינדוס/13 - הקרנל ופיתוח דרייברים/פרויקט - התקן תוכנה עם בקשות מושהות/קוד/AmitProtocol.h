#pragma once
// Include Windows.h + winioctl.h, or ntddk.h, before this header.
static const GUID GUID_DEVINTERFACE_AMIT_ECHO =
{0x72d0c7a1,0xe721,0x4c10,{0x91,0x7c,0x34,0x61,0x9d,0x4b,0x20,0x51}};
#define IOCTL_AMIT_NEXT CTL_CODE(0x8000,0x800,METHOD_BUFFERED,FILE_READ_DATA|FILE_WRITE_DATA)
struct AMIT_INPUT { ULONG Version; ULONG Value; };
struct AMIT_OUTPUT { ULONG Version; ULONG Value; };
static_assert(sizeof(AMIT_INPUT)==8 && sizeof(AMIT_OUTPUT)==8);
