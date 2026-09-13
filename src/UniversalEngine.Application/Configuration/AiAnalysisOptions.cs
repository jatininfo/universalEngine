namespace UniversalEngine.Application.Configuration;

public sealed class AiAnalysisOptions
{
    public const string SectionName = "AiAnalysis";

    public bool Enabled { get; set; }

    public string Provider { get; set; } = "Disabled";

    public string PromptVersion { get; set; } = "ai-analysis-v1";

    public decimal MinimumTradeProbability { get; set; } = 60m;
}
