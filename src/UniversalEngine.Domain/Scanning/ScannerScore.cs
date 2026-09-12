namespace UniversalEngine.Domain.Scanning;

public sealed record ScannerScore(
    decimal Total,
    IReadOnlyDictionary<string, decimal> Factors,
    string ModelVersion);
