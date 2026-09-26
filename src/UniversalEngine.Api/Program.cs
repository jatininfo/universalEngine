using System.Text.Json;
using System.Text.Json.Nodes;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Ai;
using UniversalEngine.Application.Analysis;
using UniversalEngine.Application.Backtesting;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Notifications;
using UniversalEngine.Application.PaperTrading;
using UniversalEngine.Application.ReadModels;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Application.Trading;
using UniversalEngine.Domain.Market;
using UniversalEngine.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.AddFilter("System.Net.Http.HttpClient.TelegramNotificationSender", LogLevel.None);
builder.Logging.AddFilter("System.Net.Http.HttpClient.DhanMarketDataProvider", LogLevel.Warning);
builder.Logging.AddFilter("System.Net.Http.HttpClient.BrokerConnectionVerifier", LogLevel.Warning);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
var workerLocalConfigPath = Path.GetFullPath(Path.Combine(
    builder.Environment.ContentRootPath,
    "..",
    "UniversalEngine.Worker",
    "appsettings.Local.json"));
builder.Configuration.AddJsonFile(workerLocalConfigPath, optional: true, reloadOnChange: true);
builder.Services.Configure<RiskOptions>(
    builder.Configuration.GetSection(RiskOptions.SectionName));
builder.Services.Configure<MarketDataOptions>(
    builder.Configuration.GetSection(MarketDataOptions.SectionName));
builder.Services.Configure<AnalysisDataOptions>(
    builder.Configuration.GetSection(AnalysisDataOptions.SectionName));
builder.Services.Configure<EodScannerOptions>(
    builder.Configuration.GetSection(EodScannerOptions.SectionName));
builder.Services.Configure<PreMarketOptions>(
    builder.Configuration.GetSection(PreMarketOptions.SectionName));
builder.Services.Configure<OpeningRangeOptions>(
    builder.Configuration.GetSection(OpeningRangeOptions.SectionName));
builder.Services.Configure<LiveValidationOptions>(
    builder.Configuration.GetSection(LiveValidationOptions.SectionName));
builder.Services.Configure<MonitoringOptions>(
    builder.Configuration.GetSection(MonitoringOptions.SectionName));
builder.Services.Configure<AiAnalysisOptions>(
    builder.Configuration.GetSection(AiAnalysisOptions.SectionName));
builder.Services.Configure<BacktestOptions>(
    builder.Configuration.GetSection(BacktestOptions.SectionName));
builder.Services.Configure<ScannerRunOptions>(
    builder.Configuration.GetSection(ScannerRunOptions.SectionName));
builder.Services.Configure<NotificationOptions>(
    builder.Configuration.GetSection(NotificationOptions.SectionName));
builder.Services.Configure<PersistenceOptions>(
    builder.Configuration.GetSection(PersistenceOptions.SectionName));
builder.Services.AddSingleton<TechnicalIndicatorService>();
builder.Services.AddSingleton<ScannerScoringService>();
builder.Services.AddSingleton<EodCandidateGenerationService>();
builder.Services.AddSingleton<PreMarketFilterService>();
builder.Services.AddSingleton<OpeningRangeValidationService>();
builder.Services.AddSingleton<LiveValidationService>();
builder.Services.AddSingleton<SignalMonitoringService>();
builder.Services.AddSingleton<PaperTradingService>();
builder.Services.AddSingleton<AiAnalysisService>();
builder.Services.AddSingleton<BacktestReplayService>();
builder.Services.AddSingleton<RiskVerdictService>();
builder.Services.AddSingleton<TradePlanGenerationService>();
builder.Services.AddSingleton<NotificationTriggerService>();
builder.Services.AddUniversalEngineInfrastructure();

// Swagger / OpenAPI for testing
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("DashboardDevelopment", policy =>
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:7089",
                "http://127.0.0.1:7089")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();
// Global exception handler: return structured JSON for unhandled exceptions
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var ex = feature?.Error;
        var payload = new { message = "An unexpected error occurred.", detail = ex?.Message };
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(payload);
    });
});
// Enable Swagger UI for API testing
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("DashboardDevelopment");

app.MapGet("/", () => Results.Ok(new
{
    service = "UniversalEngine.Api",
    status = "running",
    dashboard = "http://127.0.0.1:5173/",
    swagger = "/swagger",
    endpoints = new[]
    {
        "/health",
        "/broker/status",
        "/settings/data-sources",
        "/pipeline/status?sessionDate=YYYY-MM-DD",
        "/scanner/runs/latest?limit=10",
        "/backtests/runs/latest?limit=10",
        "/paper-trading/runs/latest?limit=10",
        "/ai/runs/latest?limit=10",
        "/events/latest?limit=25"
    }
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "UniversalEngine.Api"
}));

app.MapGet("/broker/status", async (
    IBrokerConnectionVerifier brokerConnectionVerifier,
    CancellationToken cancellationToken) =>
{
    var statuses = await brokerConnectionVerifier.GetStatusesAsync(cancellationToken);
    return Results.Ok(statuses);
});

app.MapGet("/settings/data-sources", (
    Microsoft.Extensions.Options.IOptionsMonitor<MarketDataOptions> marketDataOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<AnalysisDataOptions> analysisDataOptions) =>
{
    var marketData = marketDataOptions.CurrentValue;
    var analysisData = analysisDataOptions.CurrentValue;
    var resolvedCacheRoot = ResolveHistoricalCacheRoot(analysisData);
    var cacheEntryCount = Directory.Exists(resolvedCacheRoot)
        ? Directory.EnumerateFiles(resolvedCacheRoot, "*_daily.json").Count()
        : 0;

    return Results.Ok(new DataSourceSettingsResponse(
        AnalysisProvider: analysisData.PrimaryProvider.ToString(),
        BrokerProvider: marketData.PrimaryProvider.ToString(),
        HistoricalCacheEnabled: analysisData.UseHistoricalCache,
        HistoricalCacheTtlHours: analysisData.HistoricalCacheTtlHours,
        HistoricalCacheRoot: resolvedCacheRoot,
        HistoricalCacheEntryCount: cacheEntryCount,
        Message: "EOD analysis/backtesting use AnalysisData and may reuse historical daily-bar cache. Intraday/final validation and broker checks use live broker calls."));
});

app.MapGet("/settings/application", (
    Microsoft.Extensions.Options.IOptionsMonitor<RiskOptions> riskOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<EodScannerOptions> eodOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<AnalysisDataOptions> analysisOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<MarketDataOptions> marketDataOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<PreMarketOptions> preMarketOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<OpeningRangeOptions> openingRangeOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<LiveValidationOptions> liveValidationOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<MonitoringOptions> monitoringOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<BacktestOptions> backtestOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<AiAnalysisOptions> aiOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<NotificationOptions> notificationOptions) =>
{
    var risk = riskOptions.CurrentValue;
    var eod = eodOptions.CurrentValue;
    var analysis = analysisOptions.CurrentValue;
    var marketData = marketDataOptions.CurrentValue;
    var preMarket = preMarketOptions.CurrentValue;
    var openingRange = openingRangeOptions.CurrentValue;
    var liveValidation = liveValidationOptions.CurrentValue;
    var monitoring = monitoringOptions.CurrentValue;
    var backtest = backtestOptions.CurrentValue;
    var ai = aiOptions.CurrentValue;
    var notifications = notificationOptions.CurrentValue;
    return Results.Ok(new ApplicationSettingsResponse(
        new RiskSettingsResponse(
            risk.CapitalAmount,
            risk.MinPlannedRiskAmount,
            risk.MaxPlannedRiskAmount,
            risk.MaxActiveSignals,
            risk.AllowSmallRiskAlerts),
        new EodScannerSettingsResponse(
            eod.LookbackDays,
            eod.MinimumAverageTradedValue,
            eod.MinimumVolumeExpansionRatio,
            eod.NearHighCloseThreshold,
            eod.NearLowCloseThreshold,
            eod.MaxDailyDataAgeHours,
            eod.MinimumAcceptedScore,
            eod.MaxAcceptedCandidates,
            eod.FactorWeights),
        new AnalysisSettingsResponse(
            analysis.PrimaryProvider.ToString(),
            analysis.UseHistoricalCache,
            analysis.HistoricalCacheTtlHours),
        new BrokerSettingsResponse(
            marketData.PrimaryProvider.ToString(),
            new DhanBrokerSettingsResponse(
                marketData.Dhan.BaseUrl,
                marketData.Dhan.ClientId ?? string.Empty,
                MaskSecret(marketData.Dhan.GetAccessToken()),
                string.Empty,
                marketData.Dhan.InstrumentType,
                marketData.Dhan.IncludeOpenInterest,
                marketData.Dhan.RetryCount,
                marketData.Dhan.RetryBaseDelayMs,
                marketData.Dhan.RequestThrottleDelayMs)),
        new StageSettingsResponse(
            new PreMarketSettingsResponse(
                preMarket.Enabled,
                preMarket.EnableScheduledScan,
                preMarket.RunTimeLocal,
                preMarket.MaxAllowedGapPercent,
                preMarket.AllowWhenPreMarketDataUnavailable),
            new OpeningRangeSettingsResponse(
                openingRange.Enabled,
                openingRange.EnableScheduledScan,
                openingRange.RangeMinutes,
                openingRange.Interval.ToString(),
                openingRange.MarketOpenTime,
                openingRange.BreakoutBufferTicks,
                openingRange.TargetRiskRewardRatio,
                openingRange.MaxIntradayDataAgeMinutes),
            new LiveValidationSettingsResponse(
                liveValidation.Enabled,
                liveValidation.EnableScheduledScan,
                liveValidation.Interval.ToString(),
                liveValidation.StartTime,
                liveValidation.EndTime,
                liveValidation.PollMinutes,
                liveValidation.ConfirmationBufferTicks,
                liveValidation.MaxIntradayDataAgeMinutes),
            new MonitoringSettingsResponse(
                monitoring.Enabled,
                monitoring.EnableScheduledScan,
                monitoring.Interval.ToString(),
                monitoring.StartTime,
                monitoring.EndTime,
                monitoring.PollMinutes,
                monitoring.MaxIntradayDataAgeMinutes)),
        new BacktestSettingsResponse(
            backtest.FromDate,
            backtest.ToDate,
            backtest.MaxHoldingDays,
            backtest.UseStopTargetSimulation,
            backtest.TargetRiskRewardRatio,
            backtest.AssumeStopBeforeTargetWhenBothTouched),
        new AiSettingsResponse(
            ai.Enabled,
            ai.Provider,
            ai.PromptVersion,
            ai.MinimumTradeProbability),
        new NotificationSettingsResponse(
            notifications.Channel.ToString(),
            notifications.SendEodWatchlistNotifications,
            notifications.MinimumEodScoreToNotify,
            new TelegramSettingsResponse(
                MaskSecret(notifications.Telegram.BotToken),
                string.Empty,
                notifications.Telegram.ChatId ?? string.Empty),
            new EmailSettingsResponse(
                notifications.Email.SmtpHost ?? string.Empty,
                notifications.Email.SmtpPort,
                notifications.Email.UseSsl,
                notifications.Email.Username ?? string.Empty,
                MaskSecret(notifications.Email.Password),
                string.Empty,
                notifications.Email.From ?? string.Empty,
                notifications.Email.To ?? string.Empty)),
        "Broker credentials are write-only: existing access tokens are shown only as masked status. Saved setting changes apply to API runtime immediately; worker processes still need their own reload/restart."));
});

