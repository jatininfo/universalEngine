namespace UniversalEngine.Application.ReadModels;

public sealed record PaperOrderSummary(
    long Id,
    string RunId,
    DateOnly SessionDate,
    string Symbol,
    string Exchange,
    string Direction,
    decimal EntryPrice,
    decimal StopPrice,
    decimal? TargetPrice,
    int Quantity,
    decimal NotionalAmount,
    decimal PlannedRiskAmount,
    string Status,
    string SourceStage,
    string SourceReason,
    DateOnly? ExitDate,
    decimal? ExitPrice,
    decimal? ReturnPercent,
    decimal? RealizedPnl,
    DateTimeOffset CreatedAtUtc);
