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

    public List<InstrumentBasketOptions> Baskets { get; set; } = [];

    public DateOnly GetEodSessionDate(DateOnly fallback) =>
        string.IsNullOrWhiteSpace(EodSessionDate)
            ? fallback
            : DateOnly.Parse(EodSessionDate);

    public IReadOnlyList<Instrument> GetInstruments() =>
        GetConfiguredInstrumentOptions()
            .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
            .Select(ToInstrument)
            .GroupBy(instrument => instrument.Key)
            .Select(group => group.First())
            .ToArray();

    public IReadOnlyList<string> GetDuplicateInstrumentKeys() =>
        GetConfiguredInstrumentOptions()
            .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
            .Select(ToInstrument)
            .GroupBy(instrument => instrument.Key)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .OrderBy(key => key)
            .ToArray();

    public IReadOnlyList<InstrumentBasketOptions> GetEnabledBaskets() =>
        Baskets.Where(basket => basket.Enabled).ToArray();

    public IReadOnlyList<InstrumentBasketOptions> GetBaskets() =>
        Baskets.ToArray();

    private IEnumerable<InstrumentOptions> GetConfiguredInstrumentOptions()
    {
        foreach (var instrument in Instruments)
        {
            yield return instrument;
        }

        foreach (var basket in Baskets.Where(basket => basket.Enabled))
        {
            foreach (var instrument in basket.Instruments.Take(basket.MaxSymbols <= 0 ? int.MaxValue : basket.MaxSymbols))
            {
                yield return instrument;
            }
        }
    }

    private static Instrument ToInstrument(InstrumentOptions instrument) =>
        new(
            instrument.Symbol.Trim().ToUpperInvariant(),
            Enum.Parse<Exchange>(instrument.Exchange, ignoreCase: true),
            string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
            SecurityId: string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim());
}

public sealed class InstrumentOptions
{
    public string Symbol { get; set; } = string.Empty;

    public string Exchange { get; set; } = "Nse";

    public string? Isin { get; set; }

    public string? SecurityId { get; set; }
}

public sealed class InstrumentBasketOptions
{
    public string Name { get; set; } = "Custom";

    public bool Enabled { get; set; } = true;

    public int MaxSymbols { get; set; } = 200;

    public List<InstrumentOptions> Instruments { get; set; } = [];
}
