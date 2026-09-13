namespace UniversalEngine.Application.ReadModels;

public sealed record AiAnalysisDecisionSummary(
    long Id,
    string RunId,
    string Symbol,
    string Exchange,
    string Direction,
    decimal Score,
    string Recommendation,
    decimal ProbabilityPercent,
    string Confidence,
    string Rationale,
    string PromptVersion,
    string ResponseJson,
    DateTimeOffset CreatedAtUtc);
