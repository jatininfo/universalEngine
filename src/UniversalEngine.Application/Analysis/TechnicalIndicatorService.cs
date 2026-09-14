using UniversalEngine.Domain.Analysis;
using UniversalEngine.Domain.Market;

namespace UniversalEngine.Application.Analysis;

public sealed class TechnicalIndicatorService
{
    public TechnicalSnapshot Calculate(IReadOnlyList<DailyBar> orderedBars)
    {
        if (orderedBars.Count < 2)
        {
            throw new InvalidOperationException("At least two bars are required for technical analysis.");
        }

        var latest = orderedBars[^1];
        var previous = orderedBars[^2];
        var closes = orderedBars.Select(bar => bar.Close).ToArray();
        var support = CalculateSupport(orderedBars, 20);
        var resistance = CalculateResistance(orderedBars, 20);
        var fiftyTwoWeekHigh = CalculateResistance(orderedBars, 252);
        var fiftyTwoWeekLow = CalculateSupport(orderedBars, 252);
        var (macdLine, macdSignal, macdHistogram) = CalculateMacd(closes);

        return new TechnicalSnapshot(
            Rsi14: CalculateRsi(orderedBars, 14),
            Ema20: CalculateEma(closes, 20),
            Ema50: CalculateEma(closes, 50),
            Ema200: CalculateEma(closes, 200),
            Vwap: CalculateVwap(orderedBars),
            Atr14: CalculateAtr(orderedBars, 14),
            Adx14: CalculateAdx(orderedBars, 14),
            MacdLine: macdLine,
            MacdSignal: macdSignal,
            MacdHistogram: macdHistogram,
            VolumeRatio: CalculateVolumeRatio(orderedBars, 20),
            PriceChangePercent: previous.Close == 0 ? 0 : Math.Round(((latest.Close - previous.Close) / previous.Close) * 100m, 4),
            CloseLocation: CalculateCloseLocation(latest),
            SupportDistancePercent: CalculateDistancePercent(latest.Close, support),
            ResistanceDistancePercent: CalculateDistancePercent(latest.Close, resistance),
            FiftyTwoWeekHighDistancePercent: CalculateDistancePercent(latest.Close, fiftyTwoWeekHigh),
            FiftyTwoWeekLowDistancePercent: CalculateDistancePercent(latest.Close, fiftyTwoWeekLow));
    }

    private static decimal CalculateEma(IReadOnlyList<decimal> values, int period)
    {
        var effectivePeriod = Math.Min(period, values.Count);
        var multiplier = 2m / (effectivePeriod + 1);
        var ema = values.Take(effectivePeriod).Average();

        foreach (var value in values.Skip(effectivePeriod))
        {
            ema = ((value - ema) * multiplier) + ema;
        }

        return Math.Round(ema, 4);
    }

    private static decimal[] CalculateEmaSeries(IReadOnlyList<decimal> values, int period)
    {
        if (values.Count == 0)
        {
            return [];
        }

        var effectivePeriod = Math.Min(period, values.Count);
        var multiplier = 2m / (effectivePeriod + 1);
        var ema = values.Take(effectivePeriod).Average();
        var series = new decimal[values.Count];

        for (var index = 0; index < values.Count; index++)
        {
            if (index < effectivePeriod - 1)
            {
                series[index] = values.Take(index + 1).Average();
                continue;
            }

            if (index == effectivePeriod - 1)
            {
                series[index] = ema;
                continue;
            }

            ema = ((values[index] - ema) * multiplier) + ema;
            series[index] = ema;
        }

        return series;
    }

    private static decimal CalculateRsi(IReadOnlyList<DailyBar> bars, int period)
    {
        var changes = bars.Zip(bars.Skip(1), (previous, current) => current.Close - previous.Close).ToArray();
        var window = changes.TakeLast(Math.Min(period, changes.Length)).ToArray();
        var gains = window.Where(change => change > 0).DefaultIfEmpty(0).Average();
        var losses = Math.Abs(window.Where(change => change < 0).DefaultIfEmpty(0).Average());

        if (losses == 0)
        {
            return gains == 0 ? 50m : 100m;
        }

        var relativeStrength = gains / losses;
        return Math.Round(100m - (100m / (1m + relativeStrength)), 4);
    }

