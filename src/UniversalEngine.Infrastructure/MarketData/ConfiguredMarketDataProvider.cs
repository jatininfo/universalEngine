using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;

namespace UniversalEngine.Infrastructure.MarketData;

public sealed class ConfiguredMarketDataProvider(IOptions<MarketDataOptions> options) : IMarketDataProvider
{
    private readonly MarketDataOptions _options = options.Value;

    public Task<IReadOnlyList<DailyBar>> GetDailyBarsAsync(
        IReadOnlyList<Instrument> instruments,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken)
    {
        throw new NotSupportedException(CreateNotConfiguredMessage());
    }

    public Task<IReadOnlyList<IntradayBar>> GetIntradayBarsAsync(
        Instrument instrument,
        DateOnly date,
        TimeOnly from,
        TimeOnly to,
        BarInterval interval,
        CancellationToken cancellationToken)
    {
        throw new NotSupportedException(CreateNotConfiguredMessage());
    }

    private string CreateNotConfiguredMessage() =>
        $"Market data provider '{_options.PrimaryProvider}' is selected but no live adapter is configured yet. " +
        "MVP implementation should add Dhan first, with Zerodha and Groww behind the same interface.";
}
