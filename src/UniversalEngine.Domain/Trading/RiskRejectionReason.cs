namespace UniversalEngine.Domain.Trading;

public enum RiskRejectionReason
{
    None = 0,
    InvalidCapitalAmount,
    InvalidRiskAmount,
    InvalidMaxActiveSignals,
    InvalidEntryPrice,
    InvalidStopPrice,
    StopDistanceIsZero,
    QuantityIsZero,
    NotionalExceedsCapital,
    PlannedRiskBelowMinimum,
    PlannedRiskExceedsMaximum
}
