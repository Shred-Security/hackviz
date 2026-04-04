# Web3HackViz — 2025–2026 Edition

Interactive educational platform for whitehat auditors, smart contract developers, and bug bounty hunters to study real-world Web3 exploits from 2025–2026.

## Covered Exploits

| # | Name | Chain | Type | Impact |
|---|------|-------|------|--------|
| 1 | Bybit | Ethereum | Supply Chain, Access Control | $1.46B |
| 2 | Cetus Protocol | Sui | Math Bug, Integer Overflow | $223M |
| 3 | GMX V1 | Arbitrum | Reentrancy, Access Control | $41M |
| 4 | Balancer V2 | Ethereum | Math Bug, Access Control | $126M |
| 5 | Drift Protocol | Solana | Oracle Manipulation, Access Control | $285M |
| 6 | Truebit Protocol | Ethereum | Access Control, Math Bug | $26M |
| 7 | CrossCurve Bridge | Multi-chain | Bridge, Access Control | $3M |
| 8 | Abracadabra Finance | Ethereum | Flash Loan, Math Bug | $13M |

## Features

- **Home page**: Searchable + filterable grid of hack cards with impact amounts
- **Detail page** with 6 tabs:
  - **Overview**: Plain-English and technical toggle, contract links
  - **Timeline**: Playable step-by-step scrubber with pseudocode
  - **Attack Flow**: Interactive React Flow graph (click nodes for details)
  - **Token Flow**: D3 force-directed animation of fund movement
  - **Lessons**: Mitigations + What-If Defender Mode + global audit checklist
  - **Quiz**: Per-exploit quiz with instant feedback, tracks Mastered status
- **Progress tracking**: Audited / Mastered badges stored in localStorage
- **Keyboard shortcut**: Space bar to advance to the next tab
- **Shareable links**: Copy URL button on each detail page

## Adding a New 2025–2026 Hack

1. Open `src/data/hacks.ts`
2. Add a new object to the `hacks` array following the `Web3Hack` type
3. Populate all required fields: `timeline` (5–7 steps), `attackFlow.nodes/edges`, `tokenFlowNodes/Links`, `mitigations`, and `quiz`
4. The hack card and detail page will appear automatically

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS (dark cyber theme)
- @xyflow/react (ReactFlow) — attack flow graphs
- D3.js — token flow force simulation
- Recharts (available for custom charts)
- wouter — client-side routing
- localStorage — progress persistence

## Educational Disclaimer

This platform is for **defensive learning only**. All data is sourced from public post-mortems, block explorers, and security researchers' published analyses. The goal is to help auditors and developers understand attack patterns so they can build more secure protocols.
