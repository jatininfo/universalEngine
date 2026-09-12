using Microsoft.Extensions.Options;
using UniversalEngine.Application.Configuration;
using UniversalEngine.Domain.Scanning;
using UniversalEngine.Domain.Trading;

namespace UniversalEngine.Application.Trading;

public sealed class RiskVerdictService(IOptions<NotificationOptions> notificationOptions)
{
    private readonly NotificationOptions _options = notificationOptions.Value;

    public RiskVerdict EvaluateEodCandidate(CandidateDecision candidate)
    {
        if (!candidate.IsAccepted)
        {
            return new RiskVerdict(FinalVerdict.NoTrade, "Candidate was rejected by scanner.", candidate);
        }

        if (candidate.Score < _options.MinimumEodScoreToNotify)
        {
            return new RiskVerdict(
                FinalVerdict.NoTrade,
                $"Scanner score {candidate.Score} is below notification threshold {_options.MinimumEodScoreToNotify}.",
                candidate);
        }

        return new RiskVerdict(
            FinalVerdict.Watchlist,
            "Candidate passed EOD scanner threshold. Opening-range and live validation are still required.",
            candidate);
    }
}
