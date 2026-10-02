import React from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  ExternalLink,
  Gauge,
  Globe,
  History,
  KeyRound,
  LineChart,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  TrendingUp,
  UserPlus,
  Users,
  WifiOff,
  X
} from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_UNIVERSAL_ENGINE_API_URL ?? "";

type RunSummary = {
  id: string;
  sessionDate: string;
  startedAtUtc: string;
  acceptedCount?: number;
  rejectedCount?: number;
  confirmedCount?: number;
  eventCount?: number;
  actionableCount?: number;
};

type Candidate = {
  symbol: string;
  exchange: string;
  outcome: string;
  direction?: string;
  score: number;
  finalVerdict?: string;
  verdictReason?: string;
  reasonsJson: string;
};

type StageDecision = {
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
};

type MonitorEvent = {
  symbol: string;
  exchange: string;
  direction?: string;
  status: string;
  latestPrice?: number;
  reason: string;
};

type NotificationAttempt = {
  id: number;
  channel: string;
  subject: string;
  isSuccess: boolean;
  attemptedAtUtc: string;
  errorMessage?: string;
};

type EventLogEntry = {
  id: number;
  eventType: string;
  subject: string;
  payloadJson: string;
  createdAtUtc: string;
};

type BacktestRun = {
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
};

type BacktestTrade = {
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
};

type BacktestAccuracySummary = {
  runs: number;
  signals: number;
  wins: number;
  losses: number;
  flats: number;
  noExitData: number;
  winRatePercent: number;
  averageReturnPercent: number;
};

type BacktestCalibrationSummary = {
  bucket: string;
  signals: number;
  wins: number;
  losses: number;
  flats: number;
  noExitData: number;
  winRatePercent: number;
  averageReturnPercent: number;
};

type FeedbackCalibrationSummary = {
  bucket: string;
  signals: number;
  wins: number;
  losses: number;
  flats: number;
  winRatePercent: number;
  averageReturnPercent: number;
};

type PaperTradingRun = {
  id: string;
  sessionDate: string;
  startedAtUtc: string;
  orderCount: number;
  openCount: number;
  closedCount: number;
};

type PaperOrder = {
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
};

type AiAnalysisRun = {
  id: string;
  sessionDate: string;
  startedAtUtc: string;
  decisionCount: number;
  tradeCandidateCount: number;
  watchlistCount: number;
  noTradeCount: number;
};

type AiAnalysisDecision = {
  symbol: string;
  exchange: string;
  direction: string;
  score: number;
  recommendation: string;
  probabilityPercent: number;
  confidence: string;
  rationale: string;
  promptVersion: string;
};

type BrokerStatus = {
  broker: string;
  status: string;
  isConfigured: boolean;
  isConnected: boolean;
  message: string;
  checkedAtUtc: string;
};

type LookupResult = {
  symbol: string;
  exchange: string;
  securityId: string;
  displayName: string;
  symbolName?: string;
  isin?: string;
};

type ScannerInstrument = {
  symbol: string;
  exchange: string;
  isin?: string;
  securityId?: string;
  key: string;
};

type ScannerInstruments = {
  count: number;
  duplicateInstrumentKeys: string[];
  baskets: ScannerBasket[];
  universes: ScannerUniverse[];
  instruments: ScannerInstrument[];
};

type ScannerBasket = {
  name: string;
  enabled: boolean;
  maxSymbols: number;
  instrumentCount: number;
  instruments: ScannerInstrument[];
};

type ScannerBasketDraft = {
  name: string;
  enabled: boolean;
  maxSymbols: number;
  instruments: ScannerInstrument[];
};

type ScannerUniverse = {
  name: string;
  enabled: boolean;
  instrumentCount: number;
  basketNames: string[];
  directInstruments: ScannerInstrument[];
  instruments: ScannerInstrument[];
};

type ScannerUniverseDraft = {
  name: string;
  enabled: boolean;
  basketNames: string[];
  directInstruments: ScannerInstrument[];
};

type RunUniverseMode = "universe" | "all" | "basket" | "instrument";
export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "microsoft" | "meta" | "email";
  role: "Super Admin" | "Trader" | "Operator" | "Viewer";
  status: "Active" | "Suspended";
  createdAtUtc: string;
  lastLoginAtUtc: string;
};

export type SentEmail = {
  id: number;
  to: string;
  from: string;
  subject: string;
  htmlMessage: string;
  textMessage: string;
  isSuccess: boolean;
  attemptedAtUtc: string;
  errorMessage?: string;
};

type DashboardView =
  | "overview"
  | "pipeline"
  | "workflow"
  | "instruments"
  | "lookup"
  | "monitoring"
  | "backtesting"
  | "reports"
  | "paper"
  | "ai"
  | "broker"
  | "settings"
  | "users"
  | "events"
  | "notifications";
type SettingsGroup = "broker" | "risk" | "scanner" | "data" | "pipeline" | "analytics" | "notifications";

const dashboardViews = new Set<DashboardView>([
  "overview",
  "pipeline",
  "workflow",
  "instruments",
  "lookup",
  "monitoring",
  "backtesting",
  "reports",
  "paper",
  "ai",
  "broker",
  "settings",
  "users",
  "events",
  "notifications"
]);

function getHashView(): DashboardView {
  const value = window.location.hash.replace("#", "") as DashboardView;
  return dashboardViews.has(value) ? value : "overview";
}

type PipelineRunResult = {
  stage: string;
  sessionDate: string;
  status: string;
  evaluatedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  message: string;
};

type PipelineStageStatus = {
  stage: string;
  canRun: boolean;
  candidateCount: number;
  message: string;
};

type PipelineStatus = {
  sessionDate: string;
  configuredInstrumentCount: number;
  duplicateInstrumentKeys: string[];
  message: string;
  stages: PipelineStageStatus[];
};

type DataSourceSettings = {
  analysisProvider: string;
  brokerProvider: string;
  historicalCacheEnabled: boolean;
  historicalCacheTtlHours: number;
  historicalCacheRoot?: string;
  historicalCacheEntryCount: number;
  message: string;
};

type ApplicationSettings = {
  risk: {
    capitalAmount: number;
    minPlannedRiskAmount: number;
    maxPlannedRiskAmount: number;
    maxActiveSignals: number;
    allowSmallRiskAlerts: boolean;
  };
  eodScanner: {
    lookbackDays: number;
    minimumAverageTradedValue: number;
    minimumVolumeExpansionRatio: number;
    nearHighCloseThreshold: number;
    nearLowCloseThreshold: number;
    maxDailyDataAgeHours: number;
    minimumAcceptedScore: number;
    maxAcceptedCandidates: number;
    factorWeights: Record<string, number>;
  };
  analysis: {
    primaryProvider: string;
    useHistoricalCache: boolean;
    historicalCacheTtlHours: number;
  };
  broker: {
    primaryProvider: string;
    dhan: {
      baseUrl: string;
      clientId: string;
      accessTokenMasked: string;
      accessToken: string;
      instrumentType: string;
      includeOpenInterest: boolean;
      retryCount: number;
      retryBaseDelayMs: number;
      requestThrottleDelayMs: number;
    };
  };
  stages: {
    preMarket: {
      enabled: boolean;
      enableScheduledScan: boolean;
      runTimeLocal: string;
      maxAllowedGapPercent: number;
      allowWhenPreMarketDataUnavailable: boolean;
    };
    openingRange: {
      enabled: boolean;
      enableScheduledScan: boolean;
      rangeMinutes: number;
      interval: string;
      marketOpenTime: string;
      breakoutBufferTicks: number;
      targetRiskRewardRatio: number;
      maxIntradayDataAgeMinutes: number;
    };
    liveValidation: {
      enabled: boolean;
      enableScheduledScan: boolean;
      interval: string;
      startTime: string;
      endTime: string;
      pollMinutes: number;
      confirmationBufferTicks: number;
      maxIntradayDataAgeMinutes: number;
    };
    monitoring: {
      enabled: boolean;
      enableScheduledScan: boolean;
      interval: string;
      startTime: string;
      endTime: string;
      pollMinutes: number;
      maxIntradayDataAgeMinutes: number;
    };
  };
  backtest: {
    fromDate: string;
    toDate: string;
    maxHoldingDays: number;
    useStopTargetSimulation: boolean;
    targetRiskRewardRatio: number;
    assumeStopBeforeTargetWhenBothTouched: boolean;
  };
  ai: {
    enabled: boolean;
    provider: string;
    promptVersion: string;
    minimumTradeProbability: number;
  };
  notifications: {
    channel: string;
    sendEodWatchlistNotifications: boolean;
    minimumEodScoreToNotify: number;
    telegram: {
      botTokenMasked: string;
      botToken: string;
      chatId: string;
    };
    email: {
      deliveryMode?: "both" | "smtp" | "inbox";
      smtpHost: string;
      smtpPort: number;
      useSsl: boolean;
      username: string;
      passwordMasked: string;
      password: string;
      from: string;
      to: string;
    };
  };
  message: string;
};

type OutcomeFeedback = {
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
};

type DashboardState = {
  health: string;
  scannerRuns: RunSummary[];
  candidates: Candidate[];
  preMarketRuns: RunSummary[];
  preMarketDecisions: StageDecision[];
  openingRuns: RunSummary[];
  openingDecisions: StageDecision[];
  liveRuns: RunSummary[];
  liveDecisions: StageDecision[];
  monitorRuns: RunSummary[];
  monitorEvents: MonitorEvent[];
  backtestRuns: BacktestRun[];
  backtestTrades: BacktestTrade[];
  backtestAccuracy: BacktestAccuracySummary | null;
  backtestCalibration: BacktestCalibrationSummary[];
  feedbackCalibration: FeedbackCalibrationSummary[];
  paperRuns: PaperTradingRun[];
  paperOrders: PaperOrder[];
  aiRuns: AiAnalysisRun[];
  aiDecisions: AiAnalysisDecision[];
  outcomeFeedback: OutcomeFeedback[];
  events: EventLogEntry[];
  notifications: NotificationAttempt[];
  brokerStatuses: BrokerStatus[];
  pipelineStatus: PipelineStatus | null;
  dataSourceSettings: DataSourceSettings | null;
  applicationSettings: ApplicationSettings | null;
  scannerInstruments: ScannerInstruments | null;
  lookupResults: LookupResult[];
  loading: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  health: "Checking",
  scannerRuns: [],
  candidates: [],
  preMarketRuns: [],
  preMarketDecisions: [],
  openingRuns: [],
  openingDecisions: [],
  liveRuns: [],
  liveDecisions: [],
  monitorRuns: [],
  monitorEvents: [],
  backtestRuns: [],
  backtestTrades: [],
  backtestAccuracy: null,
  backtestCalibration: [],
  feedbackCalibration: [],
  paperRuns: [],
  paperOrders: [],
  aiRuns: [],
  aiDecisions: [],
  outcomeFeedback: [],
  events: [],
  notifications: [],
  brokerStatuses: [],
  pipelineStatus: null,
  dataSourceSettings: null,
  applicationSettings: null,
  scannerInstruments: null,
  lookupResults: [],
  loading: true,
  error: null
};

