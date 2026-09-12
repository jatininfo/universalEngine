# Implementation Status Report

Last updated: 2026-09-12

## Maintenance Rule

Update this file whenever a planned feature is completed, partially completed, deferred, or materially changed. Any future implementation work should include this status report update in the same change set.

Status values:

- `Done`: implemented and build-verified.
- `Partial`: usable slice exists, but planned scope remains.
- `Planned`: not started.
- `Deferred`: intentionally moved to later phase.
- `Blocked`: cannot proceed without external input or dependency.

## Current Readiness Summary

| Area | Status | Notes |
|---|---:|---|
| Build | Done | `dotnet build UniversalEngine.slnx` passes. |
| Order execution | Deferred | No broker/order placement code is implemented. Notification-only boundary is preserved. |
| Dhan API readiness | Done | Read-only Dhan verification passes for profile, fund limit, historical candles, and intraday opening-range candles. |
| Local credentials | Done | `appsettings.Local.json` is ignored by git and supports Dhan token/client id. |
| Telegram notification config | Done | Bot token and chat id are saved in ignored local config; worker Telegram test message was sent successfully. |
| Real Dhan EOD smoke test | Done | On-demand EOD run completed with RELIANCE, TCS, and INFY; run was persisted and Telegram `NO TRADE` notification succeeded. |
| Local replay | Done | Worker can run one-shot EOD replay from CSV fixtures. |
| Production trading readiness | Partial | Scanner and read-only data path exist; live validation, backtesting, paper trading, and broker safeguards remain. |

## Planned Vs Completed

| Milestone | Feature / Capability | Status | Implementation Notes | Verification |
|---:|---|---:|---|---|
| 0 | Repository bootstrap | Done | Solution, Domain/Application/Infrastructure/Worker/API projects and test projects created. | Build passes. |
| 0 | Configurable data sources: Dhan, Zerodha, Groww | Partial | Provider enum/options support all three; Dhan implemented first; Zerodha/Groww remain provider slots. | Config/build verified. |
| 0 | Dhan as primary provider | Done | Production appsettings defaults to Dhan. | Config verified. |
| 0 | Configurable capital and risk | Done | `RiskOptions` supports capital, min/max planned risk, max active signals. | Existing risk tests/build. |
| 1 | Core market/domain models | Partial | `Instrument`, daily/intraday bars, directions, trade-plan/risk models exist. Money/Price/Quantity wrappers remain planned. | Build passes. |
| 1 | Risk sizing engine | Done | Quantity, notional, planned risk, and rejection reasons implemented. | Unit tests/build. |
| 2 | Decision and reason-code model | Done | Accepted/rejected candidate decisions and reason codes implemented. | EOD workflow/build. |
| 2 | `NO TRADE` as first-class verdict | Done | Risk verdict model/service can produce `WATCHLIST` or `NO TRADE`. | Build verified. |
| 2A | Deterministic indicators | Partial | RSI, EMA, VWAP, ATR, volume ratio, price change, close location implemented. ADX, MACD, OI, PCR, support/resistance, 52-week distance remain. | Build verified. |
| 2B | Scanner scoring engine | Partial | Versioned score and factor contributions implemented for current EOD slice. Full configurable scoring model remains. | Build verified. |
| 3 | Application workflow services | Partial | EOD generation, opening-range validation, notification trigger, risk verdict services exist. Pre-market, live validation, continuous monitoring, coordinator remain. | Worker replay/build. |
| 4 | CSV market data provider | Partial | Daily CSV fixture provider exists. Intraday fixture parsing and malformed-row tests remain. | Worker replay/build. |
| 5 | SQLite persistence | Partial | Scanner runs, decisions, score factors, reasons, verdicts, and notification attempts are persisted. Full schema for signals, trade plans, AI, outcomes remains. | Build verified. |
| 5A | AI analysis agent | Planned | LLM adapter, prompt versioning, structured JSON validation not started. | Not started. |
| 5B | Market regime and final risk verdict | Partial | Basic `RiskVerdictService` exists. Market-regime inputs and final `TRADE`/`NO TRADE` approval pipeline remain. | Build verified. |
| 6 | Console notifications | Done | Console notification sender and EOD watchlist notifications implemented with persisted notification attempts and duplicate suppression. | Build verified. |
| 6 | Telegram/email notifications | Partial | Telegram sender is configured and test-send works. Email sender is scaffolded. Delivery hardening, templates, and rate limiting remain. Notification attempts are persisted. | Telegram test sent. |
| 7 | Worker automation | Partial | One-shot startup scan, on-demand EOD command, and scheduled EOD scan exist. Pre-market/opening-range schedules, live loop, monitoring loop remain. | On-demand Dhan EOD run verified. |
| 8 | Observability and operations | Partial | Structured logging basics, API health endpoint, Dhan transient retry logging, and provider error reporting exist. Metrics, full health checks, and circuit breakers remain. | API/build. |
| 9 | Dhan market-data adapter | Done | Daily and intraday candle adapter implemented with token/client-id config, actual response parsing, and configurable retry/backoff for transient 429/5xx failures. | `--verify-dhan` passes. |
| 9 | Dhan instrument master lookup | Done | API and worker CLI can search symbols and generate config with `SecurityId`. | Lookup/config commands verified. |
| 9 | Dhan connection verifier | Done | `--verify-dhan [EXCHANGE SYMBOL SECURITY_ID]` checks profile, fund limit, and historical candles. `--verify-dhan-intraday [EXCHANGE SYMBOL SECURITY_ID [YYYY-MM-DD]]` checks opening-range intraday candles. | RELIANCE checks passed. |
| 9 | Dhan EOD scanner smoke test | Done | Local ignored config contains RELIANCE, TCS, and INFY security IDs; `--run-eod-now` completed for session `2026-09-11`, persisted one scanner run, rejected 3 candidates, and sent Telegram `NO TRADE`. | API audit verified. |
| 9 | Zerodha/Groww adapters | Planned | Configurable slots exist; concrete adapters not implemented. | Not started. |
| 10 | Accuracy feedback database | Planned | Recommendation/outcome tracking and calibration reports not started. | Not started. |
| 11 | Historical replay/backtesting | Planned | Replay engine and performance reports not started. | Not started. |
| 12 | Paper trading | Planned | Paper order model and simulated positions not started. | Not started. |
| 13 | Event-driven architecture | Planned | Message events and bus adapter not started. | Not started. |
| 14 | Read-only API/dashboard | Partial | API exposes health, latest runs, run candidates, latest notification attempts, and Dhan instrument search. Active signals, accuracy endpoints, dashboard remain. | Build verified. |
| 15 | Broker integration guarded phase | Deferred | Intentionally excluded until backtesting, paper trading, manual approval, and safeguards are complete. | No order code present. |

