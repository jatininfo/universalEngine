using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed record PreMarketFilterRequest(
    DateOnly SessionDate,
    IReadOnlyList<CandidateDecision> EodCandidates);
