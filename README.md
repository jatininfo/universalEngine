# UniversalEngine

Notification-first NSE/BSE intraday opportunity scanner built in C#/.NET.

## Current Implementation

- Dhan, Zerodha, and Groww are modeled as configurable market-data providers.
- Dhan is the default primary provider.
- Capital and planned-risk limits are configurable.
- The first implemented slices cover solution bootstrap, domain models, risk sizing, provider configuration, EOD candidate generation, deterministic indicators, scanner scoring, CSV daily-data replay, worker startup, and tests.
- The system does not place orders and does not store broker credentials.
- External planning inputs are tracked in `docs/external-planning-references.md`.
- The attached trading-agent development plan is preserved at `docs/source-material/NSE_BSE_Trading_Agent_Development_Plan.md` and reconciled into the PRD/development roadmap.
- Current planned/completed implementation status is tracked in `docs/implementation-status-report.md` and must be updated whenever planned features are completed.

## Implemented Scanner Slice

- `EodCandidateGenerationService` evaluates daily bars for liquidity, volume expansion, and close location.
- `TechnicalIndicatorService` calculates RSI, EMA, VWAP, ATR, volume ratio, price change, and close location.
- `ScannerScoringService` emits a versioned EOD scanner score.
- `OpeningRangeValidationService` validates EOD candidates against intraday opening-range breakout/breakdown.
- `RiskVerdictService` turns EOD results into `WATCHLIST` or `NO TRADE` verdicts.
- `NotificationTriggerService` sends EOD watchlist notifications through the configured notification sender.
- `SqliteScannerRepository` persists scanner runs, decisions, score factors, reasons, and verdicts.
- Accepted and rejected candidates include machine-readable reason codes.
- `CsvMarketDataProvider` can read local daily-bar fixtures when `MarketData:PrimaryProvider` is set to `Csv`.
- Dhan daily/intraday market data and instrument lookup are implemented; Zerodha and Groww remain configurable provider slots.

## Roadmap Additions From Attached Plan

- Deterministic technical indicators and scoring happen in C#.
- AI analysis receives structured facts and must return validated JSON.
- `NO TRADE` is a valid final verdict.
- PostgreSQL/Redis, feedback storage, backtesting, paper trading, and broker integration are later roadmap phases.
- Broker execution remains the final guarded phase, preferably after human approval, backtesting, and paper trading evidence.

## Defaults

```json
{
  "MarketData": {
    "PrimaryProvider": "Dhan",
    "EnabledProviders": [ "Dhan", "Zerodha", "Groww" ]
  },
  "Risk": {
    "CapitalAmount": 20000,
    "MinPlannedRiskAmount": 200,
    "MaxPlannedRiskAmount": 400,
    "MaxActiveSignals": 3
  }
}
```

## Build and Test

```powershell
dotnet build UniversalEngine.slnx
dotnet test UniversalEngine.slnx
```

## API Inspection

The API exposes persisted scanner runs:

```powershell
dotnet run --project src/UniversalEngine.Api/UniversalEngine.Api.csproj
```

Endpoints:

- `GET /health`
- `GET /scanner/runs/latest?limit=10`
- `GET /scanner/runs/{runId}/candidates`
- `GET /notifications/attempts/latest?limit=20`
- `GET /instruments/dhan/search?symbol=RELIANCE&exchange=NSE`

The Dhan instrument search uses the published Dhan scrip master and returns `SecurityId` values for scanner config.

CLI lookup without starting the API:

```powershell
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --lookup-symbol RELIANCE NSE
```

Generate copy-ready scanner config:

```powershell
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --build-instrument-config NSE RELIANCE TCS INFY
```

Generate a fuller local run config without secrets:

```powershell
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --build-local-config NSE RELIANCE TCS INFY
```

Keep `MarketData:Dhan:ClientId` and `MarketData:Dhan:AccessToken` in `src/UniversalEngine.Worker/appsettings.Local.json`; the generated config only fills non-secret scanner settings.