app.MapPut("/settings/application", async (
    ApplicationSettingsUpdateRequest request,
    CancellationToken cancellationToken) =>
{
    if (request.Risk.CapitalAmount <= 0 ||
        request.Risk.MinPlannedRiskAmount < 0 ||
        request.Risk.MaxPlannedRiskAmount < request.Risk.MinPlannedRiskAmount ||
        request.Risk.MaxActiveSignals < 1)
    {
        return Results.BadRequest(new { message = "Risk settings are invalid." });
    }

    if (request.EodScanner.LookbackDays < 1 ||
        request.EodScanner.MinimumAverageTradedValue < 0 ||
        request.EodScanner.MinimumVolumeExpansionRatio < 0 ||
        request.EodScanner.NearHighCloseThreshold < 0 ||
        request.EodScanner.NearHighCloseThreshold > 1 ||
        request.EodScanner.NearLowCloseThreshold < 0 ||
        request.EodScanner.NearLowCloseThreshold > 1 ||
        request.EodScanner.MaxDailyDataAgeHours < 1 ||
        request.EodScanner.MinimumAcceptedScore < 0 ||
        request.EodScanner.MaxAcceptedCandidates < 0 ||
        request.EodScanner.FactorWeights is null ||
        request.EodScanner.FactorWeights.Values.Any(weight => weight < 0))
    {
        return Results.BadRequest(new { message = "EOD scanner settings are invalid." });
    }

    if (!Enum.TryParse<MarketDataProviderKind>(request.Analysis.PrimaryProvider, ignoreCase: true, out var provider) ||
        provider is not (MarketDataProviderKind.Dhan or MarketDataProviderKind.Csv))
    {
        return Results.BadRequest(new { message = "Analysis provider must be Dhan or Csv." });
    }

    if (request.Analysis.HistoricalCacheTtlHours < 0)
    {
        return Results.BadRequest(new { message = "Historical cache TTL cannot be negative." });
    }

    if (!Enum.TryParse<MarketDataProviderKind>(request.Broker.PrimaryProvider, ignoreCase: true, out var brokerProvider) ||
        brokerProvider is not (MarketDataProviderKind.Dhan or MarketDataProviderKind.Zerodha or MarketDataProviderKind.Groww or MarketDataProviderKind.Csv))
    {
        return Results.BadRequest(new { message = "Broker provider must be Dhan, Zerodha, Groww, or Csv." });
    }

    if (string.IsNullOrWhiteSpace(request.Broker.Dhan.BaseUrl) ||
        string.IsNullOrWhiteSpace(request.Broker.Dhan.InstrumentType) ||
        request.Broker.Dhan.RetryCount < 0 ||
        request.Broker.Dhan.RetryBaseDelayMs < 0 ||
        request.Broker.Dhan.RequestThrottleDelayMs < 0)
    {
        return Results.BadRequest(new { message = "Dhan broker settings are invalid." });
    }

    if (request.Stages.PreMarket.MaxAllowedGapPercent < 0 ||
        request.Stages.OpeningRange.RangeMinutes < 1 ||
        request.Stages.OpeningRange.BreakoutBufferTicks < 0 ||
        request.Stages.OpeningRange.TargetRiskRewardRatio <= 0 ||
        request.Stages.OpeningRange.MaxIntradayDataAgeMinutes < 1 ||
        request.Stages.LiveValidation.PollMinutes < 1 ||
        request.Stages.LiveValidation.ConfirmationBufferTicks < 0 ||
        request.Stages.LiveValidation.MaxIntradayDataAgeMinutes < 1 ||
        request.Stages.Monitoring.PollMinutes < 1 ||
        request.Stages.Monitoring.MaxIntradayDataAgeMinutes < 1)
    {
        return Results.BadRequest(new { message = "Pipeline stage settings are invalid." });
    }

    if (!Enum.TryParse<BarInterval>(request.Stages.OpeningRange.Interval, ignoreCase: true, out var openingInterval) ||
        !Enum.TryParse<BarInterval>(request.Stages.LiveValidation.Interval, ignoreCase: true, out var liveInterval) ||
        !Enum.TryParse<BarInterval>(request.Stages.Monitoring.Interval, ignoreCase: true, out var monitoringInterval))
    {
        return Results.BadRequest(new { message = "Stage interval must be OneMinute, FiveMinutes, or FifteenMinutes." });
    }

    if (request.Backtest.MaxHoldingDays < 1 ||
        request.Backtest.TargetRiskRewardRatio <= 0 ||
        request.Ai.MinimumTradeProbability < 0 ||
        request.Ai.MinimumTradeProbability > 100 ||
        request.Notifications.MinimumEodScoreToNotify < 0 ||
        request.Notifications.Telegram is null ||
        request.Notifications.Email is null ||
        request.Notifications.Email.SmtpPort < 1)
    {
        return Results.BadRequest(new { message = "Backtest, AI, or notification settings are invalid." });
    }

    if (!Enum.TryParse<NotificationChannel>(request.Notifications.Channel, ignoreCase: true, out var notificationChannel))
    {
        return Results.BadRequest(new { message = "Notification channel must be Console, Telegram, or Email." });
    }

    await SaveApplicationSettingsAsync(workerLocalConfigPath, request, provider, brokerProvider, cancellationToken);
    builder.Configuration.Reload();
    return Results.Ok(new
    {
        message = "Settings saved to local config and applied to the API runtime.",
        requiresRestart = false
    });
});

