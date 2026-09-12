namespace UniversalEngine.Application.Abstractions;

using UniversalEngine.Application.ReadModels;

public interface INotificationHistoryRepository
{
    Task<bool> HasSuccessfulNotificationAsync(
        string idempotencyKey,
        CancellationToken cancellationToken);

    Task SaveNotificationAttemptAsync(
        NotificationAttempt attempt,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<NotificationAttemptSummary>> GetLatestNotificationAttemptsAsync(
        int limit,
        CancellationToken cancellationToken);
}

public sealed record NotificationAttempt(
    string IdempotencyKey,
    string Channel,
    string Subject,
    string Body,
    bool IsSuccess,
    string? ErrorMessage,
    DateTimeOffset AttemptedAtUtc);
