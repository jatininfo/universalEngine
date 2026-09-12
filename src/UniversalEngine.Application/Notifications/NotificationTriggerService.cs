using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.Notifications;

public sealed class NotificationTriggerService(
    INotificationSender notificationSender,
    INotificationHistoryRepository notificationHistoryRepository,
    IOptions<NotificationOptions> notificationOptions)
{
    private readonly NotificationOptions _options = notificationOptions.Value;

    public async Task NotifyEodVerdictsAsync(
        IReadOnlyList<RiskVerdict> verdicts,
        DateOnly sessionDate,
        CancellationToken cancellationToken)
    {
        if (!_options.SendEodWatchlistNotifications)
        {
            return;
        }

        var watchlist = verdicts
            .Where(verdict => verdict.Verdict == FinalVerdict.Watchlist)
            .OrderByDescending(verdict => verdict.Candidate.Score)
            .ToArray();

        if (watchlist.Length == 0)
        {
            await SendOnceAsync(
                $"eod-watchlist:{sessionDate:yyyy-MM-dd}:no-trade",
                $"UniversalEngine EOD Watchlist {sessionDate:yyyy-MM-dd}: NO TRADE",
                "No EOD candidates passed the configured notification threshold. No order was placed.",
                cancellationToken);
            return;
        }

        var lines = watchlist.Select(verdict =>
        {
            var candidate = verdict.Candidate;
            var reasons = string.Join(", ", candidate.Reasons.Select(reason => reason.Code));
            return $"{candidate.Instrument.Key} {candidate.Direction} | Score {candidate.Score:0.##} | {candidate.ScannerScore?.ModelVersion ?? "n/a"} | {reasons}";
        });

        var body = string.Join(Environment.NewLine, lines) +
                   Environment.NewLine +
                   Environment.NewLine +
                   "Status: WATCHLIST only. Opening-range/live validation and risk sizing are still required. No order was placed.";

        await SendOnceAsync(
            $"eod-watchlist:{sessionDate:yyyy-MM-dd}:watchlist",
            $"UniversalEngine EOD Watchlist {sessionDate:yyyy-MM-dd}",
            body,
            cancellationToken);
    }

    public async Task NotifyTradePlansAsync(
        IReadOnlyList<RiskSizingResult> results,
        DateOnly sessionDate,
        CancellationToken cancellationToken)
    {
        var approved = results
            .Where(result => result.IsApproved && result.TradePlan is not null)
            .Select(result => result.TradePlan!)
            .ToArray();

        if (approved.Length == 0)
        {
            await SendOnceAsync(
                $"opening-range:{sessionDate:yyyy-MM-dd}:no-trade",
                $"UniversalEngine Opening Range {sessionDate:yyyy-MM-dd}: NO TRADE",
                "No opening-range candidates passed risk sizing. No order was placed.",
                cancellationToken);
            return;
        }

        var lines = approved.Select(plan =>
            $"{plan.Instrument.Key} {plan.Direction} | Entry {plan.EntryPrice:0.##} | Stop {plan.StopPrice:0.##} | Target {plan.TargetPrice:0.##} | Qty {plan.Quantity} | Risk {plan.PlannedRiskAmount:0.##} | Notional {plan.NotionalAmount:0.##}");

        var body = string.Join(Environment.NewLine, lines) +
                   Environment.NewLine +
                   Environment.NewLine +
                   "Status: TRADE CANDIDATE alert only. No order was placed.";

        await SendOnceAsync(
            $"opening-range:{sessionDate:yyyy-MM-dd}:trade-candidates",
            $"UniversalEngine Opening Range Trade Candidates {sessionDate:yyyy-MM-dd}",
            body,
            cancellationToken);
    }

    private async Task SendOnceAsync(
        string idempotencyKey,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        if (await notificationHistoryRepository.HasSuccessfulNotificationAsync(idempotencyKey, cancellationToken))
        {
            return;
        }

        try
        {
            await notificationSender.SendAsync(subject, body, cancellationToken);
            await SaveAttemptAsync(idempotencyKey, subject, body, isSuccess: true, errorMessage: null, cancellationToken);
        }
        catch (Exception ex)
        {
            await SaveAttemptAsync(idempotencyKey, subject, body, isSuccess: false, ex.Message, cancellationToken);
            throw;
        }
    }

    private Task SaveAttemptAsync(
        string idempotencyKey,
        string subject,
        string body,
        bool isSuccess,
        string? errorMessage,
        CancellationToken cancellationToken) =>
        notificationHistoryRepository.SaveNotificationAttemptAsync(
            new NotificationAttempt(
                idempotencyKey,
                _options.Channel.ToString(),
                subject,
                body,
                isSuccess,
                errorMessage,
                DateTimeOffset.UtcNow),
            cancellationToken);
}
