namespace UniversalEngine.Domain.Trading;

public sealed record RiskSizingResult(
    bool IsApproved,
    TradePlan? TradePlan,
    RiskRejectionReason RejectionReason,
    string Explanation)
{
    public static RiskSizingResult Approved(TradePlan tradePlan) =>
        new(true, tradePlan, RiskRejectionReason.None, "Trade plan passed configured risk checks.");

    public static RiskSizingResult Rejected(RiskRejectionReason reason, string explanation) =>
        new(false, null, reason, explanation);
}
