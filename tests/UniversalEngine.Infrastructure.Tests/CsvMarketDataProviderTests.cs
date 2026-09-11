using Microsoft.Extensions.Options;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;
using UniversalEngine.Infrastructure.MarketData;

namespace UniversalEngine.Infrastructure.Tests;

public sealed class CsvMarketDataProviderTests : IDisposable
{
    private readonly string _dataRoot = Path.Combine(Path.GetTempPath(), $"universal-engine-tests-{Guid.NewGuid():N}");

    [Fact]
    public async Task GetDailyBarsAsync_ReadsRequestedInstrumentRows()
    {
        var dailyDirectory = Path.Combine(_dataRoot, "daily");
        Directory.CreateDirectory(dailyDirectory);
        await File.WriteAllTextAsync(
            Path.Combine(dailyDirectory, "daily-bars.csv"),
            """
            exchange,symbol,isin,date,open,high,low,close,volume,dataTimestamp
            Nse,ABC,INE000000001,2026-09-10,100,120,99,119,3000000,2026-09-10T16:00:00+05:30
            Bse,XYZ,INE000000002,2026-09-10,50,51,49,50,1000,2026-09-10T16:00:00+05:30
            """);

        var provider = new CsvMarketDataProvider(Options.Create(new MarketDataOptions
        {
            CsvDataRoot = _dataRoot
        }));

        var bars = await provider.GetDailyBarsAsync(
            [new Instrument("ABC", Exchange.Nse)],
            new DateOnly(2026, 9, 10),
            new DateOnly(2026, 9, 10),
            CancellationToken.None);

        var bar = Assert.Single(bars);
        Assert.Equal("ABC", bar.Instrument.Symbol);
        Assert.Equal(Exchange.Nse, bar.Instrument.Exchange);
        Assert.Equal(119m, bar.Close);
        Assert.Equal(3_000_000, bar.Volume);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dataRoot))
        {
            Directory.Delete(_dataRoot, recursive: true);
        }
    }
}
