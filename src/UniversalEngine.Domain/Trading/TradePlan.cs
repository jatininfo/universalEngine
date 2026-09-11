using UniversalEngine.Domain.Market;

namespace UniversalEngine.Domain.Trading;

public sealed record TradePlan(
    Instrument Instrument,
    SignalDirection Direction,
    decimal EntryPrice,
    decimal StopPrice,
    decimal? TargetPrice,
    int Quantity,
    decimal NotionalAmount,
    decimal PlannedRiskAmount)
{
    public decimal RiskPerShare => Math.Abs(EntryPrice - StopPrice);
}