    private static decimal CalculateVwap(IReadOnlyList<DailyBar> bars)
    {
        var totalVolume = bars.Sum(bar => bar.Volume);
        if (totalVolume == 0)
        {
            return 0m;
        }

        var totalValue = bars.Sum(bar => ((bar.High + bar.Low + bar.Close) / 3m) * bar.Volume);
        return Math.Round(totalValue / totalVolume, 4);
    }

    private static decimal CalculateAtr(IReadOnlyList<DailyBar> bars, int period)
    {
        var trueRanges = bars.Skip(1)
            .Select((bar, index) =>
            {
                var previousClose = bars[index].Close;
                return Math.Max(bar.High - bar.Low, Math.Max(Math.Abs(bar.High - previousClose), Math.Abs(bar.Low - previousClose)));
            })
            .TakeLast(Math.Min(period, bars.Count - 1))
            .ToArray();

        return trueRanges.Length == 0 ? 0m : Math.Round(trueRanges.Average(), 4);
    }

    private static decimal CalculateAdx(IReadOnlyList<DailyBar> bars, int period)
    {
        if (bars.Count < 2)
        {
            return 0m;
        }

        var directionalIndexes = new List<decimal>();
        foreach (var (previous, current) in bars.Zip(bars.Skip(1)))
        {
            var trueRange = Math.Max(current.High - current.Low, Math.Max(Math.Abs(current.High - previous.Close), Math.Abs(current.Low - previous.Close)));
            if (trueRange <= 0)
            {
                directionalIndexes.Add(0m);
                continue;
            }

            var upwardMove = current.High - previous.High;
            var downwardMove = previous.Low - current.Low;
            var positiveDirectionalMovement = upwardMove > downwardMove && upwardMove > 0 ? upwardMove : 0m;
            var negativeDirectionalMovement = downwardMove > upwardMove && downwardMove > 0 ? downwardMove : 0m;
            var positiveDirectionalIndex = 100m * positiveDirectionalMovement / trueRange;
            var negativeDirectionalIndex = 100m * negativeDirectionalMovement / trueRange;
            var sum = positiveDirectionalIndex + negativeDirectionalIndex;
            directionalIndexes.Add(sum == 0 ? 0m : 100m * Math.Abs(positiveDirectionalIndex - negativeDirectionalIndex) / sum);
        }

        var window = directionalIndexes.TakeLast(Math.Min(period, directionalIndexes.Count)).ToArray();
        return window.Length == 0 ? 0m : Math.Round(window.Average(), 4);
    }

    private static decimal CalculateVolumeRatio(IReadOnlyList<DailyBar> bars, int period)
    {
        var latest = bars[^1];
        var history = bars.Take(bars.Count - 1).TakeLast(Math.Min(period, bars.Count - 1)).ToArray();
        var averageVolume = history.Length == 0 ? 0m : history.Average(bar => (decimal)bar.Volume);
        return averageVolume == 0 ? 0m : Math.Round(latest.Volume / averageVolume, 4);
    }

    private static decimal CalculateCloseLocation(DailyBar bar)
    {
        var range = bar.High - bar.Low;
        return range <= 0 ? 0.5m : Math.Round((bar.Close - bar.Low) / range, 4);
    }

    private static (decimal Line, decimal Signal, decimal Histogram) CalculateMacd(IReadOnlyList<decimal> closes)
    {
        var ema12 = CalculateEmaSeries(closes, 12);
        var ema26 = CalculateEmaSeries(closes, 26);
        var macdSeries = ema12.Zip(ema26, (fast, slow) => fast - slow).ToArray();
        var signalSeries = CalculateEmaSeries(macdSeries, 9);
        var line = macdSeries.Length == 0 ? 0m : macdSeries[^1];
        var signal = signalSeries.Length == 0 ? 0m : signalSeries[^1];
        return (Math.Round(line, 4), Math.Round(signal, 4), Math.Round(line - signal, 4));
    }

    private static decimal CalculateSupport(IReadOnlyList<DailyBar> bars, int period) =>
        bars.TakeLast(Math.Min(period, bars.Count)).Min(bar => bar.Low);

    private static decimal CalculateResistance(IReadOnlyList<DailyBar> bars, int period) =>
        bars.TakeLast(Math.Min(period, bars.Count)).Max(bar => bar.High);

    private static decimal CalculateDistancePercent(decimal close, decimal reference) =>
        reference == 0 ? 0m : Math.Round(((close - reference) / reference) * 100m, 4);
}
