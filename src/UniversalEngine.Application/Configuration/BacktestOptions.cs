namespace UniversalEngine.Application.Configuration;

public sealed class BacktestOptions
{
    public const string SectionName = "Backtest";

    public string FromDate { get; set; } = "";

    public string ToDate { get; set; } = "";

    public int MaxHoldingDays { get; set; } = 1;

    public bool UseStopTargetSimulation { get; set; } = true;

    public decimal TargetRiskRewardRatio { get; set; } = 2m;

    public bool AssumeStopBeforeTargetWhenBothTouched { get; set; } = true;

    public DateOnly? GetFromDate() =>
        string.IsNullOrWhiteSpace(FromDate) ? null : DateOnly.Parse(FromDate);

    public DateOnly? GetToDate() =>
        string.IsNullOrWhiteSpace(ToDate) ? null : DateOnly.Parse(ToDate);
}
