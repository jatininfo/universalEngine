using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;

namespace UniversalEngine.Infrastructure.Notifications;

public sealed class EmailNotificationSender(IOptions<NotificationOptions> options) : INotificationSender
{
    private readonly EmailNotificationOptions _options = options.Value.Email;

    public async Task SendAsync(string subject, string body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.SmtpHost) ||
            string.IsNullOrWhiteSpace(_options.From) ||
            string.IsNullOrWhiteSpace(_options.To))
        {
            throw new InvalidOperationException("Email notification requires SmtpHost, From, and To.");
        }

        using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.UseSsl
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);
        }

        using var message = new MailMessage(_options.From, _options.To, subject, body);
        await client.SendMailAsync(message, cancellationToken);
    }
}
