using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed class OpeningRangeValidationService(
    IMarketDataProvider marketDataProvider,
    IOptions<OpeningRangeOptions> options)
{
    private readonly OpeningRangeOptions _options = options.Value;

    public async Task<OpeningRangeValidationResult> ValidateAsync(
        OpeningRangeValidationRequest request,
        CancellationToken cancellationToken)
    {
        var acceptedEodCandidates = request.EodCandidates
            .Where(candidate => candidate.IsAccepted && candidate.Direction is not null)
            .ToArray();

        var decisions = new List<CandidateDecision>();
        foreach (var candidate in acceptedEodCandidates)
        {
            decisions.Add(await ValidateCandidateAsync(candidate, request.SessionDate, cancellationToken));
        }

        return new OpeningRangeValidationResult(request.SessionDate, decisions);
    }

    private async Task<CandidateDecision> ValidateCandidateAsync(
        CandidateDecision candidate,
        DateOnly sessionDate,
        CancellationToken cancellationToken)
    {
        var marketOpen = _options.GetMarketOpenTime();
        var rangeEnd = marketOpen.AddMinutes(_options.RangeMinutes);
        var validationEnd = rangeEnd.AddMinutes((int)_options.Interval);
        var bars = await marketDataProvider.GetIntradayBarsAsync(
            candidate.Instrument,
            sessionDate,
            marketOpen,
            validationEnd,
            _options.Interval,
            cancellationToken);

        if (bars.Count == 0)
        {
            return Reject(candidate, DecisionReasonCode.MissingIntradayData, "No intraday bars were available for opening-range validation.");
        }

        var orderedBars = bars.OrderBy(bar => bar.Timestamp).ToArray();
        var rangeBars = orderedBars
            .Where(bar => TimeOnly.FromDateTime(bar.Timestamp.DateTime) < rangeEnd)
            .ToArray();
        var validationBars = orderedBars
            .Where(bar => TimeOnly.FromDateTime(bar.Timestamp.DateTime) >= rangeEnd)
            .ToArray();

        if (rangeBars.Length == 0 || validationBars.Length == 0)
        {
            return Reject(candidate, DecisionReasonCode.MissingIntradayData, "Opening-range or validation candles were incomplete.");
        }

        var latestBar = validationBars[^1];
        var now = DateTimeOffset.Now.ToOffset(latestBar.Timestamp.Offset);
        if (sessionDate == DateOnly.FromDateTime(now.DateTime) &&
            now - latestBar.Timestamp > TimeSpan.FromMinutes(_options.MaxIntradayDataAgeMinutes))
        {
            return Reject(candidate, DecisionReasonCode.StaleIntradayData, "Latest intraday bar is older than the configured freshness window.");
        }

        var openingRangeHigh = rangeBars.Max(bar => bar.High);
        var openingRangeLow = rangeBars.Min(bar => bar.Low);
        var buffer = candidate.Instrument.TickSize * _options.BreakoutBufferTicks;
        var close = latestBar.Close;

        if (candidate.Direction == CandidateDirection.Long && close >= openingRangeHigh + buffer)
        {
            return Accept(
                candidate,
                DecisionReasonCode.OpeningRangeBreakout,
                "Price confirmed above the opening range.",
                close,
                Math.Max(candidate.Instrument.TickSize, openingRangeLow - buffer));
        }

        if (candidate.Direction == CandidateDirection.Short && close <= openingRangeLow - buffer)
        {
            return Accept(
                candidate,
                DecisionReasonCode.OpeningRangeBreakdown,
                "Price confirmed below the opening range.",
                close,
                openingRangeHigh + buffer);
        }

        return Reject(candidate, DecisionReasonCode.OpeningRangeNotConfirmed, "Opening range did not confirm the EOD candidate direction.");
    }

    private static CandidateDecision Accept(
        CandidateDecision candidate,
        DecisionReasonCode code,
        string description,
        decimal entryPrice,
        decimal stopPrice) =>
        candidate with
        {
            Outcome = DecisionOutcome.Accepted,
            Reasons = [.. candidate.Reasons, new DecisionReason(code, description)],
            EntryPrice = entryPrice,
            StopPrice = stopPrice
        };

    private static CandidateDecision Reject(CandidateDecision candidate, DecisionReasonCode code, string description) =>
        candidate with
        {
            Outcome = DecisionOutcome.Rejected,
            Reasons = [.. candidate.Reasons, new DecisionReason(code, description)]
        };
}
