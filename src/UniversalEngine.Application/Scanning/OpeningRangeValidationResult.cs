using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed record OpeningRangeValidationResult(
    DateOnly SessionDate,
    IReadOnlyList<CandidateDecision> Decisions)
{
    public IReadOnlyList<CandidateDecision> Confirmed =>
        Decisions.Where(decision => decision.IsAccepted).ToArray();
}
