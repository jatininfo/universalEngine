using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Analysis;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;

namespace UniversalEngine.Application.Tests;

public sealed class EodCandidateGenerationServiceTests
{
    private static readonly Instrument AcceptedInstrument = new("ABC", Exchange.Nse);
    private static readonly Instrument RejectedInstrument = new("XYZ", Exchange.Nse);
    private static readonly DateOnly SessionDate = new(2026, 9, 10);

    [Fact]
    public async Task GenerateAsync_AcceptsCandidateWithPositiveReasons()
    {
        var service = CreateService(CreateBars(AcceptedInstrument, SessionDate, latestClose: 119m, latestVolume: 3_000_000));

        var result = await service.GenerateAsync(new EodCandidateGenerationRequest([AcceptedInstrument], SessionDate), CancellationToken.None);

        var decision = Assert.Single(result.AcceptedCandidates);
        Assert.Equal(DecisionOutcome.Accepted, decision.Outcome);
        Assert.Equal(CandidateDirection.Long, decision.Direction);
        Assert.Contains(decision.Reasons, reason => reason.Code == DecisionReasonCode.VolumeExpansion);
        Assert.Contains(decision.Reasons, reason => reason.Code == DecisionReasonCode.CloseNearDayHigh);
    }

    [Fact]
    public async Task GenerateAsync_RejectsCandidateWithReasonWhenLiquidityFails()
    {
        var options = new EodScannerOptions { LookbackDays = 3, MinimumAverageTradedValue = 1_000_000m };
        var service = CreateService(CreateBars(RejectedInstrument, SessionDate, latestClose: 12m, latestVolume: 3_000_000, historyClose: 10m, historyVolume: 10_000), options);

        var result = await service.GenerateAsync(new EodCandidateGenerationRequest([RejectedInstrument], SessionDate), CancellationToken.None);

        var decision = Assert.Single(result.RejectedCandidates);
        Assert.Equal(DecisionOutcome.Rejected, decision.Outcome);
        Assert.Contains(decision.Reasons, reason => reason.Code == DecisionReasonCode.InsufficientLiquidity);
    }

    [Fact]
    public async Task GenerateAsync_RejectsMissingDailyData()
    {
        var service = CreateService([]);

        var result = await service.GenerateAsync(new EodCandidateGenerationRequest([AcceptedInstrument], SessionDate), CancellationToken.None);

        var decision = Assert.Single(result.RejectedCandidates);
        Assert.Contains(decision.Reasons, reason => reason.Code == DecisionReasonCode.MissingDailyData);
    }

    private static EodCandidateGenerationService CreateService(
        IReadOnlyList<DailyBar> bars,
        EodScannerOptions? options = null) =>
        new(
            new FakeMarketDataProvider(bars),
            new TechnicalIndicatorService(),
            new ScannerScoringService(),
            Options.Create(options ?? new EodScannerOptions { LookbackDays = 3, MinimumAverageTradedValue = 1_000_000m }));

    private static IReadOnlyList<DailyBar> CreateBars(
        Instrument instrument,
        DateOnly sessionDate,
        decimal latestClose,
        long latestVolume,
        decimal historyClose = 100m,
        long historyVolume = 1_000_000)
    {
        var bars = new List<DailyBar>();
        for (var index = 3; index >= 1; index--)
        {
            bars.Add(new DailyBar(
                instrument,
                sessionDate.AddDays(-index),
                historyClose,
                historyClose + 5m,
                historyClose - 5m,
                historyClose,
                historyVolume,
                new DateTimeOffset(sessionDate.AddDays(-index).ToDateTime(new TimeOnly(16, 0)), TimeSpan.FromHours(5.5))));
        }

        bars.Add(new DailyBar(
            instrument,
            sessionDate,
            100m,
            120m,
            100m,
            latestClose,
            latestVolume,
            new DateTimeOffset(sessionDate.ToDateTime(new TimeOnly(16, 0)), TimeSpan.FromHours(5.5))));

        return bars;
    }

    private sealed class FakeMarketDataProvider(IReadOnlyList<DailyBar> bars) : IMarketDataProvider
    {
        public Task<IReadOnlyList<DailyBar>> GetDailyBarsAsync(
            IReadOnlyList<Instrument> instruments,
            DateOnly from,
            DateOnly to,
            CancellationToken cancellationToken)
        {
            var keys = instruments.Select(instrument => instrument.Key).ToHashSet();
            return Task.FromResult<IReadOnlyList<DailyBar>>(bars
                .Where(bar => keys.Contains(bar.Instrument.Key) && bar.Date >= from && bar.Date <= to)
                .ToArray());
        }

        public Task<IReadOnlyList<IntradayBar>> GetIntradayBarsAsync(
            Instrument instrument,
            DateOnly date,
            TimeOnly from,
            TimeOnly to,
            BarInterval interval,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<IntradayBar>>([]);
    }
}
