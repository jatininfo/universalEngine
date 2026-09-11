using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Domain.Tests;

public sealed class RiskSizingServiceTests
{
    private static readonly Instrument Instrument = new("ABC", Exchange.Nse);
    private readonly RiskSizingService _service = new();

    [Fact]
    public void Size_ApprovesPlanWithinConfiguredCapitalAndRisk()
    {
        var result = _service.Size(
            new TradePlanRequest(Instrument, SignalDirection.Long, EntryPrice: 100m, StopPrice: 98m, TargetPrice: 106m),
            RiskProfile.Default);

        Assert.True(result.IsApproved);
        Assert.NotNull(result.TradePlan);
        Assert.Equal(200, result.TradePlan.Quantity);
        Assert.Equal(20000m, result.TradePlan.NotionalAmount);
        Assert.Equal(400m, result.TradePlan.PlannedRiskAmount);
    }

    [Fact]
    public void Size_UsesConfiguredCapitalAmount()
    {
        var profile = RiskProfile.Default with { CapitalAmount = 10000m };

        var result = _service.Size(
            new TradePlanRequest(Instrument, SignalDirection.Long, EntryPrice: 100m, StopPrice: 98m),
            profile);

        Assert.False(result.IsApproved);
        Assert.Equal(RiskRejectionReason.NotionalExceedsCapital, result.RejectionReason);
    }

    [Fact]
    public void Size_RejectsZeroStopDistance()
    {
        var result = _service.Size(
            new TradePlanRequest(Instrument, SignalDirection.Long, EntryPrice: 100m, StopPrice: 100m),
            RiskProfile.Default);

        Assert.False(result.IsApproved);
        Assert.Equal(RiskRejectionReason.StopDistanceIsZero, result.RejectionReason);
    }

    [Fact]
    public void Size_RejectsQuantityZeroWhenStopDistanceIsTooWide()
    {
        var result = _service.Size(
            new TradePlanRequest(Instrument, SignalDirection.Long, EntryPrice: 1000m, StopPrice: 500m),
            RiskProfile.Default);

        Assert.False(result.IsApproved);
        Assert.Equal(RiskRejectionReason.QuantityIsZero, result.RejectionReason);
    }

    [Fact]
    public void Size_RejectsPlannedRiskBelowMinimumByDefault()
    {
        var profile = RiskProfile.Default with { MinPlannedRiskAmount = 350m, MaxPlannedRiskAmount = 400m };

        var result = _service.Size(
            new TradePlanRequest(Instrument, SignalDirection.Long, EntryPrice: 400m, StopPrice: 100m),
            profile);

        Assert.False(result.IsApproved);
        Assert.Equal(RiskRejectionReason.PlannedRiskBelowMinimum, result.RejectionReason);
    }

    [Fact]
    public void Size_AllowsSmallRiskAlertsWhenConfigured()
    {
        var profile = RiskProfile.Default with
        {
            MinPlannedRiskAmount = 350m,
            MaxPlannedRiskAmount = 400m,
            AllowSmallRiskAlerts = true
        };

        var result = _service.Size(
            new TradePlanRequest(Instrument, SignalDirection.Long, EntryPrice: 400m, StopPrice: 100m),
            profile);

        Assert.True(result.IsApproved);
        Assert.NotNull(result.TradePlan);
        Assert.Equal(300m, result.TradePlan.PlannedRiskAmount);
    }
}
