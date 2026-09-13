using UniversalEngine.Worker;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Ai;
using UniversalEngine.Application.Analysis;
using UniversalEngine.Application.Backtesting;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Notifications;
using UniversalEngine.Application.PaperTrading;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Application.Trading;
using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;
using UniversalEngine.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);
builder.Logging.AddFilter("System.Net.Http.HttpClient.TelegramNotificationSender", LogLevel.None);
builder.Logging.AddFilter("System.Net.Http.HttpClient.DhanMarketDataProvider", LogLevel.Warning);
builder.Logging.AddFilter("System.Net.Http.HttpClient.YahooFinanceMarketDataProvider", LogLevel.Warning);
builder.Logging.AddFilter("System.Net.Http.HttpClient.BrokerConnectionVerifier", LogLevel.Warning);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
if (args.Contains("--lookup-symbol") ||
    args.Contains("--build-instrument-config") ||
    args.Contains("--build-local-config") ||
    args.Contains("--verify-dhan") ||
    args.Contains("--verify-dhan-intraday") ||
    args.Contains("--check-opening-range") ||
    args.Contains("--check-live-validation") ||
    args.Contains("--run-eod-now") ||
    args.Contains("--run-pre-market-now") ||
    args.Contains("--run-opening-range-now") ||
    args.Contains("--run-live-validation-now") ||
    args.Contains("--run-monitor-now") ||
    args.Contains("--run-backtest") ||
    args.Contains("--telegram-updates") ||
    args.Contains("--telegram-test"))
{
    builder.Logging.ClearProviders();
}
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
builder.Services.Configure<BacktestOptions>(
    builder.Configuration.GetSection(BacktestOptions.SectionName));
builder.Services.Configure<AiAnalysisOptions>(
    builder.Configuration.GetSection(AiAnalysisOptions.SectionName));
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
builder.Services.AddSingleton<EodStartupScannerRunner>();
builder.Services.AddSingleton<PreMarketScannerRunner>();
builder.Services.AddSingleton<OpeningRangeScannerRunner>();
builder.Services.AddSingleton<LiveValidationScannerRunner>();
builder.Services.AddSingleton<SignalMonitorRunner>();
builder.Services.AddSingleton<DhanConnectionVerifier>();
builder.Services.AddSingleton<TelegramBotDiagnostics>();
builder.Services.AddUniversalEngineInfrastructure();
var lookupSymbolIndex = Array.IndexOf(args, "--lookup-symbol");
var buildConfigIndex = Array.IndexOf(args, "--build-instrument-config");
var buildLocalConfigIndex = Array.IndexOf(args, "--build-local-config");
var verifyDhanIndex = Array.IndexOf(args, "--verify-dhan");
var verifyDhanIntradayIndex = Array.IndexOf(args, "--verify-dhan-intraday");
var checkOpeningRangeIndex = Array.IndexOf(args, "--check-opening-range");
var checkLiveValidationIndex = Array.IndexOf(args, "--check-live-validation");
var runEodNowIndex = Array.IndexOf(args, "--run-eod-now");
var runPreMarketNowIndex = Array.IndexOf(args, "--run-pre-market-now");
var runOpeningRangeNowIndex = Array.IndexOf(args, "--run-opening-range-now");
var runLiveValidationNowIndex = Array.IndexOf(args, "--run-live-validation-now");
var runMonitorNowIndex = Array.IndexOf(args, "--run-monitor-now");
var runBacktestIndex = Array.IndexOf(args, "--run-backtest");
var telegramUpdatesIndex = Array.IndexOf(args, "--telegram-updates");
var telegramTestIndex = Array.IndexOf(args, "--telegram-test");
if (lookupSymbolIndex < 0 &&
    buildConfigIndex < 0 &&
    buildLocalConfigIndex < 0 &&
    verifyDhanIndex < 0 &&
    verifyDhanIntradayIndex < 0 &&
    checkOpeningRangeIndex < 0 &&
    checkLiveValidationIndex < 0 &&
    runEodNowIndex < 0 &&
    runPreMarketNowIndex < 0 &&
    runOpeningRangeNowIndex < 0 &&
    runLiveValidationNowIndex < 0 &&
    runMonitorNowIndex < 0 &&
    runBacktestIndex < 0 &&
    telegramUpdatesIndex < 0 &&
    telegramTestIndex < 0)
{
    builder.Services.AddHostedService<Worker>();
}

