export interface TimelineStep {
  id: string;
  phase: string;
  description: string;
  functionsCall: string[];
  pseudocode: string;
  timestamp?: string;
}

export interface AttackFlowNode {
  id: string;
  type: "attacker" | "contract" | "pool" | "bridge" | "oracle" | "vault" | "result";
  label: string;
  detail: string;
  x: number;
  y: number;
}

export interface AttackFlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated?: boolean;
}

export interface TokenFlowNode {
  id: string;
  label: string;
  type: "attacker" | "vault" | "pool" | "bridge" | "multisig" | "drain";
  amount?: string;
}

export interface TokenFlowLink {
  source: string;
  target: string;
  value: number;
  label: string;
}

export interface Mitigation {
  category: string;
  description: string;
  code?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Hack {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  year: number;
  chain: string;
  type: string[];
  shortDesc: string;
  longDesc: string;
  technicalDesc: string;
  impact: string;
  impactUSD: number;
  contracts: Array<{ label: string; address: string; url: string }>;
  timeline: TimelineStep[];
  attackFlow: { nodes: AttackFlowNode[]; edges: AttackFlowEdge[] };
  tokenFlowNodes: TokenFlowNode[];
  tokenFlowLinks: TokenFlowLink[];
  mitigations: Mitigation[];
  quiz: QuizQuestion[];
}

export const hacks: Hack[] = [
  // 1. Bybit 2025
  {
    id: "bybit-2025",
    slug: "bybit-2025",
    title: "Bybit",
    subtitle: "Supply-Chain Attack on Signing Infrastructure",
    year: 2025,
    chain: "Ethereum",
    type: ["Supply Chain", "Access Control"],
    shortDesc:
      "Attackers compromised the Safe{Wallet} front-end via a supply-chain attack on Bybit's multi-sig signing infrastructure, draining ~$1.46 billion in ETH and stETH.",
    longDesc:
      "In February 2025, Bybit suffered the largest crypto theft in history. Attackers compromised the Safe{Wallet} web app served to Bybit's signers by injecting malicious JavaScript into Amazon S3 assets. When Bybit's three signers reviewed and approved what appeared to be a routine Safe transaction, the tampered front-end substituted the real calldata with a payload that upgraded the Safe's master-copy implementation to a malicious contract — transferring full control to the attacker. In a single transaction the attacker swept approximately $1.46 billion worth of ETH, stETH, and mETH.",
    technicalDesc:
      "The attacker poisoned the AWS S3-hosted JavaScript bundle for Safe{Wallet} used by Bybit. The malicious script overrode the `eth_sendTransaction` signing flow so that, while the UI showed legitimate calldata, the actual transaction called `upgradeTo(maliciousImpl)` on Bybit's Safe proxy. The malicious implementation set the attacker as the owner and called `sweepAll(attacker)`. Because all three co-signers approved the same disguised TX, the threshold was met and the Safe executed the upgrade atomically.",
    impact: "$1.46 billion",
    impactUSD: 1460000000,
    contracts: [
      {
        label: "Bybit Safe Proxy",
        address: "0x1Db92e2EeBC8E0c075a02BeA49a2935BcD2dFCF4",
        url: "https://etherscan.io/address/0x1Db92e2EeBC8E0c075a02BeA49a2935BcD2dFCF4",
      },
      {
        label: "Malicious Implementation",
        address: "0x96221423681A6d52E184D440a8eFCEbB105C7242",
        url: "https://etherscan.io/address/0x96221423681A6d52E184D440a8eFCEbB105C7242",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Reconnaissance",
        description:
          "Attackers (later attributed to Lazarus Group) study Bybit's custody infrastructure and identify the use of Safe{Wallet} with AWS S3-hosted front-end assets.",
        functionsCall: [],
        pseudocode: "// identify S3 bucket: bybit-safe-wallet-assets\n// AWS SSRF / credential leak allows write access",
        timestamp: "Days before",
      },
      {
        id: "t2",
        phase: "Supply-Chain Injection",
        description:
          "Malicious JavaScript is injected into the Safe{Wallet} S3 bucket. The script patches `eth_sendTransaction` to swap calldata silently.",
        functionsCall: ["fetch(s3_bundle_url)", "eval(patched_bundle)"],
        pseudocode:
          "window.ethereum.request = async (req) => {\n  if (req.method === 'eth_sendTransaction') {\n    req.params[0].data = UPGRADE_CALLDATA; // replace with malicious payload\n  }\n  return originalRequest(req);\n};",
      },
      {
        id: "t3",
        phase: "Signer Deception",
        description:
          "Three Bybit signers load the compromised Safe UI. Each sees a normal-looking ETH transfer in the UI but signs the malicious upgrade calldata.",
        functionsCall: ["Safe.approveHash(txHash)", "Safe.execTransaction()"],
        pseudocode:
          "// UI shows: transfer 100 ETH to known address\n// actual calldata:\n// safe.upgradeTo(maliciousImpl) + sweepAll(attacker)",
      },
      {
        id: "t4",
        phase: "Implementation Upgrade",
        description:
          "The Safe proxy's master-copy is silently changed to the attacker's malicious implementation contract.",
        functionsCall: ["SafeProxy.upgradeTo(maliciousImpl)"],
        pseudocode:
          "// maliciousImpl storage slot 0 = attacker address\n// override onlyOwner modifier → anyone can call sweepAll",
      },
      {
        id: "t5",
        phase: "Fund Drain",
        description:
          "Attacker calls sweepAll on the upgraded proxy, transferring all ETH, stETH, and mETH in one transaction.",
        functionsCall: ["maliciousImpl.sweepAll(attacker)"],
        pseudocode:
          "function sweepAll(address to) external {\n  to.call{value: address(this).balance}('');\n  IERC20(stETH).transfer(to, stETH.balanceOf(address(this)));\n}",
      },
      {
        id: "t6",
        phase: "Laundering",
        description:
          "Funds are dispersed to thousands of wallets via mixers (Tornado Cash forks, THORChain swaps) to obscure the trail.",
        functionsCall: [],
        pseudocode: "// distributed across >400 intermediate addresses\n// swapped ETH → BTC via THORChain",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Lazarus Group", detail: "State-sponsored DPRK threat actor", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "AWS S3 Bundle", detail: "Poisoned Safe{Wallet} JS bundle", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "Safe{Wallet} UI", detail: "Browser session of signers", x: 450, y: 100 },
        { id: "n4", type: "pool", label: "Bybit Safe Proxy", detail: "3-of-3 multisig, $1.46B", x: 450, y: 300 },
        { id: "n5", type: "contract", label: "Malicious Implementation", detail: "sweepAll() override", x: 650, y: 200 },
        { id: "n6", type: "result", label: "Attacker Wallet", detail: "$1.46B drained", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Inject JS payload" },
        { id: "e2", source: "n2", target: "n3", label: "Load poisoned bundle", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Signers approve malicious TX" },
        { id: "e4", source: "n4", target: "n5", label: "upgradeTo(maliciousImpl)" },
        { id: "e5", source: "n5", target: "n6", label: "sweepAll() drain", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Bybit Cold Wallet\n$1.46B", type: "vault" },
      { id: "b", label: "Safe Proxy\n(Upgraded)", type: "multisig" },
      { id: "c", label: "Attacker EOA", type: "attacker" },
      { id: "d", label: "Mixer / Bridge", type: "bridge" },
      { id: "e", label: "Final Destination", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1460, label: "ETH/stETH held" },
      { source: "b", target: "c", value: 1460, label: "sweepAll()" },
      { source: "c", target: "d", value: 1460, label: "Obfuscation" },
      { source: "d", target: "e", value: 1460, label: "Dispersed" },
    ],
    mitigations: [
      {
        category: "Supply-Chain Security",
        description: "Use Subresource Integrity (SRI) hashes for all externally loaded scripts. Pin specific content hashes rather than mutable CDN URLs.",
        code: '<script src="safe.js" integrity="sha256-abc123..."></script>',
      },
      {
        category: "Hardware Signing",
        description: "Use air-gapped signing devices that display the raw calldata and ABI-decoded function name on the device screen — not the browser.",
      },
      {
        category: "Transaction Simulation",
        description: "Before co-signers approve any Safe TX, simulate the transaction via Tenderly or an on-chain simulation contract and surface the decoded effects.",
      },
      {
        category: "Checks-Effects-Interactions",
        description: "Immutable proxy implementations (no upgradeTo) eliminate entire classes of upgrade attacks.",
      },
      {
        category: "Formal Verification",
        description: "Certora or Halmos specs can enforce that `upgradeTo` is unreachable after deployment.",
      },
    ],
    quiz: [
      {
        question: "What made Bybit's signers approve the malicious transaction?",
        options: [
          "A reentrancy bug in the Safe contract",
          "The UI displayed a normal transfer while the signed calldata was malicious",
          "The attacker had a private key leak",
          "A flash loan inflated the ETH balance",
        ],
        correct: 1,
        explanation: "The Safe{Wallet} front-end was tampered to show an innocent ETH transfer in the UI while the actual calldata performed upgradeTo(maliciousImpl).",
      },
      {
        question: "Which mitigation best addresses the root cause of the Bybit hack?",
        options: [
          "Reentrancy guard on the Safe contract",
          "Subresource Integrity checks on front-end scripts + hardware device calldata display",
          "Multi-factor authentication for signers",
          "Rate limiting on Safe.execTransaction()",
        ],
        correct: 1,
        explanation: "The root cause was a compromised front-end script. SRI hashes detect bundle tampering, and hardware display of raw calldata ensures signers see what they're actually signing.",
      },
      {
        question: "What on-chain action gave the attacker full control over the Safe?",
        options: [
          "addOwner() to add the attacker as a new signer",
          "changeThreshold(1) to reduce required signatures",
          "upgradeTo(maliciousImpl) replacing the proxy implementation",
          "fallback() trigger that bypassed owner checks",
        ],
        correct: 2,
        explanation: "The Safe is a proxy contract. By calling upgradeTo() the attacker replaced the implementation logic, effectively owning all assets without being an authorized owner.",
      },
    ],
  },

  // 2. Cetus Protocol 2025
  {
    id: "cetus-protocol-2025",
    slug: "cetus-protocol-2025",
    title: "Cetus Protocol",
    subtitle: "CLMM Integer Overflow — Sui Network",
    year: 2025,
    chain: "Sui",
    type: ["Math Bug", "Integer Overflow"],
    shortDesc:
      "An integer overflow in Cetus's Concentrated Liquidity Market Maker (CLMM) math library allowed an attacker to drain ~$223M in liquidity across multiple pools on Sui.",
    longDesc:
      "Cetus Protocol is the largest AMM / CLMM on the Sui blockchain. In May 2025 an attacker discovered that the price tick calculation in the CLMM math module was susceptible to integer overflow. By providing an extremely small liquidity amount at a carefully chosen tick boundary, the attacker caused the tick price calculation to overflow to a near-zero value, allowing them to swap vast amounts of tokens out of the pool for almost nothing. The exploit was executed across dozens of pools in under two minutes, draining approximately $223M.",
    technicalDesc:
      "Cetus CLMM tracks liquidity per tick using u128 arithmetic. The `get_delta_a` function computes the token amounts at each tick crossing. When the attacker supplied a crafted `liquidity_delta` near the u128 maximum, the intermediate multiplication `(sqrt_price_upper - sqrt_price_lower) * liquidity` overflowed silently (Move does not panic on overflow by default unless `checked_*` variants are used). The resulting near-zero delta_a made the pool believe large amounts of token A cost effectively zero. The attacker then executed a massive swap extracting the pool reserves.",
    impact: "$223 million",
    impactUSD: 223000000,
    contracts: [
      {
        label: "Cetus CLMM Package (Sui)",
        address: "0x1eabed72c53feb3805120a081dc15963c204dc8d0d0d8c55c9c1c2c7c3d3e3f3",
        url: "https://suiexplorer.com/object/0x1eabed72c53feb3805120a081dc15963c204dc8d0d0d8c55c9c1c2c7c3d3e3f3",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Research",
        description: "Attacker studies Cetus CLMM Move source code on-chain, identifying u128 arithmetic in get_delta_a().",
        functionsCall: [],
        pseudocode: "// key function: get_delta_a(sqrt_price_lower, sqrt_price_upper, liquidity_delta, round_up)\n// uses u128 multiply without checked_mul",
        timestamp: "Days before",
      },
      {
        id: "t2",
        phase: "Craft Overflow Input",
        description: "Attacker computes a liquidity_delta value that causes the intermediate product to wrap around u128::MAX.",
        functionsCall: ["compute_overflow_delta()"],
        pseudocode:
          "// target: (price_upper - price_lower) * liquidity_delta > u128::MAX\nlet liquidity_delta = u128::MAX / (price_upper - price_lower) + 1;\n// overflow → result wraps to ~0",
      },
      {
        id: "t3",
        phase: "Add Liquidity (Overflow Trigger)",
        description: "Attacker calls add_liquidity with the crafted delta, triggering the overflow and corrupting the pool's price state.",
        functionsCall: ["Pool::add_liquidity(overflow_delta, tick_lower, tick_upper)"],
        pseudocode:
          "// pool.sqrt_price_x64 is now corrupted\n// liquidity per tick reports near-zero cost for massive amounts",
      },
      {
        id: "t4",
        phase: "Swap Exploit",
        description: "With the corrupted price state, attacker swaps near-zero input tokens for the pool's full reserve of the target token.",
        functionsCall: ["Pool::swap(1_token_in, true, max_slippage)"],
        pseudocode:
          "// Pool believes 1 unit of tokenA costs 0 units of tokenB\n// attacker sends 1 tokenA, receives entire tokenB reserve",
      },
      {
        id: "t5",
        phase: "Multi-Pool Repeat",
        description: "Attacker repeats across 39 different Cetus pools in rapid succession before any circuit breaker fires.",
        functionsCall: [],
        pseudocode: "for pool in CETUS_POOLS:\n    trigger_overflow(pool)\n    drain_pool(pool)",
      },
      {
        id: "t6",
        phase: "Governance Pause",
        description: "Cetus team detects anomaly and calls emergency pause. Sui validators coordinate a controversial whitelist transaction to freeze stolen SUI.",
        functionsCall: ["AdminCap::pause_all_pools()", "SuiValidators::freeze_tx()"],
        pseudocode: "// ~$162M frozen by Sui validator intervention\n// ~$61M USDC bridged to Ethereum before pause",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker EOA", detail: "Crafted overflow transactions", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "CLMM Math Library", detail: "get_delta_a() overflow", x: 250, y: 100 },
        { id: "n3", type: "pool", label: "Cetus Pool (x39)", detail: "Liquidity reserves ~$223M", x: 450, y: 200 },
        { id: "n4", type: "contract", label: "Swap Module", detail: "Pool::swap()", x: 650, y: 100 },
        { id: "n5", type: "result", label: "Attacker Wallets", detail: "$61M escaped; $162M frozen", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Overflow liquidity_delta", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Corrupt sqrt_price" },
        { id: "e3", source: "n1", target: "n4", label: "swap(1 token)" },
        { id: "e4", source: "n3", target: "n4", label: "Report near-zero cost" },
        { id: "e5", source: "n4", target: "n5", label: "Drain reserve", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Cetus Pools\n$223M", type: "pool" },
      { id: "b", label: "CLMM Math\n(Overflowed)", type: "vault" },
      { id: "c", label: "Attacker Wallet", type: "attacker" },
      { id: "d", label: "Sui Frozen Funds\n$162M", type: "vault" },
      { id: "e", label: "Bridged to ETH\n$61M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 223, label: "Liquidity" },
      { source: "b", target: "c", value: 223, label: "Overflow swap" },
      { source: "c", target: "d", value: 162, label: "Frozen by validators" },
      { source: "c", target: "e", value: 61, label: "Escaped" },
    ],
    mitigations: [
      {
        category: "Safe Arithmetic",
        description: "Use checked_mul and checked_add in Move (or Rust/Solidity equivalents). Always verify arithmetic cannot overflow before computing.",
        code: "let product = (price_upper - price_lower).checked_mul(liquidity_delta)\n    .expect('overflow in get_delta_a');",
      },
      {
        category: "Invariant Checks",
        description: "Assert post-conditions after any liquidity addition: pool reserves must be >= pre-operation reserves minus delta.",
      },
      {
        category: "Fuzz Testing",
        description: "Fuzz arithmetic functions with extreme u128 boundary values (0, 1, u128::MAX, u128::MAX-1) as part of CI.",
      },
      {
        category: "Formal Verification",
        description: "Formally verify all arithmetic helper functions using Move Prover or Certora to prove absence of overflow on valid inputs.",
      },
    ],
    quiz: [
      {
        question: "What was the root cause of the Cetus Protocol exploit?",
        options: [
          "Reentrancy in the swap function",
          "Unchecked integer overflow in CLMM tick price calculation",
          "Oracle price manipulation",
          "Compromised admin private key",
        ],
        correct: 1,
        explanation: "The get_delta_a() function performed u128 multiplication without overflow checks. A crafted liquidity_delta wrapped the product to ~0, making swaps appear to cost nothing.",
      },
      {
        question: "What controversial recovery action did the Sui network take?",
        options: [
          "A hard fork to reverse the transactions",
          "Validators coordinated a whitelist transaction to freeze ~$162M of stolen funds",
          "The attacker voluntarily returned funds after negotiation",
          "Cetus deployed a drain-back contract to recover funds",
        ],
        correct: 1,
        explanation: "Sui validators used their privileged capabilities to freeze approximately $162M in stolen assets before they could be moved, a move that sparked debate about blockchain immutability.",
      },
    ],
  },

  // 3. GMX V1 2025
  {
    id: "gmx-v1-2025",
    slug: "gmx-v1-2025",
    title: "GMX V1",
    subtitle: "Cross-Contract Reentrancy on Arbitrum",
    year: 2025,
    chain: "Arbitrum",
    type: ["Reentrancy", "Access Control"],
    shortDesc:
      "A cross-contract reentrancy vulnerability in GMX V1's Vault and Router contracts on Arbitrum enabled an attacker to drain approximately $41M by re-entering a deposit callback.",
    longDesc:
      "GMX is one of the largest perpetual DEXes on Arbitrum. In 2025 a white-hat researcher published a bug report describing a cross-contract reentrancy in the Vault.deposit() flow where an ERC-777 or callback-enabled token triggered a re-entry path through the Router before the Vault updated its internal accounting. Black-hat actors exploited this before the team could patch, draining around $41M in WETH and USDC.",
    technicalDesc:
      "GMX V1 Vault calls `token.safeTransferFrom(user, vault, amount)` before updating `vault.tokenBalances[token]`. For a malicious ERC-777 token (or any EIP-2612 permit-style token with a receive-hook), the transfer triggers the attacker's `tokensReceived()` callback. The callback re-enters `Router.increasePosition()` which reads `vault.tokenBalances[token]` — still showing the pre-deposit value — and allows opening a leveraged position with a stale (lower) collateral figure. After the callback, the Vault updates balances and the position remains open with under-reported collateral, which the attacker then closes for profit.",
    impact: "$41 million",
    impactUSD: 41000000,
    contracts: [
      {
        label: "GMX Vault (Arbitrum)",
        address: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
        url: "https://arbiscan.io/address/0x489ee077994B6658eAfA855C308275EAd8097C4A",
      },
      {
        label: "GMX Router (Arbitrum)",
        address: "0xaBBc5F99639c9B6bCb58544ddf04cf3C4C55c2d7",
        url: "https://arbiscan.io/address/0xaBBc5F99639c9B6bCb58544ddf04cf3C4C55c2d7",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Craft Callback Token",
        description: "Attacker deploys a malicious ERC-777 token with a custom tokensReceived() hook that re-enters GMX contracts.",
        functionsCall: ["MaliciousToken.deploy()"],
        pseudocode:
          "contract MaliciousToken is ERC777 {\n  function tokensReceived(...) external {\n    // re-enter GMX Router here\n    router.increasePosition(...);\n  }\n}",
      },
      {
        id: "t2",
        phase: "Initial Deposit",
        description: "Attacker calls GMX Vault.directPoolDeposit() with the malicious token, triggering safeTransferFrom.",
        functionsCall: ["Vault.directPoolDeposit(maliciousToken, amount)"],
        pseudocode:
          "// Vault does: IERC20(token).safeTransferFrom(sender, vault, amount)\n// maliciousToken.tokensReceived() fires BEFORE vault balance update",
      },
      {
        id: "t3",
        phase: "Reentrancy",
        description: "Inside tokensReceived(), attacker re-enters Router.increasePosition reading stale vault.tokenBalances.",
        functionsCall: ["Router.increasePosition(WETH, size=10x, staleCollateral)"],
        pseudocode:
          "// vault.tokenBalances[token] not yet updated\n// position collateral understated\n// attacker opens 10x leveraged long with inflated apparent margin",
      },
      {
        id: "t4",
        phase: "Balance Update (too late)",
        description: "Vault finally updates tokenBalances after transfer completes, but the position is already open.",
        functionsCall: ["Vault._updateTokenBalance(token)"],
        pseudocode: "// now vault shows correct balance\n// but malicious position already recorded",
      },
      {
        id: "t5",
        phase: "Close Position",
        description: "Attacker decreases position, receiving far more WETH/USDC than collateral deposited due to understated initial collateral.",
        functionsCall: ["Router.decreasePosition(positionKey, maxProfit)"],
        pseudocode: "// Vault calculates PnL against stale entry collateral\n// realizedPnL >> actualDeposit",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker EOA", detail: "Holds malicious ERC-777 token", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Malicious Token", detail: "tokensReceived() callback", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "GMX Vault", detail: "Stale balance during callback", x: 450, y: 200 },
        { id: "n4", type: "contract", label: "GMX Router", detail: "increasePosition(staleCollateral)", x: 650, y: 100 },
        { id: "n5", type: "pool", label: "GMX Liquidity Pool", detail: "$41M WETH/USDC", x: 650, y: 300 },
        { id: "n6", type: "result", label: "Attacker Profit", detail: "~$41M extracted", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n3", label: "directPoolDeposit()" },
        { id: "e2", source: "n3", target: "n2", label: "safeTransferFrom()", animated: true },
        { id: "e3", source: "n2", target: "n4", label: "re-enter Router", animated: true },
        { id: "e4", source: "n4", target: "n3", label: "read stale balance" },
        { id: "e5", source: "n4", target: "n5", label: "open large position" },
        { id: "e6", source: "n5", target: "n6", label: "decreasePosition profit", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Attacker\n(Malicious Token)", type: "attacker" },
      { id: "b", label: "GMX Vault\n(Stale Balance)", type: "vault" },
      { id: "c", label: "Position\n(Understated Collateral)", type: "pool" },
      { id: "d", label: "Attacker Profit\n~$41M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1, label: "deposit()" },
      { source: "b", target: "c", value: 410, label: "open 10x position" },
      { source: "c", target: "d", value: 41, label: "close with profit" },
    ],
    mitigations: [
      {
        category: "Reentrancy Guard",
        description: "Apply nonReentrant modifier to ALL state-mutating Vault and Router functions.",
        code: "modifier nonReentrant() {\n  require(!locked, 'REENTRANT');\n  locked = true;\n  _;\n  locked = false;\n}",
      },
      {
        category: "Checks-Effects-Interactions",
        description: "Update internal accounting (tokenBalances) BEFORE calling external token transfer functions.",
        code: "// CORRECT ORDER:\nvault.tokenBalances[token] += amount; // effect first\nIERC20(token).safeTransferFrom(sender, vault, amount); // interaction last",
      },
      {
        category: "Token Allowlist",
        description: "Only allow vetted ERC-20 tokens (without callback hooks) as collateral. Explicitly block ERC-777 and rebasing tokens.",
      },
    ],
    quiz: [
      {
        question: "Which Solidity pattern would directly prevent the GMX V1 reentrancy attack?",
        options: [
          "Using SafeMath for arithmetic",
          "Updating vault.tokenBalances BEFORE calling safeTransferFrom (Checks-Effects-Interactions)",
          "Adding a timelock to withdrawals",
          "Using a TWAP oracle instead of spot price",
        ],
        correct: 1,
        explanation: "The Checks-Effects-Interactions pattern requires updating internal state before interacting with external contracts. Moving the balance update before safeTransferFrom removes the window for reentrancy.",
      },
    ],
  },

  // 4. Balancer V2 2025
  {
    id: "balancer-v2-2025",
    slug: "balancer-v2-2025",
    title: "Balancer V2",
    subtitle: "Rounding Error + Access Control Bypass",
    year: 2025,
    chain: "Ethereum",
    type: ["Math Bug", "Access Control"],
    shortDesc:
      "Systematic exploitation of rounding-direction errors in Balancer V2's weighted pool math combined with an access control gap in the protocol fee collection module drained ~$126M.",
    longDesc:
      "Balancer V2 introduced a protocol fee mechanism where fees accrue in a separate FeeCollector contract. A subtle rounding direction inconsistency in the pool math — where the pool rounded down on amounts owed but the fee collector rounded up on amounts collectible — created a tiny per-transaction surplus. An attacker industrialized this through flash loans, executing hundreds of thousands of micro-swaps in a single transaction to amplify the rounding surplus into a meaningful drain. A secondary access control gap allowed the attacker to call the fee collection harvest without going through the expected governance timelock.",
    technicalDesc:
      "In Balancer V2 WeightedPool, the invariant calculation uses FixedPoint.mulDown() when crediting the user and FixedPoint.mulUp() when debiting the protocol fee. Over thousands of operations, mulUp consistently overestimates what the fee collector is owed. The attacker used a flash loan to maximize capital efficiency and looped swap→collect for 80,000 iterations in a single block. Additionally, the FeeCollector.harvest() function lacked a `onlyGovernance` guard that the team assumed was enforced by an off-chain keeper — allowing the attacker to call it directly.",
    impact: "$126 million",
    impactUSD: 126000000,
    contracts: [
      {
        label: "Balancer Vault (ETH)",
        address: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        url: "https://etherscan.io/address/0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      },
      {
        label: "ProtocolFeeCollector",
        address: "0xce88686553686DA562CE7Cea497CE749DA109f9F",
        url: "https://etherscan.io/address/0xce88686553686DA562CE7Cea497CE749DA109f9F",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Flash Loan",
        description: "Attacker borrows $500M USDC via Aave flash loan to maximize swap volume.",
        functionsCall: ["Aave.flashLoan(USDC, 500_000_000)"],
        pseudocode: "aave.flashLoan(address(this), USDC, 500e6, '');",
      },
      {
        id: "t2",
        phase: "Micro-Swap Loop",
        description: "80,000 swaps in the same transaction, each triggering a rounding surplus in the fee collector.",
        functionsCall: ["Vault.swap(singleSwap, funds, limit, deadline) x80000"],
        pseudocode:
          "for (uint i = 0; i < 80_000; i++) {\n  vault.swap(swapStruct, funds, 0, deadline);\n  // each swap: mulUp(fee) > mulDown(user) → ~$1500 surplus per swap\n}",
      },
      {
        id: "t3",
        phase: "Unauthorized Harvest",
        description: "Attacker calls FeeCollector.harvest() directly, collecting the accumulated surplus without governance authorization.",
        functionsCall: ["FeeCollector.harvest(USDC)"],
        pseudocode: "// No onlyGovernance modifier!\nfunction harvest(IERC20 token) external {\n  token.transfer(msg.sender, token.balanceOf(address(this)));\n}",
      },
      {
        id: "t4",
        phase: "Repay Flash Loan",
        description: "Attacker repays Aave flash loan, keeping the ~$126M net profit.",
        functionsCall: ["USDC.transfer(aave, flashLoanAmount + fee)"],
        pseudocode: "usdc.transfer(aave, 500_000_000 + flashLoanFee);\n// net profit: ~$126M",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Flash loan orchestrator", x: 50, y: 200 },
        { id: "n2", type: "bridge", label: "Aave Flash Loan", detail: "$500M USDC", x: 250, y: 100 },
        { id: "n3", type: "pool", label: "Balancer Vault", detail: "80,000 swaps, rounding surplus", x: 450, y: 200 },
        { id: "n4", type: "contract", label: "FeeCollector", detail: "harvest() — no auth", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker Profit", detail: "~$126M", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "borrow $500M" },
        { id: "e2", source: "n2", target: "n1", label: "USDC" },
        { id: "e3", source: "n1", target: "n3", label: "80,000 swaps", animated: true },
        { id: "e4", source: "n3", target: "n4", label: "Rounding surplus accumulates" },
        { id: "e5", source: "n1", target: "n4", label: "harvest() (no guard)", animated: true },
        { id: "e6", source: "n4", target: "n5", label: "$126M collected" },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Aave\n$500M Flash", type: "bridge" },
      { id: "b", label: "Balancer Pools", type: "pool" },
      { id: "c", label: "FeeCollector", type: "vault" },
      { id: "d", label: "Attacker\n$126M profit", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 500, label: "flashLoan()" },
      { source: "b", target: "c", value: 126, label: "rounding surplus" },
      { source: "b", target: "a", value: 500, label: "repay" },
      { source: "c", target: "d", value: 126, label: "harvest()" },
    ],
    mitigations: [
      {
        category: "Consistent Rounding",
        description: "Always round in the direction that favors the protocol, not the caller. Use mulDown for amounts given to users; use mulDown (not mulUp) for fee calculations when that benefits the pool.",
      },
      {
        category: "Access Control",
        description: "Add onlyGovernance or onlyRole(HARVESTER_ROLE) modifier to all fee collection functions. Never rely on off-chain enforcement for on-chain security.",
        code: "function harvest(IERC20 token) external onlyRole(HARVESTER_ROLE) {\n  // ...\n}",
      },
      {
        category: "Flash Loan Mitigation",
        description: "Implement per-block swap volume limits or cooldown periods to prevent industrialised micro-swap loops in a single transaction.",
      },
    ],
    quiz: [
      {
        question: "What two vulnerabilities combined to make the Balancer V2 attack successful?",
        options: [
          "Reentrancy and oracle manipulation",
          "Rounding direction inconsistency and missing access control on harvest()",
          "Integer overflow and flash loan price impact",
          "Governance attack and front-running",
        ],
        correct: 1,
        explanation: "The rounding surplus was tiny per swap but was industrialised via 80,000 flash-loan-funded swaps. The missing onlyGovernance guard on harvest() let the attacker claim it all without authorization.",
      },
    ],
  },

  // 5. Drift Protocol 2026
  {
    id: "drift-protocol-2026",
    slug: "drift-protocol-2026",
    title: "Drift Protocol",
    subtitle: "Fake Token + Compromised Admin + Oracle Manipulation",
    year: 2026,
    chain: "Solana",
    type: ["Oracle Manipulation", "Access Control", "Supply Chain"],
    shortDesc:
      "On April 1, 2026, Drift Protocol suffered a $286M triple-vector attack: a fake collateral token accepted by the vault, a compromised admin key that disabled circuit breakers, and manipulated oracle prices used by the perpetuals engine.",
    longDesc:
      "Drift Protocol is Solana's largest perpetual futures DEX. On April 1, 2026 attackers executed a coordinated three-vector assault. First, a compromised admin wallet (stolen via a spear-phishing attack on a core team member) was used to whitelist a fake USDC-lookalike SPL token as valid collateral. Second, the admin key disabled Drift's oracle freshness circuit breaker. Third, the attacker seeded the Pyth oracle with a manipulated SOL/USD price via large spot market orders on Serum. The combination allowed depositing worthless collateral, opening maximum leveraged positions at a fake inflated SOL price, and then pocketing the difference when real prices were used for settlement.",
    technicalDesc:
      "Drift's ClearingHouse accepts collateral deposits keyed by the SPL token mint address. The compromised admin called `initialize_spot_market` with a freshly minted fake USDC token. The fake token had identical decimals and a spoofed symbol. Oracle freshness check was disabled via `update_oracle_guard_rails(max_age=u64::MAX)`. The attacker then deposited 10B fake USDC, opened 20x leveraged SOL longs at a Pyth price manipulated to $1,800 (real: $120), and when the perpetual engine settled using the manipulated Pyth price, profits were $286M against the insurance fund and liquidity pools.",
    impact: "$285 million",
    impactUSD: 285000000,
    contracts: [
      {
        label: "Drift ClearingHouse (Solana)",
        address: "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH",
        url: "https://solscan.io/account/dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Admin Key Compromise",
        description: "Spear-phishing attack on a Drift team member delivers a malicious VSCode extension that exfiltrates the admin wallet seed phrase.",
        functionsCall: [],
        pseudocode: "// Malicious extension: vscode-solana-helper@1.0.2\n// exfiltrates ~/.config/solana/id.json via HTTP webhook",
        timestamp: "March 28, 2026",
      },
      {
        id: "t2",
        phase: "Fake Token Whitelisting",
        description: "Compromised admin calls initialize_spot_market with a custom SPL token mint resembling USDC.",
        functionsCall: ["ClearingHouse.initialize_spot_market(fakeUSDC_mint, decimals=6, symbol='USDC')"],
        pseudocode:
          "// fakeUSDC: identical decimals, spoofed symbol\n// oracle_source: FIXED_PRICE (admin-controlled)\n// now accepted as collateral",
      },
      {
        id: "t3",
        phase: "Circuit Breaker Disabled",
        description: "Admin disables oracle freshness guard, allowing stale/manipulated oracle prices to be accepted.",
        functionsCall: ["ClearingHouse.update_oracle_guard_rails(max_age=u64::MAX, confidence_band_pct=100)"],
        pseudocode: "// Oracle guard rails disabled: any price age accepted\n// Confidence interval: 100% → any Pyth value accepted",
      },
      {
        id: "t4",
        phase: "Oracle Manipulation",
        description: "Attacker executes large buys on Serum SOL/USDC spot market, pushing the Pyth TWAP to $1,800 (real: ~$120).",
        functionsCall: ["Serum.placeOrder(side=BID, size=huge, price=$1800)"],
        pseudocode: "// Pyth oracle aggregates Serum & FTX prices\n// With guard rails off, manipulated price accepted by Drift",
      },
      {
        id: "t5",
        phase: "Fake Collateral + Max Leverage",
        description: "Attacker deposits 10B fake USDC and opens maximum 20x leveraged SOL perpetual long at the manipulated $1,800 price.",
        functionsCall: ["ClearingHouse.deposit(fakeUSDC, 10_000_000_000)", "ClearingHouse.open_position(SOL, 20x_long, $1800)"],
        pseudocode:
          "// 10B fake USDC deposited as collateral\n// 20x long: notional = $200B at $1,800\n// real SOL price: $120 → PnL = (1800-120) * position_size",
      },
      {
        id: "t6",
        phase: "Settlement",
        description: "When Drift settles the position, the insurance fund and liquidity providers absorb the $285M shortfall.",
        functionsCall: ["ClearingHouse.settle_pnl(position_key)"],
        pseudocode: "// settlement uses last oracle price ($1800)\n// LPs/insurance fund pays out the difference\n// net drain: $285M",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Holds compromised admin key", x: 50, y: 200 },
        { id: "n2", type: "oracle", label: "Pyth Oracle", detail: "Manipulated SOL price $1,800", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "Drift ClearingHouse", detail: "Guards disabled", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "Insurance Fund + LPs", detail: "$285M absorbed loss", x: 650, y: 300 },
        { id: "n5", type: "result", label: "Attacker Profit", detail: "$285M drained", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Manipulate Serum spot price", animated: true },
        { id: "e2", source: "n1", target: "n3", label: "Whitelist fake token + disable guards" },
        { id: "e3", source: "n2", target: "n3", label: "Feed $1,800 SOL price" },
        { id: "e4", source: "n1", target: "n3", label: "Deposit fake USDC + open 20x" },
        { id: "e5", source: "n3", target: "n4", label: "Settle at manipulated price" },
        { id: "e6", source: "n4", target: "n5", label: "$285M settlement", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Attacker\n(Fake USDC + Admin Key)", type: "attacker" },
      { id: "b", label: "Drift ClearingHouse\n(Guards Off)", type: "vault" },
      { id: "c", label: "Insurance Fund\n$285M", type: "pool" },
      { id: "d", label: "Attacker Profit\n$285M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 10000, label: "Fake collateral" },
      { source: "b", target: "c", value: 285, label: "Settle at fake price" },
      { source: "c", target: "d", value: 285, label: "Drained" },
    ],
    mitigations: [
      {
        category: "Multi-Sig Admin",
        description: "Require M-of-N multi-sig for any privileged admin operations (whitelist tokens, update oracle guards). A single compromised key should never be sufficient.",
      },
      {
        category: "Oracle Safety",
        description: "Never allow admin to disable oracle freshness or confidence band checks entirely. Set a minimum bound (e.g., max_age <= 300 seconds) enforced in-contract.",
        code: "require!(max_age <= MAX_ORACLE_AGE, ErrorCode::InvalidOracleGuardRail);",
      },
      {
        category: "Token Verification",
        description: "Verify collateral token mints against a hardcoded whitelist or decentralized registry. Never accept admin-added mints without time-locked governance approval.",
      },
      {
        category: "Position Limits",
        description: "Enforce maximum notional position size and daily open interest limits that cannot be overridden by a single admin key.",
      },
    ],
    quiz: [
      {
        question: "What was the first step that made the Drift Protocol attack possible?",
        options: [
          "Flash loan to manipulate the oracle",
          "Spear-phishing compromise of an admin wallet seed phrase",
          "Integer overflow in the collateral calculation",
          "Reentrancy in the settlement function",
        ],
        correct: 1,
        explanation: "Without the compromised admin key, the attacker could not whitelist the fake token or disable oracle guard rails. The key was obtained via a malicious VSCode extension in a spear-phishing attack.",
      },
    ],
  },

  // 6. Truebit 2026
  {
    id: "truebit-2026",
    slug: "truebit-2026",
    title: "Truebit Protocol",
    subtitle: "Smart Contract Logic Bug — Verification Bypass",
    year: 2026,
    chain: "Ethereum",
    type: ["Access Control", "Math Bug"],
    shortDesc:
      "A logic error in Truebit's verification game contract allowed an attacker to claim task solver rewards without completing the required computation, draining ~$26M in TRU tokens.",
    longDesc:
      "Truebit is an off-chain computation verification protocol on Ethereum. In January 2026 an attacker discovered that the challenge-response verification game had a condition inversion bug: the contract accepted a zero-length dispute segment as a valid 'no-challenge' proof, even when a challenger had filed a legitimate dispute. This allowed the attacker to submit garbage computation results, wait for the challenge window, then claim the solver reward by passing an empty dispute array that the contract misidentified as a timeout (no challenger present).",
    technicalDesc:
      "Truebit's `VerificationGame.sol` has a function `finalizeTask()` that checks `if (disputes.length == 0) { rewardSolver(); }`. This was intended to handle the case where no one challenges the solution within the timeout window. However, the attacker discovered that even during an active dispute, passing an empty `disputes` array in the calldata (by not including any pending dispute IDs) satisfied this check. The contract did not cross-reference the disputes mapping separately — it only checked the calldata array. The attacker submitted 1,040 tasks with garbage results and called `finalizeTask(emptyArray)` for each.",
    impact: "$26 million",
    impactUSD: 26000000,
    contracts: [
      {
        label: "Truebit VerificationGame",
        address: "0x4Fd76FE66B2A55b8b4DFD6eB6eA0E5051B96576B",
        url: "https://etherscan.io/address/0x4Fd76FE66B2A55b8b4DFD6eB6eA0E5051B96576B",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Discovery",
        description: "Attacker reads VerificationGame.sol source, identifies that finalizeTask() only checks calldata disputes.length without cross-referencing on-chain dispute mapping.",
        functionsCall: [],
        pseudocode: "// BUG: only checks calldata array, not on-chain state\nfunction finalizeTask(uint[] calldata disputes) external {\n  if (disputes.length == 0) { rewardSolver(); } // bypassed!",
        timestamp: "January 2026",
      },
      {
        id: "t2",
        phase: "Task Submission",
        description: "Attacker submits 1,040 tasks with garbage computation results to the Truebit task queue.",
        functionsCall: ["TaskBook.addTask(garbageComputationHash)"],
        pseudocode: "for i in range(1040):\n    task_id = truebit.addTask(garbage_hash)\n    attacker_task_ids.append(task_id)",
      },
      {
        id: "t3",
        phase: "Challenge Period",
        description: "Legitimate challengers file disputes for many tasks, but the attacker ignores them.",
        functionsCall: [],
        pseudocode: "// Multiple valid challenges filed on-chain\n// disputes[task_id] mapping = [challenger_address]\n// attacker does nothing during challenge period",
      },
      {
        id: "t4",
        phase: "Bypass Finalization",
        description: "Before any dispute is resolved, attacker calls finalizeTask(emptyArray) for each disputed task. The empty calldata fools the check.",
        functionsCall: ["VerificationGame.finalizeTask(task_id, [])"],
        pseudocode: "// Pass empty disputes array in calldata\n// disputes.length == 0 → rewardSolver() called\n// on-chain dispute mapping never checked!",
      },
      {
        id: "t5",
        phase: "Reward Collection",
        description: "Attacker collects TRU solver rewards for all 1,040 tasks, approximately $25,000 per task.",
        functionsCall: ["TRU.transfer(attacker, reward)"],
        pseudocode: "// 1040 * $25,000 TRU reward = $26M total drained",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "1040 garbage task submissions", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "TaskBook", detail: "Task queue, TRU rewards", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "VerificationGame", detail: "finalizeTask() logic bug", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "TRU Reward Pool", detail: "$26M in TRU tokens", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker Wallet", detail: "$26M drained", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Submit garbage tasks" },
        { id: "e2", source: "n2", target: "n3", label: "Task enters challenge period" },
        { id: "e3", source: "n1", target: "n3", label: "finalizeTask(emptyArray)", animated: true },
        { id: "e4", source: "n3", target: "n4", label: "disputes.length==0 → rewardSolver()" },
        { id: "e5", source: "n4", target: "n5", label: "1040 rewards collected", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Truebit\nReward Pool $26M", type: "pool" },
      { id: "b", label: "VerificationGame\n(Buggy Logic)", type: "vault" },
      { id: "c", label: "Attacker\n1040 fake solves", type: "attacker" },
      { id: "d", label: "Attacker Wallet\n$26M TRU", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 26, label: "Rewards escrowed" },
      { source: "c", target: "b", value: 0, label: "finalizeTask([])" },
      { source: "b", target: "d", value: 26, label: "rewardSolver() bypass" },
    ],
    mitigations: [
      {
        category: "On-Chain State Verification",
        description: "Never trust calldata to represent on-chain state. Always cross-reference the on-chain mapping: if disputes[taskId].length > 0, the task is disputed regardless of calldata.",
        code: "// SECURE:\nfunction finalizeTask(uint taskId) external {\n  require(block.timestamp > tasks[taskId].deadline, 'Too early');\n  require(onChainDisputes[taskId].length == 0, 'Active disputes exist');\n  rewardSolver(taskId);\n}",
      },
      {
        category: "Calldata vs Storage",
        description: "Understand the distinction between calldata (input parameters) and storage (on-chain state). Security-critical checks must use storage reads.",
      },
    ],
    quiz: [
      {
        question: "What was the core bug in Truebit's VerificationGame?",
        options: [
          "Missing reentrancy guard on rewardSolver()",
          "finalizeTask() checked calldata disputes.length instead of on-chain dispute mapping",
          "Integer overflow in task ID calculation",
          "Admin could bypass the challenge period with a single signature",
        ],
        correct: 1,
        explanation: "The contract checked `if (disputes.length == 0)` on the calldata parameter, not on the on-chain `onChainDisputes[taskId]` mapping. Passing an empty array bypassed active disputes entirely.",
      },
    ],
  },

  // 7. CrossCurve Bridge 2026
  {
    id: "crosscurve-bridge-2026",
    slug: "crosscurve-bridge-2026",
    title: "CrossCurve Bridge",
    subtitle: "Cross-Chain Message Validation Bypass",
    year: 2026,
    chain: "Multi-chain",
    type: ["Bridge", "Access Control"],
    shortDesc:
      "A missing sender verification in CrossCurve Bridge's cross-chain message handler allowed an attacker to spoof arbitrary bridge messages, minting unbacked tokens and draining ~$3M.",
    longDesc:
      "CrossCurve is a cross-chain stablecoin bridge powered by Curve Finance. In February 2026, a researcher discovered that CrossCurve's BridgeReceiver contract failed to validate the `msg.sender` of incoming cross-chain messages relayed by the LayerZero endpoint. The contract accepted bridge messages from any address that could produce a properly structured payload, not just the authorized LayerZero relayer. By replaying a previously observed message with a modified recipient address, the attacker minted unbacked crvUSD on the destination chain and immediately swapped it for real stablecoins.",
    technicalDesc:
      "CrossCurve's BridgeReceiver.lzReceive() function has the signature `lzReceive(uint16 _srcChainId, bytes calldata _srcAddress, uint64, bytes calldata _payload)`. The function checks `_srcChainId` and decodes `_srcAddress` correctly, but fails to verify that `msg.sender == trustedRemote[_srcChainId]` — the LayerZero trusted remote for that chain. Any EOA can call lzReceive directly with a valid-format payload. The attacker called lzReceive with a crafted payload specifying `recipient=attacker, amount=1,000,000 crvUSD` on the Arbitrum BridgeReceiver, minting 1M unbacked crvUSD which was then swapped for $3M USDC via Curve pools.",
    impact: "$3 million",
    impactUSD: 3000000,
    contracts: [
      {
        label: "CrossCurve BridgeReceiver (Arbitrum)",
        address: "0x9C23B776a81a17e9e5a398f1e17BD5aD26F2a9E7",
        url: "https://arbiscan.io/address/0x9C23B776a81a17e9e5a398f1e17BD5aD26F2a9E7",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Reconnaissance",
        description: "Attacker reviews BridgeReceiver source code and finds lzReceive() lacks msg.sender validation.",
        functionsCall: [],
        pseudocode: "// lzReceive has NO check:\n// require(msg.sender == lzEndpoint, 'not LZ endpoint');\n// require(trustedRemote[_srcChainId] == _srcAddress, 'untrusted remote');",
        timestamp: "February 2026",
      },
      {
        id: "t2",
        phase: "Craft Payload",
        description: "Attacker reverse-engineers the ABI encoding of a legitimate bridge message and crafts a payload minting 1M crvUSD to their address.",
        functionsCall: [],
        pseudocode:
          "// Payload structure: abi.encode(ACTION_MINT, recipient, amount)\npayload = abi.encode(\n  uint8(1), // ACTION_MINT\n  attacker_address,\n  1_000_000e18 // 1M crvUSD\n);",
      },
      {
        id: "t3",
        phase: "Spoof lzReceive",
        description: "Attacker calls BridgeReceiver.lzReceive() directly (bypassing LayerZero) with the spoofed payload.",
        functionsCall: ["BridgeReceiver.lzReceive(srcChainId=1, srcAddress=trustedRemoteAddr, nonce=0, payload=spoofed)"],
        pseudocode:
          "// srcChainId=1 (Ethereum) matches expected value\n// srcAddress is copy-pasted from a real tx (not verified)\n// msg.sender = attacker (should be lzEndpoint!)\nbridgeReceiver.lzReceive(1, trustedRemoteAddr, 0, payload);",
      },
      {
        id: "t4",
        phase: "Unbacked Mint",
        description: "BridgeReceiver mints 1M crvUSD to attacker's address with no underlying collateral on the source chain.",
        functionsCall: ["crvUSD.mint(attacker, 1_000_000e18)"],
        pseudocode: "// 1M crvUSD minted to attacker\n// NO corresponding lock on source chain\n// fully unbacked",
      },
      {
        id: "t5",
        phase: "Swap for Real Stablecoins",
        description: "Attacker swaps 1M unbacked crvUSD for $3M USDC through Curve pools before liquidity is drained.",
        functionsCall: ["Curve3Pool.exchange(crvUSD, USDC, 1_000_000e18)"],
        pseudocode: "// Curve pool has no oracle check for crvUSD backing\ncurve3Pool.exchange(0, 1, 1_000_000e18, minOut);\n// attacker receives ~$3M USDC",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker EOA", detail: "Crafted bridge message", x: 50, y: 200 },
        { id: "n2", type: "bridge", label: "CrossCurve BridgeReceiver", detail: "Missing sender validation", x: 300, y: 200 },
        { id: "n3", type: "contract", label: "crvUSD Token", detail: "Mint 1M unbacked", x: 550, y: 100 },
        { id: "n4", type: "pool", label: "Curve Stable Pool", detail: "$3M USDC liquidity", x: 550, y: 300 },
        { id: "n5", type: "result", label: "Attacker Wallet", detail: "$3M USDC", x: 800, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "lzReceive() direct call", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "mint(attacker, 1M crvUSD)" },
        { id: "e3", source: "n3", target: "n4", label: "swap unbacked crvUSD" },
        { id: "e4", source: "n4", target: "n5", label: "$3M USDC out", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "CrossCurve\nBridgeReceiver", type: "bridge" },
      { id: "b", label: "crvUSD (unbacked)\n1M minted", type: "vault" },
      { id: "c", label: "Curve Pool\n$3M USDC", type: "pool" },
      { id: "d", label: "Attacker\n$3M USDC", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 3, label: "Spoof mint" },
      { source: "b", target: "c", value: 3, label: "swap crvUSD→USDC" },
      { source: "c", target: "d", value: 3, label: "$3M stolen" },
    ],
    mitigations: [
      {
        category: "Bridge Message Authentication",
        description: "Always verify msg.sender == lzEndpoint AND verify the source address matches the trusted remote for that chain.",
        code: "function lzReceive(uint16 _srcChainId, bytes calldata _srcAddress, ...) external {\n  require(msg.sender == address(lzEndpoint), 'Caller not LayerZero');\n  require(keccak256(_srcAddress) == keccak256(trustedRemotes[_srcChainId]), 'Untrusted remote');\n  // process payload\n}",
      },
      {
        category: "Replay Protection",
        description: "Maintain a nonce or message hash registry to prevent replaying legitimate messages.",
      },
      {
        category: "Mint Limits",
        description: "Implement daily or per-transaction minting caps to limit blast radius of any bridge exploit.",
      },
    ],
    quiz: [
      {
        question: "What check was missing from CrossCurve's lzReceive() function?",
        options: [
          "Reentrancy guard",
          "Validation that msg.sender == LayerZero endpoint AND srcAddress == trusted remote",
          "Overflow check on the mint amount",
          "Oracle price check for crvUSD",
        ],
        correct: 1,
        explanation: "The contract checked srcChainId and srcAddress from calldata parameters but did NOT verify that msg.sender was the official LayerZero endpoint, allowing anyone to call lzReceive directly.",
      },
    ],
  },

  // 8. Abracadabra Finance 2025
  {
    id: "abracadabra-finance-2025",
    slug: "abracadabra-finance-2025",
    title: "Abracadabra Finance",
    subtitle: "Flash Loan Self-Liquidation / Cauldron State Error",
    year: 2025,
    chain: "Ethereum",
    type: ["Flash Loan", "Math Bug"],
    shortDesc:
      "An attacker exploited a state tracking inconsistency in Abracadabra's Cauldron V4 using flash loans to perform self-liquidations at an artificially favorable exchange rate, extracting ~$13M.",
    longDesc:
      "Abracadabra Finance issues MIM (Magic Internet Money) stablecoin against various collateral types through its 'Cauldron' contracts. In early 2025 an attacker discovered that Cauldron V4's accrue() function, which updates the total borrow amount from interest, was not called atomically before the self-liquidation path. By using a flash loan to rapidly increase and decrease their own collateral position, the attacker created a window where the contract's view of their collateral health diverged from reality. During this window, self-liquidation settled at a rate that over-compensated the attacker by ~13M MIM.",
    technicalDesc:
      "CauldronV4.liquidate() calls `accrue()` to update totalBorrow at the start of each transaction. However, within a single block, multiple calls to liquidate() share the same cached `accrueInfo.lastAccrued` value — interest only accrues once per block. The attacker used a flash loan to add massive temporary collateral, push the borrow utilisation rate up, and then call liquidate() in a specially crafted transaction order where accrue() had already cached the utilisation rate at a lower value. This resulted in the self-liquidation bonus (the MIM paid out) being calculated at a higher rate than the actual collateral value justified.",
    impact: "$13 million",
    impactUSD: 13000000,
    contracts: [
      {
        label: "CauldronV4 (ETH)",
        address: "0x7259e152103756e1616A77Ae982353c3751A6a90",
        url: "https://etherscan.io/address/0x7259e152103756e1616A77Ae982353c3751A6a90",
      },
      {
        label: "MIM Stablecoin",
        address: "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
        url: "https://etherscan.io/address/0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Flash Loan Borrow",
        description: "Attacker borrows $50M WETH via Balancer flash loan to inject as temporary collateral.",
        functionsCall: ["Balancer.flashLoan(WETH, 50_000_000)"],
        pseudocode: "balancer.flashLoan(address(this), WETH, 50e18, '');",
      },
      {
        id: "t2",
        phase: "Collateral Injection",
        description: "Deposit $50M WETH into their own Cauldron position, making the position appear overcollateralised.",
        functionsCall: ["CauldronV4.addCollateral(attacker_position, 50M_WETH)"],
        pseudocode: "// Attacker position: 50M WETH collateral, 10M MIM debt\n// Health factor: 5x (very healthy)",
      },
      {
        id: "t3",
        phase: "Cached Accrue Exploit",
        description: "Call a preapproved self-liquidation. accrue() uses cached accrueInfo from earlier in the block — the utilisation-based liquidation bonus is inflated.",
        functionsCall: ["CauldronV4.accrue()", "CauldronV4.liquidate(attacker_position, 10M_MIM)"],
        pseudocode:
          "// accrue() already called this block, cached state used\n// liquidation bonus = 10% of collateral value (cached at inflated util)\n// actual bonus should be 5%, cached value gives 10%\n// extra 5% = ~$2.5M per round",
      },
      {
        id: "t4",
        phase: "Collateral Withdrawal",
        description: "Remove the flash loan collateral, repaying Balancer. The Cauldron position is now healthy (attacker kept the liquidation bonus).",
        functionsCall: ["CauldronV4.removeCollateral(attacker_position, 50M_WETH)", "Balancer.repayFlash(WETH, 50M)"],
        pseudocode: "cauldron.removeCollateral(50e18);\nweth.transfer(balancer, 50e18 + flashFee); // repay",
      },
      {
        id: "t5",
        phase: "Repeat",
        description: "Repeat the cycle 5 times across different blocks for a total net gain of ~$13M MIM.",
        functionsCall: [],
        pseudocode: "// 5 iterations × ~$2.6M avg bonus = $13M total\n// MIM converted to USDC via Curve",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Self-liquidation exploit", x: 50, y: 200 },
        { id: "n2", type: "bridge", label: "Balancer Flash Loan", detail: "$50M WETH", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "CauldronV4", detail: "Stale accrue() cache", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "MIM Reserve", detail: "Liquidation bonus pool", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker Profit", detail: "~$13M MIM", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "50M WETH" },
        { id: "e2", source: "n1", target: "n3", label: "addCollateral(50M WETH)" },
        { id: "e3", source: "n3", target: "n4", label: "liquidate() with stale accrue", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Inflated bonus MIM" },
        { id: "e5", source: "n1", target: "n2", label: "repay flash loan" },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Balancer\n$50M Flash", type: "bridge" },
      { id: "b", label: "CauldronV4\n(Stale State)", type: "vault" },
      { id: "c", label: "MIM Reserve", type: "pool" },
      { id: "d", label: "Attacker\n$13M MIM", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 50, label: "temp collateral" },
      { source: "b", target: "c", value: 50, label: "overcollateralised" },
      { source: "c", target: "d", value: 13, label: "inflated liquidation bonus" },
      { source: "b", target: "a", value: 50, label: "return collateral" },
    ],
    mitigations: [
      {
        category: "Accrue Before Any State Read",
        description: "Call accrue() at the start of EVERY function that reads or modifies borrow state, not just liquidate(). The cached state must never be used.",
        code: "modifier accrues() {\n  accrue();\n  _;\n}\nfunction liquidate(...) external accrues { ... }\nfunction addCollateral(...) external accrues { ... }",
      },
      {
        category: "Flash Loan Resistance",
        description: "Use collateral values snapshotted from the start of the transaction (pre-flash-loan state) via a re-entrancy-checked snapshot pattern.",
      },
      {
        category: "Liquidation Bonus Caps",
        description: "Hard-cap the maximum liquidation bonus percentage in-contract so that extreme utilisation rates cannot produce exploitable bonus spikes.",
      },
    ],
    quiz: [
      {
        question: "What made the Abracadabra self-liquidation exploit work within a flash loan?",
        options: [
          "The oracle price could be manipulated within one block",
          "accrue() used cached state that didn't reflect the flash-loan-inflated utilisation rate",
          "Reentrancy in removeCollateral() allowed double-withdrawals",
          "The liquidation function had no repayment check",
        ],
        correct: 1,
        explanation: "accrue() was only called once per block. Subsequent calls within the same block used cached state. By manipulating utilisation with a flash loan after accrue() had already cached the rate, the liquidation bonus calculation became stale and favorable to the attacker.",
      },
    ],
  },

  // --- CLASSIC HACKS ---

  // The DAO (2016)
  {
    id: "the-dao-2016",
    slug: "the-dao-2016",
    title: "The DAO",
    subtitle: "The Reentrancy Attack That Split Ethereum",
    year: 2016,
    chain: "Ethereum",
    type: ["Reentrancy"],
    shortDesc:
      "An attacker repeatedly drained The DAO's ETH via a reentrancy vulnerability in the withdrawal function, ultimately causing Ethereum's historic hard fork.",
    longDesc:
      "The DAO was a decentralized venture capital fund on Ethereum with over $150M worth of ETH. In June 2016, an attacker exploited a reentrancy bug in the splitDAO function. Because The DAO sent ETH before updating the user's balance, the attacker's malicious contract re-entered the withdrawal function repeatedly within a single transaction, draining ~3.6M ETH (~$60M). The community's response—an irregular state change (hard fork) to recover the funds—split Ethereum into ETH and ETC.",
    technicalDesc:
      "The DAO's withdraw() sent ETH via call.value()() before setting balances[msg.sender]=0. The attacker's fallback() re-called splitDAO() each time ETH arrived, repeating the drain. The state variable was only zeroed after the external call returned, violating Checks-Effects-Interactions.",
    impact: "~$60M (3.6M ETH)",
    impactUSD: 60000000,
    contracts: [
      {
        label: "The DAO Contract",
        address: "0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413",
        url: "https://etherscan.io/address/0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Reconnaissance",
        description: "Attacker studies The DAO source code and identifies the reentrancy window between the ETH transfer and balance update in splitDAO().",
        functionsCall: [],
        pseudocode: "// splitDAO sends ETH before updating dao.balances[msg.sender]\n// external call opens reentrancy window",
        timestamp: "June 16, 2016",
      },
      {
        id: "t2",
        phase: "Deploy Attack Contract",
        description: "Attacker deploys a malicious contract with a fallback function that calls splitDAO() recursively.",
        functionsCall: ["MaliciousDAO.deploy()"],
        pseudocode:
          "contract Attack {\n  TheDAO dao;\n  fallback() external payable {\n    if (address(dao).balance > 1 ether)\n      dao.splitDAO(1 ether, address(this));\n  }\n}",
      },
      {
        id: "t3",
        phase: "Reentrancy Drain",
        description: "Attack contract calls splitDAO(). DAO sends ETH → fallback fires → splitDAO again → repeat, draining funds 57 times before the call stack unwinds.",
        functionsCall: ["TheDAO.splitDAO(1 ether)", "Attack.fallback() × 57"],
        pseudocode:
          "// DAO state:\n// balances[attacker] = 100 ETH (never decremented during loop)\n// ETH sent each iteration: 100 ETH\n// Total drained: 5700 ETH per tx batch",
      },
      {
        id: "t4",
        phase: "Hard Fork Debate",
        description: "Ethereum community debates hard fork to reverse the theft. Vitalik Buterin proposes an irregular state change.",
        functionsCall: [],
        pseudocode: "// EIP-779: recover DAO funds via hard fork\n// Minority refuses → Ethereum Classic (ETC) born",
      },
      {
        id: "t5",
        phase: "Hard Fork Executed",
        description: "Ethereum hard forks at block 1,920,000, moving stolen ETH to a refund contract. Ethereum Classic continues original chain.",
        functionsCall: ["block_1920000.fork()"],
        pseudocode: "// ETH chain: attacker wallet reversed\n// ETC chain: original state preserved, attacker keeps funds",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker EOA", detail: "Deploys malicious contract", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Attack Contract", detail: "Fallback calls splitDAO()", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "The DAO", detail: "$150M ETH treasury", x: 450, y: 150 },
        { id: "n4", type: "contract", label: "splitDAO()", detail: "Sends ETH before balance update", x: 450, y: 280 },
        { id: "n5", type: "result", label: "Attacker Child DAO", detail: "3.6M ETH accumulated", x: 700, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Deploy attack contract" },
        { id: "e2", source: "n2", target: "n4", label: "Call splitDAO()", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "ETH balance" },
        { id: "e4", source: "n4", target: "n2", label: "Send ETH → fallback re-enters", animated: true },
        { id: "e5", source: "n2", target: "n5", label: "Accumulate drained ETH" },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "The DAO\n$150M ETH", type: "vault" },
      { id: "b", label: "splitDAO()\n(No balance update)", type: "pool" },
      { id: "c", label: "Attack Contract\n(Fallback loop)", type: "attacker" },
      { id: "d", label: "Child DAO\n3.6M ETH", type: "multisig" },
      { id: "e", label: "Attacker\n$60M drained", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 60, label: "All ETH holdings" },
      { source: "b", target: "c", value: 60, label: "ETH sent (pre-update)" },
      { source: "c", target: "b", value: 60, label: "Reenter splitDAO() ×57" },
      { source: "c", target: "d", value: 60, label: "Accumulate" },
      { source: "d", target: "e", value: 60, label: "Withdraw after fork" },
    ],
    mitigations: [
      {
        category: "Checks-Effects-Interactions",
        description: "Always update state (balances[msg.sender] = 0) BEFORE making external calls. Never send ETH before recording the deduction.",
        code: "function withdraw(uint amount) external {\n  require(balances[msg.sender] >= amount);\n  balances[msg.sender] -= amount; // effect first\n  (bool ok,) = msg.sender.call{value: amount}(''); // then interact\n  require(ok);\n}",
      },
      {
        category: "ReentrancyGuard",
        description: "Use OpenZeppelin ReentrancyGuard (nonReentrant modifier) on all functions that transfer ETH or call external contracts.",
        code: "import '@openzeppelin/contracts/security/ReentrancyGuard.sol';\ncontract Safe is ReentrancyGuard {\n  function withdraw() external nonReentrant { ... }\n}",
      },
      {
        category: "Formal Verification",
        description: "Tools like Certora Prover can statically verify that no external call occurs before a corresponding state update.",
      },
    ],
    quiz: [
      {
        question: "What is the Checks-Effects-Interactions pattern?",
        options: [
          "Check balances after every external call",
          "Verify inputs, update state, then call external contracts — in that order",
          "Use multi-sig checks before any interaction",
          "Check oracle prices before interacting with pools",
        ],
        correct: 1,
        explanation: "CEI means: (1) check preconditions, (2) update all state variables, (3) only then call external contracts. Reversing steps 2 and 3 opens a reentrancy window.",
      },
      {
        question: "What lasting consequence did The DAO hack have on Ethereum?",
        options: [
          "Ethereum switched from PoW to PoS immediately",
          "All smart contracts were banned for 6 months",
          "The Ethereum network hard-forked, creating ETH and Ethereum Classic (ETC)",
          "The DAO was rebuilt with a bug bounty program",
        ],
        correct: 2,
        explanation: "The community debated and ultimately hard-forked Ethereum to reverse the theft. A minority disagreed with the irregular state change and continued the original chain as Ethereum Classic.",
      },
    ],
  },

  // Parity Multisig (2017)
  {
    id: "parity-multisig-2017",
    slug: "parity-multisig-2017",
    title: "Parity Multisig",
    subtitle: "Library Self-Destruct Freezes $300M",
    year: 2017,
    chain: "Ethereum",
    type: ["Access Control"],
    shortDesc:
      "An unprotected initWallet() on the shared library let an attacker claim ownership, then self-destruct the library — permanently freezing 513K ETH across hundreds of wallets.",
    longDesc:
      "Parity Technologies deployed a shared library contract that all of their multisig wallets relied on via delegatecall. The library contract was not a wallet itself, but it exposed initialization and self-destruct functions without proper access controls. In November 2017, a user (possibly accidental) called initWallet() on the library, claiming ownership. They then called kill(), triggering selfdestruct(). Every Parity multisig wallet that used this library became permanently inoperable, with ~$300M worth of ETH frozen forever.",
    technicalDesc:
      "The WalletLibrary contract exposed initWallet() without checking whether the contract had already been initialized. Because the wallet proxies used delegatecall to the library, any direct call to the library ran in the library's own storage context — not the wallet. The unguarded initWallet() set the library's owner to the caller. The owner could then call kill() which executed selfdestruct(), eliminating the library's code. All proxy wallets relying on this code via delegatecall found the target address empty — any call silently succeeded, but funds were inaccessible.",
    impact: "~$300M frozen (513K ETH)",
    impactUSD: 300000000,
    contracts: [
      {
        label: "WalletLibrary (destroyed)",
        address: "0x863DF6BFa4469f3ead0bE8f9F2AAE51c91A907b4",
        url: "https://etherscan.io/address/0x863DF6BFa4469f3ead0bE8f9F2AAE51c91A907b4",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Deploy Shared Library",
        description: "Parity deploys WalletLibrary as a standalone contract. Multisig wallets use delegatecall to invoke its functions.",
        functionsCall: [],
        pseudocode: "// Wallet proxy:\n// fallback() { walletLibrary.delegatecall(msg.data); }",
        timestamp: "July 2017",
      },
      {
        id: "t2",
        phase: "Unprotected initWallet",
        description: "An attacker (or curious user) notices the library itself is uninitialized. Calls initWallet() directly on the library contract.",
        functionsCall: ["WalletLibrary.initWallet([attacker], 1, 0)"],
        pseudocode:
          "// WalletLibrary.initWallet has no 'require(!initialized)' check\n// Sets library.m_owners = [attacker]\n// Library is now 'owned' by attacker",
        timestamp: "Nov 6, 2017",
      },
      {
        id: "t3",
        phase: "Self-Destruct",
        description: "Attacker calls kill() on the library, triggering selfdestruct(). Library bytecode is wiped from the blockchain.",
        functionsCall: ["WalletLibrary.kill(attacker)"],
        pseudocode:
          "function kill(address _to) onlymanyowners external {\n  suicide(_to); // selfdestruct — wipes code\n}",
      },
      {
        id: "t4",
        phase: "Wallets Bricked",
        description: "All Parity multisig wallets relying on the library via delegatecall find the target empty. Funds are permanently inaccessible.",
        functionsCall: [],
        pseudocode: "// proxy.delegatecall(data) → target has no code → silently returns true\n// No function can execute → funds locked forever",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker / User", detail: "Called unprotected initWallet()", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "WalletLibrary", detail: "Shared library with no auth", x: 280, y: 200 },
        { id: "n3", type: "contract", label: "selfdestruct()", detail: "Wipes library bytecode", x: 500, y: 200 },
        { id: "n4", type: "pool", label: "Parity Multisigs\n(~500 wallets)", detail: "delegatecall to dead library", x: 500, y: 350 },
        { id: "n5", type: "result", label: "Funds Frozen\n$300M ETH", detail: "Permanently inaccessible", x: 750, y: 280 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "initWallet() → claim ownership" },
        { id: "e2", source: "n1", target: "n2", label: "kill() → selfdestruct", animated: true },
        { id: "e3", source: "n2", target: "n3", label: "Bytecode wiped" },
        { id: "e4", source: "n4", target: "n3", label: "delegatecall → empty target" },
        { id: "e5", source: "n4", target: "n5", label: "Funds frozen forever" },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "~500 Parity\nMultisig Wallets", type: "multisig" },
      { id: "b", label: "WalletLibrary\n(Shared)", type: "vault" },
      { id: "c", label: "initWallet()\nNo Auth Check", type: "pool" },
      { id: "d", label: "Attacker\n(Claims Owner)", type: "attacker" },
      { id: "e", label: "selfdestruct()\nLibrary Wiped", type: "bridge" },
      { id: "f", label: "Frozen Forever\n$300M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 300, label: "delegatecall dependency" },
      { source: "b", target: "c", value: 300, label: "Unprotected entrypoint" },
      { source: "c", target: "d", value: 1, label: "Ownership claimed" },
      { source: "d", target: "e", value: 300, label: "kill() called" },
      { source: "e", target: "f", value: 300, label: "All wallets bricked" },
    ],
    mitigations: [
      {
        category: "Initialization Guards",
        description: "Add an initialized bool to library contracts. Revert if already initialized. Use OpenZeppelin Initializable for upgradeable contracts.",
        code: "bool private initialized;\nfunction initWallet(...) external {\n  require(!initialized, 'already init');\n  initialized = true;\n  ...\n}",
      },
      {
        category: "Avoid Self-Destruct in Shared Libraries",
        description: "Never expose selfdestruct/suicide in a contract used by others via delegatecall. Prefer pausable patterns.",
      },
      {
        category: "Immutable Libraries",
        description: "Consider making libraries that have no upgradability path truly immutable — remove kill() entirely from any shared dependency.",
      },
    ],
    quiz: [
      {
        question: "Why could an attacker call initWallet() directly on the WalletLibrary?",
        options: [
          "The function was public and had no initialized guard",
          "A reentrancy bug allowed bypassing the owner check",
          "The library was deployed with no bytecode",
          "A flash loan was used to gain temporary ownership",
        ],
        correct: 0,
        explanation: "WalletLibrary.initWallet() was a public function with no check for prior initialization. Since the library was deployed as a standalone contract, anyone could call it directly and set themselves as owner.",
      },
      {
        question: "Why are the frozen funds unrecoverable?",
        options: [
          "They were transferred to a burn address",
          "The multisig threshold was raised to an unreachable number",
          "The library contract's bytecode was destroyed via selfdestruct, making delegatecalls to it no-ops",
          "The private keys of all signers were deleted",
        ],
        correct: 2,
        explanation: "selfdestruct removes contract bytecode. The wallet proxies delegatecall to the library address, which is now empty. Calls silently return without executing any logic — funds are locked with no path to withdraw.",
      },
    ],
  },

  // bZx (2020)
  {
    id: "bzx-flash-loan-2020",
    slug: "bzx-flash-loan-2020",
    title: "bZx Flash Loan",
    subtitle: "First Major Flash Loan Price Manipulation",
    year: 2020,
    chain: "Ethereum",
    type: ["Flash Loan", "Oracle Manipulation"],
    shortDesc:
      "The first prominent flash loan exploit: borrowed funds, manipulated a Uniswap oracle, borrowed against inflated collateral on bZx, and profited ~$350K in a single transaction.",
    longDesc:
      "In February 2020, bZx was hit twice in the same week. The first attack used a dYdX flash loan to short ETH on bZx, then used a large portion of the loan to pump WBTC price on Uniswap, making bZx's collateral look massively over-collateralized, and borrowed maximum funds against it. The attacker walked away with ~$350K profit, repaid the flash loan atomically, and introduced the world to flash-loan-as-weapon attacks.",
    technicalDesc:
      "bZx used Uniswap v1 spot price as its oracle — not TWAP. The attacker: (1) borrowed 10,000 ETH flash loan from dYdX; (2) shorted 5,500 ETH on bZx's Fulcrum; (3) used 1,300 ETH to dump WBTC price on Uniswap; (4) borrowed max WBTC on Compound (inflated price); (5) dumped WBTC back on Uniswap; (6) bZx's oracle read the manipulated price, believing the short was safe; (7) repaid flash loan with profit.",
    impact: "~$350K",
    impactUSD: 350000,
    contracts: [
      {
        label: "bZx Fulcrum (Ethereum)",
        address: "0x77f973FCaF871459aa58cd81881Ce453759281bC",
        url: "https://etherscan.io/address/0x77f973FCaF871459aa58cd81881Ce453759281bC",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Flash Loan Borrow",
        description: "Attacker borrows 10,000 ETH from dYdX as a flash loan, all within one atomic transaction.",
        functionsCall: ["dYdX.flashLoan(10000 ETH)"],
        pseudocode: "// Single transaction begins\ndYdX.operate([Action.Withdraw(10000 ETH)])",
        timestamp: "Feb 15, 2020",
      },
      {
        id: "t2",
        phase: "Short Position on bZx",
        description: "Attacker uses 5,500 ETH to open a 5x leveraged ETH short on bZx Fulcrum, expecting ETH price to drop.",
        functionsCall: ["Fulcrum.mintWithEther(pETH, 5500 ETH, leverage=5x)"],
        pseudocode: "// bZx borrows ETH and swaps to WBTC via Kyber\n// Kyber routes through Uniswap",
      },
      {
        id: "t3",
        phase: "Oracle Manipulation",
        description: "Remaining 1,300 ETH is dumped into the WBTC/ETH Uniswap pool, crashing WBTC's apparent ETH price and creating the appearance of a profitable short.",
        functionsCall: ["Uniswap.swapExactETHForTokens(1300 ETH → WBTC)"],
        pseudocode: "// Uniswap v1 spot price changes drastically\n// bZx reads this spot price as WBTC oracle\n// bZx thinks short is wildly profitable",
      },
      {
        id: "t4",
        phase: "Borrow Against Inflated Position",
        description: "Attacker borrows 112 WBTC on Compound using the inflated short position as collateral, per bZx's distorted oracle view.",
        functionsCall: ["Compound.borrow(112 WBTC)"],
        pseudocode: "// bZx oracle reports inflated collateral value\n// Compound allows max WBTC borrow",
      },
      {
        id: "t5",
        phase: "Repay & Profit",
        description: "Attacker sells WBTC, repays dYdX flash loan, and pockets the difference as pure profit.",
        functionsCall: ["dYdX.repay(10000 ETH)"],
        pseudocode: "// Total profit: ~350K USD\n// Flash loan repaid in same block\n// No capital required going in",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Single atomic transaction", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "dYdX Flash Loan", detail: "10,000 ETH borrowed", x: 230, y: 100 },
        { id: "n3", type: "contract", label: "bZx Fulcrum", detail: "Short position, reads oracle", x: 430, y: 100 },
        { id: "n4", type: "oracle", label: "Uniswap v1 Oracle", detail: "Spot price, manipulable", x: 430, y: 300 },
        { id: "n5", type: "pool", label: "Compound", detail: "WBTC borrow", x: 630, y: 200 },
        { id: "n6", type: "result", label: "Attacker\n+$350K", detail: "Net profit after repay", x: 830, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Borrow flash loan", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Fund short position" },
        { id: "e3", source: "n1", target: "n4", label: "Dump ETH → pump WBTC" },
        { id: "e4", source: "n4", target: "n3", label: "Inflated price feed" },
        { id: "e5", source: "n3", target: "n5", label: "Over-collateralised borrow" },
        { id: "e6", source: "n5", target: "n6", label: "Drain WBTC → profit", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "dYdX\nFlash Loan", type: "pool" },
      { id: "b", label: "Attacker\n(10K ETH)", type: "attacker" },
      { id: "c", label: "bZx Fulcrum\nShort", type: "vault" },
      { id: "d", label: "Uniswap v1\nOracle", type: "bridge" },
      { id: "e", label: "Compound\nWBTC", type: "pool" },
      { id: "f", label: "Profit\n$350K", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.35, label: "Flash loan 10K ETH" },
      { source: "b", target: "c", value: 0.35, label: "Open short" },
      { source: "b", target: "d", value: 0.35, label: "Dump ETH → manipulate" },
      { source: "d", target: "c", value: 0.35, label: "Inflated oracle" },
      { source: "c", target: "e", value: 0.35, label: "Borrow vs inflated collateral" },
      { source: "e", target: "f", value: 0.35, label: "Net profit" },
    ],
    mitigations: [
      {
        category: "TWAP Oracles",
        description: "Use time-weighted average price oracles (Uniswap v3 TWAP, Chainlink) instead of spot prices. Spot prices can be manipulated within a single block.",
        code: "// Uniswap v3 TWAP\n(int56[] memory tickCumulatives,) = pool.observe([twapPeriod, 0]);\nint24 twapTick = int24((tickCumulatives[1] - tickCumulatives[0]) / int56(uint56(twapPeriod)));",
      },
      {
        category: "Flash Loan Guards",
        description: "Track per-block balances and revert if critical state was modified in the same block by a flash loan (add a sameBlock check).",
      },
      {
        category: "Slippage Limits",
        description: "Hard-cap maximum slippage when routing trades through a single AMM pool used for pricing.",
      },
    ],
    quiz: [
      {
        question: "Why was Uniswap v1's price vulnerable to the bZx attack?",
        options: [
          "Uniswap v1 had no slippage protection",
          "It used spot price (current ratio) rather than a time-weighted average",
          "The Uniswap v1 contract had a reentrancy bug",
          "bZx used an outdated Uniswap interface",
        ],
        correct: 1,
        explanation: "Uniswap v1 reports the current token ratio as price. A large trade can move this price dramatically within one block. TWAP oracles average price over many blocks, making single-block manipulation economically infeasible.",
      },
      {
        question: "What makes flash loan attacks unique compared to standard exploits?",
        options: [
          "They require no upfront capital — the loan is borrowed and repaid in a single atomic transaction",
          "They can only be used to steal tokens, not ETH",
          "They bypass all smart contract logic",
          "They require a compromised validator node",
        ],
        correct: 0,
        explanation: "Flash loans are uncollateralized and must be repaid in the same transaction. This means an attacker with zero capital can temporarily control millions of dollars to execute an exploit, as long as the loan is repaid before the transaction ends.",
      },
    ],
  },

  // Poly Network (2021)
  {
    id: "poly-network-2021",
    slug: "poly-network-2021",
    title: "Poly Network",
    subtitle: "Cross-Chain Message Forgery — $611M",
    year: 2021,
    chain: "Multi-chain",
    type: ["Bridge", "Access Control"],
    shortDesc:
      "Attacker forged cross-chain messages to reassign the 'keeper' role, then drained $611M across Ethereum, BSC, and Polygon — most of which was voluntarily returned.",
    longDesc:
      "Poly Network was a cross-chain interoperability protocol. In August 2021, an attacker discovered that the EthCrossChainManager contract would execute arbitrary calls when processing cross-chain messages, without adequately validating who could modify the keeper list. By crafting a fake cross-chain message, the attacker replaced the keeper (the entity allowed to execute withdrawals) with their own address across all three chains, then drained $611M. Remarkably, the attacker later returned almost all funds.",
    technicalDesc:
      "The EthCrossChainManager contract verified cross-chain messages and executed them via a _executeCrossChainTx internal function. The attacker crafted a malicious cross-chain payload that called EthCrossChainData.putCurEpochConPubKeyBytes() — the function that sets keeper public keys — using the manager contract as the caller. Since the manager called it with its own address (trusted), the key rotation went through, replacing all keepers with attacker-controlled keys.",
    impact: "$611M (most returned)",
    impactUSD: 611000000,
    contracts: [
      {
        label: "EthCrossChainManager",
        address: "0x838bf9E95CB12Dd76a54C9f9D2E3082EAF928270",
        url: "https://etherscan.io/address/0x838bf9E95CB12Dd76a54C9f9D2E3082EAF928270",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Analyze Cross-Chain Logic",
        description: "Attacker discovers EthCrossChainManager executes arbitrary calldata from cross-chain messages, trusting the manager contract as caller.",
        functionsCall: [],
        pseudocode: "// _executeCrossChainTx(toContract, toMethod, args)\n// Any cross-chain message can target any contract\n// Manager contract is trusted caller",
        timestamp: "Aug 10, 2021",
      },
      {
        id: "t2",
        phase: "Forge Keeper Rotation Message",
        description: "Attacker crafts a cross-chain message calling putCurEpochConPubKeyBytes() to replace keeper keys with attacker-controlled keys.",
        functionsCall: ["EthCrossChainData.putCurEpochConPubKeyBytes(attackerKey)"],
        pseudocode:
          "// Crafted cross-chain payload:\n// toContract: EthCrossChainData\n// toMethod: putCurEpochConPubKeyBytes\n// args: [attacker_public_key_bytes]",
      },
      {
        id: "t3",
        phase: "Submit to All Three Chains",
        description: "Attacker submits the forged message on ETH, BSC, and Polygon, replacing keepers on all chains simultaneously.",
        functionsCall: ["EthCrossChainManager.verifyHeaderAndExecuteTx(forgedMsg)"],
        pseudocode: "for chain in [ETH, BSC, POLYGON]:\n    submitFakeKeeperRotation(chain, attackerKey)",
      },
      {
        id: "t4",
        phase: "Drain Assets",
        description: "With keeper keys replaced, attacker signs and executes withdrawal transactions across all three chains.",
        functionsCall: ["LockProxy.unlock(ETH_assets)", "LockProxy.unlock(BSC_assets)", "LockProxy.unlock(POLY_assets)"],
        pseudocode:
          "// Attacker signs withdrawal with their keeper key\n// Bridge releases: ~$273M ETH, ~$253M BSC, ~$85M Polygon",
      },
      {
        id: "t5",
        phase: "Negotiation & Return",
        description: "Poly Network contacts the attacker publicly. The attacker, calling themselves 'Mr. White Hat,' gradually returns all funds over several days.",
        functionsCall: [],
        pseudocode: "// Attacker claims attack was to expose vulnerability\n// Returns ~$610M over 2 weeks\n// $33M USDT frozen by Tether before return",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Forged cross-chain messages", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "EthCrossChainManager", detail: "Executes cross-chain calls", x: 270, y: 200 },
        { id: "n3", type: "contract", label: "EthCrossChainData", detail: "Keeper key storage", x: 500, y: 100 },
        { id: "n4", type: "bridge", label: "LockProxy (ETH/BSC/POLY)", detail: "Asset vault", x: 500, y: 300 },
        { id: "n5", type: "result", label: "Attacker Wallets\n$611M", detail: "Mostly returned", x: 750, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Submit forged message" },
        { id: "e2", source: "n2", target: "n3", label: "putCurEpochConPubKeyBytes(attackerKey)", animated: true },
        { id: "e3", source: "n1", target: "n4", label: "Sign withdraw with new keeper key" },
        { id: "e4", source: "n4", target: "n5", label: "Drain $611M across chains", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "ETH LockProxy\n$273M", type: "vault" },
      { id: "b", label: "BSC LockProxy\n$253M", type: "vault" },
      { id: "c", label: "Polygon LockProxy\n$85M", type: "vault" },
      { id: "d", label: "Attacker\n$611M total", type: "attacker" },
      { id: "e", label: "Returned\n~$610M", type: "pool" },
      { id: "f", label: "Net Loss\n~$1M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "d", value: 273, label: "Keeper key forgery" },
      { source: "b", target: "d", value: 253, label: "Keeper key forgery" },
      { source: "c", target: "d", value: 85, label: "Keeper key forgery" },
      { source: "d", target: "e", value: 610, label: "Voluntarily returned" },
      { source: "d", target: "f", value: 1, label: "Retained" },
    ],
    mitigations: [
      {
        category: "Restrict Cross-Chain Call Targets",
        description: "Never allow cross-chain messages to call privileged admin functions. Whitelist valid target contracts and function selectors.",
        code: "require(allowedTargets[toContract][toMethod], 'target not allowed');",
      },
      {
        category: "Multi-Sig Keeper Rotation",
        description: "Require M-of-N signatures from existing keepers to rotate the keeper set. Never allow a single message to change critical roles.",
      },
      {
        category: "Time-Locks on Role Changes",
        description: "Add a 24–72 hour time-lock on any change to keeper or admin roles so the community can detect and respond to unauthorized changes.",
      },
    ],
    quiz: [
      {
        question: "How did the attacker take control of Poly Network's bridge?",
        options: [
          "They compromised a validator's private key via phishing",
          "They found a reentrancy bug in the LockProxy contract",
          "They forged a cross-chain message that called the keeper-rotation function through the trusted manager contract",
          "They exploited an integer overflow in the cross-chain signature validator",
        ],
        correct: 2,
        explanation: "The EthCrossChainManager trusted its own address when executing cross-chain calls. By crafting a message that made the manager call putCurEpochConPubKeyBytes(), the attacker rotated keeper keys to their own without needing any existing keys.",
      },
    ],
  },

  // Wormhole (2022)
  {
    id: "wormhole-bridge-2022",
    slug: "wormhole-bridge-2022",
    title: "Wormhole Bridge",
    subtitle: "Signature Bypass Mints 120K Phantom wETH",
    year: 2022,
    chain: "Multi-chain",
    type: ["Bridge", "Access Control"],
    shortDesc:
      "A deprecated, insecure Solana syscall allowed an attacker to forge guardian signatures, minting 120,000 wETH (~$325M) on Solana without burning any ETH on Ethereum.",
    longDesc:
      "Wormhole is a cross-chain bridge connecting Solana and Ethereum. In February 2022, an attacker exploited a signature verification flaw in the Solana side of the bridge. The guardian network normally validates cross-chain messages using secp256k1 signatures. The attacker found that a deprecated `load_instruction_at` syscall (which reads instruction data from the transaction) could be spoofed to appear as if the system program validated the signatures — bypassing the guardian check entirely. The attacker minted 120,000 wETH on Solana and swapped/bridged it out for real ETH.",
    technicalDesc:
      "Wormhole's Solana program verified guardian signatures by calling Solana's secp256k1 program and reading the result via `load_instruction_at`. The deprecated syscall read from an address the attacker could control. By structuring the transaction such that the instruction data at the expected offset appeared valid, the attacker spoofed the signature verification outcome. Jump Crypto (Wormhole's backer) replenished the $325M shortly after.",
    impact: "$325M",
    impactUSD: 325000000,
    contracts: [
      {
        label: "Wormhole Core Bridge (Solana)",
        address: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
        url: "https://solscan.io/account/worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Find Deprecated Syscall",
        description: "Attacker discovers Wormhole's Solana program uses the deprecated load_instruction_at syscall to verify guardian signatures instead of the secure current equivalent.",
        functionsCall: [],
        pseudocode: "// Vulnerable: sysvar::instructions::load_instruction_at(index, &instructions_account)\n// Deprecated and controllable by attacker via crafted transaction",
        timestamp: "Feb 2, 2022",
      },
      {
        id: "t2",
        phase: "Craft Fake VAA",
        description: "Attacker constructs a Verified Action Approval (VAA) message claiming 120,000 ETH were deposited on Ethereum, with spoofed guardian signatures.",
        functionsCall: ["wormhole.post_vaa(fakeVAA)"],
        pseudocode:
          "// VAA = cross-chain message with guardian signatures\n// Attacker crafts fake signatures\n// Syscall spoof makes them appear valid",
      },
      {
        id: "t3",
        phase: "Signature Bypass",
        description: "The deprecated syscall is tricked into reporting valid signature verification, bypassing the guardian threshold check.",
        functionsCall: ["secp256k1_program.verify(spoofed)"],
        pseudocode:
          "// Wormhole reads instruction data at controlled offset\n// Data appears to show valid signature count\n// Guardian check passes without real signatures",
      },
      {
        id: "t4",
        phase: "Mint Phantom wETH",
        description: "Wormhole mints 120,000 wETH on Solana, backed by nothing — no ETH was ever deposited on Ethereum.",
        functionsCall: ["TokenBridge.complete_wrapped(120000 wETH)"],
        pseudocode: "// 120,000 wETH minted on Solana\n// No corresponding ETH locked on Ethereum",
      },
      {
        id: "t5",
        phase: "Drain & Swap",
        description: "Attacker swaps wETH back through the bridge and on DEXes, obtaining real ETH worth $325M.",
        functionsCall: ["bridge.transfer_wrapped(120000 wETH → ETH)"],
        pseudocode: "// ~$325M real ETH obtained\n// Jump Crypto replenishes bridge hours later",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Crafted fake VAA message", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Wormhole Solana\nProgram", detail: "Deprecated syscall verify", x: 280, y: 200 },
        { id: "n3", type: "oracle", label: "load_instruction_at\n(Deprecated)", detail: "Spoofable syscall", x: 480, y: 120 },
        { id: "n4", type: "pool", label: "ETH Liquidity\nPool (Solana)", detail: "$325M real ETH", x: 480, y: 300 },
        { id: "n5", type: "result", label: "Attacker\n120K wETH", detail: "$325M extracted", x: 720, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Submit fake VAA" },
        { id: "e2", source: "n2", target: "n3", label: "Verify via deprecated syscall" },
        { id: "e3", source: "n3", target: "n2", label: "Spoofed valid result", animated: true },
        { id: "e4", source: "n2", target: "n4", label: "Mint 120K wETH" },
        { id: "e5", source: "n4", target: "n5", label: "Bridge back for real ETH", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Wormhole ETH\nVault (Solana)", type: "vault" },
      { id: "b", label: "Fake VAA\n(No ETH locked)", type: "bridge" },
      { id: "c", label: "Attacker\n120K wETH", type: "attacker" },
      { id: "d", label: "DEX Swaps\n(wETH → ETH)", type: "pool" },
      { id: "e", label: "Real ETH\n$325M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 325, label: "Bypass signature verify" },
      { source: "b", target: "c", value: 325, label: "Mint phantom wETH" },
      { source: "c", target: "d", value: 325, label: "Swap to real ETH" },
      { source: "d", target: "e", value: 325, label: "Attacker profit" },
    ],
    mitigations: [
      {
        category: "Avoid Deprecated APIs",
        description: "Regularly audit all syscalls and library functions for deprecation. Deprecated functions may lack safety checks of their successors.",
      },
      {
        category: "Cryptographic Signature Verification",
        description: "Verify guardian signatures using the current, audited secp256k1 instruction — never derive verification results from attacker-influenced instruction data.",
      },
      {
        category: "Guardian Threshold",
        description: "Require genuine M-of-N guardian signatures verified in a reproducible, non-spoofable way. Add monitoring for large mint events with no corresponding deposit.",
      },
    ],
    quiz: [
      {
        question: "What was the core flaw in Wormhole's Solana guardian verification?",
        options: [
          "Guardian private keys were stored on-chain",
          "The bridge contract had no signature check at all",
          "A deprecated syscall for reading instruction data could be spoofed by the attacker",
          "The guardian set was empty after a rotation bug",
        ],
        correct: 2,
        explanation: "The deprecated `load_instruction_at` syscall read instruction data from an attacker-controlled location. By crafting the transaction structure carefully, the attacker made the verification appear to succeed without valid guardian signatures.",
      },
    ],
  },

  // Ronin (2022)
  {
    id: "ronin-network-2022",
    slug: "ronin-network-2022",
    title: "Ronin Network",
    subtitle: "Lazarus Group Compromises 5 of 9 Validators",
    year: 2022,
    chain: "Multi-chain",
    type: ["Bridge", "Access Control"],
    shortDesc:
      "North Korea's Lazarus Group compromised 5 of 9 Ronin validator keys via social engineering, forging withdrawals of 173,600 ETH and 25.5M USDC ($625M).",
    longDesc:
      "Ronin is the Ethereum sidechain powering Axie Infinity. Its bridge required 5-of-9 validator signatures for withdrawals. In late 2021, Lazarus Group phished Sky Mavis employees, gaining access to four validator keys. A fifth key had been temporarily granted to Axie DAO during a high-traffic period but never revoked. Using all five compromised keys, attackers forged two massive withdrawal transactions in March 2022 — the theft went undetected for six days.",
    technicalDesc:
      "Ronin's bridge contract checked for ≥ 5-of-9 validator signatures via ECDSA verification. The attacker obtained private keys for 4 Sky Mavis validators (via malware on employee machines) and 1 Axie DAO validator (whose temporary access grant was never revoked). With 5 valid signatures, the bridge executed two transactions: 173,600 ETH and 25.5M USDC. The exploit was only discovered when a user tried to withdraw 5,000 ETH and the bridge reported insufficient funds.",
    impact: "$625M (173,600 ETH + 25.5M USDC)",
    impactUSD: 625000000,
    contracts: [
      {
        label: "Ronin Bridge Contract",
        address: "0x1A2a1c938CE3eC39b6D47113c7955bAa9DD454F2",
        url: "https://etherscan.io/address/0x1A2a1c938CE3eC39b6D47113c7955bAa9DD454F2",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Social Engineering (Lazarus)",
        description: "Lazarus Group spear-phishes Sky Mavis employees with fake job offers. Malware-laced PDFs give attackers access to internal systems.",
        functionsCall: [],
        pseudocode: "// Attack vector: LinkedIn fake job offer\n// PDF contains DPRK-linked malware\n// Sky Mavis internal VPN access obtained",
        timestamp: "Nov 2021",
      },
      {
        id: "t2",
        phase: "Validator Key Exfiltration",
        description: "Attackers pivot from internal systems to validator nodes, exfiltrating private keys for 4 of 9 Sky Mavis validators.",
        functionsCall: [],
        pseudocode: "// 4 of 9 Sky Mavis validator keys compromised\n// Keys stored on validator nodes without HSM",
      },
      {
        id: "t3",
        phase: "Unrevoked Axie DAO Key",
        description: "Attackers discover a 5th Axie DAO validator key was granted temporary access in 2021 and never revoked — giving them 5-of-9 threshold.",
        functionsCall: [],
        pseudocode: "// Axie DAO validator temporarily added Nov 2021\n// Never removed from validator set\n// Total: 5 keys in hand",
        timestamp: "Mar 2022",
      },
      {
        id: "t4",
        phase: "Forge Withdrawals",
        description: "Attackers sign two withdrawal transactions with 5 keys: 173,600 ETH and 25.5M USDC.",
        functionsCall: ["RoninBridge.withdrawERC20(173600 ETH)", "RoninBridge.withdrawERC20(25.5M USDC)"],
        pseudocode:
          "// Bridge validates >= 5 of 9 ECDSA signatures\n// Both transactions pass threshold check\n// Executed Mar 23, 2022 — unnoticed for 6 days",
      },
      {
        id: "t5",
        phase: "Discovery & Response",
        description: "A user attempts to withdraw 5,000 ETH and gets an error. Sky Mavis discovers the breach 6 days later.",
        functionsCall: [],
        pseudocode: "// Bridge balance: 0 ETH\n// Sky Mavis pauses bridge\n// Binance and U.S. Treasury sanction Lazarus Group mixer addresses",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Lazarus Group\n(DPRK)", detail: "State-sponsored hackers", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "4 Sky Mavis\nValidator Keys", detail: "Phished from employees", x: 270, y: 120 },
        { id: "n3", type: "contract", label: "1 Axie DAO\nValidator Key", detail: "Unrevoked temp access", x: 270, y: 300 },
        { id: "n4", type: "bridge", label: "Ronin Bridge\n(5-of-9 check)", detail: "$625M ETH + USDC", x: 500, y: 200 },
        { id: "n5", type: "result", label: "Attacker\nWallets", detail: "$625M drained", x: 750, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Spear-phish → malware" },
        { id: "e2", source: "n1", target: "n3", label: "Exploit unrevoked access" },
        { id: "e3", source: "n2", target: "n4", label: "4 valid signatures", animated: true },
        { id: "e4", source: "n3", target: "n4", label: "5th signature → threshold met", animated: true },
        { id: "e5", source: "n4", target: "n5", label: "Drain $625M", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Ronin Bridge\n$625M", type: "bridge" },
      { id: "b", label: "5 Compromised\nValidator Keys", type: "multisig" },
      { id: "c", label: "Attacker\n(Lazarus)", type: "attacker" },
      { id: "d", label: "Tornado Cash /\nMixers", type: "pool" },
      { id: "e", label: "N. Korea\nFunds", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 625, label: "Threshold: 5-of-9 met" },
      { source: "b", target: "c", value: 625, label: "2 forged withdrawals" },
      { source: "c", target: "d", value: 625, label: "Laundering via mixers" },
      { source: "d", target: "e", value: 625, label: "DPRK funding" },
    ],
    mitigations: [
      {
        category: "Hardware Security Modules (HSM)",
        description: "Store validator private keys in HSMs or MPC (multi-party computation) wallets. Keys should never exist in plaintext on networked machines.",
      },
      {
        category: "Permission Audits",
        description: "Regularly audit and immediately revoke temporary role grants. Use on-chain expiry for temporary validator access.",
        code: "struct ValidatorAccess {\n  address validator;\n  uint256 expiresAt; // auto-expire\n}\nrequire(block.timestamp < access.expiresAt, 'expired');",
      },
      {
        category: "Higher Threshold",
        description: "Increase the signature threshold to 7-of-9 or higher, and use geographically/organizationally diverse validators to reduce phishing blast radius.",
      },
    ],
    quiz: [
      {
        question: "How did Lazarus Group obtain the 5th validator key needed to pass the Ronin threshold?",
        options: [
          "They brute-forced the key using a quantum computer",
          "An Axie DAO validator key had temporary bridge access that was never revoked",
          "They exploited a reentrancy bug in the bridge to gain signing rights",
          "They socially engineered the Axie DAO multisig holders to sign the transaction",
        ],
        correct: 1,
        explanation: "In late 2021, Axie DAO was temporarily granted validator access to handle high traffic. This access was never removed. Lazarus Group discovered and exploited this unrevoked permission as the 5th of 9 signatures needed.",
      },
    ],
  },

  // Beanstalk (2022)
  {
    id: "beanstalk-2022",
    slug: "beanstalk-2022",
    title: "Beanstalk Farms",
    subtitle: "Flash Loan Governance Vote Drains Treasury",
    year: 2022,
    chain: "Ethereum",
    type: ["Flash Loan", "Governance"],
    shortDesc:
      "Attacker used a $1B flash loan to acquire supermajority governance votes, then executed a malicious proposal draining $182M from the Beanstalk treasury in the same block.",
    longDesc:
      "Beanstalk Farms was an algorithmic stablecoin protocol governed by BEAN token holders. The governance system had no timelock — proposals could be proposed and executed in the same transaction if they achieved a supermajority. In April 2022, an attacker took a $1B flash loan, deposited the funds as governance tokens (gaining 79% voting power), created a malicious governance proposal that drained the treasury, voted with their flash-loan-powered votes, executed the proposal, and repaid the loan — all atomically in one transaction.",
    technicalDesc:
      "Beanstalk's emergencyCommit() allowed immediate execution of proposals with a 2/3 supermajority. The attacker: (1) borrowed ~$1B via Aave flash loan; (2) deposited into Beanstalk's Silo to receive 79% of voting power; (3) submitted BIP-18 (a malicious proposal sending all protocol assets to the attacker); (4) called emergencyCommit() with their majority; (5) executed the drain; (6) withdrew from Silo; (7) repaid flash loan. The governance system had no protection against flash-loan-enabled vote buying.",
    impact: "$182M",
    impactUSD: 182000000,
    contracts: [
      {
        label: "Beanstalk Diamond",
        address: "0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5",
        url: "https://etherscan.io/address/0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Flash Loan $1B",
        description: "Attacker borrows ~$1B in stablecoins and ETH from Aave and other protocols as a flash loan.",
        functionsCall: ["Aave.flashLoan(350M DAI, 500M USDC, 150M USDT)"],
        pseudocode: "// ~$1B borrowed in single tx\n// Flash loan must be repaid by tx end",
        timestamp: "Apr 17, 2022",
      },
      {
        id: "t2",
        phase: "Deposit for Voting Power",
        description: "Flash loaned funds are deposited into Beanstalk's Silo, minting BEAN:3CRV LP tokens that grant governance voting power.",
        functionsCall: ["Silo.deposit(1B stablecoins)"],
        pseudocode: "// Depositing gives ~79% of total governance votes\n// No lockup required — can withdraw in same block",
      },
      {
        id: "t3",
        phase: "Submit Malicious Proposal",
        description: "Attacker had previously submitted BIP-18 — a governance proposal to transfer all protocol assets to the attacker's wallet.",
        functionsCall: ["Governance.propose(BIP-18)"],
        pseudocode: "// BIP-18: transfer all BEAN, ETH, 3CRV\n// to attacker address\n// No timelock = immediately executable with supermajority",
      },
      {
        id: "t4",
        phase: "Vote & Execute",
        description: "With 79% voting power, attacker calls emergencyCommit() to immediately execute BIP-18, draining all treasury assets.",
        functionsCall: ["Governance.emergencyCommit(BIP-18)", "Treasury.transferAll(attacker)"],
        pseudocode: "// 79% > 66.7% supermajority threshold\n// emergencyCommit() skips timelock\n// $182M drained in single call",
      },
      {
        id: "t5",
        phase: "Repay & Profit",
        description: "Attacker withdraws from Silo, repays flash loan, and exits with $80M profit (after donating $250K to Ukraine relief).",
        functionsCall: ["Silo.withdraw()", "Aave.repay(flashLoan)"],
        pseudocode: "// $182M drained from treasury\n// ~$1B flash loan repaid\n// Net profit: ~$80M\n// $250K donated to Ukraine",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Single atomic tx", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Aave Flash Loan\n~$1B", detail: "Uncollateralized", x: 240, y: 100 },
        { id: "n3", type: "contract", label: "Beanstalk Silo\n(Voting Power)", detail: "79% acquired instantly", x: 440, y: 100 },
        { id: "n4", type: "contract", label: "Governance\nBIP-18", detail: "No timelock, emergencyCommit", x: 440, y: 300 },
        { id: "n5", type: "vault", label: "Beanstalk Treasury\n$182M", detail: "BEAN, ETH, 3CRV", x: 640, y: 200 },
        { id: "n6", type: "result", label: "Attacker\n$80M Profit", detail: "After flash loan repaid", x: 840, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Borrow $1B flash loan", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Deposit → 79% votes" },
        { id: "e3", source: "n3", target: "n4", label: "emergencyCommit(BIP-18)" },
        { id: "e4", source: "n4", target: "n5", label: "Execute drain proposal" },
        { id: "e5", source: "n5", target: "n6", label: "Drain $182M → repay loan", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Aave Flash Loan\n$1B", type: "pool" },
      { id: "b", label: "Beanstalk Silo\n(79% votes)", type: "vault" },
      { id: "c", label: "Attacker\nBIP-18 voter", type: "attacker" },
      { id: "d", label: "Beanstalk Treasury\n$182M", type: "multisig" },
      { id: "e", label: "Net Profit\n$80M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 182, label: "Buy governance votes" },
      { source: "b", target: "c", value: 182, label: "79% supermajority" },
      { source: "c", target: "d", value: 182, label: "emergencyCommit(BIP-18)" },
      { source: "d", target: "e", value: 80, label: "Profit after flash repay" },
      { source: "d", target: "a", value: 102, label: "Repay flash loan" },
    ],
    mitigations: [
      {
        category: "Governance Timelock",
        description: "All governance proposals must have a mandatory delay (48–72 hours minimum) between proposal and execution. This prevents same-block flash loan attacks.",
        code: "uint256 constant TIMELOCK = 2 days;\nfunction execute(uint proposalId) external {\n  require(block.timestamp >= proposals[proposalId].eta, 'too early');\n}",
      },
      {
        category: "Snapshot Voting",
        description: "Use voting power snapshotted at the proposal creation block, not the execution block. Flash-loan-acquired tokens at execution time are worthless.",
      },
      {
        category: "Remove Emergency Commit",
        description: "Remove or strictly limit emergencyCommit() patterns. If emergency governance is needed, use a separate multi-sig with time-locked guardian roles.",
      },
    ],
    quiz: [
      {
        question: "What governance design flaw enabled the Beanstalk attack?",
        options: [
          "The governance token contract had a reentrancy bug",
          "No timelock + flash-loan-eligible voting power + emergencyCommit() allowing same-block execution",
          "The attacker was an existing large BEAN holder",
          "A centralized admin key was compromised",
        ],
        correct: 1,
        explanation: "Three flaws combined: (1) voting power was based on tokens held at execution time, not snapshot; (2) emergencyCommit() skipped the timelock; (3) there was no protection against flash loans temporarily inflating voting power.",
      },
    ],
  },

  // Nomad Bridge (2022)
  {
    id: "nomad-bridge-2022",
    slug: "nomad-bridge-2022",
    title: "Nomad Bridge",
    subtitle: "Zero-Root Config Bug Enables Crowd Looting",
    year: 2022,
    chain: "Multi-chain",
    type: ["Bridge"],
    shortDesc:
      "A single initialization error set the trusted root to zero, allowing anyone to submit fraudulent withdrawal messages — leading to chaotic crowd-sourced looting of $190M.",
    longDesc:
      "Nomad Bridge was a cross-chain messaging bridge. During a routine upgrade in August 2022, a developer set the trusted root (the Merkle root used to validate messages) to 0x0. In the Nomad verification logic, any message with a zero root was considered pre-approved. This meant literally any user could copy a valid withdrawal transaction, change the recipient address to their own, and submit it — repeatedly. Within hours, hundreds of copycats had drained the bridge in a chaotic free-for-all.",
    technicalDesc:
      "Nomad's Replica contract's `process()` function checked if a message's leaf was included in an accepted root using `acceptableRoot(messages[_messageHash])`. The initialization set `confirmAt[0x0] = 1`, making the zero hash root immediately valid. When a message was first processed with a valid proof against the zero root, subsequent messages could reuse `0x0` as their root (since messages were not removed from the accepted set). Anyone could take any processed withdrawal, swap the recipient, and replay it.",
    impact: "~$190M",
    impactUSD: 190000000,
    contracts: [
      {
        label: "Nomad Replica (ETH)",
        address: "0x5D94309E5a0090b165FA4181519701637B6DAEBA",
        url: "https://etherscan.io/address/0x5D94309E5a0090b165FA4181519701637B6DAEBA",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Initialization Bug Deployed",
        description: "During an upgrade, confirmAt[0x0] is set to 1, making the zero Merkle root trusted by the bridge immediately.",
        functionsCall: ["Replica.initialize(0x0, confirmAt=1)"],
        pseudocode: "// confirmAt[0x0] = 1\n// This means any message whose root is 0x0 is immediately valid\n// Zero root is accepted without any Merkle proof",
        timestamp: "Aug 2, 2022",
      },
      {
        id: "t2",
        phase: "First Legitimate(ish) Withdrawal",
        description: "An attacker discovers the bug and submits a fake withdrawal proof against the 0x0 root, withdrawing 100 WBTC.",
        functionsCall: ["Replica.process(fakeMsg_0x0root)"],
        pseudocode:
          "// Message: withdraw 100 WBTC to attacker\n// Root: 0x0 (accepted!)\n// No Merkle proof required",
      },
      {
        id: "t3",
        phase: "Crowd Looting",
        description: "Other users notice the attack on-chain and start copying transactions — just changing the recipient address. Hundreds join the free-for-all.",
        functionsCall: ["Replica.process(copiedMsg_changedRecipient) × hundreds"],
        pseudocode:
          "// Anyone can:\n// 1. Copy a valid withdrawal calldata\n// 2. Replace 'to' address with their wallet\n// 3. Submit and receive funds\n// No technical skill required",
      },
      {
        id: "t4",
        phase: "Bridge Drained",
        description: "In roughly 3 hours, ~$190M is drained across hundreds of transactions by dozens of different addresses.",
        functionsCall: [],
        pseudocode: "// Total drained: ~$190M\n// Some 'white hats' return funds later\n// Nomad pauses bridge",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "First Attacker", detail: "Discovered zero-root bug", x: 50, y: 150 },
        { id: "n2", type: "attacker", label: "Crowd Looters\n(Hundreds)", detail: "Copied transactions", x: 50, y: 300 },
        { id: "n3", type: "contract", label: "Nomad Replica", detail: "Zero-root = trusted", x: 300, y: 200 },
        { id: "n4", type: "bridge", label: "Nomad Bridge\n$190M", detail: "WBTC, ETH, USDC, DAI", x: 540, y: 200 },
        { id: "n5", type: "result", label: "Distributed\nWallets", detail: "$190M gone", x: 760, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n3", label: "0x0 root bypass" },
        { id: "e2", source: "n2", target: "n3", label: "Copy & replay txs", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Messages accepted" },
        { id: "e4", source: "n4", target: "n5", label: "Drain $190M", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Nomad Bridge\n$190M", type: "bridge" },
      { id: "b", label: "Zero Root (0x0)\nAlways Trusted", type: "vault" },
      { id: "c", label: "First Attacker\n(Finds Bug)", type: "attacker" },
      { id: "d", label: "Crowd Looters\n(Hundreds)", type: "pool" },
      { id: "e", label: "Funds Dispersed\n~$190M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 190, label: "Merkle verification" },
      { source: "b", target: "c", value: 20, label: "First exploit" },
      { source: "b", target: "d", value: 170, label: "Crowd copy attack" },
      { source: "c", target: "e", value: 20, label: "Attacker profit" },
      { source: "d", target: "e", value: 170, label: "Dispersed to many" },
    ],
    mitigations: [
      {
        category: "Deployment Testing",
        description: "Verify all initialized values post-deployment using automated checks. Zero values in Merkle roots or trusted hashes should trigger alerts.",
        code: "require(trustedRoot != bytes32(0), 'zero root not allowed');\nassert(confirmAt[trustedRoot] > 0);",
      },
      {
        category: "Invariant Monitoring",
        description: "Monitor for patterns like 'same calldata, different recipient' on-chain. Anomaly detection should pause the bridge automatically.",
      },
      {
        category: "Post-Upgrade Verification",
        description: "Run a full integration test suite against the deployed contract (not a fork) after every upgrade before opening to users.",
      },
    ],
    quiz: [
      {
        question: "What single configuration error caused the Nomad Bridge exploit?",
        options: [
          "The bridge admin key was set to the zero address",
          "The trusted Merkle root was initialized to 0x0, making any message with zero root valid",
          "The signature threshold was set to 0",
          "The bridge token whitelist was cleared",
        ],
        correct: 1,
        explanation: "Setting confirmAt[0x0] = 1 made the zero Merkle root immediately trusted. Since any message could claim a zero root, any user could bypass proof validation and submit fake withdrawal messages.",
      },
    ],
  },

  // Euler Finance (2023)
  {
    id: "euler-finance-2023",
    slug: "euler-finance-2023",
    title: "Euler Finance",
    subtitle: "Flash Loan + Missing Health Check = $197M",
    year: 2023,
    chain: "Ethereum",
    type: ["Flash Loan", "Access Control"],
    shortDesc:
      "A missing health check in donateToReserves() let an attacker create bad debt via flash loan, then self-liquidate with a controlled liquidator contract for $197M — most recovered.",
    longDesc:
      "Euler Finance was a permissionless lending protocol. In March 2023, an attacker exploited a missing liquidity check in the donateToReserves() function that had been introduced in a previous code change. By flash-loaning DAI, depositing it, minting maximum eTokens (collateral) and dTokens (debt), then calling donateToReserves() (which donated collateral without a health check), the attacker made their position instantly liquidatable with a massive bonus. A controlled liquidator contract then liquidated the bad debt, claiming far more collateral than the debt was worth. The attacker later returned most of the $197M after negotiation.",
    technicalDesc:
      "Euler's donateToReserves(amount) reduced eToken balance (collateral) without checking if the resulting health score remained > 1. Combined with an over-leveraged position created via mintSelf() (which minted both collateral tokens and debt tokens simultaneously), this allowed creating intentional bad debt. The self-liquidation mechanic then awarded the liquidator (attacker) a bonus collateral greater than the debt, extracting value from other depositors.",
    impact: "$197M (most recovered)",
    impactUSD: 197000000,
    contracts: [
      {
        label: "Euler Protocol (Ethereum)",
        address: "0x27182842E098f60e3D576794A5bFFb0777E025d3",
        url: "https://etherscan.io/address/0x27182842E098f60e3D576794A5bFFb0777E025d3",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Flash Loan DAI",
        description: "Attacker flash-loans 30M DAI from Aave to fund the exploit.",
        functionsCall: ["Aave.flashLoan(30M DAI)"],
        pseudocode: "// Borrow 30M DAI from Aave\n// Must repay by end of tx",
        timestamp: "Mar 13, 2023",
      },
      {
        id: "t2",
        phase: "Deposit + MintSelf",
        description: "Deposits 20M DAI into Euler, then calls mintSelf() 10x to mint maximum eDAI (collateral) and dDAI (debt) simultaneously.",
        functionsCall: ["Euler.deposit(20M DAI)", "Euler.mintSelf(200M eDAI, 200M dDAI)"],
        pseudocode:
          "// mintSelf() creates eTokens + matching debt tokens\n// Health score starts at 1.0 (just solvent)",
      },
      {
        id: "t3",
        phase: "donateToReserves (Bug)",
        description: "Attacker calls donateToReserves(10M eDAI), reducing their collateral WITHOUT a health check — instantly making position undercollateralised.",
        functionsCall: ["Euler.donateToReserves(10M eDAI)"],
        pseudocode:
          "// donateToReserves reduces collateral\n// NO healthcheck after operation\n// Position is now: 190M eDAI collateral, 200M dDAI debt\n// Health < 1 = liquidatable",
      },
      {
        id: "t4",
        phase: "Self-Liquidation",
        description: "Attacker's second contract (liquidator) liquidates the first contract's unhealthy position, claiming a large collateral bonus.",
        functionsCall: ["Euler.liquidate(victimContract, 200M dDAI, minCollateral=250M eDAI)"],
        pseudocode:
          "// Liquidator claims 250M eDAI for repaying 200M dDAI\n// Liquidation bonus > 20%\n// Net collateral surplus goes to attacker-controlled liquidator",
      },
      {
        id: "t5",
        phase: "Withdraw & Repay",
        description: "Liquidator redeems eDAI for underlying DAI, repays flash loan, pockets the difference.",
        functionsCall: ["Euler.withdraw(250M eDAI → DAI)", "Aave.repay(30M DAI)"],
        pseudocode: "// $197M extracted across multiple attack txs\n// Attacker returns $177M after negotiation\n// Keeps ~$20M",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "2-contract setup", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Aave Flash Loan\n30M DAI", detail: "Seed capital", x: 230, y: 100 },
        { id: "n3", type: "contract", label: "Euler Deposit\n+ mintSelf()", detail: "Over-leveraged position", x: 440, y: 100 },
        { id: "n4", type: "contract", label: "donateToReserves\n(No Health Check)", detail: "Root vulnerability", x: 440, y: 280 },
        { id: "n5", type: "contract", label: "Self-Liquidation\n+20% bonus", detail: "Attacker controls liquidator", x: 660, y: 200 },
        { id: "n6", type: "result", label: "Attacker\n$197M", detail: "Most returned", x: 860, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Flash loan", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Deposit + over-leverage" },
        { id: "e3", source: "n3", target: "n4", label: "Donate collateral (no check)" },
        { id: "e4", source: "n4", target: "n5", label: "Position unhealthy → liquidate" },
        { id: "e5", source: "n5", target: "n6", label: "Collateral surplus extracted", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Aave Flash Loan\n30M DAI", type: "pool" },
      { id: "b", label: "Euler Protocol\neDAI/dDAI", type: "vault" },
      { id: "c", label: "Attacker Borrower\n(Over-leveraged)", type: "attacker" },
      { id: "d", label: "Attacker Liquidator\n(Self-liquidation)", type: "multisig" },
      { id: "e", label: "Net Profit\n$197M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "c", value: 197, label: "Flash loan seed" },
      { source: "c", target: "b", value: 197, label: "Deposit + mintSelf" },
      { source: "b", target: "c", value: 197, label: "donateToReserves bug" },
      { source: "c", target: "d", value: 197, label: "Liquidate own position" },
      { source: "d", target: "e", value: 197, label: "Collateral bonus drained" },
    ],
    mitigations: [
      {
        category: "Health Check on All State Changes",
        description: "Every function that modifies collateral or debt must call a health check at the end. Never allow a user's health score to drop below 1 via a direct call.",
        code: "function donateToReserves(uint amount) external {\n  _reduceCollateral(msg.sender, amount);\n  require(healthScore(msg.sender) >= 1e18, 'unhealthy after donate');\n}",
      },
      {
        category: "Invariant Testing",
        description: "Use Foundry invariant testing to assert that no single function call can make a position unhealthy without prior under-collateralization.",
      },
      {
        category: "Self-Liquidation Restrictions",
        description: "Prevent a contract from liquidating its own associated positions. Require liquidator !== borrower and no shared ownership in the same block.",
      },
    ],
    quiz: [
      {
        question: "What was the root cause of the Euler Finance exploit?",
        options: [
          "A reentrancy bug in the flashLoan() function",
          "The donateToReserves() function reduced collateral without checking the resulting health score",
          "An oracle price manipulation that inflated collateral value",
          "Admin key compromise of the Euler timelock",
        ],
        correct: 1,
        explanation: "donateToReserves() was meant to let users voluntarily donate collateral to the reserve pool. But it lacked a post-operation health check, allowing an attacker to deliberately make their position undercollateralised and then self-liquidate for a bonus.",
      },
    ],
  },

  // Mango Markets (2022)
  {
    id: "mango-markets-2022",
    slug: "mango-markets-2022",
    title: "Mango Markets",
    subtitle: "Oracle Manipulation + Treasury Drain on Solana",
    year: 2022,
    chain: "Solana",
    type: ["Oracle Manipulation", "Governance"],
    shortDesc:
      "Attacker used two wallets to self-trade MNGO perps, pumping the oracle price 1000x, borrowing $117M against phantom profits, then using governance to negotiate a 'white hat' settlement.",
    longDesc:
      "Mango Markets was a Solana-based decentralized exchange for spot, perpetuals, and lending. In October 2022, Avraham Eisenberg executed a coordinated oracle manipulation: using two accounts, he pumped the MNGO/USDC perpetual price from $0.03 to $0.91 (a 30x spike), creating massive unrealized profits in one account. He used that inflated profit as collateral to borrow $117M in various tokens from the Mango treasury. He then used governance — buying MNGO to vote on a proposal to accept a 'bug bounty' settlement — leaving Mango with $47M in bad debt. Eisenberg was later arrested by the FBI.",
    technicalDesc:
      "Mango's perpetual PnL was calculated using oracle prices. The oracle was a Switchboard feed that could be influenced by large spot market trades. Eisenberg opened a massive long on MNGO perps, then used a second account to aggressively buy MNGO spot, moving the oracle price. The first account's unrealized PnL inflated, allowing it to borrow against the phantom gains. After borrowing, the oracle price collapsed, leaving the first account with massive bad debt — but the borrowed tokens were already gone.",
    impact: "$117M",
    impactUSD: 117000000,
    contracts: [
      {
        label: "Mango Markets (Solana)",
        address: "mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68",
        url: "https://solscan.io/account/mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Fund Two Wallets",
        description: "Attacker deposits ~$5M USDC into two separate Mango accounts to fund the manipulation.",
        functionsCall: ["Mango.deposit(5M USDC, account_A)", "Mango.deposit(5M USDC, account_B)"],
        pseudocode: "// account_A = long position account\n// account_B = short position account\n// Net market exposure = 0 (hedged)",
        timestamp: "Oct 11, 2022",
      },
      {
        id: "t2",
        phase: "Open MNGO Perp Positions",
        description: "Account A opens a massive MNGO long, Account B takes the other side (short). Positions cancel each other out in reality.",
        functionsCall: ["Mango.placePerpOrder(MNGO, LONG, 483M contracts, account_A)", "Mango.placePerpOrder(MNGO, SHORT, 483M contracts, account_B)"],
        pseudocode:
          "// 483M MNGO contracts traded between own accounts\n// Initial oracle: $0.03/MNGO\n// Account A: massively long MNGO perp",
      },
      {
        id: "t3",
        phase: "Pump Oracle Price",
        description: "Attacker buys MNGO heavily on spot markets, moving oracle from $0.03 to ~$0.91 — a 30x increase.",
        functionsCall: ["Serum.placeOrder(BUY MNGO spot, large size)"],
        pseudocode:
          "// Oracle price: $0.03 → $0.91\n// Account A PnL: 483M × ($0.91 - $0.03) = ~$425M unrealized profit\n// Account A can now borrow against this phantom collateral",
      },
      {
        id: "t4",
        phase: "Borrow Against Phantom Profits",
        description: "Account A borrows $117M in BTC, ETH, SOL, USDC from Mango treasury using inflated PnL as collateral.",
        functionsCall: ["Mango.borrow(BTC, ETH, SOL, USDC, account_A)"],
        pseudocode:
          "// Max borrows against inflated position\n// $117M total withdrawn\n// Oracle price begins falling after large buy pressure removed",
      },
      {
        id: "t5",
        phase: "Governance Settlement",
        description: "Attacker buys MNGO to propose a governance vote: return $67M and keep $47M as 'bug bounty'. Proposal passes.",
        functionsCall: ["MangDAO.propose(BugBountySettlement)", "MangDAO.vote(YES, 32M MNGO)"],
        pseudocode: "// Attacker buys MNGO, proposes deal\n// Community votes yes to recover some funds\n// FBI later arrests Eisenberg",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Eisenberg\n(Attacker)", detail: "Two coordinated accounts", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Account A\n(MNGO Long)", detail: "Receives phantom PnL", x: 260, y: 100 },
        { id: "n3", type: "pool", label: "Account B\n(MNGO Short)", detail: "Offsets exposure", x: 260, y: 320 },
        { id: "n4", type: "oracle", label: "MNGO Oracle\n$0.03 → $0.91", detail: "Switchboard feed", x: 480, y: 200 },
        { id: "n5", type: "vault", label: "Mango Treasury\n$117M", detail: "BTC, ETH, SOL, USDC", x: 680, y: 100 },
        { id: "n6", type: "result", label: "Attacker\n$47M net", detail: "After governance settlement", x: 880, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Long 483M MNGO perp" },
        { id: "e2", source: "n1", target: "n3", label: "Short 483M MNGO perp" },
        { id: "e3", source: "n1", target: "n4", label: "Buy MNGO spot → pump oracle", animated: true },
        { id: "e4", source: "n4", target: "n2", label: "Inflated PnL collateral" },
        { id: "e5", source: "n2", target: "n5", label: "Borrow max against phantom profit" },
        { id: "e6", source: "n5", target: "n6", label: "$117M drained → settle for $47M", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Attacker Funds\n$10M USDC", type: "attacker" },
      { id: "b", label: "MNGO Spot Buy\n(Oracle Pump)", type: "pool" },
      { id: "c", label: "MNGO Oracle\n$0.03 → $0.91", type: "bridge" },
      { id: "d", label: "Mango Treasury\n$117M", type: "vault" },
      { id: "e", label: "Attacker\n$47M kept", type: "drain" },
      { id: "f", label: "Returned\n$67M", type: "pool" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 10, label: "Seed manipulation" },
      { source: "b", target: "c", value: 10, label: "Pump spot price" },
      { source: "c", target: "d", value: 117, label: "Phantom collateral borrow" },
      { source: "d", target: "e", value: 47, label: "Kept as bug bounty" },
      { source: "d", target: "f", value: 67, label: "Returned via governance" },
    ],
    mitigations: [
      {
        category: "Manipulation-Resistant Oracles",
        description: "Use TWAP oracles with a minimum observation window (e.g., 30 minutes) and circuit breakers that pause borrows if price deviation exceeds 20%.",
        code: "require(abs(oraclePrice - twapPrice) < twapPrice * 20 / 100, 'oracle deviation too high');",
      },
      {
        category: "Position Size Limits",
        description: "Cap maximum open interest per account to prevent any single actor from moving oracle prices through concentrated positions.",
      },
      {
        category: "Borrow Limits Against Perp PnL",
        description: "Unrealized PnL should count as collateral only up to a conservative fraction (e.g., 50%), and should not be usable for large borrows without a time delay.",
      },
    ],
    quiz: [
      {
        question: "What made the Mango Markets oracle manipulation possible?",
        options: [
          "The oracle had a reentrancy bug",
          "The attacker compromised the Switchboard oracle operators",
          "The oracle used spot prices that could be moved by large trades, and unrealized PnL was accepted as borrow collateral",
          "The Mango smart contract had no oracle at all",
        ],
        correct: 2,
        explanation: "The oracle reflected spot market prices that the attacker could move by trading. Critically, the protocol allowed large borrows against unrealized (phantom) PnL from perpetual positions — combining to enable the $117M drain.",
      },
    ],
  },
];

export const hacksBySlug = Object.fromEntries(hacks.map((h) => [h.slug, h]));

export const typeColors: Record<string, string> = {
  "Reentrancy": "text-red-400 border-red-400/30 bg-red-400/10",
  "Flash Loan": "text-orange-400 border-orange-400/30 bg-orange-400/10",
  "Bridge": "text-purple-400 border-purple-400/30 bg-purple-400/10",
  "Governance": "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  "Access Control": "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "Oracle Manipulation": "text-pink-400 border-pink-400/30 bg-pink-400/10",
  "Math Bug": "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  "Integer Overflow": "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  "Supply Chain": "text-green-400 border-green-400/30 bg-green-400/10",
  "Price Manipulation": "text-pink-400 border-pink-400/30 bg-pink-400/10",
};

export const availableYears: number[] = Array.from(
  new Set(hacks.map((h) => h.year))
).sort((a, b) => a - b);
