import type { Hack } from "@/data/hacks";

const CHAIN_ALIASES: Record<string, string> = {
  BSC: "BNB Chain",
  EVM: "Ethereum",
  Haveno: "Monero",
  LayerZero: "Ethereum",
};

/** Explicit chain tags for hacks labeled Multi-chain or with vague chain fields. */
const HACK_CHAIN_TAGS: Record<string, string[]> = {
  "balancer-2025": ["Ethereum", "Arbitrum", "Polygon", "Optimism"],
  "iotex-iotube-2026": ["IoTeX", "Ethereum"],
  "kelp-dao-2026": ["Ethereum", "Arbitrum", "Base", "Optimism"],
  "phemex-2025": ["Solana", "Ethereum", "Base", "Avalanche"],
  "btcturk-2025": ["Ethereum", "Avalanche", "Arbitrum", "Base", "Optimism", "BNB Chain"],
  "uxlink-2025": ["Ethereum", "Arbitrum"],
  "bigone-2025": ["Ethereum", "BNB Chain"],
  "sbi-crypto-2025": ["Bitcoin", "Ethereum"],
  "poly-network-2021": ["Ethereum", "BNB Chain", "Polygon"],
  "wormhole-bridge-2022": ["Solana", "Ethereum"],
  "ronin-network-2022": ["Ronin"],
  "nomad-bridge-2022": ["Ethereum", "Moonbeam"],
  "kyberswap-2023": ["Ethereum", "Arbitrum", "Polygon", "Optimism", "BNB Chain", "Avalanche", "Base"],
  "stake-2023": ["Ethereum", "BNB Chain", "Polygon"],
  "bingx-2024": ["Ethereum", "BNB Chain", "Solana"],
  "dango-2026": ["Dango", "Ethereum"],
  "cow-swap-2026": ["Ethereum"],
  "grinex-2026": ["Ethereum", "TRON"],
  "wasabi-protocol-2026": ["Ethereum", "Arbitrum", "Base", "Blast"],
  "thorchain-2026": ["Bitcoin", "Ethereum", "BNB Chain", "Base"],
  "raydium-2026": ["Solana"],
};

const CHAIN_DISPLAY_ORDER = [
  "Ethereum",
  "Solana",
  "BNB Chain",
  "Sui",
  "Arbitrum",
  "Base",
  "Polygon",
  "Optimism",
  "Avalanche",
  "NEAR",
  "TRON",
  "TON",
  "Cosmos",
  "Polkadot",
  "Fantom",
  "HyperEVM",
  "MegaETH",
  "Monero",
  "Bitcoin",
  "IoTeX",
  "Moonbeam",
  "Ronin",
  "Blast",
  "Dango",
  "Multi-chain",
];

function normalizeChain(name: string): string {
  const trimmed = name.trim();
  return CHAIN_ALIASES[trimmed] ?? trimmed;
}

function splitChainLabel(chain: string): string[] {
  return chain.split("/").map(normalizeChain).filter(Boolean);
}

/** All chains a hack is associated with (for filtering and display). */
export function getHackChains(hack: Hack): string[] {
  if (hack.chains?.length) {
    return [...new Set(hack.chains.map(normalizeChain))];
  }

  if (HACK_CHAIN_TAGS[hack.id]) {
    return [...HACK_CHAIN_TAGS[hack.id]];
  }

  if (hack.chain === "Multi-chain") {
    return ["Multi-chain"];
  }

  if (hack.chain.includes("/")) {
    return [...new Set(splitChainLabel(hack.chain))];
  }

  return [normalizeChain(hack.chain)];
}

export function isMultiChainHack(hack: Hack): boolean {
  const chains = getHackChains(hack);
  return chains.length >= 3 || (hack.chain === "Multi-chain" && chains.length === 1);
}

/** Compact label for cards and headers. */
export function formatHackChains(hack: Hack): string {
  const chains = getHackChains(hack);

  if (chains.length === 1) {
    return chains[0];
  }

  if (chains.length === 2) {
    return chains.join(" · ");
  }

  if (isMultiChainHack(hack)) {
    return `Multi-chain · ${chains.slice(0, 2).join(", ")}`;
  }

  return `${chains[0]} +${chains.length - 1}`;
}

export function hackMatchesChain(hack: Hack, selectedChain: string | null): boolean {
  if (!selectedChain) return true;

  if (selectedChain === "Multi-chain") {
    return isMultiChainHack(hack);
  }

  return getHackChains(hack).includes(selectedChain);
}

export function hackMatchesChainSearch(hack: Hack, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return getHackChains(hack).some((chain) => chain.toLowerCase().includes(q));
}

export function getAvailableChains(hackList: Hack[]): string[] {
  const counts = new Map<string, number>();

  for (const hack of hackList) {
    for (const chain of getHackChains(hack)) {
      counts.set(chain, (counts.get(chain) ?? 0) + 1);
    }
    if (isMultiChainHack(hack)) {
      counts.set("Multi-chain", (counts.get("Multi-chain") ?? 0) + 1);
    }
  }

  const chains = [...counts.keys()].filter((chain) => chain !== "Multi-chain" || (counts.get("Multi-chain") ?? 0) > 0);

  return chains.sort((a, b) => {
    if (a === "Multi-chain") return 1;
    if (b === "Multi-chain") return -1;
    const orderA = CHAIN_DISPLAY_ORDER.indexOf(a);
    const orderB = CHAIN_DISPLAY_ORDER.indexOf(b);
    if (orderA !== -1 && orderB !== -1) return orderA - orderB;
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;
    return (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
  });
}
