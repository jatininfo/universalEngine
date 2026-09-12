using UniversalEngine.Domain.Market;

namespace UniversalEngine.Domain.Scanning;

public sealed record CandidateDecision(
    Instrument Instrument,
    DecisionOutcome Outcome,
    CandidateDirection? Direction,
    decimal Score,
    IReadOnlyList<DecisionReason> Reasons,
    ScannerScore? ScannerScore = null,
    decimal? EntryPrice = null,
    decimal? StopPrice = null,
    decimal? TargetPrice = null)
{
    public bool IsAccepted => Outcome == DecisionOutcome.Accepted;
}
