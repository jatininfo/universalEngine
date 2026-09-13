namespace UniversalEngine.Application.Ai;

public sealed record AiAnalysisRunResult(
    DateOnly SessionDate,
    IReadOnlyList<AiAnalysisDecision> Decisions);
