using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Worker;

public sealed class PreMarketScannerRunner(
    PreMarketFilterService preMarketFilterService,
    IScannerRepository scannerRepository,
    IOptions<ScannerRunOptions> scannerRunOptions,
    ILogger<PreMarketScannerRunner> logger)
{
    private readonly ScannerRunOptions _scannerRunOptions = scannerRunOptions.Value;

    public async Task RunAsync(DateOnly sessionDate, CancellationToken cancellationToken)
    {
        var instruments = _scannerRunOptions.GetInstruments();
        if (instruments.Count == 0)
        {
            logger.LogWarning("Pre-market scan skipped because no instruments are configured.");
            return;
        }

        var candidates = await scannerRepository.GetLatestAcceptedEodCandidatesAsync(
            sessionDate,
            instruments,
            cancellationToken);

        if (candidates.Count == 0)
        {
            logger.LogInformation(
                "Pre-market scan skipped for {SessionDate} because no accepted EOD candidates were found before this session.",
                sessionDate);
            return;
        }

        logger.LogInformation(
            "Running pre-market filter for {SessionDate} across {CandidateCount} candidates.",
            sessionDate,
            candidates.Count);

        var result = await preMarketFilterService.FilterAsync(
            new PreMarketFilterRequest(sessionDate, candidates),
            cancellationToken);

        foreach (var decision in result.Decisions.OrderByDescending(decision => decision.Score))
        {
            LogDecision(decision);
        }

        await scannerRepository.SavePreMarketRunAsync(result, cancellationToken);
    }

    private void LogDecision(CandidateDecision decision)
    {
        var reasons = string.Join(", ", decision.Reasons.Select(reason => reason.Code));
        if (decision.IsAccepted)
        {
            logger.LogInformation(
                "Accepted pre-market candidate {InstrumentKey}: direction {Direction}, reasons {Reasons}.",
                decision.Instrument.Key,
                decision.Direction,
                reasons);
            return;
        }

        logger.LogInformation(
            "Rejected pre-market candidate {InstrumentKey}: reasons {Reasons}.",
            decision.Instrument.Key,
            reasons);
    }
}
