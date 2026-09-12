# Automated NSE/BSE Trading Analysis Agent --- Development Plan

## 1. Objective

Turn the existing **NSE TOMORROW SCANNER V2** prompt into a continuously
running trading-analysis agent built around **C#/.NET**, market-data
APIs, deterministic technical analysis, LLM-based reasoning, risk
controls, notifications, backtesting, and paper trading.

> **Important:** The prompt is not the agent. The prompt provides
> reasoning instructions; the surrounding software supplies data, tools,
> state, risk management, execution controls, and feedback.

------------------------------------------------------------------------

## 2. High-Level Architecture

``` text
NSE / BSE / Broker / News Data
            |
            v
     .NET Data Collector
            |
            v
 PostgreSQL + Redis Cache
            |
            v
 Candidate Filtering Engine
            |
            v
 Technical / OI / Volume Analysis
            |
            v
       AI Analysis Agent
            |
            v
          Risk Agent
            |
            v
     TRADE / NO TRADE
            |
       +----+----+
       |         |
       v         v
 Notification  Paper Trading
                 |
                 v
          Optional Broker API
```

------------------------------------------------------------------------

## 3. Phase 1 --- Market Data and Storage

### 3.1 Create the .NET solution

Create a Worker Service for continuous processing:

``` bash
dotnet new sln -n TradingAgent
dotnet new worker -n TradingAgent.Worker
dotnet new webapi -n TradingAgent.Api
dotnet sln add TradingAgent.Worker
dotnet sln add TradingAgent.Api
```

### 3.2 Suggested project structure

``` text
TradingAgent
|
+-- Data
|   +-- MarketDataService.cs
|   +-- OIService.cs
|   +-- VolumeService.cs
|   +-- DeliveryService.cs
|   +-- NewsService.cs
|
+-- Analysis
|   +-- TechnicalAnalyzer.cs
|   +-- OIAnalyzer.cs
|   +-- VolumeAnalyzer.cs
|   +-- SentimentAnalyzer.cs
|   +-- BreakoutAnalyzer.cs
|
+-- Agents
|   +-- MarketRegimeAgent.cs
|   +-- StockScannerAgent.cs
|   +-- TradeDecisionAgent.cs
|   +-- RiskAgent.cs
|
+-- Notifications
|   +-- TelegramService.cs
|   +-- EmailService.cs
|
+-- Models
+-- Persistence
+-- Configuration
+-- Program.cs
```

### 3.3 Common market-data model

``` csharp
public class StockSnapshot
{
    public string Symbol { get; set; } = string.Empty;

    public decimal Price { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal PreviousClose { get; set; }

    public long Volume { get; set; }
    public decimal DeliveryPercent { get; set; }

    public decimal OpenInterest { get; set; }
    public decimal ChangeInOI { get; set; }

    public decimal Rsi { get; set; }
    public decimal Vwap { get; set; }
    public decimal Ema20 { get; set; }
    public decimal Ema50 { get; set; }
    public decimal Atr { get; set; }
}
```

### 3.4 Storage

Use:

-   **PostgreSQL** for historical snapshots, signals, trades, outcomes,
    and accuracy.
-   **Redis** for current prices, latest indicators, candidate lists,
    and other short-lived state.

------------------------------------------------------------------------

## 4. Phase 2 --- Deterministic Scanner

Do not ask the LLM to calculate indicators that can be calculated
reliably in C#.

Calculate:

-   RSI
-   EMA 20 / 50 / 200
-   VWAP
-   ATR
-   ADX
-   MACD
-   Volume ratio
-   Price change
-   Open-interest change
-   PCR
-   Support/resistance
-   Distance from 52-week high/low
-   Opening range
-   Relative strength
-   Breakout/breakdown status

### 4.1 Build a manageable candidate universe

Do not send the entire market to the LLM.

``` text
All NSE/BSE stocks
       |
       v
Liquidity / F&O filter
       |
       v
Volume and price-momentum filter
       |
       v
OI / delivery / breakout filter
       |
       v
Top 10-20 candidates
       |
       v
AI analysis
```

### 4.2 Scoring engine

