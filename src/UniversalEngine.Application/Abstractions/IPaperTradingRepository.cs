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

    Task<IReadOnlyList<PaperOrderSummary>> GetOpenPaperOrdersAsync(
        DateOnly sessionDate,
        CancellationToken cancellationToken);

    Task UpdatePaperOrderAsync(
        long orderId,
        PaperOrderStatus status,
        DateOnly? exitDate,
        decimal? exitPrice,
        decimal? returnPercent,
        decimal? realizedPnl,
        string sourceReason,
        CancellationToken cancellationToken);
}
