namespace UniversalEngine.Worker;

public class Worker(
    ILogger<Worker> logger,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.RiskOptions> riskOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.MarketDataOptions> marketDataOptions) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "UniversalEngine scanner starting with primary provider {PrimaryProvider}, capital {CapitalAmount}, risk range {MinRisk}-{MaxRisk}.",
            marketDataOptions.Value.PrimaryProvider,
            riskOptions.Value.CapitalAmount,
            riskOptions.Value.MinPlannedRiskAmount,
            riskOptions.Value.MaxPlannedRiskAmount);

        while (!stoppingToken.IsCancellationRequested)
        {
            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation("Scanner worker heartbeat at: {Time}", DateTimeOffset.Now);
            }
            await Task.Delay(1000, stoppingToken);
        }
    }
}
