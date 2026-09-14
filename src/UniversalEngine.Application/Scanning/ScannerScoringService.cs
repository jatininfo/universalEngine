using Microsoft.Extensions.Options;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Analysis;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Scanning;

public sealed class ScannerScoringService(IOptions<EodScannerOptions> options)
{
    public const string ModelVersion = "eod-score-v2";
    private readonly EodScannerOptions _options = options.Value;

    public ScannerScore Score(TechnicalSnapshot snapshot, CandidateDirection direction)
    {
        var baseFactors = new Dictionary<string, decimal>
        {
            ["PriceMomentum"] = Clamp(snapshot.PriceChangePercent, 0, 15),
            ["Volume"] = Clamp(snapshot.VolumeRatio * 5m, 0, 15),
            ["Vwap"] = ScoreVwap(snapshot, direction),
            ["EmaStructure"] = ScoreEma(snapshot, direction),
            ["MacdMomentum"] = ScoreMacd(snapshot, direction),
            ["AdxTrendStrength"] = Clamp(snapshot.Adx14 / 5m, 0, 10),
            ["SupportResistance"] = ScoreSupportResistance(snapshot, direction),
            ["FiftyTwoWeekPosition"] = ScoreFiftyTwoWeekPosition(snapshot, direction),
            ["BreakoutBreakdown"] = ScoreCloseLocation(snapshot, direction),
            ["MarketRegime"] = 0m,
            ["OpenInterest"] = 0m,
            ["Delivery"] = 0m,
            ["NewsSentiment"] = 0m
        };
        var factors = baseFactors.ToDictionary(
            item => item.Key,
            item => Math.Round(item.Value * GetWeight(item.Key), 4));

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
            CandidateDirection.Long when snapshot.Ema20 >= snapshot.Ema50 && snapshot.Ema50 >= snapshot.Ema200 => 12m,
            CandidateDirection.Long when snapshot.Ema20 >= snapshot.Ema50 => 10m,
            CandidateDirection.Short when snapshot.Ema20 <= snapshot.Ema50 && snapshot.Ema50 <= snapshot.Ema200 => 12m,
            CandidateDirection.Short when snapshot.Ema20 <= snapshot.Ema50 => 10m,
            _ => 0m
        };

    private static decimal ScoreMacd(TechnicalSnapshot snapshot, CandidateDirection direction) =>
        direction switch
        {
            CandidateDirection.Long when snapshot.MacdLine > snapshot.MacdSignal && snapshot.MacdHistogram > 0 => 10m,
            CandidateDirection.Long when snapshot.MacdHistogram > 0 => 6m,
            CandidateDirection.Short when snapshot.MacdLine < snapshot.MacdSignal && snapshot.MacdHistogram < 0 => 10m,
            CandidateDirection.Short when snapshot.MacdHistogram < 0 => 6m,
            _ => 0m
        };

    private static decimal ScoreSupportResistance(TechnicalSnapshot snapshot, CandidateDirection direction) =>
        direction switch
        {
            CandidateDirection.Long when snapshot.ResistanceDistancePercent >= -1.5m => 10m,
            CandidateDirection.Long when snapshot.SupportDistancePercent >= 0m => Clamp(snapshot.SupportDistancePercent / 2m, 0, 6),
            CandidateDirection.Short when snapshot.SupportDistancePercent <= 1.5m => 10m,
            CandidateDirection.Short when snapshot.ResistanceDistancePercent <= 0m => Clamp(Math.Abs(snapshot.ResistanceDistancePercent) / 2m, 0, 6),
            _ => 0m
        };

    private static decimal ScoreFiftyTwoWeekPosition(TechnicalSnapshot snapshot, CandidateDirection direction) =>
        direction switch
        {
            CandidateDirection.Long when snapshot.FiftyTwoWeekHighDistancePercent >= -5m => 8m,
            CandidateDirection.Long => Clamp(snapshot.FiftyTwoWeekLowDistancePercent / 10m, 0, 5),
            CandidateDirection.Short when snapshot.FiftyTwoWeekLowDistancePercent <= 5m => 8m,
            CandidateDirection.Short => Clamp(Math.Abs(snapshot.FiftyTwoWeekHighDistancePercent) / 10m, 0, 5),
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

    private decimal GetWeight(string factor) =>
        _options.FactorWeights.TryGetValue(factor, out var weight) ? Math.Max(0m, weight) : 1m;
}