Example 100-point model:

  Factor                 Maximum Score
  -------------------- ---------------
  Price momentum                    15
  Volume                            15
  Open interest                     15
  Delivery                          10
  VWAP                              10
  EMA structure                     10
  Breakout/breakdown                10
  Market regime                     10
  News/sentiment                     5
  **Total**                    **100**

Suggested initial interpretation:

-   **85--100:** Strong candidate
-   **75--84:** Candidate
-   **65--74:** Watchlist
-   **Below 65:** Ignore

These thresholds should later be validated and calibrated with
historical and paper-trading results.

------------------------------------------------------------------------

## 5. Phase 3 --- AI Trading Analysis Agent

The existing **NSE TOMORROW SCANNER V2** prompt becomes the agent's
reasoning instructions.

### 5.1 Market Regime Agent

Inputs may include:

-   NIFTY
-   BANK NIFTY
-   India VIX
-   Market breadth
-   FII/DII activity
-   Global-market context

Example output:

``` json
{
  "marketRegime": "BULLISH",
  "confidence": 82,
  "niftyBias": "UP",
  "bankNiftyBias": "UP",
  "riskLevel": "MEDIUM"
}
```

### 5.2 Give the AI structured facts

Example:

``` json
{
  "symbol": "RELIANCE",
  "price": 1520,
  "priceChange": 3.2,
  "volumeRatio": 2.8,
  "deliveryPercent": 61,
  "oiChange": 14.2,
  "rsi": 68,
  "vwap": 1498,
  "ema20": 1485,
  "ema50": 1450,
  "technicalScore": 88,
  "marketRegime": "BULLISH"
}
```

### 5.3 Force structured output

Prefer validated JSON rather than free-form prose:

``` json
{
  "symbol": "RELIANCE",
  "direction": "UP",
  "tradeType": "CE_BUY",
  "probability": 82,
  "confidence": 86,
  "entry": 1525,
  "stopLoss": 1505,
  "target1": 1550,
  "target2": 1575,
  "riskReward": 2.5,
  "reason": [
    "Strong volume expansion",
    "Positive price/OI combination",
    "Above VWAP",
    "Bullish EMA structure",
    "Breakout confirmation"
  ],
  "invalidations": [
    "Price falls below VWAP",
    "Volume dries up",
    "NIFTY turns bearish"
  ]
}
```

Validate the response against a schema before accepting it.

------------------------------------------------------------------------

## 6. Phase 4 --- Risk Agent and Final Verdict

Risk management should be a separate decision stage.

``` text
Candidate
    |
    v
Trade Analysis
    |
    v
Risk Agent
    |
    +--> Liquidity acceptable?
    +--> Risk/reward acceptable?
    +--> Stop loss reasonable?
    +--> Market regime supportive?
    +--> Conflicting signals?
    +--> Daily risk limit available?
    |
    v
TRADE / NO TRADE
```

Example:

``` json
{
  "approved": true,
  "risk": "LOW",
  "riskReward": 2.7,
  "maxRiskPercent": 1,
  "reason": "Setup has sufficient liquidity and confirmation"
}
```

### NO TRADE is a valid result

The agent must not be required to produce a trade every day.

``` text
Good technical score
        +
Conflicting OI
        +
Weak volume
        +
Unconfirmed breakout
        =
NO TRADE
```

------------------------------------------------------------------------

## 7. Phase 5 --- Real-Time Opportunity Detection

### 7.1 Market-day workflow

``` text
EOD Scan
   |
   v
Pre-market Validation
   |
   v
Market Open
   |
   v
Opening Range
   |
   v
Live Confirmation
   |
   v
Risk Calculation
   |
   v
Final Verdict
   |
   v
Entry / NO TRADE
   |
   v
Trade Management
   |
   v
Exit
   |
   v
Accuracy Log
```

### 7.2 Avoid excessive LLM calls

Market data can be processed frequently, but AI reasoning should be
triggered only by meaningful events.

``` text
Live market feed
      |
      v
C# calculations
      |
      v
Has something materially changed?
      |
   +--+--+
   |     |
  NO    YES
   |     |
Ignore  AI Analysis
```

Possible triggers:

-   Price crosses VWAP
-   Opening-range breakout
-   Unusual volume
-   Significant OI change
-   Breakout above resistance
-   Breakdown below support
-   Market-regime change
-   News/corporate-event trigger

