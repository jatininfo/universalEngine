namespace UniversalEngine.Application.ReadModels;

public sealed record ScannerInstrumentDefinition(
    string Symbol,
    string Exchange,
    string? Isin,
    string? SecurityId,
    string Key);

public sealed record ScannerBasketDefinition(
    string Name,
    bool Enabled,
    int MaxSymbols,
    int InstrumentCount,
    IReadOnlyList<ScannerInstrumentDefinition> Instruments);

public sealed record ScannerUniverseDefinition(
    string Name,
    bool Enabled,
    int InstrumentCount,
    IReadOnlyList<string> BasketNames,
    IReadOnlyList<ScannerInstrumentDefinition> Instruments);

public sealed record ScannerUniverseState(
    IReadOnlyList<ScannerInstrumentDefinition> Instruments,
    IReadOnlyList<ScannerBasketDefinition> Baskets,
    IReadOnlyList<ScannerUniverseDefinition> Universes);
