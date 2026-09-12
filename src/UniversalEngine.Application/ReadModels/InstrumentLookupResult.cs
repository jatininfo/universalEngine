namespace UniversalEngine.Application.ReadModels;

public sealed record InstrumentLookupResult(
    string Exchange,
    string Segment,
    string SecurityId,
    string Isin,
    string Symbol,
    string SymbolName,
    string DisplayName,
    string Instrument,
    string InstrumentType,
    string Series,
    decimal TickSize);
