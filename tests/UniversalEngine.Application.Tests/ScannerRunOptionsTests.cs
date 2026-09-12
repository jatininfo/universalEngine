using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;

namespace UniversalEngine.Application.Tests;

public sealed class ScannerRunOptionsTests
{
    [Fact]
    public void GetInstruments_MapsConfiguredSymbolsAndExchanges()
    {
        var options = new ScannerRunOptions
        {
            Instruments =
            [
                new InstrumentOptions { Symbol = "abc", Exchange = "Nse", Isin = "INE000000001" },
                new InstrumentOptions { Symbol = "mno", Exchange = "Bse" }
            ]
        };

        var instruments = options.GetInstruments();

        Assert.Collection(
            instruments,
            first =>
            {
                Assert.Equal("ABC", first.Symbol);
                Assert.Equal(Exchange.Nse, first.Exchange);
                Assert.Equal("INE000000001", first.Isin);
            },
            second =>
            {
                Assert.Equal("MNO", second.Symbol);
                Assert.Equal(Exchange.Bse, second.Exchange);
                Assert.Null(second.Isin);
            });
    }

    [Fact]
    public void GetEodSessionDate_UsesConfiguredDateWhenPresent()
    {
        var options = new ScannerRunOptions { EodSessionDate = "2026-09-10" };

        var sessionDate = options.GetEodSessionDate(new DateOnly(2026, 9, 12));

        Assert.Equal(new DateOnly(2026, 9, 10), sessionDate);
    }
}
