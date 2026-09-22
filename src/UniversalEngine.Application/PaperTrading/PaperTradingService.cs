using UniversalEngine.Application.Trading;
using UniversalEngine.Application.ReadModels;
using UniversalEngine.Domain.Market;
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

    public PaperOrderLifecycleUpdate Evaluate(
        PaperOrderSummary order,
        IReadOnlyList<IntradayBar> bars)
    {
        if (!Enum.TryParse<SignalDirection>(order.Direction, out var direction))
        {
            return PaperOrderLifecycleUpdate.NoChange(order.Id);
        }

        foreach (var bar in bars.OrderBy(bar => bar.Timestamp))
        {
            var stopTouched = direction == SignalDirection.Long
                ? bar.Low <= order.StopPrice
                : bar.High >= order.StopPrice;
            var targetTouched = order.TargetPrice is not null && (direction == SignalDirection.Long
                ? bar.High >= order.TargetPrice
                : bar.Low <= order.TargetPrice);

            if (!stopTouched && !targetTouched)
            {
                continue;
            }

            var exitPrice = targetTouched ? order.TargetPrice!.Value : order.StopPrice;
            var returnPercent = direction == SignalDirection.Long
                ? (exitPrice - order.EntryPrice) / order.EntryPrice * 100m
                : (order.EntryPrice - exitPrice) / order.EntryPrice * 100m;
            var pnl = direction == SignalDirection.Long
                ? (exitPrice - order.EntryPrice) * order.Quantity
                : (order.EntryPrice - exitPrice) * order.Quantity;
            var status = targetTouched ? PaperOrderStatus.TargetReached : PaperOrderStatus.StopBreached;

            return new PaperOrderLifecycleUpdate(
                order.Id,
                status,
                DateOnly.FromDateTime(bar.Timestamp.DateTime),
                exitPrice,
                Math.Round(returnPercent, 4),
                Math.Round(pnl, 2),
                targetTouched
                    ? $"Paper target reached at {exitPrice:0.##}."
                    : $"Paper stop breached at {exitPrice:0.##}.");
        }

        return PaperOrderLifecycleUpdate.NoChange(order.Id);
    }
}
