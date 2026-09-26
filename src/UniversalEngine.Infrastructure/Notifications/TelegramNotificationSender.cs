using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;

namespace UniversalEngine.Infrastructure.Notifications;

public sealed class TelegramNotificationSender(
    HttpClient httpClient,
    IOptionsMonitor<NotificationOptions> options) : INotificationSender
{
    public async Task SendAsync(string subject, string body, CancellationToken cancellationToken)
    {
        var telegramOptions = options.CurrentValue.Telegram;
        if (string.IsNullOrWhiteSpace(telegramOptions.BotToken) || string.IsNullOrWhiteSpace(telegramOptions.ChatId))
        {
            throw new InvalidOperationException("Telegram notification requires Notifications:Telegram:BotToken and ChatId.");
        }

        var message = $"*{Escape(subject)}*{Environment.NewLine}{Escape(body)}";
        var url = $"https://api.telegram.org/bot{telegramOptions.BotToken}/sendMessage";

        using var response = await httpClient.PostAsJsonAsync(url, new
        {
            chat_id = telegramOptions.ChatId,
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
