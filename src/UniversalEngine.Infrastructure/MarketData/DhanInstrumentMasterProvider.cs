using System.Globalization;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Infrastructure.MarketData;

public sealed class DhanInstrumentMasterProvider(
    HttpClient httpClient,
    IOptions<MarketDataOptions> options) : IInstrumentMasterProvider
{
    private readonly MarketDataOptions _options = options.Value;

    public async Task<IReadOnlyList<InstrumentLookupResult>> SearchAsync(
        string symbol,
        string? exchange,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(symbol))
        {
            return [];
        }

        var bytes = await httpClient.GetByteArrayAsync(_options.DhanInstrumentMasterUrl, cancellationToken);
        var csv = System.Text.Encoding.UTF8.GetString(bytes);
        var rows = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Skip(1);

        var normalizedSymbol = symbol.Trim().ToUpperInvariant();
        var normalizedExchange = exchange?.Trim().ToUpperInvariant();
        var results = new List<InstrumentLookupResult>();

        foreach (var row in rows)
        {
            var columns = row.Split(',', StringSplitOptions.TrimEntries);
            if (columns.Length < 16)
            {
                continue;
            }

            var rowExchange = columns[0].ToUpperInvariant();
            var rowSegment = columns[1].ToUpperInvariant();
            var rowSymbol = columns[6].ToUpperInvariant();
            var rowInstrument = columns[4].ToUpperInvariant();

            if (normalizedExchange is not null && rowExchange != normalizedExchange)
            {
                continue;
            }

            if (rowSegment != "E" || rowInstrument != "EQUITY")
            {
                continue;
            }

            if (rowSymbol != normalizedSymbol && !rowSymbol.Contains(normalizedSymbol, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            results.Add(new InstrumentLookupResult(
                rowExchange,
                rowSegment,
                columns[2],
                columns[3],
                columns[6],
                columns[7],
                columns[8],
                columns[4],
                columns[9],
                columns[10],
                decimal.TryParse(columns[15], NumberStyles.Number, CultureInfo.InvariantCulture, out var tickSize) ? tickSize : 0.05m));
        }

        return results
            .OrderBy(result => result.Symbol == normalizedSymbol ? 0 : 1)
            .ThenBy(result => result.Exchange)
            .ThenBy(result => result.Symbol)
            .Take(25)
            .ToArray();
    }
}
