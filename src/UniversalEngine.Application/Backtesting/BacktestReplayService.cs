using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Backtesting;

public sealed class BacktestReplayService(
    EodCandidateGenerationService eodCandidateGenerationService,
    IAnalysisMarketDataProvider marketDataProvider,
    IOptions<BacktestOptions> options)
{
    private readonly BacktestOptions _options = options.Value;

    public async Task<BacktestRunResult> RunAsync(
        DateOnly fromDate,
        DateOnly toDate,
        IReadOnlyList<Instrument> instruments,
        CancellationToken cancellationToken)
    {
        if (fromDate > toDate)
        {
            throw new ArgumentException("Backtest from-date must be on or before to-date.");
        }

        var sessionsEvaluated = 0;
        var trades = new List<BacktestTradeResult>();
        for (var sessionDate = fromDate; sessionDate <= toDate; sessionDate = sessionDate.AddDays(1))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var scan = await eodCandidateGenerationService.GenerateAsync(
                new EodCandidateGenerationRequest(instruments, sessionDate),
                cancellationToken);

            sessionsEvaluated++;
            if (scan.AcceptedCandidates.Count == 0)
            {
                continue;
            }

            var replayBars = await marketDataProvider.GetDailyBarsAsync(
                scan.AcceptedCandidates.Select(candidate => candidate.Instrument).DistinctBy(instrument => instrument.Key).ToArray(),
                sessionDate,
                sessionDate.AddDays(Math.Max(1, _options.MaxHoldingDays)),
                cancellationToken);

            foreach (var candidate in scan.AcceptedCandidates)
            {
                trades.Add(EvaluateCandidate(candidate, sessionDate, replayBars));
            }
        }

        var closedTrades = trades.Where(trade => trade.ReturnPercent is not null).ToArray();
        return new BacktestRunResult(
            fromDate,
            toDate,
            sessionsEvaluated,
            trades.Count,
            trades.Count(trade => trade.Outcome == BacktestTradeOutcome.Win),
            trades.Count(trade => trade.Outcome == BacktestTradeOutcome.Loss),
            trades.Count(trade => trade.Outcome == BacktestTradeOutcome.Flat),
            trades.Count(trade => trade.Outcome == BacktestTradeOutcome.NoExitData),
            closedTrades.Length == 0 ? 0m : Math.Round(closedTrades.Average(trade => trade.ReturnPercent!.Value), 4),
            trades);
    }

    private static BacktestTradeResult EvaluateCandidate(
        CandidateDecision candidate,
        DateOnly signalDate,
        IReadOnlyList<DailyBar> replayBars)
    {
        var bars = replayBars
            .Where(bar => bar.Instrument.Key == candidate.Instrument.Key)
            .OrderBy(bar => bar.Date)
            .ToArray();

        var entryBar = bars.LastOrDefault(bar => bar.Date == signalDate);
        var exitBar = bars.FirstOrDefault(bar => bar.Date > signalDate);
        if (entryBar is null || exitBar is null || candidate.Direction is null)
        {
            return new BacktestTradeResult(
                candidate.Instrument,
                candidate.Direction ?? CandidateDirection.Long,
                signalDate,
                null,
                entryBar?.Close ?? 0m,
                null,
                null,
                BacktestTradeOutcome.NoExitData,
                candidate.Score);
        }

        var returnPercent = candidate.Direction == CandidateDirection.Long
            ? (exitBar.Close - entryBar.Close) / entryBar.Close * 100m
            : (entryBar.Close - exitBar.Close) / entryBar.Close * 100m;

        var outcome = returnPercent switch
        {
            > 0 => BacktestTradeOutcome.Win,
            < 0 => BacktestTradeOutcome.Loss,
            _ => BacktestTradeOutcome.Flat
        };

        return new BacktestTradeResult(
            candidate.Instrument,
            candidate.Direction.Value,
            signalDate,
            exitBar.Date,
            entryBar.Close,
            exitBar.Close,
            Math.Round(returnPercent, 4),
            outcome,
            candidate.Score);
    }
}
