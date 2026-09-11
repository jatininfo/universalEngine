# Development Plan: NSE/BSE Intraday Opportunity Scanner

## 1. Engineering Direction

This repository is currently greenfield, so the first development step is to create a clean .NET solution with strict boundaries:

- Domain rules stay pure and testable.
- Application services orchestrate workflow stages.
- Infrastructure handles data, storage, notifications, time, and external adapters.
- Worker automation schedules and runs the scanner.
- API/dashboard concerns stay optional and separate.

The first production boundary is notification-only. Order execution is intentionally excluded.

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

### `UniversalEngine.Infrastructure`

Owns:

- SQLite persistence
- Market-data providers
- CSV fixture provider
- Notification senders
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

- Choose SQLite with EF Core or Dapper.
- Add schema/migrations.
- Persist:
  - Instruments
  - Daily bars
  - Intraday bars
  - Scanner runs
  - Candidates
  - Signals
  - Trade plans
  - Monitor events
  - Notifications
- Add repository implementation.

Tests:

- Save and read scanner run.
- Save and read candidate reasons.
- Save and read trade plan risk values.
- Notification idempotency key prevents duplicates.

Acceptance criteria:

- Scanner state survives process restart.
- Database can explain past decisions.

## 10. Milestone 6: Notification MVP

Deliverables:

- Add console/log notification sender.
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

## 13. Milestone 9: Real Market-Data Adapter

Deliverables:

- Implement Dhan first as the primary provider.
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

## 14. Milestone 10: Optional API/Dashboard

Deliverables:

- Health endpoint.
- Latest scanner run endpoint.
- Latest candidates endpoint.
- Active signals endpoint.
- Notification history endpoint.

Acceptance criteria:

- API is read-only for MVP.
- API cannot place orders.
- API exposes explainability data.

## 15. Testing Strategy

Unit tests:

- Domain value objects
- Risk sizing
- Candidate decisions
- Signal validation
- Notification eligibility

Application tests:

- Full workflow with fakes
- Stale data handling
- Duplicate suppression
- Restart recovery behavior

Infrastructure tests:

- CSV parsing
- SQLite repository
- Notification idempotency
- Provider retry behavior

End-to-end replay:

- Run a full day from local fixtures.
- Verify candidates, signals, trade plans, and notifications.

## 16. Development Order

Recommended order:

1. Bootstrap solution. Done.
2. Implement domain model. Started.
3. Implement risk sizing and tests. Done.
4. Implement decision/reason model. Started for EOD candidates.
5. Implement application workflow with fakes. Started for EOD candidate generation.
6. Add CSV market data. Started for daily bars.
7. Add persistence.
8. Add notification MVP.
9. Add worker scheduling.
10. Add observability.
11. Add real market-data adapter.
12. Add optional read-only API.

## 17. Safety Checklist

Before any release:

- No broker credentials exist in code, config, docs, tests, fixtures, or git history.
- No order placement code exists in MVP projects.
- Every notification states that no order was placed.
- Configured capital and risk caps are enforced by tests.
- Stale data blocks signal generation.
- Duplicate notification suppression is tested.
- Scanner run decisions are auditable.

## 18. First Implementation Ticket

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
