using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Notifications;
using UniversalEngine.Application.Scanning;

namespace UniversalEngine.Worker;

public sealed class SignalMonitorRunner(
    SignalMonitoringService signalMonitoringService,
    NotificationTriggerService notificationTriggerService,
    IScannerRepository scannerRepository,
    IOptions<ScannerRunOptions> scannerRunOptions,
    ILogger<SignalMonitorRunner> logger)
{
    private readonly ScannerRunOptions _scannerRunOptions = scannerRunOptions.Value;

    public async Task RunAsync(
        DateOnly sessionDate,
        TimeOnly from,
        TimeOnly to,
        CancellationToken cancellationToken)
    {
        var instruments = _scannerRunOptions.GetInstruments();
        if (instruments.Count == 0)
        {
            logger.LogWarning("Signal monitor skipped because no instruments are configured.");
            return;
        }

        var candidates = await scannerRepository.GetLatestLiveValidationTradeCandidatesAsync(
            sessionDate,
            instruments,
            cancellationToken);

        if (candidates.Count == 0)
        {
            candidates = await scannerRepository.GetLatestOpeningRangeTradeCandidatesAsync(
                sessionDate,
                instruments,
                cancellationToken);
        }

        if (candidates.Count == 0)
        {
            logger.LogInformation(
                "Signal monitor skipped for {SessionDate} because no active trade candidates were found.",
                sessionDate);
            return;
        }

        logger.LogInformation(
            "Running signal monitor for {SessionDate} across {CandidateCount} candidates from {From} to {To}.",
            sessionDate,
            candidates.Count,
            from,
            to);

        var result = await signalMonitoringService.MonitorAsync(
            new SignalMonitoringRequest(sessionDate, from, to, candidates),
            cancellationToken);

        await scannerRepository.SaveMonitorRunAsync(result, cancellationToken);
        await notificationTriggerService.NotifyMonitorEventsAsync(result, cancellationToken);

        foreach (var item in result.Results)
        {
            logger.LogInformation(
                "Monitor {InstrumentKey}: {Status}; latest {LatestPrice}; {Reason}",
                item.Candidate.Instrument.Key,
                item.Status,
                item.LatestPrice,
                item.Reason);
        }
    }
}
