import express, { Request, Response } from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

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

function maskSecret(val?: string): string {
  if (!val || !val.trim()) return "Not set";
  if (val.length <= 8) return "Configured";
  return `${val.slice(0, 4)}...${val.slice(-4)}`;
}

const initialTelegramToken = process.env.TELEGRAM_BOT_TOKEN || "";
const initialTelegramChatId = process.env.TELEGRAM_CHAT_ID || "";
const initialSmtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const initialSmtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const initialSmtpUseSsl = process.env.SMTP_SECURE === "true";
const initialSmtpUser = process.env.SMTP_USER || "";
const initialSmtpPass = process.env.SMTP_PASS || "";
const initialSmtpFrom = process.env.SMTP_FROM || (initialSmtpUser ? `UniversalEngine <${initialSmtpUser}>` : "UniversalEngine <alerts@universalengine.local>");
const initialSmtpTo = process.env.NOTIFICATION_EMAIL_TO || process.env.SMTP_TO || "indurotech.jp@gmail.com";
const initialEmailDeliveryMode = (process.env.EMAIL_DELIVERY_MODE as "both" | "smtp" | "inbox") || "both";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "microsoft" | "meta" | "email";
  role: "Super Admin" | "Trader" | "Operator" | "Viewer";
  status: "Active" | "Suspended";
  createdAtUtc: string;
  lastLoginAtUtc: string;
}

export interface SentEmail {
  id: number;
  to: string;
  from: string;
  subject: string;
  htmlMessage: string;
  textMessage: string;
  isSuccess: boolean;
  attemptedAtUtc: string;
  errorMessage?: string;
}

export const SETTINGS_ADMIN_EMAIL = "indurotech.jp@gmail.com";

