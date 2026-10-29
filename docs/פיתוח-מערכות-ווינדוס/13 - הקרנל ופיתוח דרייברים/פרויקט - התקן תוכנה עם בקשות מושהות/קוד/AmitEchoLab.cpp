#include <ntddk.h>
#include <wdf.h>
#include "AmitProtocol.h"

struct DEVICE_CONTEXT {
    WDFQUEUE PendingQueue;
    WDFTIMER Timer;
    BOOLEAN Online;
};
WDF_DECLARE_CONTEXT_TYPE_WITH_NAME(DEVICE_CONTEXT, AmitGetDeviceContext)
struct REQUEST_CONTEXT { ULONG Value; };
WDF_DECLARE_CONTEXT_TYPE_WITH_NAME(REQUEST_CONTEXT, AmitGetRequestContext)

extern "C" DRIVER_INITIALIZE DriverEntry;
EVT_WDF_DRIVER_DEVICE_ADD AmitEvtDeviceAdd;
EVT_WDF_IO_QUEUE_IO_DEVICE_CONTROL AmitEvtIoDeviceControl;
EVT_WDF_IO_QUEUE_IO_CANCELED_ON_QUEUE AmitEvtCanceled;
EVT_WDF_TIMER AmitEvtTimer;
EVT_WDF_FILE_CLEANUP AmitEvtFileCleanup;
EVT_WDF_DEVICE_D0_ENTRY AmitEvtD0Entry;
EVT_WDF_DEVICE_D0_EXIT AmitEvtD0Exit;
EVT_WDF_DEVICE_SURPRISE_REMOVAL AmitEvtSurpriseRemoval;

extern "C" NTSTATUS DriverEntry(PDRIVER_OBJECT driver, PUNICODE_STRING path) {
    WDF_DRIVER_CONFIG config;
    WDF_DRIVER_CONFIG_INIT(&config, AmitEvtDeviceAdd);
    return WdfDriverCreate(driver,path,WDF_NO_OBJECT_ATTRIBUTES,
                           &config,WDF_NO_HANDLE);
}

NTSTATUS AmitEvtDeviceAdd(WDFDRIVER driver, PWDFDEVICE_INIT init) {
    UNREFERENCED_PARAMETER(driver);
    PAGED_CODE();
    WdfDeviceInitSetDeviceType(init,0x8000);
    WDF_PNPPOWER_EVENT_CALLBACKS power;
    WDF_PNPPOWER_EVENT_CALLBACKS_INIT(&power);
    power.EvtDeviceD0Entry=AmitEvtD0Entry;
    power.EvtDeviceD0Exit=AmitEvtD0Exit;
    power.EvtDeviceSurpriseRemoval=AmitEvtSurpriseRemoval;
    WdfDeviceInitSetPnpPowerEventCallbacks(init,&power);

    WDF_FILEOBJECT_CONFIG files;
    WDF_FILEOBJECT_CONFIG_INIT(&files,WDF_NO_EVENT_CALLBACK,
                              WDF_NO_EVENT_CALLBACK,AmitEvtFileCleanup);
    WDF_OBJECT_ATTRIBUTES fileAttributes;
    WDF_OBJECT_ATTRIBUTES_INIT(&fileAttributes);
    fileAttributes.SynchronizationScope=WdfSynchronizationScopeNone;
    fileAttributes.ExecutionLevel=WdfExecutionLevelPassive;
    WdfDeviceInitSetFileObjectConfig(init,&files,&fileAttributes);
    WDF_OBJECT_ATTRIBUTES requestAttributes;
    WDF_OBJECT_ATTRIBUTES_INIT_CONTEXT_TYPE(&requestAttributes,REQUEST_CONTEXT);
    WdfDeviceInitSetRequestAttributes(init,&requestAttributes);

    WDF_OBJECT_ATTRIBUTES attributes;
    WDF_OBJECT_ATTRIBUTES_INIT_CONTEXT_TYPE(&attributes,DEVICE_CONTEXT);
    attributes.ExecutionLevel=WdfExecutionLevelDispatch;
    attributes.SynchronizationScope=WdfSynchronizationScopeDevice;
    WDFDEVICE device;
    NTSTATUS status=WdfDeviceCreate(&init,&attributes,&device);
    if(!NT_SUCCESS(status)) return status;
    auto* ctx=AmitGetDeviceContext(device);

    WDF_IO_QUEUE_CONFIG queue;
    WDF_IO_QUEUE_CONFIG_INIT(&queue,WdfIoQueueDispatchManual);
    queue.PowerManaged=WdfFalse;
    queue.EvtIoCanceledOnQueue=AmitEvtCanceled;
    status=WdfIoQueueCreate(device,&queue,WDF_NO_OBJECT_ATTRIBUTES,
                           &ctx->PendingQueue);
    if(!NT_SUCCESS(status)) return status;

    WDF_TIMER_CONFIG timer;
    WDF_TIMER_CONFIG_INIT(&timer,AmitEvtTimer);
    timer.AutomaticSerialization=TRUE;
    WDF_OBJECT_ATTRIBUTES timerAttributes;
    WDF_OBJECT_ATTRIBUTES_INIT(&timerAttributes);
    timerAttributes.ParentObject=device;
    status=WdfTimerCreate(&timer,&timerAttributes,&ctx->Timer);
    if(!NT_SUCCESS(status)) return status;

    WDF_IO_QUEUE_CONFIG_INIT_DEFAULT_QUEUE(&queue,WdfIoQueueDispatchParallel);
    queue.PowerManaged=WdfTrue;
    queue.EvtIoDeviceControl=AmitEvtIoDeviceControl;
    status=WdfIoQueueCreate(device,&queue,WDF_NO_OBJECT_ATTRIBUTES,WDF_NO_HANDLE);
    if(!NT_SUCCESS(status)) return status;
    return WdfDeviceCreateDeviceInterface(device,
                         &GUID_DEVINTERFACE_AMIT_ECHO,nullptr);
}

