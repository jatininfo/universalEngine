using UniversalEngine.Domain.Scanning;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.Scanning;

public sealed record SignalMonitoringResult(
    CandidateDecision Candidate,
    SignalMonitorStatus Status,
    decimal? LatestPrice,
    DateTimeOffset? LatestTimestamp,
    string Reason);
