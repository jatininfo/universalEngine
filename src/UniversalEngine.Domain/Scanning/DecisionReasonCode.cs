namespace UniversalEngine.Domain.Scanning;

public enum DecisionReasonCode
{
    AverageTradedValuePassed = 1,
    VolumeExpansion = 2,
    CloseNearDayHigh = 3,
    CloseNearDayLow = 4,
    MissingDailyData = 100,
    StaleDailyData = 101,
    InsufficientHistory = 102,
    InsufficientLiquidity = 103,
    InsufficientVolumeExpansion = 104,
    CloseLocationNotConfirmed = 105
}
