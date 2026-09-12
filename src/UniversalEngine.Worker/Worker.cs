namespace UniversalEngine.Worker;

public class Worker(
    ILogger<Worker> logger,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.RiskOptions> riskOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.MarketDataOptions> marketDataOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.ScannerRunOptions> scannerRunOptions,
    EodStartupScannerRunner eodStartupScannerRunner,
    IHostApplicationLifetime hostApplicationLifetime) : BackgroundService
{
    private DateOnly? _lastScheduledEodRunDate;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "UniversalEngine scanner starting with primary provider {PrimaryProvider}, capital {CapitalAmount}, risk range {MinRisk}-{MaxRisk}.",
            marketDataOptions.Value.PrimaryProvider,
            riskOptions.Value.CapitalAmount,
            riskOptions.Value.MinPlannedRiskAmount,
            riskOptions.Value.MaxPlannedRiskAmount);

        if (scannerRunOptions.Value.RunEodOnStartup)
        {
            await eodStartupScannerRunner.RunAsync(stoppingToken);

            if (scannerRunOptions.Value.StopAfterStartupRun)
            {
                logger.LogInformation("Stopping worker after configured startup EOD scan.");
                hostApplicationLifetime.StopApplication();
                return;
            }
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            if (scannerRunOptions.Value.EnableScheduledEodScan &&
                ShouldRunScheduledEod(scannerRunOptions.Value, DateTimeOffset.Now))
            {
                _lastScheduledEodRunDate = DateOnly.FromDateTime(DateTime.Today);
                await eodStartupScannerRunner.RunAsync(stoppingToken);
            }

            await Task.Delay(
                TimeSpan.FromSeconds(Math.Max(5, scannerRunOptions.Value.SchedulerPollSeconds)),
                stoppingToken);
        }
    }

    private bool ShouldRunScheduledEod(
        UniversalEngine.Application.Configuration.ScannerRunOptions options,
        DateTimeOffset now)
    {
        var today = DateOnly.FromDateTime(now.Date);
        if (_lastScheduledEodRunDate == today)
        {
            return false;
        }

        if (!TimeOnly.TryParse(options.EodRunTimeLocal, out var runTime))
        {
            logger.LogWarning("Invalid ScannerRun:EodRunTimeLocal value {RunTime}. Expected HH:mm.", options.EodRunTimeLocal);
            return false;
        }

        return TimeOnly.FromDateTime(now.DateTime) >= runTime;
    }
}