void AmitEvtIoDeviceControl(WDFQUEUE queue,WDFREQUEST request,
                           size_t outLength,size_t inLength,ULONG code) {
    WDFDEVICE device=WdfIoQueueGetDevice(queue);
    auto* ctx=AmitGetDeviceContext(device);
    if(!ctx->Online) {
        WdfRequestComplete(request,STATUS_DEVICE_NOT_READY); return;
    }
    if(code!=IOCTL_AMIT_NEXT) {
        WdfRequestComplete(request,STATUS_INVALID_DEVICE_REQUEST); return;
    }
    if(inLength!=sizeof(AMIT_INPUT) || outLength!=sizeof(AMIT_OUTPUT)) {
        WdfRequestComplete(request,STATUS_INVALID_BUFFER_SIZE); return;
    }
    AMIT_INPUT* input=nullptr;
    NTSTATUS status=WdfRequestRetrieveInputBuffer(request,sizeof(*input),
                                      reinterpret_cast<PVOID*>(&input),nullptr);
    if(!NT_SUCCESS(status)) { WdfRequestComplete(request,status); return; }
    const AMIT_INPUT captured=*input;
    if(captured.Version!=1 || captured.Value==MAXULONG) {
        WdfRequestComplete(request,STATUS_INVALID_PARAMETER); return;
    }
    ULONG queued=0,owned=0;
    WdfIoQueueGetState(ctx->PendingQueue,&queued,&owned);
    if(queued>=4) {
        WdfRequestComplete(request,STATUS_DEVICE_BUSY); return;
    }
    AmitGetRequestContext(request)->Value=captured.Value;
    status=WdfRequestForwardToIoQueue(request,ctx->PendingQueue);
    if(!NT_SUCCESS(status)) { WdfRequestComplete(request,status); return; }
    // No access to request after successful forwarding.
    if(queued==0) WdfTimerStart(ctx->Timer,WDF_REL_TIMEOUT_IN_MS(100));
}

void AmitEvtTimer(WDFTIMER timer) {
    WDFDEVICE device=reinterpret_cast<WDFDEVICE>(WdfTimerGetParentObject(timer));
    auto* ctx=AmitGetDeviceContext(device);
    if(!ctx->Online) return;
    WDFREQUEST request;
    NTSTATUS status=WdfIoQueueRetrieveNextRequest(ctx->PendingQueue,&request);
    if(NT_SUCCESS(status)) {
        AMIT_OUTPUT* output=nullptr;
        status=WdfRequestRetrieveOutputBuffer(request,sizeof(*output),
                                  reinterpret_cast<PVOID*>(&output),nullptr);
        if(NT_SUCCESS(status)) {
            const ULONG value=AmitGetRequestContext(request)->Value;
            output->Version=1;
            output->Value=value+1;
            WdfRequestCompleteWithInformation(request,STATUS_SUCCESS,
                                              sizeof(*output));
        } else {
            WdfRequestComplete(request,status);
        }
    } else if(status!=STATUS_NO_MORE_ENTRIES) {
        KdPrintEx((DPFLTR_IHVDRIVER_ID,DPFLTR_ERROR_LEVEL,
                   "AmitEchoLab: retrieve failed %08lx\n",status));
    }
    ULONG queued=0,owned=0;
    WdfIoQueueGetState(ctx->PendingQueue,&queued,&owned);
    if(queued!=0) WdfTimerStart(timer,WDF_REL_TIMEOUT_IN_MS(100));
}

void AmitEvtCanceled(WDFQUEUE queue,WDFREQUEST request) {
    UNREFERENCED_PARAMETER(queue);
    WdfRequestComplete(request,STATUS_CANCELLED);
}

void AmitEvtFileCleanup(WDFFILEOBJECT file) {
    PAGED_CODE();
    WDFDEVICE device=WdfFileObjectGetDevice(file);
    auto* ctx=AmitGetDeviceContext(device);
    WDFREQUEST request;
    WdfObjectAcquireLock(device);
    while(NT_SUCCESS(WdfIoQueueRetrieveRequestByFileObject(
                           ctx->PendingQueue,file,&request))) {
        WdfRequestComplete(request,STATUS_CANCELLED);
    }
    WdfObjectReleaseLock(device);
}

NTSTATUS AmitEvtD0Entry(WDFDEVICE device,WDF_POWER_DEVICE_STATE previous) {
    UNREFERENCED_PARAMETER(previous);
    PAGED_CODE();
    auto* ctx=AmitGetDeviceContext(device);
    WdfIoQueueStart(ctx->PendingQueue);
    WdfObjectAcquireLock(device);
    ctx->Online=TRUE;
    WdfObjectReleaseLock(device);
    return STATUS_SUCCESS;
}

NTSTATUS AmitEvtD0Exit(WDFDEVICE device,WDF_POWER_DEVICE_STATE target) {
    UNREFERENCED_PARAMETER(target);
    PAGED_CODE();
    auto* ctx=AmitGetDeviceContext(device);
    WdfObjectAcquireLock(device);
    ctx->Online=FALSE;
    WdfObjectReleaseLock(device);
    WdfTimerStop(ctx->Timer,TRUE);
    WdfIoQueuePurgeSynchronously(ctx->PendingQueue);
    return STATUS_SUCCESS;
}

void AmitEvtSurpriseRemoval(WDFDEVICE device) {
    PAGED_CODE();
    auto* ctx=AmitGetDeviceContext(device);
    WdfObjectAcquireLock(device);
    ctx->Online=FALSE;
    WdfObjectReleaseLock(device);
}
