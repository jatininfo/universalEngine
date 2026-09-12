using UniversalEngine.Application.Abstractions;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
builder.Services.Configure<MarketDataOptions>(
    builder.Configuration.GetSection(MarketDataOptions.SectionName));
builder.Services.Configure<PersistenceOptions>(
    builder.Configuration.GetSection(PersistenceOptions.SectionName));
builder.Services.AddUniversalEngineInfrastructure();

var app = builder.Build();

app.UseHttpsRedirection();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "UniversalEngine.Api"
}));

app.MapGet("/scanner/runs/latest", async (
    IScannerRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var runs = await repository.GetLatestRunsAsync(limit ?? 10, cancellationToken);
    return Results.Ok(runs);
});

app.MapGet("/scanner/runs/{runId}/candidates", async (
    string runId,
    IScannerRepository repository,
    CancellationToken cancellationToken) =>
{
    var candidates = await repository.GetCandidatesAsync(runId, cancellationToken);
    return Results.Ok(candidates);
});

app.MapGet("/notifications/attempts/latest", async (
    INotificationHistoryRepository repository,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var attempts = await repository.GetLatestNotificationAttemptsAsync(limit ?? 20, cancellationToken);
    return Results.Ok(attempts);
});

app.MapGet("/instruments/dhan/search", async (
    string symbol,
    string? exchange,
    IInstrumentMasterProvider instrumentMasterProvider,
    CancellationToken cancellationToken) =>
{
    var results = await instrumentMasterProvider.SearchAsync(symbol, exchange, cancellationToken);
    return Results.Ok(results);
});

app.Run();
