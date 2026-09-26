using System.Net.Http.Headers;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Infrastructure.MarketData;

public sealed class BrokerConnectionVerifier(
    IHttpClientFactory httpClientFactory,
    IOptionsMonitor<MarketDataOptions> options) : IBrokerConnectionVerifier
{
    public async Task<IReadOnlyList<BrokerConnectionStatus>> GetStatusesAsync(CancellationToken cancellationToken)
    {
        var currentOptions = options.CurrentValue;
        var statuses = new List<BrokerConnectionStatus>
        {
            await CheckDhanAsync(currentOptions, cancellationToken),
            Placeholder("Zerodha", HasZerodhaCredentials(currentOptions), "Configured provider slot; live adapter is not implemented yet."),
            Placeholder("Groww", HasGrowwCredentials(currentOptions), "Configured provider slot; live adapter is not implemented yet.")
        };

        return statuses;
    }

    private async Task<BrokerConnectionStatus> CheckDhanAsync(MarketDataOptions options, CancellationToken cancellationToken)
    {
        var checkedAt = DateTimeOffset.UtcNow;
        var accessToken = options.Dhan.GetAccessToken();
        var isConfigured = !string.IsNullOrWhiteSpace(accessToken);
        if (!isConfigured)
        {
            return new BrokerConnectionStatus("Dhan", "MissingCredentials", false, false, "Dhan access token is not configured.", checkedAt);
        }

        try
        {
            var httpClient = httpClientFactory.CreateClient(nameof(BrokerConnectionVerifier));
            httpClient.BaseAddress = new Uri(options.Dhan.BaseUrl);
            httpClient.Timeout = TimeSpan.FromSeconds(20);
            httpClient.DefaultRequestHeaders.TryAddWithoutValidation("access-token", accessToken);
            if (!string.IsNullOrWhiteSpace(options.Dhan.ClientId))
            {
                httpClient.DefaultRequestHeaders.TryAddWithoutValidation("client-id", options.Dhan.ClientId);
            }

            using var profile = await httpClient.GetAsync("profile", cancellationToken);
            using var fundLimit = await httpClient.GetAsync("fundlimit", cancellationToken);
            var connected = profile.IsSuccessStatusCode && fundLimit.IsSuccessStatusCode;
            var message = $"Profile {(profile.IsSuccessStatusCode ? "OK" : (int)profile.StatusCode)}; FundLimit {(fundLimit.IsSuccessStatusCode ? "OK" : (int)fundLimit.StatusCode)}.";
            return new BrokerConnectionStatus("Dhan", connected ? "Connected" : "Failed", true, connected, message, checkedAt);
        }
        catch (Exception ex)
        {
            return new BrokerConnectionStatus("Dhan", "Failed", true, false, ex.Message, checkedAt);
        }
    }

    private BrokerConnectionStatus Placeholder(string broker, bool configured, string message) =>
        new(
            broker,
            configured ? "AdapterPending" : "NotConfigured",
            configured,
            false,
            message,
            DateTimeOffset.UtcNow);

    private static bool HasZerodhaCredentials(MarketDataOptions options) =>
        !string.IsNullOrWhiteSpace(options.Zerodha.ApiKey) ||
        !string.IsNullOrWhiteSpace(options.Zerodha.AccessToken) ||
        !string.IsNullOrWhiteSpace(options.Zerodha.ClientId);

    private static bool HasGrowwCredentials(MarketDataOptions options) =>
        !string.IsNullOrWhiteSpace(options.Groww.ApiKey) ||
        !string.IsNullOrWhiteSpace(options.Groww.AccessToken) ||
        !string.IsNullOrWhiteSpace(options.Groww.ClientId);
}