app.MapGet("/pipeline/status", async (
    string? sessionDate,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    IScannerRepository repository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    CancellationToken cancellationToken) =>
{
    var options = scannerOptions.Value;
    var universe = await ResolveScannerUniverseAsync(universeRepository, options, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    var date = ParseSessionDate(sessionDate, DateOnly.FromDateTime(DateTime.Today));
    var duplicateInstrumentKeys = instruments
        .GroupBy(instrument => instrument.Key)
        .Where(group => group.Count() > 1)
        .Select(group => group.Key)
        .OrderBy(key => key)
        .ToArray();

    if (instruments.Count == 0)
    {
        return Results.Ok(new PipelineStatusResponse(
            date,
            0,
            [],
            "No ScannerRun instruments are configured.",
            [
                PipelineStageStatus.Blocked("EOD", 0, "Configure ScannerRun instruments before running the scanner."),
                PipelineStageStatus.Blocked("Pre-market", 0, "Configure ScannerRun instruments before running pre-market."),
                PipelineStageStatus.Blocked("Opening range", 0, "Configure ScannerRun instruments before running opening range."),
                PipelineStageStatus.Blocked("Live validation", 0, "Configure ScannerRun instruments before running live validation."),
                PipelineStageStatus.Blocked("Monitor", 0, "Configure ScannerRun instruments before monitoring.")
            ]));
    }

    var latestEodRuns = await repository.GetLatestRunsAsync(25, cancellationToken);
    var latestEodRunForDate = latestEodRuns.FirstOrDefault(run => run.SessionDate == date);
    var acceptedEodBeforeSession = await repository.GetLatestAcceptedEodCandidatesAsync(date, instruments, cancellationToken);
    var acceptedPreMarketForSession = await repository.GetLatestAcceptedPreMarketCandidatesAsync(date, instruments, cancellationToken);
    var openingCandidatesForSession = await repository.GetLatestOpeningRangeTradeCandidatesAsync(date, instruments, cancellationToken);
    var liveCandidatesForSession = await repository.GetLatestLiveValidationTradeCandidatesAsync(date, instruments, cancellationToken);
    var preMarketSourceCount = acceptedPreMarketForSession.Count > 0
        ? acceptedPreMarketForSession.Count
        : acceptedEodBeforeSession.Count;
    var openingSourceCount = acceptedPreMarketForSession.Count > 0
        ? acceptedPreMarketForSession.Count
        : acceptedEodBeforeSession.Count;
    var monitorSourceCount = liveCandidatesForSession.Count > 0
        ? liveCandidatesForSession.Count
        : openingCandidatesForSession.Count;

    var eodMessage = latestEodRunForDate is null
        ? "Runs the EOD scanner for the selected date. Accepted EOD results are used by later session dates."
        : $"Latest EOD run for this date accepted {latestEodRunForDate.AcceptedCount} and rejected {latestEodRunForDate.RejectedCount}. Later stages for this same date still use accepted EOD candidates from before this session.";

    return Results.Ok(new PipelineStatusResponse(
        date,
        instruments.Count,
        duplicateInstrumentKeys,
        duplicateInstrumentKeys.Length == 0
            ? "Pre-market, opening, live validation, and monitor depend on accepted candidates from earlier stages. No orders are placed by these runs."
            : "Pre-market, opening, live validation, and monitor depend on accepted candidates from earlier stages. Duplicate instrument config keys were detected and only the first entry for each key is used for candidate loading.",
        [
            new PipelineStageStatus("EOD", true, instruments.Count, eodMessage),
            PipelineStageStatus.FromCandidateCount(
                "Pre-market",
                preMarketSourceCount,
                acceptedPreMarketForSession.Count > 0
                    ? "Ready: accepted pre-market candidates already exist for this session."
                    : "Ready: accepted EOD candidates exist before this session.",
                "Needs accepted EOD candidates from a date before this session. EOD from the same session date does not feed pre-market."),
            PipelineStageStatus.FromCandidateCount(
                "Opening range",
                openingSourceCount,
                acceptedPreMarketForSession.Count > 0
                    ? "Ready: accepted pre-market candidates exist for this session."
                    : "Ready: accepted EOD candidates exist before this session.",
                "Needs accepted pre-market candidates for this session, or accepted EOD candidates from before this session."),
            PipelineStageStatus.FromCandidateCount(
                "Live validation",
                openingCandidatesForSession.Count,
                "Ready: confirmed opening-range trade candidates exist for this session.",
                "Needs confirmed opening-range trade candidates for this session."),
            PipelineStageStatus.FromCandidateCount(
                "Monitor",
                monitorSourceCount,
                liveCandidatesForSession.Count > 0
                    ? "Ready: live-validation trade candidates exist for this session."
                    : "Ready: opening-range trade candidates exist for this session.",
                "Needs live-validation trade candidates, or confirmed opening-range trade candidates, for this session.")
        ]));
});

app.MapGet("/scanner/instruments", async (
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    CancellationToken cancellationToken) =>
{
    var state = await GetScannerStateAsync(universeRepository, scannerOptions.Value, cancellationToken);
    var instruments = state.Instruments
        .OrderBy(instrument => instrument.Exchange)
        .ThenBy(instrument => instrument.Symbol)
        .ToArray();

    return Results.Ok(new ScannerInstrumentsResponse(
        instruments.Length,
        GetDuplicateInstrumentKeys(state),
        state.Baskets.Select(basket => new ScannerBasketResponse(
            basket.Name,
            basket.Enabled,
            basket.MaxSymbols,
            basket.Instruments.Count,
            basket.Instruments.Select(ToScannerInstrumentResponse).ToArray())).ToArray(),
        state.Universes.Select(universe => new ScannerUniverseResponse(
            universe.Name,
            universe.Enabled,
            universe.InstrumentCount,
            universe.BasketNames,
            universe.DirectInstruments.Select(ToScannerInstrumentResponse).ToArray(),
            universe.Instruments.Select(ToScannerInstrumentResponse).ToArray())).ToArray(),
        instruments.Select(ToScannerInstrumentResponse).ToArray()));
});

app.MapPut("/scanner/instruments", async (
    ScannerInstrumentsUpdateRequest request,
    IInstrumentUniverseRepository universeRepository,
    CancellationToken cancellationToken) =>
{
    var cleaned = request.Instruments
        .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
        .Select(instrument => new InstrumentSettingsRequest(
            instrument.Symbol.Trim().ToUpperInvariant(),
            string.IsNullOrWhiteSpace(instrument.Exchange) ? "Nse" : instrument.Exchange.Trim(),
            string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
            string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim()))
        .ToArray();

    foreach (var instrument in cleaned)
    {
        if (!Enum.TryParse<UniversalEngine.Domain.Market.Exchange>(instrument.Exchange, ignoreCase: true, out _))
        {
            return Results.BadRequest(new { message = $"Unsupported exchange '{instrument.Exchange}' for {instrument.Symbol}." });
        }
    }

    var duplicateKeys = cleaned
        .GroupBy(instrument => $"{instrument.Exchange}:{instrument.Symbol}".ToUpperInvariant())
        .Where(group => group.Count() > 1)
        .Select(group => group.Key)
        .ToArray();

    if (duplicateKeys.Length > 0)
    {
        return Results.BadRequest(new { message = $"Duplicate instruments: {string.Join(", ", duplicateKeys)}" });
    }

    await universeRepository.SaveScannerInstrumentsAsync(cleaned.Select(ToScannerInstrumentDefinition).ToArray(), cancellationToken);
    return Results.Ok(new { message = "Scanner instruments saved to database.", count = cleaned.Length });
});

app.MapPut("/scanner/baskets", async (
    ScannerBasketsUpdateRequest request,
    IInstrumentUniverseRepository universeRepository,
    CancellationToken cancellationToken) =>
{
    var cleaned = request.Baskets
        .Where(basket => !string.IsNullOrWhiteSpace(basket.Name))
        .Select(basket => basket with
        {
            Name = basket.Name.Trim(),
            MaxSymbols = basket.MaxSymbols <= 0 ? 200 : basket.MaxSymbols,
            Instruments = basket.Instruments
                .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
                .Select(instrument => new InstrumentSettingsRequest(
                    instrument.Symbol.Trim().ToUpperInvariant(),
                    string.IsNullOrWhiteSpace(instrument.Exchange) ? "Nse" : instrument.Exchange.Trim(),
                    string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
                    string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim()))
                .ToArray()
        })
        .ToArray();

    foreach (var basket in cleaned)
    {
        foreach (var instrument in basket.Instruments)
        {
            if (!Enum.TryParse<UniversalEngine.Domain.Market.Exchange>(instrument.Exchange, ignoreCase: true, out _))
            {
                return Results.BadRequest(new { message = $"Unsupported exchange '{instrument.Exchange}' for {basket.Name}:{instrument.Symbol}." });
            }
        }
    }

    await universeRepository.SaveScannerBasketsAsync(cleaned.Select(basket => new ScannerBasketDefinition(
        basket.Name,
        basket.Enabled,
        basket.MaxSymbols,
        basket.Instruments.Count,
        basket.Instruments.Select(ToScannerInstrumentDefinition).ToArray())).ToArray(), cancellationToken);
    return Results.Ok(new { message = "Scanner baskets saved to database.", count = cleaned.Sum(basket => basket.Instruments.Count) });
});

app.MapPost("/scanner/baskets/predefined", async (
    IInstrumentUniverseRepository universeRepository,
    IInstrumentMasterProvider instrumentMasterProvider,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    CancellationToken cancellationToken) =>
{
    var state = await GetScannerStateAsync(universeRepository, scannerOptions.Value, cancellationToken);
    var existingByName = state.Baskets.ToDictionary(basket => basket.Name, StringComparer.OrdinalIgnoreCase);
    var predefined = new[]
    {
        new PredefinedBasketSeed("Nifty 50 Core", 50, ["RELIANCE", "HDFCBANK", "ICICIBANK", "INFY", "TCS", "LT", "ITC", "SBIN", "AXISBANK", "KOTAKBANK"]),
        new PredefinedBasketSeed("Bank Nifty Core", 15, ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK", "INDUSINDBK", "BANKBARODA", "FEDERALBNK", "PNB", "IDFCFIRSTB"]),
        new PredefinedBasketSeed("Nifty IT Core", 15, ["TCS", "INFY", "HCLTECH", "WIPRO", "TECHM", "LTIM", "MPHASIS", "PERSISTENT", "COFORGE"])
    };

    var seeded = new List<ScannerBasketDefinition>();
    foreach (var basket in predefined)
    {
        if (existingByName.ContainsKey(basket.Name))
        {
            continue;
        }

        var instruments = new List<ScannerInstrumentDefinition>();
        foreach (var symbol in basket.Symbols)
        {
            var match = (await instrumentMasterProvider.SearchAsync(symbol, "NSE", cancellationToken))
                .FirstOrDefault(result => string.Equals(result.Symbol, symbol, StringComparison.OrdinalIgnoreCase));
            if (match is not null)
            {
                instruments.Add(ToScannerInstrumentDefinitionFromLookup(match));
            }
        }

        seeded.Add(new ScannerBasketDefinition(
            basket.Name,
            true,
            basket.MaxSymbols,
            instruments.Count,
            instruments));
    }

    var nextBaskets = state.Baskets.Concat(seeded).ToArray();
    await universeRepository.SaveScannerBasketsAsync(nextBaskets, cancellationToken);
    var predefinedBasketNames = predefined
        .Select(basket => basket.Name)
        .Where(name => nextBaskets.Any(basket => string.Equals(basket.Name, name, StringComparison.OrdinalIgnoreCase)))
        .ToArray();
    var createdUniverse = false;
    if (predefinedBasketNames.Length > 0 &&
        !state.Universes.Any(universe => string.Equals(universe.Name, "Predefined Core Universe", StringComparison.OrdinalIgnoreCase)))
    {
        var universeInstruments = nextBaskets
            .Where(basket => predefinedBasketNames.Contains(basket.Name, StringComparer.OrdinalIgnoreCase))
            .SelectMany(basket => basket.Instruments.Take(basket.MaxSymbols <= 0 ? int.MaxValue : basket.MaxSymbols))
            .DistinctBy(instrument => instrument.Key)
            .ToArray();
        var defaultUniverse = new ScannerUniverseDefinition(
            "Predefined Core Universe",
            true,
            universeInstruments.Length,
            predefinedBasketNames,
            [],
            universeInstruments);
        await universeRepository.SaveScannerUniversesAsync(state.Universes.Concat([defaultUniverse]).ToArray(), cancellationToken);
        createdUniverse = true;
    }

    return Results.Ok(new { message = "Predefined baskets saved to database.", basketsCreated = seeded.Count, universeCreated = createdUniverse, instrumentCount = seeded.Sum(basket => basket.Instruments.Count) });
});

app.MapPut("/scanner/universes", async (
    ScannerUniversesUpdateRequest request,
    IInstrumentUniverseRepository universeRepository,
    CancellationToken cancellationToken) =>
{
    var cleaned = request.Universes
        .Where(universe => !string.IsNullOrWhiteSpace(universe.Name))
        .Select(universe => universe with
        {
            Name = universe.Name.Trim(),
            BasketNames = universe.BasketNames
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray(),
            DirectInstruments = universe.DirectInstruments
                .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
                .Select(instrument => new InstrumentSettingsRequest(
                    instrument.Symbol.Trim().ToUpperInvariant(),
                    string.IsNullOrWhiteSpace(instrument.Exchange) ? "Nse" : instrument.Exchange.Trim(),
                    string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
                    string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim()))
                .ToArray()
        })
        .ToArray();

    foreach (var universe in cleaned)
    {
        foreach (var instrument in universe.DirectInstruments)
        {
            if (!Enum.TryParse<UniversalEngine.Domain.Market.Exchange>(instrument.Exchange, ignoreCase: true, out _))
            {
                return Results.BadRequest(new { message = $"Unsupported exchange '{instrument.Exchange}' for {universe.Name}:{instrument.Symbol}." });
            }
        }
    }

    await universeRepository.SaveScannerUniversesAsync(cleaned.Select(universe => new ScannerUniverseDefinition(
        universe.Name,
        universe.Enabled,
        universe.DirectInstruments.Count,
        universe.BasketNames,
        universe.DirectInstruments.Select(ToScannerInstrumentDefinition).ToArray(),
        universe.DirectInstruments.Select(ToScannerInstrumentDefinition).ToArray())).ToArray(), cancellationToken);
    return Results.Ok(new { message = "Scanner universes saved to database.", count = cleaned.Length });
});

app.MapGet("/scanner/runs/latest", async (
    IScannerRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/scanner/runs/{runId}/candidates", async (
    string runId,
    IScannerRepository repository,
    CancellationToken cancellationToken) =>
{
    var candidates = await repository.GetCandidatesAsync(runId, cancellationToken);
    return Results.Ok(candidates);
});

app.MapPost("/pipeline/eod/run", async (
    string? sessionDate,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    EodCandidateGenerationService eodCandidateGenerationService,
    RiskVerdictService riskVerdictService,
    NotificationTriggerService notificationTriggerService,
    IScannerRepository repository,
    IEventLogRepository eventLogRepository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    Microsoft.Extensions.Options.IOptionsMonitor<MarketDataOptions> marketDataOptions,
    CancellationToken cancellationToken) =>
{
    var options = scannerOptions.Value;
    var universe = await ResolveScannerUniverseAsync(universeRepository, options, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    if (instruments.Count == 0)
    {
        return Results.BadRequest(new { message = "No ScannerRun instruments are configured." });
    }

    var date = ParseSessionDate(sessionDate, options.GetEodSessionDate(DateOnly.FromDateTime(DateTime.Today)));
    var result = await eodCandidateGenerationService.GenerateAsync(
        new EodCandidateGenerationRequest(instruments, date),
        cancellationToken);
    var verdicts = result.Decisions.Select(riskVerdictService.EvaluateEodCandidate).ToArray();
    await repository.SaveEodRunAsync(result, verdicts, marketDataOptions.CurrentValue.PrimaryProvider.ToString(), cancellationToken);
    await notificationTriggerService.NotifyEodVerdictsAsync(verdicts, result.SessionDate, cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "EOD", result.SessionDate, result.Decisions.Count, result.AcceptedCandidates.Count, result.RejectedCandidates.Count, cancellationToken);

    return Results.Ok(PipelineRunResponse.FromCounts(
        "EOD",
        result.SessionDate,
        result.Decisions.Count,
        result.AcceptedCandidates.Count,
        result.RejectedCandidates.Count,
        "EOD scanner run completed. No order was placed."));
});

app.MapGet("/pre-market/runs/latest", async (
    IScannerRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestPreMarketRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/pre-market/runs/{runId}/decisions", async (
    string runId,
    IScannerRepository repository,
    CancellationToken cancellationToken) =>
{
    var decisions = await repository.GetPreMarketDecisionsAsync(runId, cancellationToken);
    return Results.Ok(decisions);
});

app.MapPost("/pipeline/pre-market/run", async (
    string? sessionDate,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    PreMarketFilterService preMarketFilterService,
    IScannerRepository repository,
    IEventLogRepository eventLogRepository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    CancellationToken cancellationToken) =>
{
    var options = scannerOptions.Value;
    var universe = await ResolveScannerUniverseAsync(universeRepository, options, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    if (instruments.Count == 0)
    {
        return Results.BadRequest(new { message = "No ScannerRun instruments are configured." });
    }

    var date = ParseSessionDate(sessionDate, DateOnly.FromDateTime(DateTime.Today));
    var candidates = await repository.GetLatestAcceptedEodCandidatesAsync(date, instruments, cancellationToken);
    if (candidates.Count == 0)
    {
        return Results.Ok(PipelineRunResponse.Skipped("Pre-market", date, "No accepted EOD candidates were found before this session. EOD candidates from the same session date do not feed pre-market."));
    }

    var result = await preMarketFilterService.FilterAsync(new PreMarketFilterRequest(date, candidates), cancellationToken);
    await repository.SavePreMarketRunAsync(result, cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "Pre-market", result.SessionDate, result.Decisions.Count, result.Accepted.Count, result.Decisions.Count(decision => !decision.IsAccepted), cancellationToken);
    return Results.Ok(PipelineRunResponse.FromCounts(
        "Pre-market",
        result.SessionDate,
        result.Decisions.Count,
        result.Accepted.Count,
        result.Decisions.Count(decision => !decision.IsAccepted),
        "Pre-market scanner run completed. No order was placed."));
});

app.MapGet("/opening-range/runs/latest", async (
    IScannerRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestOpeningRangeRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/opening-range/runs/{runId}/decisions", async (
    string runId,
    IScannerRepository repository,
    CancellationToken cancellationToken) =>
{
    var decisions = await repository.GetOpeningRangeDecisionsAsync(runId, cancellationToken);
    return Results.Ok(decisions);
});

app.MapPost("/pipeline/opening-range/run", async (
    string? sessionDate,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    OpeningRangeValidationService openingRangeValidationService,
    TradePlanGenerationService tradePlanGenerationService,
    NotificationTriggerService notificationTriggerService,
    IScannerRepository repository,
    IEventLogRepository eventLogRepository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    CancellationToken cancellationToken) =>
{
    var options = scannerOptions.Value;
    var universe = await ResolveScannerUniverseAsync(universeRepository, options, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    if (instruments.Count == 0)
    {
        return Results.BadRequest(new { message = "No ScannerRun instruments are configured." });
    }

    var date = ParseSessionDate(sessionDate, DateOnly.FromDateTime(DateTime.Today));
    var candidates = await repository.GetLatestAcceptedPreMarketCandidatesAsync(date, instruments, cancellationToken);
    if (candidates.Count == 0)
    {
        candidates = await repository.GetLatestAcceptedEodCandidatesAsync(date, instruments, cancellationToken);
    }

    if (candidates.Count == 0)
    {
        return Results.Ok(PipelineRunResponse.Skipped("Opening range", date, "No accepted pre-market candidates for this session, and no accepted EOD candidates were found before this session."));
    }

    var result = await openingRangeValidationService.ValidateAsync(new OpeningRangeValidationRequest(date, candidates), cancellationToken);
    var tradePlanResults = result.Confirmed.Select(tradePlanGenerationService.CreateFromOpeningRangeCandidate).ToArray();
    await repository.SaveOpeningRangeRunAsync(result, tradePlanResults, cancellationToken);
    await notificationTriggerService.NotifyTradePlansAsync(tradePlanResults, result.SessionDate, cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "Opening range", result.SessionDate, result.Decisions.Count, result.Confirmed.Count, result.Decisions.Count(decision => !decision.IsAccepted), cancellationToken);
    return Results.Ok(PipelineRunResponse.FromCounts(
        "Opening range",
        result.SessionDate,
        result.Decisions.Count,
        result.Confirmed.Count,
        result.Decisions.Count(decision => !decision.IsAccepted),
        "Opening-range scanner run completed. No order was placed."));
});

app.MapGet("/live-validation/runs/latest", async (
    IScannerRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestLiveValidationRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/live-validation/runs/{runId}/decisions", async (
    string runId,
    IScannerRepository repository,
    CancellationToken cancellationToken) =>
{
    var decisions = await repository.GetLiveValidationDecisionsAsync(runId, cancellationToken);
    return Results.Ok(decisions);
});

app.MapPost("/pipeline/live-validation/run", async (
    string? sessionDate,
    string? from,
    string? to,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    OpeningRangeValidationService openingRangeValidationService,
    LiveValidationService liveValidationService,
    TradePlanGenerationService tradePlanGenerationService,
    NotificationTriggerService notificationTriggerService,
    IScannerRepository repository,
    IEventLogRepository eventLogRepository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    Microsoft.Extensions.Options.IOptions<LiveValidationOptions> liveOptions,
    CancellationToken cancellationToken) =>
{
    var options = scannerOptions.Value;
    var universe = await ResolveScannerUniverseAsync(universeRepository, options, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    if (instruments.Count == 0)
    {
        return Results.BadRequest(new { message = "No ScannerRun instruments are configured." });
    }

    var date = ParseSessionDate(sessionDate, DateOnly.FromDateTime(DateTime.Today));
    var windowStart = ParseTime(from, liveOptions.Value.GetStartTime());
    var windowEnd = ParseTime(to, liveOptions.Value.GetEndTime());
    var candidates = await repository.GetLatestOpeningRangeTradeCandidatesAsync(date, instruments, cancellationToken);
    if (candidates.Count == 0)
    {
        var prerequisiteCandidates = await repository.GetLatestAcceptedPreMarketCandidatesAsync(date, instruments, cancellationToken);
        if (prerequisiteCandidates.Count == 0)
        {
            prerequisiteCandidates = await repository.GetLatestAcceptedEodCandidatesAsync(date, instruments, cancellationToken);
        }

        if (prerequisiteCandidates.Count == 0)
        {
            return Results.Ok(PipelineRunResponse.Skipped("Live validation", date, "No pre-market, EOD, or confirmed opening-range candidates were found for this session."));
        }

        var openingResult = await openingRangeValidationService.ValidateAsync(new OpeningRangeValidationRequest(date, prerequisiteCandidates), cancellationToken);
        var openingTradePlans = openingResult.Confirmed.Select(tradePlanGenerationService.CreateFromOpeningRangeCandidate).ToArray();
        await repository.SaveOpeningRangeRunAsync(openingResult, openingTradePlans, cancellationToken);
        await notificationTriggerService.NotifyTradePlansAsync(openingTradePlans, openingResult.SessionDate, cancellationToken);
        await SavePipelineEventAsync(eventLogRepository, "Opening range", openingResult.SessionDate, openingResult.Decisions.Count, openingResult.Confirmed.Count, openingResult.Decisions.Count(decision => !decision.IsAccepted), cancellationToken);
        candidates = openingResult.Confirmed.ToArray();

        if (candidates.Count == 0)
        {
            return Results.Ok(PipelineRunResponse.Skipped("Live validation", date, "Opening-range prerequisite ran, but no candidates were confirmed for live validation."));
        }
    }

    var decisions = new List<UniversalEngine.Domain.Scanning.CandidateDecision>();
    foreach (var candidate in candidates)
    {
        var result = await liveValidationService.ValidateAsync(new LiveValidationRequest(date, windowStart, windowEnd, candidate), cancellationToken);
        decisions.Add(result.Decision);
    }

    var tradePlanResults = decisions
        .Where(decision => decision.IsAccepted)
        .Select(tradePlanGenerationService.CreateFromOpeningRangeCandidate)
        .ToArray();
    await repository.SaveLiveValidationRunAsync(date, windowStart, windowEnd, decisions, tradePlanResults, cancellationToken);
    await notificationTriggerService.NotifyLiveTradePlansAsync(tradePlanResults, date, windowStart, windowEnd, cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "Live validation", date, decisions.Count, decisions.Count(decision => decision.IsAccepted), decisions.Count(decision => !decision.IsAccepted), cancellationToken);
    return Results.Ok(PipelineRunResponse.FromCounts(
        "Live validation",
        date,
        decisions.Count,
        decisions.Count(decision => decision.IsAccepted),
        decisions.Count(decision => !decision.IsAccepted),
        "Live-validation scanner run completed. No order was placed."));
});

app.MapGet("/monitor/runs/latest", async (
    IScannerRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestMonitorRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/monitor/runs/{runId}/events", async (
    string runId,
    IScannerRepository repository,
    CancellationToken cancellationToken) =>
{
    var events = await repository.GetMonitorEventsAsync(runId, cancellationToken);
    return Results.Ok(events);
});

app.MapGet("/backtests/runs/latest", async (
    IBacktestReportRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestBacktestRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/backtests/runs/{runId}/trades", async (
    string runId,
    IBacktestReportRepository repository,
    CancellationToken cancellationToken) =>
{
    var trades = await repository.GetBacktestTradesAsync(runId, cancellationToken);
    return Results.Ok(trades);
});

app.MapPost("/backtests/run", async (
    string? fromDate,
    string? toDate,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    BacktestReplayService backtestReplayService,
    IBacktestReportRepository backtestReportRepository,
    IEventLogRepository eventLogRepository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    Microsoft.Extensions.Options.IOptions<BacktestOptions> backtestOptions,
    CancellationToken cancellationToken) =>
{
    var universe = await ResolveScannerUniverseAsync(universeRepository, scannerOptions.Value, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    if (instruments.Count == 0)
    {
        return Results.BadRequest(new { message = "No ScannerRun instruments are configured." });
    }

    var from = ParseSessionDate(fromDate, backtestOptions.Value.GetFromDate() ?? DateOnly.FromDateTime(DateTime.Today.AddDays(-5)));
    var to = ParseSessionDate(toDate, backtestOptions.Value.GetToDate() ?? DateOnly.FromDateTime(DateTime.Today.AddDays(-1)));
    if (from > to)
    {
        return Results.BadRequest(new { message = "Backtest from-date must be on or before to-date." });
    }

    var result = await backtestReplayService.RunAsync(from, to, instruments, cancellationToken);
    await backtestReportRepository.SaveBacktestRunAsync(result, cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "Backtest", to, result.Trades.Count, result.Wins, result.Losses + result.Flats + result.NoExitData, cancellationToken);

    return Results.Ok(PipelineRunResponse.FromCounts(
        "Backtest",
        to,
        result.Trades.Count,
        result.Wins,
        result.Losses + result.Flats + result.NoExitData,
        $"Backtest {from:yyyy-MM-dd} to {to:yyyy-MM-dd} completed. Win rate {result.WinRatePercent:0.##}%, average return {result.AverageReturnPercent:0.####}%."));
});

app.MapGet("/accuracy/backtests/summary", async (
    IBacktestReportRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestBacktestRunsAsync(limit ?? 100, cancellationToken);
    var signals = runs.Sum(run => run.Signals);
    var wins = runs.Sum(run => run.Wins);
    var losses = runs.Sum(run => run.Losses);
    var flats = runs.Sum(run => run.Flats);
    var noExitData = runs.Sum(run => run.NoExitData);
    var closedTrades = wins + losses;
    var weightedAverageReturn = signals == 0
        ? 0m
        : Math.Round(runs.Sum(run => run.AverageReturnPercent * run.Signals) / signals, 4);

    return Results.Ok(new BacktestAccuracySummaryResponse(
        runs.Count,
        signals,
        wins,
        losses,
        flats,
        noExitData,
        closedTrades == 0 ? 0m : Math.Round((decimal)wins / closedTrades * 100m, 2),
        weightedAverageReturn));
});

app.MapGet("/accuracy/backtests/by-direction", async (
    IBacktestReportRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestBacktestRunsAsync(limit ?? 100, cancellationToken);
    var trades = new List<UniversalEngine.Application.ReadModels.BacktestTradeSummary>();
    foreach (var run in runs)
    {
        trades.AddRange(await repository.GetBacktestTradesAsync(run.Id, cancellationToken));
    }

    var summaries = trades
        .GroupBy(trade => string.IsNullOrWhiteSpace(trade.Direction) ? "Unknown" : trade.Direction)
        .OrderBy(group => group.Key)
        .Select(group =>
        {
            var items = group.ToArray();
            var wins = items.Count(trade => trade.Outcome == "Win");
            var losses = items.Count(trade => trade.Outcome == "Loss");
            var flats = items.Count(trade => trade.Outcome == "Flat");
            var noExitData = items.Count(trade => trade.Outcome == "NoExitData");
            var closedTrades = wins + losses;
            var returnTrades = items.Where(trade => trade.ReturnPercent is not null).ToArray();
            return new BacktestCalibrationSummaryResponse(
                group.Key,
                items.Length,
                wins,
                losses,
                flats,
                noExitData,
                closedTrades == 0 ? 0m : Math.Round((decimal)wins / closedTrades * 100m, 2),
                returnTrades.Length == 0 ? 0m : Math.Round(returnTrades.Average(trade => trade.ReturnPercent!.Value), 4));
        })
        .ToArray();

    return Results.Ok(summaries);
});

app.MapGet("/paper-trading/runs/latest", async (
    IPaperTradingRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestPaperTradingRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/paper-trading/runs/{runId}/orders", async (
    string runId,
    IPaperTradingRepository repository,
    CancellationToken cancellationToken) =>
{
    var orders = await repository.GetPaperOrdersAsync(runId, cancellationToken);
    return Results.Ok(orders);
});

app.MapGet("/ai/runs/latest", async (
    IAiAnalysisRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestAiAnalysisRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/ai/runs/{runId}/decisions", async (
    string runId,
    IAiAnalysisRepository repository,
    CancellationToken cancellationToken) =>
{
    var decisions = await repository.GetAiAnalysisDecisionsAsync(runId, cancellationToken);
    return Results.Ok(decisions);
});

app.MapPost("/ai/run", async (
    string? sessionDate,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    AiAnalysisService aiAnalysisService,
    IScannerRepository scannerRepository,
    IAiAnalysisRepository aiAnalysisRepository,
    IEventLogRepository eventLogRepository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    CancellationToken cancellationToken) =>
{
    var options = scannerOptions.Value;
    var universe = await ResolveScannerUniverseAsync(universeRepository, options, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    if (instruments.Count == 0)
    {
        return Results.BadRequest(new { message = "No ScannerRun instruments are configured." });
    }

    var date = ParseSessionDate(sessionDate, DateOnly.FromDateTime(DateTime.Today));
    var candidates = await scannerRepository.GetLatestLiveValidationTradeCandidatesAsync(date, instruments, cancellationToken);
    if (candidates.Count == 0)
    {
        candidates = await scannerRepository.GetLatestOpeningRangeTradeCandidatesAsync(date, instruments, cancellationToken);
    }

    if (candidates.Count == 0)
    {
        return Results.Ok(PipelineRunResponse.Skipped("AI analysis", date, "No live-validation or opening-range trade candidates were found for AI analysis."));
    }

    var result = aiAnalysisService.Analyze(date, candidates);
    await aiAnalysisRepository.SaveAiAnalysisRunAsync(result, cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "AI analysis", date, candidates.Count, result.Decisions.Count(decision => decision.Recommendation == AiTradeRecommendation.TradeCandidate), result.Decisions.Count(decision => decision.Recommendation != AiTradeRecommendation.TradeCandidate), cancellationToken);
    return Results.Ok(PipelineRunResponse.FromCounts(
        "AI analysis",
        date,
        candidates.Count,
        result.Decisions.Count(decision => decision.Recommendation == AiTradeRecommendation.TradeCandidate),
        result.Decisions.Count(decision => decision.Recommendation != AiTradeRecommendation.TradeCandidate),
        "AI analysis run completed with validated structured output. No order was placed."));
});

app.MapPost("/paper-trading/run", async (
    string? sessionDate,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    PaperTradingService paperTradingService,
    IScannerRepository scannerRepository,
    IPaperTradingRepository paperTradingRepository,
    IEventLogRepository eventLogRepository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    CancellationToken cancellationToken) =>
{
    var options = scannerOptions.Value;
    var universe = await ResolveScannerUniverseAsync(universeRepository, options, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    if (instruments.Count == 0)
    {
        return Results.BadRequest(new { message = "No ScannerRun instruments are configured." });
    }

    var date = ParseSessionDate(sessionDate, DateOnly.FromDateTime(DateTime.Today));
    var candidates = await scannerRepository.GetLatestLiveValidationTradeCandidatesAsync(date, instruments, cancellationToken);
    var sourceStage = "Live validation";
    if (candidates.Count == 0)
    {
        candidates = await scannerRepository.GetLatestOpeningRangeTradeCandidatesAsync(date, instruments, cancellationToken);
        sourceStage = "Opening range";
    }

    if (candidates.Count == 0)
    {
        return Results.Ok(PipelineRunResponse.Skipped("Paper trading", date, "No live-validation or opening-range trade candidates were found for paper trading."));
    }

    var result = paperTradingService.CreateOrders(date, candidates, sourceStage);
    await paperTradingRepository.SavePaperTradingRunAsync(result, cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "Paper trading", date, candidates.Count, result.Orders.Count, candidates.Count - result.Orders.Count, cancellationToken);
    return Results.Ok(PipelineRunResponse.FromCounts(
        "Paper trading",
        date,
        candidates.Count,
        result.Orders.Count,
        candidates.Count - result.Orders.Count,
        "Paper trading run completed. Simulated orders were recorded only; no broker order was placed."));
});

app.MapPost("/paper-trading/mark-to-market", async (
    string? sessionDate,
    PaperTradingService paperTradingService,
    IMarketDataProvider marketDataProvider,
    IPaperTradingRepository paperTradingRepository,
    IEventLogRepository eventLogRepository,
    Microsoft.Extensions.Options.IOptions<MonitoringOptions> monitoringOptions,
    CancellationToken cancellationToken) =>
{
    var date = ParseSessionDate(sessionDate, DateOnly.FromDateTime(DateTime.Today));
    var orders = await paperTradingRepository.GetOpenPaperOrdersAsync(date, cancellationToken);
    if (orders.Count == 0)
    {
        return Results.Ok(PipelineRunResponse.Skipped("Paper mark-to-market", date, "No open paper orders were found for this session."));
    }

    var updated = 0;
    foreach (var order in orders)
    {
        var instrument = new UniversalEngine.Domain.Market.Instrument(
            order.Symbol,
            Enum.Parse<UniversalEngine.Domain.Market.Exchange>(order.Exchange, ignoreCase: true));
        var bars = await marketDataProvider.GetIntradayBarsAsync(
            instrument,
            date,
            monitoringOptions.Value.GetStartTime(),
            monitoringOptions.Value.GetEndTime(),
            UniversalEngine.Domain.Market.BarInterval.FiveMinutes,
            cancellationToken);
        var update = paperTradingService.Evaluate(order, bars);
        if (!update.HasChange || update.Status is null)
        {
            continue;
        }

        await paperTradingRepository.UpdatePaperOrderAsync(
            update.OrderId,
            update.Status.Value,
            update.ExitDate,
            update.ExitPrice,
            update.ReturnPercent,
            update.RealizedPnl,
            update.SourceReason ?? order.SourceReason,
            cancellationToken);
        updated++;
    }

    await SavePipelineEventAsync(eventLogRepository, "Paper mark-to-market", date, orders.Count, updated, orders.Count - updated, cancellationToken);
    return Results.Ok(PipelineRunResponse.FromCounts(
        "Paper mark-to-market",
        date,
        orders.Count,
        updated,
        orders.Count - updated,
        $"Paper mark-to-market completed. Updated {updated} of {orders.Count} open orders."));
});

app.MapPost("/pipeline/monitor/run", async (
    string? sessionDate,
    string? from,
    string? to,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    SignalMonitoringService signalMonitoringService,
    NotificationTriggerService notificationTriggerService,
    IScannerRepository repository,
    IEventLogRepository eventLogRepository,
    IInstrumentUniverseRepository universeRepository,
    Microsoft.Extensions.Options.IOptions<ScannerRunOptions> scannerOptions,
    Microsoft.Extensions.Options.IOptions<MonitoringOptions> monitoringOptions,
    CancellationToken cancellationToken) =>
{
    var options = scannerOptions.Value;
    var universe = await ResolveScannerUniverseAsync(universeRepository, options, universeName, basketName, instrumentKey, cancellationToken);
    if (universe.Error is not null)
    {
        return Results.BadRequest(new { message = universe.Error });
    }

    var instruments = universe.Instruments;
    if (instruments.Count == 0)
    {
        return Results.BadRequest(new { message = "No ScannerRun instruments are configured." });
    }

    var date = ParseSessionDate(sessionDate, DateOnly.FromDateTime(DateTime.Today));
    var windowStart = ParseTime(from, monitoringOptions.Value.GetStartTime());
    var windowEnd = ParseTime(to, monitoringOptions.Value.GetEndTime());
    var candidates = await repository.GetLatestLiveValidationTradeCandidatesAsync(date, instruments, cancellationToken);
    if (candidates.Count == 0)
    {
        candidates = await repository.GetLatestOpeningRangeTradeCandidatesAsync(date, instruments, cancellationToken);
    }

    if (candidates.Count == 0)
    {
        return Results.Ok(PipelineRunResponse.Skipped("Monitor", date, "No active live-validation or confirmed opening-range trade candidates were found for this session."));
    }

    var result = await signalMonitoringService.MonitorAsync(
        new SignalMonitoringRequest(date, windowStart, windowEnd, candidates),
        cancellationToken);
    await repository.SaveMonitorRunAsync(result, cancellationToken);
    await notificationTriggerService.NotifyMonitorEventsAsync(result, cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "Monitor", date, result.Results.Count, result.Results.Count(item => item.Status != UniversalEngine.Domain.Trading.SignalMonitorStatus.NoData), result.Results.Count(item => item.Status == UniversalEngine.Domain.Trading.SignalMonitorStatus.NoData), cancellationToken);
    return Results.Ok(PipelineRunResponse.FromCounts(
        "Monitor",
        date,
        result.Results.Count,
        result.Results.Count(item => item.Status != UniversalEngine.Domain.Trading.SignalMonitorStatus.NoData),
        result.Results.Count(item => item.Status == UniversalEngine.Domain.Trading.SignalMonitorStatus.NoData),
        "Signal monitor run completed. No order was placed."));
});

app.MapGet("/notifications/attempts/latest", async (
    INotificationHistoryRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var attempts = await repository.GetLatestNotificationAttemptsAsync(limit ?? 20, cancellationToken);
    return Results.Ok(attempts);
});

app.MapGet("/events/latest", async (
    IEventLogRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var events = await repository.GetLatestEventsAsync(limit ?? 25, cancellationToken);
    return Results.Ok(events);
});

app.MapGet("/feedback/outcomes/latest", async (
    IOutcomeFeedbackRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var feedback = await repository.GetLatestOutcomeFeedbackAsync(limit ?? 25, cancellationToken);
    return Results.Ok(feedback);
});

app.MapGet("/accuracy/feedback/by-recommendation", async (
    IOutcomeFeedbackRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var feedback = await repository.GetLatestOutcomeFeedbackAsync(limit ?? 500, cancellationToken);
    var summaries = feedback
        .GroupBy(item => $"{item.Source}:{item.Recommendation}")
        .OrderBy(group => group.Key)
        .Select(group =>
        {
            var items = group.ToArray();
            var wins = items.Count(item => item.Outcome.Equals("Win", StringComparison.OrdinalIgnoreCase));
            var losses = items.Count(item => item.Outcome.Equals("Loss", StringComparison.OrdinalIgnoreCase));
            var flats = items.Count(item => item.Outcome.Equals("Flat", StringComparison.OrdinalIgnoreCase));
            var closed = wins + losses;
            var returnItems = items.Where(item => item.ReturnPercent is not null).ToArray();
            return new FeedbackCalibrationSummaryResponse(
                group.Key,
                items.Length,
                wins,
                losses,
                flats,
                closed == 0 ? 0m : Math.Round((decimal)wins / closed * 100m, 2),
                returnItems.Length == 0 ? 0m : Math.Round(returnItems.Average(item => item.ReturnPercent!.Value), 4));
        })
        .ToArray();

    return Results.Ok(summaries);
});

app.MapPost("/feedback/outcomes", async (
    OutcomeFeedbackRequest request,
    IOutcomeFeedbackRepository repository,
    IEventLogRepository eventLogRepository,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Symbol) ||
        string.IsNullOrWhiteSpace(request.Exchange) ||
        string.IsNullOrWhiteSpace(request.Direction) ||
        string.IsNullOrWhiteSpace(request.Source) ||
        string.IsNullOrWhiteSpace(request.Recommendation) ||
        string.IsNullOrWhiteSpace(request.Outcome))
    {
        return Results.BadRequest(new { message = "Symbol, exchange, direction, source, recommendation, and outcome are required." });
    }

    await repository.SaveOutcomeFeedbackAsync(
        request.SessionDate,
        request.Symbol.Trim(),
        request.Exchange.Trim(),
        request.Direction.Trim(),
        request.Source.Trim(),
        request.Recommendation.Trim(),
        request.Outcome.Trim(),
        request.ReturnPercent,
        request.Notes?.Trim() ?? string.Empty,
        cancellationToken);
    await SavePipelineEventAsync(eventLogRepository, "Outcome feedback", request.SessionDate, 1, request.Outcome.Equals("Win", StringComparison.OrdinalIgnoreCase) ? 1 : 0, request.Outcome.Equals("Loss", StringComparison.OrdinalIgnoreCase) ? 1 : 0, cancellationToken);
    return Results.Ok(new { message = "Outcome feedback recorded." });
});

app.MapGet("/instruments/dhan/search", async (
    string symbol,
    string? exchange,
    IInstrumentMasterProvider instrumentMasterProvider,
    CancellationToken cancellationToken) =>
{
    var results = await instrumentMasterProvider.SearchAsync(symbol, exchange, cancellationToken);
    return Results.Ok(results);
});

app.Run();

static DateOnly ParseSessionDate(string? value, DateOnly fallback) =>
    string.IsNullOrWhiteSpace(value) ? fallback : DateOnly.Parse(value);

static TimeOnly ParseTime(string? value, TimeOnly fallback) =>
    string.IsNullOrWhiteSpace(value) ? fallback : TimeOnly.Parse(value);

static string ResolveHistoricalCacheRoot(AnalysisDataOptions options) =>
    string.IsNullOrWhiteSpace(options.HistoricalCacheRoot)
        ? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "UniversalEngine",
            "historical-cache")
        : options.HistoricalCacheRoot;

static string MaskSecret(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return "Not set";
    }

    return value.Length <= 8 ? "Configured" : $"{value[..4]}...{value[^4..]}";
}

static async Task SaveApplicationSettingsAsync(
    string configPath,
    ApplicationSettingsUpdateRequest request,
    MarketDataProviderKind provider,
    MarketDataProviderKind brokerProvider,
    CancellationToken cancellationToken)
{
    JsonObject root;
    if (File.Exists(configPath))
    {
        var content = await File.ReadAllTextAsync(configPath, cancellationToken);
        root = JsonNode.Parse(string.IsNullOrWhiteSpace(content) ? "{}" : content)?.AsObject() ?? new JsonObject();
    }
    else
    {
        Directory.CreateDirectory(Path.GetDirectoryName(configPath)!);
        root = new JsonObject();
    }

    root["Risk"] = new JsonObject
    {
        ["CapitalAmount"] = request.Risk.CapitalAmount,
        ["MinPlannedRiskAmount"] = request.Risk.MinPlannedRiskAmount,
        ["MaxPlannedRiskAmount"] = request.Risk.MaxPlannedRiskAmount,
        ["MaxActiveSignals"] = request.Risk.MaxActiveSignals,
        ["AllowSmallRiskAlerts"] = request.Risk.AllowSmallRiskAlerts
    };

    root["EodScanner"] = new JsonObject
    {
        ["LookbackDays"] = request.EodScanner.LookbackDays,
        ["MinimumAverageTradedValue"] = request.EodScanner.MinimumAverageTradedValue,
        ["MinimumVolumeExpansionRatio"] = request.EodScanner.MinimumVolumeExpansionRatio,
        ["NearHighCloseThreshold"] = request.EodScanner.NearHighCloseThreshold,
        ["NearLowCloseThreshold"] = request.EodScanner.NearLowCloseThreshold,
        ["MaxDailyDataAgeHours"] = request.EodScanner.MaxDailyDataAgeHours,
        ["MinimumAcceptedScore"] = request.EodScanner.MinimumAcceptedScore,
        ["MaxAcceptedCandidates"] = request.EodScanner.MaxAcceptedCandidates,
        ["FactorWeights"] = ToJsonObject(request.EodScanner.FactorWeights)
    };

    var existingMarketData = root["MarketData"] as JsonObject;
    var existingDhan = existingMarketData?["Dhan"] as JsonObject;
    var accessToken = string.IsNullOrWhiteSpace(request.Broker.Dhan.AccessToken)
        ? existingDhan?["AccessToken"]?.GetValue<string>()
        : request.Broker.Dhan.AccessToken.Trim();

    root["AnalysisData"] = new JsonObject
    {
        ["PrimaryProvider"] = provider.ToString(),
        ["UseHistoricalCache"] = request.Analysis.UseHistoricalCache,
        ["HistoricalCacheTtlHours"] = request.Analysis.HistoricalCacheTtlHours,
        ["HistoricalCacheRoot"] = string.Empty
    };

    root["PreMarket"] = new JsonObject
    {
        ["Enabled"] = request.Stages.PreMarket.Enabled,
        ["EnableScheduledScan"] = request.Stages.PreMarket.EnableScheduledScan,
        ["RunTimeLocal"] = request.Stages.PreMarket.RunTimeLocal.Trim(),
        ["MaxAllowedGapPercent"] = request.Stages.PreMarket.MaxAllowedGapPercent,
        ["AllowWhenPreMarketDataUnavailable"] = request.Stages.PreMarket.AllowWhenPreMarketDataUnavailable
    };

    root["OpeningRange"] = new JsonObject
    {
        ["Enabled"] = request.Stages.OpeningRange.Enabled,
        ["EnableScheduledScan"] = request.Stages.OpeningRange.EnableScheduledScan,
        ["RangeMinutes"] = request.Stages.OpeningRange.RangeMinutes,
        ["Interval"] = request.Stages.OpeningRange.Interval.Trim(),
        ["MarketOpenTime"] = request.Stages.OpeningRange.MarketOpenTime.Trim(),
        ["BreakoutBufferTicks"] = request.Stages.OpeningRange.BreakoutBufferTicks,
        ["TargetRiskRewardRatio"] = request.Stages.OpeningRange.TargetRiskRewardRatio,
        ["MaxIntradayDataAgeMinutes"] = request.Stages.OpeningRange.MaxIntradayDataAgeMinutes
    };

    root["LiveValidation"] = new JsonObject
    {
        ["Enabled"] = request.Stages.LiveValidation.Enabled,
        ["EnableScheduledScan"] = request.Stages.LiveValidation.EnableScheduledScan,
        ["Interval"] = request.Stages.LiveValidation.Interval.Trim(),
        ["StartTime"] = request.Stages.LiveValidation.StartTime.Trim(),
        ["EndTime"] = request.Stages.LiveValidation.EndTime.Trim(),
        ["PollMinutes"] = request.Stages.LiveValidation.PollMinutes,
        ["ConfirmationBufferTicks"] = request.Stages.LiveValidation.ConfirmationBufferTicks,
        ["MaxIntradayDataAgeMinutes"] = request.Stages.LiveValidation.MaxIntradayDataAgeMinutes
    };

    root["Monitoring"] = new JsonObject
    {
        ["Enabled"] = request.Stages.Monitoring.Enabled,
        ["EnableScheduledScan"] = request.Stages.Monitoring.EnableScheduledScan,
        ["Interval"] = request.Stages.Monitoring.Interval.Trim(),
        ["StartTime"] = request.Stages.Monitoring.StartTime.Trim(),
        ["EndTime"] = request.Stages.Monitoring.EndTime.Trim(),
        ["PollMinutes"] = request.Stages.Monitoring.PollMinutes,
        ["MaxIntradayDataAgeMinutes"] = request.Stages.Monitoring.MaxIntradayDataAgeMinutes
    };

    root["Backtest"] = new JsonObject
    {
        ["FromDate"] = request.Backtest.FromDate.Trim(),
        ["ToDate"] = request.Backtest.ToDate.Trim(),
        ["MaxHoldingDays"] = request.Backtest.MaxHoldingDays,
        ["UseStopTargetSimulation"] = request.Backtest.UseStopTargetSimulation,
        ["TargetRiskRewardRatio"] = request.Backtest.TargetRiskRewardRatio,
        ["AssumeStopBeforeTargetWhenBothTouched"] = request.Backtest.AssumeStopBeforeTargetWhenBothTouched
    };

    root["AiAnalysis"] = new JsonObject
    {
        ["Enabled"] = request.Ai.Enabled,
        ["Provider"] = request.Ai.Provider.Trim(),
        ["PromptVersion"] = request.Ai.PromptVersion.Trim(),
        ["MinimumTradeProbability"] = request.Ai.MinimumTradeProbability
    };

    var existingNotifications = root["Notifications"] as JsonObject;
    var existingTelegram = existingNotifications?["Telegram"] as JsonObject;
    var existingEmail = existingNotifications?["Email"] as JsonObject;
    var telegramToken = string.IsNullOrWhiteSpace(request.Notifications.Telegram.BotToken)
        ? existingTelegram?["BotToken"]?.GetValue<string>()
        : request.Notifications.Telegram.BotToken.Trim();
    var emailPassword = string.IsNullOrWhiteSpace(request.Notifications.Email.Password)
        ? existingEmail?["Password"]?.GetValue<string>()
        : request.Notifications.Email.Password.Trim();

    root["Notifications"] = new JsonObject
    {
        ["Channel"] = request.Notifications.Channel.Trim(),
        ["SendEodWatchlistNotifications"] = request.Notifications.SendEodWatchlistNotifications,
        ["MinimumEodScoreToNotify"] = request.Notifications.MinimumEodScoreToNotify,
        ["Telegram"] = new JsonObject
        {
            ["BotToken"] = string.IsNullOrWhiteSpace(telegramToken) ? null : telegramToken,
            ["ChatId"] = string.IsNullOrWhiteSpace(request.Notifications.Telegram.ChatId) ? null : request.Notifications.Telegram.ChatId.Trim()
        },
        ["Email"] = new JsonObject
        {
            ["SmtpHost"] = string.IsNullOrWhiteSpace(request.Notifications.Email.SmtpHost) ? null : request.Notifications.Email.SmtpHost.Trim(),
            ["SmtpPort"] = request.Notifications.Email.SmtpPort,
            ["UseSsl"] = request.Notifications.Email.UseSsl,
            ["Username"] = string.IsNullOrWhiteSpace(request.Notifications.Email.Username) ? null : request.Notifications.Email.Username.Trim(),
            ["Password"] = string.IsNullOrWhiteSpace(emailPassword) ? null : emailPassword,
            ["From"] = string.IsNullOrWhiteSpace(request.Notifications.Email.From) ? null : request.Notifications.Email.From.Trim(),
            ["To"] = string.IsNullOrWhiteSpace(request.Notifications.Email.To) ? null : request.Notifications.Email.To.Trim()
        }
    };

    var marketData = new JsonObject
    {
        ["PrimaryProvider"] = brokerProvider.ToString(),
        ["DhanInstrumentMasterUrl"] =
            existingMarketData?["DhanInstrumentMasterUrl"]?.GetValue<string>() ??
            "https://images.dhan.co/api-data/api-scrip-master-detailed.csv",
        ["Dhan"] = new JsonObject
        {
            ["BaseUrl"] = request.Broker.Dhan.BaseUrl.Trim(),
            ["ClientId"] = string.IsNullOrWhiteSpace(request.Broker.Dhan.ClientId) ? null : request.Broker.Dhan.ClientId.Trim(),
            ["AccessToken"] = string.IsNullOrWhiteSpace(accessToken) ? null : accessToken,
            ["InstrumentType"] = request.Broker.Dhan.InstrumentType.Trim(),
            ["IncludeOpenInterest"] = request.Broker.Dhan.IncludeOpenInterest,
            ["RetryCount"] = request.Broker.Dhan.RetryCount,
            ["RetryBaseDelayMs"] = request.Broker.Dhan.RetryBaseDelayMs,
            ["RequestThrottleDelayMs"] = request.Broker.Dhan.RequestThrottleDelayMs
        }
    };

    CopyExistingMarketDataNode(existingMarketData, marketData, "EnabledProviders");
    CopyExistingMarketDataNode(existingMarketData, marketData, "CsvDataRoot");
    CopyExistingMarketDataNode(existingMarketData, marketData, "Zerodha");
    CopyExistingMarketDataNode(existingMarketData, marketData, "Groww");
    root["MarketData"] = marketData;

    await File.WriteAllTextAsync(
        configPath,
        root.ToJsonString(new JsonSerializerOptions { WriteIndented = true }),
        cancellationToken);
}

static void CopyExistingMarketDataNode(JsonObject? source, JsonObject target, string propertyName)
{
    if (source?[propertyName] is { } node)
    {
        target[propertyName] = node.DeepClone();
    }
}

static JsonObject ToJsonObject(IReadOnlyDictionary<string, decimal> values)
{
    var node = new JsonObject();
    foreach (var (key, value) in values.OrderBy(item => item.Key))
    {
        node[key] = value;
    }

    return node;
}

static async Task<ScannerUniverseState> GetScannerStateAsync(
    IInstrumentUniverseRepository repository,
    ScannerRunOptions options,
    CancellationToken cancellationToken)
{
    var state = await repository.GetScannerUniverseStateAsync(cancellationToken);
    if (state.Instruments.Count > 0 || state.Baskets.Count > 0 || state.Universes.Count > 0)
    {
        return state;
    }

    var instruments = options.Instruments
        .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
        .Select(ToScannerInstrumentDefinitionFromOptions)
        .ToArray();
    var baskets = options.GetBaskets()
        .Select(basket =>
        {
            var basketInstruments = basket.Instruments
                .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
                .Select(ToScannerInstrumentDefinitionFromOptions)
                .ToArray();
            return new ScannerBasketDefinition(
                basket.Name,
                basket.Enabled,
                basket.MaxSymbols,
                basketInstruments.Length,
                basketInstruments);
        })
        .ToArray();
    var defaultInstruments = options.GetInstruments()
        .Select(ToScannerInstrumentDefinitionFromDomain)
        .ToArray();
    var universes = defaultInstruments.Length == 0
        ? []
        : new[]
        {
            new ScannerUniverseDefinition(
                "Default",
                true,
                defaultInstruments.Length,
                baskets.Where(basket => basket.Enabled).Select(basket => basket.Name).ToArray(),
                defaultInstruments,
                defaultInstruments)
        };

    var seededState = new ScannerUniverseState(instruments, baskets, universes);
    if (instruments.Length > 0 || baskets.Length > 0 || universes.Length > 0)
    {
        await repository.SaveScannerInstrumentsAsync(instruments, cancellationToken);
        await repository.SaveScannerBasketsAsync(baskets, cancellationToken);
        await repository.SaveScannerUniversesAsync(universes, cancellationToken);
    }

    return seededState;
}

static async Task<ScannerUniverseResolution> ResolveScannerUniverseAsync(
    IInstrumentUniverseRepository repository,
    ScannerRunOptions options,
    string? universeName,
    string? basketName,
    string? instrumentKey,
    CancellationToken cancellationToken)
{
    var selectedModes = new[] { universeName, basketName, instrumentKey }.Count(value => !string.IsNullOrWhiteSpace(value));
    if (selectedModes > 1)
    {
        return ScannerUniverseResolution.Failed("Choose one scan source: universe, basket, or instrument.");
    }

    var state = await GetScannerStateAsync(repository, options, cancellationToken);

    if (!string.IsNullOrWhiteSpace(universeName))
    {
        var universe = state.Universes.FirstOrDefault(item => string.Equals(item.Name, universeName, StringComparison.OrdinalIgnoreCase));
        if (universe is null)
        {
            return ScannerUniverseResolution.Failed($"Scanner universe '{universeName}' was not found.");
        }

        return universe.Instruments.Count == 0
            ? ScannerUniverseResolution.Failed($"Scanner universe '{universe.Name}' has no instruments.")
            : ScannerUniverseResolution.Resolved(ToDomainInstruments(universe.Instruments));
    }

    if (!string.IsNullOrWhiteSpace(basketName))
    {
        var basket = state.Baskets
            .FirstOrDefault(item => string.Equals(item.Name, basketName, StringComparison.OrdinalIgnoreCase));
        if (basket is null)
        {
            return ScannerUniverseResolution.Failed($"Scanner basket '{basketName}' was not found.");
        }

        var instruments = ToDomainInstruments(basket.Instruments
            .Take(basket.MaxSymbols <= 0 ? int.MaxValue : basket.MaxSymbols));

        return instruments.Length == 0
            ? ScannerUniverseResolution.Failed($"Scanner basket '{basket.Name}' has no instruments.")
            : ScannerUniverseResolution.Resolved(instruments);
    }

    var allInstrumentDefinitions = state.Universes.Any(universe => universe.Enabled)
        ? state.Universes.Where(universe => universe.Enabled).SelectMany(universe => universe.Instruments)
        : state.Instruments.Concat(state.Baskets.Where(basket => basket.Enabled)
            .SelectMany(basket => basket.Instruments.Take(basket.MaxSymbols <= 0 ? int.MaxValue : basket.MaxSymbols)));
    var allInstruments = ToDomainInstruments(allInstrumentDefinitions);
    if (!string.IsNullOrWhiteSpace(instrumentKey))
    {
        var normalizedKey = instrumentKey.Trim().ToUpperInvariant();
        var instrument = allInstruments.FirstOrDefault(item => item.Key == normalizedKey);
        return instrument is null
            ? ScannerUniverseResolution.Failed($"Scanner instrument '{instrumentKey}' was not found in active instruments or enabled baskets.")
            : ScannerUniverseResolution.Resolved([instrument]);
    }

    return ScannerUniverseResolution.Resolved(allInstruments);
}

static IReadOnlyList<string> GetDuplicateInstrumentKeys(ScannerUniverseState state) =>
    state.Universes.Any(universe => universe.Enabled)
        ? GetDuplicateInstrumentKeysFromDefinitions(state.Universes.Where(universe => universe.Enabled).SelectMany(universe => universe.Instruments))
        : GetDuplicateInstrumentKeysFromDefinitions(state.Instruments.Concat(state.Baskets.Where(basket => basket.Enabled).SelectMany(basket => basket.Instruments)));

static IReadOnlyList<string> GetDuplicateInstrumentKeysFromDefinitions(IEnumerable<ScannerInstrumentDefinition> instruments) =>
    instruments
        .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
        .GroupBy(instrument => instrument.Key)
        .Where(group => group.Count() > 1)
        .Select(group => group.Key)
        .OrderBy(key => key)
        .ToArray();

static Instrument[] ToDomainInstruments(IEnumerable<ScannerInstrumentDefinition> instruments) =>
    instruments
        .Where(instrument => !string.IsNullOrWhiteSpace(instrument.Symbol))
        .Select(ToDomainInstrument)
        .GroupBy(instrument => instrument.Key)
        .Select(group => group.First())
        .ToArray();

static ScannerInstrumentResponse ToScannerInstrumentResponse(ScannerInstrumentDefinition instrument) =>
    new(instrument.Symbol, instrument.Exchange, instrument.Isin, instrument.SecurityId, instrument.Key);

static ScannerInstrumentDefinition ToScannerInstrumentDefinition(InstrumentSettingsRequest instrument)
{
    var exchange = string.IsNullOrWhiteSpace(instrument.Exchange) ? "Nse" : instrument.Exchange.Trim();
    var symbol = instrument.Symbol.Trim().ToUpperInvariant();
    return new ScannerInstrumentDefinition(
        symbol,
        exchange,
        string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
        string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim(),
        $"{exchange}:{symbol}".ToUpperInvariant());
}

static ScannerInstrumentDefinition ToScannerInstrumentDefinitionFromLookup(InstrumentLookupResult instrument)
{
    var exchange = string.Equals(instrument.Exchange, "BSE", StringComparison.OrdinalIgnoreCase) ? "Bse" : "Nse";
    var symbol = instrument.Symbol.Trim().ToUpperInvariant();
    return new ScannerInstrumentDefinition(
        symbol,
        exchange,
        string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
        string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim(),
        $"{exchange}:{symbol}".ToUpperInvariant());
}

static ScannerInstrumentDefinition ToScannerInstrumentDefinitionFromOptions(InstrumentOptions instrument)
{
    var exchange = string.IsNullOrWhiteSpace(instrument.Exchange) ? "Nse" : instrument.Exchange.Trim();
    var symbol = instrument.Symbol.Trim().ToUpperInvariant();
    return new ScannerInstrumentDefinition(
        symbol,
        exchange,
        string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
        string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim(),
        $"{exchange}:{symbol}".ToUpperInvariant());
}

static ScannerInstrumentDefinition ToScannerInstrumentDefinitionFromDomain(Instrument instrument) =>
    new(
        instrument.Symbol,
        instrument.Exchange.ToString(),
        instrument.Isin,
        instrument.SecurityId,
        instrument.Key);

static Instrument ToDomainInstrument(ScannerInstrumentDefinition instrument) =>
    new(
        instrument.Symbol.Trim().ToUpperInvariant(),
        Enum.Parse<Exchange>(instrument.Exchange, ignoreCase: true),
        string.IsNullOrWhiteSpace(instrument.Isin) ? null : instrument.Isin.Trim(),
        SecurityId: string.IsNullOrWhiteSpace(instrument.SecurityId) ? null : instrument.SecurityId.Trim());

static Task SavePipelineEventAsync(
    IEventLogRepository repository,
    string stage,
    DateOnly sessionDate,
    int evaluatedCount,
    int acceptedCount,
    int rejectedCount,
    CancellationToken cancellationToken) =>
    repository.SaveEventAsync(
        "PipelineStageCompleted",
        stage,
        JsonSerializer.Serialize(new
        {
            stage,
            sessionDate,
            evaluatedCount,
            acceptedCount,
            rejectedCount
        }),
        cancellationToken);

public sealed record ScannerUniverseResolution(
    IReadOnlyList<Instrument> Instruments,
    string? Error)
{
    public static ScannerUniverseResolution Resolved(IReadOnlyList<Instrument> instruments) =>
        new(instruments, null);

    public static ScannerUniverseResolution Failed(string error) =>
        new([], error);
}

public sealed record PipelineRunResponse(
    string Stage,
    DateOnly SessionDate,
    string Status,
    int EvaluatedCount,
    int AcceptedCount,
    int RejectedCount,
    string Message)
{
    public static PipelineRunResponse FromCounts(
        string stage,
        DateOnly sessionDate,
        int evaluatedCount,
        int acceptedCount,
        int rejectedCount,
        string message) =>
        new(stage, sessionDate, "Completed", evaluatedCount, acceptedCount, rejectedCount, message);

    public static PipelineRunResponse Skipped(
        string stage,
        DateOnly sessionDate,
        string message) =>
        new(stage, sessionDate, "Skipped", 0, 0, 0, message);
}

public sealed record PipelineStatusResponse(
    DateOnly SessionDate,
    int ConfiguredInstrumentCount,
    IReadOnlyList<string> DuplicateInstrumentKeys,
    string Message,
    IReadOnlyList<PipelineStageStatus> Stages);

public sealed record DataSourceSettingsResponse(
    string AnalysisProvider,
    string BrokerProvider,
    bool HistoricalCacheEnabled,
    int HistoricalCacheTtlHours,
    string? HistoricalCacheRoot,
    int HistoricalCacheEntryCount,
    string Message);

public sealed record ApplicationSettingsResponse(
    RiskSettingsResponse Risk,
    EodScannerSettingsResponse EodScanner,
    AnalysisSettingsResponse Analysis,
    BrokerSettingsResponse Broker,
    StageSettingsResponse Stages,
    BacktestSettingsResponse Backtest,
    AiSettingsResponse Ai,
    NotificationSettingsResponse Notifications,
    string Message);

public sealed record ApplicationSettingsUpdateRequest(
    RiskSettingsResponse Risk,
    EodScannerSettingsResponse EodScanner,
    AnalysisSettingsResponse Analysis,
    BrokerSettingsResponse Broker,
    StageSettingsResponse Stages,
    BacktestSettingsResponse Backtest,
    AiSettingsResponse Ai,
    NotificationSettingsResponse Notifications);

public sealed record RiskSettingsResponse(
    decimal CapitalAmount,
    decimal MinPlannedRiskAmount,
    decimal MaxPlannedRiskAmount,
    int MaxActiveSignals,
    bool AllowSmallRiskAlerts);

public sealed record EodScannerSettingsResponse(
    int LookbackDays,
    decimal MinimumAverageTradedValue,
    decimal MinimumVolumeExpansionRatio,
    decimal NearHighCloseThreshold,
    decimal NearLowCloseThreshold,
    int MaxDailyDataAgeHours,
    decimal MinimumAcceptedScore,
    int MaxAcceptedCandidates,
    Dictionary<string, decimal> FactorWeights);

public sealed record AnalysisSettingsResponse(
    string PrimaryProvider,
    bool UseHistoricalCache,
    int HistoricalCacheTtlHours);

public sealed record BrokerSettingsResponse(
    string PrimaryProvider,
    DhanBrokerSettingsResponse Dhan);

public sealed record DhanBrokerSettingsResponse(
    string BaseUrl,
    string ClientId,
    string AccessTokenMasked,
    string AccessToken,
    string InstrumentType,
    bool IncludeOpenInterest,
    int RetryCount,
    int RetryBaseDelayMs,
    int RequestThrottleDelayMs);

public sealed record StageSettingsResponse(
    PreMarketSettingsResponse PreMarket,
    OpeningRangeSettingsResponse OpeningRange,
    LiveValidationSettingsResponse LiveValidation,
    MonitoringSettingsResponse Monitoring);

public sealed record PreMarketSettingsResponse(
    bool Enabled,
    bool EnableScheduledScan,
    string RunTimeLocal,
    decimal MaxAllowedGapPercent,
    bool AllowWhenPreMarketDataUnavailable);

public sealed record OpeningRangeSettingsResponse(
    bool Enabled,
    bool EnableScheduledScan,
    int RangeMinutes,
    string Interval,
    string MarketOpenTime,
    int BreakoutBufferTicks,
    decimal TargetRiskRewardRatio,
    int MaxIntradayDataAgeMinutes);

public sealed record LiveValidationSettingsResponse(
    bool Enabled,
    bool EnableScheduledScan,
    string Interval,
    string StartTime,
    string EndTime,
    int PollMinutes,
    int ConfirmationBufferTicks,
    int MaxIntradayDataAgeMinutes);

public sealed record MonitoringSettingsResponse(
    bool Enabled,
    bool EnableScheduledScan,
    string Interval,
    string StartTime,
    string EndTime,
    int PollMinutes,
    int MaxIntradayDataAgeMinutes);

public sealed record BacktestSettingsResponse(
    string FromDate,
    string ToDate,
    int MaxHoldingDays,
    bool UseStopTargetSimulation,
    decimal TargetRiskRewardRatio,
    bool AssumeStopBeforeTargetWhenBothTouched);

public sealed record AiSettingsResponse(
    bool Enabled,
    string Provider,
    string PromptVersion,
    decimal MinimumTradeProbability);

public sealed record NotificationSettingsResponse(
    string Channel,
    bool SendEodWatchlistNotifications,
    decimal MinimumEodScoreToNotify,
    TelegramSettingsResponse Telegram,
    EmailSettingsResponse Email);

public sealed record TelegramSettingsResponse(
    string BotTokenMasked,
    string BotToken,
    string ChatId);

public sealed record EmailSettingsResponse(
    string SmtpHost,
    int SmtpPort,
    bool UseSsl,
    string Username,
    string PasswordMasked,
    string Password,
    string From,
    string To);

public sealed record PipelineStageStatus(
    string Stage,
    bool CanRun,
    int CandidateCount,
    string Message)
{
    public static PipelineStageStatus FromCandidateCount(
        string stage,
        int candidateCount,
        string readyMessage,
        string blockedMessage) =>
        new(stage, candidateCount > 0, candidateCount, candidateCount > 0 ? readyMessage : blockedMessage);

    public static PipelineStageStatus Blocked(
        string stage,
        int candidateCount,
        string message) =>
        new(stage, false, candidateCount, message);
}

public sealed record ScannerInstrumentsResponse(
    int Count,
    IReadOnlyList<string> DuplicateInstrumentKeys,
    IReadOnlyList<ScannerBasketResponse> Baskets,
    IReadOnlyList<ScannerUniverseResponse> Universes,
    IReadOnlyList<ScannerInstrumentResponse> Instruments);

public sealed record ScannerInstrumentsUpdateRequest(
    IReadOnlyList<InstrumentSettingsRequest> Instruments);

public sealed record ScannerBasketResponse(
    string Name,
    bool Enabled,
    int MaxSymbols,
    int InstrumentCount,
    IReadOnlyList<ScannerInstrumentResponse> Instruments);

public sealed record ScannerBasketsUpdateRequest(
    IReadOnlyList<ScannerBasketUpdateRequest> Baskets);

public sealed record ScannerBasketUpdateRequest(
    string Name,
    bool Enabled,
    int MaxSymbols,
    IReadOnlyList<InstrumentSettingsRequest> Instruments);

public sealed record ScannerUniverseResponse(
    string Name,
    bool Enabled,
    int InstrumentCount,
    IReadOnlyList<string> BasketNames,
    IReadOnlyList<ScannerInstrumentResponse> DirectInstruments,
    IReadOnlyList<ScannerInstrumentResponse> Instruments);

public sealed record ScannerUniversesUpdateRequest(
    IReadOnlyList<ScannerUniverseUpdateRequest> Universes);

public sealed record ScannerUniverseUpdateRequest(
    string Name,
    bool Enabled,
    IReadOnlyList<string> BasketNames,
    IReadOnlyList<InstrumentSettingsRequest> DirectInstruments);

public sealed record PredefinedBasketSeed(
    string Name,
    int MaxSymbols,
    IReadOnlyList<string> Symbols);

public sealed record InstrumentSettingsRequest(
    string Symbol,
    string Exchange,
    string? Isin,
    string? SecurityId);

public sealed record ScannerInstrumentResponse(
    string Symbol,
    string Exchange,
    string? Isin,
    string? SecurityId,
    string Key);

public sealed record BacktestAccuracySummaryResponse(
    int Runs,
    int Signals,
    int Wins,
    int Losses,
    int Flats,
    int NoExitData,
    decimal WinRatePercent,
    decimal AverageReturnPercent);

public sealed record BacktestCalibrationSummaryResponse(
    string Bucket,
    int Signals,
    int Wins,
    int Losses,
    int Flats,
    int NoExitData,
    decimal WinRatePercent,
    decimal AverageReturnPercent);

public sealed record OutcomeFeedbackRequest(
    DateOnly SessionDate,
    string Symbol,
    string Exchange,
    string Direction,
    string Source,
    string Recommendation,
    string Outcome,
    decimal? ReturnPercent,
    string? Notes);

public sealed record FeedbackCalibrationSummaryResponse(
    string Bucket,
    int Signals,
    int Wins,
    int Losses,
    int Flats,
    decimal WinRatePercent,
    decimal AverageReturnPercent);
