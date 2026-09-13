using UniversalEngine.Domain.Market;

namespace UniversalEngine.Application.Configuration;

public sealed class LiveValidationOptions
{
    public const string SectionName = "LiveValidation";

    public bool Enabled { get; set; }

    public bool EnableScheduledScan { get; set; }

    public BarInterval Interval { get; set; } = BarInterval.FiveMinutes;

    public string StartTime { get; set; } = "09:30";

    public string EndTime { get; set; } = "15:15";

    public int PollMinutes { get; set; } = 5;

    public int ConfirmationBufferTicks { get; set; } = 0;

    public int MaxIntradayDataAgeMinutes { get; set; } = 10;

    public TimeOnly GetStartTime() => TimeOnly.Parse(StartTime);

    public TimeOnly GetEndTime() => TimeOnly.Parse(EndTime);
}
