namespace UniversalEngine.Application.Configuration;

public sealed class EodScannerOptions
{
    public const string SectionName = "EodScanner";

    public int LookbackDays { get; set; } = 20;

    public decimal MinimumAverageTradedValue { get; set; } = 1_000_000m;

    public decimal MinimumVolumeExpansionRatio { get; set; } = 1.5m;

    public decimal NearHighCloseThreshold { get; set; } = 0.8m;

    public decimal NearLowCloseThreshold { get; set; } = 0.2m;

    public int MaxDailyDataAgeHours { get; set; } = 36;
}
