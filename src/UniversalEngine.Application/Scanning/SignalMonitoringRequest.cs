using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed record SignalMonitoringRequest(
    DateOnly SessionDate,
    TimeOnly From,
    TimeOnly To,
    IReadOnlyList<CandidateDecision> Candidates);
