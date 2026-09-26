using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Ai;
using UniversalEngine.Application.Backtesting;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.PaperTrading;
using UniversalEngine.Application.ReadModels;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Domain.Market;
using UniversalEngine.Domain.Scanning;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Infrastructure.Persistence;

public sealed class SqliteScannerRepository(IOptions<PersistenceOptions> options) :
    IScannerRepository,
    IBacktestReportRepository,
    IPaperTradingRepository,
    IAiAnalysisRepository,
    IEventLogRepository,
    IOutcomeFeedbackRepository,
    INotificationHistoryRepository,
    IInstrumentUniverseRepository
{
    private readonly string _connectionString = options.Value.ConnectionString;

    public async Task<ScannerUniverseState> GetScannerUniverseStateAsync(CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var instruments = await GetConfiguredScannerInstrumentsAsync(connection, cancellationToken);
        var baskets = await GetConfiguredScannerBasketsAsync(connection, cancellationToken);
        var universes = await GetConfiguredScannerUniversesAsync(connection, baskets, instruments, cancellationToken);
        return new ScannerUniverseState(instruments, baskets, universes);
    }

    public async Task SaveScannerInstrumentsAsync(
        IReadOnlyList<ScannerInstrumentDefinition> instruments,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await ExecuteAsync(connection, "DELETE FROM ScannerInstruments;", cancellationToken);

        for (var index = 0; index < instruments.Count; index++)
        {
            var instrument = instruments[index];
            await ExecuteAsync(
                connection,
                """
                INSERT INTO ScannerInstruments
                    (Symbol, Exchange, Isin, SecurityId, IsActive, SortOrder, UpdatedAtUtc)
                VALUES
                    ($symbol, $exchange, $isin, $securityId, 1, $sortOrder, $updatedAtUtc);
                """,
                cancellationToken,
                ("$symbol", instrument.Symbol),
                ("$exchange", instrument.Exchange),
                ("$isin", instrument.Isin),
                ("$securityId", instrument.SecurityId),
                ("$sortOrder", index),
                ("$updatedAtUtc", NowText()));
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task SaveScannerBasketsAsync(
        IReadOnlyList<ScannerBasketDefinition> baskets,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await ExecuteAsync(connection, "DELETE FROM ScannerBasketInstruments;", cancellationToken);
        await ExecuteAsync(connection, "DELETE FROM ScannerBaskets;", cancellationToken);

        foreach (var basket in baskets)
        {
            await ExecuteAsync(
                connection,
                """
                INSERT INTO ScannerBaskets
                    (Name, Enabled, MaxSymbols, UpdatedAtUtc)
                VALUES
                    ($name, $enabled, $maxSymbols, $updatedAtUtc);
                """,
                cancellationToken,
                ("$name", basket.Name),
                ("$enabled", basket.Enabled ? 1 : 0),
                ("$maxSymbols", basket.MaxSymbols),
                ("$updatedAtUtc", NowText()));

            for (var index = 0; index < basket.Instruments.Count; index++)
            {
                var instrument = basket.Instruments[index];
                await ExecuteAsync(
                    connection,
                    """
                    INSERT INTO ScannerBasketInstruments
                        (BasketName, Symbol, Exchange, Isin, SecurityId, SortOrder)
                    VALUES
                        ($basketName, $symbol, $exchange, $isin, $securityId, $sortOrder);
                    """,
                    cancellationToken,
                    ("$basketName", basket.Name),
                    ("$symbol", instrument.Symbol),
                    ("$exchange", instrument.Exchange),
                    ("$isin", instrument.Isin),
                    ("$securityId", instrument.SecurityId),
                    ("$sortOrder", index));
            }
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task SaveScannerUniversesAsync(
        IReadOnlyList<ScannerUniverseDefinition> universes,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await ExecuteAsync(connection, "DELETE FROM ScannerUniverseBaskets;", cancellationToken);
        await ExecuteAsync(connection, "DELETE FROM ScannerUniverseInstruments;", cancellationToken);
        await ExecuteAsync(connection, "DELETE FROM ScannerUniverses;", cancellationToken);

        foreach (var universe in universes)
        {
            await ExecuteAsync(
                connection,
                """
                INSERT INTO ScannerUniverses
                    (Name, Enabled, UpdatedAtUtc)
                VALUES
                    ($name, $enabled, $updatedAtUtc);
                """,
                cancellationToken,
                ("$name", universe.Name),
                ("$enabled", universe.Enabled ? 1 : 0),
                ("$updatedAtUtc", NowText()));

            for (var index = 0; index < universe.DirectInstruments.Count; index++)
            {
                var instrument = universe.DirectInstruments[index];
                await ExecuteAsync(
                    connection,
                    """
                    INSERT INTO ScannerUniverseInstruments
                        (UniverseName, Symbol, Exchange, Isin, SecurityId, SortOrder)
                    VALUES
                        ($universeName, $symbol, $exchange, $isin, $securityId, $sortOrder);
                    """,
                    cancellationToken,
                    ("$universeName", universe.Name),
                    ("$symbol", instrument.Symbol),
                    ("$exchange", instrument.Exchange),
                    ("$isin", instrument.Isin),
                    ("$securityId", instrument.SecurityId),
                    ("$sortOrder", index));
            }

            for (var index = 0; index < universe.BasketNames.Count; index++)
            {
                await ExecuteAsync(
                    connection,
                    """
                    INSERT INTO ScannerUniverseBaskets
                        (UniverseName, BasketName, SortOrder)
                    VALUES
                        ($universeName, $basketName, $sortOrder);
                    """,
                    cancellationToken,
                    ("$universeName", universe.Name),
                    ("$basketName", universe.BasketNames[index]),
                    ("$sortOrder", index));
            }
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task SaveEodRunAsync(
        EodCandidateGenerationResult result,
        IReadOnlyList<RiskVerdict> verdicts,
        string marketDataProvider,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var runId = Guid.NewGuid().ToString("N");
        await ExecuteAsync(
            connection,
            """
            INSERT INTO ScannerRuns
                (Id, SessionDate, StartedAtUtc, MarketDataProvider, AcceptedCount, RejectedCount)
            VALUES
                ($id, $sessionDate, $startedAtUtc, $marketDataProvider, $acceptedCount, $rejectedCount);
            """,
            cancellationToken,
            ("$id", runId),
            ("$sessionDate", DateText(result.SessionDate)),
            ("$startedAtUtc", NowText()),
            ("$marketDataProvider", marketDataProvider),
            ("$acceptedCount", result.AcceptedCandidates.Count),
            ("$rejectedCount", result.RejectedCandidates.Count));

        var verdictsByInstrument = verdicts
            .GroupBy(verdict => verdict.Candidate.Instrument.Key)
            .ToDictionary(group => group.Key, group => group.First());

        foreach (var decision in result.Decisions)
        {
            verdictsByInstrument.TryGetValue(decision.Instrument.Key, out var verdict);
            await InsertEodDecisionAsync(connection, runId, decision, verdict, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<ScannerRunSummary>> GetLatestRunsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, SessionDate, StartedAtUtc, MarketDataProvider, AcceptedCount, RejectedCount
            FROM ScannerRuns
            ORDER BY StartedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var runs = new List<ScannerRunSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            runs.Add(new ScannerRunSummary(
                reader.GetString(0),
                DateOnly.Parse(reader.GetString(1)),
                DateTimeOffset.Parse(reader.GetString(2)),
                reader.GetString(3),
                reader.GetInt32(4),
                reader.GetInt32(5)));
        }

        return runs;
    }

    public async Task<IReadOnlyList<CandidateDecisionSummary>> GetCandidatesAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, RunId, Symbol, Exchange, Outcome, Direction, Score, ScoreModelVersion,
                   ScoreFactorsJson, ReasonsJson, FinalVerdict, VerdictReason, CreatedAtUtc
            FROM CandidateDecisions
            WHERE RunId = $runId
            ORDER BY Score DESC, Symbol ASC;
            """,
            ("$runId", runId));

        var candidates = new List<CandidateDecisionSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            candidates.Add(new CandidateDecisionSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                GetString(reader, 5),
                reader.GetDecimal(6),
                GetString(reader, 7),
                GetString(reader, 8),
                reader.GetString(9),
                GetString(reader, 10),
                GetString(reader, 11),
                DateTimeOffset.Parse(reader.GetString(12))));
        }

        return candidates;
    }

    public Task<IReadOnlyList<CandidateDecision>> GetLatestAcceptedEodCandidatesAsync(
        DateOnly beforeSessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        CancellationToken cancellationToken) =>
        GetLatestTradeCandidatesFromAsync(
            "ScannerRuns",
            "CandidateDecisions",
            "SessionDate < $sessionDate",
            beforeSessionDate,
            configuredInstruments,
            requirePrices: false,
            cancellationToken);

    public async Task SavePreMarketRunAsync(
        PreMarketFilterResult result,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var runId = Guid.NewGuid().ToString("N");
        await ExecuteAsync(
            connection,
            """
            INSERT INTO PreMarketRuns
                (Id, SessionDate, StartedAtUtc, AcceptedCount, RejectedCount)
            VALUES
                ($id, $sessionDate, $startedAtUtc, $acceptedCount, $rejectedCount);
            """,
            cancellationToken,
            ("$id", runId),
            ("$sessionDate", DateText(result.SessionDate)),
            ("$startedAtUtc", NowText()),
            ("$acceptedCount", result.Accepted.Count),
            ("$rejectedCount", result.Decisions.Count(decision => !decision.IsAccepted)));

        foreach (var decision in result.Decisions)
        {
            await InsertSimpleDecisionAsync(connection, "PreMarketDecisions", runId, decision, cancellationToken);
        }
    }

    public Task<IReadOnlyList<PreMarketRunSummary>> GetLatestPreMarketRunsAsync(
        int limit,
        CancellationToken cancellationToken) =>
        GetSimpleRunsAsync(
            "PreMarketRuns",
            limit,
            reader => new PreMarketRunSummary(
                reader.GetString(0),
                DateOnly.Parse(reader.GetString(1)),
                DateTimeOffset.Parse(reader.GetString(2)),
                reader.GetInt32(3),
                reader.GetInt32(4)),
            cancellationToken);

    public Task<IReadOnlyList<PreMarketDecisionSummary>> GetPreMarketDecisionsAsync(
        string runId,
        CancellationToken cancellationToken) =>
        GetSimpleDecisionsAsync("PreMarketDecisions", runId, cancellationToken);

    public Task<IReadOnlyList<CandidateDecision>> GetLatestAcceptedPreMarketCandidatesAsync(
        DateOnly sessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        CancellationToken cancellationToken) =>
        GetLatestTradeCandidatesFromAsync(
            "PreMarketRuns",
            "PreMarketDecisions",
            "SessionDate = $sessionDate",
            sessionDate,
            configuredInstruments,
            requirePrices: false,
            cancellationToken);

    public async Task SaveOpeningRangeRunAsync(
        OpeningRangeValidationResult result,
        IReadOnlyList<RiskSizingResult> riskResults,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var runId = Guid.NewGuid().ToString("N");
        await ExecuteAsync(
            connection,
            """
            INSERT INTO OpeningRangeRuns
                (Id, SessionDate, StartedAtUtc, ConfirmedCount, RejectedCount)
            VALUES
                ($id, $sessionDate, $startedAtUtc, $confirmedCount, $rejectedCount);
            """,
            cancellationToken,
            ("$id", runId),
            ("$sessionDate", DateText(result.SessionDate)),
            ("$startedAtUtc", NowText()),
            ("$confirmedCount", result.Decisions.Count(decision => decision.IsAccepted)),
            ("$rejectedCount", result.Decisions.Count(decision => !decision.IsAccepted)));

        var riskByInstrument = riskResults
            .Where(item => item.TradePlan is not null)
            .GroupBy(item => item.TradePlan!.Instrument.Key)
            .ToDictionary(group => group.Key, group => group.First());

        foreach (var decision in result.Decisions)
        {
            riskByInstrument.TryGetValue(decision.Instrument.Key, out var riskResult);
            await InsertTradeDecisionAsync(connection, "OpeningRangeDecisions", runId, decision, riskResult, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<OpeningRangeRunSummary>> GetLatestOpeningRangeRunsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, SessionDate, StartedAtUtc, ConfirmedCount, RejectedCount
            FROM OpeningRangeRuns
            ORDER BY StartedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var runs = new List<OpeningRangeRunSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            runs.Add(new OpeningRangeRunSummary(
                reader.GetString(0),
                DateOnly.Parse(reader.GetString(1)),
                DateTimeOffset.Parse(reader.GetString(2)),
                reader.GetInt32(3),
                reader.GetInt32(4)));
        }

        return runs;
    }

    public Task<IReadOnlyList<OpeningRangeDecisionSummary>> GetOpeningRangeDecisionsAsync(
        string runId,
        CancellationToken cancellationToken) =>
        GetTradeDecisionSummariesAsync(
            "OpeningRangeDecisions",
            runId,
            reader => new OpeningRangeDecisionSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                GetString(reader, 5),
                reader.GetDecimal(6),
                GetDecimal(reader, 7),
                GetDecimal(reader, 8),
                GetDecimal(reader, 9),
                GetInt(reader, 10),
                GetDecimal(reader, 11),
                GetDecimal(reader, 12),
                GetString(reader, 13),
                GetString(reader, 14),
                reader.GetString(15),
                DateTimeOffset.Parse(reader.GetString(16))),
            cancellationToken);

    public Task<IReadOnlyList<CandidateDecision>> GetLatestOpeningRangeTradeCandidatesAsync(
        DateOnly sessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        CancellationToken cancellationToken) =>
        GetLatestTradeCandidatesFromAsync(
            "OpeningRangeRuns",
            "OpeningRangeDecisions",
            "SessionDate = $sessionDate",
            sessionDate,
            configuredInstruments,
            requirePrices: true,
            cancellationToken);

    public async Task SaveLiveValidationRunAsync(
        DateOnly sessionDate,
        TimeOnly from,
        TimeOnly to,
        IReadOnlyList<CandidateDecision> decisions,
        IReadOnlyList<RiskSizingResult> riskResults,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var runId = Guid.NewGuid().ToString("N");
        await ExecuteAsync(
            connection,
            """
            INSERT INTO LiveValidationRuns
                (Id, SessionDate, StartedAtUtc, WindowStart, WindowEnd, ConfirmedCount, RejectedCount)
            VALUES
                ($id, $sessionDate, $startedAtUtc, $windowStart, $windowEnd, $confirmedCount, $rejectedCount);
            """,
            cancellationToken,
            ("$id", runId),
            ("$sessionDate", DateText(sessionDate)),
            ("$startedAtUtc", NowText()),
            ("$windowStart", TimeText(from)),
            ("$windowEnd", TimeText(to)),
            ("$confirmedCount", decisions.Count(decision => decision.IsAccepted)),
            ("$rejectedCount", decisions.Count(decision => !decision.IsAccepted)));

        var riskByInstrument = riskResults
            .Where(item => item.TradePlan is not null)
            .GroupBy(item => item.TradePlan!.Instrument.Key)
            .ToDictionary(group => group.Key, group => group.First());

        foreach (var decision in decisions)
        {
            riskByInstrument.TryGetValue(decision.Instrument.Key, out var riskResult);
            await InsertTradeDecisionAsync(connection, "LiveValidationDecisions", runId, decision, riskResult, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<LiveValidationRunSummary>> GetLatestLiveValidationRunsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, SessionDate, StartedAtUtc, WindowStart, WindowEnd, ConfirmedCount, RejectedCount
            FROM LiveValidationRuns
            ORDER BY StartedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var runs = new List<LiveValidationRunSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            runs.Add(new LiveValidationRunSummary(
                reader.GetString(0),
                DateOnly.Parse(reader.GetString(1)),
                DateTimeOffset.Parse(reader.GetString(2)),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetInt32(5),
                reader.GetInt32(6)));
        }

        return runs;
    }

    public Task<IReadOnlyList<LiveValidationDecisionSummary>> GetLiveValidationDecisionsAsync(
        string runId,
        CancellationToken cancellationToken) =>
        GetTradeDecisionSummariesAsync(
            "LiveValidationDecisions",
            runId,
            reader => new LiveValidationDecisionSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                GetString(reader, 5),
                reader.GetDecimal(6),
                GetDecimal(reader, 7),
                GetDecimal(reader, 8),
                GetDecimal(reader, 9),
                GetInt(reader, 10),
                GetDecimal(reader, 11),
                GetDecimal(reader, 12),
                GetString(reader, 13),
                GetString(reader, 14),
                reader.GetString(15),
                DateTimeOffset.Parse(reader.GetString(16))),
            cancellationToken);

    public Task<IReadOnlyList<CandidateDecision>> GetLatestLiveValidationTradeCandidatesAsync(
        DateOnly sessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        CancellationToken cancellationToken) =>
        GetLatestTradeCandidatesFromAsync(
            "LiveValidationRuns",
            "LiveValidationDecisions",
            "SessionDate = $sessionDate",
            sessionDate,
            configuredInstruments,
            requirePrices: true,
            cancellationToken);

    public async Task SaveMonitorRunAsync(
        SignalMonitoringRunResult result,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var runId = Guid.NewGuid().ToString("N");
        await ExecuteAsync(
            connection,
            """
            INSERT INTO MonitorRuns
                (Id, SessionDate, StartedAtUtc, WindowStart, WindowEnd, EventCount, ActionableCount)
            VALUES
                ($id, $sessionDate, $startedAtUtc, $windowStart, $windowEnd, $eventCount, $actionableCount);
            """,
            cancellationToken,
            ("$id", runId),
            ("$sessionDate", DateText(result.SessionDate)),
            ("$startedAtUtc", NowText()),
            ("$windowStart", TimeText(result.From)),
            ("$windowEnd", TimeText(result.To)),
            ("$eventCount", result.Results.Count),
            ("$actionableCount", result.Results.Count(IsActionable)));

        foreach (var item in result.Results)
        {
            await ExecuteAsync(
                connection,
                """
                INSERT INTO MonitorEvents
                    (RunId, Symbol, Exchange, Direction, EntryPrice, StopPrice, TargetPrice, LatestPrice,
                     LatestTimestampUtc, Status, Reason, CreatedAtUtc)
                VALUES
                    ($runId, $symbol, $exchange, $direction, $entryPrice, $stopPrice, $targetPrice, $latestPrice,
                     $latestTimestampUtc, $status, $reason, $createdAtUtc);
                """,
                cancellationToken,
                ("$runId", runId),
                ("$symbol", item.Candidate.Instrument.Symbol),
                ("$exchange", item.Candidate.Instrument.Exchange.ToString()),
                ("$direction", Db(item.Candidate.Direction?.ToString())),
                ("$entryPrice", Db(item.Candidate.EntryPrice)),
                ("$stopPrice", Db(item.Candidate.StopPrice)),
                ("$targetPrice", Db(item.Candidate.TargetPrice)),
                ("$latestPrice", Db(item.LatestPrice)),
                ("$latestTimestampUtc", Db(item.LatestTimestamp?.UtcDateTime.ToString("O"))),
                ("$status", item.Status.ToString()),
                ("$reason", item.Reason),
                ("$createdAtUtc", NowText()));
        }
    }

    public async Task<IReadOnlyList<MonitorRunSummary>> GetLatestMonitorRunsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, SessionDate, StartedAtUtc, WindowStart, WindowEnd, EventCount, ActionableCount
            FROM MonitorRuns
            ORDER BY StartedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var runs = new List<MonitorRunSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            runs.Add(new MonitorRunSummary(
                reader.GetString(0),
                DateOnly.Parse(reader.GetString(1)),
                DateTimeOffset.Parse(reader.GetString(2)),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetInt32(5),
                reader.GetInt32(6)));
        }

        return runs;
    }

    public async Task<IReadOnlyList<MonitorEventSummary>> GetMonitorEventsAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, RunId, Symbol, Exchange, Direction, EntryPrice, StopPrice, TargetPrice, LatestPrice,
                   LatestTimestampUtc, Status, Reason, CreatedAtUtc
            FROM MonitorEvents
            WHERE RunId = $runId
            ORDER BY Symbol ASC;
            """,
            ("$runId", runId));

        var events = new List<MonitorEventSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            events.Add(new MonitorEventSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                GetString(reader, 4),
                GetDecimal(reader, 5),
                GetDecimal(reader, 6),
                GetDecimal(reader, 7),
                GetDecimal(reader, 8),
                GetDateTimeOffset(reader, 9),
                reader.GetString(10),
                reader.GetString(11),
                DateTimeOffset.Parse(reader.GetString(12))));
        }

        return events;
    }

    public async Task<bool> HasSuccessfulNotificationAsync(
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT 1
            FROM NotificationAttempts
            WHERE IdempotencyKey = $idempotencyKey
              AND IsSuccess = 1
            LIMIT 1;
            """,
            ("$idempotencyKey", idempotencyKey));

        return await command.ExecuteScalarAsync(cancellationToken) is not null;
    }

    public async Task SaveNotificationAttemptAsync(
        NotificationAttempt attempt,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await ExecuteAsync(
            connection,
            """
            INSERT INTO NotificationAttempts
                (IdempotencyKey, Channel, Subject, Body, IsSuccess, ErrorMessage, AttemptedAtUtc)
            VALUES
                ($idempotencyKey, $channel, $subject, $body, $isSuccess, $errorMessage, $attemptedAtUtc);
            """,
            cancellationToken,
            ("$idempotencyKey", attempt.IdempotencyKey),
            ("$channel", attempt.Channel),
            ("$subject", attempt.Subject),
            ("$body", attempt.Body),
            ("$isSuccess", attempt.IsSuccess ? 1 : 0),
            ("$errorMessage", Db(attempt.ErrorMessage)),
            ("$attemptedAtUtc", attempt.AttemptedAtUtc.ToString("O")));
    }

    public async Task<IReadOnlyList<NotificationAttemptSummary>> GetLatestNotificationAttemptsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, IdempotencyKey, Channel, Subject, IsSuccess, ErrorMessage, AttemptedAtUtc
            FROM NotificationAttempts
            ORDER BY AttemptedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var attempts = new List<NotificationAttemptSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            attempts.Add(new NotificationAttemptSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetInt32(4) == 1,
                GetString(reader, 5),
                DateTimeOffset.Parse(reader.GetString(6))));
        }

        return attempts;
    }

    public async Task SaveBacktestRunAsync(
        BacktestRunResult result,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var runId = Guid.NewGuid().ToString("N");
        await ExecuteAsync(
            connection,
            """
            INSERT INTO BacktestRuns
                (Id, FromDate, ToDate, StartedAtUtc, SessionsEvaluated, Signals, Wins, Losses,
                 Flats, NoExitData, WinRatePercent, AverageReturnPercent)
            VALUES
                ($id, $fromDate, $toDate, $startedAtUtc, $sessionsEvaluated, $signals, $wins, $losses,
                 $flats, $noExitData, $winRatePercent, $averageReturnPercent);
            """,
            cancellationToken,
            ("$id", runId),
            ("$fromDate", DateText(result.FromDate)),
            ("$toDate", DateText(result.ToDate)),
            ("$startedAtUtc", NowText()),
            ("$sessionsEvaluated", result.SessionsEvaluated),
            ("$signals", result.Signals),
            ("$wins", result.Wins),
            ("$losses", result.Losses),
            ("$flats", result.Flats),
            ("$noExitData", result.NoExitData),
            ("$winRatePercent", result.WinRatePercent),
            ("$averageReturnPercent", result.AverageReturnPercent));

        foreach (var trade in result.Trades)
        {
            await ExecuteAsync(
                connection,
                """
                INSERT INTO BacktestTrades
                    (RunId, SignalDate, ExitDate, Symbol, Exchange, Direction, EntryPrice, ExitPrice,
                     ReturnPercent, Outcome, Score)
                VALUES
                    ($runId, $signalDate, $exitDate, $symbol, $exchange, $direction, $entryPrice, $exitPrice,
                     $returnPercent, $outcome, $score);
                """,
                cancellationToken,
                ("$runId", runId),
                ("$signalDate", DateText(trade.SignalDate)),
                ("$exitDate", trade.ExitDate is null ? null : DateText(trade.ExitDate.Value)),
                ("$symbol", trade.Instrument.Symbol),
                ("$exchange", trade.Instrument.Exchange.ToString()),
                ("$direction", trade.Direction.ToString()),
                ("$entryPrice", trade.EntryPrice),
                ("$exitPrice", Db(trade.ExitPrice)),
                ("$returnPercent", Db(trade.ReturnPercent)),
                ("$outcome", trade.Outcome.ToString()),
                ("$score", trade.Score));
        }
    }

    public async Task<IReadOnlyList<BacktestRunSummary>> GetLatestBacktestRunsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, FromDate, ToDate, StartedAtUtc, SessionsEvaluated, Signals, Wins, Losses,
                   Flats, NoExitData, WinRatePercent, AverageReturnPercent
            FROM BacktestRuns
            ORDER BY StartedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var runs = new List<BacktestRunSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            runs.Add(new BacktestRunSummary(
                reader.GetString(0),
                DateOnly.Parse(reader.GetString(1)),
                DateOnly.Parse(reader.GetString(2)),
                DateTimeOffset.Parse(reader.GetString(3)),
                reader.GetInt32(4),
                reader.GetInt32(5),
                reader.GetInt32(6),
                reader.GetInt32(7),
                reader.GetInt32(8),
                reader.GetInt32(9),
                reader.GetDecimal(10),
                reader.GetDecimal(11)));
        }

        return runs;
    }

    public async Task<IReadOnlyList<BacktestTradeSummary>> GetBacktestTradesAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, RunId, SignalDate, ExitDate, Symbol, Exchange, Direction, EntryPrice,
                   ExitPrice, ReturnPercent, Outcome, Score
            FROM BacktestTrades
            WHERE RunId = $runId
            ORDER BY SignalDate DESC, Symbol ASC;
            """,
            ("$runId", runId));

        var trades = new List<BacktestTradeSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            trades.Add(new BacktestTradeSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                DateOnly.Parse(reader.GetString(2)),
                reader.IsDBNull(3) ? null : DateOnly.Parse(reader.GetString(3)),
                reader.GetString(4),
                reader.GetString(5),
                reader.GetString(6),
                reader.GetDecimal(7),
                GetDecimal(reader, 8),
                GetDecimal(reader, 9),
                reader.GetString(10),
                reader.GetDecimal(11)));
        }

        return trades;
    }

    public async Task SavePaperTradingRunAsync(
        PaperTradingRunResult result,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var runId = Guid.NewGuid().ToString("N");
        await ExecuteAsync(
            connection,
            """
            INSERT INTO PaperTradingRuns
                (Id, SessionDate, StartedAtUtc, OrderCount, OpenCount, ClosedCount)
            VALUES
                ($id, $sessionDate, $startedAtUtc, $orderCount, $openCount, $closedCount);
            """,
            cancellationToken,
            ("$id", runId),
            ("$sessionDate", DateText(result.SessionDate)),
            ("$startedAtUtc", NowText()),
            ("$orderCount", result.Orders.Count),
            ("$openCount", result.Orders.Count(order => order.Status == PaperOrderStatus.Open)),
            ("$closedCount", result.Orders.Count(order => order.Status != PaperOrderStatus.Open)));

        foreach (var order in result.Orders)
        {
            await ExecuteAsync(
                connection,
                """
                INSERT INTO PaperOrders
                    (RunId, SessionDate, Symbol, Exchange, Direction, EntryPrice, StopPrice, TargetPrice,
                     Quantity, NotionalAmount, PlannedRiskAmount, Status, SourceStage, SourceReason, CreatedAtUtc)
                VALUES
                    ($runId, $sessionDate, $symbol, $exchange, $direction, $entryPrice, $stopPrice, $targetPrice,
                     $quantity, $notionalAmount, $plannedRiskAmount, $status, $sourceStage, $sourceReason, $createdAtUtc);
                """,
                cancellationToken,
                ("$runId", runId),
                ("$sessionDate", DateText(order.SessionDate)),
                ("$symbol", order.Instrument.Symbol),
                ("$exchange", order.Instrument.Exchange.ToString()),
                ("$direction", order.Direction.ToString()),
                ("$entryPrice", order.EntryPrice),
                ("$stopPrice", order.StopPrice),
                ("$targetPrice", Db(order.TargetPrice)),
                ("$quantity", order.Quantity),
                ("$notionalAmount", order.NotionalAmount),
                ("$plannedRiskAmount", order.PlannedRiskAmount),
                ("$status", order.Status.ToString()),
                ("$sourceStage", order.SourceStage),
                ("$sourceReason", order.SourceReason),
                ("$createdAtUtc", NowText()));
        }
    }

    public async Task<IReadOnlyList<PaperTradingRunSummary>> GetLatestPaperTradingRunsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, SessionDate, StartedAtUtc, OrderCount, OpenCount, ClosedCount
            FROM PaperTradingRuns
            ORDER BY StartedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var runs = new List<PaperTradingRunSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            runs.Add(new PaperTradingRunSummary(
                reader.GetString(0),
                DateOnly.Parse(reader.GetString(1)),
                DateTimeOffset.Parse(reader.GetString(2)),
                reader.GetInt32(3),
                reader.GetInt32(4),
                reader.GetInt32(5)));
        }

        return runs;
    }

    public async Task<IReadOnlyList<PaperOrderSummary>> GetPaperOrdersAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, RunId, SessionDate, Symbol, Exchange, Direction, EntryPrice, StopPrice, TargetPrice,
                   Quantity, NotionalAmount, PlannedRiskAmount, Status, SourceStage, SourceReason,
                   ExitDate, ExitPrice, ReturnPercent, RealizedPnl, CreatedAtUtc
            FROM PaperOrders
            WHERE RunId = $runId
            ORDER BY CreatedAtUtc DESC, Symbol ASC;
            """,
            ("$runId", runId));

        var orders = new List<PaperOrderSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            orders.Add(new PaperOrderSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                DateOnly.Parse(reader.GetString(2)),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetString(5),
                reader.GetDecimal(6),
                reader.GetDecimal(7),
                GetDecimal(reader, 8),
                reader.GetInt32(9),
                reader.GetDecimal(10),
                reader.GetDecimal(11),
                reader.GetString(12),
                reader.GetString(13),
                reader.GetString(14),
                GetDateOnly(reader, 15),
                GetDecimal(reader, 16),
                GetDecimal(reader, 17),
                GetDecimal(reader, 18),
                DateTimeOffset.Parse(reader.GetString(19))));
        }

        return orders;
    }

    public async Task<IReadOnlyList<PaperOrderSummary>> GetOpenPaperOrdersAsync(
        DateOnly sessionDate,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, RunId, SessionDate, Symbol, Exchange, Direction, EntryPrice, StopPrice, TargetPrice,
                   Quantity, NotionalAmount, PlannedRiskAmount, Status, SourceStage, SourceReason,
                   ExitDate, ExitPrice, ReturnPercent, RealizedPnl, CreatedAtUtc
            FROM PaperOrders
            WHERE SessionDate = $sessionDate AND Status = 'Open'
            ORDER BY CreatedAtUtc ASC, Symbol ASC;
            """,
            ("$sessionDate", DateText(sessionDate)));

        var orders = new List<PaperOrderSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            orders.Add(new PaperOrderSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                DateOnly.Parse(reader.GetString(2)),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetString(5),
                reader.GetDecimal(6),
                reader.GetDecimal(7),
                GetDecimal(reader, 8),
                reader.GetInt32(9),
                reader.GetDecimal(10),
                reader.GetDecimal(11),
                reader.GetString(12),
                reader.GetString(13),
                reader.GetString(14),
                GetDateOnly(reader, 15),
                GetDecimal(reader, 16),
                GetDecimal(reader, 17),
                GetDecimal(reader, 18),
                DateTimeOffset.Parse(reader.GetString(19))));
        }

        return orders;
    }

    public async Task UpdatePaperOrderAsync(
        long orderId,
        PaperOrderStatus status,
        DateOnly? exitDate,
        decimal? exitPrice,
        decimal? returnPercent,
        decimal? realizedPnl,
        string sourceReason,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await ExecuteAsync(
            connection,
            """
            UPDATE PaperOrders
            SET Status = $status,
                ExitDate = $exitDate,
                ExitPrice = $exitPrice,
                ReturnPercent = $returnPercent,
                RealizedPnl = $realizedPnl,
                SourceReason = $sourceReason
            WHERE Id = $id;
            """,
            cancellationToken,
            ("$id", orderId),
            ("$status", status.ToString()),
            ("$exitDate", exitDate is null ? null : DateText(exitDate.Value)),
            ("$exitPrice", Db(exitPrice)),
            ("$returnPercent", Db(returnPercent)),
            ("$realizedPnl", Db(realizedPnl)),
            ("$sourceReason", sourceReason));

        await ExecuteAsync(
            connection,
            """
            UPDATE PaperTradingRuns
            SET OpenCount = (SELECT COUNT(*) FROM PaperOrders WHERE RunId = PaperTradingRuns.Id AND Status = 'Open'),
                ClosedCount = (SELECT COUNT(*) FROM PaperOrders WHERE RunId = PaperTradingRuns.Id AND Status <> 'Open')
            WHERE Id = (SELECT RunId FROM PaperOrders WHERE Id = $id);
            """,
            cancellationToken,
            ("$id", orderId));
    }

    public async Task SaveEventAsync(
        string eventType,
        string subject,
        string payloadJson,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await ExecuteAsync(
            connection,
            """
            INSERT INTO EventLog
                (EventType, Subject, PayloadJson, CreatedAtUtc)
            VALUES
                ($eventType, $subject, $payloadJson, $createdAtUtc);
            """,
            cancellationToken,
            ("$eventType", eventType),
            ("$subject", subject),
            ("$payloadJson", payloadJson),
            ("$createdAtUtc", NowText()));
    }

    public async Task<IReadOnlyList<EventLogEntrySummary>> GetLatestEventsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, EventType, Subject, PayloadJson, CreatedAtUtc
            FROM EventLog
            ORDER BY CreatedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var events = new List<EventLogEntrySummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            events.Add(new EventLogEntrySummary(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                DateTimeOffset.Parse(reader.GetString(4))));
        }

        return events;
    }

    public async Task SaveOutcomeFeedbackAsync(
        DateOnly sessionDate,
        string symbol,
        string exchange,
        string direction,
        string source,
        string recommendation,
        string outcome,
        decimal? returnPercent,
        string notes,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await ExecuteAsync(
            connection,
            """
            INSERT INTO OutcomeFeedback
                (SessionDate, Symbol, Exchange, Direction, Source, Recommendation, Outcome, ReturnPercent, Notes, CreatedAtUtc)
            VALUES
                ($sessionDate, $symbol, $exchange, $direction, $source, $recommendation, $outcome, $returnPercent, $notes, $createdAtUtc);
            """,
            cancellationToken,
            ("$sessionDate", DateText(sessionDate)),
            ("$symbol", symbol.ToUpperInvariant()),
            ("$exchange", exchange),
            ("$direction", direction),
            ("$source", source),
            ("$recommendation", recommendation),
            ("$outcome", outcome),
            ("$returnPercent", Db(returnPercent)),
            ("$notes", notes),
            ("$createdAtUtc", NowText()));
    }

    public async Task<IReadOnlyList<OutcomeFeedbackSummary>> GetLatestOutcomeFeedbackAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, SessionDate, Symbol, Exchange, Direction, Source, Recommendation, Outcome,
                   ReturnPercent, Notes, CreatedAtUtc
            FROM OutcomeFeedback
            ORDER BY CreatedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var rows = new List<OutcomeFeedbackSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new OutcomeFeedbackSummary(
                reader.GetInt64(0),
                DateOnly.Parse(reader.GetString(1)),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetString(5),
                reader.GetString(6),
                reader.GetString(7),
                GetDecimal(reader, 8),
                reader.GetString(9),
                DateTimeOffset.Parse(reader.GetString(10))));
        }

        return rows;
    }

    public async Task SaveAiAnalysisRunAsync(
        AiAnalysisRunResult result,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        var runId = Guid.NewGuid().ToString("N");
        await ExecuteAsync(
            connection,
            """
            INSERT INTO AiAnalysisRuns
                (Id, SessionDate, StartedAtUtc, DecisionCount, TradeCandidateCount, WatchlistCount, NoTradeCount)
            VALUES
                ($id, $sessionDate, $startedAtUtc, $decisionCount, $tradeCandidateCount, $watchlistCount, $noTradeCount);
            """,
            cancellationToken,
            ("$id", runId),
            ("$sessionDate", DateText(result.SessionDate)),
            ("$startedAtUtc", NowText()),
            ("$decisionCount", result.Decisions.Count),
            ("$tradeCandidateCount", result.Decisions.Count(decision => decision.Recommendation == AiTradeRecommendation.TradeCandidate)),
            ("$watchlistCount", result.Decisions.Count(decision => decision.Recommendation == AiTradeRecommendation.Watchlist)),
            ("$noTradeCount", result.Decisions.Count(decision => decision.Recommendation == AiTradeRecommendation.NoTrade)));

        foreach (var decision in result.Decisions)
        {
            await ExecuteAsync(
                connection,
                """
                INSERT INTO AiAnalysisDecisions
                    (RunId, Symbol, Exchange, Direction, Score, Recommendation, ProbabilityPercent, Confidence,
                     Rationale, PromptVersion, ResponseJson, CreatedAtUtc)
                VALUES
                    ($runId, $symbol, $exchange, $direction, $score, $recommendation, $probabilityPercent, $confidence,
                     $rationale, $promptVersion, $responseJson, $createdAtUtc);
                """,
                cancellationToken,
                ("$runId", runId),
                ("$symbol", decision.Candidate.Instrument.Symbol),
                ("$exchange", decision.Candidate.Instrument.Exchange.ToString()),
                ("$direction", decision.Candidate.Direction?.ToString() ?? string.Empty),
                ("$score", decision.Candidate.Score),
                ("$recommendation", decision.Recommendation.ToString()),
                ("$probabilityPercent", decision.ProbabilityPercent),
                ("$confidence", decision.Confidence),
                ("$rationale", decision.Rationale),
                ("$promptVersion", decision.PromptVersion),
                ("$responseJson", decision.ResponseJson),
                ("$createdAtUtc", NowText()));
        }
    }

    public async Task<IReadOnlyList<AiAnalysisRunSummary>> GetLatestAiAnalysisRunsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, SessionDate, StartedAtUtc, DecisionCount, TradeCandidateCount, WatchlistCount, NoTradeCount
            FROM AiAnalysisRuns
            ORDER BY StartedAtUtc DESC
            LIMIT $limit;
            """,
            ("$limit", Limit(limit)));

        var runs = new List<AiAnalysisRunSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            runs.Add(new AiAnalysisRunSummary(
                reader.GetString(0),
                DateOnly.Parse(reader.GetString(1)),
                DateTimeOffset.Parse(reader.GetString(2)),
                reader.GetInt32(3),
                reader.GetInt32(4),
                reader.GetInt32(5),
                reader.GetInt32(6)));
        }

        return runs;
    }

    public async Task<IReadOnlyList<AiAnalysisDecisionSummary>> GetAiAnalysisDecisionsAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            """
            SELECT Id, RunId, Symbol, Exchange, Direction, Score, Recommendation, ProbabilityPercent,
                   Confidence, Rationale, PromptVersion, ResponseJson, CreatedAtUtc
            FROM AiAnalysisDecisions
            WHERE RunId = $runId
            ORDER BY ProbabilityPercent DESC, Symbol ASC;
            """,
            ("$runId", runId));

        var decisions = new List<AiAnalysisDecisionSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            decisions.Add(new AiAnalysisDecisionSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetDecimal(5),
                reader.GetString(6),
                reader.GetDecimal(7),
                reader.GetString(8),
                reader.GetString(9),
                reader.GetString(10),
                reader.GetString(11),
                DateTimeOffset.Parse(reader.GetString(12))));
        }

        return decisions;
    }

    private static async Task<IReadOnlyList<ScannerInstrumentDefinition>> GetConfiguredScannerInstrumentsAsync(
        SqliteConnection connection,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(
            connection,
            """
            SELECT Symbol, Exchange, Isin, SecurityId
            FROM ScannerInstruments
            WHERE IsActive = 1
            ORDER BY SortOrder ASC, Exchange ASC, Symbol ASC;
            """);

        return await ReadInstrumentDefinitionsAsync(command, cancellationToken);
    }

    private static async Task<IReadOnlyList<ScannerBasketDefinition>> GetConfiguredScannerBasketsAsync(
        SqliteConnection connection,
        CancellationToken cancellationToken)
    {
        await using var basketCommand = CreateCommand(
            connection,
            """
            SELECT Name, Enabled, MaxSymbols
            FROM ScannerBaskets
            ORDER BY Name ASC;
            """);

        var baskets = new List<ScannerBasketDefinition>();
        await using var reader = await basketCommand.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var name = reader.GetString(0);
            var instruments = await GetBasketInstrumentsAsync(connection, name, cancellationToken);
            baskets.Add(new ScannerBasketDefinition(
                name,
                reader.GetInt32(1) == 1,
                reader.GetInt32(2),
                instruments.Count,
                instruments));
        }

        return baskets;
    }

    private static async Task<IReadOnlyList<ScannerUniverseDefinition>> GetConfiguredScannerUniversesAsync(
        SqliteConnection connection,
        IReadOnlyList<ScannerBasketDefinition> baskets,
        IReadOnlyList<ScannerInstrumentDefinition> baseInstruments,
        CancellationToken cancellationToken)
    {
        await using var universeCommand = CreateCommand(
            connection,
            """
            SELECT Name, Enabled
            FROM ScannerUniverses
            ORDER BY Name ASC;
            """);

        var universes = new List<ScannerUniverseDefinition>();
        await using var reader = await universeCommand.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var name = reader.GetString(0);
            var basketNames = await GetUniverseBasketNamesAsync(connection, name, cancellationToken);
            var directInstruments = await GetUniverseInstrumentsAsync(connection, name, cancellationToken);
            var expanded = directInstruments
                .Concat(baskets.Where(basket => basketNames.Contains(basket.Name, StringComparer.OrdinalIgnoreCase))
                    .SelectMany(basket => basket.Instruments.Take(basket.MaxSymbols <= 0 ? int.MaxValue : basket.MaxSymbols)))
                .GroupBy(instrument => instrument.Key)
                .Select(group => group.First())
                .ToArray();

            universes.Add(new ScannerUniverseDefinition(
                name,
                reader.GetInt32(1) == 1,
                expanded.Length,
                basketNames,
                directInstruments,
                expanded));
        }

        if (universes.Count == 0 && (baseInstruments.Count > 0 || baskets.Count > 0))
        {
            var defaultInstruments = baseInstruments
                .Concat(baskets.Where(basket => basket.Enabled)
                    .SelectMany(basket => basket.Instruments.Take(basket.MaxSymbols <= 0 ? int.MaxValue : basket.MaxSymbols)))
                .GroupBy(instrument => instrument.Key)
                .Select(group => group.First())
                .ToArray();

            universes.Add(new ScannerUniverseDefinition(
                "Default",
                true,
                defaultInstruments.Length,
                baskets.Where(basket => basket.Enabled).Select(basket => basket.Name).ToArray(),
                baseInstruments,
                defaultInstruments));
        }

        return universes;
    }

    private static async Task<IReadOnlyList<ScannerInstrumentDefinition>> GetBasketInstrumentsAsync(
        SqliteConnection connection,
        string basketName,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(
            connection,
            """
            SELECT Symbol, Exchange, Isin, SecurityId
            FROM ScannerBasketInstruments
            WHERE BasketName = $basketName
            ORDER BY SortOrder ASC, Exchange ASC, Symbol ASC;
            """,
            ("$basketName", basketName));

        return await ReadInstrumentDefinitionsAsync(command, cancellationToken);
    }

    private static async Task<IReadOnlyList<ScannerInstrumentDefinition>> GetUniverseInstrumentsAsync(
        SqliteConnection connection,
        string universeName,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(
            connection,
            """
            SELECT Symbol, Exchange, Isin, SecurityId
            FROM ScannerUniverseInstruments
            WHERE UniverseName = $universeName
            ORDER BY SortOrder ASC, Exchange ASC, Symbol ASC;
            """,
            ("$universeName", universeName));

        return await ReadInstrumentDefinitionsAsync(command, cancellationToken);
    }

    private static async Task<IReadOnlyList<string>> GetUniverseBasketNamesAsync(
        SqliteConnection connection,
        string universeName,
        CancellationToken cancellationToken)
    {
        await using var command = CreateCommand(
            connection,
            """
            SELECT BasketName
            FROM ScannerUniverseBaskets
            WHERE UniverseName = $universeName
            ORDER BY SortOrder ASC, BasketName ASC;
            """,
            ("$universeName", universeName));

        var names = new List<string>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            names.Add(reader.GetString(0));
        }

        return names;
    }

    private static async Task<IReadOnlyList<ScannerInstrumentDefinition>> ReadInstrumentDefinitionsAsync(
        SqliteCommand command,
        CancellationToken cancellationToken)
    {
        var instruments = new List<ScannerInstrumentDefinition>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            instruments.Add(ToScannerInstrumentDefinition(reader));
        }

        return instruments;
    }

    private static ScannerInstrumentDefinition ToScannerInstrumentDefinition(SqliteDataReader reader)
    {
        var symbol = reader.GetString(0);
        var exchange = reader.GetString(1);
        return new ScannerInstrumentDefinition(
            symbol,
            exchange,
            GetString(reader, 2),
            GetString(reader, 3),
            $"{exchange}:{symbol}".ToUpperInvariant());
    }

    private async Task<SqliteConnection> OpenAsync(CancellationToken cancellationToken)
    {
        var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);
        return connection;
    }

    private static async Task EnsureSchemaAsync(SqliteConnection connection, CancellationToken cancellationToken)
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS ScannerRuns (
                Id TEXT PRIMARY KEY,
                SessionDate TEXT NOT NULL,
                StartedAtUtc TEXT NOT NULL,
                MarketDataProvider TEXT NOT NULL,
                AcceptedCount INTEGER NOT NULL,
                RejectedCount INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS CandidateDecisions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RunId TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Outcome TEXT NOT NULL,
                Direction TEXT NULL,
                Score REAL NOT NULL,
                ScoreModelVersion TEXT NULL,
                ScoreFactorsJson TEXT NULL,
                ReasonsJson TEXT NOT NULL,
                FinalVerdict TEXT NULL,
                VerdictReason TEXT NULL,
                CreatedAtUtc TEXT NOT NULL,
                FOREIGN KEY (RunId) REFERENCES ScannerRuns(Id)
            );

            CREATE TABLE IF NOT EXISTS NotificationAttempts (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                IdempotencyKey TEXT NOT NULL,
                Channel TEXT NOT NULL,
                Subject TEXT NOT NULL,
                Body TEXT NOT NULL,
                IsSuccess INTEGER NOT NULL,
                ErrorMessage TEXT NULL,
                AttemptedAtUtc TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS IX_NotificationAttempts_IdempotencyKey_IsSuccess
                ON NotificationAttempts (IdempotencyKey, IsSuccess);

            CREATE TABLE IF NOT EXISTS PreMarketRuns (
                Id TEXT PRIMARY KEY,
                SessionDate TEXT NOT NULL,
                StartedAtUtc TEXT NOT NULL,
                AcceptedCount INTEGER NOT NULL,
                RejectedCount INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS PreMarketDecisions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RunId TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Outcome TEXT NOT NULL,
                Direction TEXT NULL,
                Score REAL NOT NULL,
                ReasonsJson TEXT NOT NULL,
                CreatedAtUtc TEXT NOT NULL,
                FOREIGN KEY (RunId) REFERENCES PreMarketRuns(Id)
            );

            CREATE TABLE IF NOT EXISTS OpeningRangeRuns (
                Id TEXT PRIMARY KEY,
                SessionDate TEXT NOT NULL,
                StartedAtUtc TEXT NOT NULL,
                ConfirmedCount INTEGER NOT NULL,
                RejectedCount INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS OpeningRangeDecisions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RunId TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Outcome TEXT NOT NULL,
                Direction TEXT NULL,
                Score REAL NOT NULL,
                EntryPrice REAL NULL,
                StopPrice REAL NULL,
                TargetPrice REAL NULL,
                Quantity INTEGER NULL,
                NotionalAmount REAL NULL,
                PlannedRiskAmount REAL NULL,
                RiskRejectionReason TEXT NULL,
                RiskExplanation TEXT NULL,
                ReasonsJson TEXT NOT NULL,
                CreatedAtUtc TEXT NOT NULL,
                FOREIGN KEY (RunId) REFERENCES OpeningRangeRuns(Id)
            );

            CREATE TABLE IF NOT EXISTS LiveValidationRuns (
                Id TEXT PRIMARY KEY,
                SessionDate TEXT NOT NULL,
                StartedAtUtc TEXT NOT NULL,
                WindowStart TEXT NOT NULL,
                WindowEnd TEXT NOT NULL,
                ConfirmedCount INTEGER NOT NULL,
                RejectedCount INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS LiveValidationDecisions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RunId TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Outcome TEXT NOT NULL,
                Direction TEXT NULL,
                Score REAL NOT NULL,
                EntryPrice REAL NULL,
                StopPrice REAL NULL,
                TargetPrice REAL NULL,
                Quantity INTEGER NULL,
                NotionalAmount REAL NULL,
                PlannedRiskAmount REAL NULL,
                RiskRejectionReason TEXT NULL,
                RiskExplanation TEXT NULL,
                ReasonsJson TEXT NOT NULL,
                CreatedAtUtc TEXT NOT NULL,
                FOREIGN KEY (RunId) REFERENCES LiveValidationRuns(Id)
            );

            CREATE TABLE IF NOT EXISTS MonitorRuns (
                Id TEXT PRIMARY KEY,
                SessionDate TEXT NOT NULL,
                StartedAtUtc TEXT NOT NULL,
                WindowStart TEXT NOT NULL,
                WindowEnd TEXT NOT NULL,
                EventCount INTEGER NOT NULL,
                ActionableCount INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS MonitorEvents (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RunId TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Direction TEXT NULL,
                EntryPrice REAL NULL,
                StopPrice REAL NULL,
                TargetPrice REAL NULL,
                LatestPrice REAL NULL,
                LatestTimestampUtc TEXT NULL,
                Status TEXT NOT NULL,
                Reason TEXT NOT NULL,
                CreatedAtUtc TEXT NOT NULL,
                FOREIGN KEY (RunId) REFERENCES MonitorRuns(Id)
            );

            CREATE TABLE IF NOT EXISTS BacktestRuns (
                Id TEXT PRIMARY KEY,
                FromDate TEXT NOT NULL,
                ToDate TEXT NOT NULL,
                StartedAtUtc TEXT NOT NULL,
                SessionsEvaluated INTEGER NOT NULL,
                Signals INTEGER NOT NULL,
                Wins INTEGER NOT NULL,
                Losses INTEGER NOT NULL,
                Flats INTEGER NOT NULL,
                NoExitData INTEGER NOT NULL,
                WinRatePercent REAL NOT NULL,
                AverageReturnPercent REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS BacktestTrades (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RunId TEXT NOT NULL,
                SignalDate TEXT NOT NULL,
                ExitDate TEXT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Direction TEXT NOT NULL,
                EntryPrice REAL NOT NULL,
                ExitPrice REAL NULL,
                ReturnPercent REAL NULL,
                Outcome TEXT NOT NULL,
                Score REAL NOT NULL,
                FOREIGN KEY (RunId) REFERENCES BacktestRuns(Id)
            );

            CREATE TABLE IF NOT EXISTS PaperTradingRuns (
                Id TEXT PRIMARY KEY,
                SessionDate TEXT NOT NULL,
                StartedAtUtc TEXT NOT NULL,
                OrderCount INTEGER NOT NULL,
                OpenCount INTEGER NOT NULL,
                ClosedCount INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS PaperOrders (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RunId TEXT NOT NULL,
                SessionDate TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Direction TEXT NOT NULL,
                EntryPrice REAL NOT NULL,
                StopPrice REAL NOT NULL,
                TargetPrice REAL NULL,
                Quantity INTEGER NOT NULL,
                NotionalAmount REAL NOT NULL,
                PlannedRiskAmount REAL NOT NULL,
                Status TEXT NOT NULL,
                SourceStage TEXT NOT NULL,
                SourceReason TEXT NOT NULL,
                ExitDate TEXT NULL,
                ExitPrice REAL NULL,
                ReturnPercent REAL NULL,
                RealizedPnl REAL NULL,
                CreatedAtUtc TEXT NOT NULL,
                FOREIGN KEY (RunId) REFERENCES PaperTradingRuns(Id)
            );

            CREATE TABLE IF NOT EXISTS EventLog (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                EventType TEXT NOT NULL,
                Subject TEXT NOT NULL,
                PayloadJson TEXT NOT NULL,
                CreatedAtUtc TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS OutcomeFeedback (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                SessionDate TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Direction TEXT NOT NULL,
                Source TEXT NOT NULL,
                Recommendation TEXT NOT NULL,
                Outcome TEXT NOT NULL,
                ReturnPercent REAL NULL,
                Notes TEXT NOT NULL,
                CreatedAtUtc TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS AiAnalysisRuns (
                Id TEXT PRIMARY KEY,
                SessionDate TEXT NOT NULL,
                StartedAtUtc TEXT NOT NULL,
                DecisionCount INTEGER NOT NULL,
                TradeCandidateCount INTEGER NOT NULL,
                WatchlistCount INTEGER NOT NULL,
                NoTradeCount INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS AiAnalysisDecisions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                RunId TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Direction TEXT NOT NULL,
                Score REAL NOT NULL,
                Recommendation TEXT NOT NULL,
                ProbabilityPercent REAL NOT NULL,
                Confidence TEXT NOT NULL,
                Rationale TEXT NOT NULL,
                PromptVersion TEXT NOT NULL,
                ResponseJson TEXT NOT NULL,
                CreatedAtUtc TEXT NOT NULL,
                FOREIGN KEY (RunId) REFERENCES AiAnalysisRuns(Id)
            );

            CREATE TABLE IF NOT EXISTS ScannerInstruments (
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Isin TEXT NULL,
                SecurityId TEXT NULL,
                IsActive INTEGER NOT NULL,
                SortOrder INTEGER NOT NULL,
                UpdatedAtUtc TEXT NOT NULL,
                PRIMARY KEY (Symbol, Exchange)
            );

            CREATE TABLE IF NOT EXISTS ScannerBaskets (
                Name TEXT PRIMARY KEY,
                Enabled INTEGER NOT NULL,
                MaxSymbols INTEGER NOT NULL,
                UpdatedAtUtc TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ScannerBasketInstruments (
                BasketName TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Isin TEXT NULL,
                SecurityId TEXT NULL,
                SortOrder INTEGER NOT NULL,
                PRIMARY KEY (BasketName, Symbol, Exchange),
                FOREIGN KEY (BasketName) REFERENCES ScannerBaskets(Name)
            );

            CREATE TABLE IF NOT EXISTS ScannerUniverses (
                Name TEXT PRIMARY KEY,
                Enabled INTEGER NOT NULL,
                UpdatedAtUtc TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ScannerUniverseInstruments (
                UniverseName TEXT NOT NULL,
                Symbol TEXT NOT NULL,
                Exchange TEXT NOT NULL,
                Isin TEXT NULL,
                SecurityId TEXT NULL,
                SortOrder INTEGER NOT NULL,
                PRIMARY KEY (UniverseName, Symbol, Exchange),
                FOREIGN KEY (UniverseName) REFERENCES ScannerUniverses(Name)
            );

            CREATE TABLE IF NOT EXISTS ScannerUniverseBaskets (
                UniverseName TEXT NOT NULL,
                BasketName TEXT NOT NULL,
                SortOrder INTEGER NOT NULL,
                PRIMARY KEY (UniverseName, BasketName),
                FOREIGN KEY (UniverseName) REFERENCES ScannerUniverses(Name)
            );
            """;

        await ExecuteAsync(connection, sql, cancellationToken);
        await AddNullableColumnIfMissingAsync(connection, "PaperOrders", "ExitDate", "TEXT NULL", cancellationToken);
        await AddNullableColumnIfMissingAsync(connection, "PaperOrders", "ExitPrice", "REAL NULL", cancellationToken);
        await AddNullableColumnIfMissingAsync(connection, "PaperOrders", "ReturnPercent", "REAL NULL", cancellationToken);
        await AddNullableColumnIfMissingAsync(connection, "PaperOrders", "RealizedPnl", "REAL NULL", cancellationToken);
    }

    private static async Task AddNullableColumnIfMissingAsync(
        SqliteConnection connection,
        string tableName,
        string columnName,
        string definition,
        CancellationToken cancellationToken)
    {
        await using var info = CreateCommand(connection, $"PRAGMA table_info({tableName});");
        await using var reader = await info.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            if (string.Equals(reader.GetString(1), columnName, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
        }

        await ExecuteAsync(connection, $"ALTER TABLE {tableName} ADD COLUMN {columnName} {definition};", cancellationToken);
    }

    private async Task<IReadOnlyList<CandidateDecision>> GetLatestTradeCandidatesFromAsync(
        string runTable,
        string decisionTable,
        string datePredicate,
        DateOnly sessionDate,
        IReadOnlyList<Instrument> configuredInstruments,
        bool requirePrices,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var runCommand = CreateCommand(
            connection,
            $"SELECT Id FROM {runTable} WHERE {datePredicate} ORDER BY StartedAtUtc DESC LIMIT 1;",
            ("$sessionDate", DateText(sessionDate)));

        var runId = await runCommand.ExecuteScalarAsync(cancellationToken) as string;
        if (string.IsNullOrWhiteSpace(runId))
        {
            return [];
        }

        var hasPrices = decisionTable is "OpeningRangeDecisions" or "LiveValidationDecisions";
        var columns = hasPrices
            ? "Symbol, Exchange, Direction, Score, ReasonsJson, EntryPrice, StopPrice, TargetPrice"
            : "Symbol, Exchange, Direction, Score, ReasonsJson, NULL, NULL, NULL";
        var pricePredicate = requirePrices
            ? "AND EntryPrice IS NOT NULL AND StopPrice IS NOT NULL"
            : string.Empty;

        await using var command = CreateCommand(
            connection,
            $"""
            SELECT {columns}
            FROM {decisionTable}
            WHERE RunId = $runId
              AND Outcome = 'Accepted'
              AND Direction IS NOT NULL
              {pricePredicate}
            ORDER BY Score DESC, Symbol ASC;
            """,
            ("$runId", runId));

        var instrumentsByKey = configuredInstruments
            .GroupBy(instrument => instrument.Key)
            .ToDictionary(group => group.Key, group => group.First());
        var candidates = new List<CandidateDecision>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var symbol = reader.GetString(0);
            var exchange = Enum.Parse<Exchange>(reader.GetString(1), ignoreCase: true);
            if (!instrumentsByKey.TryGetValue($"{exchange}:{symbol}".ToUpperInvariant(), out var instrument))
            {
                continue;
            }

            candidates.Add(new CandidateDecision(
                instrument,
                DecisionOutcome.Accepted,
                Enum.Parse<CandidateDirection>(reader.GetString(2), ignoreCase: true),
                reader.GetDecimal(3),
                ParseReasons(reader.GetString(4)),
                EntryPrice: GetDecimal(reader, 5),
                StopPrice: GetDecimal(reader, 6),
                TargetPrice: GetDecimal(reader, 7)));
        }

        return candidates;
    }

    private async Task<IReadOnlyList<T>> GetSimpleRunsAsync<T>(
        string tableName,
        int limit,
        Func<SqliteDataReader, T> factory,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            $"SELECT Id, SessionDate, StartedAtUtc, AcceptedCount, RejectedCount FROM {tableName} ORDER BY StartedAtUtc DESC LIMIT $limit;",
            ("$limit", Limit(limit)));

        var runs = new List<T>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            runs.Add(factory(reader));
        }

        return runs;
    }

    private async Task<IReadOnlyList<PreMarketDecisionSummary>> GetSimpleDecisionsAsync(
        string tableName,
        string runId,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            $"SELECT Id, RunId, Symbol, Exchange, Outcome, Direction, Score, ReasonsJson, CreatedAtUtc FROM {tableName} WHERE RunId = $runId ORDER BY Score DESC, Symbol ASC;",
            ("$runId", runId));

        var decisions = new List<PreMarketDecisionSummary>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            decisions.Add(new PreMarketDecisionSummary(
                reader.GetInt64(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                GetString(reader, 5),
                reader.GetDecimal(6),
                reader.GetString(7),
                DateTimeOffset.Parse(reader.GetString(8))));
        }

        return decisions;
    }

    private async Task<IReadOnlyList<T>> GetTradeDecisionSummariesAsync<T>(
        string tableName,
        string runId,
        Func<SqliteDataReader, T> factory,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenAsync(cancellationToken);
        await using var command = CreateCommand(
            connection,
            $"""
            SELECT Id, RunId, Symbol, Exchange, Outcome, Direction, Score, EntryPrice, StopPrice, TargetPrice,
                   Quantity, NotionalAmount, PlannedRiskAmount, RiskRejectionReason, RiskExplanation, ReasonsJson, CreatedAtUtc
            FROM {tableName}
            WHERE RunId = $runId
            ORDER BY Score DESC, Symbol ASC;
            """,
            ("$runId", runId));

        var decisions = new List<T>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            decisions.Add(factory(reader));
        }

        return decisions;
    }

    private static async Task InsertEodDecisionAsync(
        SqliteConnection connection,
        string runId,
        CandidateDecision decision,
        RiskVerdict? verdict,
        CancellationToken cancellationToken) =>
        await ExecuteAsync(
            connection,
            """
            INSERT INTO CandidateDecisions
                (RunId, Symbol, Exchange, Outcome, Direction, Score, ScoreModelVersion, ScoreFactorsJson,
                 ReasonsJson, FinalVerdict, VerdictReason, CreatedAtUtc)
            VALUES
                ($runId, $symbol, $exchange, $outcome, $direction, $score, $scoreModelVersion, $scoreFactorsJson,
                 $reasonsJson, $finalVerdict, $verdictReason, $createdAtUtc);
            """,
            cancellationToken,
            ("$runId", runId),
            ("$symbol", decision.Instrument.Symbol),
            ("$exchange", decision.Instrument.Exchange.ToString()),
            ("$outcome", decision.Outcome.ToString()),
            ("$direction", Db(decision.Direction?.ToString())),
            ("$score", decision.Score),
            ("$scoreModelVersion", Db(decision.ScannerScore?.ModelVersion)),
            ("$scoreFactorsJson", Db(decision.ScannerScore is null ? null : JsonSerializer.Serialize(decision.ScannerScore.Factors))),
            ("$reasonsJson", ReasonsJson(decision.Reasons)),
            ("$finalVerdict", Db(verdict?.Verdict.ToString())),
            ("$verdictReason", Db(verdict?.Reason)),
            ("$createdAtUtc", NowText()));

    private static async Task InsertSimpleDecisionAsync(
        SqliteConnection connection,
        string tableName,
        string runId,
        CandidateDecision decision,
        CancellationToken cancellationToken) =>
        await ExecuteAsync(
            connection,
            $"""
            INSERT INTO {tableName}
                (RunId, Symbol, Exchange, Outcome, Direction, Score, ReasonsJson, CreatedAtUtc)
            VALUES
                ($runId, $symbol, $exchange, $outcome, $direction, $score, $reasonsJson, $createdAtUtc);
            """,
            cancellationToken,
            ("$runId", runId),
            ("$symbol", decision.Instrument.Symbol),
            ("$exchange", decision.Instrument.Exchange.ToString()),
            ("$outcome", decision.Outcome.ToString()),
            ("$direction", Db(decision.Direction?.ToString())),
            ("$score", decision.Score),
            ("$reasonsJson", ReasonsJson(decision.Reasons)),
            ("$createdAtUtc", NowText()));

    private static async Task InsertTradeDecisionAsync(
        SqliteConnection connection,
        string tableName,
        string runId,
        CandidateDecision decision,
        RiskSizingResult? riskResult,
        CancellationToken cancellationToken)
    {
        var tradePlan = riskResult?.TradePlan;
        await ExecuteAsync(
            connection,
            $"""
            INSERT INTO {tableName}
                (RunId, Symbol, Exchange, Outcome, Direction, Score, EntryPrice, StopPrice, TargetPrice,
                 Quantity, NotionalAmount, PlannedRiskAmount, RiskRejectionReason, RiskExplanation, ReasonsJson, CreatedAtUtc)
            VALUES
                ($runId, $symbol, $exchange, $outcome, $direction, $score, $entryPrice, $stopPrice, $targetPrice,
                 $quantity, $notionalAmount, $plannedRiskAmount, $riskRejectionReason, $riskExplanation, $reasonsJson, $createdAtUtc);
            """,
            cancellationToken,
            ("$runId", runId),
            ("$symbol", decision.Instrument.Symbol),
            ("$exchange", decision.Instrument.Exchange.ToString()),
            ("$outcome", decision.Outcome.ToString()),
            ("$direction", Db(decision.Direction?.ToString())),
            ("$score", decision.Score),
            ("$entryPrice", Db(decision.EntryPrice)),
            ("$stopPrice", Db(decision.StopPrice)),
            ("$targetPrice", Db(tradePlan?.TargetPrice ?? decision.TargetPrice)),
            ("$quantity", Db(tradePlan?.Quantity)),
            ("$notionalAmount", Db(tradePlan?.NotionalAmount)),
            ("$plannedRiskAmount", Db(tradePlan?.PlannedRiskAmount)),
            ("$riskRejectionReason", Db(riskResult?.RejectionReason.ToString())),
            ("$riskExplanation", Db(riskResult?.Explanation)),
            ("$reasonsJson", ReasonsJson(decision.Reasons)),
            ("$createdAtUtc", NowText()));
    }

    private static SqliteCommand CreateCommand(
        SqliteConnection connection,
        string commandText,
        params (string Name, object? Value)[] parameters)
    {
        var command = connection.CreateCommand();
        command.CommandText = commandText;
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, Db(value));
        }

        return command;
    }

    private static async Task ExecuteAsync(
        SqliteConnection connection,
        string commandText,
        CancellationToken cancellationToken,
        params (string Name, object? Value)[] parameters)
    {
        await using var command = CreateCommand(connection, commandText, parameters);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string ReasonsJson(IReadOnlyList<DecisionReason> reasons) =>
        JsonSerializer.Serialize(reasons.Select(reason => new
        {
            code = reason.Code.ToString(),
            reason.Description
        }));

    private static IReadOnlyList<DecisionReason> ParseReasons(string reasonsJson)
    {
        var reasons = new List<DecisionReason>();
        using var document = JsonDocument.Parse(reasonsJson);
        foreach (var item in document.RootElement.EnumerateArray())
        {
            var codeValue = item.GetProperty("code").GetString();
            var description = item.TryGetProperty("description", out var descriptionElement)
                ? descriptionElement.GetString() ?? string.Empty
                : string.Empty;

            if (Enum.TryParse<DecisionReasonCode>(codeValue, ignoreCase: true, out var code))
            {
                reasons.Add(new DecisionReason(code, description));
            }
        }

        return reasons;
    }

    private static bool IsActionable(SignalMonitoringResult result) =>
        result.Status is SignalMonitorStatus.TargetReached or SignalMonitorStatus.StopBreached or SignalMonitorStatus.Expired;

    private static object Db(object? value) => value ?? DBNull.Value;

    private static int Limit(int limit) => Math.Clamp(limit, 1, 100);

    private static string DateText(DateOnly date) => date.ToString("yyyy-MM-dd");

    private static string TimeText(TimeOnly time) => time.ToString("HH:mm");

    private static string NowText() => DateTimeOffset.UtcNow.ToString("O");

    private static string? GetString(SqliteDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);

    private static decimal? GetDecimal(SqliteDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? null : reader.GetDecimal(ordinal);

    private static DateOnly? GetDateOnly(SqliteDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? null : DateOnly.Parse(reader.GetString(ordinal));

    private static int? GetInt(SqliteDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? null : reader.GetInt32(ordinal);

    private static DateTimeOffset? GetDateTimeOffset(SqliteDataReader reader, int ordinal) =>
        reader.IsDBNull(ordinal) ? null : DateTimeOffset.Parse(reader.GetString(ordinal));
}
