# HackViz

Interactive visualization platform for studying real-world Web3 security exploits. Built for security researchers, auditors, and developers to understand attack patterns and build more secure protocols.

## Overview

This monorepo contains educational tools for analyzing major cryptocurrency hacks and security incidents. The primary application is **Web3HackViz** - an interactive React-based visualization platform.

## Project Structure

```
hackviz/
├── artifacts/
│   └── web3hackviz/          # Main visualization app
│       ├── src/
│       │   ├── data/hacks.ts   # All hack data definitions
│       │   ├── pages/          # Route pages
│       │   └── components/   # UI components
│       └── README.md           # App-specific docs
├── lib/                        # Shared libraries
├── scripts/                    # Build/utility scripts
├── package.json               # Workspace root config
├── pnpm-workspace.yaml        # pnpm workspace definition
└── tsconfig.base.json         # Shared TypeScript config
```

## Quick Start

**Prerequisites:**
- Node.js 24+
- pnpm 10+

**Install dependencies:**
```bash
pnpm install
```

**Run development server:**
```bash
cd artifacts/web3hackviz
pnpm dev
```

**Type check entire workspace:**
```bash
pnpm run typecheck
```

**Build for production:**
```bash
pnpm run build
```

## Main Application: Web3HackViz

An interactive educational platform featuring:

- **Hack Cards**: Searchable/filterable grid of major exploits
- **Detail Pages** with 6 educational tabs:
  - **Overview**: Plain-English and technical explanations
  - **Timeline**: Step-by-step attack progression with pseudocode
  - **Attack Flow**: Interactive React Flow graph
  - **Token Flow**: D3 force-directed fund movement visualization
  - **Lessons**: Mitigations and defender strategies
  - **Quiz**: Knowledge testing per exploit
- **Progress Tracking**: Mastered/Audited badges via localStorage

### Covered Exploits (2025-2026)

| Hack | Chain | Type | Impact |
|------|-------|------|--------|
| Bybit | Ethereum | Supply Chain | $1.46B |
| Cetus Protocol | Sui | Integer Overflow | $223M |
| GMX V1 | Arbitrum | Reentrancy | $42M |
| Balancer V2 | Ethereum | Math Bug | $126M |
| Drift Protocol | Solana | Oracle Manipulation | $285M |
| Truebit Protocol | Ethereum | Access Control | $26M |
| CrossCurve Bridge | Multi-chain | Bridge Exploit | $3M |
| Abracadabra Finance | Ethereum | Flash Loan | $13M |

## Documentation

- [Adding a New Hack](ADDING_HACKS.md) - Complete guide for contributing new exploit data
- [Web3HackViz README](artifacts/web3hackviz/README.md) - App-specific details

## Tech Stack

- **Framework**: React 19 + Vite 6
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State**: React hooks + localStorage
- **Routing**: wouter
- **Visualizations**: 
  - @xyflow/react (attack flow graphs)
  - D3.js (token flow)
  - Recharts (charts)
- **Package Manager**: pnpm workspaces

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the [Adding a New Hack](ADDING_HACKS.md) guide for data contributions
4. Ensure `pnpm run typecheck` passes
5. Submit a pull request

## Disclaimer

This platform is for **defensive learning only**. All data is sourced from public post-mortems, block explorers, and published security research. The goal is to help auditors and developers understand attack patterns to build more secure protocols.
