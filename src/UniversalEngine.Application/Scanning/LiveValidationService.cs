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

        var latestBar = bars.OrderBy(bar => bar.Timestamp).Last();
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
        var confirmed = candidate.Direction switch
        {
            CandidateDirection.Long => latestBar.Close >= entry + buffer,
            CandidateDirection.Short => latestBar.Close <= entry - buffer,
            _ => false
        };

        if (!confirmed)
        {
            return new LiveValidationResult(
                request.SessionDate,
                Reject(candidate, $"Latest close {latestBar.Close:0.##} did not confirm entry {entry:0.##}."));
        }

        return new LiveValidationResult(
            request.SessionDate,
            candidate with
            {
                Reasons =
                [
                    .. candidate.Reasons,
                    new DecisionReason(DecisionReasonCode.LiveValidationConfirmed, "Latest intraday candle confirmed the configured entry.")
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