Verify Dhan credentials and market-data access without placing orders:

```powershell
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --verify-dhan NSE RELIANCE 2885
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --verify-dhan-intraday NSE RELIANCE 2885 2026-09-11
```

Run one EOD scan immediately using configured instruments:

```powershell
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --run-eod-now
```

Telegram setup helpers:

```powershell
# Send any message to the bot first, then discover the ChatId.
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --telegram-updates

# After setting Notifications:Telegram:ChatId in appsettings.Local.json.
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --telegram-test
```

## Local EOD Replay

Development mode uses CSV fixtures and runs a one-shot EOD scan on startup:

```powershell
$env:DOTNET_ENVIRONMENT='Development'
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj
```

The sample fixture currently demonstrates:

- `NSE:ABC` accepted as a long candidate
- `BSE:MNO` accepted as a short candidate
- `NSE:XYZ` rejected for insufficient liquidity
- an EOD watchlist notification with “No order was placed”
- a SQLite audit database using `Persistence:ConnectionString`

## Scheduled EOD Scan

Production config can run the EOD scan once per day after a configured local time:

```json
{
  "ScannerRun": {
    "EnableScheduledEodScan": true,
    "EodRunTimeLocal": "16:30",
    "SchedulerPollSeconds": 60
  }
}
```

Development mode keeps scheduled scanning disabled and uses one-shot replay.

## Opening Range Validation

Opening-range settings:

```json
{
  "OpeningRange": {
    "Enabled": false,
    "RangeMinutes": 15,
    "Interval": "FiveMinutes",
    "MarketOpenTime": "09:15",
    "BreakoutBufferTicks": 1,
    "MaxIntradayDataAgeMinutes": 10
  }
}
```

This stage is scaffolded as a separate service and is ready to use Dhan intraday candles.
Set `OpeningRange:Enabled` to `true` in local config when you want the worker to run it after EOD candidate generation.

## Dhan API Readiness

Dhan is the default production market-data provider. Credentials can be supplied through environment variables, user secrets, or a local config file.

Required values:

- `MarketData:Dhan:AccessToken` or `DHAN_ACCESS_TOKEN`
- `ScannerRun:Instruments[*]:SecurityId`

Local config file option:

1. Copy `src/UniversalEngine.Worker/appsettings.Local.example.json` to `src/UniversalEngine.Worker/appsettings.Local.json`.
2. Put your Dhan access token and instrument security IDs there.
3. Keep `appsettings.Local.json` local only. It is ignored by git.

PowerShell example:

```powershell
$env:DHAN_ACCESS_TOKEN='your-dhan-access-token'
$env:ScannerRun__RunEodOnStartup='true'
$env:ScannerRun__StopAfterStartupRun='true'
$env:ScannerRun__EodSessionDate='2026-09-10'
$env:ScannerRun__Instruments__0__Symbol='RELIANCE'
$env:ScannerRun__Instruments__0__Exchange='Nse'
$env:ScannerRun__Instruments__0__SecurityId='2885'
dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj
```

The Dhan adapter currently supports:

- Daily candles through `/charts/historical`
- Intraday candles through `/charts/intraday`
- NSE/BSE equity segments through `NSE_EQ` and `BSE_EQ`
- Configurable retry/backoff for transient `429` and `5xx` market-data failures

Connection note:

- Dhan account authentication can be checked with read-only account endpoints.
- Historical/intraday candle calls may still return authorization errors if market-data API access is not enabled for the token/account.

Order placement is not implemented.

## Notification Channels

Default channel is console logging. Local config can switch to Telegram or email:

```json
{
  "Notifications": {
    "Channel": "Telegram",
    "Telegram": {
      "BotToken": "your-telegram-bot-token",
      "ChatId": "your-chat-id"
    }
  }
}
```

Supported values:

- `Console`
- `Telegram`
- `Email`

For Telegram, keep `Notifications:Telegram:BotToken` and `Notifications:Telegram:ChatId` in `appsettings.Local.json`.
