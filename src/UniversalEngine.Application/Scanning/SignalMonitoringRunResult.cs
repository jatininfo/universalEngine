namespace UniversalEngine.Application.Scanning;

public sealed record SignalMonitoringRunResult(
    DateOnly SessionDate,
    TimeOnly From,
    TimeOnly To,
    IReadOnlyList<SignalMonitoringResult> Results);
