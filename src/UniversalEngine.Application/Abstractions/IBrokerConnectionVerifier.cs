using UniversalEngine.Application.ReadModels;

namespace UniversalEngine.Application.Abstractions;

public interface IBrokerConnectionVerifier
{
    Task<IReadOnlyList<BrokerConnectionStatus>> GetStatusesAsync(CancellationToken cancellationToken);
}
