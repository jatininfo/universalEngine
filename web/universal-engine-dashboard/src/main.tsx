import React from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Bell,
  CheckCircle2,
  Gauge,
  History,
  LineChart,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
  WifiOff
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
  scannerInstruments: null,
  lookupResults: [],
  loading: true,
  error: null
};

function App() {
  const [state, setState] = React.useState(initialState);
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
        pipelineStatus,
        scannerInstruments,
        lookupResults: current.lookupResults,
        loading: false,
        error: null
      }));
      setLastRefresh(new Date());
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

  const latestRun = state.scannerRuns[0];
  const accepted = latestRun?.acceptedCount ?? 0;
  const rejected = latestRun?.rejectedCount ?? 0;
  const actionable = state.monitorRuns[0]?.actionableCount ?? 0;
  const notificationFailures = state.notifications.filter((item) => !item.isSuccess).length;
  const connectedBrokers = state.brokerStatuses.filter((item) => item.isConnected).length;

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <LineChart aria-hidden="true" />
          <div>
            <strong>UniversalEngine</strong>
            <span>NSE/BSE analysis</span>
          </div>
        </div>
        <nav aria-label="Dashboard sections">
          <a href="#overview">Overview</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#instruments">Instruments</a>
          <a href="#broker">Broker</a>
          <a href="#monitoring">Monitoring</a>
          <a href="#backtesting">Backtesting</a>
          <a href="#paper">Paper</a>
          <a href="#ai">AI</a>
          <a href="#events">Events</a>
          <a href="#notifications">Notifications</a>
          <a href="#lookup">Lookup</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Read-only dashboard</p>
            <h1>Trading Analysis Control Room</h1>
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
          <Metric icon={<Bell />} label="Notification Failures" value={notificationFailures.toString()} tone={notificationFailures > 0 ? "bad" : "good"} />
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
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("EOD", "/pipeline/eod/run")}>Run EOD</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Pre-market", "/pipeline/pre-market/run")}>Run Pre-market</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Opening range", "/pipeline/opening-range/run")}>Run Opening</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Live validation", `/pipeline/live-validation/run?from=${fromTime}&to=${toTime}`)}>Run Live</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Monitor", `/pipeline/monitor/run?from=${fromTime}&to=${toTime}`)}>Run Monitor</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("AI analysis", "/ai/run")}>Run AI</button>
                <button type="button" disabled={runningStage !== null} onClick={() => void runPipelineStage("Paper trading", "/paper-trading/run")}>Run Paper</button>
              </div>
              <PipelineReadiness status={state.pipelineStatus} />
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
            <DataTable
              columns={["Symbol", "Exchange", "Security ID", "ISIN", "Key"]}
              rows={(state.scannerInstruments?.instruments ?? []).map((item) => [
                item.symbol,
                item.exchange,
                item.securityId ?? "-",
                item.isin ?? "-",
                item.key
              ])}
              emptyText="No scanner instruments are configured."
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

function formatOptionalNumber(value?: number) {
  return typeof value === "number" ? formatNumber(value) : "-";
}

createRoot(document.getElementById("root")!).render(<App />);
