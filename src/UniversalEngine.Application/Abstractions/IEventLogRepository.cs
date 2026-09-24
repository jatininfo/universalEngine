using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Application.Abstractions;

public interface IEventLogRepository
{
    Task SaveEventAsync(
        string eventType,
        string subject,
        string payloadJson,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<EventLogEntrySummary>> GetLatestEventsAsync(
        int limit,
        CancellationToken cancellationToken);
}