## Ready-To-Test Commands

| Purpose | Command |
|---|---|
| Build | `dotnet build UniversalEngine.slnx` |
| Generate Dhan scanner instruments | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --build-instrument-config NSE RELIANCE TCS INFY` |
| Generate non-secret local Dhan run config | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --build-local-config NSE RELIANCE TCS INFY` |
| Verify Dhan read-only access | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --verify-dhan NSE RELIANCE 2885` |
| Verify Dhan intraday access | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --verify-dhan-intraday NSE RELIANCE 2885 2026-09-11` |
| Run one EOD scan now | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --run-eod-now` |
| Discover Telegram ChatId | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --telegram-updates` |
| Send Telegram test message | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --telegram-test` |
| Inspect notification attempts | `GET /notifications/attempts/latest?limit=20` |
| Run local CSV replay | `$env:DOTNET_ENVIRONMENT='Development'; dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj` |
| Start API | `dotnet run --project src/UniversalEngine.Api/UniversalEngine.Api.csproj` |

## Immediate Next Implementation Items

| Priority | Item | Status | Notes |
|---:|---|---:|---|
| 1 | Run full EOD scanner with real Dhan-configured instruments | Done | Completed for RELIANCE, TCS, and INFY using Dhan; scanner run and Telegram notification were persisted. |
| 2 | Add safer Dhan error reporting and retry/backoff | Done | Dhan market-data calls retry transient 429/5xx and request exceptions with configurable backoff; non-retryable provider errors include status/body context. |
| 3 | Persist notification attempts and idempotency keys | Done | EOD and opening-range alerts use stable idempotency keys and persisted delivery attempts. |
| 4 | Complete opening-range Dhan path | Partial | Service exists and Dhan intraday candles are verified for the opening-range window. End-to-end scheduled opening-range run still remains. |
| 5 | Add live validation loop | Planned | Required before true intraday alerting. |
| 6 | Add backtesting/replay foundation | Planned | Required before paper trading or broker integration. |