------------------------------------------------------------------------

## 8. Event-Driven Architecture

As the system grows, introduce an event bus such as **Azure Service
Bus**.

``` text
Market Data
    |
    v
MarketDataUpdated
    |
    v
Technical Analyzer
    |
    +--> BreakoutDetected
    +--> VolumeSpikeDetected
    +--> VwapCrossDetected
    +--> OIChangeDetected
              |
              v
        Analysis Agent
              |
              v
         SignalCreated
              |
              v
          Risk Agent
              |
              v
       SignalApproved
              |
       +------+------+
       |             |
       v             v
 Notification   Paper Execution
```

This keeps the system modular and makes individual components easier to
test.

------------------------------------------------------------------------

## 9. Notifications

Start with Telegram or email.

Example notification:

``` text
TRADE OPPORTUNITY

Symbol: RELIANCE
Direction: UP
Strategy: CE BUY

Entry: 1525
Stop Loss: 1505
Target 1: 1550
Target 2: 1575

Estimated Probability: 82%
Agent Confidence: 86%
Scanner Score: 88/100

Confirmation:
- Volume 2.8x
- OI +14%
- Above VWAP
- Bullish EMA structure
- Breakout confirmed

Invalidation:
- Price below 1505
- NIFTY loses supporting structure
```

Treat AI probabilities and confidence values as model estimates, not
guaranteed probabilities.

------------------------------------------------------------------------

## 10. Accuracy and Feedback Database

Store every recommendation, including rejected signals.

Suggested `TradeSignals` fields:

``` text
Id
Timestamp
Symbol
Direction
TradeType
Entry
StopLoss
Target1
Target2
Probability
Confidence
TechnicalScore
MarketRegime
OpenInterest
Volume
Delivery
Reasons
Invalidations
Verdict
ActualEntry
ActualExit
ActualOutcome
PnL
MaxFavorableExcursion
MaxAdverseExcursion
```

### Accuracy analysis

Track results by confidence band:

``` text
Predicted 80%+  -> Actual success rate
Predicted 70-79 -> Actual success rate
Predicted 60-69 -> Actual success rate
```

Also analyze performance by:

-   Long vs short
-   Market regime
-   Sector
-   Time of day
-   Breakout type
-   Volume category
-   OI pattern
-   Day of week
-   Volatility regime

This provides evidence for recalibrating the scanner.

------------------------------------------------------------------------

## 11. Phase 6 --- Backtesting

Before automated live execution, replay historical market data through
the same rule engine.

``` text
Historical Data
      |
      v
Replay Engine
      |
      v
Scanner
      |
      v
Decision Engine
      |
      v
Simulated Execution
      |
      v
Performance Report
```

Measure at least:

-   Win rate
-   Profit factor
-   Average winner
-   Average loser
-   Expectancy
-   Maximum drawdown
-   Sharpe ratio
-   Risk/reward
-   False-breakout rate
-   Slippage
-   Brokerage/fees
-   Performance by market regime

Avoid look-ahead bias and ensure the replay engine exposes only
information that would have been available at the simulated timestamp.

------------------------------------------------------------------------

## 12. Paper Trading

After backtesting:

``` text
Live Market Data
       |
       v
Real Scanner
       |
       v
Real Signal
       |
       v
Paper Order
       |
       v
Position Monitoring
       |
       v
Simulated Exit
       |
       v
Accuracy Database
```

Run paper trading for a meaningful number of signals and different
market conditions before considering automated real-money execution.

------------------------------------------------------------------------

## 13. Broker Integration

Broker execution should be the last stage.

Add controls such as:

-   Maximum risk per trade
-   Maximum daily loss
-   Maximum concurrent positions
-   Maximum trades per day
-   Duplicate-order prevention
-   Order-state reconciliation
-   Slippage protection
-   Stale-data protection
-   Emergency kill switch
-   API failure handling
-   Circuit breaker
-   Audit logging

Initially prefer:

``` text
Agent -> Alert -> Human Approval -> Broker
```

Only consider:

``` text
Agent -> Risk Engine -> Broker
```

after the system has been adequately tested.

------------------------------------------------------------------------

