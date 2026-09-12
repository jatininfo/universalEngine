using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Infrastructure.MarketData;
using UniversalEngine.Infrastructure.Notifications;
using UniversalEngine.Infrastructure.Persistence;

namespace UniversalEngine.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddUniversalEngineInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<ConfiguredMarketDataProvider>();
        services.AddSingleton<CsvMarketDataProvider>();
        services.AddHttpClient<DhanMarketDataProvider>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<MarketDataOptions>>().Value;
            client.BaseAddress = new Uri(options.Dhan.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddHttpClient<DhanInstrumentMasterProvider>();
        services.AddSingleton<IInstrumentMasterProvider, DhanInstrumentMasterProvider>();
        services.AddSingleton<IMarketDataProvider>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<MarketDataOptions>>().Value;
            return options.PrimaryProvider switch
            {
                MarketDataProviderKind.Csv => serviceProvider.GetRequiredService<CsvMarketDataProvider>(),
                MarketDataProviderKind.Dhan => serviceProvider.GetRequiredService<DhanMarketDataProvider>(),
                _ => serviceProvider.GetRequiredService<ConfiguredMarketDataProvider>()
            };
        });
        services.AddSingleton<ConsoleNotificationSender>();
        services.AddHttpClient<TelegramNotificationSender>();
        services.AddSingleton<EmailNotificationSender>();
        services.AddSingleton<INotificationSender>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<NotificationOptions>>().Value;
            return options.Channel switch
            {
                NotificationChannel.Telegram => serviceProvider.GetRequiredService<TelegramNotificationSender>(),
                NotificationChannel.Email => serviceProvider.GetRequiredService<EmailNotificationSender>(),
                _ => serviceProvider.GetRequiredService<ConsoleNotificationSender>()
            };
        });
        services.AddSingleton<SqliteScannerRepository>();
        services.AddSingleton<IScannerRepository>(serviceProvider =>
            serviceProvider.GetRequiredService<SqliteScannerRepository>());
        services.AddSingleton<INotificationHistoryRepository>(serviceProvider =>
            serviceProvider.GetRequiredService<SqliteScannerRepository>());

        return services;
    }
}
