using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Infrastructure.MarketData;
using UniversalEngine.Infrastructure.Notifications;

namespace UniversalEngine.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddUniversalEngineInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<ConfiguredMarketDataProvider>();
        services.AddSingleton<CsvMarketDataProvider>();
        services.AddSingleton<IMarketDataProvider>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<MarketDataOptions>>().Value;
            return options.PrimaryProvider == MarketDataProviderKind.Csv
                ? serviceProvider.GetRequiredService<CsvMarketDataProvider>()
                : serviceProvider.GetRequiredService<ConfiguredMarketDataProvider>();
        });
        services.AddSingleton<INotificationSender, ConsoleNotificationSender>();

        return services;
    }
}
