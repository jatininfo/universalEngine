namespace UniversalEngine.Worker;

public class Worker(
    ILogger<Worker> logger,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.RiskOptions> riskOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.MarketDataOptions> marketDataOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.ScannerRunOptions> scannerRunOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.PreMarketOptions> preMarketOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.OpeningRangeOptions> openingRangeOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.LiveValidationOptions> liveValidationOptions,
    Microsoft.Extensions.Options.IOptions<UniversalEngine.Application.Configuration.MonitoringOptions> monitoringOptions,
    EodStartupScannerRunner eodStartupScannerRunner,
    PreMarketScannerRunner preMarketScannerRunner,
    OpeningRangeScannerRunner openingRangeScannerRunner,
    LiveValidationScannerRunner liveValidationScannerRunner,
    SignalMonitorRunner signalMonitorRunner,
    IHostApplicationLifetime hostApplicationLifetime) : BackgroundService
{
    private DateOnly? _lastScheduledEodRunDate;
    private DateOnly? _lastScheduledPreMarketRunDate;
    private DateOnly? _lastScheduledOpeningRangeRunDate;
    private DateTimeOffset? _lastLiveValidationRunAt;
    private DateTimeOffset? _lastMonitorRunAt;

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

            if (preMarketOptions.Value.Enabled &&
                preMarketOptions.Value.EnableScheduledScan &&
                ShouldRunScheduledPreMarket(preMarketOptions.Value, DateTimeOffset.Now))
            {
                var sessionDate = DateOnly.FromDateTime(DateTime.Today);
                _lastScheduledPreMarketRunDate = sessionDate;
                await preMarketScannerRunner.RunAsync(sessionDate, stoppingToken);
            }

            if (openingRangeOptions.Value.Enabled &&
                openingRangeOptions.Value.EnableScheduledScan &&
                ShouldRunScheduledOpeningRange(openingRangeOptions.Value, DateTimeOffset.Now))
            {
                var sessionDate = DateOnly.FromDateTime(DateTime.Today);
                _lastScheduledOpeningRangeRunDate = sessionDate;
                await openingRangeScannerRunner.RunAsync(sessionDate, stoppingToken);
            }

            if (liveValidationOptions.Value.Enabled &&
                liveValidationOptions.Value.EnableScheduledScan &&
                ShouldRunScheduledLiveValidation(liveValidationOptions.Value, DateTimeOffset.Now, out var liveFrom, out var liveTo))
            {
                _lastLiveValidationRunAt = DateTimeOffset.Now;
                await liveValidationScannerRunner.RunAsync(
                    DateOnly.FromDateTime(DateTime.Today),
                    liveFrom,
                    liveTo,
                    stoppingToken);
            }

            if (monitoringOptions.Value.Enabled &&
                monitoringOptions.Value.EnableScheduledScan &&
                ShouldRunScheduledMonitoring(monitoringOptions.Value, DateTimeOffset.Now, out var monitorFrom, out var monitorTo))
            {
                _lastMonitorRunAt = DateTimeOffset.Now;
                await signalMonitorRunner.RunAsync(
                    DateOnly.FromDateTime(DateTime.Today),
                    monitorFrom,
                    monitorTo,
                    stoppingToken);
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

    private bool ShouldRunScheduledPreMarket(
        UniversalEngine.Application.Configuration.PreMarketOptions options,
        DateTimeOffset now)
    {
        var today = DateOnly.FromDateTime(now.Date);
        if (_lastScheduledPreMarketRunDate == today)
        {
            return false;
        }

        return TimeOnly.FromDateTime(now.DateTime) >= options.GetRunTime();
    }

    private bool ShouldRunScheduledLiveValidation(
        UniversalEngine.Application.Configuration.LiveValidationOptions options,
        DateTimeOffset now,
        out TimeOnly from,
        out TimeOnly to)
    {
        to = TimeOnly.FromDateTime(now.DateTime);
        from = to.AddMinutes(-Math.Max(1, options.PollMinutes));

        var currentTime = TimeOnly.FromDateTime(now.DateTime);
        if (currentTime < options.GetStartTime() || currentTime > options.GetEndTime())
        {
            return false;
        }

        if (_lastLiveValidationRunAt is null)
        {
            return true;
        }

        return now - _lastLiveValidationRunAt >= TimeSpan.FromMinutes(Math.Max(1, options.PollMinutes));
    }

    private bool ShouldRunScheduledOpeningRange(
        UniversalEngine.Application.Configuration.OpeningRangeOptions options,
        DateTimeOffset now)
    {
        var today = DateOnly.FromDateTime(now.Date);
        if (_lastScheduledOpeningRangeRunDate == today)
        {
            return false;
        }

        var runTime = options.GetMarketOpenTime()
            .AddMinutes(options.RangeMinutes)
            .AddMinutes((int)options.Interval);

        return TimeOnly.FromDateTime(now.DateTime) >= runTime;
    }

    private bool ShouldRunScheduledMonitoring(
        UniversalEngine.Application.Configuration.MonitoringOptions options,
        DateTimeOffset now,
        out TimeOnly from,
        out TimeOnly to)
    {
        to = TimeOnly.FromDateTime(now.DateTime);
        from = to.AddMinutes(-Math.Max(1, options.PollMinutes));

        var currentTime = TimeOnly.FromDateTime(now.DateTime);
        if (currentTime < options.GetStartTime() || currentTime > options.GetEndTime())
        {
            return false;
        }

        if (_lastMonitorRunAt is null)
        {
            return true;
        }

        return now - _lastMonitorRunAt >= TimeSpan.FromMinutes(Math.Max(1, options.PollMinutes));
    }
}
