namespace UniversalEngine.Application.Configuration;

public sealed class NotificationOptions
{
    public const string SectionName = "Notifications";

    public NotificationChannel Channel { get; set; } = NotificationChannel.Console;

    public bool SendEodWatchlistNotifications { get; set; } = true;

    public decimal MinimumEodScoreToNotify { get; set; } = 25m;

    public TelegramNotificationOptions Telegram { get; set; } = new();

    public EmailNotificationOptions Email { get; set; } = new();
}

public enum NotificationChannel
{
    Console = 1,
    Telegram = 2,
    Email = 3
}

public sealed class TelegramNotificationOptions
{
    public string? BotToken { get; set; }

    public string? ChatId { get; set; }
}

public sealed class EmailNotificationOptions
{
    public string? SmtpHost { get; set; }

    public int SmtpPort { get; set; } = 587;

    public bool UseSsl { get; set; } = true;

    public string? Username { get; set; }

    public string? Password { get; set; }

    public string? From { get; set; }

    public string? To { get; set; }
}
