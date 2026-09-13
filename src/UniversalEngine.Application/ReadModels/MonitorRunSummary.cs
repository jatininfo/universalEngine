namespace UniversalEngine.Application.ReadModels;

public sealed record MonitorRunSummary(
    string Id,
    DateOnly SessionDate,
    DateTimeOffset StartedAtUtc,
    string WindowStart,
    string WindowEnd,
    int EventCount,
    int ActionableCount);
