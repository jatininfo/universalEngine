using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.ReadModels;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Domain.Scanning;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Infrastructure.Persistence;

public sealed class SqliteScannerRepository(IOptions<PersistenceOptions> options) :
    IScannerRepository,
    INotificationHistoryRepository
{
    private readonly string _connectionString = options.Value.ConnectionString;

    public async Task SaveEodRunAsync(
        EodCandidateGenerationResult result,
        IReadOnlyList<RiskVerdict> verdicts,
        string marketDataProvider,
        CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        var runId = Guid.NewGuid().ToString("N");
        await InsertRunAsync(connection, runId, result, marketDataProvider, cancellationToken);

        var verdictsByInstrument = verdicts.ToDictionary(verdict => verdict.Candidate.Instrument.Key);
        foreach (var decision in result.Decisions)
        {
            verdictsByInstrument.TryGetValue(decision.Instrument.Key, out var verdict);
            await InsertDecisionAsync(connection, runId, decision, verdict, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<ScannerRunSummary>> GetLatestRunsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, SessionDate, StartedAtUtc, MarketDataProvider, AcceptedCount, RejectedCount
            FROM ScannerRuns
            ORDER BY StartedAtUtc DESC
            LIMIT $limit;
            """;
        command.Parameters.AddWithValue("$limit", Math.Clamp(limit, 1, 100));

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
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, RunId, Symbol, Exchange, Outcome, Direction, Score, ScoreModelVersion,
                   ScoreFactorsJson, ReasonsJson, FinalVerdict, VerdictReason, CreatedAtUtc
            FROM CandidateDecisions
            WHERE RunId = $runId
            ORDER BY Score DESC, Symbol ASC;
            """;
        command.Parameters.AddWithValue("$runId", runId);

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
                reader.IsDBNull(5) ? null : reader.GetString(5),
                reader.GetDecimal(6),
                reader.IsDBNull(7) ? null : reader.GetString(7),
                reader.IsDBNull(8) ? null : reader.GetString(8),
                reader.GetString(9),
                reader.IsDBNull(10) ? null : reader.GetString(10),
                reader.IsDBNull(11) ? null : reader.GetString(11),
                DateTimeOffset.Parse(reader.GetString(12))));
        }

        return candidates;
    }

    public async Task<bool> HasSuccessfulNotificationAsync(
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT 1
            FROM NotificationAttempts
            WHERE IdempotencyKey = $idempotencyKey
              AND IsSuccess = 1
            LIMIT 1;
            """;
        command.Parameters.AddWithValue("$idempotencyKey", idempotencyKey);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is not null;
    }

    public async Task SaveNotificationAttemptAsync(
        NotificationAttempt attempt,
        CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO NotificationAttempts
                (IdempotencyKey, Channel, Subject, Body, IsSuccess, ErrorMessage, AttemptedAtUtc)
            VALUES
                ($idempotencyKey, $channel, $subject, $body, $isSuccess, $errorMessage, $attemptedAtUtc);
            """;
        command.Parameters.AddWithValue("$idempotencyKey", attempt.IdempotencyKey);
        command.Parameters.AddWithValue("$channel", attempt.Channel);
        command.Parameters.AddWithValue("$subject", attempt.Subject);
        command.Parameters.AddWithValue("$body", attempt.Body);
        command.Parameters.AddWithValue("$isSuccess", attempt.IsSuccess ? 1 : 0);
        command.Parameters.AddWithValue("$errorMessage", attempt.ErrorMessage ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("$attemptedAtUtc", attempt.AttemptedAtUtc.ToString("O"));

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<NotificationAttemptSummary>> GetLatestNotificationAttemptsAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await EnsureSchemaAsync(connection, cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT Id, IdempotencyKey, Channel, Subject, IsSuccess, ErrorMessage, AttemptedAtUtc
            FROM NotificationAttempts
            ORDER BY AttemptedAtUtc DESC
            LIMIT $limit;
            """;
        command.Parameters.AddWithValue("$limit", Math.Clamp(limit, 1, 100));

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
                reader.IsDBNull(5) ? null : reader.GetString(5),
                DateTimeOffset.Parse(reader.GetString(6))));
        }

        return attempts;
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
            """;

        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertRunAsync(
        SqliteConnection connection,
        string runId,
        EodCandidateGenerationResult result,
        string marketDataProvider,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO ScannerRuns
                (Id, SessionDate, StartedAtUtc, MarketDataProvider, AcceptedCount, RejectedCount)
            VALUES
                ($id, $sessionDate, $startedAtUtc, $marketDataProvider, $acceptedCount, $rejectedCount);
            """;
        command.Parameters.AddWithValue("$id", runId);
        command.Parameters.AddWithValue("$sessionDate", result.SessionDate.ToString("yyyy-MM-dd"));
        command.Parameters.AddWithValue("$startedAtUtc", DateTimeOffset.UtcNow.ToString("O"));
        command.Parameters.AddWithValue("$marketDataProvider", marketDataProvider);
        command.Parameters.AddWithValue("$acceptedCount", result.AcceptedCandidates.Count);
        command.Parameters.AddWithValue("$rejectedCount", result.RejectedCandidates.Count);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertDecisionAsync(
        SqliteConnection connection,
        string runId,
        CandidateDecision decision,
        RiskVerdict? verdict,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO CandidateDecisions
                (RunId, Symbol, Exchange, Outcome, Direction, Score, ScoreModelVersion, ScoreFactorsJson,
                 ReasonsJson, FinalVerdict, VerdictReason, CreatedAtUtc)
            VALUES
                ($runId, $symbol, $exchange, $outcome, $direction, $score, $scoreModelVersion, $scoreFactorsJson,
                 $reasonsJson, $finalVerdict, $verdictReason, $createdAtUtc);
            """;

        command.Parameters.AddWithValue("$runId", runId);
        command.Parameters.AddWithValue("$symbol", decision.Instrument.Symbol);
        command.Parameters.AddWithValue("$exchange", decision.Instrument.Exchange.ToString());
        command.Parameters.AddWithValue("$outcome", decision.Outcome.ToString());
        command.Parameters.AddWithValue("$direction", decision.Direction?.ToString() ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("$score", decision.Score);
        command.Parameters.AddWithValue("$scoreModelVersion", decision.ScannerScore?.ModelVersion ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("$scoreFactorsJson", decision.ScannerScore is null ? DBNull.Value : JsonSerializer.Serialize(decision.ScannerScore.Factors));
        command.Parameters.AddWithValue("$reasonsJson", JsonSerializer.Serialize(decision.Reasons.Select(reason => new
        {
            code = reason.Code.ToString(),
            reason.Description
        })));
        command.Parameters.AddWithValue("$finalVerdict", verdict?.Verdict.ToString() ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("$verdictReason", verdict?.Reason ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("$createdAtUtc", DateTimeOffset.UtcNow.ToString("O"));

        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
