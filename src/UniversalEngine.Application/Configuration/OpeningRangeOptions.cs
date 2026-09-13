using UniversalEngine.Domain.Market;

namespace UniversalEngine.Application.Configuration;

public sealed class OpeningRangeOptions
{
    public const string SectionName = "OpeningRange";

    public bool Enabled { get; set; }

    public bool EnableScheduledScan { get; set; }

    public int RangeMinutes { get; set; } = 15;

    public BarInterval Interval { get; set; } = BarInterval.FiveMinutes;

    public string MarketOpenTime { get; set; } = "09:15";

    public int BreakoutBufferTicks { get; set; } = 1;

    public decimal TargetRiskRewardRatio { get; set; } = 2m;

    public int MaxIntradayDataAgeMinutes { get; set; } = 10;

    public TimeOnly GetMarketOpenTime() => TimeOnly.Parse(MarketOpenTime);
}
