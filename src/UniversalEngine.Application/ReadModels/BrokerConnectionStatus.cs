namespace UniversalEngine.Application.ReadModels;

public sealed record BrokerConnectionStatus(
    string Broker,
    string Status,
    bool IsConfigured,
    bool IsConnected,
    string Message,
    DateTimeOffset CheckedAtUtc);
