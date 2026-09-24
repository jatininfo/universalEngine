using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed record LiveValidationRequest(
    DateOnly SessionDate,
    TimeOnly From,
    TimeOnly To,
    CandidateDecision Candidate);
