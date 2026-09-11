using UniversalEngine.Domain.Market;

namespace UniversalEngine.Domain.Trading;

public sealed record TradePlanRequest(
    Instrument Instrument,
    SignalDirection Direction,
    decimal EntryPrice,
    decimal StopPrice,
    decimal? TargetPrice = null);
