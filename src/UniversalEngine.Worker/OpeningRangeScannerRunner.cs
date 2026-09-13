using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Notifications;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Application.Trading;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Worker;

public sealed class OpeningRangeScannerRunner(
    OpeningRangeValidationService openingRangeValidationService,
    TradePlanGenerationService tradePlanGenerationService,
    NotificationTriggerService notificationTriggerService,
    IScannerRepository scannerRepository,
    IOptions<ScannerRunOptions> scannerRunOptions,
    ILogger<OpeningRangeScannerRunner> logger)
{
    private readonly ScannerRunOptions _scannerRunOptions = scannerRunOptions.Value;

    public async Task RunAsync(DateOnly sessionDate, CancellationToken cancellationToken)
    {
        var instruments = _scannerRunOptions.GetInstruments();
        if (instruments.Count == 0)
        {
            logger.LogWarning("Opening-range scan skipped because no instruments are configured.");
            return;
        }

        var candidates = await scannerRepository.GetLatestAcceptedPreMarketCandidatesAsync(
            sessionDate,
            instruments,
            cancellationToken);
        if (candidates.Count == 0)
        {
            candidates = await scannerRepository.GetLatestAcceptedEodCandidatesAsync(
                sessionDate,
                instruments,
                cancellationToken);
        }

        if (candidates.Count == 0)
        {
            logger.LogInformation(
                "Opening-range scan skipped for {SessionDate} because no accepted pre-market or EOD candidates were found.",
                sessionDate);
            return;
        }

        logger.LogInformation(
            "Running opening-range scan for {SessionDate} across {CandidateCount} candidates.",
            sessionDate,
            candidates.Count);

        var result = await openingRangeValidationService.ValidateAsync(
            new OpeningRangeValidationRequest(sessionDate, candidates),
            cancellationToken);

        foreach (var decision in result.Decisions.OrderByDescending(decision => decision.Score))
        {
            LogDecision(decision);
        }

        var tradePlanResults = result.Confirmed
            .Select(tradePlanGenerationService.CreateFromOpeningRangeCandidate)
            .ToArray();

        await scannerRepository.SaveOpeningRangeRunAsync(
            result,
            tradePlanResults,
            cancellationToken);

        await notificationTriggerService.NotifyTradePlansAsync(
            tradePlanResults,
            result.SessionDate,
            cancellationToken);
    }

    private void LogDecision(CandidateDecision decision)
    {
        var reasons = string.Join(", ", decision.Reasons.Select(reason => reason.Code));
        if (decision.IsAccepted)
        {
            logger.LogInformation(
                "Confirmed opening-range candidate {InstrumentKey}: direction {Direction}, entry {Entry}, stop {Stop}, reasons {Reasons}.",
                decision.Instrument.Key,
                decision.Direction,
                decision.EntryPrice,
                decision.StopPrice,
                reasons);
            return;
        }

        logger.LogInformation(
            "Rejected opening-range candidate {InstrumentKey}: reasons {Reasons}.",
            decision.Instrument.Key,
            reasons);
    }
}
