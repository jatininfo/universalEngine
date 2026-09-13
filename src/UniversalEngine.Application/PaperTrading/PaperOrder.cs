using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.PaperTrading;

public sealed record PaperOrder(
    Instrument Instrument,
    SignalDirection Direction,
    DateOnly SessionDate,
    decimal EntryPrice,
    decimal StopPrice,
    decimal? TargetPrice,
    int Quantity,
    decimal NotionalAmount,
    decimal PlannedRiskAmount,
    PaperOrderStatus Status,
    string SourceStage,
    string SourceReason);