## 14. Recommended Technology Stack

  Component                Recommendation
  ------------------------ ----------------------
  Language                 C# / modern .NET
  API                      ASP.NET Core
  Background processing    .NET Worker Service
  Database                 PostgreSQL
  Cache                    Redis
  Messaging                Azure Service Bus
  Technical calculations   C#
  AI reasoning             LLM API
  Dashboard                Angular
  Notifications            Telegram / Email
  Deployment               Azure / Docker
  Monitoring               Application Insights
  Logging                  Serilog
  Broker integration       Supported broker API
  Source control           Git

------------------------------------------------------------------------

## 15. Production Reliability

Add resilience before live deployment:

### API resilience

-   Timeouts
-   Controlled retries
-   Exponential backoff
-   Circuit breakers
-   Rate-limit handling
-   API-health monitoring

### Data validation

Reject or quarantine:

-   Stale quotes
-   Missing candles
-   Invalid OHLC values
-   Abnormal timestamps
-   Duplicate ticks
-   Unexpected price gaps caused by bad data

### Observability

Log:

``` text
CorrelationId
Timestamp
Symbol
Input snapshot
Rule-engine result
Prompt/version
AI response
Risk decision
Notification
Order state
Final outcome
```

Version the **prompt, scoring model, and risk rules** so historical
results can be traced to the exact logic that generated them.

------------------------------------------------------------------------

## 16. Development Roadmap

### Phase 1 --- Foundation

-   Create .NET solution
-   Connect market-data source
-   Define models
-   Configure PostgreSQL
-   Configure Redis
-   Persist candles and snapshots

### Phase 2 --- Scanner

-   Implement technical indicators
-   Implement volume/OI analysis
-   Implement candidate filtering
-   Implement scoring engine
-   Produce EOD watchlist

### Phase 3 --- AI Agent

-   Integrate LLM API
-   Convert Scanner V2 prompt into system instructions
-   Create structured input
-   Enforce structured JSON output
-   Add market-regime analysis
-   Add final trade-decision agent

### Phase 4 --- Live Validation

-   Consume live market data
-   Calculate opening range
-   Detect confirmation events
-   Revalidate EOD candidates
-   Add Risk Agent
-   Generate TRADE / NO TRADE verdict
-   Send notifications

### Phase 5 --- Evaluation

-   Store every prediction
-   Implement historical replay
-   Backtest strategy
-   Add paper trading
-   Build accuracy/calibration reports
-   Tune thresholds from evidence

### Phase 6 --- Production

-   Add Angular dashboard
-   Add monitoring and alerts
-   Add broker integration
-   Add manual approval workflow
-   Add execution safeguards
-   Consider automated execution only after validation

------------------------------------------------------------------------

## 17. Final Agent Model

``` text
                     PROMPT
                       +
                     TOOLS
                       +
                  MARKET DATA
                       +
                TECHNICAL ENGINE
                       +
                 SCORING ENGINE
                       +
                   AI REASONING
                       +
                   RISK ENGINE
                       +
                     MEMORY
                       +
               OUTCOME FEEDBACK
                       |
                       v
                TRADING AGENT
```

The **NSE TOMORROW SCANNER V2** prompt supplies the reasoning framework.
The production agent adds deterministic calculations, live data, risk
controls, persistence, monitoring, notifications, backtesting, and a
feedback loop.

------------------------------------------------------------------------

## 18. Recommended First Implementation Milestone

Do **not** begin with broker automation.

Build this vertical slice first:

``` text
Market Data
    |
    v
10-20 Candidate Stocks
    |
    v
C# Technical Analysis
    |
    v
Scanner Score
    |
    v
AI Analysis
    |
    v
Risk Validation
    |
    v
TRADE / NO TRADE
    |
    v
Telegram Alert
    |
    v
Database Accuracy Log
```

Once this pipeline runs reliably end-to-end, add real-time event
detection, backtesting, paper execution, and finally optional broker
execution.

------------------------------------------------------------------------

## 19. Safety Note

This system should be treated as a decision-support and research
platform until its behavior has been validated across sufficient
historical and live paper-trading data. Market conditions change, and
neither technical rules nor LLM judgments guarantee profitable outcomes.
Real-money execution should therefore remain behind explicit risk limits
and operational safeguards.
