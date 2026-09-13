namespace UniversalEngine.Application.ReadModels;

public sealed record EventLogEntrySummary(
    long Id,
    string EventType,
    string Subject,
    string PayloadJson,
    DateTimeOffset CreatedAtUtc);
