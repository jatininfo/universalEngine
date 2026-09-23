using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Application.Abstractions;

public interface IInstrumentUniverseRepository
{
    Task<ScannerUniverseState> GetScannerUniverseStateAsync(CancellationToken cancellationToken);

    Task SaveScannerInstrumentsAsync(
        IReadOnlyList<ScannerInstrumentDefinition> instruments,
        CancellationToken cancellationToken);

    Task SaveScannerBasketsAsync(
        IReadOnlyList<ScannerBasketDefinition> baskets,
        CancellationToken cancellationToken);

    Task SaveScannerUniversesAsync(
        IReadOnlyList<ScannerUniverseDefinition> universes,
        CancellationToken cancellationToken);
}
