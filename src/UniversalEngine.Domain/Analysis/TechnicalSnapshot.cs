namespace UniversalEngine.Domain.Analysis;

public sealed record TechnicalSnapshot(
    decimal Rsi14,
    decimal Ema20,
    decimal Ema50,
    decimal Vwap,
    decimal Atr14,
    decimal VolumeRatio,
    decimal PriceChangePercent,
    decimal CloseLocation);
