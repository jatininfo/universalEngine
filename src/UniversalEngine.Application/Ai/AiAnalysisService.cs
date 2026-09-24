using System.Text.Json;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Ai;

public sealed class AiAnalysisService(IOptions<AiAnalysisOptions> options)
{
    private readonly AiAnalysisOptions _options = options.Value;

    public AiAnalysisRunResult Analyze(
        DateOnly sessionDate,
        IReadOnlyList<CandidateDecision> candidates)
    {
        var decisions = candidates
            .Where(candidate => candidate.IsAccepted)
            .Select(AnalyzeCandidate)
            .ToArray();

        return new AiAnalysisRunResult(sessionDate, decisions);
    }

    private AiAnalysisDecision AnalyzeCandidate(CandidateDecision candidate)
    {
        var probability = Math.Clamp(Math.Round(candidate.Score, 2), 1m, 95m);
        var recommendation = probability >= _options.MinimumTradeProbability
            ? AiTradeRecommendation.TradeCandidate
            : AiTradeRecommendation.Watchlist;
        var confidence = probability switch
        {
            >= 75m => "High",
            >= 55m => "Medium",
            _ => "Low"
        };
        var rationale = _options.Enabled
            ? "Structured AI adapter placeholder returned a validated local estimate."
            : "AI provider is disabled; local validated estimate recorded for audit continuity.";
        var response = new
        {
            recommendation = recommendation.ToString(),
            probabilityPercent = probability,
            confidence,
            rationale,
            promptVersion = _options.PromptVersion,
            provider = _options.Provider
        };

        return new AiAnalysisDecision(
            candidate,
            recommendation,
            probability,
            confidence,
            rationale,
            _options.PromptVersion,
            JsonSerializer.Serialize(response));
    }
}
