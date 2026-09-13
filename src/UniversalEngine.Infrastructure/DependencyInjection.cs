using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.IO;
using System;
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
        services.AddHttpClient<YahooFinanceMarketDataProvider>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<AnalysisDataOptions>>().Value;
            client.BaseAddress = new Uri(options.Yahoo.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("UniversalEngine/1.0");
        });
        services.AddHttpClient<DhanMarketDataProvider>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<MarketDataOptions>>().Value;
            client.BaseAddress = new Uri(options.Dhan.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddHttpClient(nameof(BrokerConnectionVerifier));
        services.AddSingleton<IBrokerConnectionVerifier, BrokerConnectionVerifier>();
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
        services.AddSingleton<IAnalysisMarketDataProvider, AnalysisMarketDataProvider>();
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
        // Ensure SQLite uses a shared absolute file path across processes.
        services.AddSingleton<SqliteScannerRepository>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<PersistenceOptions>>().Value;

            // Normalize connection string: resolve relative file paths to a common location
            // Preference order: env var UNIVERSAL_ENGINE_DB_PATH, CommonApplicationData folder, current directory
            string connectionString = options.ConnectionString ?? "Data Source=universal-engine.db";
            const string dataSourcePrefix = "Data Source=";
            if (connectionString.StartsWith(dataSourcePrefix, StringComparison.OrdinalIgnoreCase))
            {
                var parts = connectionString.Substring(dataSourcePrefix.Length).Split(';', 2);
                var filePath = parts[0];
                var remaining = parts.Length > 1 ? ";" + parts[1] : string.Empty;

                if (!Path.IsPathRooted(filePath))
                {
                    var envPath = Environment.GetEnvironmentVariable("UNIVERSAL_ENGINE_DB_PATH");
                    string targetDir;
                    if (!string.IsNullOrWhiteSpace(envPath))
                    {
                        targetDir = envPath;
                    }
                    else
                    {
                        targetDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "UniversalEngine");
                    }

                    Directory.CreateDirectory(targetDir);
                    var fileName = Path.GetFileName(filePath);
                    var absolute = Path.Combine(targetDir, fileName);
                    // ensure common SQLite pragmas for multi-process access
                    connectionString = $"Data Source={absolute};Cache=Shared;Mode=ReadWriteCreate;Pooling=True{remaining}";
                }
            }

            var normalized = new PersistenceOptions
            {
                Provider = options.Provider,
                ConnectionString = connectionString
            };

            return new SqliteScannerRepository(Options.Create(normalized));
        });

        services.AddSingleton<IScannerRepository>(serviceProvider =>
            serviceProvider.GetRequiredService<SqliteScannerRepository>());
        services.AddSingleton<IBacktestReportRepository>(serviceProvider =>
            serviceProvider.GetRequiredService<SqliteScannerRepository>());
        services.AddSingleton<IPaperTradingRepository>(serviceProvider =>
            serviceProvider.GetRequiredService<SqliteScannerRepository>());
        services.AddSingleton<IAiAnalysisRepository>(serviceProvider =>
            serviceProvider.GetRequiredService<SqliteScannerRepository>());
        services.AddSingleton<IEventLogRepository>(serviceProvider =>
            serviceProvider.GetRequiredService<SqliteScannerRepository>());
        services.AddSingleton<INotificationHistoryRepository>(serviceProvider =>
            serviceProvider.GetRequiredService<SqliteScannerRepository>());

        return services;
    }
}
