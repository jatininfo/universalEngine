namespace UniversalEngine.Application.ReadModels;

public sealed record NotificationAttemptSummary(
    long Id,
    string IdempotencyKey,
    string Channel,
    string Subject,
    bool IsSuccess,
    string? ErrorMessage,
    DateTimeOffset AttemptedAtUtc);
