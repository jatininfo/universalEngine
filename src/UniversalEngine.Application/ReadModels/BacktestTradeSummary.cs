namespace UniversalEngine.Application.ReadModels;

public sealed record BacktestTradeSummary(
    long Id,
    string RunId,
    DateOnly SignalDate,
    DateOnly? ExitDate,
    string Symbol,
    string Exchange,
    string Direction,
    decimal EntryPrice,
    decimal? ExitPrice,
    decimal? ReturnPercent,
    string Outcome,
    decimal Score);
