namespace UniversalEngine.Application.ReadModels;

public sealed record BacktestRunSummary(
    string Id,
    DateOnly FromDate,
    DateOnly ToDate,
    DateTimeOffset StartedAtUtc,
    int SessionsEvaluated,
    int Signals,
    int Wins,
    int Losses,
    int Flats,
    int NoExitData,
    decimal WinRatePercent,
    decimal AverageReturnPercent);
