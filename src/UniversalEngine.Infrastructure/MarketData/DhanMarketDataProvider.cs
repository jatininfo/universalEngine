using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;

namespace UniversalEngine.Infrastructure.MarketData;

public sealed class DhanMarketDataProvider(
    HttpClient httpClient,
    IOptionsMonitor<MarketDataOptions> options,
    ILogger<DhanMarketDataProvider> logger) : IMarketDataProvider
{
    private static readonly TimeSpan IndiaOffset = TimeSpan.FromHours(5.5);
    private readonly SemaphoreSlim _throttleLock = new(1, 1);
    private DateTimeOffset _lastRequestAtUtc = DateTimeOffset.MinValue;

    public async Task<IReadOnlyList<DailyBar>> GetDailyBarsAsync(
        IReadOnlyList<Instrument> instruments,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken)
    {
        var dhanOptions = options.CurrentValue.Dhan;
        EnsureConfigured(dhanOptions);

        var bars = new List<DailyBar>();
        foreach (var instrument in instruments)
        {
            EnsureInstrumentConfigured(instrument);

            var request = new DhanHistoricalRequest(
                instrument.SecurityId!,
                ToExchangeSegment(instrument.Exchange),
                dhanOptions.InstrumentType,
                ExpiryCode: 0,
                Oi: dhanOptions.IncludeOpenInterest,
                FromDate: from.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                ToDate: to.AddDays(1).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));

            var response = await PostAsync<DhanHistoricalResponse>(dhanOptions, "charts/historical", request, cancellationToken);
            bars.AddRange(MapDailyBars(instrument, response));
        }

        return bars;
    }

    public async Task<IReadOnlyList<IntradayBar>> GetIntradayBarsAsync(
        Instrument instrument,
        DateOnly date,
        TimeOnly from,
        TimeOnly to,
        BarInterval interval,
        CancellationToken cancellationToken)
    {
        var dhanOptions = options.CurrentValue.Dhan;
        EnsureConfigured(dhanOptions);
        EnsureInstrumentConfigured(instrument);

        var request = new DhanIntradayRequest(
            instrument.SecurityId!,
            ToExchangeSegment(instrument.Exchange),
            dhanOptions.InstrumentType,
            ToDhanInterval(interval),
            dhanOptions.IncludeOpenInterest,
            $"{date:yyyy-MM-dd} {from:HH:mm:ss}",
            $"{date:yyyy-MM-dd} {to:HH:mm:ss}");

        var response = await PostAsync<DhanHistoricalResponse>(dhanOptions, "charts/intraday", request, cancellationToken);
        return MapIntradayBars(instrument, date, interval, response);
    }

    private async Task<TResponse> PostAsync<TResponse>(
        DhanMarketDataOptions dhanOptions,
        string path,
        object payload,
        CancellationToken cancellationToken)
    {
        var maxAttempts = Math.Max(1, dhanOptions.RetryCount + 1);
        Exception? lastException = null;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await WaitForThrottleAsync(dhanOptions, cancellationToken);
                using var request = CreatePostRequest(dhanOptions, path, payload);
                using var response = await httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync(cancellationToken);
                    logger.LogWarning(
                        "Dhan market-data request failed. Path: {Path}; Attempt: {Attempt}/{MaxAttempts}; Status: {StatusCode}; Body: {Body}",
                        path,
                        attempt,
                        maxAttempts,
                        (int)response.StatusCode,
                        body);

                    if (attempt < maxAttempts && IsTransient(response.StatusCode))
                    {
                        await DelayBeforeRetryAsync(dhanOptions, attempt, cancellationToken);
                        continue;
                    }

                    throw new InvalidOperationException(
                        $"Dhan market-data request failed for {path}. Status {(int)response.StatusCode} ({response.StatusCode}). Response: {body}");
                }

                return await response.Content.ReadFromJsonAsync<TResponse>(cancellationToken)
                    ?? throw new InvalidOperationException("Dhan returned an empty response body.");
            }
            catch (Exception ex) when (attempt < maxAttempts && IsRetryableException(ex, cancellationToken))
            {
                lastException = ex;
                logger.LogWarning(
                    ex,
                    "Dhan market-data request failed before response. Path: {Path}; Attempt: {Attempt}/{MaxAttempts}",
                    path,
                    attempt,
                    maxAttempts);
                await DelayBeforeRetryAsync(dhanOptions, attempt, cancellationToken);
            }
        }

        throw new InvalidOperationException(
            $"Dhan market-data request failed for {path} after {maxAttempts} attempts.",
            lastException);
    }

    private static HttpRequestMessage CreatePostRequest(DhanMarketDataOptions dhanOptions, string path, object payload)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, new Uri(new Uri(dhanOptions.BaseUrl, UriKind.Absolute), path))
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.TryAddWithoutValidation("access-token", dhanOptions.GetAccessToken());
        if (!string.IsNullOrWhiteSpace(dhanOptions.ClientId))
        {
            request.Headers.TryAddWithoutValidation("client-id", dhanOptions.ClientId);
        }

        return request;
    }

    private static IReadOnlyList<DailyBar> MapDailyBars(
        Instrument instrument,
        DhanHistoricalResponse response)
    {
        ValidateResponseShape(response);

        var bars = new List<DailyBar>();
        for (var index = 0; index < response.Timestamp.Count; index++)
        {
            var timestamp = ToIndiaTime(response.Timestamp[index]);
            bars.Add(new DailyBar(
                instrument,
                DateOnly.FromDateTime(timestamp.DateTime),
                response.Open[index],
                response.High[index],
                response.Low[index],
                response.Close[index],
                ToVolume(response.Volume[index]),
                timestamp));
        }

        return bars;
    }

    private static IReadOnlyList<IntradayBar> MapIntradayBars(
        Instrument instrument,
        DateOnly sessionDate,
        BarInterval interval,
        DhanHistoricalResponse response)
    {
        ValidateResponseShape(response);

        var bars = new List<IntradayBar>();
        for (var index = 0; index < response.Timestamp.Count; index++)
        {
            var timestamp = ToIndiaTime(response.Timestamp[index]);
            bars.Add(new IntradayBar(
                instrument,
                sessionDate,
                timestamp,
                response.Open[index],
                response.High[index],
                response.Low[index],
                response.Close[index],
                ToVolume(response.Volume[index]),
                interval));
        }

        return bars;
    }

    private static void ValidateResponseShape(DhanHistoricalResponse response)
    {
        var count = response.Timestamp.Count;
        if (response.Open.Count != count ||
            response.High.Count != count ||
            response.Low.Count != count ||
            response.Close.Count != count ||
            response.Volume.Count != count)
        {
            throw new InvalidOperationException("Dhan historical response arrays have mismatched lengths.");
        }
    }

    private static void EnsureConfigured(DhanMarketDataOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.GetAccessToken()))
        {
            throw new InvalidOperationException(
                "Dhan access token is missing. Set MarketData:Dhan:AccessToken or DHAN_ACCESS_TOKEN.");
        }
    }

    private static void EnsureInstrumentConfigured(Instrument instrument)
    {
        if (string.IsNullOrWhiteSpace(instrument.SecurityId))
        {
            throw new InvalidOperationException(
                $"Instrument {instrument.Key} is missing SecurityId required by Dhan.");
        }
    }

    private static string ToExchangeSegment(Exchange exchange) =>
        exchange switch
        {
            Exchange.Nse => "NSE_EQ",
            Exchange.Bse => "BSE_EQ",
            _ => throw new NotSupportedException($"Unsupported exchange: {exchange}")
        };

    private static string ToDhanInterval(BarInterval interval) =>
        interval switch
        {
            BarInterval.OneMinute => "1",
            BarInterval.FiveMinutes => "5",
            BarInterval.FifteenMinutes => "15",
            BarInterval.ThirtyMinutes => "25",
            _ => throw new NotSupportedException($"Dhan intraday interval is not supported yet: {interval}")
        };

    private static DateTimeOffset ToIndiaTime(decimal epochSeconds) =>
        DateTimeOffset.FromUnixTimeSeconds((long)decimal.Truncate(epochSeconds)).ToOffset(IndiaOffset);

    private static long ToVolume(decimal value) =>
        (long)decimal.Truncate(value);

    private static Task DelayBeforeRetryAsync(DhanMarketDataOptions options, int attempt, CancellationToken cancellationToken)
    {
        var delayMs = Math.Max(0, options.RetryBaseDelayMs) * attempt;
        return delayMs == 0 ? Task.CompletedTask : Task.Delay(delayMs, cancellationToken);
    }

    private async Task WaitForThrottleAsync(DhanMarketDataOptions options, CancellationToken cancellationToken)
    {
        var delayMs = Math.Max(0, options.RequestThrottleDelayMs);
        if (delayMs == 0)
        {
            return;
        }

        await _throttleLock.WaitAsync(cancellationToken);
        try
        {
            var elapsed = DateTimeOffset.UtcNow - _lastRequestAtUtc;
            var remaining = TimeSpan.FromMilliseconds(delayMs) - elapsed;
            if (remaining > TimeSpan.Zero)
            {
                await Task.Delay(remaining, cancellationToken);
            }

            _lastRequestAtUtc = DateTimeOffset.UtcNow;
        }
        finally
        {
            _throttleLock.Release();
        }
    }

    private static bool IsTransient(HttpStatusCode statusCode) =>
        statusCode == HttpStatusCode.TooManyRequests ||
        (int)statusCode >= 500;

    private static bool IsRetryableException(Exception exception, CancellationToken cancellationToken) =>
        !cancellationToken.IsCancellationRequested &&
        (exception is HttpRequestException || exception is TaskCanceledException);

    private sealed record DhanHistoricalRequest(
        [property: JsonPropertyName("securityId")] string SecurityId,
        [property: JsonPropertyName("exchangeSegment")] string ExchangeSegment,
        [property: JsonPropertyName("instrument")] string Instrument,
        [property: JsonPropertyName("expiryCode")] int ExpiryCode,
        [property: JsonPropertyName("oi")] bool Oi,
        [property: JsonPropertyName("fromDate")] string FromDate,
        [property: JsonPropertyName("toDate")] string ToDate);

    private sealed record DhanIntradayRequest(
        [property: JsonPropertyName("securityId")] string SecurityId,
        [property: JsonPropertyName("exchangeSegment")] string ExchangeSegment,
        [property: JsonPropertyName("instrument")] string Instrument,
        [property: JsonPropertyName("interval")] string Interval,
        [property: JsonPropertyName("oi")] bool Oi,
        [property: JsonPropertyName("fromDate")] string FromDate,
        [property: JsonPropertyName("toDate")] string ToDate);

    private sealed record DhanHistoricalResponse(
        [property: JsonPropertyName("open")] List<decimal> Open,
        [property: JsonPropertyName("high")] List<decimal> High,
        [property: JsonPropertyName("low")] List<decimal> Low,
        [property: JsonPropertyName("close")] List<decimal> Close,
        [property: JsonPropertyName("volume")] List<decimal> Volume,
        [property: JsonPropertyName("timestamp")] List<decimal> Timestamp,
        [property: JsonPropertyName("open_interest")] List<decimal>? OpenInterest);
}
