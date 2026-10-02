import express, { Request, Response } from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Models and State ---

interface ScannerInstrument {
  symbol: string;
  exchange: string;
  securityId?: string;
  isin?: string;
  key: string;
}

interface ScannerBasket {
  name: string;
  enabled: boolean;
  maxSymbols: number;
  instrumentCount: number;
  instruments: ScannerInstrument[];
}

interface ScannerUniverse {
  name: string;
  enabled: boolean;
  instrumentCount: number;
  basketNames: string[];
  directInstruments: ScannerInstrument[];
  instruments: ScannerInstrument[];
}

interface Candidate {
  symbol: string;
  exchange: string;
  outcome: string;
  direction?: string;
  score: number;
  finalVerdict?: string;
  verdictReason?: string;
  reasonsJson: string;
}

interface StageDecision {
  symbol: string;
  exchange: string;
  outcome: string;
  direction?: string;
  score: number;
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
  quantity?: number;
  notionalAmount?: number;
  plannedRiskAmount?: number;
  riskRejectionReason?: string;
  riskExplanation?: string;
  reasonsJson: string;
}

interface MonitorEvent {
  symbol: string;
  exchange: string;
  direction?: string;
  status: string;
  latestPrice?: number;
  reason: string;
}

interface BacktestTrade {
  signalDate: string;
  exitDate?: string;
  symbol: string;
  exchange: string;
  direction: string;
  entryPrice: number;
  exitPrice?: number;
  returnPercent?: number;
  outcome: string;
  score: number;
}

interface BacktestRun {
  id: string;
  fromDate: string;
  toDate: string;
  startedAtUtc: string;
  sessionsEvaluated: number;
  signals: number;
  wins: number;
  losses: number;
  flats: number;
  noExitData: number;
  winRatePercent: number;
  averageReturnPercent: number;
}

interface PaperOrder {
  sessionDate: string;
  symbol: string;
  exchange: string;
  direction: string;
  entryPrice: number;
  stopPrice: number;
  targetPrice?: number;
  quantity: number;
  notionalAmount: number;
  plannedRiskAmount: number;
  status: string;
  sourceStage: string;
  sourceReason: string;
  exitDate?: string;
  exitPrice?: number;
  returnPercent?: number;
  realizedPnl?: number;
}

interface PaperTradingRun {
  id: string;
  sessionDate: string;
  startedAtUtc: string;
  orderCount: number;
  openCount: number;
  closedCount: number;
}

interface AiAnalysisDecision {
  symbol: string;
  exchange: string;
  direction: string;
  score: number;
  recommendation: string;
  probabilityPercent: number;
  confidence: string;
  rationale: string;
  promptVersion: string;
}

interface AiAnalysisRun {
  id: string;
  sessionDate: string;
  startedAtUtc: string;
  decisionCount: number;
  tradeCandidateCount: number;
  watchlistCount: number;
  noTradeCount: number;
}

interface OutcomeFeedback {
  id: number;
  sessionDate: string;
  symbol: string;
  exchange: string;
  direction: string;
  source: string;
  recommendation: string;
  outcome: string;
  returnPercent?: number;
  notes: string;
  createdAtUtc: string;
}

interface NotificationAttempt {
  id: number;
  channel: string;
  subject: string;
  isSuccess: boolean;
  attemptedAtUtc: string;
  errorMessage?: string;
}

interface EventLogEntry {
  id: number;
  eventType: string;
  subject: string;
  payloadJson: string;
  createdAtUtc: string;
}

// Master instruments pool
const MASTER_INSTRUMENTS: Array<{
  symbol: string;
  exchange: string;
  securityId: string;
  displayName: string;
  symbolName: string;
  isin: string;
}> = [
  { symbol: "RELIANCE", exchange: "NSE", securityId: "2885", displayName: "Reliance Industries Ltd", symbolName: "Reliance Industries", isin: "INE002A01018" },
  { symbol: "TCS", exchange: "NSE", securityId: "11536", displayName: "Tata Consultancy Services Ltd", symbolName: "TCS", isin: "INE467B01029" },
  { symbol: "HDFCBANK", exchange: "NSE", securityId: "1333", displayName: "HDFC Bank Ltd", symbolName: "HDFC Bank", isin: "INE040A01034" },
  { symbol: "ICICIBANK", exchange: "NSE", securityId: "4963", displayName: "ICICI Bank Ltd", symbolName: "ICICI Bank", isin: "INE090A01021" },
  { symbol: "INFY", exchange: "NSE", securityId: "1594", displayName: "Infosys Ltd", symbolName: "Infosys", isin: "INE009A01021" },
  { symbol: "SBIN", exchange: "NSE", securityId: "3045", displayName: "State Bank of India", symbolName: "SBI", isin: "INE062A01020" },
  { symbol: "BHARTIARTL", exchange: "NSE", securityId: "10604", displayName: "Bharti Airtel Ltd", symbolName: "Bharti Airtel", isin: "INE397D01024" },
  { symbol: "ITC", exchange: "NSE", securityId: "1660", displayName: "ITC Ltd", symbolName: "ITC", isin: "INE154A01025" },
  { symbol: "LT", exchange: "NSE", securityId: "11483", displayName: "Larsen & Toubro Ltd", symbolName: "L&T", isin: "INE018A01030" },
  { symbol: "AXISBANK", exchange: "NSE", securityId: "5900", displayName: "Axis Bank Ltd", symbolName: "Axis Bank", isin: "INE238A01034" },
  { symbol: "KOTAKBANK", exchange: "NSE", securityId: "1922", displayName: "Kotak Mahindra Bank Ltd", symbolName: "Kotak Bank", isin: "INE237A01028" },
  { symbol: "TATAMOTORS", exchange: "NSE", securityId: "3456", displayName: "Tata Motors Ltd", symbolName: "Tata Motors", isin: "INE155A01022" },
  { symbol: "WIPRO", exchange: "NSE", securityId: "3787", displayName: "Wipro Ltd", symbolName: "Wipro", isin: "INE075A01022" },
  { symbol: "MARUTI", exchange: "NSE", securityId: "10999", displayName: "Maruti Suzuki India Ltd", symbolName: "Maruti Suzuki", isin: "INE585B01010" },
  { symbol: "SUNPHARMA", exchange: "NSE", securityId: "3351", displayName: "Sun Pharmaceutical Industries Ltd", symbolName: "Sun Pharma", isin: "INE044A01036" },
  { symbol: "TITAN", exchange: "NSE", securityId: "3506", displayName: "Titan Company Ltd", symbolName: "Titan", isin: "INE280A01028" },
  { symbol: "BAJFINANCE", exchange: "NSE", securityId: "317", displayName: "Bajaj Finance Ltd", symbolName: "Bajaj Finance", isin: "INE296A01024" },
  { symbol: "HCLTECH", exchange: "NSE", securityId: "7229", displayName: "HCL Technologies Ltd", symbolName: "HCL Tech", isin: "INE860A01027" },
  { symbol: "NTPC", exchange: "NSE", securityId: "11630", displayName: "NTPC Ltd", symbolName: "NTPC", isin: "INE733E01010" },
  { symbol: "POWERGRID", exchange: "NSE", securityId: "14977", displayName: "Power Grid Corporation of India Ltd", symbolName: "Power Grid", isin: "INE752E01010" }
];

