using UniversalEngine.Domain.Analysis;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed class ScannerScoringService
{
    public const string ModelVersion = "eod-score-v1";

    public ScannerScore Score(TechnicalSnapshot snapshot, CandidateDirection direction)
    {
        var factors = new Dictionary<string, decimal>
        {
            ["PriceMomentum"] = Clamp(snapshot.PriceChangePercent, 0, 15),
            ["Volume"] = Clamp(snapshot.VolumeRatio * 5m, 0, 15),
            ["Vwap"] = ScoreVwap(snapshot, direction),
            ["EmaStructure"] = ScoreEma(snapshot, direction),
            ["BreakoutBreakdown"] = ScoreCloseLocation(snapshot, direction),
            ["MarketRegime"] = 0m,
            ["OpenInterest"] = 0m,
            ["Delivery"] = 0m,
            ["NewsSentiment"] = 0m
        };

        return new ScannerScore(
            Total: Math.Round(factors.Values.Sum(), 4),
            Factors: factors,
            ModelVersion);
    }

    private static decimal ScoreVwap(TechnicalSnapshot snapshot, CandidateDirection direction) =>
        direction switch
        {
            CandidateDirection.Long when snapshot.Ema20 >= snapshot.Vwap => 10m,
            CandidateDirection.Short when snapshot.Ema20 <= snapshot.Vwap => 10m,
            _ => 0m
        };

    private static decimal ScoreEma(TechnicalSnapshot snapshot, CandidateDirection direction) =>
        direction switch
        {
            CandidateDirection.Long when snapshot.Ema20 >= snapshot.Ema50 => 10m,
            CandidateDirection.Short when snapshot.Ema20 <= snapshot.Ema50 => 10m,
            _ => 0m
        };

    private static decimal ScoreCloseLocation(TechnicalSnapshot snapshot, CandidateDirection direction) =>
        direction switch
        {
            CandidateDirection.Long => Clamp(snapshot.CloseLocation * 10m, 0, 10),
            CandidateDirection.Short => Clamp((1m - snapshot.CloseLocation) * 10m, 0, 10),
            _ => 0m
        };

    private static decimal Clamp(decimal value, decimal min, decimal max) =>
        Math.Min(max, Math.Max(min, value));
}
