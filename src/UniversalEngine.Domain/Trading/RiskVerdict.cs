using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Domain.Trading;

public sealed record RiskVerdict(
    FinalVerdict Verdict,
    string Reason,
    CandidateDecision Candidate);