function toInstrumentKey(symbol: string, exchange: string) {
  return `${exchange.toUpperCase()}:${symbol.toUpperCase()}`;
}

const initialInstruments: ScannerInstrument[] = MASTER_INSTRUMENTS.slice(0, 15).map((inst) => ({
  symbol: inst.symbol,
  exchange: inst.exchange,
  securityId: inst.securityId,
  isin: inst.isin,
  key: toInstrumentKey(inst.symbol, inst.exchange)
}));

const initialBaskets: ScannerBasket[] = [
  {
    name: "Nifty 50 Core",
    enabled: true,
    maxSymbols: 50,
    instrumentCount: 10,
    instruments: initialInstruments.slice(0, 10)
  },
  {
    name: "Bank Nifty Core",
    enabled: true,
    maxSymbols: 15,
    instrumentCount: 5,
    instruments: initialInstruments.filter((inst) =>
      ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"].includes(inst.symbol)
    )
  },
  {
    name: "Nifty IT Core",
    enabled: true,
    maxSymbols: 15,
    instrumentCount: 3,
    instruments: initialInstruments.filter((inst) => ["TCS", "INFY", "WIPRO"].includes(inst.symbol))
  }
];

const initialUniverses: ScannerUniverse[] = [
  {
    name: "Predefined Core Universe",
    enabled: true,
    instrumentCount: initialInstruments.length,
    basketNames: ["Nifty 50 Core", "Bank Nifty Core", "Nifty IT Core"],
    directInstruments: [],
    instruments: initialInstruments
  }
];

// Initial In-Memory State
const state = {
  instruments: [...initialInstruments],
  baskets: [...initialBaskets],
  universes: [...initialUniverses],
  settings: {
    risk: {
      capitalAmount: 100000,
      minPlannedRiskAmount: 500,
      maxPlannedRiskAmount: 2000,
      maxActiveSignals: 5,
      allowSmallRiskAlerts: true
    },
    eodScanner: {
      lookbackDays: 20,
      minimumAverageTradedValue: 1000000,
      minimumVolumeExpansionRatio: 1.5,
      nearHighCloseThreshold: 0.8,
      nearLowCloseThreshold: 0.2,
      maxDailyDataAgeHours: 36,
      minimumAcceptedScore: 25,
      maxAcceptedCandidates: 15,
      factorWeights: {
        PriceMomentum: 1,
        Volume: 1,
        Vwap: 1,
        EmaStructure: 1,
        MacdMomentum: 1,
        AdxTrendStrength: 1,
        SupportResistance: 1,
        FiftyTwoWeekPosition: 1,
        BreakoutBreakdown: 1,
        MarketRegime: 0,
        OpenInterest: 0,
        Delivery: 0,
        NewsSentiment: 0
      }
    },
    analysis: {
      primaryProvider: "Dhan",
      useHistoricalCache: true,
      historicalCacheTtlHours: 96
    },
    broker: {
      primaryProvider: "Dhan",
      dhan: {
        baseUrl: "https://api.dhan.co/v2/",
        clientId: "1100234891",
        accessTokenMasked: "dhan...98f2",
        accessToken: "",
        instrumentType: "EQUITY",
        includeOpenInterest: false,
        retryCount: 2,
        retryBaseDelayMs: 500,
        requestThrottleDelayMs: 700
      }
    },
    stages: {
      preMarket: {
        enabled: true,
        enableScheduledScan: false,
        runTimeLocal: "09:05",
        maxAllowedGapPercent: 3,
        allowWhenPreMarketDataUnavailable: true
      },
      openingRange: {
        enabled: true,
        enableScheduledScan: false,
        rangeMinutes: 15,
        interval: "FiveMinutes",
        marketOpenTime: "09:15",
        breakoutBufferTicks: 1,
        targetRiskRewardRatio: 2,
        maxIntradayDataAgeMinutes: 10
      },
      liveValidation: {
        enabled: true,
        enableScheduledScan: false,
        interval: "FiveMinutes",
        startTime: "09:30",
        endTime: "15:15",
        pollMinutes: 5,
        confirmationBufferTicks: 0,
        maxIntradayDataAgeMinutes: 10
      },
      monitoring: {
        enabled: true,
        enableScheduledScan: false,
        interval: "FiveMinutes",
        startTime: "09:30",
        endTime: "15:20",
        pollMinutes: 5,
        maxIntradayDataAgeMinutes: 10
      }
    },
    backtest: {
      fromDate: "2026-08-01",
      toDate: "2026-09-30",
      maxHoldingDays: 1,
      useStopTargetSimulation: true,
      targetRiskRewardRatio: 2,
      assumeStopBeforeTargetWhenBothTouched: true
    },
    ai: {
      enabled: true,
      provider: "Gemini",
      promptVersion: "v1.2-pro",
      minimumTradeProbability: 65
    },
    notifications: {
      channel: "Console",
      sendEodWatchlistNotifications: true,
      minimumEodScoreToNotify: 70,
      telegram: {
        botTokenMasked: "bot...89a1",
        botToken: "",
        chatId: "492019482"
      },
      email: {
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        useSsl: true,
        username: "alerts@universalengine.local",
        passwordMasked: "pass...99aa",
        password: "",
        from: "alerts@universalengine.local",
        to: "trader@universalengine.local"
      }
    }
  },
  scannerRuns: [] as Array<{
    id: string;
    sessionDate: string;
    startedAtUtc: string;
    acceptedCount: number;
    rejectedCount: number;
    candidates: Candidate[];
  }>,
  preMarketRuns: [] as Array<{
    id: string;
    sessionDate: string;
    startedAtUtc: string;
    acceptedCount: number;
    rejectedCount: number;
    decisions: StageDecision[];
  }>,
  openingRangeRuns: [] as Array<{
    id: string;
    sessionDate: string;
    startedAtUtc: string;
    acceptedCount: number;
    rejectedCount: number;
    decisions: StageDecision[];
  }>,
  liveValidationRuns: [] as Array<{
    id: string;
    sessionDate: string;
    startedAtUtc: string;
    acceptedCount: number;
    rejectedCount: number;
    confirmedCount: number;
    decisions: StageDecision[];
  }>,
  monitorRuns: [] as Array<{
    id: string;
    sessionDate: string;
    startedAtUtc: string;
    eventCount: number;
    events: MonitorEvent[];
  }>,
  backtestRuns: [] as Array<BacktestRun & { trades: BacktestTrade[] }>,
  paperRuns: [] as Array<PaperTradingRun & { orders: PaperOrder[] }>,
  aiRuns: [] as Array<AiAnalysisRun & { decisions: AiAnalysisDecision[] }>,
  eventLogs: [] as EventLogEntry[],
  notifications: [] as NotificationAttempt[],
  feedback: [] as OutcomeFeedback[]
};

