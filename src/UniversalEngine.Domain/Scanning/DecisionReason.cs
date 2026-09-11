namespace UniversalEngine.Domain.Scanning;

public sealed record DecisionReason(
    DecisionReasonCode Code,
    string Description);
