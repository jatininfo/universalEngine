using UniversalEngine.Application.Scanning;
using UniversalEngine.Application.ReadModels;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.Abstractions;

public interface IScannerRepository
{
    Task SaveEodRunAsync(
        EodCandidateGenerationResult result,
        IReadOnlyList<RiskVerdict> verdicts,
        string marketDataProvider,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ScannerRunSummary>> GetLatestRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CandidateDecisionSummary>> GetCandidatesAsync(
        string runId,
        CancellationToken cancellationToken);
}
