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

    public decimal MinimumAcceptedScore { get; set; } = 25m;

    public int MaxAcceptedCandidates { get; set; } = 15;

    public Dictionary<string, decimal> FactorWeights { get; set; } = new()
    {
        ["PriceMomentum"] = 1m,
        ["Volume"] = 1m,
        ["Vwap"] = 1m,
        ["EmaStructure"] = 1m,
        ["MacdMomentum"] = 1m,
        ["AdxTrendStrength"] = 1m,
        ["SupportResistance"] = 1m,
        ["FiftyTwoWeekPosition"] = 1m,
        ["BreakoutBreakdown"] = 1m,
        ["MarketRegime"] = 0m,
        ["OpenInterest"] = 0m,
        ["Delivery"] = 0m,
        ["NewsSentiment"] = 0m
    };
}
