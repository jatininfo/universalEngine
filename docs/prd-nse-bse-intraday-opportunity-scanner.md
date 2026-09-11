# Product Requirements Document: NSE/BSE Intraday Opportunity Scanner

## 1. Summary

Build a notification-first intraday opportunity scanner for NSE/BSE equities. The product helps a trader move from end-of-day preparation to live-market decision support through a disciplined workflow:

1. End-of-day candidate generation
2. Pre-market filtering
3. Opening-range validation
4. Live validation
5. Continuous monitoring
6. Notification trigger

The first release must not place orders. It should generate transparent, risk-sized trade plans and notify the user when conditions match configured rules.

## 2. Goals

- Identify high-quality intraday candidates before and during the trading session.
- Convert each valid signal into a clear trade plan with entry, stop, target, quantity, and planned risk.
- Enforce configurable deployable capital, defaulting to `₹20,000`, and configurable planned risk, defaulting to `₹200-₹400` per trade.
- Keep signal generation, risk sizing, notification, and any future execution layer separate.
- Persist enough data to explain every selection, rejection, alert, and system failure.
- Start with safe local/file-backed data and notification-only behavior before adding live market data.

## 3. Non-Goals

- No automated order placement in MVP.
- No broker credentials in the repository.
- No portfolio management or long-term investing features.
- No options, futures, commodities, or crypto in MVP.
- No guarantee of profitability or investment advice.
- No social/news sentiment engine in MVP unless added later behind a separate adapter.

## 4. Users

Primary user:

- An active Indian equity trader who wants a disciplined, repeatable intraday scanning workflow without manually watching every symbol.

Secondary users:

- A developer/operator who needs to inspect scanner runs, logs, rejected candidates, and notification delivery.

## 5. User Problems

- Manual watchlist creation is inconsistent and time consuming.
- Pre-market and opening-range decisions are often rushed.
- Risk sizing is easy to miscalculate during live-market movement.
- Many scanners show symbols without explaining why they were selected or invalidated.
- Alert duplication and stale market data can create confusion.

## 6. Product Principles

- Notification-first, execution-never-by-default.
- Explain every decision.
- Reject uncertain signals when data is stale or incomplete.
- Risk controls are mandatory, not advisory.
- Build local and testable before connecting real-time dependencies.
- Keep future broker execution isolated from the signal system.

## 7. Core Workflow

### 7.1 End-of-Day Candidate Generation

The system evaluates daily market data after the session closes and produces a ranked list of candidates for the next day.

Inputs:

- Daily OHLCV
- Average traded value
- Volume expansion
- Prior day range
- Closing location in range
- Delivery metrics if available
- Relative strength versus index or sector if available

Outputs:

- Candidate watchlist
- Score
- Directional bias where applicable
- Reason codes
- Rejection reasons

Acceptance criteria:

- The system can generate a candidate list from local historical data.
- Each accepted candidate includes at least one positive reason code.
- Each rejected instrument includes a machine-readable rejection reason.
- Missing or stale daily data prevents candidate generation for that symbol.

### 7.2 Pre-Market Filter

The system refines the EOD watchlist before market open.

Inputs:

- EOD candidates
- Previous close
- Pre-open indication if available
- Index or market bias if available
- Configured gap thresholds

Outputs:

- Reduced watchlist
- Updated reason codes
- Invalidated candidates

Acceptance criteria:

- Candidates outside configured gap or liquidity rules are rejected.
- If pre-market data is unavailable, the system can use a conservative fallback mode.
- The output clearly identifies whether live pre-market data or fallback data was used.

### 7.3 Opening-Range Validation

The system validates candidates after the configured opening-range window.

Inputs:

- First 5, 15, or 30 minute intraday bars
- Opening range high and low
- Relative volume
- Gap hold or gap fade behavior

Outputs:

- Validated setup candidates
- Entry trigger
- Stop level
- Invalidation level

Acceptance criteria:

- Opening range duration is configurable.
- Signals are rejected if intraday bars are incomplete or stale.
- Each validated setup has a proposed entry and stop before risk sizing runs.

### 7.4 Live Validation

The system validates whether current live-market conditions confirm the setup.

Inputs:

- Latest intraday price or candle
- Breakout/breakdown confirmation
- Volume confirmation
- Spread/liquidity constraints if available
- Market trend filter

Outputs:

- Signal
- Trade plan
- Notification eligibility

Acceptance criteria:

- No notification is sent until risk sizing passes.
- Data freshness is shown in the notification.
- The system avoids duplicate notifications for the same signal condition.

### 7.5 Continuous Monitoring

The system monitors active signals during market hours.

Inputs:

- Active signal list
- Latest price data
- Time-based invalidation rules
- Stop/target proximity

Outputs:

- Still valid
- Invalidated
- Target reached
- Stop breached
- Expired at end of session

