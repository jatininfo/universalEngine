namespace UniversalEngine.Application.Configuration;

public sealed class PreMarketOptions
{
    public const string SectionName = "PreMarket";

    public bool Enabled { get; set; }

    public bool EnableScheduledScan { get; set; }

    public string RunTimeLocal { get; set; } = "09:05";

    public decimal MaxAllowedGapPercent { get; set; } = 3m;

    public bool AllowWhenPreMarketDataUnavailable { get; set; } = true;

    public TimeOnly GetRunTime() => TimeOnly.Parse(RunTimeLocal);
}