var host = builder.Build();

if (lookupSymbolIndex >= 0)
{
    var symbol = args.ElementAtOrDefault(lookupSymbolIndex + 1);
    var exchange = args.ElementAtOrDefault(lookupSymbolIndex + 2);
    if (string.IsNullOrWhiteSpace(symbol))
    {
        Console.Error.WriteLine("Usage: --lookup-symbol SYMBOL [EXCHANGE]");
        return;
    }

    var provider = host.Services.GetRequiredService<IInstrumentMasterProvider>();
    var results = await provider.SearchAsync(symbol, exchange, CancellationToken.None);
    foreach (var item in results)
    {
        Console.WriteLine($"{item.Exchange} {item.Symbol} | SecurityId {item.SecurityId} | ISIN {item.Isin} | Series {item.Series} | Tick {item.TickSize} | {item.DisplayName}");
    }

    return;
}

if (buildConfigIndex >= 0)
{
    var exchange = args.ElementAtOrDefault(buildConfigIndex + 1);
    var symbols = args.Skip(buildConfigIndex + 2)
        .Where(value => !string.IsNullOrWhiteSpace(value))
        .ToArray();

    if (string.IsNullOrWhiteSpace(exchange) || symbols.Length == 0)
    {
        Console.Error.WriteLine("Usage: --build-instrument-config EXCHANGE SYMBOL [SYMBOL...]");
        return;
    }

    var provider = host.Services.GetRequiredService<IInstrumentMasterProvider>();
    var instruments = new List<object>();
    foreach (var symbol in symbols)
    {
        var result = (await provider.SearchAsync(symbol, exchange, CancellationToken.None))
            .FirstOrDefault(item => item.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase));

        if (result is null)
        {
            Console.Error.WriteLine($"No instrument match found for {exchange}:{symbol}");
            continue;
        }

        instruments.Add(new
        {
            Symbol = result.Symbol,
            Exchange = result.Exchange.Equals("NSE", StringComparison.OrdinalIgnoreCase) ? "Nse" : "Bse",
            Isin = result.Isin,
            SecurityId = result.SecurityId
        });
    }

    Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(new
    {
        ScannerRun = new
        {
            Instruments = instruments
        }
    }, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));

    return;
}

if (buildLocalConfigIndex >= 0)
{
    var exchange = args.ElementAtOrDefault(buildLocalConfigIndex + 1);
    var symbols = args.Skip(buildLocalConfigIndex + 2)
        .Where(value => !string.IsNullOrWhiteSpace(value))
        .ToArray();

    if (string.IsNullOrWhiteSpace(exchange) || symbols.Length == 0)
    {
        Console.Error.WriteLine("Usage: --build-local-config EXCHANGE SYMBOL [SYMBOL...]");
        return;
    }

    var provider = host.Services.GetRequiredService<IInstrumentMasterProvider>();
    var instruments = new List<object>();
    foreach (var symbol in symbols)
    {
        var result = (await provider.SearchAsync(symbol, exchange, CancellationToken.None))
            .FirstOrDefault(item => item.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase));

        if (result is null)
        {
            Console.Error.WriteLine($"No instrument match found for {exchange}:{symbol}");
            continue;
        }

        instruments.Add(new
        {
            Symbol = result.Symbol,
            Exchange = result.Exchange.Equals("NSE", StringComparison.OrdinalIgnoreCase) ? "Nse" : "Bse",
            Isin = result.Isin,
            SecurityId = result.SecurityId
        });
    }

    Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(new
    {
        MarketData = new
        {
            PrimaryProvider = "Dhan",
            EnabledProviders = new[] { "Dhan", "Zerodha", "Groww" }
        },
        ScannerRun = new
        {
            RunEodOnStartup = true,
            StopAfterStartupRun = true,
            EnableScheduledEodScan = false,
            EodSessionDate = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd"),
            Instruments = instruments
        },
        OpeningRange = new
        {
            Enabled = false
        },
        Notifications = new
        {
            Channel = "Console"
        }
    }, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));

    return;
}

