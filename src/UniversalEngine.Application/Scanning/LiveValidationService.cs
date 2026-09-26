using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed class LiveValidationService(
    IMarketDataProvider marketDataProvider,
    IOptions<LiveValidationOptions> options)
{
    private readonly LiveValidationOptions _options = options.Value;

    public async Task<LiveValidationResult> ValidateAsync(
        LiveValidationRequest request,
        CancellationToken cancellationToken)
    {
        var candidate = request.Candidate;
        if (!candidate.IsAccepted || candidate.Direction is null)
        {
            return new LiveValidationResult(
                request.SessionDate,
                Reject(candidate, "Only accepted directional candidates can be live-validated."));
        }

        if (candidate.EntryPrice is null || candidate.StopPrice is null)
        {
            return new LiveValidationResult(
                request.SessionDate,
                Reject(candidate, "Candidate must include entry and stop prices before live validation."));
        }

        var bars = await marketDataProvider.GetIntradayBarsAsync(
            candidate.Instrument,
            request.SessionDate,
            request.From,
            request.To,
            _options.Interval,
            cancellationToken);

        if (bars.Count == 0)
        {
            return new LiveValidationResult(
                request.SessionDate,
                Reject(candidate, "No intraday bars were available for live validation.", DecisionReasonCode.MissingIntradayData));
        }

        var orderedBars = bars.OrderBy(bar => bar.Timestamp).ToArray();
        var latestBar = orderedBars[^1];
        var now = DateTimeOffset.Now.ToOffset(latestBar.Timestamp.Offset);
        if (request.SessionDate == DateOnly.FromDateTime(now.DateTime) &&
            now - latestBar.Timestamp > TimeSpan.FromMinutes(_options.MaxIntradayDataAgeMinutes))
        {
            return new LiveValidationResult(
                request.SessionDate,
                Reject(candidate, "Latest intraday bar is older than the configured freshness window.", DecisionReasonCode.StaleIntradayData));
        }

        var buffer = candidate.Instrument.TickSize * _options.ConfirmationBufferTicks;
        var entry = candidate.EntryPrice.Value;
        var triggerPrice = candidate.Direction switch
        {
            CandidateDirection.Long => entry + buffer,
            CandidateDirection.Short => entry - buffer,
            _ => entry
        };
        var confirmingBar = candidate.Direction switch
        {
            CandidateDirection.Long => orderedBars.FirstOrDefault(bar => bar.High >= triggerPrice),
            CandidateDirection.Short => orderedBars.FirstOrDefault(bar => bar.Low <= triggerPrice),
            _ => null
        };

        if (confirmingBar is null)
        {
            var bestPrice = candidate.Direction == CandidateDirection.Long
                ? orderedBars.Max(bar => bar.High)
                : orderedBars.Min(bar => bar.Low);
            return new LiveValidationResult(
                request.SessionDate,
                Reject(candidate, $"No candle in the validation window traded through entry {entry:0.##}. Best price was {bestPrice:0.##}."));
        }

        return new LiveValidationResult(
            request.SessionDate,
            candidate with
            {
                Reasons =
                [
                    .. candidate.Reasons,
                    new DecisionReason(DecisionReasonCode.LiveValidationConfirmed, $"Intraday candle at {confirmingBar.Timestamp:HH:mm} traded through the configured entry.")
                ]
            });
    }

    private static CandidateDecision Reject(
        CandidateDecision candidate,
        string description,
        DecisionReasonCode code = DecisionReasonCode.LiveValidationNotConfirmed) =>
        candidate with
        {
            Outcome = DecisionOutcome.Rejected,
            Reasons = [.. candidate.Reasons, new DecisionReason(code, description)]
        };
}
