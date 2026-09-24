namespace UniversalEngine.Application.Backtesting;

public sealed record BacktestRunResult(
    DateOnly FromDate,
    DateOnly ToDate,
    int SessionsEvaluated,
    int Signals,
    int Wins,
    int Losses,
    int Flats,
    int NoExitData,
    decimal AverageReturnPercent,
    IReadOnlyList<BacktestTradeResult> Trades)
{
    public decimal WinRatePercent =>
        Wins + Losses == 0 ? 0m : Math.Round((decimal)Wins / (Wins + Losses) * 100m, 2);
}
