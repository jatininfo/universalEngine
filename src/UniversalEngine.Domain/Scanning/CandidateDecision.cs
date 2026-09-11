using UniversalEngine.Domain.Market;

namespace UniversalEngine.Domain.Scanning;

public sealed record CandidateDecision(
    Instrument Instrument,
    DecisionOutcome Outcome,
    CandidateDirection? Direction,
    decimal Score,
    IReadOnlyList<DecisionReason> Reasons)
{
    public bool IsAccepted => Outcome == DecisionOutcome.Accepted;
}
