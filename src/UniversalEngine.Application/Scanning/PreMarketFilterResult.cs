using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed record PreMarketFilterResult(
    DateOnly SessionDate,
    IReadOnlyList<CandidateDecision> Decisions)
{
    public IReadOnlyList<CandidateDecision> Accepted =>
        Decisions.Where(decision => decision.IsAccepted).ToArray();
}
