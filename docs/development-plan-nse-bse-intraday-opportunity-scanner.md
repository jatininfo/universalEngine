# Development Plan: NSE/BSE Intraday Opportunity Scanner

## 1. Engineering Direction

This repository is currently greenfield, so the first development step is to create a clean .NET solution with strict boundaries:

- Domain rules stay pure and testable.
- Application services orchestrate workflow stages.
- Infrastructure handles data, storage, notifications, time, and external adapters.
- Worker automation schedules and runs the scanner.
- API/dashboard concerns stay optional and separate.

The first production boundary is notification-only. Order execution is intentionally excluded.

Before locking the production roadmap, reconcile the external ChatGPT planning conversation referenced by the project owner:

- https://chatgpt.com/c/6aa4ad7d-caec-83e8-8e68-28158761196a

If the link is not directly readable, use `docs/external-planning-references.md` as the intake checklist and merge pasted/exported content into the PRD, development plan, backlog, and tests.

The attached development plan is imported as source material at:

- `docs/source-material/NSE_BSE_Trading_Agent_Development_Plan.md`

Its requirements are part of the roadmap, but the document itself is treated as reference material. Implementation continues to follow the repository architecture, safety boundaries, and test-first slices below.

Implementation status is tracked in:

- `docs/implementation-status-report.md`

Update that report whenever a planned feature is completed, partially completed, deferred, blocked, or materially changed.

## 2. Target Repository Structure

```text
universalEngine/
  UniversalEngine.slnx
  README.md
  docs/
    prd-nse-bse-intraday-opportunity-scanner.md
    development-plan-nse-bse-intraday-opportunity-scanner.md
    nse-bse-intraday-scanner-plan.md
  src/
    UniversalEngine.Domain/
    UniversalEngine.Application/
    UniversalEngine.Infrastructure/
    UniversalEngine.Worker/
    UniversalEngine.Api/
  tests/
    UniversalEngine.Domain.Tests/
    UniversalEngine.Application.Tests/
    UniversalEngine.Infrastructure.Tests/
```

## 3. Project Responsibilities

### `UniversalEngine.Domain`

Owns:

- Entities and value objects
- Risk sizing math
- Signal and trade plan validation
- Candidate decision models
- Reason codes
- Indicator values and scoring model primitives

Must not depend on:

- Databases
- HTTP clients
- Schedulers
- Notification providers
- Framework-specific hosting code

### `UniversalEngine.Application`

Owns:

- Workflow orchestration
- Stage services
- Command handlers or use-case classes
- Interfaces for infrastructure dependencies
- Scanner run coordination

Key services:

- `EodCandidateGenerationService`
- `PreMarketFilterService`
- `OpeningRangeValidationService`
- `LiveValidationService`
- `ContinuousMonitorService`
- `RiskSizingService`
- `NotificationTriggerService`
- `ScannerRunCoordinator`
- `TechnicalIndicatorService`
- `ScannerScoringService`
- `MarketRegimeAnalysisService`
- `AiTradeAnalysisService`
- `RiskVerdictService`

### `UniversalEngine.Infrastructure`

Owns:

- SQLite persistence
- PostgreSQL persistence for production
- Redis cache for live/short-lived state
- Market-data providers
- CSV fixture provider
- Notification senders
- LLM provider adapter
- Message bus adapter in later phases
- Exchange calendar provider
- System clock
- Logging/health-check integrations

### `UniversalEngine.Worker`

Owns:

- Background scheduling
- Market-session-aware execution
- Retry handling
- Worker startup configuration
- Operational health checks

### `UniversalEngine.Api`

Optional after the worker MVP.

Owns:

- Local HTTP health endpoint
- Latest scanner run views
- Candidate and active signal read endpoints
- Notification history read endpoints

### `web/universal-engine-dashboard`

Owns:

- Decoupled application UI.
- Safe editable non-secret settings surface.
- Safe scanner-universe editor that updates local scanner instruments without exposing credentials.
- API-backed scanner, validation, monitoring, notification, and lookup views.
- Selected-date pipeline readiness and prerequisite counts before manual stage runs.
- No scanner orchestration, broker execution, provider adapters, or direct database access.

The application UI consumes `UniversalEngine.Api` as its boundary so the worker and core services remain independent and replaceable.

## 4. Milestone 0: Repository Bootstrap

Deliverables:

- Create solution and projects.
- Add test projects.
- Add common build/test commands to `README.md`.
- Add `.gitignore`.
- Choose target .NET version.
- Add configurable market-data provider options with Dhan as the default primary provider and Zerodha/Groww as alternatives.
- Add configurable risk options for capital and planned risk.
- Add baseline CI command documentation, even before real CI is configured.