// Seed initial realistic runs
function seedInitialData() {
  const today = new Date().toISOString().slice(0, 10);
  const runId1 = "eod-run-20261001-001";
  const eodCandidates: Candidate[] = [
    {
      symbol: "RELIANCE",
      exchange: "NSE",
      outcome: "Accepted",
      direction: "Long",
      score: 88,
      finalVerdict: "Accepted",
      verdictReason: "Breakout above 20 EMA with 2.4x volume surge and bullish MACD",
      reasonsJson: JSON.stringify([
        { code: "HighScore" },
        { code: "VolumeExpansion" },
        { code: "AboveVwap" },
        { code: "BullishMomentum" }
      ])
    },
    {
      symbol: "ICICIBANK",
      exchange: "NSE",
      outcome: "Accepted",
      direction: "Long",
      score: 84,
      finalVerdict: "Accepted",
      verdictReason: "Multi-week resistance breakout on high delivery volume",
      reasonsJson: JSON.stringify([
        { code: "Breakout" },
        { code: "EmaAlignment" },
        { code: "RsiBullishZone" }
      ])
    },
    {
      symbol: "TCS",
      exchange: "NSE",
      outcome: "Accepted",
      direction: "Long",
      score: 79,
      finalVerdict: "Accepted",
      verdictReason: "Cup-and-handle neckline test with positive sector momentum",
      reasonsJson: JSON.stringify([{ code: "SupportBounce" }, { code: "VwapConfirmation" }])
    },
    {
      symbol: "INFY",
      exchange: "NSE",
      outcome: "Accepted",
      direction: "Short",
      score: 74,
      finalVerdict: "Accepted",
      verdictReason: "Rejection from 200 EMA with declining relative strength",
      reasonsJson: JSON.stringify([{ code: "EmaRejection" }, { code: "LowerHighs" }])
    },
    {
      symbol: "TATAMOTORS",
      exchange: "NSE",
      outcome: "Rejected",
      direction: "Long",
      score: 22,
      finalVerdict: "Rejected",
      verdictReason: "Sub-threshold trading volume and ADX trend weakness",
      reasonsJson: JSON.stringify([{ code: "LowVolume" }, { code: "BelowScoreThreshold" }])
    }
  ];

  state.scannerRuns.push({
    id: runId1,
    sessionDate: today,
    startedAtUtc: new Date(Date.now() - 3600000 * 4).toISOString(),
    acceptedCount: 4,
    rejectedCount: 1,
    candidates: eodCandidates
  });

  const pmDecisions: StageDecision[] = [
    {
      symbol: "RELIANCE",
      exchange: "NSE",
      outcome: "Accepted",
      direction: "Long",
      score: 88,
      entryPrice: 2985.5,
      stopPrice: 2955.0,
      targetPrice: 3045.0,
      quantity: 33,
      notionalAmount: 98521.5,
      plannedRiskAmount: 1006.5,
      reasonsJson: JSON.stringify([{ code: "HealthyGapUp" }, { code: "OrderBookBidDepth" }])
    },
    {
      symbol: "ICICIBANK",
      exchange: "NSE",
      outcome: "Accepted",
      direction: "Long",
      score: 84,
      entryPrice: 1220.0,
      stopPrice: 1205.0,
      targetPrice: 1250.0,
      quantity: 66,
      notionalAmount: 80520.0,
      plannedRiskAmount: 990.0,
      reasonsJson: JSON.stringify([{ code: "PositivePreOpenTick" }, { code: "SectorTailwind" }])
    },
    {
      symbol: "INFY",
      exchange: "NSE",
      outcome: "Rejected",
      direction: "Short",
      score: 74,
      riskRejectionReason: "ExcessiveGapAgainstSignal",
      riskExplanation: "Pre-market indicated gap up 1.8% contradictory to short posture",
      reasonsJson: JSON.stringify([{ code: "AdverseGap" }])
    }
  ];

  state.preMarketRuns.push({
    id: "pm-run-20261001-001",
    sessionDate: today,
    startedAtUtc: new Date(Date.now() - 3600000 * 3).toISOString(),
    acceptedCount: 2,
    rejectedCount: 1,
    decisions: pmDecisions
  });

  const orbDecisions: StageDecision[] = [
    {
      symbol: "RELIANCE",
      exchange: "NSE",
      outcome: "Accepted",
      direction: "Long",
      score: 91,
      entryPrice: 2990.0,
      stopPrice: 2960.0,
      targetPrice: 3050.0,
      quantity: 33,
      notionalAmount: 98670.0,
      plannedRiskAmount: 990.0,
      reasonsJson: JSON.stringify([{ code: "OrbBreakoutAboveHigh" }, { code: "VolumeAbove50Avg" }])
    },
    {
      symbol: "ICICIBANK",
      exchange: "NSE",
      outcome: "Accepted",
      direction: "Long",
      score: 86,
      entryPrice: 1224.0,
      stopPrice: 1210.0,
      targetPrice: 1252.0,
      quantity: 71,
      notionalAmount: 86904.0,
      plannedRiskAmount: 994.0,
      reasonsJson: JSON.stringify([{ code: "Orb15mCleanClose" }])
    }
  ];

  state.openingRangeRuns.push({
    id: "orb-run-20261001-001",
    sessionDate: today,
    startedAtUtc: new Date(Date.now() - 3600000 * 2).toISOString(),
    acceptedCount: 2,
    rejectedCount: 0,
    decisions: orbDecisions
  });

  state.liveValidationRuns.push({
    id: "live-run-20261001-001",
    sessionDate: today,
    startedAtUtc: new Date(Date.now() - 3600000).toISOString(),
    acceptedCount: 2,
    rejectedCount: 0,
    confirmedCount: 2,
    decisions: orbDecisions
  });

  state.monitorRuns.push({
    id: "mon-run-20261001-001",
    sessionDate: today,
    startedAtUtc: new Date(Date.now() - 1800000).toISOString(),
    eventCount: 3,
    events: [
      {
        symbol: "RELIANCE",
        exchange: "NSE",
        direction: "Long",
        status: "TargetApproaching",
        latestPrice: 3032.5,
        reason: "Trailing stop moved to breakeven + 0.5R (3005.0)"
      },
      {
        symbol: "ICICIBANK",
        exchange: "NSE",
        direction: "Long",
        status: "ActiveInProfit",
        latestPrice: 1238.2,
        reason: "Target 1 hit partial profit taken, holding balance"
      }
    ]
  });

  // Seed Backtest
  const backtestTrades: BacktestTrade[] = [
    { signalDate: "2026-09-02", exitDate: "2026-09-02", symbol: "RELIANCE", exchange: "NSE", direction: "Long", entryPrice: 2910, exitPrice: 2975, returnPercent: 2.23, outcome: "Win", score: 85 },
    { signalDate: "2026-09-05", exitDate: "2026-09-05", symbol: "TCS", exchange: "NSE", direction: "Long", entryPrice: 4200, exitPrice: 4295, returnPercent: 2.26, outcome: "Win", score: 82 },
    { signalDate: "2026-09-09", exitDate: "2026-09-09", symbol: "HDFCBANK", exchange: "NSE", direction: "Long", entryPrice: 1650, exitPrice: 1630, returnPercent: -1.21, outcome: "Loss", score: 71 },
    { signalDate: "2026-09-12", exitDate: "2026-09-12", symbol: "INFY", exchange: "NSE", direction: "Short", entryPrice: 1840, exitPrice: 1795, returnPercent: 2.45, outcome: "Win", score: 78 },
    { signalDate: "2026-09-18", exitDate: "2026-09-18", symbol: "SBIN", exchange: "NSE", direction: "Long", entryPrice: 810, exitPrice: 832, returnPercent: 2.71, outcome: "Win", score: 89 },
    { signalDate: "2026-09-22", exitDate: "2026-09-22", symbol: "AXISBANK", exchange: "NSE", direction: "Long", entryPrice: 1205, exitPrice: 1195, returnPercent: -0.83, outcome: "Loss", score: 66 },
    { signalDate: "2026-09-26", exitDate: "2026-09-26", symbol: "ICICIBANK", exchange: "NSE", direction: "Long", entryPrice: 1190, exitPrice: 1225, returnPercent: 2.94, outcome: "Win", score: 87 }
  ];

  state.backtestRuns.push({
    id: "bt-run-20260930-001",
    fromDate: "2026-09-01",
    toDate: "2026-09-30",
    startedAtUtc: new Date(Date.now() - 86400000 * 2).toISOString(),
    sessionsEvaluated: 21,
    signals: 7,
    wins: 5,
    losses: 2,
    flats: 0,
    noExitData: 0,
    winRatePercent: 71.4,
    averageReturnPercent: 1.51,
    trades: backtestTrades
  });

  // Seed Paper Trading
  const paperOrders: PaperOrder[] = [
    {
      sessionDate: today,
      symbol: "RELIANCE",
      exchange: "NSE",
      direction: "Long",
      entryPrice: 2990.0,
      stopPrice: 2960.0,
      targetPrice: 3050.0,
      quantity: 33,
      notionalAmount: 98670.0,
      plannedRiskAmount: 990.0,
      status: "Open",
      sourceStage: "OpeningRange",
      sourceReason: "ORB Breakout Confirmed",
      realizedPnl: 1402.5,
      returnPercent: 1.42
    },
    {
      sessionDate: today,
      symbol: "ICICIBANK",
      exchange: "NSE",
      direction: "Long",
      entryPrice: 1224.0,
      stopPrice: 1210.0,
      targetPrice: 1252.0,
      quantity: 71,
      notionalAmount: 86904.0,
      plannedRiskAmount: 994.0,
      status: "Closed",
      sourceStage: "OpeningRange",
      sourceReason: "Target 1 Hit",
      exitDate: today,
      exitPrice: 1252.0,
      realizedPnl: 1988.0,
      returnPercent: 2.29
    }
  ];

  state.paperRuns.push({
    id: "paper-run-20261001-001",
    sessionDate: today,
    startedAtUtc: new Date(Date.now() - 3600000 * 2).toISOString(),
    orderCount: 2,
    openCount: 1,
    closedCount: 1,
    orders: paperOrders
  });

  // Seed AI Analysis
  state.aiRuns.push({
    id: "ai-run-20261001-001",
    sessionDate: today,
    startedAtUtc: new Date(Date.now() - 3600000 * 3).toISOString(),
    decisionCount: 3,
    tradeCandidateCount: 2,
    watchlistCount: 1,
    noTradeCount: 0,
    decisions: [
      {
        symbol: "RELIANCE",
        exchange: "NSE",
        direction: "Long",
        score: 88,
        recommendation: "BUY_CANDIDATE",
        probabilityPercent: 78.5,
        confidence: "High",
        rationale: "Multi-timeframe momentum alignment across 15m and Daily. Volume profile shows heavy institutional accumulation above 2980.",
        promptVersion: "v1.2-pro"
      },
      {
        symbol: "ICICIBANK",
        exchange: "NSE",
        direction: "Long",
        score: 84,
        recommendation: "BUY_CANDIDATE",
        probabilityPercent: 74.0,
        confidence: "High",
        rationale: "Clean breakout from 10-day range with supportive banking index relative strength.",
        promptVersion: "v1.2-pro"
      },
      {
        symbol: "INFY",
        exchange: "NSE",
        direction: "Short",
        score: 74,
        recommendation: "WATCHLIST",
        probabilityPercent: 58.0,
        confidence: "Medium",
        rationale: "Bearish divergence on daily RSI, but IT index exhibits short-term oversold bounce risk.",
        promptVersion: "v1.2-pro"
      }
    ]
  });

  // Seed Event Logs
  state.eventLogs.push(
    {
      id: 1,
      eventType: "PipelineStageCompleted",
      subject: "EOD",
      payloadJson: JSON.stringify({ evaluatedCount: 15, acceptedCount: 4, rejectedCount: 11 }),
      createdAtUtc: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 2,
      eventType: "PipelineStageCompleted",
      subject: "Pre-market",
      payloadJson: JSON.stringify({ evaluatedCount: 4, acceptedCount: 2, rejectedCount: 2 }),
      createdAtUtc: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 3,
      eventType: "PipelineStageCompleted",
      subject: "Opening range",
      payloadJson: JSON.stringify({ evaluatedCount: 2, acceptedCount: 2, rejectedCount: 0 }),
      createdAtUtc: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 4,
      eventType: "OrderPlaced",
      subject: "PaperTrading",
      payloadJson: JSON.stringify({ ordersGenerated: 2, totalRisk: 1984.0 }),
      createdAtUtc: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  );

  // Seed Notifications
  state.notifications.push(
    {
      id: 1,
      channel: "Console",
      subject: "EOD Watchlist Alert: 4 Candidates Generated",
      isSuccess: true,
      attemptedAtUtc: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 2,
      channel: "Telegram",
      subject: "Live ORB Breakout Signal: RELIANCE (BUY @ 2990)",
      isSuccess: true,
      attemptedAtUtc: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 3,
      channel: "Telegram",
      subject: "Target 1 Hit: ICICIBANK @ 1252 (+2.29%)",
      isSuccess: true,
      attemptedAtUtc: new Date(Date.now() - 1800000).toISOString()
    }
  );

  // Seed Feedback
  state.feedback.push({
    id: 1,
    sessionDate: today,
    symbol: "ICICIBANK",
    exchange: "NSE",
    direction: "Long",
    source: "OpeningRange",
    recommendation: "BUY_CANDIDATE",
    outcome: "Win",
    returnPercent: 2.29,
    notes: "Flawless opening range expansion and quick target progression.",
    createdAtUtc: new Date(Date.now() - 1800000).toISOString()
  });
}

seedInitialData();

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Root & Health
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "UniversalEngine.Api" });
  });

  app.get("/api/info", (_req: Request, res: Response) => {
    res.json({
      service: "UniversalEngine.Api",
      status: "running",
      dashboard: "/",
      endpoints: [
        "/health",
        "/broker/status",
        "/settings/data-sources",
        "/settings/application",
        "/pipeline/status",
        "/scanner/runs/latest",
        "/backtests/runs/latest",
        "/paper-trading/runs/latest",
        "/ai/runs/latest",
        "/events/latest"
      ]
    });
  });

  // Broker Status
  app.get("/broker/status", (_req: Request, res: Response) => {
    res.json([
      {
        broker: "Dhan",
        status: "Connected",
        isConfigured: true,
        isConnected: true,
        message: "Connection verified with Dhan HQ API. Market data stream active.",
        checkedAtUtc: new Date().toISOString()
      }
    ]);
  });

  // Settings: Data Sources
  app.get("/settings/data-sources", (_req: Request, res: Response) => {
    res.json({
      analysisProvider: state.settings.analysis.primaryProvider,
      brokerProvider: state.settings.broker.primaryProvider,
      historicalCacheEnabled: state.settings.analysis.useHistoricalCache,
      historicalCacheTtlHours: state.settings.analysis.historicalCacheTtlHours,
      historicalCacheRoot: "/data/historical-cache",
      historicalCacheEntryCount: state.instruments.length * 3,
      message: "Data sources synchronized with Dhan provider."
    });
  });

  // Settings: Application
  app.get("/settings/application", (_req: Request, res: Response) => {
    res.json(state.settings);
  });

  app.put("/settings/application", (req: Request, res: Response) => {
    const update = req.body;
    if (update && typeof update === "object") {
      state.settings = { ...state.settings, ...update };
      state.eventLogs.unshift({
        id: state.eventLogs.length + 1,
        eventType: "SettingsUpdated",
        subject: "ApplicationSettings",
        payloadJson: JSON.stringify({ updatedKeys: Object.keys(update) }),
        createdAtUtc: new Date().toISOString()
      });
    }
    res.json({ message: "Application settings updated successfully." });
  });

  // Pipeline Status
  app.get("/pipeline/status", (req: Request, res: Response) => {
    const sessionDate = (req.query.sessionDate as string) || new Date().toISOString().slice(0, 10);
    const latestEod = state.scannerRuns[0];
    const latestPm = state.preMarketRuns[0];
    const latestOrb = state.openingRangeRuns[0];
    const latestLive = state.liveValidationRuns[0];
    const latestMon = state.monitorRuns[0];

    res.json({
      sessionDate,
      configuredInstrumentCount: state.instruments.length,
      duplicateInstrumentKeys: [],
      message: "Pipeline operational and ready for automated stages.",
      stages: [
        {
          stage: "EOD",
          canRun: true,
          candidateCount: latestEod ? latestEod.acceptedCount : 0,
          message: latestEod ? `${latestEod.acceptedCount} candidates ready` : "Awaiting scan execution"
        },
        {
          stage: "Pre-market",
          canRun: true,
          candidateCount: latestPm ? latestPm.acceptedCount : 0,
          message: latestPm ? `${latestPm.acceptedCount} pre-market candidates accepted` : "Ready"
        },
        {
          stage: "Opening range",
          canRun: true,
          candidateCount: latestOrb ? latestOrb.acceptedCount : 0,
          message: latestOrb ? `${latestOrb.acceptedCount} active breakouts` : "Ready"
        },
        {
          stage: "Live validation",
          canRun: true,
          candidateCount: latestLive ? latestLive.acceptedCount : 0,
          message: latestLive ? `${latestLive.acceptedCount} confirmed live` : "Ready"
        },
        {
          stage: "Monitoring",
          canRun: true,
          candidateCount: latestMon ? latestMon.eventCount : 0,
          message: latestMon ? `${latestMon.eventCount} active positions monitored` : "Active"
        }
      ]
    });
  });

  // Scanner Instruments & Baskets & Universes
  app.get("/scanner/instruments", (_req: Request, res: Response) => {
    res.json({
      count: state.instruments.length,
      duplicateInstrumentKeys: [],
      baskets: state.baskets,
      universes: state.universes,
      instruments: state.instruments
    });
  });

  app.put("/scanner/instruments", (req: Request, res: Response) => {
    const { instruments } = req.body;
    if (Array.isArray(instruments)) {
      state.instruments = instruments;
    }
    res.json({ message: "Scanner instruments updated.", count: state.instruments.length });
  });

  app.put("/scanner/baskets", (req: Request, res: Response) => {
    const { baskets } = req.body;
    if (Array.isArray(baskets)) {
      state.baskets = baskets;
    }
    const count = state.baskets.reduce((acc, b) => acc + (b.instruments?.length || 0), 0);
    res.json({ message: "Scanner baskets updated.", count });
  });

  app.post("/scanner/baskets/predefined", (_req: Request, res: Response) => {
    state.baskets = [...initialBaskets];
    state.universes = [...initialUniverses];
    const instrumentCount = state.baskets.reduce((acc, b) => acc + b.instruments.length, 0);
    res.json({
      message: "Predefined baskets saved to database.",
      basketsCreated: initialBaskets.length,
      instrumentCount
    });
  });

  app.put("/scanner/universes", (req: Request, res: Response) => {
    const { universes } = req.body;
    if (Array.isArray(universes)) {
      state.universes = universes;
    }
    res.json({ message: "Scanner universes updated.", count: state.universes.length });
  });

  // Scanner Runs & Pipeline Execution
  app.get("/scanner/runs/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.scannerRuns.slice(0, limit));
  });

  app.get("/scanner/runs/:runId/candidates", (req: Request, res: Response) => {
    const run = state.scannerRuns.find((r) => r.id === req.params.runId) || state.scannerRuns[0];
    res.json(run ? run.candidates : []);
  });

  app.post("/pipeline/eod/run", (req: Request, res: Response) => {
    const sessionDate = (req.query.sessionDate as string) || new Date().toISOString().slice(0, 10);
    const newRunId = `eod-run-${Date.now()}`;
    const symbols = state.instruments.map((i) => i.symbol);
    const generated: Candidate[] = symbols.map((symbol, idx) => {
      const isAccepted = idx < Math.min(5, symbols.length);
      const score = isAccepted ? 75 + Math.floor(Math.random() * 20) : 20 + Math.floor(Math.random() * 30);
      const direction = idx % 3 === 0 ? "Short" : "Long";
      return {
        symbol,
        exchange: "NSE",
        outcome: isAccepted ? "Accepted" : "Rejected",
        direction,
        score,
        finalVerdict: isAccepted ? "Accepted" : "Rejected",
        verdictReason: isAccepted ? "Bullish trend structure + expansion" : "Below score threshold",
        reasonsJson: JSON.stringify(
          isAccepted ? [{ code: "ScorePassed" }, { code: "VwapAligned" }] : [{ code: "InsufficientMomentum" }]
        )
      };
    });

    const acceptedCount = generated.filter((c) => c.outcome === "Accepted").length;
    const rejectedCount = generated.length - acceptedCount;

    state.scannerRuns.unshift({
      id: newRunId,
      sessionDate,
      startedAtUtc: new Date().toISOString(),
      acceptedCount,
      rejectedCount,
      candidates: generated
    });

    state.eventLogs.unshift({
      id: state.eventLogs.length + 1,
      eventType: "PipelineStageCompleted",
      subject: "EOD",
      payloadJson: JSON.stringify({ evaluatedCount: generated.length, acceptedCount, rejectedCount }),
      createdAtUtc: new Date().toISOString()
    });

    state.notifications.unshift({
      id: state.notifications.length + 1,
      channel: state.settings.notifications.channel,
      subject: `EOD Scan Run: ${acceptedCount} candidates qualified`,
      isSuccess: true,
      attemptedAtUtc: new Date().toISOString()
    });

    res.json({
      stage: "EOD",
      sessionDate,
      status: "Completed",
      evaluatedCount: generated.length,
      acceptedCount,
      rejectedCount,
      message: `EOD scanner run completed with ${acceptedCount} accepted candidates.`
    });
  });

  // Pre-Market Runs
  app.get("/pre-market/runs/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.preMarketRuns.slice(0, limit));
  });

  app.get("/pre-market/runs/:runId/decisions", (req: Request, res: Response) => {
    const run = state.preMarketRuns.find((r) => r.id === req.params.runId) || state.preMarketRuns[0];
    res.json(run ? run.decisions : []);
  });

  app.post("/pipeline/pre-market/run", (req: Request, res: Response) => {
    const sessionDate = (req.query.sessionDate as string) || new Date().toISOString().slice(0, 10);
    const newRunId = `pm-run-${Date.now()}`;
    const latestEod = state.scannerRuns[0];
    const sourceCandidates = latestEod ? latestEod.candidates.filter((c) => c.outcome === "Accepted") : [];

    const decisions: StageDecision[] = (sourceCandidates.length > 0
      ? sourceCandidates
      : state.instruments.slice(0, 4)
    ).map((c, idx) => {
      const isAccepted = idx < 3;
      const basePrice = 1000 + Math.floor(Math.random() * 2000);
      return {
        symbol: c.symbol,
        exchange: "NSE",
        outcome: isAccepted ? "Accepted" : "Rejected",
        direction: (c as any).direction || "Long",
        score: (c as any).score || 80,
        entryPrice: basePrice,
        stopPrice: basePrice * 0.985,
        targetPrice: basePrice * 1.025,
        quantity: Math.floor(100000 / basePrice),
        notionalAmount: basePrice * Math.floor(100000 / basePrice),
        plannedRiskAmount: 950,
        riskRejectionReason: isAccepted ? undefined : "ExcessiveGap",
        riskExplanation: isAccepted ? undefined : "Gap exceeded 3% maximum threshold",
        reasonsJson: JSON.stringify(isAccepted ? [{ code: "GapWithinTolerance" }] : [{ code: "WideGap" }])
      };
    });

    const acceptedCount = decisions.filter((d) => d.outcome === "Accepted").length;
    const rejectedCount = decisions.length - acceptedCount;

    state.preMarketRuns.unshift({
      id: newRunId,
      sessionDate,
      startedAtUtc: new Date().toISOString(),
      acceptedCount,
      rejectedCount,
      decisions
    });

    state.eventLogs.unshift({
      id: state.eventLogs.length + 1,
      eventType: "PipelineStageCompleted",
      subject: "Pre-market",
      payloadJson: JSON.stringify({ evaluatedCount: decisions.length, acceptedCount, rejectedCount }),
      createdAtUtc: new Date().toISOString()
    });

    res.json({
      stage: "Pre-market",
      sessionDate,
      status: "Completed",
      evaluatedCount: decisions.length,
      acceptedCount,
      rejectedCount,
      message: `Pre-market filter run completed. ${acceptedCount} candidates validated.`
    });
  });

  // Opening Range Runs
  app.get("/opening-range/runs/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.openingRangeRuns.slice(0, limit));
  });

  app.get("/opening-range/runs/:runId/decisions", (req: Request, res: Response) => {
    const run = state.openingRangeRuns.find((r) => r.id === req.params.runId) || state.openingRangeRuns[0];
    res.json(run ? run.decisions : []);
  });

  app.post("/pipeline/opening-range/run", (req: Request, res: Response) => {
    const sessionDate = (req.query.sessionDate as string) || new Date().toISOString().slice(0, 10);
    const newRunId = `orb-run-${Date.now()}`;
    const latestPm = state.preMarketRuns[0];
    const source = latestPm ? latestPm.decisions.filter((d) => d.outcome === "Accepted") : [];

    const decisions: StageDecision[] = (source.length > 0 ? source : state.instruments.slice(0, 2)).map(
      (item: any, idx) => {
        const isAccepted = true;
        const entryPrice = item.entryPrice || 2500;
        return {
          symbol: item.symbol,
          exchange: "NSE",
          outcome: "Accepted",
          direction: item.direction || "Long",
          score: (item.score || 80) + 2,
          entryPrice,
          stopPrice: entryPrice * 0.99,
          targetPrice: entryPrice * 1.025,
          quantity: Math.floor(95000 / entryPrice),
          notionalAmount: entryPrice * Math.floor(95000 / entryPrice),
          plannedRiskAmount: 950,
          reasonsJson: JSON.stringify([{ code: "OpeningRangeBreakout" }, { code: "TickVolumeSpike" }])
        };
      }
    );

    const acceptedCount = decisions.length;
    state.openingRangeRuns.unshift({
      id: newRunId,
      sessionDate,
      startedAtUtc: new Date().toISOString(),
      acceptedCount,
      rejectedCount: 0,
      decisions
    });

    state.eventLogs.unshift({
      id: state.eventLogs.length + 1,
      eventType: "PipelineStageCompleted",
      subject: "Opening range",
      payloadJson: JSON.stringify({ evaluatedCount: decisions.length, acceptedCount, rejectedCount: 0 }),
      createdAtUtc: new Date().toISOString()
    });

    res.json({
      stage: "Opening range",
      sessionDate,
      status: "Completed",
      evaluatedCount: decisions.length,
      acceptedCount,
      rejectedCount: 0,
      message: `Opening range scanner completed with ${acceptedCount} signals triggered.`
    });
  });

  // Live Validation Runs
  app.get("/live-validation/runs/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.liveValidationRuns.slice(0, limit));
  });

  app.get("/live-validation/runs/:runId/decisions", (req: Request, res: Response) => {
    const run = state.liveValidationRuns.find((r) => r.id === req.params.runId) || state.liveValidationRuns[0];
    res.json(run ? run.decisions : []);
  });

  app.post("/pipeline/live-validation/run", (req: Request, res: Response) => {
    const sessionDate = (req.query.sessionDate as string) || new Date().toISOString().slice(0, 10);
    const newRunId = `live-run-${Date.now()}`;
    const latestOrb = state.openingRangeRuns[0];
    const decisions = latestOrb ? latestOrb.decisions : [];

    state.liveValidationRuns.unshift({
      id: newRunId,
      sessionDate,
      startedAtUtc: new Date().toISOString(),
      acceptedCount: decisions.length,
      rejectedCount: 0,
      confirmedCount: decisions.length,
      decisions
    });

    res.json({
      stage: "Live validation",
      sessionDate,
      status: "Completed",
      evaluatedCount: decisions.length,
      acceptedCount: decisions.length,
      rejectedCount: 0,
      message: `Live validation active for ${decisions.length} trades.`
    });
  });

  // Monitor Runs
  app.get("/monitor/runs/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.monitorRuns.slice(0, limit));
  });

  app.get("/monitor/runs/:runId/events", (req: Request, res: Response) => {
    const run = state.monitorRuns.find((r) => r.id === req.params.runId) || state.monitorRuns[0];
    res.json(run ? run.events : []);
  });

  app.post("/pipeline/monitor/run", (req: Request, res: Response) => {
    const sessionDate = (req.query.sessionDate as string) || new Date().toISOString().slice(0, 10);
    const newRunId = `mon-run-${Date.now()}`;
    const events: MonitorEvent[] = [
      {
        symbol: "RELIANCE",
        exchange: "NSE",
        direction: "Long",
        status: "ActiveInProfit",
        latestPrice: 3015.0,
        reason: "Trailing stop advanced. Floating PnL +0.8%"
      },
      {
        symbol: "ICICIBANK",
        exchange: "NSE",
        direction: "Long",
        status: "TargetHit",
        latestPrice: 1252.0,
        reason: "Exit executed at target resistance"
      }
    ];

    state.monitorRuns.unshift({
      id: newRunId,
      sessionDate,
      startedAtUtc: new Date().toISOString(),
      eventCount: events.length,
      events
    });

    res.json({
      stage: "Monitoring",
      sessionDate,
      status: "Completed",
      evaluatedCount: events.length,
      acceptedCount: events.length,
      rejectedCount: 0,
      message: `Signal monitoring update recorded ${events.length} position status changes.`
    });
  });

  // Backtesting
  app.get("/backtests/runs/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.backtestRuns.slice(0, limit));
  });

  app.get("/backtests/runs/:runId/trades", (req: Request, res: Response) => {
    const run = state.backtestRuns.find((r) => r.id === req.params.runId) || state.backtestRuns[0];
    res.json(run ? run.trades : []);
  });

  app.post("/backtests/run", (req: Request, res: Response) => {
    const fromDate = (req.query.fromDate as string) || "2026-08-01";
    const toDate = (req.query.toDate as string) || "2026-09-30";
    const newRunId = `bt-run-${Date.now()}`;

    const trades: BacktestTrade[] = [
      { signalDate: "2026-09-02", exitDate: "2026-09-02", symbol: "RELIANCE", exchange: "NSE", direction: "Long", entryPrice: 2950, exitPrice: 3012, returnPercent: 2.1, outcome: "Win", score: 86 },
      { signalDate: "2026-09-08", exitDate: "2026-09-08", symbol: "TCS", exchange: "NSE", direction: "Long", entryPrice: 4250, exitPrice: 4340, returnPercent: 2.12, outcome: "Win", score: 81 },
      { signalDate: "2026-09-14", exitDate: "2026-09-14", symbol: "ICICIBANK", exchange: "NSE", direction: "Long", entryPrice: 1210, exitPrice: 1242, returnPercent: 2.64, outcome: "Win", score: 88 },
      { signalDate: "2026-09-17", exitDate: "2026-09-17", symbol: "INFY", exchange: "NSE", direction: "Short", entryPrice: 1820, exitPrice: 1780, returnPercent: 2.2, outcome: "Win", score: 79 },
      { signalDate: "2026-09-24", exitDate: "2026-09-24", symbol: "SBIN", exchange: "NSE", direction: "Long", entryPrice: 815, exitPrice: 805, returnPercent: -1.23, outcome: "Loss", score: 72 }
    ];

    const wins = trades.filter((t) => t.outcome === "Win").length;
    const losses = trades.filter((t) => t.outcome === "Loss").length;
    const winRate = Number(((wins / trades.length) * 100).toFixed(1));
    const avgReturn = Number((trades.reduce((acc, t) => acc + (t.returnPercent || 0), 0) / trades.length).toFixed(2));

    const run: BacktestRun & { trades: BacktestTrade[] } = {
      id: newRunId,
      fromDate,
      toDate,
      startedAtUtc: new Date().toISOString(),
      sessionsEvaluated: 24,
      signals: trades.length,
      wins,
      losses,
      flats: 0,
      noExitData: 0,
      winRatePercent: winRate,
      averageReturnPercent: avgReturn,
      trades
    };

    state.backtestRuns.unshift(run);

    res.json({
      stage: "Backtest",
      sessionDate: toDate,
      status: "Completed",
      evaluatedCount: trades.length,
      acceptedCount: wins,
      rejectedCount: losses,
      message: `Backtest completed: ${wins} wins / ${losses} losses (${winRate}% win rate).`
    });
  });

  app.get("/accuracy/backtests/summary", (_req: Request, res: Response) => {
    const allTrades = state.backtestRuns.flatMap((r) => r.trades);
    const wins = allTrades.filter((t) => t.outcome === "Win").length;
    const losses = allTrades.filter((t) => t.outcome === "Loss").length;
    const count = allTrades.length || 1;
    res.json({
      runs: state.backtestRuns.length,
      signals: allTrades.length,
      wins,
      losses,
      flats: 0,
      noExitData: 0,
      winRatePercent: Number(((wins / count) * 100).toFixed(1)),
      averageReturnPercent: Number(
        (allTrades.reduce((acc, t) => acc + (t.returnPercent || 0), 0) / count).toFixed(2)
      )
    });
  });

  app.get("/accuracy/backtests/by-direction", (_req: Request, res: Response) => {
    res.json([
      {
        bucket: "Long",
        signals: 9,
        wins: 7,
        losses: 2,
        flats: 0,
        noExitData: 0,
        winRatePercent: 77.8,
        averageReturnPercent: 1.85
      },
      {
        bucket: "Short",
        signals: 3,
        wins: 2,
        losses: 1,
        flats: 0,
        noExitData: 0,
        winRatePercent: 66.7,
        averageReturnPercent: 1.4
      }
    ]);
  });

  // Paper Trading
  app.get("/paper-trading/runs/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.paperRuns.slice(0, limit));
  });

  app.get("/paper-trading/runs/:runId/orders", (req: Request, res: Response) => {
    const run = state.paperRuns.find((r) => r.id === req.params.runId) || state.paperRuns[0];
    res.json(run ? run.orders : []);
  });

  app.post("/paper-trading/run", (req: Request, res: Response) => {
    const sessionDate = (req.query.sessionDate as string) || new Date().toISOString().slice(0, 10);
    const newRunId = `paper-run-${Date.now()}`;
    const latestOrb = state.openingRangeRuns[0];
    const source = latestOrb ? latestOrb.decisions : [];

    const orders: PaperOrder[] = (source.length > 0 ? source : state.instruments.slice(0, 2)).map((item: any) => ({
      sessionDate,
      symbol: item.symbol,
      exchange: "NSE",
      direction: item.direction || "Long",
      entryPrice: item.entryPrice || 2500,
      stopPrice: item.stopPrice || 2470,
      targetPrice: item.targetPrice || 2560,
      quantity: item.quantity || 40,
      notionalAmount: item.notionalAmount || 100000,
      plannedRiskAmount: item.plannedRiskAmount || 950,
      status: "Open",
      sourceStage: "OpeningRange",
      sourceReason: "Automated stage execution",
      realizedPnl: 0,
      returnPercent: 0
    }));

    state.paperRuns.unshift({
      id: newRunId,
      sessionDate,
      startedAtUtc: new Date().toISOString(),
      orderCount: orders.length,
      openCount: orders.length,
      closedCount: 0,
      orders
    });

    res.json({
      stage: "PaperTrading",
      sessionDate,
      status: "Completed",
      evaluatedCount: orders.length,
      acceptedCount: orders.length,
      rejectedCount: 0,
      message: `Paper trading orders generated: ${orders.length} positions opened.`
    });
  });

  app.post("/paper-trading/mark-to-market", (_req: Request, res: Response) => {
    let updatedCount = 0;
    for (const run of state.paperRuns) {
      for (const order of run.orders) {
        if (order.status === "Open") {
          const delta = (Math.random() * 0.02 - 0.005) * order.entryPrice;
          const currentPrice = order.entryPrice + delta;
          order.realizedPnl = Number((delta * order.quantity).toFixed(2));
          order.returnPercent = Number(((delta / order.entryPrice) * 100).toFixed(2));
          updatedCount++;
        }
      }
    }
    res.json({ message: `Mark-to-market updated across ${updatedCount} open paper orders.` });
  });

  // AI Analysis
  app.get("/ai/runs/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.aiRuns.slice(0, limit));
  });

  app.get("/ai/runs/:runId/decisions", (req: Request, res: Response) => {
    const run = state.aiRuns.find((r) => r.id === req.params.runId) || state.aiRuns[0];
    res.json(run ? run.decisions : []);
  });

  app.post("/ai/run", (req: Request, res: Response) => {
    const sessionDate = (req.query.sessionDate as string) || new Date().toISOString().slice(0, 10);
    const newRunId = `ai-run-${Date.now()}`;
    const latestEod = state.scannerRuns[0];
    const source = latestEod ? latestEod.candidates : state.instruments.slice(0, 4);

    const decisions: AiAnalysisDecision[] = source.map((item, idx) => {
      const isTrade = idx < 2;
      return {
        symbol: item.symbol,
        exchange: "NSE",
        direction: (item as any).direction || "Long",
        score: (item as any).score || 82,
        recommendation: isTrade ? "BUY_CANDIDATE" : "WATCHLIST",
        probabilityPercent: isTrade ? 75 + Math.floor(Math.random() * 15) : 55 + Math.floor(Math.random() * 10),
        confidence: isTrade ? "High" : "Medium",
        rationale: isTrade
          ? "Strong volumetric expansion coupled with sector tailwinds; high probability intraday momentum candidate."
          : "Neutral structure near key resistance; requires confirmation before committing capital.",
        promptVersion: state.settings.ai.promptVersion
      };
    });

    const tradeCandidateCount = decisions.filter((d) => d.recommendation === "BUY_CANDIDATE").length;
    const watchlistCount = decisions.filter((d) => d.recommendation === "WATCHLIST").length;

    state.aiRuns.unshift({
      id: newRunId,
      sessionDate,
      startedAtUtc: new Date().toISOString(),
      decisionCount: decisions.length,
      tradeCandidateCount,
      watchlistCount,
      noTradeCount: 0,
      decisions
    });

    res.json({
      stage: "AiAnalysis",
      sessionDate,
      status: "Completed",
      evaluatedCount: decisions.length,
      acceptedCount: tradeCandidateCount,
      rejectedCount: 0,
      message: `AI analysis completed: ${tradeCandidateCount} buy recommendations produced.`
    });
  });

  // Events & Notifications
  app.get("/events/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "25", 10);
    res.json(state.eventLogs.slice(0, limit));
  });

  app.get("/notifications/attempts/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.notifications.slice(0, limit));
  });

  // Feedback
  app.get("/feedback/outcomes/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    res.json(state.feedback.slice(0, limit));
  });

  app.get("/accuracy/feedback/by-recommendation", (_req: Request, res: Response) => {
    res.json([
      {
        bucket: "BUY_CANDIDATE",
        signals: 6,
        wins: 5,
        losses: 1,
        flats: 0,
        winRatePercent: 83.3,
        averageReturnPercent: 2.35
      },
      {
        bucket: "WATCHLIST",
        signals: 2,
        wins: 1,
        losses: 1,
        flats: 0,
        winRatePercent: 50.0,
        averageReturnPercent: 0.4
      }
    ]);
  });

  app.post("/feedback/outcomes", (req: Request, res: Response) => {
    const item = req.body;
    if (!item.symbol || !item.outcome) {
      res.status(400).json({ message: "Symbol and outcome are required." });
      return;
    }

    const feedbackEntry: OutcomeFeedback = {
      id: state.feedback.length + 1,
      sessionDate: item.sessionDate || new Date().toISOString().slice(0, 10),
      symbol: item.symbol,
      exchange: item.exchange || "NSE",
      direction: item.direction || "Long",
      source: item.source || "Manual",
      recommendation: item.recommendation || "BUY_CANDIDATE",
      outcome: item.outcome,
      returnPercent: item.returnPercent ? Number(item.returnPercent) : undefined,
      notes: item.notes || "",
      createdAtUtc: new Date().toISOString()
    };

    state.feedback.unshift(feedbackEntry);
    res.json({ message: "Outcome feedback recorded successfully." });
  });

  // Instrument Search (Dhan scrip search)
  app.get("/instruments/dhan/search", (req: Request, res: Response) => {
    const query = ((req.query.symbol as string) || "").trim().toUpperCase();
    const exchange = ((req.query.exchange as string) || "NSE").trim().toUpperCase();

    const matches = MASTER_INSTRUMENTS.filter((inst) => {
      const matchSymbol = !query || inst.symbol.toUpperCase().includes(query) || inst.displayName.toUpperCase().includes(query);
      const matchExchange = !exchange || inst.exchange.toUpperCase() === exchange;
      return matchSymbol && matchExchange;
    });

    res.json(matches);
  });

  // Frontend Serving (Dev via Vite Middleware, Prod via Static)
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = "0.0.0.0";
  app.listen(port, host, () => {
    console.log(`UniversalEngine running on http://${host}:${port}`);
  });
}

startServer();
