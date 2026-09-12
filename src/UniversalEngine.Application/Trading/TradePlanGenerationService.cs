using Microsoft.Extensions.Options;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Scanning;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.Trading;

public sealed class TradePlanGenerationService(
    IOptions<RiskOptions> riskOptions,
    IOptions<OpeningRangeOptions> openingRangeOptions)
{
    private readonly RiskProfile _riskProfile = riskOptions.Value.ToRiskProfile();
    private readonly OpeningRangeOptions _openingRangeOptions = openingRangeOptions.Value;
    private readonly RiskSizingService _riskSizingService = new();

    public RiskSizingResult CreateFromOpeningRangeCandidate(CandidateDecision candidate)
    {
        if (!candidate.IsAccepted || candidate.Direction is null)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.InvalidEntryPrice,
                "Only accepted opening-range candidates can produce trade plans.");
        }

        if (candidate.EntryPrice is null || candidate.StopPrice is null)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.InvalidEntryPrice,
                "Opening-range candidate is missing entry or stop levels.");
        }

        var entryPrice = candidate.EntryPrice.Value;
        var stopPrice = candidate.StopPrice.Value;
        var targetPrice = EstimateTarget(candidate, entryPrice, stopPrice);
        var direction = candidate.Direction == CandidateDirection.Long ? SignalDirection.Long : SignalDirection.Short;

        return _riskSizingService.Size(
            new TradePlanRequest(candidate.Instrument, direction, entryPrice, stopPrice, targetPrice),
            _riskProfile);
    }

    private decimal EstimateTarget(CandidateDecision candidate, decimal entryPrice, decimal stopPrice)
    {
        var riskDistance = Math.Abs(entryPrice - stopPrice);
        return candidate.Direction == CandidateDirection.Long
            ? entryPrice + (riskDistance * _openingRangeOptions.TargetRiskRewardRatio)
            : Math.Max(candidate.Instrument.TickSize, entryPrice - (riskDistance * _openingRangeOptions.TargetRiskRewardRatio));
    }
}