Suggested commands:

```text
dotnet new sln -n UniversalEngine
dotnet new classlib -n UniversalEngine.Domain -o src/UniversalEngine.Domain
dotnet new classlib -n UniversalEngine.Application -o src/UniversalEngine.Application
dotnet new classlib -n UniversalEngine.Infrastructure -o src/UniversalEngine.Infrastructure
dotnet new worker -n UniversalEngine.Worker -o src/UniversalEngine.Worker
dotnet new webapi -n UniversalEngine.Api -o src/UniversalEngine.Api
dotnet new xunit -n UniversalEngine.Domain.Tests -o tests/UniversalEngine.Domain.Tests
dotnet new xunit -n UniversalEngine.Application.Tests -o tests/UniversalEngine.Application.Tests
dotnet new xunit -n UniversalEngine.Infrastructure.Tests -o tests/UniversalEngine.Infrastructure.Tests
```

Acceptance criteria:

- `dotnet build` succeeds.
- `dotnet test` succeeds.
- Project references follow the intended architecture.

## 5. Milestone 1: Domain and Risk Engine

Deliverables:

- Add core value objects:
  - `Money`
  - `Price`
  - `Quantity`
  - `Exchange`
  - `SignalDirection`
  - `BarInterval`
- Add domain models:
  - `Instrument`
  - `DailyBar`
  - `IntradayBar`
  - `Candidate`
  - `Signal`
  - `TradePlan`
  - `RiskProfile`
- Add risk sizing:
  - Capital cap
  - Min planned risk
  - Max planned risk
  - Quantity calculation
  - Rejection reason output

Tests:

- Reject zero stop distance.
- Reject quantity zero.
- Reject notional above configured capital.
- Reject planned risk above configured maximum risk.
- Reject planned risk below configured minimum risk unless configured.
- Size valid trade plans correctly.

Acceptance criteria:

- Risk logic is deterministic and fully unit tested.
- No infrastructure references exist in the domain project.

## 6. Milestone 2: Candidate and Signal Decision Model

Deliverables:

- Add reason-code system.
- Add accepted/rejected decision result objects.
- Add EOD candidate scoring model.
- Add opening-range validation model.
- Add live validation model.
- Add `NO TRADE` as a first-class verdict.

Reason-code examples:

- `VolumeExpansion`
- `NearDayHigh`
- `NearDayLow`
- `InsufficientLiquidity`
- `MissingDailyData`
- `StaleIntradayData`
- `OpeningRangeNotConfirmed`
- `RiskExceeded`
- `CapitalExceeded`
- `DuplicateSignalSuppressed`

Tests:

- Accepted candidate includes positive reasons.
- Rejected candidate includes rejection reasons.
- A signal cannot become notification-eligible without a valid trade plan.

Acceptance criteria:

- Every scanner decision can be explained with machine-readable reasons.

## 6A. Milestone 2A: Deterministic Technical Analysis

Deliverables:

- Add indicator models and services for:
  - RSI
  - EMA 20, 50, and 200
  - VWAP
  - ATR
  - ADX
  - MACD
  - Volume ratio
  - Price change
  - Open-interest change
  - Put-call ratio, once options data is available
  - Support/resistance
  - Distance from 52-week high/low
  - Opening range
  - Relative strength
  - Breakout/breakdown status
- Add deterministic tests with known fixture values.
- Keep all indicator calculations outside the LLM.

Acceptance criteria:

- Indicators are deterministic and unit tested.
- Invalid or insufficient input data produces explainable rejection reasons.
- Indicator outputs include source timestamps for stale-data checks.

## 6B. Milestone 2B: Scanner Scoring Engine

Deliverables:

- Implement configurable 100-point scoring model.
- Initial factors:
  - Price momentum
  - Volume
  - Open interest
  - Delivery
  - VWAP
  - EMA structure
  - Breakout/breakdown
  - Market regime
  - News/sentiment, once available
- Add score-band interpretation:
  - `85-100`: strong candidate
  - `75-84`: candidate
  - `65-74`: watchlist
  - `<65`: ignore
- Version the scoring model.

Acceptance criteria:

- Score calculation is testable without infrastructure.
- Score and factor contribution are persisted with candidate decisions.
- Thresholds are configurable for later calibration.

## 7. Milestone 3: Application Workflow Services

Deliverables:

- Define infrastructure interfaces in application layer:
  - `IMarketDataProvider`
  - `IScannerRepository`
  - `INotificationSender`
  - `IExchangeCalendarProvider`
  - `IClock`
