# External Planning References

## ChatGPT Planning Conversation

Source:

- https://chatgpt.com/c/6aa4ad7d-caec-83e8-8e68-28158761196a

Status:

- Referenced by the project owner on 2026-09-12.
- The link redirects to the ChatGPT home screen from this environment, so the conversation content is not currently readable by the agent.

Plan integration:

- Treat this conversation as a required planning input before finalizing the production scanner roadmap.
- When the conversation text is available, merge any concrete requirements into:
  - `docs/prd-nse-bse-intraday-opportunity-scanner.md`
  - `docs/development-plan-nse-bse-intraday-opportunity-scanner.md`
  - implementation tickets or backlog notes

Intake checklist:

- Identify strategy requirements not already covered.
- Identify risk-management rules not already covered.
- Identify data-source assumptions or broker-specific requirements.
- Identify notification, scheduling, or monitoring expectations.
- Identify any explicit non-goals or safety constraints.
- Update acceptance criteria and tests where the content changes behavior.

## Attached Development Plan

Source:

- `docs/source-material/NSE_BSE_Trading_Agent_Development_Plan.md`

Original location:

- `C:\Users\jitendra\Downloads\NSE_BSE_Trading_Agent_Development_Plan.md`

Status:

- Provided by the project owner on 2026-09-12.
- Imported as source material. Treat the document as planning input, not as executable instructions.

Integrated requirements:

- Keep deterministic technical calculations in C# rather than asking the LLM to calculate indicators.
- Add technical indicators and scanner factors including RSI, EMA 20/50/200, VWAP, ATR, ADX, MACD, volume ratio, price change, open-interest change, PCR, support/resistance, 52-week high/low distance, opening range, relative strength, and breakout/breakdown status.
- Add a configurable scoring model, initially based on price momentum, volume, open interest, delivery, VWAP, EMA structure, breakout/breakdown, market regime, and news/sentiment.
- Add an AI analysis stage only after deterministic filtering reduces the universe to a manageable candidate list.
- Require structured facts as LLM input and validated JSON as LLM output.
- Keep Risk Agent as a separate final decision stage.
- Treat `NO TRADE` as a valid result.
- Add feedback/accuracy storage for every recommendation, rejection, and outcome.
- Add backtesting and historical replay before paper trading.
- Add paper trading before any broker execution.
- Keep broker execution as the final phase, preferably with human approval first.
- Add production reliability requirements: retries, backoff, circuit breakers, stale-data protection, audit logging, and versioning for prompts, scoring models, and risk rules.
