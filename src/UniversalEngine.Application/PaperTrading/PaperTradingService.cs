using UniversalEngine.Application.Trading;
using UniversalEngine.Domain.Scanning;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.PaperTrading;

public sealed class PaperTradingService(TradePlanGenerationService tradePlanGenerationService)
{
    public PaperTradingRunResult CreateOrders(
        DateOnly sessionDate,
        IReadOnlyList<CandidateDecision> candidates,
        string sourceStage)
    {
        var orders = new List<PaperOrder>();
        foreach (var candidate in candidates.Where(candidate => candidate.IsAccepted))
        {
            var risk = tradePlanGenerationService.CreateFromOpeningRangeCandidate(candidate);
            if (risk.TradePlan is null)
            {
                continue;
            }

            orders.Add(ToPaperOrder(sessionDate, risk.TradePlan, sourceStage));
        }

        return new PaperTradingRunResult(sessionDate, orders);
    }

    private static PaperOrder ToPaperOrder(
        DateOnly sessionDate,
        TradePlan tradePlan,
        string sourceStage) =>
        new(
            tradePlan.Instrument,
            tradePlan.Direction,
            sessionDate,
            tradePlan.EntryPrice,
            tradePlan.StopPrice,
            tradePlan.TargetPrice,
            tradePlan.Quantity,
            tradePlan.NotionalAmount,
            tradePlan.PlannedRiskAmount,
            PaperOrderStatus.Open,
            sourceStage,
            "Simulated paper order only. No broker order was placed.");
}
