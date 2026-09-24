using UniversalEngine.Application.Analysis;
using UniversalEngine.Domain.Market;

namespace UniversalEngine.Application.Tests;

public sealed class TechnicalIndicatorServiceTests
{
    [Fact]
    public void Calculate_ReturnsAdvancedTrendAndRangeIndicators()
    {
        var instrument = new Instrument("ABC", Exchange.Nse);
        var start = new DateOnly(2026, 1, 1);
        var bars = Enumerable.Range(0, 60)
            .Select(index =>
            {
                var close = 100m + index;
                return new DailyBar(
                    instrument,
                    start.AddDays(index),
                    close - 1m,
                    close + 2m,
                    close - 2m,
                    close,
                    1_000_000 + index * 10_000,
                    new DateTimeOffset(start.AddDays(index).ToDateTime(new TimeOnly(16, 0)), TimeSpan.FromHours(5.5)));
            })
            .ToArray();

        var snapshot = new TechnicalIndicatorService().Calculate(bars);

        Assert.True(snapshot.Ema200 > 0);
        Assert.True(snapshot.Adx14 > 0);
        Assert.True(snapshot.MacdLine > snapshot.MacdSignal);
        Assert.True(snapshot.MacdHistogram > 0);
        Assert.True(snapshot.SupportDistancePercent > 0);
        Assert.True(snapshot.ResistanceDistancePercent < 0);
        Assert.True(snapshot.FiftyTwoWeekLowDistancePercent > 0);
        Assert.True(snapshot.FiftyTwoWeekHighDistancePercent < 0);
    }
}
