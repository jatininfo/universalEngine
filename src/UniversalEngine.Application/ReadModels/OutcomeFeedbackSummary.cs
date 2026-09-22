namespace UniversalEngine.Application.ReadModels;

public sealed record OutcomeFeedbackSummary(
    long Id,
    DateOnly SessionDate,
    string Symbol,
    string Exchange,
    string Direction,
    string Source,
    string Recommendation,
    string Outcome,
    decimal? ReturnPercent,
    string Notes,
    DateTimeOffset CreatedAtUtc);
