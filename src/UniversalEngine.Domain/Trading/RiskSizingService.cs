namespace UniversalEngine.Domain.Trading;

public sealed class RiskSizingService
{
    public RiskSizingResult Size(TradePlanRequest request, RiskProfile profile)
    {
        if (profile.CapitalAmount <= 0)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.InvalidCapitalAmount,
                "Capital amount must be greater than zero.");
        }

        if (profile.MinPlannedRiskAmount < 0 || profile.MaxPlannedRiskAmount <= 0 || profile.MinPlannedRiskAmount > profile.MaxPlannedRiskAmount)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.InvalidRiskAmount,
                "Risk limits must be positive and the minimum risk cannot exceed the maximum risk.");
        }

        if (profile.MaxActiveSignals <= 0)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.InvalidMaxActiveSignals,
                "Maximum active signals must be greater than zero.");
        }

        if (request.EntryPrice <= 0)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.InvalidEntryPrice,
                "Entry price must be greater than zero.");
        }

        if (request.StopPrice <= 0)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.InvalidStopPrice,
                "Stop price must be greater than zero.");
        }

        var riskPerShare = Math.Abs(request.EntryPrice - request.StopPrice);
        if (riskPerShare <= 0)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.StopDistanceIsZero,
                "Entry and stop price cannot be the same.");
        }

        var quantity = (int)Math.Floor(profile.MaxPlannedRiskAmount / riskPerShare);
        if (quantity <= 0)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.QuantityIsZero,
                "Configured maximum risk cannot buy even one share at the requested stop distance.");
        }

        var notionalAmount = quantity * request.EntryPrice;
        if (notionalAmount > profile.CapitalAmount)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.NotionalExceedsCapital,
                "Risk-sized quantity exceeds configured capital.");
        }

        var plannedRiskAmount = quantity * riskPerShare;
        if (plannedRiskAmount > profile.MaxPlannedRiskAmount)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.PlannedRiskExceedsMaximum,
                "Planned risk exceeds configured maximum risk.");
        }

        if (!profile.AllowSmallRiskAlerts && plannedRiskAmount < profile.MinPlannedRiskAmount)
        {
            return RiskSizingResult.Rejected(
                RiskRejectionReason.PlannedRiskBelowMinimum,
                "Planned risk is below configured minimum risk.");
        }

        var tradePlan = new TradePlan(
            request.Instrument,
            request.Direction,
            request.EntryPrice,
            request.StopPrice,
            request.TargetPrice,
            quantity,
            notionalAmount,
            plannedRiskAmount);

        return RiskSizingResult.Approved(tradePlan);
    }
}
