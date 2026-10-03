import React from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Gauge,
  Globe,
  History,
  KeyRound,
  Layers,
  LineChart,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Square,
  Target,
  Trash2,
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
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
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
  role: "Super Admin" | "Admin" | "Trader" | "Operator" | "Viewer";
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
  notificationResults?: Array<{ channel: string; isSuccess: boolean; errorMessage?: string }>;
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
    sendStageNotifications?: boolean;
    allowDuplicatesWithoutCheck?: boolean;
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
  const [sendWithoutDuplicateCheck, setSendWithoutDuplicateCheck] = React.useState<boolean>(true);
  const [selectedNotificationChannel, setSelectedNotificationChannel] = React.useState<string>("Both");
  const [notifyingCandidateSymbol, setNotifyingCandidateSymbol] = React.useState<string | null>(null);
  const [broadcastingStage, setBroadcastingStage] = React.useState<string | null>(null);
  const [recentNotifiedCandidates, setRecentNotifiedCandidates] = React.useState<Record<string, {
    time: string;
    status: "success" | "duplicate" | "error";
    channel?: string;
    message?: string;
  }>>({});
  const [notificationStatusBanner, setNotificationStatusBanner] = React.useState<{
    success: boolean;
    message: string;
    isDuplicate?: boolean;
    candidateSymbol?: string;
    onForceResend?: () => void;
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
  const isSettingsAdmin = Boolean(
    currentUser && (
      currentUser.email.toLowerCase() === "indurotech.jp@gmail.com" ||
      currentUser.email.toLowerCase() === "tejas.p.singh@gmail.com" ||
      currentUser.role === "Super Admin" ||
      currentUser.role === "Admin"
    )
  );
  // All authenticated users have access to trigger candidate and stage notifications
  const canSendNotifications = Boolean(currentUser);
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
      const isSettingsAdmin = Boolean(
        activeUserEmailHeader.toLowerCase() === "indurotech.jp@gmail.com" ||
        activeUserEmailHeader.toLowerCase() === "tejas.p.singh@gmail.com" ||
        currentUser?.role === "Super Admin" ||
        currentUser?.role === "Admin"
      );

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
    const hasAdminAccess = Boolean(
      activeUserEmailHeader.toLowerCase() === "indurotech.jp@gmail.com" ||
      activeUserEmailHeader.toLowerCase() === "tejas.p.singh@gmail.com" ||
      currentUser?.role === "Super Admin" ||
      currentUser?.role === "Admin"
    );
    if (activeView !== "settings" || !hasAdminAccess) {
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
      if (result.notificationResults && result.notificationResults.length > 0) {
        const anySuccess = result.notificationResults.some((r) => r.isSuccess);
        const channels = result.notificationResults.filter((r) => r.isSuccess).map((r) => r.channel).join(", ");
        setNotificationStatusBanner({
          success: anySuccess,
          message: anySuccess
            ? `${stage} stage completed & notifications dispatched via ${channels}.`
            : `${stage} stage completed but notification failed: ${result.notificationResults.map((r) => r.errorMessage).join("; ")}`
        });
      }
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

  async function handleSendCandidateNotification(
    candidate: {
      symbol: string;
      exchange?: string;
      stage?: string;
      direction?: string;
      score?: number;
      entryPrice?: number;
      stopPrice?: number;
      targetPrice?: number;
      finalVerdict?: string;
      verdictReason?: string;
      reasonsJson?: string;
      outcome?: string;
    },
    forceSend: boolean = false,
    channelOverride?: string
  ) {
    setNotifyingCandidateSymbol(candidate.symbol);
    try {
      const targetChannel = channelOverride || selectedNotificationChannel;
      const res = await postJson<{
        success: boolean;
        isDuplicate?: boolean;
        skipDuplicateCheck?: boolean;
        message: string;
        results: Array<{ channel: string; isSuccess: boolean; errorMessage?: string }>;
      }>("/notifications/send-candidate", {
        symbol: candidate.symbol,
        exchange: candidate.exchange || "NSE",
        stage: candidate.stage || "EOD Candidate",
        direction: candidate.direction || "Long",
        score: candidate.score,
        entryPrice: candidate.entryPrice,
        stopPrice: candidate.stopPrice,
        targetPrice: candidate.targetPrice,
        finalVerdict: candidate.finalVerdict,
        verdictReason: candidate.verdictReason,
        outcome: candidate.outcome,
        reasons: candidate.reasonsJson ? summarizeReasons(candidate.reasonsJson) : "Technical Setup",
        skipDuplicateCheck: forceSend ? true : sendWithoutDuplicateCheck,
        forceSend,
        channelOverride: targetChannel
      });

      const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setRecentNotifiedCandidates((prev) => ({
        ...prev,
        [candidate.symbol]: {
          time: nowTime,
          status: res.success ? "success" : res.isDuplicate ? "duplicate" : "error",
          channel: res.results?.filter((r) => r.isSuccess).map((r) => r.channel).join(", ") || targetChannel,
          message: res.message
        }
      }));

      setNotificationStatusBanner({
        success: res.success,
        message: res.message,
        isDuplicate: Boolean(res.isDuplicate),
        candidateSymbol: candidate.symbol,
        onForceResend: () => void handleSendCandidateNotification(candidate, true, targetChannel)
      });

      void loadDashboard();
    } catch (err: any) {
      setNotificationStatusBanner({
        success: false,
        message: err.message || "Failed to dispatch candidate notification."
      });
    } finally {
      setNotifyingCandidateSymbol(null);
    }
  }

  async function handleBroadcastStageResults(stage: string, items: any[], forceSend: boolean = false, channelOverride?: string) {
    setBroadcastingStage(stage);
    try {
      const targetChannel = channelOverride || selectedNotificationChannel;
      const res = await postJson<{
        success: boolean;
        isDuplicate?: boolean;
        skipDuplicateCheck?: boolean;
        message: string;
        results: Array<{ channel: string; isSuccess: boolean; errorMessage?: string }>;
      }>("/notifications/broadcast-stage-results", {
        stage,
        items,
        skipDuplicateCheck: forceSend ? true : sendWithoutDuplicateCheck,
        forceSend,
        channelOverride: targetChannel
      });

      setNotificationStatusBanner({
        success: res.success,
        message: res.message,
        isDuplicate: Boolean(res.isDuplicate),
        onForceResend: () => void handleBroadcastStageResults(stage, items, true, targetChannel)
      });

      void loadDashboard();
    } catch (err: any) {
      setNotificationStatusBanner({
        success: false,
        message: err.message || `Failed to broadcast ${stage} results.`
      });
    } finally {
      setBroadcastingStage(null);
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

    if (sendWithoutDuplicateCheck) {
      params.set("skipDuplicateCheck", "true");
    }

    if (selectedNotificationChannel) {
      params.set("channel", selectedNotificationChannel);
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
            <div className="result-notification-toolbar">
              <div className="duplicate-check-control">
                <label className="duplicate-checkbox-label" title="When checked, notifications bypass the 10-minute duplicate suppression window.">
                  <input
                    type="checkbox"
                    checked={sendWithoutDuplicateCheck}
                    onChange={(e) => setSendWithoutDuplicateCheck(e.target.checked)}
                  />
                  <span>Send without duplicate check</span>
                </label>
                {sendWithoutDuplicateCheck && (
                  <span className="duplicate-bypass-badge">
                    ⚡ Duplicate Check Bypassed
                  </span>
                )}
              </div>
              <div className="channel-select-control" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary, #64748b)" }}>Channel:</span>
                <select
                  value={selectedNotificationChannel}
                  onChange={(e) => setSelectedNotificationChannel(e.target.value)}
                  style={{
                    padding: "3px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 4,
                    border: "1px solid var(--color-border, #cbd5e1)",
                    background: "var(--color-bg-card, #ffffff)",
                    color: "inherit"
                  }}
                  title="Target notification channel for candidate signals and stage broadcasts"
                >
                  <option value="Both">Both (Telegram & Email)</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Email">Email</option>
                  <option value="Console">Console only</option>
                </select>
              </div>
              {canSendNotifications && (
                <button
                  type="button"
                  className="btn-broadcast-results"
                  disabled={broadcastingStage !== null || state.candidates.length === 0}
                  onClick={() => void handleBroadcastStageResults("EOD", state.candidates)}
                  title={`Broadcast all qualified EOD candidates to ${selectedNotificationChannel} channel`}
                >
                  <Bell style={{ width: 13, height: 13 }} />
                  <span>{broadcastingStage === "EOD" ? "Broadcasting..." : `Broadcast EOD Results (${state.candidates.length})`}</span>
                </button>
              )}
            </div>

            {notificationStatusBanner && (
              <div
                className={`notification-banner ${notificationStatusBanner.success ? "success" : notificationStatusBanner.isDuplicate ? "warning" : "error"}`}
                style={{ marginBottom: 12 }}
              >
                <span className="banner-icon">
                  {notificationStatusBanner.success ? "✅" : notificationStatusBanner.isDuplicate ? "⚡" : "⚠️"}
                </span>
                <span className="banner-text">
                  {notificationStatusBanner.message}
                  {notificationStatusBanner.isDuplicate && notificationStatusBanner.onForceResend && (
                    <button
                      type="button"
                      onClick={notificationStatusBanner.onForceResend}
                      style={{
                        marginLeft: 8,
                        padding: "2px 8px",
                        background: "#ea580c",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 11
                      }}
                      title="Bypass duplicate suppression and send immediately"
                    >
                      ⚡ Force Send Now
                    </button>
                  )}
                  {notificationStatusBanner.success && (
                    <button
                      type="button"
                      onClick={() => setIsEmailViewerOpen(true)}
                      style={{
                        marginLeft: 8,
                        padding: "2px 8px",
                        background: "#0284c7",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 11
                      }}
                      title="Inspect rendered notification in In-App Email Inbox"
                    >
                      📬 View in Inbox
                    </button>
                  )}
                </span>
                <button type="button" className="banner-close" onClick={() => setNotificationStatusBanner(null)}>&times;</button>
              </div>
            )}

            <DataTable
              columns={canSendNotifications
                ? ["Symbol", "Direction", "Outcome", "Score", "Verdict", "Reasons", "Action"]
                : ["Symbol", "Direction", "Outcome", "Score", "Verdict", "Reasons"]
              }
              rows={state.candidates.map((item) => {
                const baseRow: React.ReactNode[] = [
                  `${item.exchange}:${item.symbol}`,
                  item.direction ?? "-",
                  item.outcome,
                  formatNumber(item.score),
                  item.finalVerdict ?? "-",
                  summarizeReasons(item.reasonsJson)
                ];

                if (canSendNotifications) {
                  const recentStatus = recentNotifiedCandidates[item.symbol];
                  const isNotifying = notifyingCandidateSymbol === item.symbol;

                  baseRow.push(
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {recentStatus?.status === "success" && (
                        <span
                          className="badge-notified-success"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#dcfce7",
                            color: "#15803d",
                            border: "1px solid #bbf7d0"
                          }}
                          title={`Notification sent at ${recentStatus.time} via ${recentStatus.channel || "configured channel"}`}
                        >
                          ✓ Sent
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn-notify-row"
                        disabled={isNotifying}
                        onClick={() => void handleSendCandidateNotification({
                          symbol: item.symbol,
                          exchange: item.exchange,
                          direction: item.direction,
                          score: item.score,
                          entryPrice: item.entryPrice,
                          stopPrice: item.stopPrice,
                          targetPrice: item.targetPrice,
                          finalVerdict: item.finalVerdict,
                          verdictReason: item.verdictReason,
                          reasonsJson: item.reasonsJson,
                          outcome: item.outcome,
                          stage: "EOD Candidate"
                        }, Boolean(recentStatus?.status === "success" || sendWithoutDuplicateCheck))}
                        title={recentStatus?.status === "success"
                          ? `Resend notification immediately for ${item.symbol}`
                          : `Send notification for ${item.symbol} (${sendWithoutDuplicateCheck ? "Duplicate check bypassed" : "Duplicate check active"})`
                        }
                      >
                        <Bell style={{ width: 11, height: 11 }} />
                        <span>{isNotifying ? "Sending..." : recentStatus?.status === "success" ? "Resend" : "Notify"}</span>
                      </button>
                    </div>
                  );
                }

                return baseRow;
              })}
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
              onSelectActiveUniverse={(name) => {
                setSelectedUniverseName(name);
                setRunUniverseMode("universe");
                setActiveView("overview");
              }}
              activeUniverseName={selectedUniverseName}
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
          <Panel
            title="Pre-market Decisions"
            action={
              canSendNotifications && state.preMarketDecisions.length > 0 ? (
                <button
                  type="button"
                  className="btn-broadcast-results"
                  style={{ padding: "3px 8px", fontSize: 11 }}
                  disabled={broadcastingStage !== null}
                  onClick={() => void handleBroadcastStageResults("Pre-market", state.preMarketDecisions)}
                  title="Broadcast Pre-market results to notification channels"
                >
                  <Bell style={{ width: 11, height: 11 }} />
                  <span>{broadcastingStage === "Pre-market" ? "Broadcasting..." : `Broadcast (${state.preMarketDecisions.length})`}</span>
                </button>
              ) : undefined
            }
          >
            <ReasonSummary decisions={state.preMarketDecisions} />
            <StageDecisionTable
              decisions={state.preMarketDecisions}
              emptyText="No pre-market decisions found for latest run."
              canNotify={canSendNotifications}
              notifyingSymbol={notifyingCandidateSymbol}
              onNotify={(item) => void handleSendCandidateNotification({
                symbol: item.symbol,
                exchange: item.exchange,
                direction: item.direction,
                score: item.score,
                entryPrice: item.entryPrice,
                stopPrice: item.stopPrice,
                targetPrice: item.targetPrice,
                outcome: item.outcome,
                reasonsJson: item.reasonsJson,
                stage: "Pre-market Decision"
              })}
            />
          </Panel>

          <Panel
            title="Opening-range Decisions"
            action={
              canSendNotifications && state.openingDecisions.length > 0 ? (
                <button
                  type="button"
                  className="btn-broadcast-results"
                  style={{ padding: "3px 8px", fontSize: 11 }}
                  disabled={broadcastingStage !== null}
                  onClick={() => void handleBroadcastStageResults("Opening range", state.openingDecisions)}
                  title="Broadcast Opening-range results to notification channels"
                >
                  <Bell style={{ width: 11, height: 11 }} />
                  <span>{broadcastingStage === "Opening range" ? "Broadcasting..." : `Broadcast (${state.openingDecisions.length})`}</span>
                </button>
              ) : undefined
            }
          >
            <ReasonSummary decisions={state.openingDecisions} />
            <StageDecisionTable
              decisions={state.openingDecisions}
              emptyText="No opening-range decisions found for latest run."
              canNotify={canSendNotifications}
              notifyingSymbol={notifyingCandidateSymbol}
              onNotify={(item) => void handleSendCandidateNotification({
                symbol: item.symbol,
                exchange: item.exchange,
                direction: item.direction,
                score: item.score,
                entryPrice: item.entryPrice,
                stopPrice: item.stopPrice,
                targetPrice: item.targetPrice,
                outcome: item.outcome,
                reasonsJson: item.reasonsJson,
                stage: "Opening-range Breakout"
              })}
            />
          </Panel>
        </section>

        <section className="split" hidden={activeView !== "broker"}>
          <Panel
            title="Live-validation Decisions"
            action={
              canSendNotifications && state.liveDecisions.length > 0 ? (
                <button
                  type="button"
                  className="btn-broadcast-results"
                  style={{ padding: "3px 8px", fontSize: 11 }}
                  disabled={broadcastingStage !== null}
                  onClick={() => void handleBroadcastStageResults("Live validation", state.liveDecisions)}
                  title="Broadcast Live-validation results to notification channels"
                >
                  <Bell style={{ width: 11, height: 11 }} />
                  <span>{broadcastingStage === "Live validation" ? "Broadcasting..." : `Broadcast (${state.liveDecisions.length})`}</span>
                </button>
              ) : undefined
            }
          >
            <ReasonSummary decisions={state.liveDecisions} />
            <StageDecisionTable
              decisions={state.liveDecisions}
              emptyText="No live-validation decisions found for latest run."
              canNotify={canSendNotifications}
              notifyingSymbol={notifyingCandidateSymbol}
              onNotify={(item) => void handleSendCandidateNotification({
                symbol: item.symbol,
                exchange: item.exchange,
                direction: item.direction,
                score: item.score,
                entryPrice: item.entryPrice,
                stopPrice: item.stopPrice,
                targetPrice: item.targetPrice,
                outcome: item.outcome,
                reasonsJson: item.reasonsJson,
                stage: "Live Validation"
              })}
            />
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
          {Boolean(
            currentUser &&
            (currentUser.email.toLowerCase() === "indurotech.jp@gmail.com" ||
             currentUser.role === "Super Admin" ||
             currentUser.role === "Admin")
          ) ? (
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

function Panel({ title, action, id, children }: { title: string; action?: React.ReactNode; id?: string; children: React.ReactNode }) {
  return (
    <section className="panel" id={id}>
      <header>
        <h2>{title}</h2>
        {action && (typeof action === "string" ? <span>{action}</span> : action)}
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

function DataTable({ columns, rows, emptyText }: { columns: string[]; rows: (React.ReactNode)[][]; emptyText: string }) {
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
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
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

function getUniverseResolvedStocks(universe: ScannerUniverseDraft, baskets: ScannerBasket[]): Array<{
  symbol: string;
  exchange: string;
  source: string;
  securityId?: string;
  isin?: string;
}> {
  const map = new Map<string, { symbol: string; exchange: string; source: string; securityId?: string; isin?: string }>();

  // Resolve from attached baskets
  for (const basketName of universe.basketNames) {
    const basket = baskets.find((b) => b.name.toLowerCase() === basketName.toLowerCase());
    if (basket) {
      const items = basket.instruments.slice(0, basket.maxSymbols <= 0 ? undefined : basket.maxSymbols);
      for (const inst of items) {
        const key = `${inst.exchange}:${inst.symbol}`.toUpperCase();
        if (!map.has(key)) {
          map.set(key, {
            symbol: inst.symbol,
            exchange: inst.exchange || "NSE",
            source: `Basket: ${basket.name}`,
            securityId: inst.securityId,
            isin: inst.isin
          });
        }
      }
    }
  }

  // Resolve from direct instruments
  for (const inst of universe.directInstruments) {
    if (!inst.symbol) continue;
    const key = `${inst.exchange}:${inst.symbol}`.toUpperCase();
    if (!map.has(key)) {
      map.set(key, {
        symbol: inst.symbol,
        exchange: inst.exchange || "NSE",
        source: "Direct Entry",
        securityId: inst.securityId,
        isin: inst.isin
      });
    } else {
      const existing = map.get(key)!;
      if (!existing.source.includes("Direct")) {
        existing.source = `${existing.source} + Direct`;
      }
    }
  }

  return [...map.values()];
}

function countUniverseStocks(universe: ScannerUniverseDraft, baskets: ScannerBasket[]): number {
  return getUniverseResolvedStocks(universe, baskets).length;
}

const PRESET_UNIVERSES = [
  {
    name: "Nifty 50 Core Momentum",
    badge: "Large Cap",
    basketKeywords: ["nifty", "50", "core"],
    directSymbols: [
      { symbol: "RELIANCE", exchange: "Nse" },
      { symbol: "TCS", exchange: "Nse" },
      { symbol: "HDFCBANK", exchange: "Nse" },
      { symbol: "INFY", exchange: "Nse" }
    ]
  },
  {
    name: "High Beta Volatility Alpha",
    badge: "Breakout",
    basketKeywords: ["fno", "beta", "momentum"],
    directSymbols: [
      { symbol: "TATAMOTORS", exchange: "Nse" },
      { symbol: "ADANIENT", exchange: "Nse" },
      { symbol: "BAJFINANCE", exchange: "Nse" }
    ]
  },
  {
    name: "Banking & Financials Alpha",
    badge: "Financials",
    basketKeywords: ["bank", "fin", "nifty"],
    directSymbols: [
      { symbol: "SBIN", exchange: "Nse" },
      { symbol: "ICICIBANK", exchange: "Nse" },
      { symbol: "KOTAKBANK", exchange: "Nse" },
      { symbol: "AXISBANK", exchange: "Nse" }
    ]
  },
  {
    name: "Tech & IT Midcap Titans",
    badge: "IT Growth",
    basketKeywords: ["tech", "it", "midcap"],
    directSymbols: [
      { symbol: "WIPRO", exchange: "Nse" },
      { symbol: "HCLTECH", exchange: "Nse" },
      { symbol: "TECHM", exchange: "Nse" },
      { symbol: "LTIM", exchange: "Nse" }
    ]
  }
];

function UniverseScanPoolModal({
  isOpen,
  onClose,
  universe,
  baskets,
  onSelectActive
}: {
  isOpen: boolean;
  onClose: () => void;
  universe: ScannerUniverseDraft | null;
  baskets: ScannerBasket[];
  onSelectActive?: (name: string) => void;
}) {
  const [filterQuery, setFilterQuery] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !universe) return null;

  const resolvedStocks = getUniverseResolvedStocks(universe, baskets);
  const filteredStocks = resolvedStocks.filter((s) =>
    s.symbol.toUpperCase().includes(filterQuery.toUpperCase()) ||
    s.source.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleCopySymbols = () => {
    const list = resolvedStocks.map((s) => s.symbol).join(", ");
    void navigator.clipboard?.writeText(list);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content inspector-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Scan Pool Inspector: {universe.name}</h3>
            <p className="modal-subtitle">
              Verified deduplicated scan pool combining {universe.basketNames.length} attached baskets and {universe.directInstruments.length} direct entries.
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="inspector-stats-row">
          <div>
            <strong>{resolvedStocks.length}</strong> Unique Scan Stocks
          </div>
          <div>
            <strong>{universe.basketNames.length}</strong> Baskets Attached
          </div>
          <div>
            <strong>{universe.directInstruments.length}</strong> Direct Standalone
          </div>
          <div>
            Status: <span style={{ color: universe.enabled ? "#15803d" : "#64748b", fontWeight: 700 }}>{universe.enabled ? "Active" : "Paused"}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div className="universe-search-box" style={{ flex: 1, minWidth: 200 }}>
            <Search style={{ width: 14, height: 14, color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search symbol or source..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-card-action"
            onClick={handleCopySymbols}
            title="Copy symbols to clipboard"
          >
            {copied ? <Check style={{ width: 14, height: 14, color: "#10b981" }} /> : <Copy style={{ width: 14, height: 14 }} />}
            <span>{copied ? "Copied!" : "Copy Symbols"}</span>
          </button>
          {onSelectActive && (
            <button
              type="button"
              className="btn-card-action btn-target-scanner"
              onClick={() => {
                onSelectActive(universe.name);
                onClose();
              }}
            >
              <Target style={{ width: 14, height: 14 }} />
              <span>Launch Scan Target</span>
            </button>
          )}
        </div>

        <div className="inspector-table-wrap">
          <table className="inspector-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Symbol</th>
                <th>Exchange</th>
                <th>Source Origin</th>
                <th>Security ID</th>
                <th>ISIN</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock, idx) => (
                <tr key={`${stock.exchange}:${stock.symbol}:${idx}`}>
                  <td style={{ color: "#94a3b8" }}>{idx + 1}</td>
                  <td><strong>{stock.symbol}</strong></td>
                  <td><span className="source-badge">{stock.exchange}</span></td>
                  <td>
                    <span className={`source-badge ${stock.source.includes("Direct") ? "source-direct" : ""}`}>
                      {stock.source}
                    </span>
                  </td>
                  <td><code>{stock.securityId || "—"}</code></td>
                  <td><code style={{ fontSize: 11 }}>{stock.isin || "—"}</code></td>
                </tr>
              ))}
              {filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                    No stocks match the search query "{filterQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button type="button" className="btn-cancel" onClick={onClose}>Close Inspector</button>
        </div>
      </div>
    </div>
  );
}

function UniverseBulkAddModal({
  isOpen,
  onClose,
  universeName,
  onImport
}: {
  isOpen: boolean;
  onClose: () => void;
  universeName: string;
  onImport: (symbols: string[], exchange: "Nse" | "Bse") => void;
}) {
  const [rawText, setRawText] = React.useState("");
  const [exchange, setExchange] = React.useState<"Nse" | "Bse">("Nse");

  if (!isOpen) return null;

  const parsedSymbols = rawText
    .split(/[\s,;\n\r\t]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0 && /^[A-Z0-9\-_&]+$/.test(s));

  const uniqueCount = new Set(parsedSymbols).size;

  const handleAddPresetList = (list: string[]) => {
    const existing = parsedSymbols;
    const combined = Array.from(new Set([...existing, ...list]));
    setRawText(combined.join(", "));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Bulk Add Stocks to {universeName}</h3>
            <p className="modal-subtitle">
              Paste symbols from watchlist, Excel, or TradingView separated by commas, spaces, or lines.
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="bulk-symbol-box">
          <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475569" }}>
            <span>Stock Symbols List:</span>
            <span>{uniqueCount} valid symbols detected</span>
          </label>
          <textarea
            rows={5}
            placeholder="e.g. RELIANCE, TCS, INFY, SBIN, HDFCBANK, TATAMOTORS, ICICIBANK"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Quick Add Presets:</span>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handleAddPresetList(["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"])}
            >
              + Top IT 5
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handleAddPresetList(["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK"])}
            >
              + Top Banks 5
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handleAddPresetList(["TATAMOTORS", "M&M", "MARUTI", "BAJAJ-AUTO"])}
            >
              + Auto 4
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              Target Exchange:
              <select value={exchange} onChange={(e) => setExchange(e.target.value as any)}>
                <option value="Nse">NSE (National Stock Exchange)</option>
                <option value="Bse">BSE (Bombay Stock Exchange)</option>
              </select>
            </label>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-save"
            disabled={uniqueCount === 0}
            onClick={() => {
              onImport(parsedSymbols, exchange);
              onClose();
            }}
          >
            Import {uniqueCount} Stock{uniqueCount === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UniverseEditor({
  baskets,
  draft,
  message,
  onChange,
  onSave,
  onSelectActiveUniverse,
  activeUniverseName
}: {
  baskets: ScannerBasket[];
  draft: ScannerUniverseDraft[];
  message?: string | null;
  onChange: (value: ScannerUniverseDraft[]) => void;
  onSave: () => void;
  onSelectActiveUniverse?: (name: string) => void;
  activeUniverseName?: string;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<"all" | "enabled" | "disabled">("all");
  const [expandedCards, setExpandedCards] = React.useState<Record<number, boolean>>({});
  const [detailedTableOpen, setDetailedTableOpen] = React.useState<Record<number, boolean>>({});
  const [inspectingIndex, setInspectingIndex] = React.useState<number | null>(null);
  const [bulkAddIndex, setBulkAddIndex] = React.useState<number | null>(null);

  const replaceUniverses = (next: ScannerUniverseDraft[]) => onChange(next);

  const updateUniverse = (index: number, patch: Partial<ScannerUniverseDraft>) =>
    replaceUniverses(draft.map((universe, currentIndex) => currentIndex === index ? { ...universe, ...patch } : universe));

  const updateUniverseInstrument = (universeIndex: number, instrumentIndex: number, patch: Partial<ScannerInstrument>) =>
    updateUniverse(universeIndex, {
      directInstruments: draft[universeIndex].directInstruments.map((instrument, currentIndex) =>
        currentIndex === instrumentIndex ? { ...instrument, ...patch } : instrument)
    });

  const addUniverse = () => {
    const newIdx = draft.length;
    replaceUniverses([
      ...draft,
      {
        name: `Universe ${newIdx + 1}`,
        enabled: true,
        basketNames: baskets.slice(0, 1).map((b) => b.name),
        directInstruments: []
      }
    ]);
    setExpandedCards((prev) => ({ ...prev, [newIdx]: true }));
  };

  const duplicateUniverse = (index: number) => {
    const src = draft[index];
    const copy: ScannerUniverseDraft = {
      name: `${src.name} (Copy)`,
      enabled: src.enabled,
      basketNames: [...src.basketNames],
      directInstruments: src.directInstruments.map((inst) => ({ ...inst }))
    };
    replaceUniverses([...draft.slice(0, index + 1), copy, ...draft.slice(index + 1)]);
    setExpandedCards((prev) => ({ ...prev, [index + 1]: true }));
  };

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

  const handleBulkImport = (universeIndex: number, symbols: string[], exchange: "Nse" | "Bse") => {
    const current = draft[universeIndex].directInstruments;
    const existing = new Set(current.map((i) => `${i.exchange}:${i.symbol}`.toUpperCase()));
    const toAdd: ScannerInstrument[] = [];
    for (const sym of symbols) {
      const key = `${exchange}:${sym}`.toUpperCase();
      if (!existing.has(key)) {
        existing.add(key);
        toAdd.push({
          symbol: sym,
          exchange,
          securityId: "",
          isin: "",
          key
        });
      }
    }
    if (toAdd.length > 0) {
      updateUniverse(universeIndex, {
        directInstruments: [...current, ...toAdd]
      });
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_UNIVERSES[0]) => {
    // Find matching baskets
    const matchedBaskets = baskets.filter((b) =>
      preset.basketKeywords.some((kw) => b.name.toLowerCase().includes(kw))
    );
    const chosenBaskets = matchedBaskets.length > 0
      ? matchedBaskets.map((b) => b.name)
      : baskets.slice(0, 1).map((b) => b.name);

    const newUniverse: ScannerUniverseDraft = {
      name: preset.name,
      enabled: true,
      basketNames: chosenBaskets,
      directInstruments: preset.directSymbols.map((s) => ({
        symbol: s.symbol,
        exchange: s.exchange,
        securityId: "",
        isin: "",
        key: `${s.exchange}:${s.symbol}`.toUpperCase()
      }))
    };

    const newIdx = draft.length;
    replaceUniverses([...draft, newUniverse]);
    setExpandedCards((prev) => ({ ...prev, [newIdx]: true }));
  };

  const isCardExpanded = (index: number) => expandedCards[index] !== false;
  const toggleCardExpanded = (index: number) =>
    setExpandedCards((prev) => ({ ...prev, [index]: !isCardExpanded(index) }));

  // Metrics
  const totalUniverses = draft.length;
  const enabledUniverses = draft.filter((u) => u.enabled).length;
  const totalCombinedEquities = React.useMemo(() => {
    const allKeys = new Set<string>();
    for (const u of draft.filter((univ) => univ.enabled)) {
      const pool = getUniverseResolvedStocks(u, baskets);
      for (const item of pool) {
        allKeys.add(`${item.exchange}:${item.symbol}`.toUpperCase());
      }
    }
    return allKeys.size;
  }, [draft, baskets]);

  // Filtering
  const filteredDraftWithIndices = draft
    .map((universe, originalIndex) => ({ universe, originalIndex }))
    .filter(({ universe }) => {
      if (filterTab === "enabled" && !universe.enabled) return false;
      if (filterTab === "disabled" && universe.enabled) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (universe.name.toLowerCase().includes(q)) return true;
      if (universe.basketNames.some((b) => b.toLowerCase().includes(q))) return true;
      if (universe.directInstruments.some((d) => d.symbol.toLowerCase().includes(q))) return true;
      return false;
    });

  return (
    <div className="universe-studio-container">
      {message && <p className="settings-message">{message}</p>}

      {/* Top Studio Metrics Bar */}
      <div className="universe-metrics-bar">
        <div className="universe-metric-card">
          <span className="universe-metric-num">{totalUniverses}</span>
          <span className="universe-metric-label">{enabledUniverses} Enabled Active</span>
        </div>
        <div className="universe-metric-card">
          <span className="universe-metric-num text-emerald" style={{ color: "#10b981" }}>{totalCombinedEquities}</span>
          <span className="universe-metric-label">Combined Scan Equities</span>
        </div>
        <div className="universe-metric-card">
          <span className="universe-metric-num text-blue" style={{ color: "#3b82f6" }}>{baskets.length}</span>
          <span className="universe-metric-label">Baskets in Library</span>
        </div>
        <div className="universe-metric-card">
          <span className="universe-metric-num text-purple" style={{ color: "#8b5cf6" }}>
            {activeUniverseName || "None selected"}
          </span>
          <span className="universe-metric-label">Active Scanner Source</span>
        </div>
      </div>

      {/* Quick Market Presets Bar */}
      <div className="universe-presets-banner">
        <Sparkles style={{ width: 16, height: 16, color: "#166534", flexShrink: 0 }} />
        <strong>Quick Market Presets:</strong>
        {PRESET_UNIVERSES.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className="preset-chip-btn"
            onClick={() => handleApplyPreset(preset)}
            title={`Add ${preset.name} (${preset.badge})`}
          >
            + {preset.name}
          </button>
        ))}
      </div>

      {/* Toolbar with Search, Tabs, and Action Buttons */}
      <div className="universe-toolbar-bar">
        <div className="universe-search-box">
          <Search style={{ width: 14, height: 14, color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search universes by name, basket, or stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="universe-tabs-nav">
          <button
            type="button"
            className={`universe-tab-btn ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All <span className="tab-count-pill">{draft.length}</span>
          </button>
          <button
            type="button"
            className={`universe-tab-btn ${filterTab === "enabled" ? "active" : ""}`}
            onClick={() => setFilterTab("enabled")}
          >
            Active <span className="tab-count-pill">{enabledUniverses}</span>
          </button>
          <button
            type="button"
            className={`universe-tab-btn ${filterTab === "disabled" ? "active" : ""}`}
            onClick={() => setFilterTab("disabled")}
          >
            Paused <span className="tab-count-pill">{draft.length - enabledUniverses}</span>
          </button>
        </div>

        <div className="universe-toolbar-actions">
          <button type="button" className="btn-secondary-action" onClick={addUniverse}>
            <Plus style={{ width: 14, height: 14 }} />
            <span>Create Universe</span>
          </button>
          <button type="button" className="btn-primary-action" onClick={onSave}>
            <Check style={{ width: 14, height: 14 }} />
            <span>Save Universes</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredDraftWithIndices.length === 0 && (
        <div className="empty-editor">
          <strong>No matching universes found</strong>
          <span>
            {searchQuery ? `No universe matched query "${searchQuery}".` : "Create your first universe or use a Quick Market Preset above."}
          </span>
          <button type="button" onClick={addUniverse}>+ Create First Universe</button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="universe-cards-grid">
        {filteredDraftWithIndices.map(({ universe, originalIndex }) => {
          const uniqueStocksCount = countUniverseStocks(universe, baskets);
          const isExpanded = isCardExpanded(originalIndex);
          const isCurrentActive = activeUniverseName === universe.name;

          // Check overlap between direct instruments and baskets
          const basketSymbols = new Set<string>();
          for (const bName of universe.basketNames) {
            const b = baskets.find((item) => item.name.toLowerCase() === bName.toLowerCase());
            for (const inst of b?.instruments ?? []) {
              basketSymbols.add(inst.symbol.toUpperCase());
            }
          }
          const overlapping = universe.directInstruments
            .filter((d) => basketSymbols.has(d.symbol.toUpperCase()))
            .map((d) => d.symbol);

          return (
            <article
              key={`${universe.name}:${originalIndex}`}
              className={`universe-card-v2 ${isCurrentActive ? "active-scanner-source" : ""}`}
            >
              <header className="universe-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
                  <button
                    type="button"
                    className="btn-card-action"
                    style={{ padding: "4px 6px", border: "none", background: "transparent" }}
                    onClick={() => toggleCardExpanded(originalIndex)}
                    title={isExpanded ? "Collapse universe" : "Expand universe"}
                  >
                    {isExpanded ? <ChevronDown style={{ width: 16, height: 16 }} /> : <ChevronRight style={{ width: 16, height: 16 }} />}
                  </button>
                  <input
                    className="universe-title-input"
                    value={universe.name}
                    placeholder="Universe name..."
                    onChange={(event) => updateUniverse(originalIndex, { name: event.target.value })}
                  />
                </div>

                <div className="universe-card-stats">
                  <label className="toggle-row" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={universe.enabled}
                      onChange={(event) => updateUniverse(originalIndex, { enabled: event.target.checked })}
                    />
                    <span style={{ fontWeight: 700, color: universe.enabled ? "#15803d" : "#64748b" }}>
                      {universe.enabled ? "Enabled" : "Paused"}
                    </span>
                  </label>
                  <span className="basket-chip-count" style={{ padding: "3px 8px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 700 }}>
                    🎯 {uniqueStocksCount} Scan Stocks
                  </span>
                  {isCurrentActive && (
                    <span className="protected-owner-pill" style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7" }}>
                      Active Scanner Target
                    </span>
                  )}
                </div>
              </header>

              {isExpanded && (
                <>
                  {/* Baskets Selector Matrix */}
                  <div style={{ marginTop: 10 }}>
                    <div className="universe-section-title">
                      <span>Attached Baskets ({universe.basketNames.length}/{baskets.length}):</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn-action-small"
                          onClick={() => updateUniverse(originalIndex, { basketNames: baskets.map((b) => b.name) })}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="btn-action-small"
                          onClick={() => updateUniverse(originalIndex, { basketNames: [] })}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="basket-chips-grid">
                      {baskets.map((basket) => {
                        const isSelected = universe.basketNames.includes(basket.name);
                        return (
                          <div
                            key={basket.name}
                            className={`basket-chip ${isSelected ? "selected" : ""}`}
                            onClick={() => toggleBasket(originalIndex, basket.name, !isSelected)}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{basket.name}</span>
                            <span className="basket-chip-count">{basket.instrumentCount || basket.instruments.length}</span>
                          </div>
                        );
                      })}
                      {baskets.length === 0 && (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>No baskets in library yet. Add one in Basket Library below.</span>
                      )}
                    </div>
                  </div>

                  {/* Direct Instruments Section */}
                  <div style={{ marginTop: 12 }}>
                    <div className="universe-section-title">
                      <span>Direct Standalone Stocks ({universe.directInstruments.length}):</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn-action-small"
                          onClick={() => setBulkAddIndex(originalIndex)}
                        >
                          <FileText style={{ width: 11, height: 11 }} />
                          <span>Paste / Bulk Add</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action-small"
                          onClick={() => setDetailedTableOpen((prev) => ({ ...prev, [originalIndex]: !prev[originalIndex] }))}
                        >
                          {detailedTableOpen[originalIndex] ? "Hide Details Table" : "Show ISIN Table"}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <InstrumentLookupInput
                          value=""
                          exchange="Nse"
                          placeholder="Search Dhan/NSE stock to add directly (e.g. RELIANCE)..."
                          clearAfterSelect
                          onValueChange={() => undefined}
                          onSelect={(result) => addUniverseInstrument(originalIndex, result)}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-secondary-action"
                        style={{ minHeight: 34, padding: "0 10px", fontSize: 12 }}
                        onClick={() => addBlankUniverseInstrument(originalIndex)}
                      >
                        + Add Custom Row
                      </button>
                    </div>

                    {/* Quick Direct Stock Tags */}
                    {universe.directInstruments.length > 0 && (
                      <div className="direct-stocks-wrap">
                        {universe.directInstruments.map((instrument, instrumentIndex) => (
                          <div
                            key={`${universe.name}:${instrument.exchange}:${instrument.symbol}:${instrumentIndex}`}
                            className="direct-stock-tag"
                          >
                            <span>{instrument.symbol || "(blank)"}</span>
                            <span style={{ fontSize: 9, opacity: 0.7 }}>{instrument.exchange}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateUniverse(originalIndex, {
                                  directInstruments: universe.directInstruments.filter((_, i) => i !== instrumentIndex)
                                })
                              }
                              title="Remove stock"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Overlap Hint */}
                    {overlapping.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "#854d0e", background: "#fefce8", padding: "4px 8px", borderRadius: 4 }}>
                        ℹ Note: {overlapping.slice(0, 3).join(", ")}{overlapping.length > 3 ? ` +${overlapping.length - 3} more` : ""} are already included in selected baskets. They will be cleanly deduplicated during scans.
                      </div>
                    )}

                    {/* Detailed Editable Table for ISIN & Security ID */}
                    {detailedTableOpen[originalIndex] && universe.directInstruments.length > 0 && (
                      <div className="table-scroll" style={{ marginTop: 8, maxHeight: 180 }}>
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
                              <tr key={`detailed:${universe.name}:${instrumentIndex}`}>
                                <td>
                                  <InstrumentLookupInput
                                    value={instrument.symbol}
                                    exchange={instrument.exchange}
                                    onValueChange={(val) => updateUniverseInstrument(originalIndex, instrumentIndex, { symbol: val.toUpperCase() })}
                                    onSelect={(res) => updateUniverseInstrument(originalIndex, instrumentIndex, lookupResultToInstrument(res))}
                                  />
                                </td>
                                <td>
                                  <select
                                    value={instrument.exchange}
                                    onChange={(e) => updateUniverseInstrument(originalIndex, instrumentIndex, { exchange: e.target.value })}
                                  >
                                    <option value="Nse">NSE</option>
                                    <option value="Bse">BSE</option>
                                  </select>
                                </td>
                                <td>
                                  <input
                                    value={instrument.securityId ?? ""}
                                    placeholder="Security ID"
                                    onChange={(e) => updateUniverseInstrument(originalIndex, instrumentIndex, { securityId: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <input
                                    value={instrument.isin ?? ""}
                                    placeholder="ISIN"
                                    onChange={(e) => updateUniverseInstrument(originalIndex, instrumentIndex, { isin: e.target.value.toUpperCase() })}
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="text-danger"
                                    onClick={() =>
                                      updateUniverse(originalIndex, {
                                        directInstruments: universe.directInstruments.filter((_, i) => i !== instrumentIndex)
                                      })
                                    }
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Card Footer Actions */}
              <footer className="universe-card-footer">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-card-action btn-target-scanner"
                    onClick={() => onSelectActiveUniverse && onSelectActiveUniverse(universe.name)}
                    title="Set this universe as the active scanner target and open the scan panel"
                  >
                    <Target style={{ width: 13, height: 13 }} />
                    <span>Launch Scan Target</span>
                  </button>
                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => setInspectingIndex(originalIndex)}
                    title="Inspect resolved stocks in this universe"
                  >
                    <Eye style={{ width: 13, height: 13 }} />
                    <span>Inspect Pool ({uniqueStocksCount})</span>
                  </button>
                  <button
                    type="button"
                    className="btn-card-action"
                    onClick={() => duplicateUniverse(originalIndex)}
                    title="Clone this universe"
                  >
                    <Copy style={{ width: 13, height: 13 }} />
                    <span>Clone</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-card-action btn-card-delete"
                  onClick={() => replaceUniverses(draft.filter((_, i) => i !== originalIndex))}
                  title="Delete this universe"
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                  <span>Delete</span>
                </button>
              </footer>
            </article>
          );
        })}
      </div>

      {/* Scan Pool Modal */}
      {inspectingIndex !== null && draft[inspectingIndex] && (
        <UniverseScanPoolModal
          isOpen={true}
          universe={draft[inspectingIndex]}
          baskets={baskets}
          onClose={() => setInspectingIndex(null)}
          onSelectActive={onSelectActiveUniverse}
        />
      )}

      {/* Bulk Add Modal */}
      {bulkAddIndex !== null && draft[bulkAddIndex] && (
        <UniverseBulkAddModal
          isOpen={true}
          universeName={draft[bulkAddIndex].name}
          onClose={() => setBulkAddIndex(null)}
          onImport={(symbols, ex) => handleBulkImport(bulkAddIndex, symbols, ex)}
        />
      )}
    </div>
  );
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
  const [notification, setNotification] = React.useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterProvider !== "all" && u.provider !== filterProvider) return false;
    return true;
  });

  const adminCount = users.filter((u) => u.role === "Admin" || u.role === "Super Admin").length;
  const traderCount = users.filter((u) => u.role === "Trader").length;
  const activeCount = users.filter((u) => u.status === "Active").length;

  const handleRoleUpdate = (userId: string, targetName: string, role: AppUser["role"]) => {
    onUpdateRole(userId, role);
    setNotification(`Successfully assigned ${role} role to ${targetName}.`);
    setTimeout(() => setNotification(null), 3500);
  };

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
          <span className="user-metric-num text-purple">{adminCount}</span>
          <span className="user-metric-label">Admins & Super Admins</span>
        </div>
        <div className="user-metric-card">
          <span className="user-metric-num text-blue">{traderCount}</span>
          <span className="user-metric-label">Active Traders</span>
        </div>
      </div>

      <div className="security-policy-callout">
        <ShieldCheck style={{ width: 22, height: 22, flexShrink: 0, color: "#10b981" }} />
        <div>
          <strong>Role-Based Access Control: Admin Clearance Enabled</strong>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>
            Platform Administrators and Super Admins hold full clearance to access and modify Broker Settings, Dhan HQ Credentials, Scanner Universes, and Team Access.
            You can grant the <strong>Admin</strong> role to any user in the list below with 1 click.
          </p>
        </div>
      </div>

      {notification && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          <CheckCircle2 style={{ width: 16, height: 16, color: "#16a34a" }} />
          <span>{notification}</span>
        </div>
      )}

      <div className="panel" style={{ padding: 0 }}>
        <div className="users-toolbar">
          <div className="users-filters">
            <label>
              Role:
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
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
                <th>Clearance & Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isSuperAdminEmail = user.email.toLowerCase() === "indurotech.jp@gmail.com";
                const isCurrent = currentUser?.email.toLowerCase() === user.email.toLowerCase();
                const isUserAdmin = user.role === "Admin" || user.role === "Super Admin" || isSuperAdminEmail;

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
                        {!isSuperAdminEmail ? (
                          <>
                            <select
                              value={user.role}
                              className={`role-select-inline ${user.role === "Admin" ? "role-select-admin" : ""}`}
                              onChange={(e) => handleRoleUpdate(user.id, user.name, e.target.value as any)}
                              title="Assign role to this user"
                            >
                              <option value="Admin">Admin (Settings & Universes Clearance)</option>
                              <option value="Super Admin">Super Admin</option>
                              <option value="Trader">Trader (Scanning & Orders)</option>
                              <option value="Operator">Operator (Monitor & Logs)</option>
                              <option value="Viewer">Viewer (Read-only)</option>
                            </select>
                            {user.role !== "Admin" && user.role !== "Super Admin" && (
                              <button
                                type="button"
                                className="btn-action-promote-admin"
                                onClick={() => handleRoleUpdate(user.id, user.name, "Admin")}
                                title={`Assign Admin role to ${user.name}`}
                              >
                                <ShieldCheck style={{ width: 12, height: 12 }} />
                                <span>Make Admin</span>
                              </button>
                            )}
                            {isUserAdmin && (
                              <span className="admin-clearance-badge" title="Has Admin and Settings clearance">
                                <ShieldCheck style={{ width: 11, height: 11 }} />
                                Admin
                              </span>
                            )}
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
                        ) : (
                          <span className="protected-owner-pill">Root Platform Owner</span>
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

  const isAdmin = Boolean(
    currentUser &&
    (currentUser.email.toLowerCase() === "indurotech.jp@gmail.com" ||
     currentUser.role === "Super Admin" ||
     currentUser.role === "Admin")
  );
  const isSuperAdmin = currentUser.role === "Super Admin" || currentUser.email.toLowerCase() === "indurotech.jp@gmail.com";

  return (
    <div className="topbar-user-menu-wrap" ref={ref}>
      <button
        type="button"
        className={`topbar-user-btn ${isAdmin ? "admin-border" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <img src={currentUser.avatarUrl} alt={currentUser.name} className="topbar-avatar" />
        <div className="topbar-user-copy">
          <span className="topbar-name">{currentUser.name}</span>
          <span className={`topbar-role-pill ${isAdmin ? "role-admin" : "role-trader"}`}>
            {currentUser.role}
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
              <option value="Admin">Admin (Full settings, broker config & universes clearance)</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Trader">Trader (Full market scanner & paper trading)</option>
              <option value="Operator">Operator (Monitor runs & event logs)</option>
              <option value="Viewer">Viewer (Read-only dashboard view)</option>
            </select>
          </label>

          <p className="note-text">
            * Note: Users assigned the <strong>Admin</strong> role receive immediate administrative clearance to access and configure settings, universes, and user permissions.
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
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.notifications.sendEodWatchlistNotifications}
              onChange={(event) => updateNotifications({ sendEodWatchlistNotifications: event.target.checked })}
            />
            Send EOD watchlist
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.notifications.sendStageNotifications ?? true}
              onChange={(event) => updateNotifications({ sendStageNotifications: event.target.checked })}
            />
            Send notification for each pipeline step (Pre-market, Opening range, Live, AI, Paper, Monitor)
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={settings.notifications.allowDuplicatesWithoutCheck ?? false}
              onChange={(event) => updateNotifications({ allowDuplicatesWithoutCheck: event.target.checked })}
            />
            Enable sending notifications without duplicate check (bypass 10-minute duplicate suppression)
          </label>
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

function StageDecisionTable({
  decisions,
  emptyText,
  isSettingsAdmin,
  canNotify,
  onNotify,
  notifyingSymbol
}: {
  decisions: StageDecision[];
  emptyText: string;
  isSettingsAdmin?: boolean;
  canNotify?: boolean;
  onNotify?: (decision: StageDecision) => void;
  notifyingSymbol?: string | null;
}) {
  const allowNotify = Boolean((canNotify ?? isSettingsAdmin) && onNotify);
  const columns = allowNotify
    ? ["Symbol", "Direction", "Outcome", "Score", "Entry", "Stop", "Target", "Qty", "Risk", "Reasons", "Action"]
    : ["Symbol", "Direction", "Outcome", "Score", "Entry", "Stop", "Target", "Qty", "Risk", "Reasons"];

  return (
    <DataTable
      columns={columns}
      rows={decisions.map((item) => {
        const baseRow: React.ReactNode[] = [
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
        ];

        if (allowNotify && onNotify) {
          baseRow.push(
            <button
              type="button"
              className="btn-notify-row"
              disabled={notifyingSymbol === item.symbol}
              onClick={() => onNotify(item)}
              title={`Send notification for ${item.symbol}`}
            >
              <Bell style={{ width: 11, height: 11 }} />
              <span>{notifyingSymbol === item.symbol ? "Sending..." : "Notify"}</span>
            </button>
          );
        }

        return baseRow;
      })}
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
