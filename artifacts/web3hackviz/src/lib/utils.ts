import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExplorerTxUrl(hash: string, chain?: string): string {
  const c = chain?.toLowerCase();
  if (c === "solana") return `https://solscan.io/tx/${hash}`;
  if (c === "arbitrum") return `https://arbiscan.io/tx/${hash}`;
  if (c === "bsc" || c === "bnb chain") return `https://bscscan.com/tx/${hash}`;
  if (c === "base") return `https://basescan.org/tx/${hash}`;
  if (c === "optimism") return `https://optimistic.etherscan.io/tx/${hash}`;
  if (c === "polygon") return `https://polygonscan.com/tx/${hash}`;
  if (c === "avalanche") return `https://snowtrace.io/tx/${hash}`;
  if (c === "sui") return `https://suivision.xyz/tx/${hash}`;
  if (c === "near") return `https://nearblocks.io/txns/${hash}`;
  if (c === "solana" || hash.length >= 80) return `https://solscan.io/tx/${hash}`;
  return `https://etherscan.io/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string, chain?: string): string {
  const c = chain?.toLowerCase();
  if (c === "solana") return `https://solscan.io/account/${address}`;
  if (c === "arbitrum") return `https://arbiscan.io/address/${address}`;
  if (c === "bsc" || c === "bnb chain") return `https://bscscan.com/address/${address}`;
  if (c === "base") return `https://basescan.org/address/${address}`;
  if (c === "optimism") return `https://optimistic.etherscan.io/address/${address}`;
  if (c === "polygon") return `https://polygonscan.com/address/${address}`;
  if (c === "avalanche") return `https://snowtrace.io/address/${address}`;
  if (c === "sui") return `https://suivision.xyz/account/${address}`;
  return `https://etherscan.io/address/${address}`;
}
