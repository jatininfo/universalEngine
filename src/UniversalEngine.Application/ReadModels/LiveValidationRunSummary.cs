namespace UniversalEngine.Application.ReadModels;

public sealed record LiveValidationRunSummary(
    string Id,
    DateOnly SessionDate,
    DateTimeOffset StartedAtUtc,
    string WindowStart,
    string WindowEnd,
    int ConfirmedCount,
    int RejectedCount);
