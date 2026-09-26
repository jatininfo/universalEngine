using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;

namespace UniversalEngine.Infrastructure.MarketData;

public sealed class AnalysisMarketDataProvider(
    IOptionsMonitor<AnalysisDataOptions> analysisOptions,
    CsvMarketDataProvider csvProvider,
    DhanMarketDataProvider dhanProvider,
    ConfiguredMarketDataProvider configuredProvider,
    ILogger<AnalysisMarketDataProvider> logger) : IAnalysisMarketDataProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    public async Task<IReadOnlyList<DailyBar>> GetDailyBarsAsync(
        IReadOnlyList<Instrument> instruments,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken)
    {
        var options = analysisOptions.CurrentValue;
        var provider = ResolveProvider();
        if (!options.UseHistoricalCache || options.PrimaryProvider == MarketDataProviderKind.Csv)
        {
            return await provider.GetDailyBarsAsync(instruments, from, to, cancellationToken);
        }

        var bars = new List<DailyBar>();
        foreach (var instrument in instruments)
        {
            bars.AddRange(await GetCachedDailyBarsAsync(options, provider, instrument, from, to, cancellationToken));
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
        // Intraday bars feed opening range, live validation, and monitoring.
        // Keep them broker-direct so realtime/final validation is not stale.
        return ResolveProvider().GetIntradayBarsAsync(instrument, date, from, to, interval, cancellationToken);
    }

    private async Task<IReadOnlyList<DailyBar>> GetCachedDailyBarsAsync(
        AnalysisDataOptions options,
        IMarketDataProvider provider,
        Instrument instrument,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken)
    {
        var cache = await ReadCacheAsync(instrument, cancellationToken);
        if (cache is not null &&
            cache.Covers(from, to) &&
            cache.IsFresh(options.HistoricalCacheTtlHours))
        {
            return cache.ToDailyBars(instrument, from, to);
        }

        var freshBars = await provider.GetDailyBarsAsync([instrument], from, to, cancellationToken);
        var merged = DailyBarCacheDocument.Merge(cache, instrument, freshBars, from, to);
        await WriteCacheAsync(instrument, merged, cancellationToken);
        return merged.ToDailyBars(instrument, from, to);
    }

    private async Task<DailyBarCacheDocument?> ReadCacheAsync(
        Instrument instrument,
        CancellationToken cancellationToken)
    {
        var path = GetCachePath(analysisOptions.CurrentValue, instrument);
        if (!File.Exists(path))
        {
            return null;
        }

        try
        {
            await using var stream = File.OpenRead(path);
            return await JsonSerializer.DeserializeAsync<DailyBarCacheDocument>(
                stream,
                JsonOptions,
                cancellationToken);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(ex, "Historical daily-bar cache could not be read for {InstrumentKey}.", instrument.Key);
            return null;
        }
    }

    private async Task WriteCacheAsync(
        Instrument instrument,
        DailyBarCacheDocument cache,
        CancellationToken cancellationToken)
    {
        var path = GetCachePath(analysisOptions.CurrentValue, instrument);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var stream = File.Create(path);
        await JsonSerializer.SerializeAsync(stream, cache, JsonOptions, cancellationToken);
    }

    private static string GetCachePath(AnalysisDataOptions options, Instrument instrument)
    {
        var root = string.IsNullOrWhiteSpace(options.HistoricalCacheRoot)
            ? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                "UniversalEngine",
                "historical-cache")
            : options.HistoricalCacheRoot;

        var fileName = $"{instrument.Exchange}_{SanitizeFileName(instrument.Symbol)}_daily.json";
        return Path.Combine(root, fileName);
    }

    private IMarketDataProvider ResolveProvider() =>
        analysisOptions.CurrentValue.PrimaryProvider switch
        {
            MarketDataProviderKind.Csv => csvProvider,
            MarketDataProviderKind.Dhan => dhanProvider,
            _ => configuredProvider
        };

    private static string SanitizeFileName(string value)
    {
        var invalid = Path.GetInvalidFileNameChars().ToHashSet();
        return new string(value.Select(character => invalid.Contains(character) ? '_' : character).ToArray());
    }

    private sealed record DailyBarCacheDocument(
        string InstrumentKey,
        DateOnly From,
        DateOnly To,
        DateTimeOffset FetchedAtUtc,
        IReadOnlyList<DailyBarCacheRow> Bars)
    {
        public bool Covers(DateOnly from, DateOnly to) =>
            From <= from && To >= to;

        public bool IsFresh(int ttlHours) =>
            ttlHours <= 0 || FetchedAtUtc.AddHours(ttlHours) > DateTimeOffset.UtcNow;

        public IReadOnlyList<DailyBar> ToDailyBars(Instrument instrument, DateOnly from, DateOnly to) =>
            Bars
                .Where(row => row.Date >= from && row.Date <= to)
                .OrderBy(row => row.Date)
                .Select(row => new DailyBar(
                    instrument,
                    row.Date,
                    row.Open,
                    row.High,
                    row.Low,
                    row.Close,
                    row.Volume,
                    row.DataTimestamp))
                .ToArray();

        public static DailyBarCacheDocument Merge(
            DailyBarCacheDocument? existing,
            Instrument instrument,
            IReadOnlyList<DailyBar> freshBars,
            DateOnly requestedFrom,
            DateOnly requestedTo)
        {
            var rows = (existing?.Bars ?? [])
                .Concat(freshBars.Select(DailyBarCacheRow.FromDailyBar))
                .GroupBy(row => row.Date)
                .Select(group => group.OrderByDescending(row => row.DataTimestamp).First())
                .OrderBy(row => row.Date)
                .ToArray();

            var from = existing is null || requestedFrom < existing.From ? requestedFrom : existing.From;
            var to = existing is null || requestedTo > existing.To ? requestedTo : existing.To;

            return new DailyBarCacheDocument(
                instrument.Key,
                from,
                to,
                DateTimeOffset.UtcNow,
                rows);
        }
    }

    private sealed record DailyBarCacheRow(
        DateOnly Date,
        decimal Open,
        decimal High,
        decimal Low,
        decimal Close,
        long Volume,
        DateTimeOffset DataTimestamp)
    {
        public static DailyBarCacheRow FromDailyBar(DailyBar bar) =>
            new(
                bar.Date,
                bar.Open,
                bar.High,
                bar.Low,
                bar.Close,
                bar.Volume,
                bar.DataTimestamp);
    }
}