- Implement workflow services:
  - EOD generation
  - Pre-market filter
  - Opening-range validation
  - Live validation
  - Continuous monitoring
  - Notification trigger
- Add `ScannerRunCoordinator`.

Tests:

- Full workflow with fake providers.
- Stale data prevents signal generation.
- Duplicate notification is suppressed.
- Restart-like workflow uses persisted state.

Acceptance criteria:

- The scanner can run end-to-end using in-memory fakes.
- Services do not know about concrete databases or notification channels.

## 8. Milestone 4: File-Backed Market Data

Deliverables:

- Add CSV fixture format for daily bars.
- Add CSV fixture format for intraday bars.
- Implement `CsvMarketDataProvider`.
- Add sample fixtures for a small NSE/BSE watchlist.
- Add data freshness validation.

Suggested fixture folders:

```text
tests/fixtures/market-data/daily/
tests/fixtures/market-data/intraday/
```

Tests:

- Parses daily bars.
- Parses intraday bars.
- Rejects malformed rows.
- Flags stale data.

Acceptance criteria:

- Local replay can run without network access.
- Fixtures are small and safe to commit.

## 9. Milestone 5: Persistence

Deliverables:

- Use SQLite for early local development.
- Plan PostgreSQL for production persistence.
- Plan Redis for current prices, latest indicators, candidate lists, and short-lived market state.
- Choose EF Core or Dapper for relational persistence.
- Add schema/migrations.
- Persist:
  - Instruments
  - Daily bars
  - Intraday bars
  - Scanner runs
  - Candidates
  - Candidate scores and factor contributions
  - Signals
  - Trade plans
  - Monitor events
  - Notifications
  - AI analysis responses
  - Risk verdicts
  - Prompt/scoring/risk-rule versions
  - Outcomes and accuracy fields
- Add repository implementation.

Tests:

- Save and read scanner run.
- Save and read candidate reasons.
- Save and read scanner score contributions.
- Save and read trade plan risk values.
- Notification idempotency key prevents duplicates.

Acceptance criteria:

- Scanner state survives process restart.
- Database can explain past decisions.

## 9A. Milestone 5A: AI Analysis Agent

Deliverables:

- Add LLM adapter interface.
- Convert the scanner prompt into versioned system instructions.
- Send structured facts only after deterministic filtering.
- Require structured JSON output.
- Validate response schema before accepting any AI decision.
- Add invalidation reasons and confidence/probability estimates.

Acceptance criteria:

- LLM is not called for the full market universe.
- Invalid JSON or missing required fields are rejected.
- Prompt version is persisted with each AI analysis.
- AI probability/confidence is clearly treated as an estimate.

## 9B. Milestone 5B: Market Regime And Risk Verdict

Deliverables:

- Add market-regime inputs for NIFTY, BANK NIFTY, India VIX, market breadth, FII/DII activity, and global context where data is available.
- Add `RiskVerdictService`.
- Produce final `TRADE` or `NO TRADE` verdict.
- Include liquidity, risk/reward, stop reasonableness, market-regime support, conflicting signals, daily risk availability, duplicate-signal prevention, and data freshness.

Acceptance criteria:

- `NO TRADE` is persisted and tested as a valid result.
- Risk verdict runs after scanner/AI analysis.
- Final notification is blocked unless the risk verdict approves it.

## 10. Milestone 6: Notification MVP

Deliverables:

- Add console/log notification sender.
- Add Telegram/email notification adapters after console/log sender.
- Add notification templates.
- Add idempotency keys.
- Add rate limiting per symbol and signal type.

Example notification:

```text
Signal: NSE:ABC LONG
Entry: 102.50
Stop: 100.50
Qty: 200
Notional: ₹20,500 rejected
Risk: ₹400
Reason: OpeningRangeBreakout, VolumeExpansion
No order was placed.
```

Acceptance criteria:

- Only risk-approved plans are notified.
- Rejected trade plans are persisted but not sent as trade alerts.
- Duplicate notifications are suppressed.

## 11. Milestone 7: Worker Automation

Deliverables:

- Configure market schedule.
- Add EOD scheduled job.
- Add pre-market scheduled job.
- Add opening-range scheduled job.
- Add live validation loop.
- Add continuous monitoring loop.
- Add retry/backoff policy.
- Add graceful shutdown.

Configuration classes:

- `MarketScheduleOptions`
- `ScannerOptions`
- `RiskOptions`
- `MarketDataOptions`
- `NotificationOptions`

Acceptance criteria:

- Worker runs local replay mode.
- Worker skips stages outside configured market session.
- Worker resumes cleanly from persisted checkpoints.

## 12. Milestone 8: Observability and Operations

Deliverables:

- Structured logs.
- Health checks.
- Metrics counters.
- Operational notification for system failures.
- Version tracking for prompts, scoring models, and risk rules.
- API resilience policies: timeouts, retries, exponential backoff, circuit breakers, and rate-limit handling.

Minimum health checks:

- Database reachable
- Latest EOD run status
- Latest live poll status
- Notification sender status
- Market-data provider status

Acceptance criteria:

- Failed provider calls are visible.
- Stale data decisions are visible.
- Notification failures are visible.
- Prompt/scoring/risk-rule versions are traceable from historical decisions.

## 13. Milestone 9: Real Market-Data Adapter

Deliverables:

- Implement Dhan first as the primary provider. Started for historical daily and intraday candles.
- Keep Zerodha and Groww as configurable alternatives behind the same interface.
- Implement provider adapter behind `IMarketDataProvider`.
- Add throttling.
- Add retries.
- Add data timestamp validation.
- Keep CSV provider for regression tests.

Acceptance criteria:

- Production provider can be switched by configuration.
- Dhan is the default provider in configuration.
- Scanner behavior remains testable with fixture data.
- Live data freshness is enforced before signal generation.
- Dhan credentials are read from configuration or `DHAN_ACCESS_TOKEN`, never committed.
- Dhan instruments require configured `SecurityId`.

## 14. Milestone 10: Accuracy Feedback Database

Deliverables:

- Store every recommendation, rejected signal, notification, paper trade, and outcome.
- Track:
  - Prediction timestamp
  - Symbol
  - Direction
  - Trade type
  - Entry
  - Stop
  - Targets
  - Probability
  - Confidence
  - Technical score
  - Market regime
  - Open interest
  - Volume
  - Delivery
  - Reasons
  - Invalidations
  - Verdict
  - Actual entry/exit
  - Outcome
  - PnL
  - Max favorable excursion
  - Max adverse excursion
- Add calibration reports by confidence band, direction, regime, sector, time of day, breakout type, volume category, OI pattern, day of week, and volatility regime.

Acceptance criteria:

- Rejected signals are stored, not discarded.
- Accuracy can be measured by confidence band.
- Data is sufficient to recalibrate thresholds from evidence.

## 15. Milestone 11: Historical Replay And Backtesting

Deliverables:

- Add replay engine using historical data.
- Run the same scanner/risk logic used by live processing.
- Add simulated execution and performance report.
- Include slippage and brokerage/fee assumptions.
- Avoid look-ahead bias.

Metrics:

- Win rate
- Profit factor
- Average winner
- Average loser
- Expectancy
- Maximum drawdown
- Sharpe ratio where meaningful
- Risk/reward
- False-breakout rate
- Slippage
- Brokerage/fees
- Performance by market regime

Acceptance criteria:

- Replay exposes only information available at the simulated timestamp.
- Backtest output is persisted and reproducible.
- Paper trading is not started until replay is working.

## 16. Milestone 12: Paper Trading

Deliverables:

- Add paper order model.
- Simulate entries and exits from live signals.
- Monitor paper positions.
- Persist simulated outcome and accuracy data.

Acceptance criteria:

- Paper trading runs without broker credentials.
- Paper trading uses the same risk controls as notifications.
- Real-money execution remains disabled.

## 17. Milestone 13: Event-Driven Architecture

Deliverables:

- Introduce message events when needed:
  - `MarketDataUpdated`
  - `BreakoutDetected`
  - `VolumeSpikeDetected`
  - `VwapCrossDetected`
  - `OIChangeDetected`
  - `SignalCreated`
  - `SignalApproved`
- Add message bus adapter, with Azure Service Bus as the likely production option.

Acceptance criteria:

- Components can be tested independently.
- Event handlers are idempotent.
- Message processing has retry/dead-letter behavior.

## 18. Milestone 14: API/Application UI

Deliverables:

- Health endpoint.
- Latest scanner run endpoint.
- Latest candidates endpoint.
- Active signals endpoint.
- Notification history endpoint.
- Accuracy and calibration endpoints.
- Decoupled application UI in later production scope.

Acceptance criteria:

- API supports safe operational actions and non-secret settings updates.
- API cannot place orders.
- API exposes explainability data.
- Application UI calls only the API and does not directly reference worker, infrastructure, broker, or provider services.

## 19. Milestone 15: Broker Integration Guarded Phase

Deliverables:

