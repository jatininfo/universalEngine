using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Ai;

public sealed record AiAnalysisDecision(
    CandidateDecision Candidate,
    AiTradeRecommendation Recommendation,
    decimal ProbabilityPercent,
    string Confidence,
    string Rationale,
    string PromptVersion,
    string ResponseJson);
