using UniversalEngine.Domain.Market;

namespace UniversalEngine.Application.Abstractions;

public interface IMarketDataProvider
{
    Task<IReadOnlyList<DailyBar>> GetDailyBarsAsync(
        IReadOnlyList<Instrument> instruments,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<IntradayBar>> GetIntradayBarsAsync(
        Instrument instrument,
        DateOnly date,
        TimeOnly from,
        TimeOnly to,
        BarInterval interval,
        CancellationToken cancellationToken);
}
