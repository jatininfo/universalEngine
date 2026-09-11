using Microsoft.Extensions.Options;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Infrastructure.MarketData;

namespace UniversalEngine.Infrastructure.Tests;

public sealed class ConfiguredMarketDataProviderTests
{
    [Fact]
    public async Task GetDailyBarsAsync_ReportsDhanAsSelectedPrimaryProviderUntilAdapterIsImplemented()
    {
        var provider = new ConfiguredMarketDataProvider(Options.Create(new MarketDataOptions
        {
            PrimaryProvider = MarketDataProviderKind.Dhan
        }));

        var exception = await Assert.ThrowsAsync<NotSupportedException>(() =>
            provider.GetDailyBarsAsync([], DateOnly.FromDateTime(DateTime.Today), DateOnly.FromDateTime(DateTime.Today), CancellationToken.None));

        Assert.Contains("Dhan", exception.Message);
    }
}
