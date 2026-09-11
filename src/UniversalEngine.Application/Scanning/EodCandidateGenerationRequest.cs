using UniversalEngine.Domain.Market;

namespace UniversalEngine.Application.Scanning;

public sealed record EodCandidateGenerationRequest(
    IReadOnlyList<Instrument> Instruments,
    DateOnly SessionDate);
