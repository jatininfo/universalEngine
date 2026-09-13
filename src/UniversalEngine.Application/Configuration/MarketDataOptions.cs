namespace UniversalEngine.Application.Configuration;

public sealed class MarketDataOptions
{
    public const string SectionName = "MarketData";

    public MarketDataProviderKind PrimaryProvider { get; set; } = MarketDataProviderKind.Dhan;

    public List<MarketDataProviderKind> EnabledProviders { get; set; } =
    [
        MarketDataProviderKind.Dhan,
        MarketDataProviderKind.Zerodha,
        MarketDataProviderKind.Groww
    ];

    public string? CsvDataRoot { get; set; }

    public string DhanInstrumentMasterUrl { get; set; } =
        "https://images.dhan.co/api-data/api-scrip-master-detailed.csv";

    public DhanMarketDataOptions Dhan { get; set; } = new();

    public ProviderCredentialOptions Zerodha { get; set; } = new();

    public ProviderCredentialOptions Groww { get; set; } = new();
}

public sealed class AnalysisDataOptions
{
    public const string SectionName = "AnalysisData";

    public MarketDataProviderKind PrimaryProvider { get; set; } = MarketDataProviderKind.Dhan;

    public bool UseHistoricalCache { get; set; } = true;

    public int HistoricalCacheTtlHours { get; set; } = 24;

    public string? HistoricalCacheRoot { get; set; }
}

public sealed class DhanMarketDataOptions
{
    public string BaseUrl { get; set; } = "https://api.dhan.co/v2/";

    public string? ClientId { get; set; }

    public string? AccessToken { get; set; }

    public string InstrumentType { get; set; } = "EQUITY";

    public bool IncludeOpenInterest { get; set; }

    public int RetryCount { get; set; } = 2;

    public int RetryBaseDelayMs { get; set; } = 500;

    public string GetAccessToken() =>
        !string.IsNullOrWhiteSpace(AccessToken)
            ? AccessToken
            : Environment.GetEnvironmentVariable("DHAN_ACCESS_TOKEN") ?? string.Empty;
}

public sealed class ProviderCredentialOptions
{
    public string? ClientId { get; set; }

    public string? ApiKey { get; set; }

    public string? AccessToken { get; set; }
}
