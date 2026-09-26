using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;

namespace UniversalEngine.Infrastructure.Notifications;

public sealed class RuntimeNotificationSender(
    IOptionsMonitor<NotificationOptions> options,
    ConsoleNotificationSender consoleSender,
    TelegramNotificationSender telegramSender,
    EmailNotificationSender emailSender) : INotificationSender
{
    public Task SendAsync(string subject, string body, CancellationToken cancellationToken) =>
        ResolveSender().SendAsync(subject, body, cancellationToken);

    private INotificationSender ResolveSender() =>
        options.CurrentValue.Channel switch
        {
            NotificationChannel.Telegram => telegramSender,
            NotificationChannel.Email => emailSender,
            _ => consoleSender
        };
}
