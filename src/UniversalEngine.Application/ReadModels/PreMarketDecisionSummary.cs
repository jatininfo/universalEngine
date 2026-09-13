namespace UniversalEngine.Application.ReadModels;

public sealed record PreMarketDecisionSummary(
    long Id,
    string RunId,
    string Symbol,
    string Exchange,
    string Outcome,
    string? Direction,
    decimal Score,
    string ReasonsJson,
    DateTimeOffset CreatedAtUtc);
