namespace UniversalEngine.Application.ReadModels;

public sealed record CandidateDecisionSummary(
    long Id,
    string RunId,
    string Symbol,
    string Exchange,
    string Outcome,
    string? Direction,
    decimal Score,
    string? ScoreModelVersion,
    string? ScoreFactorsJson,
    string ReasonsJson,
    string? FinalVerdict,
    string? VerdictReason,
    DateTimeOffset CreatedAtUtc);
