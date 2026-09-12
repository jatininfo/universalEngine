using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed record OpeningRangeValidationRequest(
    DateOnly SessionDate,
    IReadOnlyList<CandidateDecision> EodCandidates);
