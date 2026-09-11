using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed record EodCandidateGenerationResult(
    DateOnly SessionDate,
    IReadOnlyList<CandidateDecision> Decisions)
{
    public IReadOnlyList<CandidateDecision> AcceptedCandidates =>
        Decisions.Where(decision => decision.IsAccepted)
            .OrderByDescending(decision => decision.Score)
            .ToArray();

    public IReadOnlyList<CandidateDecision> RejectedCandidates =>
        Decisions.Where(decision => !decision.IsAccepted).ToArray();
}
