# Implementation Status Report

Last updated: 2026-09-13

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
| Analysis data source | Done | EOD analysis and backtesting use configurable `AnalysisData` provider selection. Default production analysis provider is Yahoo with cache enabled; broker market data remains Dhan for final intraday validation. |
| Local credentials | Done | `appsettings.Local.json` is ignored by git and supports Dhan token/client id. |
| Scanner config hygiene | Done | Runtime instrument loading de-duplicates exchange/symbol keys while readiness still reports duplicate config entries. |
| Local scanner universe | Done | Active ignored local config has been restored to the full stable scanner universe: 49 unique NSE instruments from the original 50-entry list, with the duplicate `CIPLA` entry de-duplicated at runtime. Active instruments are visible through API/dashboard. |
| Telegram notification config | Done | Bot token and chat id are saved in ignored local config; worker Telegram test message was sent successfully. |
| Secret/log hygiene | Done | Tracked-file secret scan is clean; API/worker suppress HTTP client logs that can expose Telegram bot-token URLs. |
| Real Dhan EOD smoke test | Done | On-demand EOD run completed with RELIANCE, TCS, and INFY; run was persisted and Telegram `NO TRADE` notification succeeded. |
| Local replay | Done | Worker can run one-shot EOD replay from CSV fixtures. |
| Production trading readiness | Partial | Scanner, read-only data path, live validation, signal monitoring, simple backtest replay, and paper trading ledger exist; broker safeguards remain. |

## Planned Vs Completed

