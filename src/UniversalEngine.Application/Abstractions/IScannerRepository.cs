using UniversalEngine.Application.Scanning;
using UniversalEngine.Application.ReadModels;
using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.Abstractions;

public interface IScannerRepository
{
    Task SaveEodRunAsync(
        EodCandidateGenerationResult result,
        IReadOnlyList<RiskVerdict> verdicts,
        string marketDataProvider,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ScannerRunSummary>> GetLatestRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CandidateDecisionSummary>> GetCandidatesAsync(
        string runId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CandidateDecision>> GetLatestAcceptedEodCandidatesAsync(
        DateOnly beforeSessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        CancellationToken cancellationToken);

    Task SavePreMarketRunAsync(
        PreMarketFilterResult result,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<PreMarketRunSummary>> GetLatestPreMarketRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<PreMarketDecisionSummary>> GetPreMarketDecisionsAsync(
        string runId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CandidateDecision>> GetLatestAcceptedPreMarketCandidatesAsync(
        DateOnly sessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        CancellationToken cancellationToken);

    Task SaveOpeningRangeRunAsync(
        OpeningRangeValidationResult result,
        IReadOnlyList<RiskSizingResult> riskResults,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<OpeningRangeRunSummary>> GetLatestOpeningRangeRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<OpeningRangeDecisionSummary>> GetOpeningRangeDecisionsAsync(
        string runId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CandidateDecision>> GetLatestOpeningRangeTradeCandidatesAsync(
        DateOnly sessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        CancellationToken cancellationToken);

    Task SaveLiveValidationRunAsync(
        DateOnly sessionDate,
        TimeOnly from,
        TimeOnly to,
        IReadOnlyList<CandidateDecision> decisions,
        IReadOnlyList<RiskSizingResult> riskResults,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<LiveValidationRunSummary>> GetLatestLiveValidationRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<LiveValidationDecisionSummary>> GetLiveValidationDecisionsAsync(
        string runId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CandidateDecision>> GetLatestLiveValidationTradeCandidatesAsync(
        DateOnly sessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        CancellationToken cancellationToken);

    Task SaveMonitorRunAsync(
        SignalMonitoringRunResult result,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MonitorRunSummary>> GetLatestMonitorRunsAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MonitorEventSummary>> GetMonitorEventsAsync(
        string runId,
        CancellationToken cancellationToken);
}
