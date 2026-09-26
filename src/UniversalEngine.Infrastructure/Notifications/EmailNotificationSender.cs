using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;

namespace UniversalEngine.Infrastructure.Notifications;

public sealed class EmailNotificationSender(IOptionsMonitor<NotificationOptions> options) : INotificationSender
{
    public async Task SendAsync(string subject, string body, CancellationToken cancellationToken)
    {
        var emailOptions = options.CurrentValue.Email;
        if (string.IsNullOrWhiteSpace(emailOptions.SmtpHost) ||
            string.IsNullOrWhiteSpace(emailOptions.From) ||
            string.IsNullOrWhiteSpace(emailOptions.To))
        {
            throw new InvalidOperationException("Email notification requires SmtpHost, From, and To.");
        }

        using var client = new SmtpClient(emailOptions.SmtpHost, emailOptions.SmtpPort)
        {
            EnableSsl = emailOptions.UseSsl
        };

        if (!string.IsNullOrWhiteSpace(emailOptions.Username))
        {
            client.Credentials = new NetworkCredential(emailOptions.Username, emailOptions.Password);
        }

        using var message = new MailMessage(emailOptions.From, emailOptions.To, subject, body);
        await client.SendMailAsync(message, cancellationToken);
    }
}
