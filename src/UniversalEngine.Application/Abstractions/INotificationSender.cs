namespace UniversalEngine.Application.Abstractions;

public interface INotificationSender
{
    Task SendAsync(string subject, string body, CancellationToken cancellationToken);
}