if (verifyDhanIndex >= 0)
{
    Instrument? instrument = null;
    var exchangeValue = args.ElementAtOrDefault(verifyDhanIndex + 1);
    var symbol = args.ElementAtOrDefault(verifyDhanIndex + 2);
    var securityId = args.ElementAtOrDefault(verifyDhanIndex + 3);

    if (!string.IsNullOrWhiteSpace(exchangeValue) ||
        !string.IsNullOrWhiteSpace(symbol) ||
        !string.IsNullOrWhiteSpace(securityId))
    {
        if (!Enum.TryParse<Exchange>(exchangeValue, ignoreCase: true, out var exchange) ||
            string.IsNullOrWhiteSpace(symbol) ||
            string.IsNullOrWhiteSpace(securityId))
        {
            Console.Error.WriteLine("Usage: --verify-dhan [EXCHANGE SYMBOL SECURITY_ID]");
            return;
        }

        instrument = new Instrument(symbol.Trim().ToUpperInvariant(), exchange, SecurityId: securityId.Trim());
    }

    var verifier = host.Services.GetRequiredService<DhanConnectionVerifier>();
    var result = await verifier.VerifyAsync(instrument, CancellationToken.None);
    Console.WriteLine(result.Message);
    Environment.ExitCode = result.IsSuccessful ? 0 : 1;
    return;
}

if (verifyDhanIntradayIndex >= 0)
{
    Instrument? instrument = null;
    DateOnly? sessionDate = null;
    var exchangeValue = args.ElementAtOrDefault(verifyDhanIntradayIndex + 1);
    var symbol = args.ElementAtOrDefault(verifyDhanIntradayIndex + 2);
    var securityId = args.ElementAtOrDefault(verifyDhanIntradayIndex + 3);
    var sessionDateValue = args.ElementAtOrDefault(verifyDhanIntradayIndex + 4);

    if (!string.IsNullOrWhiteSpace(exchangeValue) ||
        !string.IsNullOrWhiteSpace(symbol) ||
        !string.IsNullOrWhiteSpace(securityId))
    {
        if (!Enum.TryParse<Exchange>(exchangeValue, ignoreCase: true, out var exchange) ||
            string.IsNullOrWhiteSpace(symbol) ||
            string.IsNullOrWhiteSpace(securityId))
        {
            Console.Error.WriteLine("Usage: --verify-dhan-intraday [EXCHANGE SYMBOL SECURITY_ID [YYYY-MM-DD]]");
            return;
        }

        instrument = new Instrument(symbol.Trim().ToUpperInvariant(), exchange, SecurityId: securityId.Trim());
    }

    if (!string.IsNullOrWhiteSpace(sessionDateValue))
    {
        sessionDate = DateOnly.Parse(sessionDateValue);
    }

    var verifier = host.Services.GetRequiredService<DhanConnectionVerifier>();
    var result = await verifier.VerifyIntradayAsync(instrument, sessionDate, CancellationToken.None);
    Console.WriteLine(result.Message);
    Environment.ExitCode = result.IsSuccessful ? 0 : 1;
    return;
}

