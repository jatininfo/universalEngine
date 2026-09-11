namespace UniversalEngine.Domain.Market;

public sealed record DailyBar(
    Instrument Instrument,
    DateOnly Date,
    decimal Open,
    decimal High,
    decimal Low,
    decimal Close,
    long Volume,
    DateTimeOffset DataTimestamp);
