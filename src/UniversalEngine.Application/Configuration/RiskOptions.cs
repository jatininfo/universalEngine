using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.Configuration;

public sealed class RiskOptions
{
    public const string SectionName = "Risk";

    public decimal CapitalAmount { get; set; } = 20000m;

    public decimal MinPlannedRiskAmount { get; set; } = 200m;

    public decimal MaxPlannedRiskAmount { get; set; } = 400m;

    public int MaxActiveSignals { get; set; } = 3;

    public bool AllowSmallRiskAlerts { get; set; }

    public RiskProfile ToRiskProfile() => new(
        CapitalAmount,
        MinPlannedRiskAmount,
        MaxPlannedRiskAmount,
        MaxActiveSignals,
        AllowSmallRiskAlerts);
}
