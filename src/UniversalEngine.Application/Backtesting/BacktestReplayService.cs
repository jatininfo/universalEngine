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

    private BacktestTradeResult EvaluateCandidate(
        CandidateDecision candidate,
        DateOnly signalDate,
        IReadOnlyList<DailyBar> replayBars)
    {
        var bars = replayBars
            .Where(bar => bar.Instrument.Key == candidate.Instrument.Key)
            .OrderBy(bar => bar.Date)
            .ToArray();

        var entryBar = bars.LastOrDefault(bar => bar.Date == signalDate);
        var exitBars = bars.Where(bar => bar.Date > signalDate).Take(Math.Max(1, _options.MaxHoldingDays)).ToArray();
        if (entryBar is null || exitBars.Length == 0 || candidate.Direction is null)
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

        if (_options.UseStopTargetSimulation)
        {
            var simulated = TryEvaluateStopTarget(candidate, entryBar, exitBars);
            if (simulated is not null)
            {
                return simulated;
            }
        }

        var exitBar = exitBars[^1];
        var entryPrice = candidate.EntryPrice ?? entryBar.Close;
        var returnPercent = candidate.Direction == CandidateDirection.Long
            ? (exitBar.Close - entryPrice) / entryPrice * 100m
            : (entryPrice - exitBar.Close) / entryPrice * 100m;

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
            entryPrice,
            exitBar.Close,
            Math.Round(returnPercent, 4),
            outcome,
            candidate.Score);
    }

    private BacktestTradeResult? TryEvaluateStopTarget(
        CandidateDecision candidate,
        DailyBar entryBar,
        IReadOnlyList<DailyBar> exitBars)
    {
        if (candidate.Direction is null)
        {
            return null;
        }

        var entryPrice = candidate.EntryPrice ?? entryBar.Close;
        var (stopPrice, targetPrice) = GetStopTarget(candidate, entryBar, entryPrice);
        if (entryPrice <= 0 || stopPrice <= 0 || targetPrice <= 0 || stopPrice == entryPrice)
        {
            return null;
        }

        foreach (var bar in exitBars)
        {
            var stopTouched = candidate.Direction == CandidateDirection.Long
                ? bar.Low <= stopPrice
                : bar.High >= stopPrice;
            var targetTouched = candidate.Direction == CandidateDirection.Long
                ? bar.High >= targetPrice
                : bar.Low <= targetPrice;

            if (!stopTouched && !targetTouched)
            {
                continue;
            }

            var exitPrice = stopTouched && targetTouched && _options.AssumeStopBeforeTargetWhenBothTouched
                ? stopPrice
                : targetTouched ? targetPrice : stopPrice;
            var returnPercent = candidate.Direction == CandidateDirection.Long
                ? (exitPrice - entryPrice) / entryPrice * 100m
                : (entryPrice - exitPrice) / entryPrice * 100m;

            return new BacktestTradeResult(
                candidate.Instrument,
                candidate.Direction.Value,
                entryBar.Date,
                bar.Date,
                entryPrice,
                exitPrice,
                Math.Round(returnPercent, 4),
                returnPercent > 0 ? BacktestTradeOutcome.Win : returnPercent < 0 ? BacktestTradeOutcome.Loss : BacktestTradeOutcome.Flat,
                candidate.Score);
        }

        return null;
    }

    private (decimal StopPrice, decimal TargetPrice) GetStopTarget(
        CandidateDecision candidate,
        DailyBar entryBar,
        decimal entryPrice)
    {
        if (candidate.StopPrice is not null && candidate.TargetPrice is not null)
        {
            return (candidate.StopPrice.Value, candidate.TargetPrice.Value);
        }

        if (candidate.Direction == CandidateDirection.Long)
        {
            var stop = candidate.StopPrice ?? entryBar.Low;
            var risk = Math.Max(0m, entryPrice - stop);
            return (stop, candidate.TargetPrice ?? entryPrice + (risk * _options.TargetRiskRewardRatio));
        }

        var shortStop = candidate.StopPrice ?? entryBar.High;
        var shortRisk = Math.Max(0m, shortStop - entryPrice);
        return (shortStop, candidate.TargetPrice ?? entryPrice - (shortRisk * _options.TargetRiskRewardRatio));
    }
}
