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
}
