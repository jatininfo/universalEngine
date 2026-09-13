namespace UniversalEngine.Application.PaperTrading;

public sealed record PaperTradingRunResult(
    DateOnly SessionDate,
    IReadOnlyList<PaperOrder> Orders);