if (checkOpeningRangeIndex >= 0)
{
    var exchangeValue = args.ElementAtOrDefault(checkOpeningRangeIndex + 1);
    var symbol = args.ElementAtOrDefault(checkOpeningRangeIndex + 2);
    var securityId = args.ElementAtOrDefault(checkOpeningRangeIndex + 3);
    var directionValue = args.ElementAtOrDefault(checkOpeningRangeIndex + 4);
    var sessionDateValue = args.ElementAtOrDefault(checkOpeningRangeIndex + 5);

    if (!Enum.TryParse<Exchange>(exchangeValue, ignoreCase: true, out var exchange) ||
        string.IsNullOrWhiteSpace(symbol) ||
        string.IsNullOrWhiteSpace(securityId) ||
        !Enum.TryParse<CandidateDirection>(directionValue, ignoreCase: true, out var direction) ||
        string.IsNullOrWhiteSpace(sessionDateValue))
    {
        Console.Error.WriteLine("Usage: --check-opening-range EXCHANGE SYMBOL SECURITY_ID Long|Short YYYY-MM-DD");
        return;
    }

    var instrument = new Instrument(symbol.Trim().ToUpperInvariant(), exchange, SecurityId: securityId.Trim());
    var sessionDate = DateOnly.Parse(sessionDateValue);
    var candidate = new CandidateDecision(
        instrument,
        DecisionOutcome.Accepted,
        direction,
        100m,
        [new DecisionReason(DecisionReasonCode.VolumeExpansion, "Diagnostic opening-range candidate.")]);

    var validationService = host.Services.GetRequiredService<OpeningRangeValidationService>();
    var tradePlanService = host.Services.GetRequiredService<TradePlanGenerationService>();
    var result = await validationService.ValidateAsync(
        new OpeningRangeValidationRequest(sessionDate, [candidate]),
        CancellationToken.None);

    var decision = result.Decisions.Single();
    var reasons = string.Join(", ", decision.Reasons.Select(reason => reason.Code));
    Console.WriteLine($"{decision.Instrument.Key} {direction}: {decision.Outcome}; Reasons: {reasons}");

    if (!decision.IsAccepted)
    {
        Console.WriteLine("NO TRADE. Opening-range validation did not confirm this candidate. No order was placed.");
        return;
    }

    var tradePlan = tradePlanService.CreateFromOpeningRangeCandidate(decision);
    if (!tradePlan.IsApproved || tradePlan.TradePlan is null)
    {
        Console.WriteLine($"NO TRADE. Risk rejected: {tradePlan.RejectionReason}; {tradePlan.Explanation}. No order was placed.");
        return;
    }

    var plan = tradePlan.TradePlan;
    Console.WriteLine($"TRADE CANDIDATE only. Entry {plan.EntryPrice:0.##}; Stop {plan.StopPrice:0.##}; Target {plan.TargetPrice:0.##}; Qty {plan.Quantity}; Risk {plan.PlannedRiskAmount:0.##}; Notional {plan.NotionalAmount:0.##}. No order was placed.");
    return;
}

if (checkLiveValidationIndex >= 0)
{
    var exchangeValue = args.ElementAtOrDefault(checkLiveValidationIndex + 1);
    var symbol = args.ElementAtOrDefault(checkLiveValidationIndex + 2);
    var securityId = args.ElementAtOrDefault(checkLiveValidationIndex + 3);
    var directionValue = args.ElementAtOrDefault(checkLiveValidationIndex + 4);
    var entryValue = args.ElementAtOrDefault(checkLiveValidationIndex + 5);
    var stopValue = args.ElementAtOrDefault(checkLiveValidationIndex + 6);
    var sessionDateValue = args.ElementAtOrDefault(checkLiveValidationIndex + 7);
    var fromValue = args.ElementAtOrDefault(checkLiveValidationIndex + 8);
    var toValue = args.ElementAtOrDefault(checkLiveValidationIndex + 9);

    if (!Enum.TryParse<Exchange>(exchangeValue, ignoreCase: true, out var exchange) ||
        string.IsNullOrWhiteSpace(symbol) ||
        string.IsNullOrWhiteSpace(securityId) ||
        !Enum.TryParse<CandidateDirection>(directionValue, ignoreCase: true, out var direction) ||
        !decimal.TryParse(entryValue, out var entry) ||
        !decimal.TryParse(stopValue, out var stop) ||
        string.IsNullOrWhiteSpace(sessionDateValue) ||
        string.IsNullOrWhiteSpace(fromValue) ||
        string.IsNullOrWhiteSpace(toValue))
    {
        Console.Error.WriteLine("Usage: --check-live-validation EXCHANGE SYMBOL SECURITY_ID Long|Short ENTRY STOP YYYY-MM-DD HH:mm HH:mm");
        return;
    }

    var instrument = new Instrument(symbol.Trim().ToUpperInvariant(), exchange, SecurityId: securityId.Trim());
    var candidate = new CandidateDecision(
        instrument,
        DecisionOutcome.Accepted,
        direction,
        100m,
        [new DecisionReason(DecisionReasonCode.OpeningRangeBreakout, "Diagnostic live-validation candidate.")],
        EntryPrice: entry,
        StopPrice: stop);

    var liveValidationService = host.Services.GetRequiredService<LiveValidationService>();
    var tradePlanService = host.Services.GetRequiredService<TradePlanGenerationService>();
    var result = await liveValidationService.ValidateAsync(
        new LiveValidationRequest(
            DateOnly.Parse(sessionDateValue),
            TimeOnly.Parse(fromValue),
            TimeOnly.Parse(toValue),
            candidate),
        CancellationToken.None);

    var decision = result.Decision;
    var reasons = string.Join(", ", decision.Reasons.Select(reason => reason.Code));
    Console.WriteLine($"{decision.Instrument.Key} {direction}: {decision.Outcome}; Reasons: {reasons}");

    if (!decision.IsAccepted)
    {
        Console.WriteLine("NO TRADE. Live validation did not confirm this candidate. No order was placed.");
        return;
    }

    var tradePlan = tradePlanService.CreateFromOpeningRangeCandidate(decision);
    if (!tradePlan.IsApproved || tradePlan.TradePlan is null)
    {
        Console.WriteLine($"NO TRADE. Risk rejected: {tradePlan.RejectionReason}; {tradePlan.Explanation}. No order was placed.");
        return;
    }

    var plan = tradePlan.TradePlan;
    Console.WriteLine($"TRADE CANDIDATE only. Entry {plan.EntryPrice:0.##}; Stop {plan.StopPrice:0.##}; Target {plan.TargetPrice:0.##}; Qty {plan.Quantity}; Risk {plan.PlannedRiskAmount:0.##}; Notional {plan.NotionalAmount:0.##}. No order was placed.");
    return;
}

