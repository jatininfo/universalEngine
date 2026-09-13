using UniversalEngine.Application.PaperTrading;
using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Application.Abstractions;

public interface IPaperTradingRepository
{
    Task SavePaperTradingRunAsync(
        PaperTradingRunResult result,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<PaperTradingRunSummary>> GetLatestPaperTradingRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<PaperOrderSummary>> GetPaperOrdersAsync(
        string runId,
        CancellationToken cancellationToken);
}
