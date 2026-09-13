using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Backtesting;

public sealed record BacktestTradeResult(
    Instrument Instrument,
    CandidateDirection Direction,
    DateOnly SignalDate,
    DateOnly? ExitDate,
    decimal EntryPrice,
    decimal? ExitPrice,
    decimal? ReturnPercent,
    BacktestTradeOutcome Outcome,
    decimal Score);
