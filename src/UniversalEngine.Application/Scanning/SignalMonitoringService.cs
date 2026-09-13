using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Scanning;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.Scanning;

public sealed class SignalMonitoringService(
    IMarketDataProvider marketDataProvider,
    IOptions<MonitoringOptions> options)
{
    private readonly MonitoringOptions _options = options.Value;

    public async Task<SignalMonitoringRunResult> MonitorAsync(
        SignalMonitoringRequest request,
        CancellationToken cancellationToken)
    {
        var results = new List<SignalMonitoringResult>();
        foreach (var candidate in request.Candidates)
        {
            results.Add(await MonitorCandidateAsync(request, candidate, cancellationToken));
        }

        return new SignalMonitoringRunResult(request.SessionDate, request.From, request.To, results);
    }

    private async Task<SignalMonitoringResult> MonitorCandidateAsync(
        SignalMonitoringRequest request,
        CandidateDecision candidate,
        CancellationToken cancellationToken)
    {
        if (!candidate.IsAccepted ||
            candidate.Direction is null ||
            candidate.EntryPrice is null ||
            candidate.StopPrice is null)
        {
            return new SignalMonitoringResult(
                candidate,
                SignalMonitorStatus.NoData,
                null,
                null,
                "Candidate is missing accepted direction, entry, or stop values.");
        }

        var bars = await marketDataProvider.GetIntradayBarsAsync(
            candidate.Instrument,
            request.SessionDate,
            request.From,
            request.To,
            _options.Interval,
            cancellationToken);

        if (bars.Count == 0)
        {
            return new SignalMonitoringResult(
                candidate,
                SignalMonitorStatus.NoData,
                null,
                null,
                "No intraday bars were available for monitoring.");
        }

        var latestBar = bars.OrderBy(bar => bar.Timestamp).Last();
        var now = DateTimeOffset.Now.ToOffset(latestBar.Timestamp.Offset);
        if (request.SessionDate == DateOnly.FromDateTime(now.DateTime) &&
            now - latestBar.Timestamp > TimeSpan.FromMinutes(_options.MaxIntradayDataAgeMinutes))
        {
            return new SignalMonitoringResult(
                candidate,
                SignalMonitorStatus.NoData,
                latestBar.Close,
                latestBar.Timestamp,
                "Latest intraday bar is older than the configured freshness window.");
        }

        return candidate.Direction switch
        {
            CandidateDirection.Long => MonitorLong(request, candidate, latestBar),
            CandidateDirection.Short => MonitorShort(request, candidate, latestBar),
            _ => new SignalMonitoringResult(candidate, SignalMonitorStatus.NoData, latestBar.Close, latestBar.Timestamp, "Unsupported candidate direction.")
        };
    }

    private SignalMonitoringResult MonitorLong(
        SignalMonitoringRequest request,
        CandidateDecision candidate,
        Domain.Market.IntradayBar latestBar)
    {
        if (latestBar.Low <= candidate.StopPrice)
        {
            return Result(candidate, SignalMonitorStatus.StopBreached, latestBar, $"Low {latestBar.Low:0.##} touched stop {candidate.StopPrice:0.##}.");
        }

        if (candidate.TargetPrice is not null && latestBar.High >= candidate.TargetPrice)
        {
            return Result(candidate, SignalMonitorStatus.TargetReached, latestBar, $"High {latestBar.High:0.##} reached target {candidate.TargetPrice:0.##}.");
        }

        return ActiveOrExpired(request, candidate, latestBar);
    }

    private SignalMonitoringResult MonitorShort(
        SignalMonitoringRequest request,
        CandidateDecision candidate,
        Domain.Market.IntradayBar latestBar)
    {
        if (latestBar.High >= candidate.StopPrice)
        {
            return Result(candidate, SignalMonitorStatus.StopBreached, latestBar, $"High {latestBar.High:0.##} touched stop {candidate.StopPrice:0.##}.");
        }

        if (candidate.TargetPrice is not null && latestBar.Low <= candidate.TargetPrice)
        {
            return Result(candidate, SignalMonitorStatus.TargetReached, latestBar, $"Low {latestBar.Low:0.##} reached target {candidate.TargetPrice:0.##}.");
        }

        return ActiveOrExpired(request, candidate, latestBar);
    }

    private SignalMonitoringResult ActiveOrExpired(
        SignalMonitoringRequest request,
        CandidateDecision candidate,
        Domain.Market.IntradayBar latestBar)
    {
        if (request.To >= _options.GetEndTime())
        {
            return Result(candidate, SignalMonitorStatus.Expired, latestBar, "Monitoring window reached the configured end time without target or stop.");
        }

        return Result(candidate, SignalMonitorStatus.StillActive, latestBar, "Signal remains active; target and stop are both untouched.");
    }

    private static SignalMonitoringResult Result(
        CandidateDecision candidate,
        SignalMonitorStatus status,
        Domain.Market.IntradayBar latestBar,
        string reason) =>
        new(candidate, status, latestBar.Close, latestBar.Timestamp, reason);
}
