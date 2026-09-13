using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed class PreMarketFilterService(
    IMarketDataProvider marketDataProvider,
    IOptions<PreMarketOptions> options)
{
    private readonly PreMarketOptions _options = options.Value;

    public async Task<PreMarketFilterResult> FilterAsync(
        PreMarketFilterRequest request,
        CancellationToken cancellationToken)
    {
        var candidates = request.EodCandidates
            .Where(candidate => candidate.IsAccepted && candidate.Direction is not null)
            .ToArray();

        if (candidates.Length == 0)
        {
            return new PreMarketFilterResult(request.SessionDate, []);
        }

        var instruments = candidates.Select(candidate => candidate.Instrument).ToArray();
        var bars = await marketDataProvider.GetDailyBarsAsync(
            instruments,
            request.SessionDate.AddDays(-7),
            request.SessionDate,
            cancellationToken);

        var barsByInstrument = bars
            .GroupBy(bar => bar.Instrument.Key)
            .ToDictionary(group => group.Key, group => group.OrderBy(bar => bar.Date).ToArray());

        var decisions = candidates
            .Select(candidate => EvaluateCandidate(candidate, request.SessionDate, barsByInstrument))
            .ToArray();

        return new PreMarketFilterResult(request.SessionDate, decisions);
    }

    private CandidateDecision EvaluateCandidate(
        CandidateDecision candidate,
        DateOnly sessionDate,
        IReadOnlyDictionary<string, DailyBar[]> barsByInstrument)
    {
        if (!barsByInstrument.TryGetValue(candidate.Instrument.Key, out var bars))
        {
            return HandleMissingData(candidate);
        }

        var currentBar = bars.LastOrDefault(bar => bar.Date == sessionDate);
        var previousBar = bars.LastOrDefault(bar => bar.Date < sessionDate);
        if (currentBar is null || previousBar is null || previousBar.Close <= 0)
        {
            return HandleMissingData(candidate);
        }

        var gapPercent = ((currentBar.Open - previousBar.Close) / previousBar.Close) * 100m;
        if (Math.Abs(gapPercent) > _options.MaxAllowedGapPercent)
        {
            return candidate with
            {
                Outcome = DecisionOutcome.Rejected,
                Reasons =
                [
                    .. candidate.Reasons,
                    new DecisionReason(
                        DecisionReasonCode.PreMarketGapTooLarge,
                        $"Opening gap {gapPercent:0.##}% exceeded configured threshold {_options.MaxAllowedGapPercent:0.##}%.")
                ]
            };
        }

        return candidate with
        {
            Reasons =
            [
                .. candidate.Reasons,
                new DecisionReason(
                    DecisionReasonCode.PreMarketAccepted,
                    $"Opening gap {gapPercent:0.##}% is within configured threshold.")
            ]
        };
    }

    private CandidateDecision HandleMissingData(CandidateDecision candidate)
    {
        if (_options.AllowWhenPreMarketDataUnavailable)
        {
            return candidate with
            {
                Reasons =
                [
                    .. candidate.Reasons,
                    new DecisionReason(
                        DecisionReasonCode.PreMarketDataUnavailable,
                        "Pre-market/open data was unavailable; candidate was allowed by fallback configuration.")
                ]
            };
        }

        return candidate with
        {
            Outcome = DecisionOutcome.Rejected,
            Reasons =
            [
                .. candidate.Reasons,
                new DecisionReason(
                    DecisionReasonCode.PreMarketDataUnavailable,
                    "Pre-market/open data was unavailable; candidate was rejected by fallback configuration.")
            ]
        };
    }
}
