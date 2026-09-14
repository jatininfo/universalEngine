namespace UniversalEngine.Domain.Analysis;

public sealed record TechnicalSnapshot(
    decimal Rsi14,
    decimal Ema20,
    decimal Ema50,
    decimal Ema200,
    decimal Vwap,
    decimal Atr14,
    decimal Adx14,
    decimal MacdLine,
    decimal MacdSignal,
    decimal MacdHistogram,
    decimal VolumeRatio,
    decimal PriceChangePercent,
    decimal CloseLocation,
    decimal SupportDistancePercent,
    decimal ResistanceDistancePercent,
    decimal FiftyTwoWeekHighDistancePercent,
    decimal FiftyTwoWeekLowDistancePercent);
