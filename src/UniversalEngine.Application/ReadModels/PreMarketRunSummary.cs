namespace UniversalEngine.Application.ReadModels;

public sealed record PreMarketRunSummary(
    string Id,
    DateOnly SessionDate,
    DateTimeOffset StartedAtUtc,
    int AcceptedCount,
    int RejectedCount);
