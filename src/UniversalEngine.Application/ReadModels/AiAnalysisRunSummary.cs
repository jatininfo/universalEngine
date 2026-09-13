namespace UniversalEngine.Application.ReadModels;

public sealed record AiAnalysisRunSummary(
    string Id,
    DateOnly SessionDate,
    DateTimeOffset StartedAtUtc,
    int DecisionCount,
    int TradeCandidateCount,
    int WatchlistCount,
    int NoTradeCount);
