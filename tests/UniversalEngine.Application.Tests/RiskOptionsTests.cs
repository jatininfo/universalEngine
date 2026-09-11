using UniversalEngine.Application.Configuration;

namespace UniversalEngine.Application.Tests;

public sealed class RiskOptionsTests
{
    [Fact]
    public void ToRiskProfile_MapsConfigurableCapitalAndRisk()
    {
        var options = new RiskOptions
        {
            CapitalAmount = 50000m,
            MinPlannedRiskAmount = 250m,
            MaxPlannedRiskAmount = 750m,
            MaxActiveSignals = 5,
            AllowSmallRiskAlerts = true
        };

        var profile = options.ToRiskProfile();

        Assert.Equal(50000m, profile.CapitalAmount);
        Assert.Equal(250m, profile.MinPlannedRiskAmount);
        Assert.Equal(750m, profile.MaxPlannedRiskAmount);
        Assert.Equal(5, profile.MaxActiveSignals);
        Assert.True(profile.AllowSmallRiskAlerts);
    }
}
