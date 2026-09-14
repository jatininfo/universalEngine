import React from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Bell,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  Gauge,
  History,
  LineChart,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
  TrendingUp,
  WifiOff,
  X
} from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_UNIVERSAL_ENGINE_API_URL ?? "https://localhost:7071";

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
  instruments: ScannerInstrument[];
};

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
  };
  analysis: {
    primaryProvider: string;
    useHistoricalCache: boolean;
    historicalCacheTtlHours: number;
  };
  message: string;
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
  paperRuns: PaperTradingRun[];
  paperOrders: PaperOrder[];
  aiRuns: AiAnalysisRun[];
  aiDecisions: AiAnalysisDecision[];
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
  paperRuns: [],
  paperOrders: [],
  aiRuns: [],
  aiDecisions: [],
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
  const [isSidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [settingsDraft, setSettingsDraft] = React.useState<ApplicationSettings | null>(null);
  const [settingsMessage, setSettingsMessage] = React.useState<string | null>(null);
  const [instrumentDraft, setInstrumentDraft] = React.useState<ScannerInstrument[]>([]);
  const [instrumentMessage, setInstrumentMessage] = React.useState<string | null>(null);
  const [symbol, setSymbol] = React.useState("RELIANCE");
  const [runDate, setRunDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [fromTime, setFromTime] = React.useState("09:30");
  const [toTime, setToTime] = React.useState("10:00");
  const [runningStage, setRunningStage] = React.useState<string | null>(null);
  const [runResult, setRunResult] = React.useState<PipelineRunResult | null>(null);
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null);

  const loadDashboard = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
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
        paperRuns,
        aiRuns,
        brokerStatuses,
        dataSourceSettings,
        applicationSettings,
        pipelineStatus,
        scannerInstruments,
        events,
        notifications
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
        getJson<PaperTradingRun[]>("/paper-trading/runs/latest?limit=5"),
        getJson<AiAnalysisRun[]>("/ai/runs/latest?limit=5"),
        getJson<BrokerStatus[]>("/broker/status"),
        getJson<DataSourceSettings>("/settings/data-sources"),
        getJson<ApplicationSettings>("/settings/application"),
        getJson<PipelineStatus>(`/pipeline/status?sessionDate=${runDate}`),
        getJson<ScannerInstruments>("/scanner/instruments"),
        getJson<EventLogEntry[]>("/events/latest?limit=10"),
        getJson<NotificationAttempt[]>("/notifications/attempts/latest?limit=8")
      ]);

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
        paperRuns,
        paperOrders,
        aiRuns,
        aiDecisions,
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
      const separator = path.includes("?") ? "&" : "?";
      const result = await postJson<PipelineRunResult>(`${path}${separator}sessionDate=${runDate}`);
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
        const separator = path.includes("?") ? "&" : "?";
        latest = await postJson<PipelineRunResult>(`${path}${separator}sessionDate=${runDate}`);
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

  const latestRun = state.scannerRuns[0];
  const accepted = latestRun?.acceptedCount ?? 0;
  const rejected = latestRun?.rejectedCount ?? 0;
  const actionable = state.monitorRuns[0]?.actionableCount ?? 0;
  const notificationFailures = state.notifications.filter((item) => !item.isSuccess).length;
  const connectedBrokers = state.brokerStatuses.filter((item) => item.isConnected).length;
  const openMenu = () => {
    setSidebarCollapsed(false);
    setMenuOpen(true);
  };
  const navItems = [
    { href: "#overview", label: "Overview", icon: <Gauge aria-hidden="true" /> },
    { href: "#pipeline", label: "Pipeline", icon: <PlayCircle aria-hidden="true" /> },
    { href: "#workflow", label: "Workflow", icon: <ClipboardList aria-hidden="true" /> },
    { href: "#instruments", label: "Instruments", icon: <Database aria-hidden="true" /> },
    { href: "#broker", label: "Broker", icon: <ShieldCheck aria-hidden="true" /> },
    { href: "#monitoring", label: "Monitoring", icon: <Activity aria-hidden="true" /> },
    { href: "#backtesting", label: "Backtesting", icon: <TrendingUp aria-hidden="true" /> },
    { href: "#reports", label: "Reports", icon: <LineChart aria-hidden="true" /> },
    { href: "#settings", label: "Settings", icon: <Gauge aria-hidden="true" /> },
    { href: "#paper", label: "Paper", icon: <History aria-hidden="true" /> },
    { href: "#ai", label: "AI", icon: <Siren aria-hidden="true" /> },
    { href: "#events", label: "Events", icon: <ClipboardList aria-hidden="true" /> },
    { href: "#notifications", label: "Notifications", icon: <Bell aria-hidden="true" /> },
    { href: "#lookup", label: "Lookup", icon: <Search aria-hidden="true" /> }
  ];

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
          {navItems.map((item) => (
            <a key={item.href} href={item.href} title={item.label} onClick={() => setMenuOpen(false)}>
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="topbar-menu" type="button" onClick={openMenu} aria-label="Open menu">
            <Menu aria-hidden="true" />
          </button>
          <div>
            <p className="eyebrow">Application workbench</p>
            <h1>Trading Analysis Workbench</h1>
            <span className="topbar-subtitle">Manual pipeline runs, editable settings, broker status, historical cache, analysis reports, and notification audit in one place.</span>
          </div>
          <button className="icon-button" type="button" onClick={() => void loadDashboard()} title="Refresh dashboard" aria-label="Refresh dashboard">
            <RefreshCw aria-hidden="true" />
          </button>
        </header>

        {state.error && (
          <div className="alert" role="alert">
            <WifiOff aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        <section className="metrics" id="overview" aria-label="Overview metrics">
          <Metric icon={<ShieldCheck />} label="API" value={state.health.toUpperCase()} tone={state.health === "ok" ? "good" : "warn"} />
          <Metric icon={<Gauge />} label="Latest Accepted" value={accepted.toString()} />
          <Metric icon={<Siren />} label="Latest Rejected" value={rejected.toString()} />
          <Metric icon={<Activity />} label="Monitor Alerts" value={actionable.toString()} tone={actionable > 0 ? "warn" : "neutral"} />
          <Metric icon={<History />} label="Broker Online" value={`${connectedBrokers}/${state.brokerStatuses.length || 3}`} tone={connectedBrokers > 0 ? "good" : "warn"} />
          <Metric icon={<Database />} label="Cache Files" value={(state.dataSourceSettings?.historicalCacheEntryCount ?? 0).toString()} tone={state.dataSourceSettings?.historicalCacheEnabled ? "good" : "warn"} />
          <Metric icon={<Bell />} label="Notification Failures" value={notificationFailures.toString()} tone={notificationFailures > 0 ? "bad" : "good"} />
        </section>

        <section className="split" id="workflow">
          <Panel title="Workflow Timeline" action={runDate}>
            <WorkflowTimeline status={state.pipelineStatus} runningStage={runningStage} />
          </Panel>

          <Panel title="Operations Snapshot">
            <OperationsSnapshot
              settings={state.dataSourceSettings}
              brokerStatuses={state.brokerStatuses}
              scannerRuns={state.scannerRuns}
              notifications={state.notifications}
            />
          </Panel>
        </section>

        <section className="split" id="pipeline">
          <Panel title="Manual Pipeline Runs" action="Notification-only">
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
              <div className="run-buttons">
                <button type="button" disabled={runningStage !== null} onClick={() => void runWorkflow()}>Run Workflow</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("EOD", "/pipeline/eod/run")}>Run EOD</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Pre-market", "/pipeline/pre-market/run")}>Run Pre-market</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Opening range", "/pipeline/opening-range/run")}>Run Opening</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Live validation", `/pipeline/live-validation/run?from=${fromTime}&to=${toTime}`)}>Run Live</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Monitor", `/pipeline/monitor/run?from=${fromTime}&to=${toTime}`)}>Run Monitor</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("AI analysis", "/ai/run")}>Run AI</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Paper trading", "/paper-trading/run")}>Run Paper</button>
              </div>
              <PipelineReadiness status={state.pipelineStatus} />
              <DataSourceReadiness settings={state.dataSourceSettings} />
              <PipelineReadinessChart status={state.pipelineStatus} />
              <p className="run-note">
                {runningStage ? `Running ${runningStage}...` : runResult ? `${runResult.stage}: ${runResult.status}; evaluated ${runResult.evaluatedCount}, accepted ${runResult.acceptedCount}, rejected ${runResult.rejectedCount}. ${runResult.message}` : "Manual runs persist audit records and never place orders."}
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

        <section id="instruments">
          <Panel title="Active Scanner Instruments" action={state.scannerInstruments ? `${state.scannerInstruments.count} active` : "Loading"}>
            <InstrumentEditor
              instruments={instrumentDraft}
              message={instrumentMessage}
              onChange={setInstrumentDraft}
              onSave={() => void saveScannerInstruments()}
            />
          </Panel>
        </section>

        <section className="split" id="stage-details">
          <Panel title="Pre-market Decisions">
            <ReasonSummary decisions={state.preMarketDecisions} />
            <StageDecisionTable decisions={state.preMarketDecisions} emptyText="No pre-market decisions found for latest run." />
          </Panel>

          <Panel title="Opening-range Decisions">
            <ReasonSummary decisions={state.openingDecisions} />
            <StageDecisionTable decisions={state.openingDecisions} emptyText="No opening-range decisions found for latest run." />
          </Panel>
        </section>

        <section className="split">
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

        <section className="split" id="monitoring">
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
            <DataTable
              columns={["Time", "Channel", "Status", "Subject"]}
              rows={state.notifications.map((item) => [
                new Date(item.attemptedAtUtc).toLocaleString(),
                item.channel,
                item.isSuccess ? "Sent" : "Failed",
                item.subject
              ])}
              emptyText="No notification attempts found."
            />
          </Panel>
        </section>

        <section className="split" id="backtesting">
          <Panel title="Backtest Accuracy">
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

        <section className="split" id="reports">
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

        <section className="split">
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

        <section id="settings">
          <Panel title="Application Settings" action="Non-secret config">
            <SettingsEditor
              settings={settingsDraft}
              message={settingsMessage ?? state.applicationSettings?.message}
              onChange={setSettingsDraft}
              onSave={() => void saveApplicationSettings()}
            />
          </Panel>
        </section>

        <section className="split" id="paper">
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
              columns={["Symbol", "Direction", "Status", "Entry", "Stop", "Target", "Qty", "Risk", "Source"]}
              rows={state.paperOrders.map((item) => [
                `${item.exchange}:${item.symbol}`,
                item.direction,
                item.status,
                formatNumber(item.entryPrice),
                formatNumber(item.stopPrice),
                formatOptionalNumber(item.targetPrice),
                item.quantity.toString(),
                formatNumber(item.plannedRiskAmount),
                item.sourceStage
              ])}
              emptyText="No paper orders found for latest run."
            />
          </Panel>
        </section>

        <section className="split" id="ai">
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

        <section className="split" id="events">
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

        <section id="lookup">
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

  return (
    <div className="instrument-editor">
      {message && <p className="settings-message">{message}</p>}
      <div className="instrument-toolbar">
        <button type="button" onClick={() => onChange([...instruments, { symbol: "", exchange: "Nse", isin: "", securityId: "", key: "" }])}>Add instrument</button>
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
                <td><input value={instrument.symbol} onChange={(event) => updateInstrument(index, { symbol: event.target.value.toUpperCase() })} /></td>
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

function SettingsEditor({
  settings,
  message,
  onChange,
  onSave
}: {
  settings: ApplicationSettings | null;
  message?: string | null;
  onChange: (settings: ApplicationSettings) => void;
  onSave: () => void;
}) {
  if (!settings) {
    return <p className="empty-state">Application settings are loading.</p>;
  }

  const updateRisk = (patch: Partial<ApplicationSettings["risk"]>) =>
    onChange({ ...settings, risk: { ...settings.risk, ...patch } });
  const updateEod = (patch: Partial<ApplicationSettings["eodScanner"]>) =>
    onChange({ ...settings, eodScanner: { ...settings.eodScanner, ...patch } });
  const updateAnalysis = (patch: Partial<ApplicationSettings["analysis"]>) =>
    onChange({ ...settings, analysis: { ...settings.analysis, ...patch } });

  return (
    <div className="settings-editor">
      {message && <p className="settings-message">{message}</p>}
      <div className="settings-grid">
        <fieldset>
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

        <fieldset>
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

        <fieldset>
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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST" });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} returned ${response.status}${body ? `: ${body}` : ""}`);
  }

  return response.json() as Promise<T>;
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} returned ${response.status}${text ? `: ${text}` : ""}`);
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
