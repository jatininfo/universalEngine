namespace UniversalEngine.Domain.Market;

public sealed record Instrument(
    string Symbol,
    Exchange Exchange,
    string? Isin = null,
    decimal TickSize = 0.05m,
    string? SecurityId = null)
{
    public string Key => $"{Exchange}:{Symbol}".ToUpperInvariant();
}
