namespace UniversalEngine.Application.ReadModels;

public sealed record PaperTradingRunSummary(
    string Id,
    DateOnly SessionDate,
    DateTimeOffset StartedAtUtc,
    int OrderCount,
    int OpenCount,
    int ClosedCount);
