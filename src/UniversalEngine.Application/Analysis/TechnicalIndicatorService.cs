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

        return new TechnicalSnapshot(
            Rsi14: CalculateRsi(orderedBars, 14),
            Ema20: CalculateEma(orderedBars.Select(bar => bar.Close).ToArray(), 20),
            Ema50: CalculateEma(orderedBars.Select(bar => bar.Close).ToArray(), 50),
            Vwap: CalculateVwap(orderedBars),
            Atr14: CalculateAtr(orderedBars, 14),
            VolumeRatio: CalculateVolumeRatio(orderedBars, 20),
            PriceChangePercent: previous.Close == 0 ? 0 : Math.Round(((latest.Close - previous.Close) / previous.Close) * 100m, 4),
            CloseLocation: CalculateCloseLocation(latest));
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
}
