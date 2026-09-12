namespace UniversalEngine.Application.ReadModels;

public sealed record ScannerRunSummary(
    string Id,
    DateOnly SessionDate,
    DateTimeOffset StartedAtUtc,
    string MarketDataProvider,
    int AcceptedCount,
    int RejectedCount);
