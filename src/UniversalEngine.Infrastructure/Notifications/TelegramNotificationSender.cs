using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;

namespace UniversalEngine.Infrastructure.Notifications;

public sealed class TelegramNotificationSender(
    HttpClient httpClient,
    IOptions<NotificationOptions> options) : INotificationSender
{
    private readonly TelegramNotificationOptions _options = options.Value.Telegram;

    public async Task SendAsync(string subject, string body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.BotToken) || string.IsNullOrWhiteSpace(_options.ChatId))
        {
            throw new InvalidOperationException("Telegram notification requires Notifications:Telegram:BotToken and ChatId.");
        }

        var message = $"*{Escape(subject)}*{Environment.NewLine}{Escape(body)}";
        var url = $"https://api.telegram.org/bot{_options.BotToken}/sendMessage";

        using var response = await httpClient.PostAsJsonAsync(url, new
        {
            chat_id = _options.ChatId,
            text = message,
            parse_mode = "MarkdownV2"
        }, cancellationToken);

        response.EnsureSuccessStatusCode();
    }

    private static string Escape(string value)
    {
        var chars = new[] { "_", "*", "[", "]", "(", ")", "~", "`", ">", "#", "+", "-", "=", "|", "{", "}", ".", "!" };
        return chars.Aggregate(value, (current, character) => current.Replace(character, "\\" + character));
    }
}
