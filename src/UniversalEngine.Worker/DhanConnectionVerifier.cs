using Microsoft.Extensions.Options;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Market;
using UniversalEngine.Infrastructure.MarketData;

namespace UniversalEngine.Worker;

public sealed class DhanConnectionVerifier(
    IOptions<MarketDataOptions> marketDataOptions,
    IOptions<ScannerRunOptions> scannerRunOptions,
    IOptions<OpeningRangeOptions> openingRangeOptions,
    DhanMarketDataProvider marketDataProvider)
{
    private readonly DhanMarketDataOptions _dhanOptions = marketDataOptions.Value.Dhan;
    private readonly ScannerRunOptions _scannerRunOptions = scannerRunOptions.Value;
    private readonly OpeningRangeOptions _openingRangeOptions = openingRangeOptions.Value;

    public async Task<DhanVerificationResult> VerifyAsync(
        Instrument? instrument,
        CancellationToken cancellationToken)
    {
        var accessToken = _dhanOptions.GetAccessToken();
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return new DhanVerificationResult(false, "Missing Dhan access token.", 0);
        }

        using var httpClient = new HttpClient
        {
            BaseAddress = new Uri(_dhanOptions.BaseUrl),
            Timeout = TimeSpan.FromSeconds(30)
        };

        httpClient.DefaultRequestHeaders.TryAddWithoutValidation("access-token", accessToken);
        if (!string.IsNullOrWhiteSpace(_dhanOptions.ClientId))
        {
            httpClient.DefaultRequestHeaders.TryAddWithoutValidation("client-id", _dhanOptions.ClientId);
        }

        var profileOk = await IsSuccessfulAsync(httpClient, "profile", cancellationToken);
        var fundLimitOk = await IsSuccessfulAsync(httpClient, "fundlimit", cancellationToken);

        instrument ??= _scannerRunOptions.GetInstruments().FirstOrDefault();
        if (instrument is null)
        {
            return new DhanVerificationResult(
                profileOk && fundLimitOk,
                "Profile/fundlimit checked. Add a scanner instrument or pass EXCHANGE SYMBOL SECURITY_ID to verify market data.",
                0);
        }

        var to = DateOnly.FromDateTime(DateTime.Today);
        var from = to.AddDays(-7);
        var bars = await marketDataProvider.GetDailyBarsAsync([instrument], from, to, cancellationToken);

        return new DhanVerificationResult(
            profileOk && fundLimitOk && bars.Count > 0,
            $"Profile: {(profileOk ? "OK" : "FAILED")}; FundLimit: {(fundLimitOk ? "OK" : "FAILED")}; Historical candles: {bars.Count}",
            bars.Count);
    }

    public async Task<DhanVerificationResult> VerifyIntradayAsync(
        Instrument? instrument,
        DateOnly? sessionDate,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_dhanOptions.GetAccessToken()))
        {
            return new DhanVerificationResult(false, "Missing Dhan access token.", 0);
        }

        instrument ??= _scannerRunOptions.GetInstruments().FirstOrDefault();
        if (instrument is null)
        {
            return new DhanVerificationResult(
                false,
                "Add a scanner instrument or pass EXCHANGE SYMBOL SECURITY_ID to verify Dhan intraday data.",
                0);
        }

        var date = sessionDate ?? _scannerRunOptions.GetEodSessionDate(DateOnly.FromDateTime(DateTime.Today));
        var marketOpen = _openingRangeOptions.GetMarketOpenTime();
        var rangeEnd = marketOpen.AddMinutes(_openingRangeOptions.RangeMinutes);
        var bars = await marketDataProvider.GetIntradayBarsAsync(
            instrument,
            date,
            marketOpen,
            rangeEnd,
            _openingRangeOptions.Interval,
            cancellationToken);

        return new DhanVerificationResult(
            bars.Count > 0,
            $"Intraday candles: {bars.Count}; Instrument: {instrument.Key}; Date: {date:yyyy-MM-dd}; Window: {marketOpen:HH:mm}-{rangeEnd:HH:mm}; Interval: {_openingRangeOptions.Interval}",
            bars.Count);
    }

    private static async Task<bool> IsSuccessfulAsync(
        HttpClient httpClient,
        string path,
        CancellationToken cancellationToken)
    {
        using var response = await httpClient.GetAsync(path, cancellationToken);
        return response.IsSuccessStatusCode;
    }
}

public sealed record DhanVerificationResult(
    bool IsSuccessful,
    string Message,
    int HistoricalBarCount);
