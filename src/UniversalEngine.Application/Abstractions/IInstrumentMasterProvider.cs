using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Application.Abstractions;

public interface IInstrumentMasterProvider
{
    Task<IReadOnlyList<InstrumentLookupResult>> SearchAsync(
        string symbol,
        string? exchange,
        CancellationToken cancellationToken);
}
