using System.Globalization;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;

namespace UniversalEngine.Infrastructure.MarketData;

public sealed class CsvMarketDataProvider(IOptionsMonitor<MarketDataOptions> options) : IMarketDataProvider
{
    public async Task<IReadOnlyList<DailyBar>> GetDailyBarsAsync(
        IReadOnlyList<Instrument> instruments,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken)
    {
        var instrumentKeys = instruments.Select(instrument => instrument.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var dataRoot = options.CurrentValue.CsvDataRoot ?? "tests/fixtures/market-data";
        var path = Path.Combine(dataRoot, "daily", "daily-bars.csv");

        if (!File.Exists(path))
        {
            return [];
        }

        var lines = await File.ReadAllLinesAsync(path, cancellationToken);
        var bars = new List<DailyBar>();

        foreach (var line in lines.Skip(1).Where(row => !string.IsNullOrWhiteSpace(row)))
        {
            var columns = line.Split(',', StringSplitOptions.TrimEntries);
            if (columns.Length != 10)
            {
                throw new FormatException($"Daily bar row must contain 10 columns: '{line}'.");
            }

            var exchange = Enum.Parse<Exchange>(columns[0], ignoreCase: true);
            var instrument = new Instrument(columns[1], exchange, columns[2].Length == 0 ? null : columns[2]);
            if (!instrumentKeys.Contains(instrument.Key))
            {
                continue;
            }

            var date = DateOnly.Parse(columns[3], CultureInfo.InvariantCulture);
            if (date < from || date > to)
            {
                continue;
            }

            bars.Add(new DailyBar(
                instrument,
                date,
                ParseDecimal(columns[4]),
                ParseDecimal(columns[5]),
                ParseDecimal(columns[6]),
                ParseDecimal(columns[7]),
                long.Parse(columns[8], CultureInfo.InvariantCulture),
                DateTimeOffset.Parse(columns[9], CultureInfo.InvariantCulture)));
        }

        return bars;
    }

    public Task<IReadOnlyList<IntradayBar>> GetIntradayBarsAsync(
        Instrument instrument,
        DateOnly date,
        TimeOnly from,
        TimeOnly to,
        BarInterval interval,
        CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<IntradayBar>>([]);
    }

    private static decimal ParseDecimal(string value) =>
        decimal.Parse(value, NumberStyles.Number, CultureInfo.InvariantCulture);
}
