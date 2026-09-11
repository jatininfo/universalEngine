# UniversalEngine

Notification-first NSE/BSE intraday opportunity scanner built in C#/.NET.

## Current Implementation

- Dhan, Zerodha, and Groww are modeled as configurable market-data providers.
- Dhan is the default primary provider.
- Capital and planned-risk limits are configurable.
- The first implemented slices cover solution bootstrap, domain models, risk sizing, provider configuration, EOD candidate generation, CSV daily-data replay, worker startup, and tests.
- The system does not place orders and does not store broker credentials.

## Implemented Scanner Slice

- `EodCandidateGenerationService` evaluates daily bars for liquidity, volume expansion, and close location.
- Accepted and rejected candidates include machine-readable reason codes.
- `CsvMarketDataProvider` can read local daily-bar fixtures when `MarketData:PrimaryProvider` is set to `Csv`.
- Live Dhan, Zerodha, and Groww adapters are intentionally not implemented yet; Dhan remains the default primary provider slot.

## Defaults

```json
{
  "MarketData": {
    "PrimaryProvider": "Dhan",
    "EnabledProviders": [ "Dhan", "Zerodha", "Groww" ]
  },
  "Risk": {
    "CapitalAmount": 20000,
    "MinPlannedRiskAmount": 200,
    "MaxPlannedRiskAmount": 400,
    "MaxActiveSignals": 3
  }
}
```

## Build and Test

```powershell
dotnet build UniversalEngine.slnx
dotnet test UniversalEngine.slnx
```
