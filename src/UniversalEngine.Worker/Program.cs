using UniversalEngine.Worker;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Analysis;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Notifications;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Application.Trading;
using UniversalEngine.Domain.Market;
using UniversalEngine.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
if (args.Contains("--lookup-symbol") ||
    args.Contains("--build-instrument-config") ||
    args.Contains("--build-local-config") ||
    args.Contains("--verify-dhan") ||
    args.Contains("--verify-dhan-intraday") ||
    args.Contains("--run-eod-now") ||
    args.Contains("--telegram-updates") ||
    args.Contains("--telegram-test"))
{
    builder.Logging.ClearProviders();
}
builder.Services.Configure<RiskOptions>(
    builder.Configuration.GetSection(RiskOptions.SectionName));
builder.Services.Configure<MarketDataOptions>(
    builder.Configuration.GetSection(MarketDataOptions.SectionName));
builder.Services.Configure<EodScannerOptions>(
    builder.Configuration.GetSection(EodScannerOptions.SectionName));
builder.Services.Configure<OpeningRangeOptions>(
    builder.Configuration.GetSection(OpeningRangeOptions.SectionName));
builder.Services.Configure<ScannerRunOptions>(
    builder.Configuration.GetSection(ScannerRunOptions.SectionName));
builder.Services.Configure<NotificationOptions>(
    builder.Configuration.GetSection(NotificationOptions.SectionName));
builder.Services.Configure<PersistenceOptions>(
    builder.Configuration.GetSection(PersistenceOptions.SectionName));
builder.Services.AddSingleton<TechnicalIndicatorService>();
builder.Services.AddSingleton<ScannerScoringService>();
builder.Services.AddSingleton<EodCandidateGenerationService>();
builder.Services.AddSingleton<OpeningRangeValidationService>();
builder.Services.AddSingleton<RiskVerdictService>();
builder.Services.AddSingleton<TradePlanGenerationService>();
builder.Services.AddSingleton<NotificationTriggerService>();
builder.Services.AddSingleton<EodStartupScannerRunner>();
builder.Services.AddSingleton<DhanConnectionVerifier>();
builder.Services.AddSingleton<TelegramBotDiagnostics>();
builder.Services.AddUniversalEngineInfrastructure();
var lookupSymbolIndex = Array.IndexOf(args, "--lookup-symbol");
var buildConfigIndex = Array.IndexOf(args, "--build-instrument-config");
var buildLocalConfigIndex = Array.IndexOf(args, "--build-local-config");
var verifyDhanIndex = Array.IndexOf(args, "--verify-dhan");
var verifyDhanIntradayIndex = Array.IndexOf(args, "--verify-dhan-intraday");
var runEodNowIndex = Array.IndexOf(args, "--run-eod-now");
var telegramUpdatesIndex = Array.IndexOf(args, "--telegram-updates");
var telegramTestIndex = Array.IndexOf(args, "--telegram-test");
if (lookupSymbolIndex < 0 &&
    buildConfigIndex < 0 &&
    buildLocalConfigIndex < 0 &&
    verifyDhanIndex < 0 &&
    verifyDhanIntradayIndex < 0 &&
    runEodNowIndex < 0 &&
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

if (runEodNowIndex >= 0)
{
    var runner = host.Services.GetRequiredService<EodStartupScannerRunner>();
    await runner.RunAsync(CancellationToken.None);
    Console.WriteLine("EOD scanner run completed.");
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
