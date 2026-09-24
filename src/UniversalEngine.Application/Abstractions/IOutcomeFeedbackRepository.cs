using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Application.Abstractions;

public interface IOutcomeFeedbackRepository
{
    Task SaveOutcomeFeedbackAsync(
        DateOnly sessionDate,
        string symbol,
        string exchange,
        string direction,
        string source,
        string recommendation,
        string outcome,
        decimal? returnPercent,
        string notes,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<OutcomeFeedbackSummary>> GetLatestOutcomeFeedbackAsync(
        int limit,
        CancellationToken cancellationToken);
}
