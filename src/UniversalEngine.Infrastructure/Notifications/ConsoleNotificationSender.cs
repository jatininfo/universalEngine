using Microsoft.Extensions.Logging;
using UniversalEngine.Application.Abstractions;

namespace UniversalEngine.Infrastructure.Notifications;

public sealed class ConsoleNotificationSender(ILogger<ConsoleNotificationSender> logger) : INotificationSender
{
    public Task SendAsync(string subject, string body, CancellationToken cancellationToken)
    {
        logger.LogInformation("Notification: {Subject}{NewLine}{Body}", subject, Environment.NewLine, body);
        return Task.CompletedTask;
    }
}