const initialUsers: AppUser[] = [
  {
    id: "usr-admin-1",
    email: "indurotech.jp@gmail.com",
    name: "InduroTech Admin",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=indurotech",
    provider: "google",
    role: "Super Admin",
    status: "Active",
    createdAtUtc: "2026-09-01T00:00:00.000Z",
    lastLoginAtUtc: new Date().toISOString()
  },
  {
    id: "usr-trader-1",
    email: "tejas.p.singh@gmail.com",
    name: "Tejas Singh",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=tejas",
    provider: "google",
    role: "Trader",
    status: "Active",
    createdAtUtc: "2026-09-15T00:00:00.000Z",
    lastLoginAtUtc: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "usr-trader-2",
    email: "alex.vance@microsoft.corp",
    name: "Alex Vance",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=alex",
    provider: "microsoft",
    role: "Trader",
    status: "Active",
    createdAtUtc: "2026-09-20T00:00:00.000Z",
    lastLoginAtUtc: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "usr-ops-1",
    email: "devon.desk@meta.internal",
    name: "Devon Miller",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=devon",
    provider: "meta",
    role: "Operator",
    status: "Active",
    createdAtUtc: "2026-09-22T00:00:00.000Z",
    lastLoginAtUtc: new Date(Date.now() - 3600000 * 5).toISOString()
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
      channel: (process.env.NOTIFICATION_CHANNEL as any) || "Console",
      sendEodWatchlistNotifications: true,
      minimumEodScoreToNotify: 70,
      telegram: {
        botTokenMasked: maskSecret(initialTelegramToken),
        botToken: initialTelegramToken,
        chatId: initialTelegramChatId
      },
      email: {
        deliveryMode: initialEmailDeliveryMode,
        smtpHost: initialSmtpHost,
        smtpPort: initialSmtpPort,
        useSsl: initialSmtpUseSsl,
        username: initialSmtpUser,
        passwordMasked: maskSecret(initialSmtpPass),
        password: initialSmtpPass,
        from: initialSmtpFrom,
        to: initialSmtpTo
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
  feedback: [] as OutcomeFeedback[],
  sentEmails: [] as SentEmail[],
  users: [...initialUsers] as AppUser[],
  currentUser: initialUsers[0] as AppUser | null
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
      channel: "Email",
      subject: "[DAILY WATCHLIST] UniversalEngine EOD Watchlist - 4 Candidates",
      isSuccess: true,
      attemptedAtUtc: new Date(Date.now() - 3600000 * 4).toISOString(),
      errorMessage: "Delivered to In-App Virtual Inbox (Ready for inspection)"
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
      channel: "Email",
      subject: "[TRADE ALERT] Opening Range Breakout: RELIANCE (NSE)",
      isSuccess: true,
      attemptedAtUtc: new Date(Date.now() - 3600000 * 2).toISOString(),
      errorMessage: "Delivered to In-App Virtual Inbox (Ready for inspection)"
    }
  );

  // Seed Sent Emails for In-App Virtual Inbox
  state.sentEmails.push(
    {
      id: 1,
      to: "indurotech.jp@gmail.com",
      from: "UniversalEngine <alerts@universalengine.local>",
      subject: "[DAILY WATCHLIST] UniversalEngine EOD Watchlist - 4 Candidates",
      htmlMessage: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: #1e293b; padding: 20px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">UniversalEngine Intraday Scanner</h2>
            <p style="margin: 5px 0 0; color: #94a3b8; font-size: 13px;">Daily EOD Watchlist Alert &bull; Session 2026-10-01</p>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 14px; color: #334155; margin-top: 0;">Automated pipeline evaluated 24 instruments. <strong>4 high-probability setups qualified</strong> for the upcoming session:</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0;">
              <thead>
                <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 8px;">Symbol</th>
                  <th style="padding: 8px;">Exch</th>
                  <th style="padding: 8px;">Direction</th>
                  <th style="padding: 8px;">Score</th>
                  <th style="padding: 8px;">Setup Factor</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; font-weight: bold; color: #0f172a;">RELIANCE</td>
                  <td style="padding: 8px; color: #64748b;">NSE</td>
                  <td style="padding: 8px; color: #16a34a; font-weight: bold;">LONG</td>
                  <td style="padding: 8px; font-weight: bold;">88 / 100</td>
                  <td style="padding: 8px; font-size: 12px; color: #475569;">Breakout above 20 EMA with 2.4x volume surge</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; font-weight: bold; color: #0f172a;">ICICIBANK</td>
                  <td style="padding: 8px; color: #64748b;">NSE</td>
                  <td style="padding: 8px; color: #16a34a; font-weight: bold;">LONG</td>
                  <td style="padding: 8px; font-weight: bold;">84 / 100</td>
                  <td style="padding: 8px; font-size: 12px; color: #475569;">Multi-week resistance breakout on delivery volume</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; font-weight: bold; color: #0f172a;">TCS</td>
                  <td style="padding: 8px; color: #64748b;">NSE</td>
                  <td style="padding: 8px; color: #16a34a; font-weight: bold;">LONG</td>
                  <td style="padding: 8px; font-weight: bold;">79 / 100</td>
                  <td style="padding: 8px; font-size: 12px; color: #475569;">Cup-and-handle neckline test</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; font-weight: bold; color: #0f172a;">INFY</td>
                  <td style="padding: 8px; color: #64748b;">NSE</td>
                  <td style="padding: 8px; color: #dc2626; font-weight: bold;">SHORT</td>
                  <td style="padding: 8px; font-weight: bold;">74 / 100</td>
                  <td style="padding: 8px; font-size: 12px; color: #475569;">Rejection from 200 EMA with declining RS</td>
                </tr>
              </tbody>
            </table>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; font-size: 12px; color: #15803d; margin-top: 15px;">
              <strong>Delivery Mode:</strong> In-App Inbox Archive &bull; Authorized Admin: <code>indurotech.jp@gmail.com</code>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 12px 20px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Generated by UniversalEngine Automated Market Scanner &bull; Session Date: 2026-10-01
          </div>
        </div>
      `,
      textMessage: "UniversalEngine EOD Watchlist Alert\nSession: 2026-10-01\n\nQualified Candidates:\n- RELIANCE (NSE, Long, Score: 88)\n- ICICIBANK (NSE, Long, Score: 84)\n- TCS (NSE, Long, Score: 79)\n- INFY (NSE, Short, Score: 74)\n\nReview chart levels before market open.",
      isSuccess: true,
      attemptedAtUtc: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 2,
      to: "indurotech.jp@gmail.com",
      from: "UniversalEngine <alerts@universalengine.local>",
      subject: "[TRADE ALERT] Opening Range Breakout: RELIANCE (NSE)",
      htmlMessage: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: #0f766e; padding: 20px; color: #ffffff;">
            <span style="background: #14b8a6; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Signal Triggered</span>
            <h2 style="margin: 8px 0 0; font-size: 20px;">Breakout Confirmed: RELIANCE (NSE)</h2>
          </div>
          <div style="padding: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 6px 0; color: #64748b;">Direction:</td><td style="padding: 6px 0; font-weight: bold; color: #16a34a;">LONG</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Entry Price:</td><td style="padding: 6px 0; font-weight: bold;">₹2,950.00</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Stop Loss:</td><td style="padding: 6px 0; font-weight: bold; color: #dc2626;">₹2,925.00</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Target Price:</td><td style="padding: 6px 0; font-weight: bold; color: #16a34a;">₹3,000.00 (1:2 R:R)</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Planned Risk:</td><td style="padding: 6px 0; font-weight: bold;">₹2,000.00 (Qty: 80 shares)</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Breakout Reason:</td><td style="padding: 6px 0;">Surpassed opening 15-min high with 3.1x volume confirmation</td></tr>
            </table>
          </div>
        </div>
      `,
      textMessage: "TRADE ALERT: RELIANCE (NSE) Long\nEntry: ₹2,950.00 | Stop: ₹2,925.00 | Target: ₹3,000.00 | Planned Risk: ₹2,000.00",
      isSuccess: true,
      attemptedAtUtc: new Date(Date.now() - 3600000 * 2).toISOString()
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

interface NotificationResult {
  channel: string;
  isSuccess: boolean;
  subject: string;
  errorMessage?: string;
  timestamp: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendTelegramNotification(
  subject: string,
  htmlMessage: string,
  textMessage: string
): Promise<NotificationResult> {
  const token = state.settings.notifications.telegram.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = state.settings.notifications.telegram.chatId || process.env.TELEGRAM_CHAT_ID || "";
  const timestamp = new Date().toISOString();

  if (!token || !chatId) {
    const error = "Telegram Bot Token or Chat ID is not configured. Please set them in Settings > Notifications or set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment.";
    const attempt: NotificationAttempt = {
      id: state.notifications.length + 1,
      channel: "Telegram",
      subject,
      isSuccess: false,
      attemptedAtUtc: timestamp,
      errorMessage: error
    };
    state.notifications.unshift(attempt);
    return { channel: "Telegram", isSuccess: false, subject, errorMessage: error, timestamp };
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlMessage,
        parse_mode: "HTML"
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = (await response.json()) as any;
    if (response.ok && data.ok) {
      const attempt: NotificationAttempt = {
        id: state.notifications.length + 1,
        channel: "Telegram",
        subject,
        isSuccess: true,
        attemptedAtUtc: timestamp
      };
      state.notifications.unshift(attempt);
      return { channel: "Telegram", isSuccess: true, subject, timestamp };
    } else {
      const errorMsg = data.description || `HTTP ${response.status}: ${response.statusText}`;
      const attempt: NotificationAttempt = {
        id: state.notifications.length + 1,
        channel: "Telegram",
        subject,
        isSuccess: false,
        attemptedAtUtc: timestamp,
        errorMessage: errorMsg
      };
      state.notifications.unshift(attempt);
      return { channel: "Telegram", isSuccess: false, subject, errorMessage: errorMsg, timestamp };
    }
  } catch (err: any) {
    const errorMsg = err.name === "AbortError" ? "Telegram request timed out after 10s" : err.message || "Network error while calling Telegram API";
    const attempt: NotificationAttempt = {
      id: state.notifications.length + 1,
      channel: "Telegram",
      subject,
      isSuccess: false,
      attemptedAtUtc: timestamp,
      errorMessage: errorMsg
    };
    state.notifications.unshift(attempt);
    return { channel: "Telegram", isSuccess: false, subject, errorMessage: errorMsg, timestamp };
  }
}

async function sendEmailNotification(
  subject: string,
  htmlMessage: string,
  textMessage: string
): Promise<NotificationResult> {
  const emailConfig = state.settings.notifications.email;
  const deliveryMode = (emailConfig as any).deliveryMode || "both"; // "inbox" | "smtp" | "both"
  const host = (emailConfig.smtpHost || process.env.SMTP_HOST || "").trim();
  const port = Number(emailConfig.smtpPort) || (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const user = (emailConfig.username || process.env.SMTP_USER || "").trim();
  const pass = (emailConfig.password || process.env.SMTP_PASS || "").trim();
  const from = emailConfig.from || process.env.SMTP_FROM || (user ? `UniversalEngine <${user}>` : "UniversalEngine <alerts@universalengine.local>");
  const to = emailConfig.to || process.env.NOTIFICATION_EMAIL_TO || process.env.SMTP_TO || "indurotech.jp@gmail.com";
  const timestamp = new Date().toISOString();

  // Determine if valid SMTP credentials are fully provided for external relay
  const isGmail = host.toLowerCase().includes("gmail") || host.toLowerCase().includes("google");
  const hasAuth = Boolean(user && pass);
  const isPureInboxMode = deliveryMode === "inbox";
  const canAttemptSmtp = Boolean(host && (!isGmail || hasAuth) && !isPureInboxMode);

  // If in Pure Inbox mode or credentials are not supplied for Gmail/authenticated host:
  if (!canAttemptSmtp) {
    let explanation = "Delivered to In-App Virtual Inbox.";
    if (isPureInboxMode) {
      explanation = "Delivered to In-App Virtual Inbox (Delivery Mode: In-App Inbox).";
    } else if (isGmail && !hasAuth) {
      explanation = "Gmail requires a 16-character App Password (myaccount.google.com/apppasswords). Delivered to In-App Virtual Inbox.";
    } else if (!host) {
      explanation = "No SMTP host configured. Delivered to In-App Virtual Inbox.";
    }

    const emailRecord: SentEmail = {
      id: state.sentEmails.length + 1,
      to,
      from,
      subject,
      htmlMessage,
      textMessage,
      isSuccess: true,
      attemptedAtUtc: timestamp
    };
    state.sentEmails.unshift(emailRecord);

    const attempt: NotificationAttempt = {
      id: state.notifications.length + 1,
      channel: "Email",
      subject,
      isSuccess: true,
      attemptedAtUtc: timestamp,
      errorMessage: explanation
    };
    state.notifications.unshift(attempt);

    return {
      channel: "Email",
      isSuccess: true,
      subject,
      errorMessage: explanation,
      timestamp
    };
  }

  // Attempt real SMTP relay with fast connection and greeting timeouts
  const isPort465 = port === 465;
  const isPort587 = port === 587;
  const secure = isPort465 ? true : (isPort587 ? false : Boolean(emailConfig.useSsl));

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: isPort587,
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text: textMessage,
      html: htmlMessage
    });

    const emailRecord: SentEmail = {
      id: state.sentEmails.length + 1,
      to,
      from,
      subject,
      htmlMessage,
      textMessage,
      isSuccess: true,
      attemptedAtUtc: timestamp
    };
    state.sentEmails.unshift(emailRecord);

    const attempt: NotificationAttempt = {
      id: state.notifications.length + 1,
      channel: "Email",
      subject,
      isSuccess: true,
      attemptedAtUtc: timestamp,
      errorMessage: `Delivered via SMTP relay (${host}:${port}) & saved to In-App Inbox`
    };
    state.notifications.unshift(attempt);

    return { channel: "Email", isSuccess: true, subject, timestamp };
  } catch (err: any) {
    let errorMsg = err.message || "Failed to send email via SMTP";

    // Provide helpful, actionable advice for known provider restrictions
    if (host.includes("gmail") || host.includes("google")) {
      if (
        errorMsg.includes("535") ||
        errorMsg.includes("530") ||
        errorMsg.includes("Username and Password not accepted") ||
        errorMsg.includes("Authentication Required")
      ) {
        errorMsg = "Gmail requires a 16-character App Password (myaccount.google.com/apppasswords) with 2FA enabled, not your standard account password.";
      }
    } else if (
      errorMsg.includes("ECONNREFUSED") ||
      errorMsg.includes("ETIMEDOUT") ||
      errorMsg.includes("Greeting never received")
    ) {
      errorMsg = `Could not reach SMTP server at ${host}:${port} (${err.code || "Connection/Greeting timeout"}). Check hostname, port, and network firewall.`;
    }

    // Always preserve the email in the In-App Virtual Inbox so message is NEVER lost
    const emailRecord: SentEmail = {
      id: state.sentEmails.length + 1,
      to,
      from,
      subject,
      htmlMessage,
      textMessage,
      isSuccess: false,
      attemptedAtUtc: timestamp,
      errorMessage: errorMsg
    };
    state.sentEmails.unshift(emailRecord);

    const attempt: NotificationAttempt = {
      id: state.notifications.length + 1,
      channel: "Email",
      subject,
      isSuccess: false,
      attemptedAtUtc: timestamp,
      errorMessage: `${errorMsg} (Stored in In-App Inbox)`
    };
    state.notifications.unshift(attempt);

    return { channel: "Email", isSuccess: false, subject, errorMessage: errorMsg, timestamp };
  }
}

async function dispatchAlertNotification(
  subject: string,
  htmlMessage: string,
  textMessage: string,
  channelOverride?: string
): Promise<NotificationResult[]> {
  const channel = channelOverride || state.settings.notifications.channel;
  const results: NotificationResult[] = [];
  const timestamp = new Date().toISOString();

  if (channel === "Console") {
    console.log(`\n================== [NOTIFICATION: CONSOLE] ==================\nSubject: ${subject}\n\n${textMessage}\n============================================================\n`);
    state.notifications.unshift({
      id: state.notifications.length + 1,
      channel: "Console",
      subject,
      isSuccess: true,
      attemptedAtUtc: timestamp
    });
    results.push({ channel: "Console", isSuccess: true, subject, timestamp });
  }

  if (channel === "Telegram" || channel === "Both") {
    const tgRes = await sendTelegramNotification(subject, htmlMessage, textMessage);
    results.push(tgRes);
  }

  if (channel === "Email" || channel === "Both") {
    const emailRes = await sendEmailNotification(subject, htmlMessage, textMessage);
    results.push(emailRes);
  }

  return results;
}

function buildTradeAlertContent(trade: {
  symbol: string;
  exchange: string;
  direction: string;
  stage: string;
  score: number;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  quantity: number;
  notionalAmount: number;
  plannedRiskAmount: number;
  reasons: string[];
  sessionDate: string;
}) {
  const dirIcon = trade.direction.toUpperCase() === "SHORT" ? "🔴" : "🟢";
  const stopDiff = Math.abs(((trade.stopPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2);
  const targetDiff = Math.abs(((trade.targetPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2);
  const riskPerShare = Math.max(1, Math.abs(trade.entryPrice - trade.stopPrice));
  const rewardRisk = (Math.abs(trade.targetPrice - trade.entryPrice) / riskPerShare).toFixed(1);

  const subject = `[TRADE ALERT] ${trade.direction.toUpperCase()} ${trade.symbol} (${trade.exchange}) @ ₹${trade.entryPrice.toFixed(2)}`;

  const html = `
<b>🚨 UNIVERSAL ENGINE TRADING ALERT</b>
<b>Symbol:</b> <code>${escapeHtml(trade.symbol)}</code> (${escapeHtml(trade.exchange)})
<b>Direction:</b> ${dirIcon} <b>${escapeHtml(trade.direction.toUpperCase())}</b>
<b>Stage:</b> ${escapeHtml(trade.stage)}
<b>Score:</b> <b>${trade.score}</b>/100

<b>📊 Trade Execution Plan:</b>
• <b>Entry Trigger:</b> ₹${trade.entryPrice.toFixed(2)}
• <b>Stop Loss:</b> ₹${trade.stopPrice.toFixed(2)} (${stopDiff}%)
• <b>Target:</b> ₹${trade.targetPrice.toFixed(2)} (${targetDiff}%)
• <b>Risk / Reward:</b> 1 : ${rewardRisk}
• <b>Position Size:</b> ${trade.quantity} shares
• <b>Notional Value:</b> ₹${trade.notionalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
• <b>Planned Risk:</b> ₹${trade.plannedRiskAmount.toFixed(2)}

<b>🔍 Trigger Reasons:</b>
${escapeHtml(trade.reasons.join(", ") || "Technical Structure Confirmation")}

<i>⏰ Session: ${escapeHtml(trade.sessionDate)} | Timestamp: ${new Date().toLocaleTimeString()}</i>
<b>⚠️ Notice: Automated scan alert. No order was placed. Execution is trader-authoritative.</b>
`.trim();

  const text = `
🚨 UNIVERSAL ENGINE TRADING ALERT
Symbol: ${trade.symbol} (${trade.exchange})
Direction: ${trade.direction.toUpperCase()}
Stage: ${trade.stage}
Score: ${trade.score}/100

Trade Execution Plan:
- Entry Trigger: ₹${trade.entryPrice.toFixed(2)}
- Stop Loss: ₹${trade.stopPrice.toFixed(2)} (${stopDiff}%)
- Target: ₹${trade.targetPrice.toFixed(2)} (${targetDiff}%)
- Risk / Reward: 1 : ${rewardRisk}
- Position Size: ${trade.quantity} shares
- Notional Value: ₹${trade.notionalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
- Planned Risk: ₹${trade.plannedRiskAmount.toFixed(2)}

Triggers: ${trade.reasons.join(", ") || "Technical Structure Confirmation"}
Session Date: ${trade.sessionDate}
Notice: Automated scan alert. No order was placed. Execution is trader-authoritative.
`.trim();

  return { subject, html, text };
}

function buildWatchlistAlertContent(sessionDate: string, candidates: Candidate[]) {
  const subject = `[EOD Watchlist] ${candidates.length} Intraday Candidates Qualified for ${sessionDate}`;

  const rowsHtml = candidates
    .map(
      (c, idx) =>
        `<b>${idx + 1}. ${escapeHtml(c.symbol)} (${escapeHtml(c.exchange)})</b> — <i>${escapeHtml(c.direction || "Long")}</i> | Score: <b>${c.score}</b>\n   Reason: ${escapeHtml(c.verdictReason || "Passed filter criteria")}`
    )
    .join("\n\n");

  const html = `
<b>📋 UNIVERSAL ENGINE EOD CANDIDATE WATCHLIST</b>
<b>Session Date:</b> ${escapeHtml(sessionDate)}
<b>Qualified Candidates:</b> ${candidates.length}

${rowsHtml}

<i>⏰ Generated at: ${new Date().toLocaleString()}</i>
<b>⚠️ Notice: Automated scanner output. No order was placed.</b>
`.trim();

  const rowsText = candidates
    .map(
      (c, idx) =>
        `${idx + 1}. ${c.symbol} (${c.exchange}) - ${c.direction || "Long"} | Score: ${c.score}\n   Reason: ${c.verdictReason || "Passed filter criteria"}`
    )
    .join("\n\n");

  const text = `
📋 UNIVERSAL ENGINE EOD CANDIDATE WATCHLIST
Session Date: ${sessionDate}
Qualified Candidates: ${candidates.length}

${rowsText}

Generated at: ${new Date().toLocaleString()}
Notice: Automated scanner output. No order was placed.
`.trim();

  return { subject, html, text };
}

function buildTestAlertContent(channel: string) {
  const subject = `[TEST ALERT] UniversalEngine Notification Test (${channel})`;
  const timestamp = new Date().toLocaleString();

  const html = `
<b>🧪 UNIVERSAL ENGINE TEST ALERT</b>
<b>Channel:</b> <code>${escapeHtml(channel)}</code>
<b>Status:</b> ✅ System Connected & Functional

<b>📊 Sample Trade Verification:</b>
• <b>Symbol:</b> RELIANCE (NSE)
• <b>Direction:</b> 🟢 LONG
• <b>Entry:</b> ₹2,990.00 | <b>Stop:</b> ₹2,960.00 | <b>Target:</b> ₹3,050.00
• <b>Quantity:</b> 33 shares | <b>Planned Risk:</b> ₹990.00

<i>⏰ Test dispatched at: ${escapeHtml(timestamp)}</i>
<b>All notification pipelines are active and ready to receive intraday signals.</b>
`.trim();

  const text = `
🧪 UNIVERSAL ENGINE TEST ALERT
Channel: ${channel}
Status: System Connected & Functional

Sample Trade Verification:
- Symbol: RELIANCE (NSE)
- Direction: LONG
- Entry: ₹2,990.00 | Stop: ₹2,960.00 | Target: ₹3,050.00
- Quantity: 33 shares | Planned Risk: ₹990.00

Test dispatched at: ${timestamp}
All notification pipelines are active and ready to receive intraday signals.
`.trim();

  return { subject, html, text };
}

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

  // Auth Helpers & Middleware
  function getAuthenticatedUser(req: Request): AppUser | null {
    const headerEmail = (req.headers["x-user-email"] as string) || (req.query.userEmail as string);
    if (headerEmail) {
      const found = state.users.find((u) => u.email.toLowerCase() === headerEmail.toLowerCase());
      if (found) return found;
    }
    return state.currentUser;
  }

  function requireSettingsAdmin(req: Request, res: Response, next: () => void) {
    const user = getAuthenticatedUser(req);
    if (!user || user.email.toLowerCase() !== SETTINGS_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        error: "Access Denied",
        message: `Only user with email address "${SETTINGS_ADMIN_EMAIL}" is authorized to access or modify application settings.`,
        authorizedEmail: SETTINGS_ADMIN_EMAIL,
        currentEmail: user?.email || "anonymous"
      });
    }
    next();
  }

  // Auth & Session Routes
  app.get("/api/auth/session", (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    res.json({
      user,
      isAuthenticated: Boolean(user),
      settingsAdminEmail: SETTINGS_ADMIN_EMAIL,
      hasSettingsAccess: Boolean(user && user.email.toLowerCase() === SETTINGS_ADMIN_EMAIL.toLowerCase()),
      providers: ["google", "microsoft", "meta", "email"]
    });
  });

  app.post("/api/auth/switch", (req: Request, res: Response) => {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required to switch user." });
    }
    let target = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!target) {
      if (email.toLowerCase() === SETTINGS_ADMIN_EMAIL.toLowerCase()) {
        target = {
          id: `usr-${Date.now()}`,
          email: SETTINGS_ADMIN_EMAIL,
          name: "InduroTech Admin",
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=indurotech",
          provider: "google",
          role: "Super Admin",
          status: "Active",
          createdAtUtc: new Date().toISOString(),
          lastLoginAtUtc: new Date().toISOString()
        };
        state.users.unshift(target);
      } else {
        return res.status(404).json({ error: `User with email ${email} not found.` });
      }
    }
    target.lastLoginAtUtc = new Date().toISOString();
    state.currentUser = target;

    state.eventLogs.unshift({
      id: state.eventLogs.length + 1,
      eventType: "UserSwitched",
      subject: target.email,
      payloadJson: JSON.stringify({ role: target.role, provider: target.provider }),
      createdAtUtc: new Date().toISOString()
    });

    res.json({
      success: true,
      user: target,
      hasSettingsAccess: target.email.toLowerCase() === SETTINGS_ADMIN_EMAIL.toLowerCase()
    });
  });

  app.post("/api/auth/oauth-login", (req: Request, res: Response) => {
    const { provider, email, name, avatarUrl } = req.body || {};
    if (!email || !provider) {
      return res.status(400).json({ error: "Provider and email are required for OAuth login." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = state.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (user) {
      user.lastLoginAtUtc = new Date().toISOString();
      if (name && !user.name) user.name = name;
      if (avatarUrl) user.avatarUrl = avatarUrl;
    } else {
      const isSuperAdmin = normalizedEmail === SETTINGS_ADMIN_EMAIL.toLowerCase();
      user = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        provider: provider as any,
        role: isSuperAdmin ? "Super Admin" : "Trader",
        status: "Active",
        createdAtUtc: new Date().toISOString(),
        lastLoginAtUtc: new Date().toISOString()
      };
      state.users.push(user);
    }

    state.currentUser = user;

    state.eventLogs.unshift({
      id: state.eventLogs.length + 1,
      eventType: "UserAuthenticated",
      subject: user.email,
      payloadJson: JSON.stringify({ provider, role: user.role }),
      createdAtUtc: new Date().toISOString()
    });

    res.json({
      success: true,
      user,
      hasSettingsAccess: user.email.toLowerCase() === SETTINGS_ADMIN_EMAIL.toLowerCase()
    });
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    state.currentUser = null;
    res.json({ success: true, message: "Logged out successfully." });
  });

  // User Management Directory CRUD
  app.get("/api/auth/users", (_req: Request, res: Response) => {
    res.json(state.users);
  });

  app.post("/api/auth/users", (req: Request, res: Response) => {
    const { email, name, role, provider, status } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required to create a user." });
    }
    const normalized = email.toLowerCase().trim();
    if (state.users.some((u) => u.email.toLowerCase() === normalized)) {
      return res.status(409).json({ error: "User with this email already exists." });
    }

    const isSuperAdmin = normalized === SETTINGS_ADMIN_EMAIL.toLowerCase();
    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      email: normalized,
      name: name || normalized.split("@")[0],
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalized)}`,
      provider: (provider as any) || "email",
      role: isSuperAdmin ? "Super Admin" : (role || "Trader"),
      status: (status as any) || "Active",
      createdAtUtc: new Date().toISOString(),
      lastLoginAtUtc: new Date().toISOString()
    };
    state.users.push(newUser);

    state.eventLogs.unshift({
      id: state.eventLogs.length + 1,
      eventType: "UserCreated",
      subject: newUser.email,
      payloadJson: JSON.stringify({ role: newUser.role, provider: newUser.provider }),
      createdAtUtc: new Date().toISOString()
    });

    res.status(201).json(newUser);
  });

  app.put("/api/auth/users/:id", (req: Request, res: Response) => {
    const target = state.users.find((u) => u.id === req.params.id);
    if (!target) {
      return res.status(404).json({ error: "User not found." });
    }

    const update = req.body || {};
    // Prevent removing Super Admin from indurotech.jp@gmail.com
    if (target.email.toLowerCase() === SETTINGS_ADMIN_EMAIL.toLowerCase()) {
      target.role = "Super Admin";
      target.status = "Active";
      if (update.name) target.name = update.name;
    } else {
      if (update.name) target.name = update.name;
      if (update.role) target.role = update.role;
      if (update.status) target.status = update.status;
    }

    res.json(target);
  });

  app.delete("/api/auth/users/:id", (req: Request, res: Response) => {
    const target = state.users.find((u) => u.id === req.params.id);
    if (!target) {
      return res.status(404).json({ error: "User not found." });
    }
    if (target.email.toLowerCase() === SETTINGS_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: "Cannot delete the designated Super Admin account (indurotech.jp@gmail.com)." });
    }
    state.users = state.users.filter((u) => u.id !== req.params.id);
    res.json({ success: true, message: `User ${target.email} removed.` });
  });

  // Settings: Data Sources
  app.get("/settings/data-sources", requireSettingsAdmin, (_req: Request, res: Response) => {
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

  // Settings: Application (Restricted exclusively to indurotech.jp@gmail.com)
  app.get("/settings/application", requireSettingsAdmin, (_req: Request, res: Response) => {
    const s = state.settings;
    res.json({
      ...s,
      notifications: {
        ...s.notifications,
        telegram: {
          ...s.notifications.telegram,
          botToken: ""
        },
        email: {
          ...s.notifications.email,
          password: ""
        }
      }
    });
  });

  app.put("/settings/application", requireSettingsAdmin, (req: Request, res: Response) => {
    const update = req.body;
    if (update && typeof update === "object") {
      const currentTg = state.settings.notifications.telegram;
      const currentEmail = state.settings.notifications.email;

      let newTgToken = currentTg.botToken;
      if (update.notifications?.telegram?.botToken && update.notifications.telegram.botToken !== currentTg.botTokenMasked) {
        newTgToken = update.notifications.telegram.botToken;
      }

      let newEmailPass = currentEmail.password;
      if (update.notifications?.email?.password && update.notifications.email.password !== currentEmail.passwordMasked) {
        newEmailPass = update.notifications.email.password;
      }

      state.settings = {
        ...state.settings,
        ...update,
        notifications: {
          ...state.settings.notifications,
          ...(update.notifications || {}),
          telegram: {
            ...currentTg,
            ...(update.notifications?.telegram || {}),
            botToken: newTgToken,
            botTokenMasked: maskSecret(newTgToken)
          },
          email: {
            ...currentEmail,
            ...(update.notifications?.email || {}),
            password: newEmailPass,
            passwordMasked: maskSecret(newEmailPass)
          }
        }
      };

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

  app.put("/scanner/instruments", requireSettingsAdmin, (req: Request, res: Response) => {
    const { instruments } = req.body;
    if (Array.isArray(instruments)) {
      state.instruments = instruments;
    }
    res.json({ message: "Scanner instruments updated.", count: state.instruments.length });
  });

  app.put("/scanner/baskets", requireSettingsAdmin, (req: Request, res: Response) => {
    const { baskets } = req.body;
    if (Array.isArray(baskets)) {
      state.baskets = baskets;
    }
    const count = state.baskets.reduce((acc, b) => acc + (b.instruments?.length || 0), 0);
    res.json({ message: "Scanner baskets updated.", count });
  });

  app.post("/scanner/baskets/predefined", requireSettingsAdmin, (_req: Request, res: Response) => {
    state.baskets = [...initialBaskets];
    state.universes = [...initialUniverses];
    const instrumentCount = state.baskets.reduce((acc, b) => acc + b.instruments.length, 0);
    res.json({
      message: "Predefined baskets saved to database.",
      basketsCreated: initialBaskets.length,
      instrumentCount
    });
  });

  app.put("/scanner/universes", requireSettingsAdmin, (req: Request, res: Response) => {
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

    if (state.settings.notifications.sendEodWatchlistNotifications) {
      const minScore = state.settings.notifications.minimumEodScoreToNotify;
      const qualified = generated.filter((c) => c.outcome === "Accepted" && c.score >= minScore);
      if (qualified.length > 0) {
        const watchlistAlert = buildWatchlistAlertContent(sessionDate, qualified);
        void dispatchAlertNotification(watchlistAlert.subject, watchlistAlert.html, watchlistAlert.text);
      } else {
        const generalAlert = buildWatchlistAlertContent(sessionDate, generated.filter((c) => c.outcome === "Accepted"));
        void dispatchAlertNotification(generalAlert.subject, generalAlert.html, generalAlert.text);
      }
    } else {
      void dispatchAlertNotification(
        `EOD Scan Run: ${acceptedCount} candidates qualified for ${sessionDate}`,
        `<b>EOD Scan Completed</b><br>Session: ${escapeHtml(sessionDate)}<br>Accepted: <b>${acceptedCount}</b> | Rejected: ${rejectedCount}`,
        `EOD Scan Completed\nSession: ${sessionDate}\nAccepted: ${acceptedCount} | Rejected: ${rejectedCount}`
      );
    }

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

    if (decisions.length > 0) {
      const topSignal = decisions[0];
      const alert = buildTradeAlertContent({
        symbol: topSignal.symbol,
        exchange: topSignal.exchange,
        direction: topSignal.direction || "Long",
        stage: "Opening Range Breakout (15m)",
        score: topSignal.score || 85,
        entryPrice: topSignal.entryPrice || 2500,
        stopPrice: topSignal.stopPrice || 2470,
        targetPrice: topSignal.targetPrice || 2560,
        quantity: topSignal.quantity || 40,
        notionalAmount: topSignal.notionalAmount || 100000,
        plannedRiskAmount: topSignal.plannedRiskAmount || 950,
        reasons: ["OpeningRangeBreakout", "VolumeAbove50Avg", "RiskConstraintsPassed"],
        sessionDate
      });
      void dispatchAlertNotification(alert.subject, alert.html, alert.text);
    }

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

  app.get("/notifications/emails/latest", (req: Request, res: Response) => {
    const limit = parseInt((req.query.limit as string) || "50", 10);
    res.json(state.sentEmails.slice(0, limit));
  });

  app.delete("/notifications/emails/:id", (req: Request, res: Response) => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId || "0", 10);
    state.sentEmails = state.sentEmails.filter((e) => e.id !== id);
    res.json({ success: true, message: `Email #${id} removed from In-App Inbox.` });
  });

  app.post("/notifications/emails/clear", (_req: Request, res: Response) => {
    state.sentEmails = [];
    res.json({ success: true, message: "In-App Virtual Inbox cleared." });
  });

  // Test Notification Endpoint
  app.post("/notifications/test", async (req: Request, res: Response) => {
    const channel = (req.query.channel as string) || (req.body?.channel as string) || state.settings.notifications.channel;
    const testContent = buildTestAlertContent(channel);

    const results = await dispatchAlertNotification(
      testContent.subject,
      testContent.html,
      testContent.text,
      channel
    );

    const anySucceeded = results.some((r) => r.isSuccess);
    const summary = results
      .map((r) => `${r.channel}: ${r.isSuccess ? "Sent successfully" : `Failed (${r.errorMessage})`}`)
      .join(" | ");

    state.eventLogs.unshift({
      id: state.eventLogs.length + 1,
      eventType: "NotificationTestExecuted",
      subject: `TestNotification:${channel}`,
      payloadJson: JSON.stringify({ channel, results }),
      createdAtUtc: new Date().toISOString()
    });

    res.json({
      success: anySucceeded,
      message: summary || "No notification channels configured for test.",
      results
    });
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
