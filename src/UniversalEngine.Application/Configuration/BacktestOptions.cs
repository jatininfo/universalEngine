namespace UniversalEngine.Application.Configuration;

public sealed class BacktestOptions
{
    public const string SectionName = "Backtest";

    public string FromDate { get; set; } = "";

    public string ToDate { get; set; } = "";

    public int MaxHoldingDays { get; set; } = 1;

    public DateOnly? GetFromDate() =>
        string.IsNullOrWhiteSpace(FromDate) ? null : DateOnly.Parse(FromDate);

    public DateOnly? GetToDate() =>
        string.IsNullOrWhiteSpace(ToDate) ? null : DateOnly.Parse(ToDate);
}
