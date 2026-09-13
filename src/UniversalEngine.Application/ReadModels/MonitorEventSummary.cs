namespace UniversalEngine.Application.ReadModels;

public sealed record MonitorEventSummary(
    long Id,
    string RunId,
    string Symbol,
    string Exchange,
    string? Direction,
    decimal? EntryPrice,
    decimal? StopPrice,
    decimal? TargetPrice,
    decimal? LatestPrice,
    DateTimeOffset? LatestTimestampUtc,
    string Status,
    string Reason,
    DateTimeOffset CreatedAtUtc);
