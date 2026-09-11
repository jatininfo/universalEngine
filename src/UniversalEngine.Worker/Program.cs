using UniversalEngine.Worker;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Application.Scanning;
using UniversalEngine.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.Configure<RiskOptions>(
    builder.Configuration.GetSection(RiskOptions.SectionName));
builder.Services.Configure<MarketDataOptions>(
    builder.Configuration.GetSection(MarketDataOptions.SectionName));
builder.Services.Configure<EodScannerOptions>(
    builder.Configuration.GetSection(EodScannerOptions.SectionName));
builder.Services.AddSingleton<EodCandidateGenerationService>();
builder.Services.AddUniversalEngineInfrastructure();
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
