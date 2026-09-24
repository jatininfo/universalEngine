using UniversalEngine.Application.Ai;
using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Application.Abstractions;

public interface IAiAnalysisRepository
{
    Task SaveAiAnalysisRunAsync(
        AiAnalysisRunResult result,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AiAnalysisRunSummary>> GetLatestAiAnalysisRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AiAnalysisDecisionSummary>> GetAiAnalysisDecisionsAsync(
        string runId,
        CancellationToken cancellationToken);
}
