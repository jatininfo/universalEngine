using UniversalEngine.Domain.Market;

namespace UniversalEngine.Application.Configuration;

public sealed class ScannerRunOptions
{
    public const string SectionName = "ScannerRun";

    public bool RunEodOnStartup { get; set; }

    public bool StopAfterStartupRun { get; set; }

    public bool EnableScheduledEodScan { get; set; }

    public string EodRunTimeLocal { get; set; } = "16:30";

    public int SchedulerPollSeconds { get; set; } = 60;

    public string? EodSessionDate { get; set; }

    public List<InstrumentOptions> Instruments { get; set; } = [];

    public DateOnly GetEodSessionDate(DateOnly fallback) =>
        string.IsNullOrWhiteSpace(EodSessionDate)
            ? fallback
            : DateOnly.Parse(EodSessionDate);

    public IReadOnlyList<Instrument> GetInstruments() =>
        Instruments
            .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
            .Select(instrument => new Instrument(
                instrument.Symbol.Trim().ToUpperInvariant(),
                Enum.Parse<Exchange>(instrument.Exchange, ignoreCase: true),
                string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
                SecurityId: string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim()))
            .ToArray();
}

public sealed class InstrumentOptions
{
    public string Symbol { get; set; } = string.Empty;

    public string Exchange { get; set; } = "Nse";

    public string? Isin { get; set; }

    public string? SecurityId { get; set; }
}
