using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Configuration;

namespace UniversalEngine.Worker;

public sealed class TelegramBotDiagnostics(IOptions<NotificationOptions> options)
{
    private readonly TelegramNotificationOptions _options = options.Value.Telegram;

    public async Task<IReadOnlyList<TelegramChatUpdate>> GetRecentChatsAsync(CancellationToken cancellationToken)
    {
        EnsureBotToken();

        using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        var url = $"https://api.telegram.org/bot{_options.BotToken}/getUpdates";
        var response = await httpClient.GetFromJsonAsync<TelegramUpdatesResponse>(url, cancellationToken)
            ?? throw new InvalidOperationException("Telegram returned an empty getUpdates response.");

        if (!response.Ok)
        {
            throw new InvalidOperationException("Telegram getUpdates failed.");
        }

        return response.Result
            .Select(update => update.Message?.Chat)
            .Where(chat => chat is not null)
            .Select(chat => chat!)
            .GroupBy(chat => chat.Id)
            .Select(group => group.First())
            .Select(chat => new TelegramChatUpdate(
                chat.Id.ToString(),
                chat.Type ?? "unknown",
                chat.Title ?? chat.Username ?? chat.FirstName ?? "unknown"))
            .ToArray();
    }

    public async Task SendTestAsync(string? message, CancellationToken cancellationToken)
    {
        EnsureBotToken();
        if (string.IsNullOrWhiteSpace(_options.ChatId) || _options.ChatId.Contains("your-", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Telegram test requires Notifications:Telegram:ChatId in appsettings.Local.json.");
        }

        using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        var url = $"https://api.telegram.org/bot{_options.BotToken}/sendMessage";
        using var response = await httpClient.PostAsJsonAsync(url, new
        {
            chat_id = _options.ChatId,
            text = string.IsNullOrWhiteSpace(message)
                ? "UniversalEngine Telegram notification test. No order was placed."
                : message
        }, cancellationToken);

        response.EnsureSuccessStatusCode();
    }

    private void EnsureBotToken()
    {
        if (string.IsNullOrWhiteSpace(_options.BotToken))
        {
            throw new InvalidOperationException("Telegram bot token is missing. Set Notifications:Telegram:BotToken in appsettings.Local.json.");
        }
    }

    private sealed record TelegramUpdatesResponse(
        [property: JsonPropertyName("ok")] bool Ok,
        [property: JsonPropertyName("result")] List<TelegramUpdate> Result);

    private sealed record TelegramUpdate(
        [property: JsonPropertyName("message")] TelegramMessage? Message);

    private sealed record TelegramMessage(
        [property: JsonPropertyName("chat")] TelegramChat Chat);

    private sealed record TelegramChat(
        [property: JsonPropertyName("id")] long Id,
        [property: JsonPropertyName("type")] string? Type,
        [property: JsonPropertyName("title")] string? Title,
        [property: JsonPropertyName("username")] string? Username,
        [property: JsonPropertyName("first_name")] string? FirstName);
}

public sealed record TelegramChatUpdate(
    string ChatId,
    string ChatType,
    string DisplayName);