- Manual approval workflow first: agent alert -> human approval -> broker.
- Optional broker execution only after backtesting and paper trading evidence.
- Add safeguards:
  - Maximum risk per trade
  - Maximum daily loss
  - Maximum concurrent positions
  - Maximum trades per day
  - Duplicate-order prevention
  - Order-state reconciliation
  - Slippage protection
  - Stale-data protection
  - Emergency kill switch
  - API failure handling
  - Circuit breaker
  - Audit logging

Acceptance criteria:

- Broker credentials are never committed.
- Automated execution is disabled by default.
- Human approval path exists before any direct execution path.

## 20. Testing Strategy

Unit tests:

- Domain value objects
- Risk sizing
- Candidate decisions
- Technical indicators
- Scoring model
- Signal validation
- Notification eligibility
- Risk verdicts
- AI output schema validation

Application tests:

- Full workflow with fakes
- Stale data handling
- Duplicate suppression
- Restart recovery behavior
- NO TRADE verdict behavior
- LLM call gating after deterministic filters

Infrastructure tests:

- CSV parsing
- SQLite/PostgreSQL repository
- Redis cache adapter
- Notification idempotency
- Provider retry behavior

End-to-end replay:

- Run a full day from local fixtures.
- Verify candidates, signals, trade plans, and notifications.
- Verify feedback rows are stored.

## 21. Development Order

Recommended order:

1. Bootstrap solution. Done.
2. Implement domain model. Started.
3. Implement risk sizing and tests. Done.
4. Implement decision/reason model. Started for EOD candidates.
5. Implement application workflow with fakes. Started for EOD candidate generation.
6. Add CSV market data. Started for daily bars.
7. Add local worker startup replay. Started for EOD CSV replay.
8. Add deterministic indicators.
9. Add configurable scoring engine.
10. Add persistence.
11. Add notification MVP.
12. Add worker scheduling.
13. Add observability.
14. Add real market-data adapter.
15. Add AI analysis with structured JSON.
16. Add market-regime/risk verdict.
17. Add feedback database.
18. Add backtesting.
19. Add paper trading.
20. Add optional read-only API/dashboard.
21. Consider guarded broker integration only after evidence.

Planning checkpoint:

- Attached development plan has been imported into `docs/source-material/` and reconciled into the roadmap.
- Before implementing real broker execution, verify backtesting, paper trading, and safety milestones are complete.

## 22. Safety Checklist

## 21A. Dashboard UX and Reporting Workbench

Goal:

- Provide a user-friendly control room for manual pipeline execution, broker readiness, cache status, historical execution review, and analysis reports.

Scope:

- Keep application UI decoupled from worker and core application services; consume `UniversalEngine.Api` only.
- Allow safe editing of non-secret operational settings from the UI.
- Show workflow timeline for EOD, pre-market, opening range, live validation, and monitoring.
- Show broker/cache data-source status, including where historical cache is safe and where realtime broker calls are required.
- Show historical execution details from persisted runs and event log.
- Show report infographics for backtest accuracy, calibration, EOD candidate mix, paper-order status, and notification health.
- Preserve notification-only behavior and make clear that no order is placed.

Definition of done:

- Application UI build passes.
- API build passes.
- User can run manual pipeline stages and inspect historical reports from one UI.
- Historical daily cache visibility is exposed without causing broker calls.
- Intraday/final-validation stages remain broker-direct.

## 22. Safety Checklist

Before any release:

- No broker credentials exist in code, config, docs, tests, fixtures, or git history.
- No order placement code exists in MVP projects.
- Every notification states that no order was placed.
- Configured capital and risk caps are enforced by tests.
- Stale data blocks signal generation.
- Duplicate notification suppression is tested.
- Scanner run decisions are auditable.
- `NO TRADE` is an accepted outcome.
- Prompt, scoring model, and risk-rule versions are stored with decisions once AI/scoring phases exist.
- Broker execution remains disabled until the guarded broker milestone.

## 23. First Implementation Ticket

Title:

```text
Bootstrap UniversalEngine .NET solution and implement risk sizing core
```

Scope:

- Create solution and projects.
- Add domain value objects and models needed for `TradePlan`.
- Add `RiskProfile` and `RiskSizingService`.
- Add `RiskOptions` and `MarketDataOptions`, with Dhan as primary and Zerodha/Groww configurable.
- Add xUnit tests for valid sizing and all rejection paths.
- Update README with build/test commands.

Definition of done:

- `dotnet build` passes.
- `dotnet test` passes.
- Risk rules enforce configured capital and planned-risk limits, using `₹20,000` and `₹200-₹400` as defaults.
- No broker/order execution code is introduced.