if (runEodNowIndex >= 0)
{
    var runner = host.Services.GetRequiredService<EodStartupScannerRunner>();
    await runner.RunAsync(CancellationToken.None);
    Console.WriteLine("EOD scanner run completed.");
    return;
}

if (runPreMarketNowIndex >= 0)
{
    var sessionDateValue = args.ElementAtOrDefault(runPreMarketNowIndex + 1);
    var sessionDate = string.IsNullOrWhiteSpace(sessionDateValue)
        ? DateOnly.FromDateTime(DateTime.Today)
        : DateOnly.Parse(sessionDateValue);

    var runner = host.Services.GetRequiredService<PreMarketScannerRunner>();
    await runner.RunAsync(sessionDate, CancellationToken.None);
    Console.WriteLine("Pre-market scanner run completed.");
    return;
}

if (runOpeningRangeNowIndex >= 0)
{
    var sessionDateValue = args.ElementAtOrDefault(runOpeningRangeNowIndex + 1);
    var sessionDate = string.IsNullOrWhiteSpace(sessionDateValue)
        ? DateOnly.FromDateTime(DateTime.Today)
        : DateOnly.Parse(sessionDateValue);

    var runner = host.Services.GetRequiredService<OpeningRangeScannerRunner>();
    await runner.RunAsync(sessionDate, CancellationToken.None);
    Console.WriteLine("Opening-range scanner run completed.");
    return;
}

if (runLiveValidationNowIndex >= 0)
{
    var sessionDateValue = args.ElementAtOrDefault(runLiveValidationNowIndex + 1);
    var fromValue = args.ElementAtOrDefault(runLiveValidationNowIndex + 2);
    var toValue = args.ElementAtOrDefault(runLiveValidationNowIndex + 3);

    if (string.IsNullOrWhiteSpace(sessionDateValue) ||
        string.IsNullOrWhiteSpace(fromValue) ||
        string.IsNullOrWhiteSpace(toValue))
    {
        Console.Error.WriteLine("Usage: --run-live-validation-now YYYY-MM-DD HH:mm HH:mm");
        return;
    }

    var runner = host.Services.GetRequiredService<LiveValidationScannerRunner>();
    await runner.RunAsync(
        DateOnly.Parse(sessionDateValue),
        TimeOnly.Parse(fromValue),
        TimeOnly.Parse(toValue),
        CancellationToken.None);
    Console.WriteLine("Live-validation scanner run completed.");
    return;
}