function App() {
  const [state, setState] = React.useState(initialState);
  const [activeView, setActiveView] = React.useState<DashboardView>(() => getHashView());
  const [isSidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [settingsDraft, setSettingsDraft] = React.useState<ApplicationSettings | null>(null);
  const [settingsMessage, setSettingsMessage] = React.useState<string | null>(null);
  const [instrumentDraft, setInstrumentDraft] = React.useState<ScannerInstrument[]>([]);
  const [instrumentMessage, setInstrumentMessage] = React.useState<string | null>(null);
  const [basketDraft, setBasketDraft] = React.useState<ScannerBasketDraft[]>([]);
  const [basketMessage, setBasketMessage] = React.useState<string | null>(null);
  const [universeDraft, setUniverseDraft] = React.useState<ScannerUniverseDraft[]>([]);
  const [universeMessage, setUniverseMessage] = React.useState<string | null>(null);
  const [symbol, setSymbol] = React.useState("RELIANCE");
  const [runDate, setRunDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [backtestFromDate, setBacktestFromDate] = React.useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 10);
  });
  const [backtestToDate, setBacktestToDate] = React.useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [fromTime, setFromTime] = React.useState("09:30");
  const [toTime, setToTime] = React.useState("10:00");
  const [runUniverseMode, setRunUniverseMode] = React.useState<RunUniverseMode>("universe");
  const [selectedUniverseName, setSelectedUniverseName] = React.useState("");
  const [selectedBasketName, setSelectedBasketName] = React.useState("");
  const [selectedInstrumentKey, setSelectedInstrumentKey] = React.useState("");
  const [runningStage, setRunningStage] = React.useState<string | null>(null);
  const [runResult, setRunResult] = React.useState<PipelineRunResult | null>(null);
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null);
  const [testingNotificationChannel, setTestingNotificationChannel] = React.useState<string | null>(null);
  const [notificationStatusBanner, setNotificationStatusBanner] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Authentication & User Management State
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>({
    id: "usr-admin-1",
    email: "indurotech.jp@gmail.com",
    name: "InduroTech Admin",
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=indurotech",
    provider: "google",
    role: "Super Admin",
    status: "Active",
    createdAtUtc: "2026-09-01T00:00:00.000Z",
    lastLoginAtUtc: new Date().toISOString()
  });
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [sentEmails, setSentEmails] = React.useState<SentEmail[]>([]);
  const [isOAuthModalOpen, setIsOAuthModalOpen] = React.useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
  const [isEmailViewerOpen, setIsEmailViewerOpen] = React.useState(false);

  const handleSwitchUser = async (email: string) => {
    try {
      setActiveUserEmailHeader(email);
      const res = await postJson<{ success: boolean; user: AppUser }>("/api/auth/switch", { email });
      if (res.user) {
        setCurrentUser(res.user);
      }
      await loadDashboard();
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message || "Failed to switch user" }));
    }
  };

  const handleOAuthLogin = async (
    provider: "google" | "microsoft" | "meta" | "email",
    email: string,
    name?: string
  ) => {
    try {
      setActiveUserEmailHeader(email);
      const res = await postJson<{ success: boolean; user: AppUser }>("/api/auth/oauth-login", {
        provider,
        email,
        name
      });
      if (res.user) {
        setCurrentUser(res.user);
      }
      setIsOAuthModalOpen(false);
      await loadDashboard();
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message || "OAuth login failed" }));
    }
  };

  const handleLogout = async () => {
    try {
      await postJson("/api/auth/logout");
      setCurrentUser(null);
      setActiveUserEmailHeader("anonymous");
      await loadDashboard();
    } catch {
      setCurrentUser(null);
    }
  };

  const handleAddUser = async (newUser: {
    name: string;
    email: string;
    provider: AppUser["provider"];
    role: AppUser["role"];
  }) => {
    try {
      const created = await postJson<AppUser>("/api/auth/users", newUser);
      setUsers((prev) => [...prev, created]);
      setIsAddUserModalOpen(false);
      await loadDashboard();
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message || "Failed to create user" }));
    }
  };

  const handleUpdateRole = async (userId: string, role: AppUser["role"]) => {
    try {
      const updated = await putJson<AppUser>(`/api/auth/users/${userId}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message || "Failed to update role" }));
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const newStatus = target.status === "Active" ? "Suspended" : "Active";
    try {
      const updated = await putJson<AppUser>(`/api/auth/users/${userId}`, { status: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message || "Failed to toggle status" }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteJson(`/api/auth/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message || "Failed to delete user" }));
    }
  };

  const triggerTestNotification = React.useCallback(async (channelOverride?: string) => {
    const ch = channelOverride ?? settingsDraft?.notifications?.channel ?? "Both";
    setTestingNotificationChannel(ch);
    setNotificationStatusBanner(null);
    try {
      const response = await postJson<{
        success: boolean;
        message: string;
        results: Array<{ channel: string; isSuccess: boolean; errorMessage?: string }>;
      }>(`/notifications/test?channel=${encodeURIComponent(ch)}`);

      setNotificationStatusBanner({
        success: response.success,
        message: response.message
      });

      const [latestAttempts, latestEvents, latestEmails] = await Promise.all([
        getJson<NotificationAttempt[]>("/notifications/attempts/latest?limit=15"),
        getJson<EventLogEntry[]>("/events/latest?limit=15"),
        getJson<SentEmail[]>("/notifications/emails/latest?limit=50").catch(() => [])
      ]);
      setState((prev) => ({
        ...prev,
        notifications: latestAttempts,
        eventLogs: latestEvents
      }));
      setSentEmails(latestEmails);
    } catch (err: any) {
      setNotificationStatusBanner({
        success: false,
        message: err.message || "Failed to trigger test notification."
      });
    } finally {
      setTestingNotificationChannel(null);
    }
  }, [settingsDraft]);

  const loadDashboard = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const isSettingsAdmin = activeUserEmailHeader.toLowerCase() === "indurotech.jp@gmail.com";

      const [
        health,
        scannerRuns,
        preMarketRuns,
        openingRuns,
        liveRuns,
        monitorRuns,
        backtestRuns,
        backtestAccuracy,
        backtestCalibration,
        feedbackCalibration,
        paperRuns,
        aiRuns,
        brokerStatuses,
        dataSourceSettings,
        applicationSettings,
        pipelineStatus,
        scannerInstruments,
        outcomeFeedback,
        events,
        notifications,
        usersList,
        sessionInfo,
        latestSentEmails
      ] = await Promise.all([
        getJson<{ status: string }>("/health"),
        getJson<RunSummary[]>("/scanner/runs/latest?limit=5"),
        getJson<RunSummary[]>("/pre-market/runs/latest?limit=5"),
        getJson<RunSummary[]>("/opening-range/runs/latest?limit=5"),
        getJson<RunSummary[]>("/live-validation/runs/latest?limit=5"),
        getJson<RunSummary[]>("/monitor/runs/latest?limit=5"),
        getJson<BacktestRun[]>("/backtests/runs/latest?limit=5"),
        getJson<BacktestAccuracySummary>("/accuracy/backtests/summary?limit=100"),
        getJson<BacktestCalibrationSummary[]>("/accuracy/backtests/by-direction?limit=100"),
        getJson<FeedbackCalibrationSummary[]>("/accuracy/feedback/by-recommendation?limit=500"),
        getJson<PaperTradingRun[]>("/paper-trading/runs/latest?limit=5"),
        getJson<AiAnalysisRun[]>("/ai/runs/latest?limit=5"),
        getJson<BrokerStatus[]>("/broker/status"),
        isSettingsAdmin ? getJson<DataSourceSettings>("/settings/data-sources").catch(() => null) : Promise.resolve(null),
        isSettingsAdmin ? getJson<ApplicationSettings>("/settings/application").catch(() => null) : Promise.resolve(null),
        getJson<PipelineStatus>(`/pipeline/status?sessionDate=${runDate}`),
        getJson<ScannerInstruments>("/scanner/instruments"),
        getJson<OutcomeFeedback[]>("/feedback/outcomes/latest?limit=10"),
        getJson<EventLogEntry[]>("/events/latest?limit=10"),
        getJson<NotificationAttempt[]>("/notifications/attempts/latest?limit=8"),
        getJson<AppUser[]>("/api/auth/users").catch(() => []),
        getJson<{ user: AppUser | null; hasSettingsAccess: boolean }>("/api/auth/session").catch(() => ({ user: null, hasSettingsAccess: false })),
        getJson<SentEmail[]>("/notifications/emails/latest?limit=50").catch(() => [])
      ]);

      if (usersList && usersList.length > 0) {
        setUsers(usersList);
      }
      if (sessionInfo?.user) {
        setCurrentUser(sessionInfo.user);
      }
      if (latestSentEmails) {
        setSentEmails(latestSentEmails);
      }

      const latestScannerRun = scannerRuns[0];
      const latestPreMarketRun = preMarketRuns[0];
      const latestOpeningRun = openingRuns[0];
      const latestLiveRun = liveRuns[0];
      const latestMonitorRun = monitorRuns[0];
      const latestBacktestRun = backtestRuns[0];
      const latestPaperRun = paperRuns[0];
      const latestAiRun = aiRuns[0];
      const [candidates, preMarketDecisions, openingDecisions, liveDecisions, monitorEvents, backtestTrades, paperOrders, aiDecisions] = await Promise.all([
        latestScannerRun ? getJson<Candidate[]>(`/scanner/runs/${latestScannerRun.id}/candidates`) : Promise.resolve([]),
        latestPreMarketRun ? getJson<StageDecision[]>(`/pre-market/runs/${latestPreMarketRun.id}/decisions`) : Promise.resolve([]),
        latestOpeningRun ? getJson<StageDecision[]>(`/opening-range/runs/${latestOpeningRun.id}/decisions`) : Promise.resolve([]),
        latestLiveRun ? getJson<StageDecision[]>(`/live-validation/runs/${latestLiveRun.id}/decisions`) : Promise.resolve([]),
        latestMonitorRun ? getJson<MonitorEvent[]>(`/monitor/runs/${latestMonitorRun.id}/events`) : Promise.resolve([]),
        latestBacktestRun ? getJson<BacktestTrade[]>(`/backtests/runs/${latestBacktestRun.id}/trades`) : Promise.resolve([]),
        latestPaperRun ? getJson<PaperOrder[]>(`/paper-trading/runs/${latestPaperRun.id}/orders`) : Promise.resolve([]),
        latestAiRun ? getJson<AiAnalysisDecision[]>(`/ai/runs/${latestAiRun.id}/decisions`) : Promise.resolve([])
      ]);

      setState((current) => ({
        health: health.status,
        scannerRuns,
        candidates,
        preMarketRuns,
        preMarketDecisions,
        openingRuns,
        openingDecisions,
        liveRuns,
        liveDecisions,
        monitorRuns,
        monitorEvents,
        backtestRuns,
        backtestTrades,
        backtestAccuracy,
        backtestCalibration,
        feedbackCalibration,
        paperRuns,
        paperOrders,
        aiRuns,
        aiDecisions,
        outcomeFeedback,
        events,
        notifications,
        brokerStatuses,
        dataSourceSettings,
        applicationSettings,
        pipelineStatus,
        scannerInstruments,
        lookupResults: current.lookupResults,
        loading: false,
        error: null
      }));
      setLastRefresh(new Date());
      setSettingsDraft(applicationSettings);
      setInstrumentDraft(scannerInstruments.instruments);
      setBasketDraft(scannerInstruments.baskets.map((basket) => ({
        name: basket.name,
        enabled: basket.enabled,
        maxSymbols: basket.maxSymbols,
        instruments: basket.instruments
      })));
      setUniverseDraft(scannerInstruments.universes.map((universe) => ({
        name: universe.name,
        enabled: universe.enabled,
        basketNames: universe.basketNames,
        directInstruments: universe.directInstruments
      })));
      setSelectedUniverseName((current) => current || scannerInstruments.universes.find((universe) => universe.enabled)?.name || scannerInstruments.universes[0]?.name || "");
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Dashboard refresh failed"
      }));
    }
  }, [runDate]);

  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  React.useEffect(() => {
    const onHashChange = () => setActiveView(getHashView());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  React.useEffect(() => {
    if (activeView !== "settings" || activeUserEmailHeader.toLowerCase() !== "indurotech.jp@gmail.com") {
      return;
    }

    let isCurrent = true;
    void getJson<ApplicationSettings>("/settings/application")
      .then((applicationSettings) => {
        if (!isCurrent) {
          return;
        }

        setSettingsDraft(applicationSettings);
        setState((current) => ({ ...current, applicationSettings }));
      })
      .catch((error) => {
        if (isCurrent) {
          setSettingsMessage(error instanceof Error ? error.message : "Application settings load failed");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeView]);

  async function lookupInstrument(event: React.FormEvent) {
    event.preventDefault();
    if (!symbol.trim()) {
      return;
    }

    try {
      const results = await getJson<LookupResult[]>(`/instruments/dhan/search?symbol=${encodeURIComponent(symbol.trim())}&exchange=NSE`);
      setState((current) => ({ ...current, lookupResults: results, error: null }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Instrument lookup failed"
      }));
    }
  }

  async function runPipelineStage(stage: string, path: string) {
    setRunningStage(stage);
    setRunResult(null);
    setState((current) => ({ ...current, error: null }));

    try {
      const result = await postJson<PipelineRunResult>(appendRunQuery(path, runDate));
      setRunResult(result);
      await loadDashboard();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : `${stage} run failed`
      }));
    } finally {
      setRunningStage(null);
    }
  }

  async function runBacktest() {
    setRunningStage("Backtest");
    setRunResult(null);
    setState((current) => ({ ...current, error: null }));

    try {
      const result = await postJson<PipelineRunResult>(appendRunQuery(`/backtests/run?fromDate=${backtestFromDate}&toDate=${backtestToDate}`, null));
      setRunResult(result);
      await loadDashboard();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Backtest run failed"
      }));
    } finally {
      setRunningStage(null);
    }
  }

  async function runWorkflow() {
    setRunningStage("Workflow");
    setRunResult(null);
    setState((current) => ({ ...current, error: null }));

    const stages = [
      ["EOD", "/pipeline/eod/run"],
      ["Pre-market", "/pipeline/pre-market/run"],
      ["Opening range", "/pipeline/opening-range/run"],
      ["Live validation", `/pipeline/live-validation/run?from=${fromTime}&to=${toTime}`],
      ["AI analysis", "/ai/run"],
      ["Paper trading", "/paper-trading/run"],
      ["Monitor", `/pipeline/monitor/run?from=${fromTime}&to=${toTime}`]
    ] as const;

    try {
      let latest: PipelineRunResult | null = null;
      for (const [stage, path] of stages) {
        setRunningStage(stage);
        latest = await postJson<PipelineRunResult>(appendRunQuery(path, runDate));
        if (latest.status === "Skipped" && stage !== "Pre-market") {
          break;
        }
      }

      setRunResult(latest);
      await loadDashboard();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Workflow run failed"
      }));
    } finally {
      setRunningStage(null);
    }
  }

  async function saveApplicationSettings() {
    if (!settingsDraft) {
      return;
    }

    try {
      const response = await putJson<{ message: string }>("/settings/application", settingsDraft);
      setSettingsMessage(response.message);
      await loadDashboard();
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Settings save failed");
    }
  }

  async function saveScannerInstruments() {
    try {
      const response = await putJson<{ message: string; count: number }>("/scanner/instruments", { instruments: instrumentDraft });
      setInstrumentMessage(`${response.message} Saved ${response.count} instruments.`);
      await loadDashboard();
    } catch (error) {
      setInstrumentMessage(error instanceof Error ? error.message : "Scanner instruments save failed");
    }
  }

  async function saveScannerBaskets() {
    try {
      const response = await putJson<{ message: string; count: number }>("/scanner/baskets", { baskets: basketDraft });
      setBasketMessage(`${response.message} Saved ${response.count} basket instruments.`);
      await loadDashboard();
    } catch (error) {
      setBasketMessage(error instanceof Error ? error.message : "Scanner basket save failed");
    }
  }

  async function saveScannerUniverses() {
    try {
      const response = await putJson<{ message: string; count: number }>("/scanner/universes", { universes: universeDraft });
      setUniverseMessage(`${response.message} Saved ${response.count} universes.`);
      await loadDashboard();
    } catch (error) {
      setUniverseMessage(error instanceof Error ? error.message : "Scanner universe save failed");
    }
  }

  async function seedPredefinedBaskets() {
    try {
      const response = await postJson<{ message: string; basketsCreated: number; instrumentCount: number }>("/scanner/baskets/predefined");
      setBasketMessage(`${response.message} Created ${response.basketsCreated} baskets with ${response.instrumentCount} resolved stocks.`);
      await loadDashboard();
    } catch (error) {
      setBasketMessage(error instanceof Error ? error.message : "Predefined basket creation failed");
    }
  }

  const latestRun = state.scannerRuns[0];
  const accepted = latestRun?.acceptedCount ?? 0;
  const rejected = latestRun?.rejectedCount ?? 0;
  const actionable = state.monitorRuns[0]?.actionableCount ?? 0;
  const notificationFailures = state.notifications.filter((item) => !item.isSuccess).length;
  const connectedBrokers = state.brokerStatuses.filter((item) => item.isConnected).length;
  const enabledUniverses = state.scannerInstruments?.universes.filter((universe) => universe.enabled || universe.name === selectedUniverseName) ?? [];
  const enabledBaskets = state.scannerInstruments?.baskets.filter((basket) => basket.enabled || basket.name === selectedBasketName) ?? [];
  const runUniverseLabel = runUniverseMode === "universe"
    ? selectedUniverseName || "Choose universe"
    : runUniverseMode === "basket"
      ? selectedBasketName || "Choose basket"
      : runUniverseMode === "instrument"
        ? selectedInstrumentKey || "Choose stock"
        : `${state.scannerInstruments?.count ?? 0} active instruments`;
  const isRunUniverseReady = (runUniverseMode === "universe" && Boolean(selectedUniverseName))
    || runUniverseMode === "all"
    || (runUniverseMode === "basket" && Boolean(selectedBasketName))
    || (runUniverseMode === "instrument" && Boolean(selectedInstrumentKey));
  const appendRunQuery = (path: string, sessionDate: string | null) => {
    const params = new URLSearchParams();
    if (sessionDate) {
      params.set("sessionDate", sessionDate);
    }

    if (runUniverseMode === "universe" && selectedUniverseName) {
      params.set("universeName", selectedUniverseName);
    }

    if (runUniverseMode === "basket" && selectedBasketName) {
      params.set("basketName", selectedBasketName);
    }

    if (runUniverseMode === "instrument" && selectedInstrumentKey) {
      params.set("instrumentKey", selectedInstrumentKey);
    }

    const query = params.toString();
    if (!query) {
      return path;
    }

    return `${path}${path.includes("?") ? "&" : "?"}${query}`;
  };
  const openMenu = () => {
    setSidebarCollapsed(false);
    setMenuOpen(true);
  };
  const navGroups = [
    {
      label: "Command",
      items: [
        { href: "#overview", label: "Overview", icon: <Gauge aria-hidden="true" /> },
        { href: "#pipeline", label: "Run Pipeline", icon: <PlayCircle aria-hidden="true" /> },
        { href: "#workflow", label: "Readiness", icon: <ClipboardList aria-hidden="true" /> }
      ]
    },
    {
      label: "Universe",
      items: [
        { href: "#instruments", label: "Universe Builder", icon: <Database aria-hidden="true" /> },
        { href: "#lookup", label: "Lookup", icon: <Search aria-hidden="true" /> }
      ]
    },
    {
      label: "Results",
      items: [
        { href: "#monitoring", label: "Monitoring", icon: <Activity aria-hidden="true" /> },
        { href: "#backtesting", label: "Backtesting", icon: <TrendingUp aria-hidden="true" /> },
        { href: "#reports", label: "Reports", icon: <LineChart aria-hidden="true" /> },
        { href: "#paper", label: "Paper", icon: <History aria-hidden="true" /> },
        { href: "#ai", label: "AI", icon: <Siren aria-hidden="true" /> }
      ]
    },
    {
      label: "Operations",
      items: [
        { href: "#broker", label: "Broker", icon: <ShieldCheck aria-hidden="true" /> },
        { href: "#settings", label: "Settings", icon: <Gauge aria-hidden="true" /> },
        { href: "#users", label: "User Management", icon: <Users aria-hidden="true" /> },
        { href: "#events", label: "Events", icon: <ClipboardList aria-hidden="true" /> },
        { href: "#notifications", label: "Notifications", icon: <Bell aria-hidden="true" /> }
      ]
    }
  ];
  const navItems = navGroups.flatMap((group) => group.items);
  const activeNavItem = navItems.find((item) => item.href === `#${activeView}`) ?? navItems[0];

  return (
    <main className={`dashboard-shell ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${isMenuOpen ? "menu-open" : ""}`}>
      <button className="menu-fab" type="button" onClick={openMenu} aria-label="Open menu" aria-expanded={isMenuOpen}>
        <Menu aria-hidden="true" />
      </button>
      {isMenuOpen && <button className="menu-backdrop" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className="sidebar">
        <div className="brand">
          <LineChart aria-hidden="true" />
          <div className="brand-copy">
            <strong>UniversalEngine</strong>
            <span>NSE/BSE analysis</span>
          </div>
          <button className="sidebar-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X aria-hidden="true" />
          </button>
        </div>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={() => setSidebarCollapsed((value) => !value)}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isSidebarCollapsed}
        >
          {isSidebarCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          <span>{isSidebarCollapsed ? "Expand" : "Collapse"}</span>
        </button>
        <nav aria-label="Dashboard sections">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={item.href === `#${activeView}` ? "active" : undefined}
                  onClick={() => {
                    setActiveView(item.href.slice(1) as DashboardView);
                    setMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="topbar-menu" type="button" onClick={openMenu} aria-label="Open menu">
            <Menu aria-hidden="true" />
          </button>
          <div>
            <p className="eyebrow">Control room</p>
            <h1>{activeNavItem.label}</h1>
            <span className="topbar-subtitle">Focused workspace for {activeNavItem.label.toLowerCase()}.</span>
          </div>
          <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            <button className="icon-button" type="button" onClick={() => void loadDashboard()} title="Refresh dashboard" aria-label="Refresh dashboard">
              <RefreshCw aria-hidden="true" />
            </button>
            <UserTopbarProfile
              currentUser={currentUser}
              onOpenLogin={() => setIsOAuthModalOpen(true)}
              onSwitchUser={(email) => void handleSwitchUser(email)}
              onLogout={() => void handleLogout()}
            />
          </div>
        </header>

        {state.error && (
          <div className="alert" role="alert">
            <WifiOff aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        <section className="control-summary" id="overview" aria-label="Command summary" hidden={activeView !== "overview"}>
          <InfoCard icon={<Database />} label="Run source" value={runUniverseLabel} detail={isRunUniverseReady ? "Ready for manual run" : "Selection required"} tone={isRunUniverseReady ? "good" : "warn"} />
          <InfoCard icon={<ShieldCheck />} label="Execution mode" value="Notification-only" detail="No broker order placement" tone="good" />
          <InfoCard icon={<Activity />} label="Latest activity" value={latestRun ? latestRun.sessionDate : "No EOD run"} detail={latestRun ? `${latestRun.acceptedCount ?? 0} accepted, ${latestRun.rejectedCount ?? 0} rejected` : "Run pipeline to populate"} />
        </section>

        <section className="metrics" aria-label="Overview metrics" hidden={activeView !== "overview"}>
          <Metric icon={<ShieldCheck />} label="API" value={state.health.toUpperCase()} tone={state.health === "ok" ? "good" : "warn"} />
          <Metric icon={<Gauge />} label="Latest Accepted" value={accepted.toString()} />
          <Metric icon={<Siren />} label="Latest Rejected" value={rejected.toString()} />
          <Metric icon={<Activity />} label="Monitor Alerts" value={actionable.toString()} tone={actionable > 0 ? "warn" : "neutral"} />
          <Metric icon={<History />} label="Broker Online" value={`${connectedBrokers}/${state.brokerStatuses.length || 3}`} tone={connectedBrokers > 0 ? "good" : "warn"} />
          <Metric icon={<Database />} label="Cache Files" value={(state.dataSourceSettings?.historicalCacheEntryCount ?? 0).toString()} tone={state.dataSourceSettings?.historicalCacheEnabled ? "good" : "warn"} />
          <Metric icon={<Bell />} label="Notification Failures" value={notificationFailures.toString()} tone={notificationFailures > 0 ? "bad" : "good"} />
        </section>

        <section className="split" id="workflow" hidden={activeView !== "workflow"}>
          <Panel title="Pipeline Readiness" action={runDate}>
            <WorkflowTimeline status={state.pipelineStatus} runningStage={runningStage} />
          </Panel>

          <Panel title="Operations">
            <OperationsSnapshot
              settings={state.dataSourceSettings}
              brokerStatuses={state.brokerStatuses}
              scannerRuns={state.scannerRuns}
              notifications={state.notifications}
            />
          </Panel>
        </section>

        <section className="split" id="pipeline" hidden={activeView !== "pipeline"}>
          <Panel title="Run Pipeline" action="Notification-only">
            <div className="pipeline-actions">
              <label>
                Session date
                <input type="date" value={runDate} onChange={(event) => setRunDate(event.target.value)} />
              </label>
              <label>
                From
                <input type="time" value={fromTime} onChange={(event) => setFromTime(event.target.value)} />
              </label>
              <label>
                To
                <input type="time" value={toTime} onChange={(event) => setToTime(event.target.value)} />
              </label>
              <label>
                Scan universe
                <select value={runUniverseMode} onChange={(event) => setRunUniverseMode(event.target.value as RunUniverseMode)}>
                  <option value="universe">Universe</option>
                  <option value="all">All active</option>
                  <option value="basket">Basket</option>
                  <option value="instrument">One stock</option>
                </select>
              </label>
              {runUniverseMode === "universe" && (
                <label>
                  Universe
                  <select value={selectedUniverseName} onChange={(event) => setSelectedUniverseName(event.target.value)}>
                    <option value="">Choose universe</option>
                    {enabledUniverses.map((universe) => (
                      <option key={universe.name} value={universe.name}>{universe.name} ({universe.instrumentCount})</option>
                    ))}
                  </select>
                </label>
              )}
              {runUniverseMode === "basket" && (
                <label>
                  Basket
                  <select value={selectedBasketName} onChange={(event) => setSelectedBasketName(event.target.value)}>
                    <option value="">Choose basket</option>
                    {enabledBaskets.map((basket) => (
                      <option key={basket.name} value={basket.name}>{basket.name} ({basket.instrumentCount})</option>
                    ))}
                  </select>
                </label>
              )}
              {runUniverseMode === "instrument" && (
                <label>
                  Stock
                  <select value={selectedInstrumentKey} onChange={(event) => setSelectedInstrumentKey(event.target.value)}>
                    <option value="">Choose stock</option>
                    {(state.scannerInstruments?.instruments ?? []).map((instrument) => (
                      <option key={instrument.key} value={instrument.key}>{instrument.symbol} ({instrument.exchange})</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="workflow-run-card">
                <div>
                  <span>Recommended flow</span>
                  <strong>{runUniverseLabel}</strong>
                  <p>{isRunUniverseReady ? "Runs the ordered scanner flow and stops when a required prerequisite is missing." : "Select a scan source before starting."}</p>
                </div>
                <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runWorkflow()}>
                  Run Workflow
                </button>
              </div>
              <div className="stage-action-groups">
                <div className="stage-action-group">
                  <span>Analysis</span>
                  <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runPipelineStage("EOD", "/pipeline/eod/run")}>EOD</button>
                  <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runPipelineStage("Pre-market", "/pipeline/pre-market/run")}>Pre-market</button>
                </div>
                <div className="stage-action-group">
                  <span>Validation</span>
                  <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runPipelineStage("Opening range", "/pipeline/opening-range/run")}>Opening</button>
                  <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runPipelineStage("Live validation", `/pipeline/live-validation/run?from=${fromTime}&to=${toTime}`)}>Live</button>
                  <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runPipelineStage("Monitor", `/pipeline/monitor/run?from=${fromTime}&to=${toTime}`)}>Monitor</button>
                </div>
                <div className="stage-action-group">
                  <span>Decision support</span>
                  <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runPipelineStage("AI analysis", "/ai/run")}>AI</button>
                  <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runPipelineStage("Paper trading", "/paper-trading/run")}>Paper</button>
                  <button type="button" disabled={runningStage !== null || !isRunUniverseReady} onClick={() => void runPipelineStage("Paper mark-to-market", "/paper-trading/mark-to-market")}>Mark Paper</button>
                </div>
              </div>
              <PipelineReadiness status={state.pipelineStatus} />
              <DataSourceReadiness settings={state.dataSourceSettings} />
              <PipelineReadinessChart status={state.pipelineStatus} />
              <p className="run-note">
                {runningStage ? `Running ${runningStage} for ${runUniverseLabel}...` : runResult ? `${runResult.stage}: ${runResult.status}; evaluated ${runResult.evaluatedCount}, accepted ${runResult.acceptedCount}, rejected ${runResult.rejectedCount}. ${runResult.message}` : isRunUniverseReady ? `Manual runs use ${runUniverseLabel} and never place orders.` : "Choose a universe, basket, or stock before running."}
              </p>
            </div>
          </Panel>

          <Panel title="Latest EOD Candidates" action={lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : state.loading ? "Loading" : "Ready"}>
            <DataTable
              columns={["Symbol", "Direction", "Outcome", "Score", "Verdict", "Reasons"]}
              rows={state.candidates.map((item) => [
                `${item.exchange}:${item.symbol}`,
                item.direction ?? "-",
                item.outcome,
                formatNumber(item.score),
                item.finalVerdict ?? "-",
                summarizeReasons(item.reasonsJson)
              ])}
              emptyText="No persisted scanner candidates yet."
            />
          </Panel>

          <Panel title="Pipeline Runs">
            <StageList
              stages={[
                ["EOD", state.scannerRuns[0]],
                ["Pre-market", state.preMarketRuns[0]],
                ["Opening range", state.openingRuns[0]],
                ["Live validation", state.liveRuns[0]],
                ["Monitor", state.monitorRuns[0]]
              ]}
            />
          </Panel>
        </section>

        <SectionHeader
          eyebrow="Universe setup"
          title="Build the stocks the scanner can see"
          detail="Create reusable baskets, combine them into universes, and add standalone stocks when a one-off symbol needs to be included."
          hidden={activeView !== "instruments"}
        />

        <section id="instruments" hidden={activeView !== "instruments"}>
          <Panel title="Universe Builder" action={state.scannerInstruments ? `${state.scannerInstruments.universes.filter((universe) => universe.enabled).length}/${state.scannerInstruments.universes.length} enabled` : "Loading"}>
            <UniverseEditor
              baskets={state.scannerInstruments?.baskets ?? []}
              draft={universeDraft}
              message={universeMessage}
              onChange={setUniverseDraft}
              onSave={() => void saveScannerUniverses()}
            />
          </Panel>
          <Panel title="Basket Library" action={state.scannerInstruments ? `${state.scannerInstruments.baskets.filter((basket) => basket.enabled).length}/${state.scannerInstruments.baskets.length} enabled` : "Loading"}>
            <BasketEditor
              baskets={state.scannerInstruments?.baskets ?? []}
              draft={basketDraft}
              message={basketMessage}
              onChange={setBasketDraft}
              onSeedPredefined={() => void seedPredefinedBaskets()}
              onSave={() => void saveScannerBaskets()}
            />
          </Panel>
          <Panel title="Standalone Instruments" action={state.scannerInstruments ? `${state.scannerInstruments.count} active` : "Loading"}>
            <InstrumentEditor
              instruments={instrumentDraft}
              message={instrumentMessage}
              onChange={setInstrumentDraft}
              onSave={() => void saveScannerInstruments()}
            />
          </Panel>
        </section>

        <SectionHeader
          eyebrow="Signal review"
          title="Inspect each decision before acting"
          detail="Review pre-market, opening-range, live-validation, broker, monitor, and notification records from the latest runs."
          hidden={activeView !== "broker"}
        />

        <section className="split" id="stage-details" hidden={activeView !== "broker"}>
          <Panel title="Pre-market Decisions">
            <ReasonSummary decisions={state.preMarketDecisions} />
            <StageDecisionTable decisions={state.preMarketDecisions} emptyText="No pre-market decisions found for latest run." />
          </Panel>

          <Panel title="Opening-range Decisions">
            <ReasonSummary decisions={state.openingDecisions} />
            <StageDecisionTable decisions={state.openingDecisions} emptyText="No opening-range decisions found for latest run." />
          </Panel>
        </section>

        <section className="split" hidden={activeView !== "broker"}>
          <Panel title="Live-validation Decisions">
            <ReasonSummary decisions={state.liveDecisions} />
            <StageDecisionTable decisions={state.liveDecisions} emptyText="No live-validation decisions found for latest run." />
          </Panel>

          <Panel title="Broker Connection Status" id="broker">
            <DataTable
              columns={["Broker", "Configured", "Connected", "Status", "Message"]}
              rows={state.brokerStatuses.map((item) => [
                item.broker,
                item.isConfigured ? "Yes" : "No",
                item.isConnected ? "Yes" : "No",
                item.status,
                item.message
              ])}
              emptyText="Broker status has not loaded yet."
            />
          </Panel>
        </section>

        <section className="split" id="monitoring" hidden={activeView !== "monitoring" && activeView !== "notifications"}>
          <Panel title="Monitor Events">
            <DataTable
              columns={["Symbol", "Direction", "Status", "Last", "Reason"]}
              rows={state.monitorEvents.map((item) => [
                `${item.exchange}:${item.symbol}`,
                item.direction ?? "-",
                item.status,
                item.latestPrice ? formatNumber(item.latestPrice) : "-",
                item.reason
              ])}
              emptyText="No monitor events found for latest monitor run."
            />
          </Panel>

          <Panel title="Notification Attempts" id="notifications">
            <div className="notification-panel-controls">
              <div className="notification-actions">
                <button
                  type="button"
                  className="test-btn"
                  disabled={testingNotificationChannel !== null}
                  onClick={() => void triggerTestNotification("Telegram")}
                >
                  <Send style={{ width: 14, height: 14 }} />
                  {testingNotificationChannel === "Telegram" ? "Testing Telegram..." : "Test Telegram"}
                </button>
                <button
                  type="button"
                  className="test-btn"
                  disabled={testingNotificationChannel !== null}
                  onClick={() => void triggerTestNotification("Email")}
                >
                  <Mail style={{ width: 14, height: 14 }} />
                  {testingNotificationChannel === "Email" ? "Testing Email..." : "Test Email"}
                </button>
                <button
                  type="button"
                  className="test-btn test-btn-primary"
                  disabled={testingNotificationChannel !== null}
                  onClick={() => void triggerTestNotification("Both")}
                >
                  <Bell style={{ width: 14, height: 14 }} />
                  {testingNotificationChannel === "Both" ? "Testing Both..." : "Test Both Channels"}
                </button>
                <button
                  type="button"
                  className="test-btn"
                  style={{ background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }}
                  onClick={() => setIsEmailViewerOpen(true)}
                  title="View all rendered HTML emails sent or archived in-app"
                >
                  <Mail style={{ width: 14, height: 14 }} />
                  📬 In-App Email Inbox ({sentEmails.length})
                </button>
              </div>
              {notificationStatusBanner && (
                <div className={`notification-banner ${notificationStatusBanner.success ? "success" : "warning"}`}>
                  <span className="banner-icon">{notificationStatusBanner.success ? "✅" : "⚠️"}</span>
                  <span className="banner-text">{notificationStatusBanner.message}</span>
                  <button type="button" className="banner-close" onClick={() => setNotificationStatusBanner(null)}>&times;</button>
                </div>
              )}
            </div>
            <DataTable
              columns={["Time", "Channel", "Status", "Subject", "Details"]}
              rows={state.notifications.map((item) => [
                new Date(item.attemptedAtUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                item.channel,
                item.isSuccess ? "Sent" : "Failed",
                item.subject,
                item.errorMessage ?? "Delivered"
              ])}
              emptyText="No notification attempts found."
            />
          </Panel>
        </section>

        <SectionHeader
          eyebrow="Reports"
          title="Measure accuracy and execution history"
          detail="Use backtests, calibration, exports, paper orders, and AI decisions to understand whether the scanner is improving."
          hidden={activeView !== "backtesting" && activeView !== "reports"}
        />

        <section className="split" id="backtesting" hidden={activeView !== "backtesting"}>
          <Panel title="Backtest Accuracy">
            <div className="backtest-runner">
              <label>
                From
                <input type="date" value={backtestFromDate} onChange={(event) => setBacktestFromDate(event.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={backtestToDate} onChange={(event) => setBacktestToDate(event.target.value)} />
              </label>
              <button type="button" disabled={runningStage !== null} onClick={() => void runBacktest()}>Run Backtest</button>
            </div>
            {state.backtestAccuracy ? (
              <DataTable
                columns={["Runs", "Signals", "Win rate", "Avg return", "W/L/F/No exit"]}
                rows={[[
                  state.backtestAccuracy.runs.toString(),
                  state.backtestAccuracy.signals.toString(),
                  `${formatNumber(state.backtestAccuracy.winRatePercent)}%`,
                  `${formatNumber(state.backtestAccuracy.averageReturnPercent)}%`,
                  `${state.backtestAccuracy.wins}/${state.backtestAccuracy.losses}/${state.backtestAccuracy.flats}/${state.backtestAccuracy.noExitData}`
                ]]}
                emptyText="No accuracy summary yet."
              />
            ) : (
              <p className="empty-state">No persisted accuracy summary yet.</p>
            )}
          </Panel>

          <Panel title="Backtest Direction Calibration">
            <CalibrationBars rows={state.backtestCalibration} />
            <DataTable
              columns={["Direction", "Signals", "Win rate", "Avg return", "W/L/F/No exit"]}
              rows={state.backtestCalibration.map((item) => [
                item.bucket,
                item.signals.toString(),
                `${formatNumber(item.winRatePercent)}%`,
                `${formatNumber(item.averageReturnPercent)}%`,
                `${item.wins}/${item.losses}/${item.flats}/${item.noExitData}`
              ])}
              emptyText="No direction calibration data yet."
            />
          </Panel>
        </section>

        <section id="feedback-calibration" hidden={activeView !== "backtesting"}>
          <Panel title="Feedback Calibration">
            <DataTable
              columns={["Source / Recommendation", "Signals", "Win rate", "Avg return", "W/L/F"]}
              rows={state.feedbackCalibration.map((item) => [
                item.bucket,
                item.signals.toString(),
                `${formatNumber(item.winRatePercent)}%`,
                `${formatNumber(item.averageReturnPercent)}%`,
                `${item.wins}/${item.losses}/${item.flats}`
              ])}
              emptyText="No outcome feedback calibration yet."
            />
          </Panel>
        </section>

        <section className="split" id="reports" hidden={activeView !== "reports"}>
          <Panel title="Historical Execution Report">
            <ExecutionHistory
              scannerRuns={state.scannerRuns}
              preMarketRuns={state.preMarketRuns}
              openingRuns={state.openingRuns}
              liveRuns={state.liveRuns}
              monitorRuns={state.monitorRuns}
              events={state.events}
            />
          </Panel>

          <Panel title="Report Infographics">
            <ReportInfographics
              accuracy={state.backtestAccuracy}
              calibration={state.backtestCalibration}
              candidates={state.candidates}
              paperRuns={state.paperRuns}
            />
            <ReportExports
              candidates={state.candidates}
              preMarketDecisions={state.preMarketDecisions}
              openingDecisions={state.openingDecisions}
              liveDecisions={state.liveDecisions}
              backtestTrades={state.backtestTrades}
              paperOrders={state.paperOrders}
              notifications={state.notifications}
              events={state.events}
            />
          </Panel>
        </section>

        <section className="split" hidden={activeView !== "reports"}>
          <Panel title="Backtest Reports">
            <DataTable
              columns={["Range", "Signals", "Win rate", "Avg return", "W/L/F/No exit"]}
              rows={state.backtestRuns.map((item) => [
                `${item.fromDate} to ${item.toDate}`,
                item.signals.toString(),
                `${formatNumber(item.winRatePercent)}%`,
                `${formatNumber(item.averageReturnPercent)}%`,
                `${item.wins}/${item.losses}/${item.flats}/${item.noExitData}`
              ])}
              emptyText="No persisted backtest reports yet."
            />
          </Panel>

          <Panel title="Latest Backtest Trades">
            <DataTable
              columns={["Signal", "Symbol", "Direction", "Outcome", "Entry", "Exit", "Return", "Score"]}
              rows={state.backtestTrades.slice(0, 20).map((item) => [
                item.signalDate,
                `${item.exchange}:${item.symbol}`,
                item.direction,
                item.outcome,
                formatNumber(item.entryPrice),
                formatOptionalNumber(item.exitPrice),
                typeof item.returnPercent === "number" ? `${formatNumber(item.returnPercent)}%` : "-",
                formatNumber(item.score)
              ])}
              emptyText="No trades found for latest backtest report."
            />
          </Panel>
        </section>

        <SectionHeader
          eyebrow="Operations"
          title="Keep the application ready for market hours"
          detail="Tune non-secret configuration, inspect event logs, verify notifications, and look up Dhan instrument details."
          hidden={activeView !== "settings"}
        />

        <section id="settings" hidden={activeView !== "settings"}>
          {currentUser?.email.toLowerCase() === "indurotech.jp@gmail.com" ? (
            <Panel title="Application Settings" action="Add / update">
              <SettingsEditor
                settings={settingsDraft}
                message={settingsMessage ?? state.applicationSettings?.message}
                onChange={setSettingsDraft}
                onSave={() => void saveApplicationSettings()}
                onTestNotification={(ch) => void triggerTestNotification(ch)}
                testingNotificationChannel={testingNotificationChannel}
                sentEmailsCount={sentEmails.length}
                onOpenSentEmails={() => setIsEmailViewerOpen(true)}
              />
            </Panel>
          ) : (
            <SettingsAccessDeniedScreen
              currentEmail={currentUser?.email || "anonymous"}
              currentUserRole={currentUser?.role || "Viewer"}
              onSwitchToAdmin={() => void handleSwitchUser("indurotech.jp@gmail.com")}
            />
          )}
        </section>

        <SectionHeader
          eyebrow="Operations"
          title="Team Access Control & Identity Management"
          detail="Manage team accounts, assign intraday trading roles, inspect OAuth authentication providers, and audit clearance."
          hidden={activeView !== "users"}
        />

        <section id="users" hidden={activeView !== "users"}>
          <UserManagementPanel
            currentUser={currentUser}
            users={users}
            onSwitchUser={(email) => void handleSwitchUser(email)}
            onAddUser={() => setIsAddUserModalOpen(true)}
            onUpdateRole={(userId, role) => void handleUpdateRole(userId, role)}
            onToggleStatus={(userId) => void handleToggleStatus(userId)}
            onDeleteUser={(userId) => void handleDeleteUser(userId)}
          />
        </section>

        <section className="split" id="paper" hidden={activeView !== "paper"}>
          <Panel title="Paper Trading Runs">
            <DataTable
              columns={["Session", "Orders", "Open", "Closed", "Started"]}
              rows={state.paperRuns.map((item) => [
                item.sessionDate,
                item.orderCount.toString(),
                item.openCount.toString(),
                item.closedCount.toString(),
                new Date(item.startedAtUtc).toLocaleString()
              ])}
              emptyText="No paper trading runs found."
            />
          </Panel>

          <Panel title="Latest Paper Orders">
            <DataTable
              columns={["Symbol", "Direction", "Status", "Entry", "Exit", "Return", "P&L", "Qty", "Source"]}
              rows={state.paperOrders.map((item) => [
                `${item.exchange}:${item.symbol}`,
                item.direction,
                item.status,
                formatNumber(item.entryPrice),
                formatOptionalNumber(item.exitPrice),
                typeof item.returnPercent === "number" ? `${formatNumber(item.returnPercent)}%` : "-",
                formatOptionalNumber(item.realizedPnl),
                item.quantity.toString(),
                item.sourceStage
              ])}
              emptyText="No paper orders found for latest run."
            />
          </Panel>
        </section>

        <section className="split" id="ai" hidden={activeView !== "ai"}>
          <Panel title="AI Analysis Runs">
            <DataTable
              columns={["Session", "Decisions", "Trade", "Watchlist", "No trade", "Started"]}
              rows={state.aiRuns.map((item) => [
                item.sessionDate,
                item.decisionCount.toString(),
                item.tradeCandidateCount.toString(),
                item.watchlistCount.toString(),
                item.noTradeCount.toString(),
                new Date(item.startedAtUtc).toLocaleString()
              ])}
              emptyText="No AI analysis runs found."
            />
          </Panel>

          <Panel title="Latest AI Decisions">
            <DataTable
              columns={["Symbol", "Direction", "Recommendation", "Probability", "Confidence", "Prompt", "Rationale"]}
              rows={state.aiDecisions.map((item) => [
                `${item.exchange}:${item.symbol}`,
                item.direction,
                item.recommendation,
                `${formatNumber(item.probabilityPercent)}%`,
                item.confidence,
                item.promptVersion,
                item.rationale
              ])}
              emptyText="No AI decisions found for latest run."
            />
          </Panel>
        </section>

        <section className="split" id="events" hidden={activeView !== "events"}>
          <Panel title="Outcome Feedback">
            <DataTable
              columns={["Time", "Symbol", "Source", "Recommendation", "Outcome", "Return", "Notes"]}
              rows={state.outcomeFeedback.map((item) => [
                new Date(item.createdAtUtc).toLocaleString(),
                `${item.exchange}:${item.symbol} ${item.direction}`,
                item.source,
                item.recommendation,
                item.outcome,
                typeof item.returnPercent === "number" ? `${formatNumber(item.returnPercent)}%` : "-",
                item.notes || "-"
              ])}
              emptyText="No outcome feedback recorded yet."
            />
          </Panel>

          <Panel title="Event Log">
            <DataTable
              columns={["Time", "Type", "Subject", "Payload"]}
              rows={state.events.map((item) => [
                new Date(item.createdAtUtc).toLocaleString(),
                item.eventType,
                item.subject,
                summarizeEventPayload(item.payloadJson)
              ])}
              emptyText="No pipeline events found."
            />
          </Panel>
        </section>

        <section id="lookup" hidden={activeView !== "lookup"}>
          <Panel title="Dhan Instrument Lookup">
            <form className="lookup-form" onSubmit={lookupInstrument}>
              <Search aria-hidden="true" />
              <input value={symbol} onChange={(event) => setSymbol(event.target.value)} aria-label="Symbol" />
              <button type="submit">Search NSE</button>
            </form>
            <DataTable
              columns={["Symbol", "Security ID", "ISIN", "Name"]}
              rows={state.lookupResults.slice(0, 8).map((item) => [
                `${item.exchange}:${item.symbol}`,
                item.securityId,
                item.isin ?? "-",
                item.displayName
              ])}
              emptyText="Search a symbol to fetch Dhan instrument matches."
            />
          </Panel>
        </section>
      </section>

      <OAuthLoginModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        onOAuthLogin={handleOAuthLogin}
      />

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleAddUser}
      />

      <SentEmailsModal
        isOpen={isEmailViewerOpen}
        onClose={() => setIsEmailViewerOpen(false)}
        sentEmails={sentEmails}
      />
    </main>
  );
}

function Metric({ icon, label, value, tone = "neutral" }: { icon: React.ReactNode; label: string; value: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return (
    <article className={`metric metric-${tone}`}>
      <span className="metric-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Panel({ title, action, id, children }: { title: string; action?: string; id?: string; children: React.ReactNode }) {
  return (
    <section className="panel" id={id}>
      <header>
        <h2>{title}</h2>
        {action && <span>{action}</span>}
      </header>
      {children}
    </section>
  );
}

function SectionHeader({ eyebrow, title, detail, hidden = false }: { eyebrow: string; title: string; detail: string; hidden?: boolean }) {
  return (
    <header className="section-header" hidden={hidden}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{detail}</p>
    </header>
  );
}

function StageList({ stages }: { stages: Array<[string, RunSummary | undefined]> }) {
  return (
    <ol className="stage-list">
      {stages.map(([name, run]) => (
        <li key={name}>
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>{name}</strong>
            <span>{run ? `${run.sessionDate} · ${run.startedAtUtc ? new Date(run.startedAtUtc).toLocaleString() : "recorded"}` : "No run found"}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function WorkflowTimeline({ status, runningStage }: { status: PipelineStatus | null; runningStage: string | null }) {
  const fallbackStages = ["EOD", "Pre-market", "Opening range", "Live validation", "Monitor"];
  const stages = status?.stages ?? fallbackStages.map((stage) => ({
    stage,
    canRun: stage === "EOD",
    candidateCount: 0,
    message: stage === "EOD" ? "Ready to start from configured instruments." : "Waiting for prior stage output."
  }));

  return (
    <ol className="workflow-timeline">
      {stages.map((stage, index) => {
        const running = runningStage?.toLowerCase().includes(stage.stage.toLowerCase().split(" ")[0]);
        return (
          <li key={stage.stage} className={stage.canRun ? "ready" : "blocked"}>
            <div className="timeline-marker">
              {running ? <PlayCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
            </div>
            <div>
              <span>Step {index + 1}</span>
              <strong>{stage.stage}</strong>
              <p>{stage.message}</p>
            </div>
            <b>{stage.candidateCount}</b>
          </li>
        );
      })}
    </ol>
  );
}

function OperationsSnapshot({
  settings,
  brokerStatuses,
  scannerRuns,
  notifications
}: {
  settings: DataSourceSettings | null;
  brokerStatuses: BrokerStatus[];
  scannerRuns: RunSummary[];
  notifications: NotificationAttempt[];
}) {
  const latestRun = scannerRuns[0];
  const failures = notifications.filter((item) => !item.isSuccess).length;
  const connected = brokerStatuses.filter((item) => item.isConnected).length;

  return (
    <div className="snapshot-grid">
      <InfoCard icon={<Database />} label="Historical cache" value={settings?.historicalCacheEnabled ? `${settings.historicalCacheEntryCount} files` : "Off"} detail={settings ? `${settings.historicalCacheTtlHours}h TTL` : "Loading"} tone={settings?.historicalCacheEnabled ? "good" : "warn"} />
      <InfoCard icon={<ShieldCheck />} label="Broker status" value={`${connected}/${brokerStatuses.length || 3} online`} detail="Final validation is broker-direct" tone={connected > 0 ? "good" : "warn"} />
      <InfoCard icon={<ClipboardList />} label="Latest EOD" value={latestRun ? `${latestRun.acceptedCount ?? 0}/${(latestRun.acceptedCount ?? 0) + (latestRun.rejectedCount ?? 0)}` : "No run"} detail={latestRun ? latestRun.sessionDate : "Run EOD to populate history"} />
      <InfoCard icon={<Bell />} label="Notifications" value={`${failures} failed`} detail={`${notifications.length} recent attempts`} tone={failures > 0 ? "bad" : "good"} />
    </div>
  );
}

function InfoCard({ icon, label, value, detail, tone = "neutral" }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return (
    <article className={`info-card info-${tone}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function ExecutionHistory({
  scannerRuns,
  preMarketRuns,
  openingRuns,
  liveRuns,
  monitorRuns,
  events
}: {
  scannerRuns: RunSummary[];
  preMarketRuns: RunSummary[];
  openingRuns: RunSummary[];
  liveRuns: RunSummary[];
  monitorRuns: RunSummary[];
  events: EventLogEntry[];
}) {
  const rows = [
    ...scannerRuns.map((run) => historyRow("EOD", run, `${run.acceptedCount ?? 0} accepted, ${run.rejectedCount ?? 0} rejected`)),
    ...preMarketRuns.map((run) => historyRow("Pre-market", run, `${run.acceptedCount ?? 0} accepted, ${run.rejectedCount ?? 0} rejected`)),
    ...openingRuns.map((run) => historyRow("Opening", run, `${run.acceptedCount ?? 0} accepted, ${run.rejectedCount ?? 0} rejected`)),
    ...liveRuns.map((run) => historyRow("Live", run, `${run.confirmedCount ?? run.acceptedCount ?? 0} confirmed`)),
    ...monitorRuns.map((run) => historyRow("Monitor", run, `${run.actionableCount ?? 0} alerts, ${run.eventCount ?? 0} events`)),
    ...events.map((event) => ({
      time: event.createdAtUtc,
      stage: event.eventType,
      session: summarizeEventPayload(event.payloadJson),
      result: event.subject
    }))
  ].sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime()).slice(0, 18);

  return (
    <DataTable
      columns={["Time", "Stage", "Session / Details", "Result"]}
      rows={rows.map((row) => [
        new Date(row.time).toLocaleString(),
        row.stage,
        row.session,
        row.result
      ])}
      emptyText="No execution history found yet."
    />
  );
}

function historyRow(stage: string, run: RunSummary, result: string) {
  return {
    time: run.startedAtUtc,
    stage,
    session: run.sessionDate,
    result
  };
}

function ReportInfographics({
  accuracy,
  calibration,
  candidates,
  paperRuns
}: {
  accuracy: BacktestAccuracySummary | null;
  calibration: BacktestCalibrationSummary[];
  candidates: Candidate[];
  paperRuns: PaperTradingRun[];
}) {
  const accepted = candidates.filter((item) => item.outcome.toLowerCase() === "accepted").length;
  const rejected = candidates.length - accepted;
  const latestPaper = paperRuns[0];

  return (
    <div className="report-graphics">
      <RadialStat label="Backtest win rate" value={accuracy?.winRatePercent ?? 0} suffix="%" icon={<TrendingUp />} />
      <StackedStat label="Latest EOD mix" segments={[
        { label: "Accepted", value: accepted, tone: "good" },
        { label: "Rejected", value: rejected, tone: "warn" }
      ]} />
      <StackedStat label="Paper orders" segments={[
        { label: "Open", value: latestPaper?.openCount ?? 0, tone: "good" },
        { label: "Closed", value: latestPaper?.closedCount ?? 0, tone: "neutral" }
      ]} />
      <CalibrationBars rows={calibration} />
      <CandidateBreakdown candidates={candidates} />
    </div>
  );
}

function CandidateBreakdown({ candidates }: { candidates: Candidate[] }) {
  if (candidates.length === 0) {
    return null;
  }

  const outcomeCounts = countBy(candidates, (item) => item.outcome || "Unknown");
  const reasonCounts = new Map<string, number>();
  for (const candidate of candidates) {
    for (const reason of parseReasonCodes(candidate.reasonsJson)) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
  }

  return (
    <article className="breakdown-card">
      <strong>Candidate drill-down</strong>
      <div className="breakdown-columns">
        <BreakdownList title="Outcomes" rows={topCounts(outcomeCounts, 5)} />
        <BreakdownList title="Top reasons" rows={topCounts(reasonCounts, 5)} />
      </div>
    </article>
  );
}

function BreakdownList({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <div>
      <span>{title}</span>
      <ol>
        {rows.length === 0 ? <li>No data</li> : rows.map(([label, count]) => <li key={label}><em>{label}</em><b>{count}</b></li>)}
      </ol>
    </div>
  );
}

function ReportExports({
  candidates,
  preMarketDecisions,
  openingDecisions,
  liveDecisions,
  backtestTrades,
  paperOrders,
  notifications,
  events
}: {
  candidates: Candidate[];
  preMarketDecisions: StageDecision[];
  openingDecisions: StageDecision[];
  liveDecisions: StageDecision[];
  backtestTrades: BacktestTrade[];
  paperOrders: PaperOrder[];
  notifications: NotificationAttempt[];
  events: EventLogEntry[];
}) {
  const stageDecisions = [
    ...preMarketDecisions.map((item) => ({ stage: "Pre-market", ...item })),
    ...openingDecisions.map((item) => ({ stage: "Opening range", ...item })),
    ...liveDecisions.map((item) => ({ stage: "Live validation", ...item }))
  ];

  const exports = [
    {
      label: "EOD candidates",
      fileName: "universal-engine-eod-candidates.csv",
      rows: candidates.map((item) => ({
        exchange: item.exchange,
        symbol: item.symbol,
        direction: item.direction ?? "",
        outcome: item.outcome,
        score: item.score,
        verdict: item.finalVerdict ?? "",
        verdictReason: item.verdictReason ?? "",
        reasons: summarizeReasons(item.reasonsJson)
      }))
    },
    {
      label: "Stage decisions",
      fileName: "universal-engine-stage-decisions.csv",
      rows: stageDecisions.map((item) => ({
        stage: item.stage,
        exchange: item.exchange,
        symbol: item.symbol,
        direction: item.direction ?? "",
        outcome: item.outcome,
        score: item.score,
        entryPrice: item.entryPrice ?? "",
        stopPrice: item.stopPrice ?? "",
        targetPrice: item.targetPrice ?? "",
        quantity: item.quantity ?? "",
        risk: item.riskRejectionReason ?? item.plannedRiskAmount ?? "",
        reasons: summarizeReasons(item.reasonsJson)
      }))
    },
    {
      label: "Backtest trades",
      fileName: "universal-engine-backtest-trades.csv",
      rows: backtestTrades.map((item) => ({
        signalDate: item.signalDate,
        exitDate: item.exitDate ?? "",
        exchange: item.exchange,
        symbol: item.symbol,
        direction: item.direction,
        outcome: item.outcome,
        entryPrice: item.entryPrice,
        exitPrice: item.exitPrice ?? "",
        returnPercent: item.returnPercent ?? "",
        score: item.score
      }))
    },
    {
      label: "Paper orders",
      fileName: "universal-engine-paper-orders.csv",
      rows: paperOrders.map((item) => ({
        sessionDate: item.sessionDate,
        exchange: item.exchange,
        symbol: item.symbol,
        direction: item.direction,
        status: item.status,
        entryPrice: item.entryPrice,
        stopPrice: item.stopPrice,
        targetPrice: item.targetPrice ?? "",
        quantity: item.quantity,
        notionalAmount: item.notionalAmount,
        plannedRiskAmount: item.plannedRiskAmount,
        sourceStage: item.sourceStage,
        sourceReason: item.sourceReason
      }))
    },
    {
      label: "Audit trail",
      fileName: "universal-engine-audit-trail.csv",
      rows: [
        ...notifications.map((item) => ({
          type: "Notification",
          time: item.attemptedAtUtc,
          subject: item.subject,
          status: item.isSuccess ? "Sent" : "Failed",
          detail: item.errorMessage ?? item.channel
        })),
        ...events.map((item) => ({
          type: item.eventType,
          time: item.createdAtUtc,
          subject: item.subject,
          status: "Recorded",
          detail: summarizeEventPayload(item.payloadJson)
        }))
      ].sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
    }
  ];

  return (
    <div className="export-center">
      <div>
        <strong>Exports</strong>
        <span>Download current persisted views as CSV.</span>
      </div>
      <div className="export-buttons">
        {exports.map((item) => (
          <button key={item.fileName} type="button" disabled={item.rows.length === 0} onClick={() => downloadCsv(item.fileName, item.rows)}>
            <Download aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RadialStat({ label, value, suffix, icon }: { label: string; value: number; suffix: string; icon: React.ReactNode }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <article className="radial-stat" style={{ "--value": `${bounded}%` } as React.CSSProperties}>
      <div>{icon}<strong>{formatNumber(value)}{suffix}</strong></div>
      <span>{label}</span>
    </article>
  );
}

function StackedStat({ label, segments }: { label: string; segments: Array<{ label: string; value: number; tone: "good" | "warn" | "neutral" }> }) {
  const total = Math.max(1, segments.reduce((sum, segment) => sum + segment.value, 0));
  return (
    <article className="stacked-stat">
      <strong>{label}</strong>
      <div className="stacked-track">
        {segments.map((segment) => (
          <span key={segment.label} className={`stacked-${segment.tone}`} style={{ width: `${Math.max(4, (segment.value / total) * 100)}%` }} />
        ))}
      </div>
      <ol>
        {segments.map((segment) => <li key={segment.label}>{segment.label}: {segment.value}</li>)}
      </ol>
    </article>
  );
}

function PipelineReadiness({ status }: { status: PipelineStatus | null }) {
  if (!status) {
    return <p className="run-note">Pipeline readiness is loading.</p>;
  }

  return (
    <div className="readiness">
      <div className="readiness-summary">
        <strong>{status.configuredInstrumentCount} configured instruments</strong>
        <span>{status.message}</span>
        {status.duplicateInstrumentKeys.length > 0 && (
          <span className="config-warning">Duplicate config: {status.duplicateInstrumentKeys.slice(0, 6).join(", ")}{status.duplicateInstrumentKeys.length > 6 ? "..." : ""}</span>
        )}
      </div>
      <ol>
        {status.stages.map((stage) => (
          <li key={stage.stage} className={stage.canRun ? "ready" : "blocked"}>
            <span>{stage.stage}</span>
            <strong>{stage.candidateCount}</strong>
            <p>{stage.message}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DataSourceReadiness({ settings }: { settings: DataSourceSettings | null }) {
  if (!settings) {
    return <p className="run-note">Data-source settings are loading.</p>;
  }

  return (
    <div className="readiness">
      <div className="readiness-summary">
        <strong>Analysis {settings.analysisProvider} · Broker {settings.brokerProvider}</strong>
        <span>{settings.message}</span>
      </div>
      <ol>
        <li className={settings.historicalCacheEnabled ? "ready" : "blocked"}>
          <span>Historical daily cache</span>
          <strong>{settings.historicalCacheEnabled ? `${settings.historicalCacheEntryCount}` : "Off"}</strong>
          <p>{settings.historicalCacheEnabled ? `${settings.historicalCacheTtlHours}h TTL; ${settings.historicalCacheEntryCount} cached daily files.` : "Daily analysis will call provider directly."}</p>
        </li>
        <li className="ready">
          <span>Realtime validation</span>
          <strong>Live</strong>
          <p>Opening-range, live validation, monitoring, broker status, and future order-safe flows use broker calls.</p>
        </li>
      </ol>
    </div>
  );
}

function PipelineReadinessChart({ status }: { status: PipelineStatus | null }) {
  if (!status || status.stages.length === 0) {
    return null;
  }

  const maxCount = Math.max(...status.stages.map((stage) => stage.candidateCount), 1);
  return (
    <div className="bar-chart" aria-label="Pipeline readiness chart">
      {status.stages.map((stage) => (
        <div className="bar-row" key={stage.stage}>
          <span>{stage.stage}</span>
          <div className="bar-track">
            <div
              className={stage.canRun ? "bar-fill ready" : "bar-fill blocked"}
              style={{ width: `${Math.max(4, (stage.candidateCount / maxCount) * 100)}%` }}
            />
          </div>
          <strong>{stage.candidateCount}</strong>
        </div>
      ))}
    </div>
  );
}

function CalibrationBars({ rows }: { rows: BacktestCalibrationSummary[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="bar-chart" aria-label="Backtest direction calibration chart">
      {rows.map((row) => (
        <div className="bar-row" key={row.bucket}>
          <span>{row.bucket}</span>
          <div className="bar-track">
            <div className={row.averageReturnPercent >= 0 ? "bar-fill ready" : "bar-fill blocked"} style={{ width: `${Math.min(100, Math.max(4, Math.abs(row.winRatePercent)))}%` }} />
          </div>
          <strong>{formatNumber(row.winRatePercent)}%</strong>
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, rows, emptyText }: { columns: string[]; rows: string[][]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstrumentEditor({
  instruments,
  message,
  onChange,
  onSave
}: {
  instruments: ScannerInstrument[];
  message?: string | null;
  onChange: (instruments: ScannerInstrument[]) => void;
  onSave: () => void;
}) {
  const updateInstrument = (index: number, patch: Partial<ScannerInstrument>) =>
    onChange(instruments.map((instrument, currentIndex) => currentIndex === index ? { ...instrument, ...patch } : instrument));
  const addBlankInstrument = () =>
    onChange([{ symbol: "", exchange: "Nse", isin: "", securityId: "", key: "" }, ...instruments]);
  const addLookupInstrument = (result: LookupResult) => {
    const nextInstrument = lookupResultToInstrument(result);
    const nextKey = nextInstrument.key;
    if (instruments.some((instrument) => instrument.key === nextKey || `${instrument.exchange}:${instrument.symbol}`.toUpperCase() === nextKey)) {
      return;
    }

    onChange([nextInstrument, ...instruments]);
  };

  return (
    <div className="instrument-editor">
      {message && <p className="settings-message">{message}</p>}
      <div className="instrument-quick-add">
        <label>
          Add stock
          <InstrumentLookupInput
            value=""
            exchange="Nse"
            placeholder="Search stock"
            clearAfterSelect
            onValueChange={() => undefined}
            onSelect={addLookupInstrument}
          />
        </label>
        <button type="button" onClick={addBlankInstrument}>Add blank row</button>
      </div>
      <div className="instrument-toolbar">
        <button type="button" onClick={onSave}>Save instruments</button>
      </div>
      <div className="table-scroll">
        <table className="editable-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Exchange</th>
              <th>Security ID</th>
              <th>ISIN</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((instrument, index) => (
              <tr key={`${instrument.exchange}:${instrument.symbol}:${index}`}>
                <td>
                  <InstrumentLookupInput
                    value={instrument.symbol}
                    exchange={instrument.exchange}
                    onValueChange={(value) => updateInstrument(index, { symbol: value.toUpperCase() })}
                    onSelect={(result) => updateInstrument(index, lookupResultToInstrument(result))}
                  />
                </td>
                <td>
                  <select value={instrument.exchange} onChange={(event) => updateInstrument(index, { exchange: event.target.value })}>
                    <option value="Nse">NSE</option>
                    <option value="Bse">BSE</option>
                  </select>
                </td>
                <td><input value={instrument.securityId ?? ""} onChange={(event) => updateInstrument(index, { securityId: event.target.value })} /></td>
                <td><input value={instrument.isin ?? ""} onChange={(event) => updateInstrument(index, { isin: event.target.value.toUpperCase() })} /></td>
                <td><button type="button" className="text-danger" onClick={() => onChange(instruments.filter((_, currentIndex) => currentIndex !== index))}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InstrumentLookupInput({
  value,
  exchange,
  placeholder = "Search stock",
  clearAfterSelect = false,
  onValueChange,
  onSelect
}: {
  value: string;
  exchange: string;
  placeholder?: string;
  clearAfterSelect?: boolean;
  onValueChange: (value: string) => void;
  onSelect: (result: LookupResult) => void;
}) {
  const [query, setQuery] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<LookupResult[]>([]);
  const [isLoading, setLoading] = React.useState(false);
  const [hasUserEdited, setUserEdited] = React.useState(false);

  React.useEffect(() => {
    setQuery(value);
    setUserEdited(false);
  }, [value]);

  React.useEffect(() => {
    const text = query.trim();
    if (!hasUserEdited || text.length < 3) {
      setSuggestions([]);
      return;
    }

    let isCancelled = false;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const results = await getJson<LookupResult[]>(`/instruments/dhan/search?symbol=${encodeURIComponent(text)}&exchange=${normalizeExchangeForLookup(exchange)}`);
        if (!isCancelled) {
          setSuggestions(results.slice(0, 8));
        }
      } catch {
        if (!isCancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, exchange, hasUserEdited]);

  return (
    <div className="instrument-lookup">
      <input
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value.toUpperCase();
          setUserEdited(true);
          setQuery(next);
          onValueChange(next);
        }}
      />
      {(isLoading || suggestions.length > 0) && (
        <div className="lookup-suggestions">
          {isLoading && <span>Searching...</span>}
          {suggestions.map((result) => (
            <button
              key={`${result.exchange}:${result.securityId}:${result.symbol}`}
              type="button"
              onClick={() => {
                setQuery(clearAfterSelect ? "" : result.symbol);
                setUserEdited(false);
                setSuggestions([]);
                onSelect(result);
              }}
            >
              <strong>{result.symbol}</strong>
              <small>{result.exchange} · {result.securityId} · {result.displayName || result.symbolName || "Equity"}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UniverseEditor({
  baskets,
  draft,
  message,
  onChange,
  onSave
}: {
  baskets: ScannerBasket[];
  draft: ScannerUniverseDraft[];
  message?: string | null;
  onChange: (value: ScannerUniverseDraft[]) => void;
  onSave: () => void;
}) {
  const replaceUniverses = (next: ScannerUniverseDraft[]) => onChange(next);
  const updateUniverse = (index: number, patch: Partial<ScannerUniverseDraft>) =>
    replaceUniverses(draft.map((universe, currentIndex) => currentIndex === index ? { ...universe, ...patch } : universe));
  const updateUniverseInstrument = (universeIndex: number, instrumentIndex: number, patch: Partial<ScannerInstrument>) =>
    updateUniverse(universeIndex, {
      directInstruments: draft[universeIndex].directInstruments.map((instrument, currentIndex) =>
        currentIndex === instrumentIndex ? { ...instrument, ...patch } : instrument)
    });
  const addUniverse = () =>
    replaceUniverses([...draft, { name: `Universe ${draft.length + 1}`, enabled: true, basketNames: [], directInstruments: [] }]);
  const addUniverseInstrument = (universeIndex: number, result: LookupResult) =>
    updateUniverse(universeIndex, {
      directInstruments: [...draft[universeIndex].directInstruments, lookupResultToInstrument(result)]
    });
  const addBlankUniverseInstrument = (universeIndex: number) =>
    updateUniverse(universeIndex, {
      directInstruments: [...draft[universeIndex].directInstruments, { symbol: "", exchange: "Nse", isin: "", securityId: "", key: "" }]
    });
  const toggleBasket = (universeIndex: number, basketName: string, checked: boolean) => {
    const current = draft[universeIndex].basketNames;
    updateUniverse(universeIndex, {
      basketNames: checked
        ? [...current.filter((name) => name !== basketName), basketName]
        : current.filter((name) => name !== basketName)
    });
  };

  return (
    <div className="instrument-editor">
      {message && <p className="settings-message">{message}</p>}
      <div className="instrument-toolbar primary-toolbar">
        <button type="button" onClick={addUniverse}>Create universe</button>
        <button type="button" onClick={onSave}>Save universes</button>
      </div>
      {draft.length === 0 && (
        <div className="empty-editor">
          <strong>No universes in draft</strong>
          <span>Create a universe, attach baskets or direct stocks, then save.</span>
          <button type="button" onClick={addUniverse}>Create first universe</button>
        </div>
      )}
      <div className="basket-builder">
        {draft.map((universe, universeIndex) => (
          <article className="basket-card" key={`${universe.name}:${universeIndex}`}>
            <header>
              <input value={universe.name} onChange={(event) => updateUniverse(universeIndex, { name: event.target.value })} />
              <label className="toggle-row">
                <input type="checkbox" checked={universe.enabled} onChange={(event) => updateUniverse(universeIndex, { enabled: event.target.checked })} />
                Enabled
              </label>
              <span className="universe-count">{countUniverseStocks(universe, baskets)} scan stocks</span>
              <button type="button" className="text-danger" onClick={() => replaceUniverses(draft.filter((_, currentIndex) => currentIndex !== universeIndex))}>Remove universe</button>
            </header>
            <div className="universe-summary">
              <strong>{universe.basketNames.length} baskets selected</strong>
              <span>{universe.directInstruments.length} direct extras</span>
              <span>{countUniverseStocks(universe, baskets)} unique stocks will be scanned</span>
            </div>
            <div className="basket-picker">
              {baskets.map((basket) => (
                <label key={basket.name} className="toggle-row">
                  <input
                    type="checkbox"
                    checked={universe.basketNames.includes(basket.name)}
                    onChange={(event) => toggleBasket(universeIndex, basket.name, event.target.checked)}
                  />
                  {basket.name} ({basket.instrumentCount})
                </label>
              ))}
            </div>
            <div className="basket-add-row">
              <InstrumentLookupInput
                value=""
                exchange="Nse"
                placeholder="Optional direct stock"
                clearAfterSelect
                onValueChange={() => undefined}
                onSelect={(result) => addUniverseInstrument(universeIndex, result)}
              />
              <button type="button" onClick={() => addBlankUniverseInstrument(universeIndex)}>Add direct row</button>
            </div>
            <div className="table-scroll">
              <table className="editable-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Exchange</th>
                    <th>Security ID</th>
                    <th>ISIN</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {universe.directInstruments.map((instrument, instrumentIndex) => (
                    <tr key={`${universe.name}:${instrument.exchange}:${instrument.symbol}:${instrumentIndex}`}>
                      <td>
                        <InstrumentLookupInput
                          value={instrument.symbol}
                          exchange={instrument.exchange}
                          onValueChange={(value) => updateUniverseInstrument(universeIndex, instrumentIndex, { symbol: value.toUpperCase() })}
                          onSelect={(result) => updateUniverseInstrument(universeIndex, instrumentIndex, lookupResultToInstrument(result))}
                        />
                      </td>
                      <td>
                        <select value={instrument.exchange} onChange={(event) => updateUniverseInstrument(universeIndex, instrumentIndex, { exchange: event.target.value })}>
                          <option value="Nse">NSE</option>
                          <option value="Bse">BSE</option>
                        </select>
                      </td>
                      <td><input value={instrument.securityId ?? ""} onChange={(event) => updateUniverseInstrument(universeIndex, instrumentIndex, { securityId: event.target.value })} /></td>
                      <td><input value={instrument.isin ?? ""} onChange={(event) => updateUniverseInstrument(universeIndex, instrumentIndex, { isin: event.target.value.toUpperCase() })} /></td>
                      <td><button type="button" className="text-danger" onClick={() => updateUniverse(universeIndex, { directInstruments: universe.directInstruments.filter((_, currentIndex) => currentIndex !== instrumentIndex) })}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function countUniverseStocks(universe: ScannerUniverseDraft, baskets: ScannerBasket[]): number {
  const keys = new Set(universe.directInstruments.map((instrument) => instrument.key || `${instrument.exchange}:${instrument.symbol}`.toUpperCase()));
  for (const basketName of universe.basketNames) {
    const basket = baskets.find((item) => item.name.toLowerCase() === basketName.toLowerCase());
    for (const instrument of basket?.instruments.slice(0, basket.maxSymbols <= 0 ? undefined : basket.maxSymbols) ?? []) {
      keys.add(instrument.key || `${instrument.exchange}:${instrument.symbol}`.toUpperCase());
    }
  }

  return keys.size;
}

function BasketEditor({
  baskets,
  draft,
  message,
  onChange,
  onSeedPredefined,
  onSave
}: {
  baskets: ScannerBasket[];
  draft: ScannerBasketDraft[];
  message?: string | null;
  onChange: (value: ScannerBasketDraft[]) => void;
  onSeedPredefined: () => void;
  onSave: () => void;
}) {
  const [jsonDraft, setJsonDraft] = React.useState("");
  const [jsonError, setJsonError] = React.useState<string | null>(null);
  const replaceBaskets = (next: ScannerBasketDraft[]) => onChange(next);
  const updateBasket = (index: number, patch: Partial<ScannerBasketDraft>) =>
    replaceBaskets(draft.map((basket, currentIndex) => currentIndex === index ? { ...basket, ...patch } : basket));
  const updateBasketInstrument = (basketIndex: number, instrumentIndex: number, patch: Partial<ScannerInstrument>) =>
    updateBasket(basketIndex, {
      instruments: draft[basketIndex].instruments.map((instrument, currentIndex) =>
        currentIndex === instrumentIndex ? { ...instrument, ...patch } : instrument)
    });
  const addBasketInstrument = (basketIndex: number, result: LookupResult) =>
    updateBasket(basketIndex, {
      instruments: [...draft[basketIndex].instruments, lookupResultToInstrument(result)]
    });
  const addBlankBasketInstrument = (basketIndex: number) =>
    updateBasket(basketIndex, {
      instruments: [...draft[basketIndex].instruments, { symbol: "", exchange: "Nse", isin: "", securityId: "", key: "" }]
    });
  const addBasket = () =>
    replaceBaskets([...draft, { name: `Basket ${draft.length + 1}`, enabled: true, maxSymbols: 200, instruments: [] }]);
  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as ScannerBasketDraft[];
      if (!Array.isArray(parsed)) {
        setJsonError("Basket JSON must be an array.");
        return;
      }

      replaceBaskets(parsed.map((basket) => ({
        name: basket.name || "Custom",
        enabled: basket.enabled ?? true,
        maxSymbols: basket.maxSymbols || 200,
        instruments: Array.isArray(basket.instruments) ? basket.instruments : []
      })));
      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid basket JSON.");
    }
  };

  return (
    <div className="instrument-editor">
      {message && <p className="settings-message">{message}</p>}
      <div className="instrument-toolbar primary-toolbar">
        <button type="button" onClick={addBasket}>Create basket</button>
        <button type="button" onClick={onSeedPredefined}>Add predefined baskets</button>
        <button type="button" onClick={() => replaceBaskets([{
          name: "Nifty200",
          enabled: true,
          maxSymbols: 200,
          instruments: [{ symbol: "RELIANCE", exchange: "Nse", isin: "INE002A01018", securityId: "2885", key: "NSE:RELIANCE" }]
        }])}>Use template</button>
        <button type="button" onClick={onSave}>Save baskets</button>
      </div>
      <DataTable
        columns={["Basket", "Enabled", "Max symbols", "Configured"]}
        rows={baskets.map((basket) => [
          basket.name,
          basket.enabled ? "Yes" : "No",
          basket.maxSymbols.toString(),
          basket.instrumentCount.toString()
        ])}
        emptyText="No scanner baskets are saved yet."
      />
      <div className="basket-builder">
        {draft.length === 0 && (
          <div className="empty-editor">
            <strong>No baskets in draft</strong>
            <span>Create a basket, add stocks with lookup, then save.</span>
            <button type="button" onClick={addBasket}>Create first basket</button>
          </div>
        )}
        {draft.map((basket, basketIndex) => (
          <article className="basket-card" key={`${basket.name}:${basketIndex}`}>
            <header>
              <input value={basket.name} onChange={(event) => updateBasket(basketIndex, { name: event.target.value })} />
              <label className="toggle-row">
                <input type="checkbox" checked={basket.enabled} onChange={(event) => updateBasket(basketIndex, { enabled: event.target.checked })} />
                Enabled
              </label>
              <NumberField label="Max symbols" value={basket.maxSymbols} onChange={(value) => updateBasket(basketIndex, { maxSymbols: Math.round(value) })} />
              <button type="button" className="text-danger" onClick={() => replaceBaskets(draft.filter((_, currentIndex) => currentIndex !== basketIndex))}>Remove basket</button>
            </header>
            <div className="basket-add-row">
              <InstrumentLookupInput
                value=""
                exchange="Nse"
                placeholder="Search stock to add"
                clearAfterSelect
                onValueChange={() => undefined}
                onSelect={(result) => addBasketInstrument(basketIndex, result)}
              />
              <button type="button" onClick={() => addBlankBasketInstrument(basketIndex)}>Add blank row</button>
            </div>
            <div className="table-scroll">
              <table className="editable-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Exchange</th>
                    <th>Security ID</th>
                    <th>ISIN</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {basket.instruments.map((instrument, instrumentIndex) => (
                    <tr key={`${basket.name}:${instrument.exchange}:${instrument.symbol}:${instrumentIndex}`}>
                      <td>
                        <InstrumentLookupInput
                          value={instrument.symbol}
                          exchange={instrument.exchange}
                          onValueChange={(value) => updateBasketInstrument(basketIndex, instrumentIndex, { symbol: value.toUpperCase() })}
                          onSelect={(result) => updateBasketInstrument(basketIndex, instrumentIndex, lookupResultToInstrument(result))}
                        />
                      </td>
                      <td>
                        <select value={instrument.exchange} onChange={(event) => updateBasketInstrument(basketIndex, instrumentIndex, { exchange: event.target.value })}>
                          <option value="Nse">NSE</option>
                          <option value="Bse">BSE</option>
                        </select>
                      </td>
                      <td><input value={instrument.securityId ?? ""} onChange={(event) => updateBasketInstrument(basketIndex, instrumentIndex, { securityId: event.target.value })} /></td>
                      <td><input value={instrument.isin ?? ""} onChange={(event) => updateBasketInstrument(basketIndex, instrumentIndex, { isin: event.target.value.toUpperCase() })} /></td>
                      <td><button type="button" className="text-danger" onClick={() => updateBasket(basketIndex, { instruments: basket.instruments.filter((_, currentIndex) => currentIndex !== instrumentIndex) })}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
      <div className="basket-editor">
        <label>
          Import basket JSON
          <textarea
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
            spellCheck={false}
            rows={10}
            placeholder={JSON.stringify(draft, null, 2)}
          />
        </label>
        {jsonError && <p className="settings-message">{jsonError}</p>}
        <div className="instrument-toolbar">
          <button type="button" onClick={() => setJsonDraft(JSON.stringify(draft, null, 2))}>Export current draft</button>
          <button type="button" onClick={importJson}>Import JSON</button>
        </div>
      </div>
    </div>
  );
}

function lookupResultToInstrument(result: LookupResult): ScannerInstrument {
  const exchange = result.exchange.toUpperCase() === "BSE" ? "Bse" : "Nse";
  return {
    symbol: result.symbol,
    exchange,
    isin: result.isin ?? "",
    securityId: result.securityId,
    key: `${exchange}:${result.symbol}`.toUpperCase()
  };
}

function normalizeExchangeForLookup(exchange: string) {
  return exchange.toUpperCase().startsWith("B") ? "BSE" : "NSE";
}

function SettingsAccessDeniedScreen({
  currentEmail,
  currentUserRole,
  onSwitchToAdmin
}: {
  currentEmail: string;
  currentUserRole: string;
  onSwitchToAdmin: () => void;
}) {
  return (
    <div className="access-denied-screen">
      <div className="access-denied-card">
        <div className="denied-icon-wrap">
          <ShieldAlert className="denied-icon" />
        </div>
        <h2>Administrative Access Restricted</h2>
        <p className="denied-subtitle">
          Per platform security policy, only the designated administrative email is authorized to configure broker connections, risk boundaries, and notification channels.
        </p>

        <div className="denied-details">
          <div className="denied-row">
            <span>Authorized Administrator:</span>
            <strong style={{ color: "#7c3aed" }}>indurotech.jp@gmail.com</strong>
          </div>
          <div className="denied-row">
            <span>Your Current Account:</span>
            <span className="current-user-tag">{currentEmail} ({currentUserRole})</span>
          </div>
          <div className="denied-row">
            <span>Clearance Status:</span>
            <span className="badge-denied">Restricted (Settings Locked)</span>
          </div>
        </div>

        <div className="denied-actions">
          <button type="button" className="btn-switch-admin" onClick={onSwitchToAdmin}>
            <ShieldCheck style={{ width: 16, height: 16 }} />
            Switch to indurotech.jp@gmail.com (Super Admin)
          </button>
          <a href="#overview" className="btn-back-overview">
            Return to Dashboard Overview
          </a>
        </div>
      </div>
    </div>
  );
}

function UserManagementPanel({
  currentUser,
  users,
  onSwitchUser,
  onAddUser,
  onUpdateRole,
  onToggleStatus,
  onDeleteUser
}: {
  currentUser: AppUser | null;
  users: AppUser[];
  onSwitchUser: (email: string) => void;
  onAddUser: () => void;
  onUpdateRole: (userId: string, role: AppUser["role"]) => void;
  onToggleStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}) {
  const [filterRole, setFilterRole] = React.useState<string>("all");
  const [filterProvider, setFilterProvider] = React.useState<string>("all");

  const filteredUsers = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterProvider !== "all" && u.provider !== filterProvider) return false;
    return true;
  });

  const superAdminCount = users.filter((u) => u.role === "Super Admin").length;
  const traderCount = users.filter((u) => u.role === "Trader").length;
  const activeCount = users.filter((u) => u.status === "Active").length;

  return (
    <div className="users-management-view">
      <div className="users-metrics-bar">
        <div className="user-metric-card">
          <span className="user-metric-num">{users.length}</span>
          <span className="user-metric-label">Total Users</span>
        </div>
        <div className="user-metric-card">
          <span className="user-metric-num text-emerald">{activeCount}</span>
          <span className="user-metric-label">Active Users</span>
        </div>
        <div className="user-metric-card">
          <span className="user-metric-num text-purple">{superAdminCount}</span>
          <span className="user-metric-label">Super Admins</span>
        </div>
        <div className="user-metric-card">
          <span className="user-metric-num text-blue">{traderCount}</span>
          <span className="user-metric-label">Active Traders</span>
        </div>
      </div>

      <div className="security-policy-callout">
        <ShieldCheck style={{ width: 20, height: 20, flexShrink: 0 }} />
        <div>
          <strong>Security Policy Active: Settings Exclusively for indurotech.jp@gmail.com</strong>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>
            The Settings and Broker Configuration panel is strictly restricted to <code>indurotech.jp@gmail.com</code>.
            Traders, Operators, and Viewers can inspect scanners, paper orders, and notifications, while settings modification remains protected.
          </p>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <div className="users-toolbar">
          <div className="users-filters">
            <label>
              Role:
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Trader">Trader</option>
                <option value="Operator">Operator</option>
                <option value="Viewer">Viewer</option>
              </select>
            </label>
            <label>
              Provider:
              <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}>
                <option value="all">All Providers</option>
                <option value="google">Google / Gmail</option>
                <option value="microsoft">Microsoft</option>
                <option value="meta">Meta</option>
                <option value="email">Email</option>
              </select>
            </label>
          </div>
          <button type="button" className="btn-add-user" onClick={onAddUser}>
            <UserPlus style={{ width: 14, height: 14 }} /> Add / Invite User
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Provider</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isSuperAdminEmail = user.email.toLowerCase() === "indurotech.jp@gmail.com";
                const isCurrent = currentUser?.email.toLowerCase() === user.email.toLowerCase();

                return (
                  <tr key={user.id} className={isCurrent ? "current-user-row" : ""}>
                    <td className="user-identity-cell">
                      <img src={user.avatarUrl} alt={user.name} className="user-table-avatar" />
                      <div>
                        <strong>{user.name}</strong>
                        {isCurrent && <span className="current-badge">Active Session</span>}
                      </div>
                    </td>
                    <td><code>{user.email}</code></td>
                    <td>
                      <span className={`provider-badge provider-${user.provider}`}>
                        {user.provider === "google" && "Gmail / Google"}
                        {user.provider === "microsoft" && "Microsoft"}
                        {user.provider === "meta" && "Meta"}
                        {user.provider === "email" && "Email / Pass"}
                      </span>
                    </td>
                    <td>
                      <span className={`role-badge role-${user.role.toLowerCase().replace(" ", "-")}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.lastLoginAtUtc).toLocaleDateString()} {new Date(user.lastLoginAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <div className="user-row-actions">
                        {!isCurrent && (
                          <button
                            type="button"
                            className="btn-action-small"
                            onClick={() => onSwitchUser(user.email)}
                            title="Switch session to this user to test permissions"
                          >
                            Switch To
                          </button>
                        )}
                        {!isSuperAdminEmail && (
                          <>
                            <select
                              value={user.role}
                              className="role-select-inline"
                              onChange={(e) => onUpdateRole(user.id, e.target.value as any)}
                            >
                              <option value="Trader">Trader</option>
                              <option value="Operator">Operator</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                            <button
                              type="button"
                              className="btn-action-toggle"
                              onClick={() => onToggleStatus(user.id)}
                            >
                              {user.status === "Active" ? "Suspend" : "Activate"}
                            </button>
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => onDeleteUser(user.id)}
                              title="Delete user"
                            >
                              &times;
                            </button>
                          </>
                        )}
                        {isSuperAdminEmail && (
                          <span className="protected-admin-pill">Settings Clearance</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UserTopbarProfile({
  currentUser,
  onOpenLogin,
  onSwitchUser,
  onLogout
}: {
  currentUser: AppUser | null;
  onOpenLogin: () => void;
  onSwitchUser: (email: string) => void;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) {
    return (
      <button type="button" className="btn-topbar-signin" onClick={onOpenLogin}>
        <LogIn style={{ width: 14, height: 14 }} />
        Sign In
      </button>
    );
  }

  const isSuperAdmin = currentUser.email.toLowerCase() === "indurotech.jp@gmail.com";

  return (
    <div className="topbar-user-menu-wrap" ref={ref}>
      <button
        type="button"
        className={`topbar-user-btn ${isSuperAdmin ? "admin-border" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <img src={currentUser.avatarUrl} alt={currentUser.name} className="topbar-avatar" />
        <div className="topbar-user-copy">
          <span className="topbar-name">{currentUser.name}</span>
          <span className={`topbar-role-pill ${isSuperAdmin ? "role-admin" : "role-trader"}`}>
            {isSuperAdmin ? "Super Admin" : currentUser.role}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="topbar-user-dropdown">
          <div className="dropdown-header">
            <strong>{currentUser.name}</strong>
            <span className="dropdown-email">{currentUser.email}</span>
            <span className="dropdown-provider">Signed in via {currentUser.provider.toUpperCase()}</span>
          </div>

          <div className="dropdown-section">
            <span className="dropdown-section-title">Quick RBAC Testing:</span>
            {!isSuperAdmin ? (
              <button
                type="button"
                className="dropdown-item highlight"
                onClick={() => {
                  onSwitchUser("indurotech.jp@gmail.com");
                  setIsOpen(false);
                }}
              >
                <ShieldCheck style={{ width: 14, height: 14, color: "#10b981" }} />
                <span>Switch to <strong>indurotech.jp@gmail.com</strong> (Admin)</span>
              </button>
            ) : (
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  onSwitchUser("tejas.p.singh@gmail.com");
                  setIsOpen(false);
                }}
              >
                <Users style={{ width: 14, height: 14, color: "#3b82f6" }} />
                <span>Switch to <strong>tejas.p.singh@gmail.com</strong> (Trader)</span>
              </button>
            )}
          </div>

          <div className="dropdown-footer">
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                setIsOpen(false);
                onOpenLogin();
              }}
            >
              <LogIn style={{ width: 14, height: 14 }} />
              <span>OAuth Sign In / Switch Account</span>
            </button>
            <button
              type="button"
              className="dropdown-item danger"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OAuthLoginModal({
  isOpen,
  onClose,
  onOAuthLogin
}: {
  isOpen: boolean;
  onClose: () => void;
  onOAuthLogin: (provider: "google" | "microsoft" | "meta" | "email", email: string, name?: string) => void;
}) {
  const [customEmail, setCustomEmail] = React.useState("");
  const [customName, setCustomName] = React.useState("");
  const [selectedProvider, setSelectedProvider] = React.useState<"google" | "microsoft" | "meta" | "email">("google");

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Sign in to UniversalEngine</h3>
            <p className="modal-subtitle">Connect with Google, Microsoft, Meta, or email.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="oauth-buttons-list">
          <button
            type="button"
            className="oauth-btn"
            style={{ background: "#faf5ff", borderColor: "#c084fc" }}
            onClick={() => onOAuthLogin("google", "indurotech.jp@gmail.com", "InduroTech Admin")}
          >
            <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <div>
              <strong style={{ display: "block" }}>Sign in with Google / Gmail (Admin)</strong>
              <small style={{ color: "#7c3aed" }}>indurotech.jp@gmail.com (Super Admin Settings Clearance)</small>
            </div>
          </button>

          <button
            type="button"
            className="oauth-btn"
            onClick={() => onOAuthLogin("google", "tejas.p.singh@gmail.com", "Tejas Singh")}
          >
            <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <div>
              <strong style={{ display: "block" }}>Sign in with Google / Gmail (Trader)</strong>
              <small style={{ color: "#64748b" }}>tejas.p.singh@gmail.com (Trader Account)</small>
            </div>
          </button>

          <button
            type="button"
            className="oauth-btn"
            onClick={() => onOAuthLogin("microsoft", "alex.vance@microsoft.corp", "Alex Vance")}
          >
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            <div>
              <strong style={{ display: "block" }}>Sign in with Microsoft Account</strong>
              <small style={{ color: "#64748b" }}>alex.vance@microsoft.corp (Trader)</small>
            </div>
          </button>

          <button
            type="button"
            className="oauth-btn"
            onClick={() => onOAuthLogin("meta", "devon.desk@meta.internal", "Devon Miller")}
          >
            <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="#0081FB">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <div>
              <strong style={{ display: "block" }}>Sign in with Meta (Facebook)</strong>
              <small style={{ color: "#64748b" }}>devon.desk@meta.internal (Operator)</small>
            </div>
          </button>
        </div>

        <div className="auth-separator">
          <span>or custom identity sign in</span>
        </div>

        <form
          className="custom-auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (customEmail) {
              onOAuthLogin(selectedProvider, customEmail, customName || undefined);
            }
          }}
        >
          <label>
            Provider
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
            >
              <option value="google">Google / Gmail</option>
              <option value="microsoft">Microsoft</option>
              <option value="meta">Meta</option>
              <option value="email">Standard Email / Password</option>
            </select>
          </label>
          <label>
            Full Name (optional)
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </label>
          <label>
            Email Address
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-auth-submit">
            Authorize & Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

function AddUserModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: { name: string; email: string; provider: AppUser["provider"]; role: AppUser["role"] }) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [provider, setProvider] = React.useState<AppUser["provider"]>("google");
  const [role, setRole] = React.useState<AppUser["role"]>("Trader");

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content add-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Add New Platform User</h3>
            <p className="modal-subtitle">Provision user credentials and role-based permissions.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form
          className="add-user-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (email) {
              onSubmit({ name, email, provider, role });
            }
          }}
        >
          <label>
            Full Name
            <input
              type="text"
              required
              placeholder="e.g. Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Email Address
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Authentication Provider
            <select value={provider} onChange={(e) => setProvider(e.target.value as any)}>
              <option value="google">Google / Gmail</option>
              <option value="microsoft">Microsoft</option>
              <option value="meta">Meta</option>
              <option value="email">Email / Password</option>
            </select>
          </label>
          <label>
            Assigned Role
            <select value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="Trader">Trader (Full market scanner & paper trading)</option>
              <option value="Operator">Operator (Monitor runs & event logs)</option>
              <option value="Viewer">Viewer (Read-only dashboard view)</option>
            </select>
          </label>

          <p className="note-text">
            * Note: Super Admin status is strictly reserved for <code>indurotech.jp@gmail.com</code> per platform security rules.
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Create User</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SentEmailsModal({
  isOpen,
  onClose,
  sentEmails
}: {
  isOpen: boolean;
  onClose: () => void;
  sentEmails: SentEmail[];
}) {
  const [selectedEmail, setSelectedEmail] = React.useState<SentEmail | null>(sentEmails[0] ?? null);

  React.useEffect(() => {
    if (sentEmails.length > 0 && !selectedEmail) {
      setSelectedEmail(sentEmails[0]);
    }
  }, [sentEmails, selectedEmail]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content emails-outbox-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Sent Email Notifications Outbox</h3>
            <p className="modal-subtitle">Inspecting all outgoing SMTP delivery attempts and rendered HTML trade alerts.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="outbox-layout">
          <div className="outbox-list">
            {sentEmails.length === 0 ? (
              <p className="empty-state" style={{ padding: 16 }}>No email alerts sent yet. Use "Test Email" in Settings or run a scan.</p>
            ) : (
              sentEmails.map((item) => (
                <div
                  key={item.id}
                  className={`outbox-item ${selectedEmail?.id === item.id ? "selected" : ""}`}
                  onClick={() => setSelectedEmail(item)}
                >
                  <div className="outbox-item-top">
                    <span className={`outbox-status-pill ${item.isSuccess ? "status-sent" : "status-failed"}`}>
                      {item.isSuccess ? "Sent" : "Failed"}
                    </span>
                    <span className="outbox-time">{new Date(item.attemptedAtUtc).toLocaleTimeString()}</span>
                  </div>
                  <strong className="outbox-subject">{item.subject}</strong>
                  <span className="outbox-to">To: {item.to}</span>
                  {item.errorMessage && <span className="outbox-err">{item.errorMessage}</span>}
                </div>
              ))
            )}
          </div>

          <div className="outbox-preview">
            {selectedEmail ? (
              <div className="email-preview-container">
                <div className="email-meta-header">
                  <div><strong>Subject:</strong> {selectedEmail.subject}</div>
                  <div><strong>From:</strong> {selectedEmail.from}</div>
                  <div><strong>To:</strong> {selectedEmail.to}</div>
                  <div><strong>Status:</strong> {selectedEmail.isSuccess ? "✅ Delivered" : `⚠️ Failed (${selectedEmail.errorMessage})`}</div>
                </div>
                <div className="email-rendered-body" dangerouslySetInnerHTML={{ __html: selectedEmail.htmlMessage }} />
              </div>
            ) : (
              <div className="outbox-preview-placeholder">
                <Mail style={{ width: 40, height: 40 }} />
                <p>Select an email alert from the left to inspect the rendered HTML content.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsEditor({
  settings,
  message,
  onChange,
  onSave,
  onTestNotification,
  testingNotificationChannel,
  sentEmailsCount = 0,
  onOpenSentEmails
}: {
  settings: ApplicationSettings | null;
  message?: string | null;
  onChange: (settings: ApplicationSettings) => void;
  onSave: () => void;
  onTestNotification?: (channel: string) => void;
  testingNotificationChannel?: string | null;
  sentEmailsCount?: number;
  onOpenSentEmails?: () => void;
}) {
  const [activeSettingsGroup, setActiveSettingsGroup] = React.useState<SettingsGroup>("broker");

  if (!settings) {
    return <p className="empty-state">Application settings are loading.</p>;
  }

  const updateRisk = (patch: Partial<ApplicationSettings["risk"]>) =>
    onChange({ ...settings, risk: { ...settings.risk, ...patch } });
  const updateEod = (patch: Partial<ApplicationSettings["eodScanner"]>) =>
    onChange({ ...settings, eodScanner: { ...settings.eodScanner, ...patch } });
  const updateAnalysis = (patch: Partial<ApplicationSettings["analysis"]>) =>
    onChange({ ...settings, analysis: { ...settings.analysis, ...patch } });
  const updateBroker = (patch: Partial<ApplicationSettings["broker"]>) =>
    onChange({ ...settings, broker: { ...settings.broker, ...patch } });
  const updateDhan = (patch: Partial<ApplicationSettings["broker"]["dhan"]>) =>
    onChange({ ...settings, broker: { ...settings.broker, dhan: { ...settings.broker.dhan, ...patch } } });
  const updateEodWeight = (key: string, value: number) =>
    updateEod({ factorWeights: { ...settings.eodScanner.factorWeights, [key]: value } });
  const updateStage = <T extends keyof ApplicationSettings["stages"]>(stage: T, patch: Partial<ApplicationSettings["stages"][T]>) =>
    onChange({ ...settings, stages: { ...settings.stages, [stage]: { ...settings.stages[stage], ...patch } } });
  const updateBacktest = (patch: Partial<ApplicationSettings["backtest"]>) =>
    onChange({ ...settings, backtest: { ...settings.backtest, ...patch } });
  const updateAi = (patch: Partial<ApplicationSettings["ai"]>) =>
    onChange({ ...settings, ai: { ...settings.ai, ...patch } });
  const updateNotifications = (patch: Partial<ApplicationSettings["notifications"]>) =>
    onChange({ ...settings, notifications: { ...settings.notifications, ...patch } });
  const updateTelegram = (patch: Partial<ApplicationSettings["notifications"]["telegram"]>) =>
    onChange({ ...settings, notifications: { ...settings.notifications, telegram: { ...settings.notifications.telegram, ...patch } } });
  const updateEmail = (patch: Partial<ApplicationSettings["notifications"]["email"]>) =>
    onChange({ ...settings, notifications: { ...settings.notifications, email: { ...settings.notifications.email, ...patch } } });
  const settingsGroups: Array<{ key: SettingsGroup; label: string }> = [
    { key: "broker", label: "Broker" },
    { key: "risk", label: "Risk" },
    { key: "scanner", label: "Scanner" },
    { key: "data", label: "Data" },
    { key: "pipeline", label: "Pipeline" },
    { key: "analytics", label: "Analytics" },
    { key: "notifications", label: "Notifications" }
  ];

  return (
    <div className="settings-editor">
      <div className="settings-command">
        <div>
          <strong>Add or update application settings</strong>
          <span>Choose a settings group, edit values, then save. Secret fields are replacement-only and stay masked after save.</span>
        </div>
        <button type="button" onClick={onSave}>Save settings</button>
      </div>
      <div className="settings-tabs" role="tablist" aria-label="Settings groups">
        {settingsGroups.map((group) => (
          <button
            key={group.key}
            type="button"
            role="tab"
            aria-selected={activeSettingsGroup === group.key}
            className={activeSettingsGroup === group.key ? "active" : undefined}
            onClick={() => setActiveSettingsGroup(group.key)}
          >
            {group.label}
          </button>
        ))}
      </div>
      {message && <p className="settings-message">{message}</p>}
      <div className="settings-grid">
        <fieldset hidden={activeSettingsGroup !== "risk"}>
          <legend>Risk and capital</legend>
          <NumberField label="Capital amount" value={settings.risk.capitalAmount} onChange={(value) => updateRisk({ capitalAmount: value })} />
          <NumberField label="Minimum planned risk" value={settings.risk.minPlannedRiskAmount} onChange={(value) => updateRisk({ minPlannedRiskAmount: value })} />
          <NumberField label="Maximum planned risk" value={settings.risk.maxPlannedRiskAmount} onChange={(value) => updateRisk({ maxPlannedRiskAmount: value })} />
          <NumberField label="Max active signals" value={settings.risk.maxActiveSignals} onChange={(value) => updateRisk({ maxActiveSignals: Math.round(value) })} />
          <label className="toggle-row">
            <input type="checkbox" checked={settings.risk.allowSmallRiskAlerts} onChange={(event) => updateRisk({ allowSmallRiskAlerts: event.target.checked })} />
            Allow small-risk alerts
          </label>
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "scanner"}>
          <legend>EOD scanner</legend>
          <NumberField label="Lookback days" value={settings.eodScanner.lookbackDays} onChange={(value) => updateEod({ lookbackDays: Math.round(value) })} />
          <NumberField label="Minimum average traded value" value={settings.eodScanner.minimumAverageTradedValue} onChange={(value) => updateEod({ minimumAverageTradedValue: value })} />
          <NumberField label="Minimum volume expansion" value={settings.eodScanner.minimumVolumeExpansionRatio} step={0.1} onChange={(value) => updateEod({ minimumVolumeExpansionRatio: value })} />
          <NumberField label="Near-high close threshold" value={settings.eodScanner.nearHighCloseThreshold} step={0.05} onChange={(value) => updateEod({ nearHighCloseThreshold: value })} />
          <NumberField label="Near-low close threshold" value={settings.eodScanner.nearLowCloseThreshold} step={0.05} onChange={(value) => updateEod({ nearLowCloseThreshold: value })} />
          <NumberField label="Max daily data age hours" value={settings.eodScanner.maxDailyDataAgeHours} onChange={(value) => updateEod({ maxDailyDataAgeHours: Math.round(value) })} />
          <NumberField label="Minimum accepted score" value={settings.eodScanner.minimumAcceptedScore} onChange={(value) => updateEod({ minimumAcceptedScore: value })} />
          <NumberField label="Max accepted candidates" value={settings.eodScanner.maxAcceptedCandidates} onChange={(value) => updateEod({ maxAcceptedCandidates: Math.round(value) })} />
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "scanner"}>
          <legend>Scanner weights</legend>
          {Object.entries(settings.eodScanner.factorWeights ?? {}).map(([key, value]) => (
            <NumberField key={key} label={key} value={value} step={0.1} onChange={(next) => updateEodWeight(key, next)} />
          ))}
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "data"}>
          <legend>Analysis data</legend>
          <label>
            Provider
            <select value={settings.analysis.primaryProvider} onChange={(event) => updateAnalysis({ primaryProvider: event.target.value })}>
              <option value="Dhan">Dhan</option>
              <option value="Csv">CSV</option>
            </select>
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={settings.analysis.useHistoricalCache} onChange={(event) => updateAnalysis({ useHistoricalCache: event.target.checked })} />
            Use historical daily cache
          </label>
          <NumberField label="Cache TTL hours" value={settings.analysis.historicalCacheTtlHours} onChange={(value) => updateAnalysis({ historicalCacheTtlHours: Math.round(value) })} />
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "broker"}>
          <legend>Broker and Dhan</legend>
          <label>
            Broker provider
            <select value={settings.broker.primaryProvider} onChange={(event) => updateBroker({ primaryProvider: event.target.value })}>
              <option value="Dhan">Dhan</option>
              <option value="Zerodha">Zerodha</option>
              <option value="Groww">Groww</option>
              <option value="Csv">CSV</option>
            </select>
          </label>
          <label>
            Dhan base URL
            <input type="text" value={settings.broker.dhan.baseUrl} onChange={(event) => updateDhan({ baseUrl: event.target.value })} />
          </label>
          <label>
            Dhan client ID
            <input type="text" value={settings.broker.dhan.clientId} onChange={(event) => updateDhan({ clientId: event.target.value })} />
          </label>
          <label>
            Replace access token
            <input
              type="password"
              value={settings.broker.dhan.accessToken ?? ""}
              placeholder={settings.broker.dhan.accessTokenMasked}
              onChange={(event) => updateDhan({ accessToken: event.target.value })}
            />
          </label>
          <label>
            Dhan instrument type
            <input type="text" value={settings.broker.dhan.instrumentType} onChange={(event) => updateDhan({ instrumentType: event.target.value })} />
          </label>
          <label className="toggle-row">
            <input type="checkbox" checked={settings.broker.dhan.includeOpenInterest} onChange={(event) => updateDhan({ includeOpenInterest: event.target.checked })} />
            Include open interest
          </label>
          <NumberField label="Retry count" value={settings.broker.dhan.retryCount} onChange={(value) => updateDhan({ retryCount: Math.round(value) })} />
          <NumberField label="Retry base delay ms" value={settings.broker.dhan.retryBaseDelayMs} onChange={(value) => updateDhan({ retryBaseDelayMs: Math.round(value) })} />
          <NumberField label="Throttle delay ms" value={settings.broker.dhan.requestThrottleDelayMs} onChange={(value) => updateDhan({ requestThrottleDelayMs: Math.round(value) })} />
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "pipeline"}>
          <legend>Pre-market</legend>
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.preMarket.enabled} onChange={(event) => updateStage("preMarket", { enabled: event.target.checked })} />Enabled</label>
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.preMarket.enableScheduledScan} onChange={(event) => updateStage("preMarket", { enableScheduledScan: event.target.checked })} />Scheduled scan</label>
          <label>Run time<input type="time" value={settings.stages.preMarket.runTimeLocal} onChange={(event) => updateStage("preMarket", { runTimeLocal: event.target.value })} /></label>
          <NumberField label="Max gap %" value={settings.stages.preMarket.maxAllowedGapPercent} step={0.1} onChange={(value) => updateStage("preMarket", { maxAllowedGapPercent: value })} />
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.preMarket.allowWhenPreMarketDataUnavailable} onChange={(event) => updateStage("preMarket", { allowWhenPreMarketDataUnavailable: event.target.checked })} />Allow if data unavailable</label>
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "pipeline"}>
          <legend>Opening range</legend>
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.openingRange.enabled} onChange={(event) => updateStage("openingRange", { enabled: event.target.checked })} />Enabled</label>
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.openingRange.enableScheduledScan} onChange={(event) => updateStage("openingRange", { enableScheduledScan: event.target.checked })} />Scheduled scan</label>
          <IntervalField value={settings.stages.openingRange.interval} onChange={(value) => updateStage("openingRange", { interval: value })} />
          <label>Market open<input type="time" value={settings.stages.openingRange.marketOpenTime} onChange={(event) => updateStage("openingRange", { marketOpenTime: event.target.value })} /></label>
          <NumberField label="Range minutes" value={settings.stages.openingRange.rangeMinutes} onChange={(value) => updateStage("openingRange", { rangeMinutes: Math.round(value) })} />
          <NumberField label="Breakout buffer ticks" value={settings.stages.openingRange.breakoutBufferTicks} onChange={(value) => updateStage("openingRange", { breakoutBufferTicks: Math.round(value) })} />
          <NumberField label="Target R:R" value={settings.stages.openingRange.targetRiskRewardRatio} step={0.1} onChange={(value) => updateStage("openingRange", { targetRiskRewardRatio: value })} />
          <NumberField label="Max data age minutes" value={settings.stages.openingRange.maxIntradayDataAgeMinutes} onChange={(value) => updateStage("openingRange", { maxIntradayDataAgeMinutes: Math.round(value) })} />
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "pipeline"}>
          <legend>Live validation</legend>
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.liveValidation.enabled} onChange={(event) => updateStage("liveValidation", { enabled: event.target.checked })} />Enabled</label>
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.liveValidation.enableScheduledScan} onChange={(event) => updateStage("liveValidation", { enableScheduledScan: event.target.checked })} />Scheduled scan</label>
          <IntervalField value={settings.stages.liveValidation.interval} onChange={(value) => updateStage("liveValidation", { interval: value })} />
          <label>Start<input type="time" value={settings.stages.liveValidation.startTime} onChange={(event) => updateStage("liveValidation", { startTime: event.target.value })} /></label>
          <label>End<input type="time" value={settings.stages.liveValidation.endTime} onChange={(event) => updateStage("liveValidation", { endTime: event.target.value })} /></label>
          <NumberField label="Poll minutes" value={settings.stages.liveValidation.pollMinutes} onChange={(value) => updateStage("liveValidation", { pollMinutes: Math.round(value) })} />
          <NumberField label="Confirmation ticks" value={settings.stages.liveValidation.confirmationBufferTicks} onChange={(value) => updateStage("liveValidation", { confirmationBufferTicks: Math.round(value) })} />
          <NumberField label="Max data age minutes" value={settings.stages.liveValidation.maxIntradayDataAgeMinutes} onChange={(value) => updateStage("liveValidation", { maxIntradayDataAgeMinutes: Math.round(value) })} />
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "pipeline"}>
          <legend>Monitoring</legend>
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.monitoring.enabled} onChange={(event) => updateStage("monitoring", { enabled: event.target.checked })} />Enabled</label>
          <label className="toggle-row"><input type="checkbox" checked={settings.stages.monitoring.enableScheduledScan} onChange={(event) => updateStage("monitoring", { enableScheduledScan: event.target.checked })} />Scheduled scan</label>
          <IntervalField value={settings.stages.monitoring.interval} onChange={(value) => updateStage("monitoring", { interval: value })} />
          <label>Start<input type="time" value={settings.stages.monitoring.startTime} onChange={(event) => updateStage("monitoring", { startTime: event.target.value })} /></label>
          <label>End<input type="time" value={settings.stages.monitoring.endTime} onChange={(event) => updateStage("monitoring", { endTime: event.target.value })} /></label>
          <NumberField label="Poll minutes" value={settings.stages.monitoring.pollMinutes} onChange={(value) => updateStage("monitoring", { pollMinutes: Math.round(value) })} />
          <NumberField label="Max data age minutes" value={settings.stages.monitoring.maxIntradayDataAgeMinutes} onChange={(value) => updateStage("monitoring", { maxIntradayDataAgeMinutes: Math.round(value) })} />
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "analytics"}>
          <legend>Backtest</legend>
          <label>Default from<input type="date" value={settings.backtest.fromDate} onChange={(event) => updateBacktest({ fromDate: event.target.value })} /></label>
          <label>Default to<input type="date" value={settings.backtest.toDate} onChange={(event) => updateBacktest({ toDate: event.target.value })} /></label>
          <NumberField label="Max holding days" value={settings.backtest.maxHoldingDays} onChange={(value) => updateBacktest({ maxHoldingDays: Math.round(value) })} />
          <NumberField label="Target R:R" value={settings.backtest.targetRiskRewardRatio} step={0.1} onChange={(value) => updateBacktest({ targetRiskRewardRatio: value })} />
          <label className="toggle-row"><input type="checkbox" checked={settings.backtest.useStopTargetSimulation} onChange={(event) => updateBacktest({ useStopTargetSimulation: event.target.checked })} />Use stop/target simulation</label>
          <label className="toggle-row"><input type="checkbox" checked={settings.backtest.assumeStopBeforeTargetWhenBothTouched} onChange={(event) => updateBacktest({ assumeStopBeforeTargetWhenBothTouched: event.target.checked })} />Stop before target if both touched</label>
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "analytics"}>
          <legend>AI analysis</legend>
          <label className="toggle-row"><input type="checkbox" checked={settings.ai.enabled} onChange={(event) => updateAi({ enabled: event.target.checked })} />Enabled</label>
          <label>Provider<input type="text" value={settings.ai.provider} onChange={(event) => updateAi({ provider: event.target.value })} /></label>
          <label>Prompt version<input type="text" value={settings.ai.promptVersion} onChange={(event) => updateAi({ promptVersion: event.target.value })} /></label>
          <NumberField label="Minimum trade probability" value={settings.ai.minimumTradeProbability} onChange={(value) => updateAi({ minimumTradeProbability: value })} />
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "notifications"}>
          <legend>Notifications</legend>
          <label>
            Channel
            <select value={settings.notifications.channel} onChange={(event) => updateNotifications({ channel: event.target.value })}>
              <option value="Console">Console</option>
              <option value="Telegram">Telegram</option>
              <option value="Email">Email</option>
              <option value="Both">Both (Telegram & Email)</option>
            </select>
          </label>
          <label className="toggle-row"><input type="checkbox" checked={settings.notifications.sendEodWatchlistNotifications} onChange={(event) => updateNotifications({ sendEodWatchlistNotifications: event.target.checked })} />Send EOD watchlist</label>
          <NumberField label="Minimum EOD score to notify" value={settings.notifications.minimumEodScoreToNotify} onChange={(value) => updateNotifications({ minimumEodScoreToNotify: value })} />
          <label>Telegram chat ID<input type="text" value={settings.notifications.telegram.chatId} onChange={(event) => updateTelegram({ chatId: event.target.value })} /></label>
          <label>Replace Telegram token<input type="password" value={settings.notifications.telegram.botToken ?? ""} placeholder={settings.notifications.telegram.botTokenMasked} onChange={(event) => updateTelegram({ botToken: event.target.value })} /></label>
          <div className="field-action-row">
            <button
              type="button"
              className="test-btn"
              disabled={testingNotificationChannel !== null}
              onClick={() => onTestNotification?.("Telegram")}
            >
              <Send style={{ width: 14, height: 14 }} />
              {testingNotificationChannel === "Telegram" ? "Sending Test..." : "Send Test Telegram"}
            </button>
          </div>
        </fieldset>

        <fieldset hidden={activeSettingsGroup !== "notifications"}>
          <legend>Email Notifications</legend>

          <div className="security-policy-callout" style={{ background: "#f8fafc", borderColor: "#cbd5e1", color: "#334155", marginBottom: 14 }}>
            <div>
              <strong>⚙️ Settings & Environment Priority:</strong>
              <p style={{ margin: "3px 0 0", fontSize: 12 }}>
                Setting environment variables is <strong>optional</strong>. Settings configured and saved here in the dashboard take active precedence over environment defaults. You can also select <em>In-App Virtual Inbox</em> to instantly preview and archive HTML alerts without any external SMTP server.
              </p>
            </div>
          </div>

          <label>
            Email Delivery Mode
            <select
              value={settings.notifications.email.deliveryMode ?? "both"}
              onChange={(e) => updateEmail({ deliveryMode: e.target.value as any })}
            >
              <option value="both">Both (Live SMTP Relay &amp; In-App Virtual Inbox Archive)</option>
              <option value="inbox">In-App Virtual Inbox Only (Instant preview, zero setup needed)</option>
              <option value="smtp">External SMTP Server Relay Only</option>
            </select>
          </label>

          <div className="smtp-presets">
            <span className="preset-label">Quick Presets:</span>
            <button
              type="button"
              className="preset-btn"
              onClick={() =>
                updateEmail({
                  deliveryMode: "inbox",
                  to: "indurotech.jp@gmail.com"
                })
              }
            >
              Inbox (Safe Sandbox)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() =>
                updateEmail({
                  deliveryMode: "both",
                  smtpHost: "smtp.gmail.com",
                  smtpPort: 587,
                  useSsl: false,
                  to: "indurotech.jp@gmail.com"
                })
              }
            >
              Gmail (587 STARTTLS)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() =>
                updateEmail({
                  deliveryMode: "both",
                  smtpHost: "smtp.gmail.com",
                  smtpPort: 465,
                  useSsl: true,
                  to: "indurotech.jp@gmail.com"
                })
              }
            >
              Gmail SSL (465)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() =>
                updateEmail({
                  deliveryMode: "both",
                  smtpHost: "smtp.office365.com",
                  smtpPort: 587,
                  useSsl: false,
                  to: "indurotech.jp@gmail.com"
                })
              }
            >
              Outlook 365
            </button>
          </div>

          <label>SMTP host<input type="text" value={settings.notifications.email.smtpHost} onChange={(event) => updateEmail({ smtpHost: event.target.value })} /></label>
          <NumberField label="SMTP port" value={settings.notifications.email.smtpPort} onChange={(value) => updateEmail({ smtpPort: Math.round(value) })} />
          <label className="toggle-row"><input type="checkbox" checked={settings.notifications.email.useSsl} onChange={(event) => updateEmail({ useSsl: event.target.checked })} />Use Direct SSL (Port 465 only; leave unchecked for 587 STARTTLS)</label>
          <label>Username<input type="text" value={settings.notifications.email.username} onChange={(event) => updateEmail({ username: event.target.value })} /></label>
          <label>Replace password<input type="password" value={settings.notifications.email.password ?? ""} placeholder={settings.notifications.email.passwordMasked} onChange={(event) => updateEmail({ password: event.target.value })} /></label>
          <p className="email-advice-note">
            💡 <strong>Gmail 2-Step Verification:</strong> Generate a 16-character Google App Password at <code>myaccount.google.com/apppasswords</code> to use as password. Standard Google login passwords are not accepted by SMTP.
          </p>
          <label>From<input type="text" value={settings.notifications.email.from} onChange={(event) => updateEmail({ from: event.target.value })} /></label>
          <label>To<input type="text" value={settings.notifications.email.to} onChange={(event) => updateEmail({ to: event.target.value })} /></label>
          <div className="field-action-row" style={{ gap: 8, display: "flex", flexWrap: "wrap" }}>
            <button
              type="button"
              className="test-btn"
              disabled={testingNotificationChannel !== null}
              onClick={() => onTestNotification?.("Email")}
            >
              <Mail style={{ width: 14, height: 14 }} />
              {testingNotificationChannel === "Email" ? "Sending Test..." : "Send Test Email"}
            </button>
            {onOpenSentEmails && (
              <button
                type="button"
                className="test-btn"
                onClick={onOpenSentEmails}
              >
                <ExternalLink style={{ width: 14, height: 14 }} />
                View Sent Email Outbox ({sentEmailsCount})
              </button>
            )}
          </div>
        </fieldset>
      </div>
      <div className="settings-actions">
        <button type="button" onClick={onSave}>Save settings</button>
      </div>
    </div>
  );
}

function NumberField({ label, value, step = 1, onChange }: { label: string; value: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label>
      {label}
      <input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function IntervalField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label>
      Interval
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="OneMinute">One minute</option>
        <option value="FiveMinutes">Five minutes</option>
        <option value="FifteenMinutes">Fifteen minutes</option>
      </select>
    </label>
  );
}

function StageDecisionTable({ decisions, emptyText }: { decisions: StageDecision[]; emptyText: string }) {
  return (
    <DataTable
      columns={["Symbol", "Direction", "Outcome", "Score", "Entry", "Stop", "Target", "Qty", "Risk", "Reasons"]}
      rows={decisions.map((item) => [
        `${item.exchange}:${item.symbol}`,
        item.direction ?? "-",
        item.outcome,
        formatNumber(item.score),
        formatOptionalNumber(item.entryPrice),
        formatOptionalNumber(item.stopPrice),
        formatOptionalNumber(item.targetPrice),
        item.quantity?.toString() ?? "-",
        item.riskRejectionReason ?? formatOptionalNumber(item.plannedRiskAmount),
        summarizeReasons(item.reasonsJson)
      ])}
      emptyText={emptyText}
    />
  );
}

function ReasonSummary({ decisions }: { decisions: StageDecision[] }) {
  if (decisions.length === 0) {
    return null;
  }

  const accepted = decisions.filter((item) => item.outcome === "Accepted").length;
  const rejected = decisions.length - accepted;
  const reasonCounts = new Map<string, number>();
  for (const decision of decisions) {
    for (const reason of parseReasonCodes(decision.reasonsJson)) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
    if (decision.riskRejectionReason) {
      reasonCounts.set(decision.riskRejectionReason, (reasonCounts.get(decision.riskRejectionReason) ?? 0) + 1);
    }
  }

  const topReasons = [...reasonCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5);

  return (
    <div className="reason-summary">
      <div>
        <strong>{accepted} accepted</strong>
        <span>{rejected} rejected</span>
      </div>
      {topReasons.length > 0 && (
        <ol>
          {topReasons.map(([reason, count]) => (
            <li key={reason}>
              <span>{reason}</span>
              <strong>{count}</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function topCounts(counts: Map<string, number>, limit: number) {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit);
}

let activeUserEmailHeader = "indurotech.jp@gmail.com";

export function setActiveUserEmailHeader(email: string) {
  activeUserEmailHeader = email;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "x-user-email": activeUserEmailHeader }
  });
  if (!response.ok) {
    let msg = `${path} returned ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) msg = data.message;
      else if (data?.error) msg = data.error;
    } catch {
      const text = await response.text();
      if (text) msg = text;
    }
    throw new Error(msg);
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-email": activeUserEmailHeader
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    let msg = `${path} returned ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) msg = data.message;
      else if (data?.error) msg = data.error;
    } catch {
      const bodyText = await response.text();
      if (bodyText) msg = `${path} returned ${response.status}: ${bodyText}`;
    }
    throw new Error(msg);
  }

  return response.json() as Promise<T>;
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-email": activeUserEmailHeader
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    let msg = `${path} returned ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) msg = data.message;
      else if (data?.error) msg = data.error;
    } catch {
      const text = await response.text();
      if (text) msg = text;
    }
    throw new Error(msg);
  }

  return response.json() as Promise<T>;
}

async function deleteJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: { "x-user-email": activeUserEmailHeader }
  });
  if (!response.ok) {
    let msg = `${path} returned ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }

  return response.json() as Promise<T>;
}

function summarizeReasons(reasonsJson: string) {
  const reasons = parseReasonCodes(reasonsJson);
  return reasons.slice(0, 3).join(", ") || "-";
}

function parseReasonCodes(reasonsJson: string) {
  try {
    const reasons = JSON.parse(reasonsJson) as Array<{ code?: string }>;
    return reasons.map((item) => item.code).filter((code): code is string => Boolean(code));
  } catch {
    return [];
  }
}

function summarizeEventPayload(payloadJson: string) {
  try {
    const payload = JSON.parse(payloadJson) as { evaluatedCount?: number; acceptedCount?: number; rejectedCount?: number };
    return `evaluated ${payload.evaluatedCount ?? 0}, accepted ${payload.acceptedCount ?? 0}, rejected ${payload.rejectedCount ?? 0}`;
  } catch {
    return payloadJson;
  }
}

function downloadCsv(fileName: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return;
  }

  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))
  ].join("\r\n");
}

function csvCell(value: unknown) {
  const text = value === null || typeof value === "undefined" ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

function formatOptionalNumber(value?: number) {
  return typeof value === "number" ? formatNumber(value) : "-";
}

createRoot(document.getElementById("root")!).render(<App />);
