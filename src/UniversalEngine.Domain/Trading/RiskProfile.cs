namespace UniversalEngine.Domain.Trading;

public sealed record RiskProfile(
    decimal CapitalAmount,
    decimal MinPlannedRiskAmount,
    decimal MaxPlannedRiskAmount,
    int MaxActiveSignals,
    bool AllowSmallRiskAlerts = false)
{
    public static RiskProfile Default => new(
        CapitalAmount: 20000m,
        MinPlannedRiskAmount: 200m,
        MaxPlannedRiskAmount: 400m,
        MaxActiveSignals: 3);
}
