using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Analysis;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed class EodCandidateGenerationService(
    IAnalysisMarketDataProvider marketDataProvider,
    TechnicalIndicatorService technicalIndicatorService,
    ScannerScoringService scannerScoringService,
    IOptions<EodScannerOptions> options)
{
    private readonly EodScannerOptions _options = options.Value;

    public async Task<EodCandidateGenerationResult> GenerateAsync(
        EodCandidateGenerationRequest request,
        CancellationToken cancellationToken)
    {
        var from = request.SessionDate.AddDays(-_options.LookbackDays * 2);
        var bars = await marketDataProvider.GetDailyBarsAsync(
            request.Instruments,
            from,
            request.SessionDate,
            cancellationToken);

        var barsByInstrument = bars
            .GroupBy(bar => bar.Instrument.Key)
            .ToDictionary(group => group.Key, group => group.OrderBy(bar => bar.Date).ToArray());

        var decisions = request.Instruments
            .Select(instrument => EvaluateInstrument(instrument, request.SessionDate, barsByInstrument))
            .ToArray();

        return new EodCandidateGenerationResult(request.SessionDate, ApplyShortlistLimit(decisions));
    }

    private CandidateDecision EvaluateInstrument(
        Instrument instrument,
        DateOnly sessionDate,
        IReadOnlyDictionary<string, DailyBar[]> barsByInstrument)
    {
        if (!barsByInstrument.TryGetValue(instrument.Key, out var bars) || bars.Length == 0)
        {
            return Reject(instrument, DecisionReasonCode.MissingDailyData, "No daily bars were available for the instrument.");
        }

        var latestBar = bars.LastOrDefault(bar => bar.Date <= sessionDate);
        if (latestBar is null)
        {
            return Reject(instrument, DecisionReasonCode.MissingDailyData, "No daily bar was available on or before the requested session date.");
        }

        if (latestBar.Date != sessionDate)
        {
            return Reject(instrument, DecisionReasonCode.MissingDailyData, "Latest daily bar does not match the requested session date.");
        }

        var now = DateTimeOffset.Now.ToOffset(latestBar.DataTimestamp.Offset);
        var sessionEnd = new DateTimeOffset(sessionDate.ToDateTime(TimeOnly.MaxValue), latestBar.DataTimestamp.Offset);
        if (sessionDate == DateOnly.FromDateTime(now.DateTime) &&
            sessionEnd - latestBar.DataTimestamp > TimeSpan.FromHours(_options.MaxDailyDataAgeHours))
        {
            return Reject(instrument, DecisionReasonCode.StaleDailyData, "Latest daily data is older than the configured freshness window.");
        }

        var history = bars
            .Where(bar => bar.Date < latestBar.Date)
            .OrderByDescending(bar => bar.Date)
            .Take(_options.LookbackDays)
            .OrderBy(bar => bar.Date)
            .ToArray();

        if (history.Length < _options.LookbackDays)
        {
            return Reject(instrument, DecisionReasonCode.InsufficientHistory, "Not enough prior daily bars were available for the configured lookback.");
        }

        var averageTradedValue = history.Average(bar => bar.Close * bar.Volume);
        if (averageTradedValue < _options.MinimumAverageTradedValue)
        {
            return Reject(instrument, DecisionReasonCode.InsufficientLiquidity, "Average traded value is below the configured liquidity threshold.");
        }

        var analysisBars = history.Append(latestBar).ToArray();
        var technicalSnapshot = technicalIndicatorService.Calculate(analysisBars);
        var volumeExpansionRatio = technicalSnapshot.VolumeRatio;
        if (volumeExpansionRatio < _options.MinimumVolumeExpansionRatio)
        {
            return Reject(instrument, DecisionReasonCode.InsufficientVolumeExpansion, "Latest volume did not expand enough versus the lookback average.");
        }

        var closeLocation = technicalSnapshot.CloseLocation;
        var reasons = new List<DecisionReason>
        {
            new(DecisionReasonCode.AverageTradedValuePassed, "Average traded value passed the configured liquidity threshold."),
            new(DecisionReasonCode.VolumeExpansion, "Latest volume expanded versus the lookback average.")
        };

        CandidateDirection? direction = null;
        if (closeLocation >= _options.NearHighCloseThreshold)
        {
            direction = CandidateDirection.Long;
            reasons.Add(new DecisionReason(DecisionReasonCode.CloseNearDayHigh, "Close was near the daily high."));
        }
        else if (closeLocation <= _options.NearLowCloseThreshold)
        {
            direction = CandidateDirection.Short;
            reasons.Add(new DecisionReason(DecisionReasonCode.CloseNearDayLow, "Close was near the daily low."));
        }

        if (direction is null)
        {
            return Reject(instrument, DecisionReasonCode.CloseLocationNotConfirmed, "Close location did not confirm a long or short directional bias.");
        }

        var scannerScore = scannerScoringService.Score(technicalSnapshot, direction.Value);
        if (scannerScore.Total < _options.MinimumAcceptedScore)
        {
            reasons.Add(new DecisionReason(
                DecisionReasonCode.ScannerScoreBelowThreshold,
                $"Scanner score {scannerScore.Total:0.##} is below the configured threshold {_options.MinimumAcceptedScore:0.##}."));
            return new CandidateDecision(instrument, DecisionOutcome.Rejected, direction, scannerScore.Total, reasons, scannerScore);
        }

        return new CandidateDecision(instrument, DecisionOutcome.Accepted, direction, scannerScore.Total, reasons, scannerScore);
    }

    private CandidateDecision[] ApplyShortlistLimit(IReadOnlyList<CandidateDecision> decisions)
    {
        if (_options.MaxAcceptedCandidates <= 0)
        {
            return decisions.ToArray();
        }

        var acceptedKeys = decisions
            .Where(decision => decision.IsAccepted)
            .OrderByDescending(decision => decision.Score)
            .ThenBy(decision => decision.Instrument.Key)
            .Take(_options.MaxAcceptedCandidates)
            .Select(decision => decision.Instrument.Key)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return decisions
            .Select(decision => decision.IsAccepted && !acceptedKeys.Contains(decision.Instrument.Key)
                ? decision with
                {
                    Outcome = DecisionOutcome.Rejected,
                    Reasons = decision.Reasons
                        .Append(new DecisionReason(
                            DecisionReasonCode.ScannerShortlistLimitExceeded,
                            $"Candidate passed filters but was outside the top {_options.MaxAcceptedCandidates} configured EOD scores."))
                        .ToArray()
                }
                : decision)
            .ToArray();
    }

    private static CandidateDecision Reject(
        Instrument instrument,
        DecisionReasonCode code,
        string description) =>
        new(
            instrument,
            DecisionOutcome.Rejected,
            null,
            0m,
            [new DecisionReason(code, description)]);
}
