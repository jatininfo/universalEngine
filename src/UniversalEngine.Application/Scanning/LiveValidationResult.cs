using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed record LiveValidationResult(
    DateOnly SessionDate,
    CandidateDecision Decision);
