namespace UniversalEngine.Application.ReadModels;

public sealed record OpeningRangeRunSummary(
    string Id,
    DateOnly SessionDate,
    DateTimeOffset StartedAtUtc,
    int ConfirmedCount,
    int RejectedCount);
