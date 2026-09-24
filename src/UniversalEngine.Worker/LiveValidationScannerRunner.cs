using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Notifications;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Application.Trading;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Worker;

public sealed class LiveValidationScannerRunner(
    LiveValidationService liveValidationService,
    TradePlanGenerationService tradePlanGenerationService,
    NotificationTriggerService notificationTriggerService,
    IScannerRepository scannerRepository,
    IOptions<ScannerRunOptions> scannerRunOptions,
    ILogger<LiveValidationScannerRunner> logger)
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
            logger.LogWarning("Live-validation scan skipped because no instruments are configured.");
            return;
        }

        var candidates = await scannerRepository.GetLatestOpeningRangeTradeCandidatesAsync(
            sessionDate,
            instruments,
            cancellationToken);

        if (candidates.Count == 0)
        {
            logger.LogInformation(
                "Live-validation scan skipped for {SessionDate} because no approved opening-range trade candidates were found.",
                sessionDate);
            return;
        }

        logger.LogInformation(
            "Running live validation for {SessionDate} across {CandidateCount} candidates from {From} to {To}.",
            sessionDate,
            candidates.Count,
            from,
            to);

        var decisions = new List<CandidateDecision>();
        foreach (var candidate in candidates)
        {
            var result = await liveValidationService.ValidateAsync(
                new LiveValidationRequest(sessionDate, from, to, candidate),
                cancellationToken);
            decisions.Add(result.Decision);
            LogDecision(result.Decision);
        }

        var tradePlanResults = decisions
            .Where(decision => decision.IsAccepted)
            .Select(tradePlanGenerationService.CreateFromOpeningRangeCandidate)
            .ToArray();

        await scannerRepository.SaveLiveValidationRunAsync(
            sessionDate,
            from,
            to,
            decisions,
            tradePlanResults,
            cancellationToken);

        await notificationTriggerService.NotifyLiveTradePlansAsync(
            tradePlanResults,
            sessionDate,
            from,
            to,
            cancellationToken);
    }

    private void LogDecision(CandidateDecision decision)
    {
        var reasons = string.Join(", ", decision.Reasons.Select(reason => reason.Code));
        if (decision.IsAccepted)
        {
            logger.LogInformation(
                "Live-validated candidate {InstrumentKey}: direction {Direction}, entry {Entry}, stop {Stop}, reasons {Reasons}.",
                decision.Instrument.Key,
                decision.Direction,
                decision.EntryPrice,
                decision.StopPrice,
                reasons);
            return;
        }

        logger.LogInformation(
            "Rejected live-validation candidate {InstrumentKey}: reasons {Reasons}.",
            decision.Instrument.Key,
            reasons);
    }
}
