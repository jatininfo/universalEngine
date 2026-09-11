namespace UniversalEngine.Domain.Market;

public sealed record IntradayBar(
    Instrument Instrument,
    DateOnly SessionDate,
    DateTimeOffset Timestamp,
    decimal Open,
    decimal High,
    decimal Low,
    decimal Close,
    long Volume,
    BarInterval Interval);
