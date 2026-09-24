namespace UniversalEngine.Domain.Trading;

public enum SignalMonitorStatus
{
    StillActive = 0,
    TargetReached = 1,
    StopBreached = 2,
    Expired = 3,
    NoData = 4
}
