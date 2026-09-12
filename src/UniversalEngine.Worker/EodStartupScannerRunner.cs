using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Notifications;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Application.Trading;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Worker;

public sealed class EodStartupScannerRunner(
    EodCandidateGenerationService eodCandidateGenerationService,
    OpeningRangeValidationService openingRangeValidationService,
    RiskVerdictService riskVerdictService,
    TradePlanGenerationService tradePlanGenerationService,
    NotificationTriggerService notificationTriggerService,
    IScannerRepository scannerRepository,
    IOptions<ScannerRunOptions> scannerRunOptions,
    IOptions<MarketDataOptions> marketDataOptions,
    IOptions<OpeningRangeOptions> openingRangeOptions,
    ILogger<EodStartupScannerRunner> logger)
{
    private readonly ScannerRunOptions _options = scannerRunOptions.Value;
    private readonly MarketDataOptions _marketDataOptions = marketDataOptions.Value;
    private readonly OpeningRangeOptions _openingRangeOptions = openingRangeOptions.Value;

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var instruments = _options.GetInstruments();
        if (instruments.Count == 0)
        {
            logger.LogWarning("EOD startup scan skipped because no instruments are configured.");
            return;
        }

        var sessionDate = _options.GetEodSessionDate(DateOnly.FromDateTime(DateTime.Today));
        logger.LogInformation(
            "Running EOD startup scan for {SessionDate} across {InstrumentCount} instruments.",
            sessionDate,
            instruments.Count);

        var result = await eodCandidateGenerationService.GenerateAsync(
            new EodCandidateGenerationRequest(instruments, sessionDate),
            cancellationToken);

        logger.LogInformation(
            "EOD scan completed for {SessionDate}. Accepted: {AcceptedCount}; Rejected: {RejectedCount}.",
            result.SessionDate,
            result.AcceptedCandidates.Count,
            result.RejectedCandidates.Count);

        foreach (var decision in result.Decisions.OrderByDescending(decision => decision.Score))
        {
            LogDecision(decision);
        }

        var verdicts = result.Decisions
            .Select(riskVerdictService.EvaluateEodCandidate)
            .ToArray();

        await scannerRepository.SaveEodRunAsync(
            result,
            verdicts,
            _marketDataOptions.PrimaryProvider.ToString(),
            cancellationToken);

        logger.LogInformation("Persisted EOD scanner run for {SessionDate}.", result.SessionDate);

        await notificationTriggerService.NotifyEodVerdictsAsync(verdicts, result.SessionDate, cancellationToken);

        if (_openingRangeOptions.Enabled)
        {
            await RunOpeningRangeValidationAsync(result, cancellationToken);
        }
    }

    private async Task RunOpeningRangeValidationAsync(
        EodCandidateGenerationResult eodResult,
        CancellationToken cancellationToken)
    {
        if (eodResult.AcceptedCandidates.Count == 0)
        {
            logger.LogInformation("Opening-range validation skipped because no EOD candidates were accepted.");
            return;
        }

        logger.LogInformation(
            "Running opening-range validation for {CandidateCount} EOD candidates.",
            eodResult.AcceptedCandidates.Count);

        var openingRangeResult = await openingRangeValidationService.ValidateAsync(
            new OpeningRangeValidationRequest(eodResult.SessionDate, eodResult.AcceptedCandidates),
            cancellationToken);

        logger.LogInformation(
            "Opening-range validation completed for {SessionDate}. Confirmed: {ConfirmedCount}; Evaluated: {EvaluatedCount}.",
            openingRangeResult.SessionDate,
            openingRangeResult.Confirmed.Count,
            openingRangeResult.Decisions.Count);

        foreach (var decision in openingRangeResult.Decisions.OrderByDescending(decision => decision.Score))
        {
            LogDecision(decision);
        }

        var tradePlanResults = openingRangeResult.Confirmed
            .Select(tradePlanGenerationService.CreateFromOpeningRangeCandidate)
            .ToArray();

        await notificationTriggerService.NotifyTradePlansAsync(
            tradePlanResults,
            openingRangeResult.SessionDate,
            cancellationToken);
    }

    private void LogDecision(CandidateDecision decision)
    {
        var reasons = string.Join(", ", decision.Reasons.Select(reason => reason.Code));
        if (decision.IsAccepted)
        {
            logger.LogInformation(
                "Accepted EOD candidate {InstrumentKey}: direction {Direction}, score {Score}, model {ModelVersion}, reasons {Reasons}.",
                decision.Instrument.Key,
                decision.Direction,
                decision.Score,
                decision.ScannerScore?.ModelVersion ?? "n/a",
                reasons);
            return;
        }

        logger.LogInformation(
            "Rejected EOD candidate {InstrumentKey}: reasons {Reasons}.",
            decision.Instrument.Key,
            reasons);
    }
}