| Milestone | Feature / Capability | Status | Implementation Notes | Verification |
|---:|---|---:|---|---|
| 0 | Repository bootstrap | Done | Solution, Domain/Application/Infrastructure/Worker/API projects and test projects created. | Build passes. |
| 0 | Configurable data sources: Dhan, Zerodha, Groww | Partial | Provider enum/options support all three; Dhan implemented first; Zerodha/Groww remain provider slots. | Config/build verified. |
| 0 | Configurable analysis data source | Done | `AnalysisData:PrimaryProvider` can select Yahoo, CSV, or broker fallback for EOD/backtest analysis without changing `MarketData:PrimaryProvider`. | Build verified. |
| 0 | Dhan as primary provider | Done | Production appsettings defaults to Dhan. | Config verified. |
| 0 | Configurable capital and risk | Done | `RiskOptions` supports capital, min/max planned risk, max active signals. | Existing risk tests/build. |
| 1 | Core market/domain models | Partial | `Instrument`, daily/intraday bars, directions, trade-plan/risk models exist. Money/Price/Quantity wrappers remain planned. | Build passes. |
| 1 | Risk sizing engine | Done | Quantity, notional, planned risk, and rejection reasons implemented. | Unit tests/build. |
| 2 | Decision and reason-code model | Done | Accepted/rejected candidate decisions and reason codes implemented. | EOD workflow/build. |
| 2 | `NO TRADE` as first-class verdict | Done | Risk verdict model/service can produce `WATCHLIST` or `NO TRADE`. | Build verified. |
| 2A | Deterministic indicators | Partial | RSI, EMA, VWAP, ATR, volume ratio, price change, close location implemented. ADX, MACD, OI, PCR, support/resistance, 52-week distance remain. | Build verified. |
| 2B | Scanner scoring engine | Partial | Versioned score and factor contributions implemented for current EOD slice. Full configurable scoring model remains. | Build verified. |
| 3 | Application workflow services | Partial | EOD generation, persisted EOD candidate loading, pre-market filtering, opening-range validation, persisted opening-range trade-candidate loading, opening-range diagnostic, live-validation runner/diagnostic, signal monitoring, notification trigger, and risk verdict services exist. Higher-level coordinator remains. | Build verified. |
| 4 | CSV market data provider | Partial | Daily CSV fixture provider exists. Intraday fixture parsing and malformed-row tests remain. | Worker replay/build. |
| 5 | SQLite persistence | Partial | Scanner runs, EOD decisions, pre-market runs/decisions, opening-range runs/decisions, live-validation runs/decisions, monitor runs/events, backtest runs/trades, paper trading runs/orders, AI analysis runs/decisions, event log entries, trade-plan values, score factors, reasons, verdicts, and notification attempts are persisted. Richer outcome schema remains. | Build verified. |
| 5A | AI analysis agent | Partial | AI analysis contract, config, prompt version storage, validated structured response persistence, read API, manual API run, and dashboard visibility exist. External LLM adapter remains disabled until provider credentials/model policy are added. | Build verified. |
| 5B | Market regime and final risk verdict | Partial | Basic `RiskVerdictService` exists. Market-regime inputs and final `TRADE`/`NO TRADE` approval pipeline remain. | Build verified. |
| 6 | Console notifications | Done | Console notification sender and EOD watchlist notifications implemented with persisted notification attempts and duplicate suppression. | Build verified. |
| 6 | Telegram/email notifications | Partial | Telegram sender is configured and test-send works. Email sender is scaffolded. Delivery hardening, templates, and rate limiting remain. Notification attempts are persisted. | Telegram test sent. |
| 7 | Worker automation | Partial | One-shot startup scan, on-demand EOD command, on-demand pre-market command, on-demand opening-range command, on-demand live-validation command, on-demand monitor command, opening-range diagnostic command, live-validation diagnostic command, scheduled EOD scan, scheduled pre-market scan, scheduled opening-range scan, scheduled live-validation scan, and scheduled monitoring loop exist. Higher-level coordinator remains. | Build verified. |
| 8 | Observability and operations | Partial | Structured logging basics, API health endpoint, self-describing API root, Dhan transient retry logging, and provider error reporting exist. Metrics, full health checks, and circuit breakers remain. | API/build. |
| 9 | Dhan market-data adapter | Done | Daily and intraday candle adapter implemented with token/client-id config, actual response parsing, and configurable retry/backoff for transient 429/5xx failures. | `--verify-dhan` passes. |
| 9 | Yahoo analysis-data adapter | Done | Daily historical bars can be loaded from Yahoo's chart endpoint for NSE/BSE symbols via `.NS`/`.BO` suffixes, with in-memory cache and configurable retry. Per-symbol Yahoo failures are non-fatal and become missing-data rejections instead of crashing EOD. Intraday/final validation remains broker-backed. | Build verified. |
| 9 | Dhan instrument master lookup | Done | API and worker CLI can search symbols and generate config with `SecurityId`. | Lookup/config commands verified. |
| 9 | Dhan connection verifier | Done | `--verify-dhan [EXCHANGE SYMBOL SECURITY_ID]` checks profile, fund limit, and historical candles. `--verify-dhan-intraday [EXCHANGE SYMBOL SECURITY_ID [YYYY-MM-DD]]` checks opening-range intraday candles. | RELIANCE checks passed. |
| 9 | Dhan EOD scanner smoke test | Done | Local ignored config contains RELIANCE, TCS, and INFY security IDs; `--run-eod-now` completed for session `2026-09-11`, persisted one scanner run, rejected 3 candidates, and sent Telegram `NO TRADE`. | API audit verified. |
| 9 | Zerodha/Groww adapters | Planned | Configurable slots exist; concrete adapters not implemented. | Not started. |
| 10 | Accuracy feedback database | Partial | Persisted backtest runs/trades now provide an initial accuracy dataset with read APIs and dashboard summaries, including overall and direction-level calibration. Recommendation/outcome tracking and calibration reports by confidence/regime remain. | Build verified. |
| 11 | Historical replay/backtesting | Partial | EOD scanner replay CLI exists with next-session close outcome summary, win/loss/flat/no-exit counts, win rate, average return, persisted backtest reports, read API endpoints, and dashboard visibility. Intraday target/stop simulation remains. | Build verified; Dhan smoke replay completed for 2026-09-08 to 2026-09-10. |
| 12 | Paper trading | Partial | Simulated paper-order ledger exists with API/dashboard visibility and manual run from latest live-validation/opening-range trade candidates. Position lifecycle, P&L updates, and long-running replay remain. | Build verified. |
| 13 | Event-driven architecture | Partial | Local SQLite event log/outbox exists for completed manual pipeline stages with read API and dashboard visibility. External bus adapter and idempotent distributed handlers remain. | Build verified. |
| 14 | Read-only API/dashboard | Partial | API exposes health, active scanner instruments, latest EOD runs/candidates, latest pre-market runs/decisions, latest opening-range runs/decisions, latest live-validation runs/decisions, latest monitor runs/events, latest backtest runs/trades, backtest accuracy and direction calibration summaries, latest paper trading runs/orders, latest AI analysis runs/decisions, latest event log entries, latest broker status, latest pipeline readiness/prerequisite status with duplicate instrument warnings, latest notification attempts, Dhan instrument search, and manual notification-only pipeline run endpoints. A decoupled React/Vite dashboard app exists and consumes only the API, including stage reason summaries, backtest report visibility, paper-order visibility, AI visibility, event-log visibility, active-instrument visibility, pipeline readiness bars, and calibration bars. Full chart suite remains. | API endpoints, manual EOD run, API build, and dashboard build verified. |
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
| Run pre-market scan now | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --run-pre-market-now 2026-09-11` |
| Check opening-range candidate | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --check-opening-range NSE RELIANCE 2885 Long 2026-09-11` |
| Check live-validation candidate | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --check-live-validation NSE RELIANCE 2885 Long 3000 2950 2026-09-11 09:30 10:00` |
| Run opening-range scan now | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --run-opening-range-now 2026-09-11` |
| Run live-validation scan now | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --run-live-validation-now 2026-09-11 09:30 10:00` |
| Run signal monitor now | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --run-monitor-now 2026-09-11 09:30 10:00` |
| Run simple EOD backtest | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --run-backtest 2026-09-08 2026-09-10` |
| Discover Telegram ChatId | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --telegram-updates` |
| Send Telegram test message | `dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj -- --telegram-test` |
| Run dashboard UI | `cd web/universal-engine-dashboard; npm run dev` |
| Check broker status | `GET /broker/status` |
| Inspect active scanner instruments | `GET /scanner/instruments` |
| Check pipeline readiness | `GET /pipeline/status?sessionDate=2026-09-11` |
| Inspect backtest reports | `GET /backtests/runs/latest?limit=10` |
| Inspect backtest accuracy summary | `GET /accuracy/backtests/summary?limit=100` |
| Inspect backtest direction calibration | `GET /accuracy/backtests/by-direction?limit=100` |
| Run paper trading from API/UI | `POST /paper-trading/run?sessionDate=2026-09-11` |
| Inspect paper trading runs | `GET /paper-trading/runs/latest?limit=10` |
| Run AI analysis from API/UI | `POST /ai/run?sessionDate=2026-09-11` |
| Inspect AI analysis runs | `GET /ai/runs/latest?limit=10` |
| Inspect event log | `GET /events/latest?limit=25` |
| Run EOD from API/UI | `POST /pipeline/eod/run?sessionDate=2026-09-11` |
| Inspect notification attempts | `GET /notifications/attempts/latest?limit=20` |
| Run local CSV replay | `$env:DOTNET_ENVIRONMENT='Development'; dotnet run --project src/UniversalEngine.Worker/UniversalEngine.Worker.csproj` |
| Start API | `dotnet run --project src/UniversalEngine.Api/UniversalEngine.Api.csproj` |

