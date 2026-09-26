using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;

namespace UniversalEngine.Infrastructure.MarketData;

public sealed class RuntimeMarketDataProvider(
    IOptionsMonitor<MarketDataOptions> options,
    CsvMarketDataProvider csvProvider,
    DhanMarketDataProvider dhanProvider,
    ConfiguredMarketDataProvider configuredProvider) : IMarketDataProvider
{
    public Task<IReadOnlyList<DailyBar>> GetDailyBarsAsync(
        IReadOnlyList<Instrument> instruments,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken) =>
        ResolveProvider().GetDailyBarsAsync(instruments, from, to, cancellationToken);

    public Task<IReadOnlyList<IntradayBar>> GetIntradayBarsAsync(
        Instrument instrument,
        DateOnly date,
        TimeOnly from,
        TimeOnly to,
        BarInterval interval,
        CancellationToken cancellationToken) =>
        ResolveProvider().GetIntradayBarsAsync(instrument, date, from, to, interval, cancellationToken);

    private IMarketDataProvider ResolveProvider() =>
        options.CurrentValue.PrimaryProvider switch
        {
            MarketDataProviderKind.Csv => csvProvider,
            MarketDataProviderKind.Dhan => dhanProvider,
            _ => configuredProvider
        };
}