Acceptance criteria:

- Active signals are expired at or before the configured session end.
- Monitoring events are persisted.
- Important state changes produce notifications once per state transition.

## 8. Risk Requirements

Default risk profile:

- Capital: configurable, default `₹20,000`
- Minimum planned risk: configurable, default `₹200`
- Maximum planned risk: configurable, default `₹400`
- Maximum active signals: configurable, default `3`
- No averaging down
- No pyramiding in MVP
- No order placement

Position sizing formula:

```text
riskPerShare = abs(entryPrice - stopPrice)
quantity = floor(maxRiskAmount / riskPerShare)
notional = quantity * entryPrice
plannedRisk = quantity * riskPerShare
```

Risk acceptance criteria:

- Reject if `riskPerShare <= 0`.
- Reject if quantity is zero.
- Reject if notional exceeds configured available capital.
- Reject if planned risk exceeds configured maximum planned risk.
- Reject if planned risk is below configured minimum planned risk, unless small-risk alerts are explicitly enabled.
- Every notification includes entry, stop, quantity, notional, and planned risk.

## 9. Notification Requirements

MVP channel:

- Console/log notification

Future channels:

- Email
- Telegram
- Webhook
- Mobile push if a client is added later

Notification content:

- Symbol
- Exchange
- Direction
- Entry trigger
- Stop
- Target or target rule
- Quantity
- Notional value
- Planned risk
- Reason codes
- Data freshness timestamp
- Statement that no order was placed

Acceptance criteria:

- Notifications are idempotent.
- Duplicate alerts are suppressed.
- Failed delivery attempts are recorded.
- System health issues can produce separate operational notifications.

## 10. Data Requirements

Market data:

- NSE/BSE instruments
- Daily OHLCV
- Intraday OHLCV
- Optional delivery data
- Optional index/sector data

Data quality:

- Timestamp every dataset.
- Track provider/source.
- Detect stale or incomplete data.
- Do not generate signals from uncertain live data.

MVP data source:

- File-backed CSV fixtures for repeatable testing and local replay.

Production data source:

- Configurable market-data adapters behind the same provider interfaces.
- Dhan is the default primary provider.
- Zerodha and Groww are planned configurable alternatives.
- Provider credentials must remain outside the repository.

## 11. Persistence Requirements

The system should persist:

- Instruments
- Daily bars
- Intraday bars
- Scanner runs
- Candidates
- Candidate reasons
- Signals
- Trade plans
- Monitor events
- Notification attempts

The database should support answering:

- Why did this symbol appear?
- Why was this symbol rejected?
- Which data did the scanner use?
- What risk did the scanner plan?
- Was the user notified?

## 12. Observability Requirements

Logs should include:

- Scanner run ID
- Workflow stage
- Symbol
- Exchange
- Decision
- Reason code
- Provider
- Data timestamp
- Latency

Health checks should cover:

- Database availability
- Market-data provider availability
- Latest successful EOD run
- Latest live poll
- Notification channel status

## 13. Failure Requirements

- If market data is stale, skip signal generation.
- If a provider fails, retry with backoff.
- If retries fail, record the failure and notify operationally if configured.
- If the worker restarts, resume from persisted scanner state.
- If notification delivery fails, retry without generating duplicate user alerts.

## 14. MVP Scope

MVP includes:

- .NET solution skeleton
- Domain model
- Risk sizing service
- Configurable risk options
- Configurable market-data provider selection with Dhan as primary
- File-backed historical market data
- EOD candidate generation
- Opening-range and live validation services with test fixtures
- Console/log notifications
- SQLite persistence
- Background worker scheduler
- Unit tests for risk, candidate decisions, and notification idempotency

MVP excludes:

- Broker integration
- Real order execution
- Real credentials
- Public dashboard
- Strategy optimization
- Machine learning

## 15. Success Metrics

Product success:

- Generates a daily candidate list from fixture data.
- Produces transparent reason codes for all accepted and rejected symbols.
- Sends no signal notification unless risk constraints pass.
- Runs the full workflow in local replay mode.
- Recovers from restart without duplicate notifications.

Engineering success:

- Domain logic is testable without infrastructure dependencies.
- Market data providers are swappable.
- Notifications are idempotent.
- Scanner runs are auditable.
- Future execution integration can be added without modifying signal-generation rules.

## 16. Open Decisions

- Dhan is the preferred first market-data provider for production.
- Zerodha and Groww adapter priority after Dhan.
- Whether to use EF Core or Dapper for persistence.
- Whether durable scheduling needs Quartz.NET/Hangfire or a simpler hosted service.
- First real notification channel after console/log output.
- Default opening range duration: 5, 15, or 30 minutes.
- Initial strategy rule thresholds for liquidity, volume expansion, and gap limits.
