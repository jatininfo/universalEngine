namespace UniversalEngine.Application.ReadModels;

public sealed record LiveValidationDecisionSummary(
    long Id,
    string RunId,
    string Symbol,
    string Exchange,
    string Outcome,
    string? Direction,
    decimal Score,
    decimal? EntryPrice,
    decimal? StopPrice,
    decimal? TargetPrice,
    int? Quantity,
    decimal? NotionalAmount,
    decimal? PlannedRiskAmount,
    string? RiskRejectionReason,
    string? RiskExplanation,
    string ReasonsJson,
    DateTimeOffset CreatedAtUtc);