## Immediate Next Implementation Items

| Priority | Item | Status | Notes |
|---:|---|---:|---|
| 1 | Run full EOD scanner with real Dhan-configured instruments | Done | Completed for RELIANCE, TCS, and INFY using Dhan; scanner run and Telegram notification were persisted. |
| 2 | Add safer Dhan error reporting and retry/backoff | Done | Dhan market-data calls retry transient 429/5xx and request exceptions with configurable backoff; non-retryable provider errors include status/body context. |
| 3 | Persist notification attempts and idempotency keys | Done | EOD and opening-range alerts use stable idempotency keys and persisted delivery attempts. |
| 4 | Complete opening-range Dhan path | Partial | Service exists, Dhan intraday candles are verified, one-candidate diagnostic returned `NO TRADE`, and on-demand/scheduled opening-range runner is implemented. Needs a day with accepted EOD candidates for full trade-plan notification verification. |
| 5 | Add live validation loop | Done | Live-validation service, manual diagnostic command, on-demand runner, and scheduled live-validation loop from stored opening-range trade candidates exist. RELIANCE diagnostic returned `NO TRADE` with Dhan intraday data. |
| 6 | Add signal monitoring loop | Done | Monitor service, persisted monitor runs/events, on-demand `--run-monitor-now`, scheduled monitoring loop, API monitor endpoints, and target/stop/expiry notifications exist. |
| 7 | Add backtesting/replay foundation | Partial | Simple EOD replay foundation is implemented, persists run/trade reports, has read API endpoints, and is visible in the dashboard. Richer metrics and intraday target/stop replay remain before paper trading. |
| 8 | Add decoupled dashboard UI | Partial | React/Vite dashboard shell is implemented under `web/universal-engine-dashboard`, reads only from `UniversalEngine.Api`, and displays health, scanner candidates, pipeline runs, stage decision details with reason summaries, broker status, monitor events, backtest reports, notifications, Dhan lookup, manual pipeline run controls, selected-date pipeline readiness/prerequisite counts, duplicate instrument config warnings, pipeline readiness bars, and calibration bars. Full chart suite remains. |

## Current Pipeline Behavior Note

Manual pre-market, opening-range, live-validation, and monitor runs are candidate-dependent. Pre-market uses accepted EOD candidates from before the selected session date; an EOD run for the same date does not feed pre-market for that date. Monitor returns a skipped result until live-validation or opening-range has produced active trade candidates for the selected session.