if (runMonitorNowIndex >= 0)
{
    var sessionDateValue = args.ElementAtOrDefault(runMonitorNowIndex + 1);
    var fromValue = args.ElementAtOrDefault(runMonitorNowIndex + 2);
    var toValue = args.ElementAtOrDefault(runMonitorNowIndex + 3);

    if (string.IsNullOrWhiteSpace(sessionDateValue) ||
        string.IsNullOrWhiteSpace(fromValue) ||
        string.IsNullOrWhiteSpace(toValue))
    {
        Console.Error.WriteLine("Usage: --run-monitor-now YYYY-MM-DD HH:mm HH:mm");
        return;
    }

    var runner = host.Services.GetRequiredService<SignalMonitorRunner>();
    await runner.RunAsync(
        DateOnly.Parse(sessionDateValue),
        TimeOnly.Parse(fromValue),
        TimeOnly.Parse(toValue),
        CancellationToken.None);
    Console.WriteLine("Signal monitor run completed.");
    return;
}

if (runBacktestIndex >= 0)
{
    var fromValue = args.ElementAtOrDefault(runBacktestIndex + 1);
    var toValue = args.ElementAtOrDefault(runBacktestIndex + 2);
    if (string.IsNullOrWhiteSpace(fromValue) || string.IsNullOrWhiteSpace(toValue))
    {
        Console.Error.WriteLine("Usage: --run-backtest YYYY-MM-DD YYYY-MM-DD");
        return;
    }

    var scannerOptions = host.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<ScannerRunOptions>>().Value;
    var instruments = scannerOptions.GetInstruments();
    if (instruments.Count == 0)
    {
        Console.Error.WriteLine("Backtest skipped because no ScannerRun instruments are configured.");
        return;
    }

    var service = host.Services.GetRequiredService<BacktestReplayService>();
    var repository = host.Services.GetRequiredService<IBacktestReportRepository>();
    var result = await service.RunAsync(
        DateOnly.Parse(fromValue),
        DateOnly.Parse(toValue),
        instruments,
        CancellationToken.None);
    await repository.SaveBacktestRunAsync(result, CancellationToken.None);

    Console.WriteLine($"Backtest {result.FromDate:yyyy-MM-dd} to {result.ToDate:yyyy-MM-dd}: sessions {result.SessionsEvaluated}, signals {result.Signals}, wins {result.Wins}, losses {result.Losses}, flats {result.Flats}, no-exit {result.NoExitData}, win-rate {result.WinRatePercent:0.##}%, average return {result.AverageReturnPercent:0.####}%. Report persisted.");
    foreach (var trade in result.Trades.OrderByDescending(trade => trade.SignalDate).ThenBy(trade => trade.Instrument.Symbol).Take(20))
    {
        Console.WriteLine($"{trade.SignalDate:yyyy-MM-dd} {trade.Instrument.Key} {trade.Direction} -> {trade.Outcome}; entry {trade.EntryPrice:0.##}; exit {trade.ExitPrice:0.##}; return {trade.ReturnPercent:0.####}%; score {trade.Score:0.##}");
    }

    return;
}

if (telegramUpdatesIndex >= 0)
{
    var diagnostics = host.Services.GetRequiredService<TelegramBotDiagnostics>();
    var chats = await diagnostics.GetRecentChatsAsync(CancellationToken.None);
    if (chats.Count == 0)
    {
        Console.WriteLine("No Telegram chats found. Send a message to the bot first, then run this command again.");
        return;
    }

    foreach (var chat in chats)
    {
        Console.WriteLine($"{chat.ChatId} | {chat.ChatType} | {chat.DisplayName}");
    }

    return;
}

if (telegramTestIndex >= 0)
{
    var message = string.Join(' ', args.Skip(telegramTestIndex + 1));
    var diagnostics = host.Services.GetRequiredService<TelegramBotDiagnostics>();
    await diagnostics.SendTestAsync(message, CancellationToken.None);
    Console.WriteLine("Telegram test message sent.");
    return;
}

host.Run();
