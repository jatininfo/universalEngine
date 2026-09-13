using UniversalEngine.Application.Backtesting;
using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Application.Abstractions;

public interface IBacktestReportRepository
{
    Task SaveBacktestRunAsync(
        BacktestRunResult result,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<BacktestRunSummary>> GetLatestBacktestRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<BacktestTradeSummary>> GetBacktestTradesAsync(
        string runId,
        CancellationToken cancellationToken);
}
