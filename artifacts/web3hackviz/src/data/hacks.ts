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
  id?: string;
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

  // 2. Cetus Protocol (May 22, 2025)
  {
    id: "cetus-protocol-2025",
    slug: "cetus-protocol-2025",
    title: "Cetus Protocol",
    subtitle: "U256 Shift-Left Overflow - Sui",
    year: 2025,
    chain: "Sui",
    type: ["Math Bug", "Integer Overflow"],
    shortDesc: "Attacker exploited a u256 shift-left check flaw (checked_shlw) in the CLMM contract’s inter_mate library to mint astronomical liquidity positions.",
    longDesc: "On May 22, 2025, Cetus Protocol on Sui was drained of $223M. The attacker identified a vulnerability in the `inter_mate` library used for Concentrated Liquidity Market Maker (CLMM) math. Specifically, the `checked_shlw` function failed to properly guard against u256 overflows during shift-left operations. This allowed the attacker to supply a crafted liquidity amount that, when shifted, overflowed to a massive value, effectively allowing them to mint near-infinite liquidity positions with negligible deposits.",
    technicalDesc: "The vulnerability resided in the library\'s arithmetic boundary checks. Move bytecode for `checked_shlw` (shift-left-wrapped) did not account for the case where the shift amount caused the bit-representation to wrap around the u256 boundary without triggering a panic in a specific unchecked context. The attacker called `add_liquidity` with a value that caused the overflow during the price-to-liquidity conversion. The pool, believing the attacker had provided massive depth, allowed withdrawals of the entire token reserve of multiple pools.",
    impact: "$223 million",
    impactUSD: 223000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Deposit", description: "Attacker deposited a minimal amount into targeted CLMM pools.", functionsCall: ["Pool::add_liquidity(min_deposit)"], pseudocode: "// Minimal collateral provided to open position" },
      { id: "t2", phase: "Overflow Trigger", description: "Triggered the overflow bug during liquidity position calculation using shift-left math.", functionsCall: ["inter_mate::checked_shlw()"], pseudocode: "// u256 overflow: (x << shift) wraps to near-max u256" },
      { id: "t3", phase: "Fake Mint", description: "Minted massive fake liquidity far exceeding actual reserves.", functionsCall: [], pseudocode: "// Position.liquidity = corrupted_overflow_value" },
      { id: "t4", phase: "Drain", description: "Withdrew disproportionately large amounts of underlying tokens from the pools.", functionsCall: ["Pool::remove_liquidity(fake_position)"], pseudocode: "// Pool releases real assets for fake liquidity" },
      { id: "t5", phase: "Laundering", description: "Bridged ~$60M to Ethereum while laundering the remaining ~$162M on Sui.", functionsCall: [], pseudocode: "// $60M USDC → ETH via Bridge" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Exploited u256 overflow", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "inter_mate Library", detail: "checked_shlw() bypass", x: 250, y: 100 },
        { id: "n3", type: "pool", label: "CLMM Pools", detail: "$223M liquidity", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker Wallet", detail: "$223M drained", x: 750, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Trigger overflow", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Mint fake liquidity" },
        { id: "e3", source: "n3", target: "n4", label: "Withdraw reserves", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Cetus Pools\n$223M", type: "pool" },
      { id: "b", label: "Attacker EOA", type: "attacker" },
      { id: "c", label: "Ethereum Bridge", type: "bridge" },
      { id: "d", label: "Sui Laundering", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 223, label: "Drain" },
      { source: "b", target: "c", value: 60, label: "Bridge" },
      { source: "b", target: "d", value: 163, label: "Launder" }
    ],
    mitigations: [
      { category: "Math", description: "Adopt audited safe-math libraries with explicit overflow guards." },
      { category: "Verification", description: "Implement formal verification (Move prover) for all arithmetic." },
      { category: "Monitoring", description: "Add runtime invariant checks on liquidity amounts." }
    ],
    quiz: [
      { question: "Which arithmetic operation caused the Cetus overflow?", options: ["Add", "Subtract", "Shift-Left", "Multiply"], correct: 2, explanation: "The overflow happened in a shift-left operation (checked_shlw) in the CLMM math library." }
    ]
  },

  // 3. GMX V1 (July 9, 2025)
  {
    id: "gmx-v1-2025",
    slug: "gmx-v1-2025",
    title: "GMX V1",
    subtitle: "Cross-contract Reentrancy - Arbitrum/Avalanche",
    year: 2025,
    chain: "Arbitrum/Avalanche",
    type: ["Reentrancy"],
    shortDesc: "Reentrancy guard introduced in a 2022 bug fix was bypassed, draining the GLP pool of $42M.",
    longDesc: "On July 9, 2025, GMX V1 was hit by a $42M exploit. An attacker discovered a way to bypass the reentrancy guards that were thought to have been fixed in 2022. By exploiting a cross-contract reentrancy vector, the attacker was able to manipulate the GLP pool logic and drain substantial assets.",
    technicalDesc: "The exploit involved a complex interaction between the GMX Router and the Vault. The attacker triggered a callback within a token transfer that re-entered the increasePosition/decreasePosition flow before the initial state was finalized. Because the reentrancy guard was only applied to individual contracts and not across the entire vault/router interaction surface correctly, the attacker could manipulate the pool's internal accounting.",
    impact: "$42 million",
    impactUSD: 42000000,
    contracts: [{ label: "GMX Vault", address: "0x489ee077994B6658eAfA855C308275EAd8097C4A", url: "https://arbiscan.io/address/0x489ee077994B6658eAfA855C308275EAd8097C4A" }],
    timeline: [
      { id: "t1", phase: "Setup", description: "Attacker identified reentrancy vector in GLP pool after previous 'fix'.", functionsCall: [], pseudocode: "// identified bypass in state update order" },
      { id: "t2", phase: "Reentrancy", description: "Attacker triggered reentrancy in GLP pool logic.", functionsCall: ["Vault.increasePosition()"], pseudocode: "// call -> callback -> increasePosition" },
      { id: "t3", phase: "Drain", description: "Drained ~$40M in tokens to unknown wallet.", functionsCall: [], pseudocode: "// multiple assets extracted" },
      { id: "t4", phase: "Bridge", description: "$9.6M bridged to Ethereum.", functionsCall: [], pseudocode: "// Funds moved via Hop/Synapse" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Reentrancy bypass", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "GMX Vault", detail: "Reentrancy bug", x: 300, y: 200 },
        { id: "n3", type: "pool", label: "GLP Pool", detail: "$42M assets", x: 550, y: 200 },
        { id: "n4", type: "result", label: "Attacker Profit", detail: "$42M", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Re-enter increasePosition", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Update stale state" },
        { id: "e3", source: "n3", target: "n4", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "GLP Pool", type: "pool" },
      { id: "b", label: "Attacker", type: "attacker" },
      { id: "c", label: "Ethereum", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 42, label: "Drain" },
      { source: "b", target: "c", value: 9.6, label: "Bridge" }
    ],
    mitigations: [
      { category: "Security", description: "Full reentrancy guards on all external calls." },
      { category: "Testing", description: "Invariant testing after any code change." }
    ],
    quiz: [
      { question: "What was the core vulnerability in GMX V1?", options: ["Oracle Manipulation", "Reentrancy", "Admin Key Leak", "Math Error"], correct: 1, explanation: "The exploit was a cross-contract reentrancy bug." }
    ]
  },

  // 4. Balancer (November 14, 2025)
  {
    id: "balancer-2025",
    slug: "balancer-2025",
    title: "Balancer",
    subtitle: "Rounding Error in _upscale()",
    year: 2025,
    chain: "Multi-chain",
    type: ["Math Bug"],
    shortDesc: "Single-directional rounding in the upscale function created a $128M precision heist across chains.",
    longDesc: "On November 14, 2025, Balancer suffered a multi-chain rounding exploit. A subtle error in the `_upscale()` function used for precision normalization consistently rounded in one direction, allowing an attacker to extract value over many iterations.",
    technicalDesc: "The vulnerability was a classical rounding error in integer arithmetic. In the math library, the upscale function was not bidirectional, meaning it did not round to the nearest value but always in a direction that favored the user over the pool balance. By executing millions of tiny swaps, the attacker accumulated a $128M surplus.",
    impact: "$128M+",
    impactUSD: 128000000,
    contracts: [{ label: "Balancer Vault", address: "0xBA12222222228d8Ba445958a75a0704d566BF2C8", url: "https://etherscan.io/address/0xBA12222222228d8Ba445958a75a0704d566BF2C8" }],
    timeline: [
      { id: "t1", phase: "Discovery", description: "Attacker exploited the non-bidirectional _upscale() function.", functionsCall: [], pseudocode: "// Rounding in one direction only" },
      { id: "t2", phase: "Execution", description: "Drained pools in one hour across multiple chains.", functionsCall: ["Vault.swap()"], pseudocode: "// millions of micro-swaps" },
      { id: "t3", phase: "Response", description: "Validators halted networks; forks inherited the flaw.", functionsCall: [], pseudocode: "// Chain halt triggered" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Rounding exploit", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Math Lib", detail: "_upscale() rounding", x: 300, y: 200 },
        { id: "n3", type: "pool", label: "Balancer Pools", detail: "$128M+", x: 550, y: 200 },
        { id: "n4", type: "result", label: "Profit", detail: "$128M", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Swap with rounding", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Extract surplus" },
        { id: "e3", source: "n3", target: "n4", label: "Accumulate", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Balancer Pools", type: "pool" },
      { id: "b", label: "Attacker", type: "attacker" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 128, label: "Rounding Surplus" }
    ],
    mitigations: [
      { category: "Math", description: "Make scaling functions bidirectional." },
      { category: "Verification", description: "Add formal verification for math libs." }
    ],
    quiz: [
      { question: "What function was exploitable in Balancer?", options: ["_downscale()", "_upscale()", "swap()", "joinPool()"], correct: 1, explanation: "The _upscale() rounding direction was the root cause." }
    ]
  },

  // 5. Yearn Finance V1 (December 17, 2025)
  {
    id: "yearn-v1-2025",
    slug: "yearn-v1-2025",
    title: "Yearn Finance V1",
    subtitle: "Legacy Vault Config Error",
    year: 2025,
    chain: "Ethereum",
    type: ["Access Control"],
    shortDesc: "Exploiter drained an older Yearn V1 vault via a previously unpatched configuration vector.",
    longDesc: "On December 17, 2025, a legacy Yearn Finance V1 vault was exploited for $300K. The attack targeted a vestigial configuration flaw that remained in the decade-old code.",
    technicalDesc: "The vulnerability was a 'zombie contract' risk. An old V1 vault had a misconfigured parameter that allowed direct extraction and swapping of vault assets if a specific sequence of logic calls was executed. While V2 and V3 were secure, the idle liquidity in the V1 vault was vulnerable.",
    impact: "$300K",
    impactUSD: 300000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Discovery", description: "Attacker identified vulnerable V1 contract.", functionsCall: [], pseudocode: "// identified legacy config flaw" },
      { id: "t2", phase: "Drain", description: "Submitted crafted transactions to drain vault assets.", functionsCall: ["Vault.withdraw()"], pseudocode: "// bypass check" },
      { id: "t3", phase: "Conversion", description: "Swapped stolen funds for 103 ETH.", functionsCall: [], pseudocode: "// Uniswap swap" },
      { id: "t4", phase: "Transfer", description: "Transferred to attacker wallet.", functionsCall: [], pseudocode: "// Funds dispersed" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Legacy explorer", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Yearn V1 Vault", detail: "Config error", x: 300, y: 200 },
        { id: "n3", type: "result", label: "Attacker Wallet", detail: "103 ETH", x: 600, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Exploit config", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Yearn V1 Vault", type: "vault" },
      { id: "b", label: "Attacker", type: "attacker" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.3, label: "Drain" }
    ],
    mitigations: [
      { category: "Lifecycle", description: "Deprecate and migrate from V1 contracts." },
      { category: "Security", description: "Run ongoing invariant testing on all versions." }
    ],
    quiz: [
      { question: "Why was Yearn V1 still vulnerable?", options: ["Zero-day in Solidity", "Legacy configuration 'zombie' code", "Admin key theft", "Oracle bug"], correct: 1, explanation: "Legacy 'zombie' contracts often harbor forgotten configuration flaws." }
    ]
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

  // 6. Truebit (January 8, 2026)
  {
    id: "truebit-2026",
    slug: "truebit-2026",
    title: "Truebit",
    subtitle: "Integer Overflow in Purchase",
    year: 2026,
    chain: "Ethereum",
    type: ["Math Bug", "Integer Overflow"],
    shortDesc: "Unlimited TRU minting via legacy overflow, $26.2M lost.",
    longDesc: "On Jan 8, 2026, an attacker used a legacy overflow in a five-year-old unverified bytecode contract to mint 240M TRU and burn them for ETH. The contract had not been updated to use modern SafeMath or compiler guards.",
    technicalDesc: "The vulnerability was an unchecked addition in the token purchase logic that overflowed when a massive amount of TRU was requested, wrapping the ETH cost to nearly zero. The attacker looped this to mint TRU cheaply and extract real ETH.",
    impact: "$26.2M",
    impactUSD: 26200000,
    contracts: [{ label: "Truebit Purchase Contract", address: "0x764C64b2A09b09Acb100B80d8c505Aa6a0302ef2", url: "https://etherscan.io/address/0x764c64b2a09b09acb100b80d8c505aa6a0302ef2" }],
    timeline: [
      { id: "t1", phase: "Identification", description: "Triggered overflow in old contract.", functionsCall: [], pseudocode: "// unchecked arithmetic" },
      { id: "t2", phase: "Mint", description: "Minted over 240M TRU tokens.", functionsCall: ["Purchase.buyTokens()"], pseudocode: "// amount wraps price" },
      { id: "t3", phase: "Burn", description: "Burned for real ETH.", functionsCall: ["TRU.burn()"], pseudocode: "// extract underlying ETH" },
      { id: "t4", phase: "Exit", description: "Drained 8,535 ETH to Tornado Cash.", functionsCall: [], pseudocode: "// laundered via mixer" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Triggered overflow", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Legacy Purchase", detail: "Mint vulnerability", x: 300, y: 200 },
        { id: "n3", type: "result", label: "Profit", detail: "$26.2M", x: 550, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Overflow buy", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Extract ETH" }
      ]
    },
    tokenFlowNodes: [{ id: "a", label: "ETH Reserve", type: "pool" }, { id: "b", label: "Attacker", type: "attacker" }],
    tokenFlowLinks: [{ source: "a", target: "b", value: 26.2, label: "Drain" }],
    mitigations: [{ category: "Code Quality", description: "Deprecate unverified contracts." }],
    quiz: [{ question: "What allowed the TRU tokens to be minted so cheaply?", options: ["Admin key leak", "Integer overflow", "Oracle manipulation"], correct: 1, explanation: "An integer overflow wrapped the ETH cost to near zero." }]
  },

  // 7. Step Finance (January 31, 2026)
  {
    id: "step-finance-2026",
    slug: "step-finance-2026",
    title: "Step Finance",
    subtitle: "Treasury Phishing",
    year: 2026,
    chain: "Solana",
    type: ["Access Control"],
    shortDesc: "Private keys stolen via phishing, $27.3M drained.",
    longDesc: "On Jan 31, 2026, executive/treasury keys were compromised via spear-phishing. It was a major operational security failure where keys for the protocol treasury were exposed.",
    technicalDesc: "Attackers obtained high-privilege private keys not protected by multi-sig. They executed a sweep of the treasury SOL and portfolio assets in a single transaction sequence.",
    impact: "$27.3M",
    impactUSD: 27300000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Phishing", description: "Spear-phishing on team.", functionsCall: [], pseudocode: "// social engineering" },
      { id: "t2", phase: "Access", description: "Obtained keys.", functionsCall: [], pseudocode: "// keys compromised" },
      { id: "t3", phase: "Drain", description: "Swept treasury SOL.", functionsCall: ["SystemProgram.transfer()"], pseudocode: "// drain all assets" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Phishers", detail: "Spear phishing", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Treasury", detail: "Targeted keys", x: 300, y: 200 },
        { id: "n3", type: "result", label: "Drain", detail: "$27.3M", x: 550, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Key sweep", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Withdraw assets" }
      ]
    },
    tokenFlowNodes: [{ id: "a", label: "Treasury", type: "vault" }, { id: "b", label: "Attacker", type: "attacker" }],
    tokenFlowLinks: [{ source: "a", target: "b", value: 27.3, label: "Sweep" }],
    mitigations: [{ category: "OpSec", description: "Mandate multisig with HSMs." }],
    quiz: [{ question: "How was Step Finance drained?", options: ["Phishing", "Reentrancy", "Flash loan"], correct: 0, explanation: "Executive keys were stolen via a phishing attack." }]
  },

  // 7. IoTeX ioTube Bridge (February 21, 2026)
  {
    id: "iotex-iotube-2026",
    slug: "iotex-iotube-2026",
    title: "IoTeX ioTube Bridge",
    subtitle: "Private Key Compromise (Bridge)",
    year: 2026,
    chain: "Multi-chain",
    type: ["Bridge", "Access Control"],
    shortDesc: "Attacker obtained owner key to ioTube bridge validator contract and drained $8.9M in assets.",
    longDesc: "On February 21, 2026, the ioTube bridge was compromised. The attacker seized the bridge's owner key, granting them full admin control over the bridged assets and the ability to mint unbacked tokens.",
    technicalDesc: "The exploit targeted the bridge's custodial logic. By compromising a single-point owner key, the attacker gained admin access to the `TokenSafe` and `MinterPool` contracts. They drained real USDC/USDT/WBTC assets and minted 410M unbacked CIOTX tokens to inflate their exit value.",
    impact: "$8.9 million",
    impactUSD: 8900000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Compromise", description: "Attacker seized owner key.", functionsCall: [], pseudocode: "// single validator key breach" },
      { id: "t2", phase: "Admin Control", description: "Gained admin control over TokenSafe and MinterPool.", functionsCall: ["Bridge.updateOwner()"], pseudocode: "// hijack bridge roles" },
      { id: "t3", phase: "Drain", description: "Drained real assets and minted 410M unbacked CIOTX.", functionsCall: ["Bridge.mint()"], pseudocode: "// infinite mint + drain vault" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Stolen owner key", x: 50, y: 200 },
        { id: "n2", type: "bridge", label: "ioTube Bridge", detail: "TokenSafe/MinterPool", x: 300, y: 200 },
        { id: "n3", type: "pool", label: "Bridge Assets", detail: "$8.9M real + fake", x: 550, y: 200 },
        { id: "n4", type: "result", label: "Profit", detail: "$8.9M", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Admin access", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Drain/Mint" },
        { id: "e3", source: "n3", target: "n4", label: "Extract", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Bridge Vault", type: "vault" },
      { id: "b", label: "Attacker", type: "attacker" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 8.9, label: "Admin Drain" }
    ],
    mitigations: [
      { category: "Infrastructure", description: "Use Threshold signatures and hardware-isolated keys." },
      { category: "Security", description: "Implement real-time monitoring and circuit breakers." }
    ],
    quiz: [
      { question: "What was the main vulnerability in ioTube?", options: ["Smart contract bug", "Single-point key management", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "A single compromised owner key allowed total control over the bridge assets." }
    ]
  },

  // 8. Venus Protocol (March 15, 2026)
  {
    id: "venus-protocol-2026",
    slug: "venus-protocol-2026",
    title: "Venus ($THE Market)",
    subtitle: "Supply Cap Bypass via Donation Attack",
    year: 2026,
    chain: "BNB Chain",
    type: ["Logic Error", "Oracle Manipulation"],
    shortDesc: "Donation attack bypassed supply caps by direct transfers, inflating collateral 3.67x for $14.9M drain.",
    longDesc: "On March 15, 2026, Venus Protocol's THE (Thena) market was exploited via a donation attack. The attacker spent 9 months accumulating 84% of the 14.5M THE supply cap, then executed a sophisticated bypass: direct ERC-20 transfers to the vTHE contract inflated the exchange rate 3.81x without triggering mint-path supply cap checks. Combined with oracle price manipulation ($0.26 → $0.51), borrowing power increased ~7x. The attacker borrowed $14.9M before liquidation bots collapsed the position.",
    technicalDesc: "Compound forks enforce supply caps only on the mint() path. Direct transfers to the vToken contract bypass these checks, inflating exchangeRate (vTokens represent claim on more underlying). The attacker: (1) accumulated 12.2M THE over 9 months via Tornado-funded wallets; (2) transferred 36M THE directly to vTHE contract, inflating exchangeRate 3.81x; (3) recursively leveraged: borrow → swap to THE → donate → repeat; (4) manipulated THE price to $0.51 via thin liquidity buying; (5) borrowed against 7x inflated collateral before liquidation cascade.",
    impact: "$14.9M (protocol loss: $2.15M bad debt)",
    impactUSD: 14900000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Accumulation", description: "Attacker accumulated 12.2M THE over 9 months via Tornado-funded wallets.", functionsCall: ["THE.transfer(multiple_wallets)"], pseudocode: "// 84% of supply cap gathered\n// Tornado funding → Aave borrow → THE purchases" },
      { id: "t2", phase: "Donation Bypass", description: "36M THE transferred directly to vTHE contract, inflating exchangeRate 3.81x.", functionsCall: ["THE.transfer(vTHE_contract, 36M)"], pseudocode: "// Direct transfer bypasses mint() cap check\n// exchangeRate inflates: vTHE now represents 3.81x more underlying" },
      { id: "t3", phase: "Recursive Leverage", description: "Borrow assets, swap to THE, donate again in recursive loop.", functionsCall: ["Venus.borrow(CAKE, BNB, BTCB)", "DEX.swap(THE)", "THE.transfer(vTHE)"], pseudocode: "// Borrow → swap to THE → donate → repeat\n// Each iteration increases borrowing power" },
      { id: "t4", phase: "Oracle Manipulation", description: "Pumped THE price from $0.26 to $0.51 via thin liquidity buying.", functionsCall: ["DEX.buy(THE)"], pseudocode: "// Thin liquidity = high price impact\n// Resilient Oracle eventually accepted manipulated price" },
      { id: "t5", phase: "Max Borrow", description: "Borrowed $14.9M against 7x inflated collateral before liquidation cascade.", functionsCall: ["Venus.borrow(max_assets)"], pseudocode: "// Combined effect: 3.81x exchangeRate + 2x price = ~7x borrowing power\n// 53.2M THE peak position" },
      { id: "t6", phase: "Collapse", description: "Liquidation bots collapsed THE price to $0.22, triggering cascade liquidations.", functionsCall: ["Venus.liquidate(attacker)"], pseudocode: "// Price collapsed → health factor < 1\n// 254 bots competed → 8,048 liquidation txs\n// Protocol left with $2.15M bad debt" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "9-month accumulation", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "THE Token", detail: "12.2M accumulated", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "vTHE Contract", detail: "Direct transfer bypass", x: 450, y: 200 },
        { id: "n4", type: "oracle", label: "THE Oracle", detail: "$0.26 → $0.51", x: 650, y: 100 },
        { id: "n5", type: "pool", label: "Venus Treasury", detail: "$14.9M borrowed", x: 650, y: 300 },
        { id: "n6", type: "result", label: "Attacker Profit", detail: "~$5.2M retained", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Accumulate 9 months" },
        { id: "e2", source: "n2", target: "n3", label: "Donate 36M THE", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "3.81x exchangeRate" },
        { id: "e4", source: "n1", target: "n4", label: "Pump price" },
        { id: "e5", source: "n4", target: "n5", label: "Borrow at inflated value" },
        { id: "e6", source: "n5", target: "n6", label: "Extract profit", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Attacker\nFunds", type: "attacker" },
      { id: "b", label: "THE\nAccumulated", type: "pool" },
      { id: "c", label: "vTHE\n(3.81x rate)", type: "vault" },
      { id: "d", label: "Venus\nBorrowed Assets", type: "pool" },
      { id: "e", label: "Attacker\nProfit", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 9.9, label: "Initial investment" },
      { source: "b", target: "c", value: 36, label: "Donation bypass" },
      { source: "c", target: "d", value: 14.9, label: "Borrow at 7x value" },
      { source: "d", target: "e", value: 5.2, label: "Net profit" }
    ],
    mitigations: [
      { category: "Supply Cap Enforcement", description: "Enforce caps on ALL balance changes, not just mint(). Check total supply after transfers." },
      { category: "Donation Protection", description: "Reject direct transfers to vToken contracts or cap their impact on exchange rate." },
      { category: "Oracle Circuit Breakers", description: "Implement price deviation checks and pause borrowing during extreme volatility." }
    ],
    quiz: [{ question: "How did the attacker bypass Venus's supply cap?", options: ["Flash loan", "Direct transfer donation", "Oracle bug", "Reentrancy"], correct: 1, explanation: "Direct transfers to vTHE bypassed mint() cap checks, inflating exchange rate." }]
  },

  // 9. Resolv Labs (March 22, 2026)
  {
    id: "resolv-labs-2026",
    slug: "resolv-labs-2026",
    title: "Resolv Labs",
    subtitle: "AWS KMS Key Leak - 80M USR Minted",
    year: 2026,
    chain: "Ethereum",
    type: ["Access Control"],
    shortDesc: "Compromised AWS KMS key allowed 80M USR minting, causing $25M drain and 80% depeg.",
    longDesc: "On March 22, 2026, Resolv Labs suffered a catastrophic exploit when attackers compromised their AWS KMS environment. The attacker gained access to the protocol's privileged SERVICE_ROLE signing key, enabling unlimited USR minting. Using just $100K-$200K in USDC deposits, the attacker authorized two massive mint operations (50M and 30M USR) by calling completeSwap with inflated output amounts. The 80M unbacked USR tokens flooded DEX liquidity, causing an 80% price collapse from $1 to $0.20. The attacker converted USR to wstUSR, then swapped to ETH, extracting ~$24M before protocol pause.",
    technicalDesc: "The exploit targeted Resolv's two-step swap mechanism where users deposit tokens on-chain but the USR output amount is passed as an unchecked parameter. The attacker: (1) compromised AWS KMS to obtain SERVICE_ROLE signing key; (2) made two swap requests with modest USDC deposits (~$100K-$200K total); (3) used the compromised key to call completeSwap with inflated output amounts, authorizing 80M USR; (4) converted USR to wstUSR to avoid immediate market impact; (5) swapped wstUSR to stablecoins then ETH via multiple DEX pools; (6) laundered proceeds through Railgun shielded pools.",
    impact: "$25M (80M USR minted, 80% depeg)",
    impactUSD: 25000000,
    contracts: [{ label: "Resolv USR Token", address: "0x66a1e37c9b0eaddca17d3662d6c05f4decf3e110", url: "https://etherscan.io/address/0x66a1e37c9b0eaddca17d3662d6c05f4decf3e110" }],
    timeline: [
      { id: "t1", phase: "KMS Compromise", description: "Attacker compromised Resolv's AWS KMS environment to obtain SERVICE_ROLE signing key.", functionsCall: ["AWS_KMS.get_signing_key()"], pseudocode: "// Cloud infrastructure breach\n// Gained access to privileged minting key" },
      { id: "t2", phase: "Swap Requests", description: "Attacker made two swap requests funded with $100K-$200K USDC deposits.", functionsCall: ["Resolv.swap_request(USDC_deposit)"], pseudocode: "// Legitimate-looking deposits\n// Preparing for inflated authorization" },
      { id: "t3", phase: "Unauthorized Mint", description: "Used SERVICE_ROLE key to call completeSwap with inflated output amounts: 50M + 30M USR.", functionsCall: ["Resolv.completeSwap(inflated_output, SERVICE_ROLE_key)"], pseudocode: "// Bypassed output amount validation\n// Authorized 80M USR minting with $100K collateral" },
      { id: "t4", phase: "wstUSR Conversion", description: "Converted USR to wstUSR (wrapped staked USR) to avoid immediate market crash.", functionsCall: ["USR.stake(wstUSR)"], pseudocode: "// Moved to less liquid derivative\n// Avoided immediate price impact" },
      { id: "t5", phase: "DEX Swapping", description: "Swapped wstUSR to stablecoins then ETH through multiple DEX pools.", functionsCall: ["Uniswap.swap(wstUSR)", "Curve.exchange(ETH)"], pseudocode: "// Rotated through multiple pools\n// Maximized extraction efficiency" },
      { id: "t6", phase: "Market Collapse", description: "80M unbacked USR hit DEXs, causing 80% depeg from $1 to $0.20.", functionsCall: [], pseudocode: "// Supply flooded liquidity pools\n// Price collapsed to $0.20\n// Protocol paused after discovery" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "KMS compromise", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "AWS KMS", detail: "SERVICE_ROLE key", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "Resolv Swap", detail: "Unchecked parameter", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "USR Token", detail: "80M minted", x: 650, y: 200 },
        { id: "n5", type: "pool", label: "wstUSR", detail: "Staked derivative", x: 850, y: 200 },
        { id: "n6", type: "result", label: "Attacker", detail: "~$24M ETH", x: 1050, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise KMS", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Use signing key" },
        { id: "e3", source: "n3", target: "n4", label: "Mint 80M USR", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Convert to wstUSR" },
        { id: "e5", source: "n5", target: "n6", label: "Swap to ETH", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Attacker\nUSDC", type: "attacker" },
      { id: "b", label: "Resolv\nSwap", type: "vault" },
      { id: "c", label: "USR\n80M Minted", type: "pool" },
      { id: "d", label: "wstUSR\nDerivative", type: "pool" },
      { id: "e", label: "DEX Pools", type: "bridge" },
      { id: "f", label: "Attacker\nETH", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.15, label: "USDC deposit" },
      { source: "b", target: "c", value: 80, label: "Inflated mint" },
      { source: "c", target: "d", value: 80, label: "Stake to wstUSR" },
      { source: "d", target: "e", value: 24, label: "DEX swaps" },
      { source: "e", target: "f", value: 24, label: "ETH extraction" }
    ],
    mitigations: [
      { category: "Key Management", description: "Use hardware security modules (HSMs) or multi-party computation (MPC) for critical signing keys. Never store privileged keys in cloud KMS without additional safeguards." },
      { category: "Parameter Validation", description: "Validate all input parameters, especially output amounts in swap functions. Never trust unchecked parameters from privileged calls." },
      { category: "Real-time Monitoring", description: "Implement monitoring for anomalous minting events. Alert on sudden large mints or output amount spikes." },
      { category: "Circuit Breakers", description: "Add mint rate limits and automatic pause on suspicious activity patterns." }
    ],
    quiz: [{ question: "How was the Resolv Labs exploit possible?", options: ["Reentrancy", "KMS key leak", "Flash loan", "Oracle manipulation"], correct: 1, explanation: "AWS KMS key compromise allowed unlimited USR minting via unchecked output parameter." }]
  },

  // 10. Hyperbridge (April 13, 2026)
  {
    id: "hyperbridge-2026",
    slug: "hyperbridge-2026",
    title: "Hyperbridge",
    subtitle: "MMR Proof Bug - 1B Fake DOT Minted",
    year: 2026,
    chain: "Polkadot/Ethereum",
    type: ["Cryptography", "Bridge"],
    shortDesc: "MMR proof validation flaw allowed 1B fake DOT minting via leafCount=1 edge case, draining $2.5M.",
    longDesc: "On April 13, 2026, Hyperbridge's ISMP Token Gateway on Ethereum was exploited via a Merkle Mountain Range (MMR) proof validation bug. The attacker deployed orchestration contracts and exploited the HandlerV1.verifyPostRequests() function where leafCount=1 edge case caused the library to discard forged leaves and substitute legitimate stored roots. Combined with weak governance (challengePeriod=0) and insufficient request-proof binding, the attacker gained MINTER_ROLE and minted 1,000,000,000 fake DOT tokens, swapping them for 108.2 ETH before the gateway was frozen.",
    technicalDesc: "The exploit targeted three vulnerabilities: (1) MMR library boundary validation failed when leafCount=1, allowing leaf_index >= leafCount; (2) proof-to-request binding was missing - commitment hash didn't cover both proof and request payload; (3) TokenGateway had challengePeriod=0 with shallow source checks. The attacker: (1) funded via Railgun/Synapse for obfuscation; (2) deployed helper contract as new token admin; (3) crafted PostRequest with MMR proof triggering leafCount=1 edge case; (4) called handleChangeAssetAdmin() bypassing shallow checks; (5) minted 1B DOT and swapped via Uniswap V4 PoolManager.",
    impact: "$2.5M (1B fake DOT minted)",
    impactUSD: 2500000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Preparation", description: "Attacker funded via Railgun shielded pools and Synapse Bridge for obfuscation.", functionsCall: ["Railgun.withdraw()", "Synapse.bridge()"], pseudocode: "// Privacy-focused funding\n// Multiple test contract deployments" },
      { id: "t2", phase: "Contract Deployment", description: "Deployed master orchestration contract and helper contract as new token admin.", functionsCall: ["deploy(orchestration_contract)", "deploy(helper_contract)"], pseudocode: "// Helper contract designed to become token admin\n// Master contract coordinated the attack" },
      { id: "t3", phase: "Forged Proof", description: "Called HandlerV1.handlePostRequests() with crafted PostRequest triggering leafCount=1 edge case.", functionsCall: ["HandlerV1.handlePostRequests(forged_proof)"], pseudocode: "// MMR proof designed for leafCount=1 edge case\n// Library discarded forged leaf, substituted legitimate root" },
      { id: "t4", phase: "Privilege Escalation", description: "Forged request with action byte 0x04 (ChangeAssetAdmin) forwarded to TokenGateway.", functionsCall: ["TokenGateway.handleChangeAssetAdmin(helper_contract)"], pseudocode: "// challengePeriod=0 = no delay\n// Shallow source check passed\n// Helper set as new admin, gained MINTER_ROLE" },
      { id: "t5", phase: "Mass Mint", description: "Minted 1,000,000,000 fake DOT tokens and swapped for 108.2 ETH.", functionsCall: ["DOT.mint(1B)", "OdosRouterV3.swap(1B DOT)", "UniswapV4.swap(ETH)"], pseudocode: "// 1B DOT minted via MINTER_ROLE\n// Swapped through Uniswap V4 PoolManager\n// 108.2 ETH sent to attacker EOA" },
      { id: "t6", phase: "Secondary Exploits", description: "Same vulnerability used against MANTA and CERE tokens before gateway frozen.", functionsCall: [], pseudocode: "// TokenGateway governs all parachain assets\n// Attacker exploited same vector on other tokens\n// EthereumHost frozen pending upgrade" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Railgun-funded", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Helper Contract", detail: "New token admin", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "MMR Library", detail: "leafCount=1 bug", x: 450, y: 100 },
        { id: "n4", type: "bridge", label: "TokenGateway", detail: "challengePeriod=0", x: 450, y: 300 },
        { id: "n5", type: "pool", label: "DOT Token", detail: "1B fake minted", x: 650, y: 200 },
        { id: "n6", type: "result", label: "Attacker", detail: "108.2 ETH", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Deploy contracts" },
        { id: "e2", source: "n2", target: "n3", label: "Trigger edge case", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Bypass proof validation" },
        { id: "e4", source: "n2", target: "n4", label: "ChangeAssetAdmin" },
        { id: "e5", source: "n4", target: "n5", label: "Mint 1B DOT", animated: true },
        { id: "e6", source: "n5", target: "n6", label: "Swap to ETH" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Attacker\nFunded", type: "attacker" },
      { id: "b", label: "Helper\nContract", type: "pool" },
      { id: "c", label: "MMR\nProof Bug", type: "vault" },
      { id: "d", label: "TokenGateway\n(Admin)", type: "bridge" },
      { id: "e", label: "1B Fake\nDOT", type: "pool" },
      { id: "f", label: "108.2 ETH\nExtracted", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.1, label: "Initial funding" },
      { source: "b", target: "c", value: 0.1, label: "Exploit edge case" },
      { source: "c", target: "d", value: 0.1, label: "Bypass validation" },
      { source: "d", target: "e", value: 2500, label: "Mint 1B DOT" },
      { source: "e", target: "f", value: 0.11, label: "Swap to ETH" }
    ],
    mitigations: [
      { category: "MMR Validation", description: "Enforce strict boundary validation: leaf_index must always be < leafCount. Add unit tests for edge cases where leafCount equals 1 or 0." },
      { category: "Proof Binding", description: "Ensure commitment hash covers both proof and full request payload. Reject mismatches between proven leaf and submitted request." },
      { category: "Governance Security", description: "Apply full authenticate(request) modifier to all governance actions. Restore non-zero challengePeriod (minimum 1 hour recommended)." },
      { category: "Admin Safeguards", description: "Introduce time-lock or multi-signature approval for changeAdmin(). Separate MINTER_ROLE assignment from admin status." }
    ],
    quiz: [{ question: "What MMR edge case did Hyperbridge exploit?", options: ["leafCount=0", "leafCount=1", "leafCount=2", "leafIndex overflow"], correct: 1, explanation: "The leafCount=1 edge case caused the library to discard forged leaves and substitute legitimate stored roots." }]
  },

  // 11. Rhea Finance (April 16, 2026)
  {
    id: "rhea-finance-2026",
    slug: "rhea-finance-2026",
    title: "Rhea Finance",
    subtitle: "Slippage Protection Logic Flaw",
    year: 2026,
    chain: "NEAR",
    type: ["Logic Error"],
    shortDesc: "Slippage protection failed to account for reused intermediate tokens in multi-step swaps, causing $18.4M drain.",
    longDesc: "On April 16, 2026, Rhea Finance (formerly Burrow Finance) on NEAR protocol suffered an $18.4M exploit targeting its margin trading functionality. The attacker spent days preparing by creating multiple fake token pools on Ref Finance and injecting liquidity, constructing malicious swap routes. The vulnerability was in the protocol's slippage protection mechanism, which failed to account for scenarios where intermediate tokens were reused during multi-step swaps. This allowed borrowed debt tokens to be routed into fake pools under attacker control, triggering widespread forced liquidations and draining the reserve pool.",
    technicalDesc: "Rhea's margin trading includes slippage protection that sums expected outputs across swap steps. The flaw: when intermediate tokens were reused in multi-step swaps, the slippage calculation didn't properly account for token reuse, allowing manipulated swap routes to pass validation. The attacker: (1) created fake token pools on Ref Finance with injected liquidity; (2) constructed swap routes reusing intermediate tokens to bypass slippage checks; (3) borrowed debt tokens and routed them through fake pools; (4) triggered forced liquidations by draining reserve pool; (5) deleted 55 intermediary accounts to obfuscate trail.",
    impact: "$18.4M",
    impactUSD: 18400000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Pool Creation", description: "Attacker created multiple fake token pools on Ref Finance and injected liquidity.", functionsCall: ["Ref.create_pool(fake_token)", "Ref.add_liquidity()"], pseudocode: "// Fake pools with controlled liquidity\n// Constructed malicious swap routes" },
      { id: "t2", phase: "Route Construction", description: "Built swap routes reusing intermediate tokens to bypass slippage protection.", functionsCall: ["Route.construct(reused_tokens)"], pseudocode: "// Slippage protection didn't account for\n// intermediate token reuse in multi-step swaps" },
      { id: "t3", phase: "Borrow & Route", description: "Borrowed debt tokens and routed them through fake pools under attacker control.", functionsCall: ["Rhea.borrow(debt_tokens)", "DEX.swap(fake_pools)"], pseudocode: "// Debt tokens routed to attacker-controlled pools\n// Bypassed slippage validation logic" },
      { id: "t4", phase: "Liquidation Trigger", description: "Malicious routing triggered widespread forced liquidations across the protocol.", functionsCall: ["Rhea.liquidate(multiple_positions)"], pseudocode: "// Reserve pool drained\n// Cascading liquidations triggered" },
      { id: "t5", phase: "Reserve Drain", description: "Protocol's reserve pool was completely drained of $18.4M in assets.", functionsCall: ["Reserve.withdraw(all_assets)"], pseudocode: "// All reserves extracted\n// Protocol left insolvent" },
      { id: "t6", phase: "Obfuscation", description: "Attacker deleted 55 intermediary accounts to obscure on-chain trail.", functionsCall: ["NEAR.delete_account(55_accounts)"], pseudocode: "// Account deletion for obfuscation\n// Partial repayment: $3.36M USDC + $1.56M NEAR returned" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Fake pool creator", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Ref Finance", detail: "Fake pools", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "Slippage Protection", detail: "Token reuse flaw", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "Rhea Reserves", detail: "$18.4M", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Drained reserves", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Create fake pools" },
        { id: "e2", source: "n2", target: "n3", label: "Reuse intermediate tokens", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Bypass validation" },
        { id: "e4", source: "n4", target: "n5", label: "Drain reserves", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Attacker\nFunds", type: "attacker" },
      { id: "b", label: "Fake\nPools", type: "pool" },
      { id: "c", label: "Slippage\nBypass", type: "vault" },
      { id: "d", label: "Rhea\nReserves", type: "pool" },
      { id: "e", label: "Attacker\nProfit", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 5, label: "Liquidity injection" },
      { source: "b", target: "c", value: 18.4, label: "Route construction" },
      { source: "c", target: "d", value: 18.4, label: "Borrow & route" },
      { source: "d", target: "e", value: 18.4, label: "Reserve drain" }
    ],
    mitigations: [
      { category: "Slippage Validation", description: "Account for intermediate token reuse in multi-step swap calculations. Track token state across entire swap path." },
      { category: "Pool Verification", description: "Validate token pools used in margin trading routes. Implement whitelisting for approved pools." },
      { category: "Liquidation Guards", description: "Add circuit breakers to prevent cascading liquidations from single malicious routes." }
    ],
    quiz: [{ question: "What flaw did Rhea Finance's slippage protection have?", options: ["Oracle manipulation", "Token reuse in multi-step swaps", "Reentrancy", "Integer overflow"], correct: 1, explanation: "Slippage protection failed to account for reused intermediate tokens in multi-step swaps." }]
  },

  // 13. Kelp DAO (April 18, 2026)
  {
    id: "kelp-dao-2026",
    slug: "kelp-dao-2026",
    title: "Kelp DAO",
    subtitle: "RPC Infrastructure Compromise",
    year: 2026,
    chain: "Ethereum/LayerZero",
    type: ["Infrastructure", "Bridge"],
    shortDesc: "Compromised DVN oracle led to $292M RSeth drain via cross-chain message forgery.",
    longDesc: "On April 18, 2026, Kelp DAO suffered a catastrophic $292M exploit through a sophisticated LayerZero DVN (Decentralized Verification Network) compromise. Attackers gained control of an RPC node used by a DVN oracle, allowing them to forge cross-chain messages that appeared legitimate. This enabled the minting of unbacked rsETH tokens on the destination chain, which were then swapped for real assets. The attack highlighted critical vulnerabilities in cross-chain infrastructure and the risks of centralized oracle dependencies.",
    technicalDesc: "The exploit targeted LayerZero's messaging protocol where DVN oracles validate cross-chain transactions. By compromising a validator's RPC node, attackers could inject fake block references and craft messages that appeared to contain legitimate deposit proofs from the source chain. The Kelp DAO contract, trusting these oracle validations, minted rsETH tokens worth $292M without corresponding underlying assets. The attackers then drained these tokens through DEX swaps, converting them to ETH and other assets before the vulnerability could be mitigated.",
    impact: "$292M",
    impactUSD: 292000000,
    contracts: [
      {
        label: "LayerZero V1 Endpoint",
        address: "0x66A71Dcef29A0fFBDBE3c6a4B3A1E6D9A5b5C7E9",
        url: "https://etherscan.io/address/0x66a71dcef29a0ffbdbe3c6a460a3b5bc225cd675"
      }
    ],
    timeline: [
      { 
        id: "t1", 
        phase: "Infrastructure Compromise", 
        description: "Attacker gains access to RPC node used by LayerZero DVN oracle through validator exploit.", 
        functionsCall: ["rpc_hijack()", "validator_compromise()"], 
        pseudocode: "// Gain control of validator node\n// Inject malicious RPC responses\n// Bypass DVN validation checks" 
      },
      { 
        id: "t2", 
        phase: "Message Forgery", 
        description: "Attackers craft fake cross-chain deposit messages with forged proofs.", 
        functionsCall: ["forgeDepositProof()", "signMessage()"], 
        pseudocode: "// Create fake deposit transaction\n// Generate fraudulent Merkle proofs\n// Sign with compromised validator keys" 
      },
      { 
        id: "t3", 
        phase: "Oracle Submission", 
        description: "Compromised DVN submits forged messages to LayerZero endpoint.", 
        functionsCall: ["DVN.validateMessage()", "Endpoint.receivePayload()"], 
        pseudocode: "// DVN validates fake message as legitimate\n// LayerZero accepts fraudulent payload\n// Cross-chain bridge triggered" 
      },
      { 
        id: "t4", 
        phase: "Token Minting", 
        description: "Kelp DAO mints 292M unbacked rsETH based on fake deposit proofs.", 
        functionsCall: ["KelpDAO.mintRSeth()", "Bridge.deposit()"], 
        pseudocode: "// Mint rsETH without collateral\n// Credit attacker wallet\n// Balance: +292M rsETH" 
      },
      { 
        id: "t5", 
        phase: "Asset Drain", 
        description: "Attackers swap fake rsETH for real assets across multiple DEXs.", 
        functionsCall: ["UniswapV3.swap()", "Curve.exchange()", "Balancer.exitPool()"], 
        pseudocode: "// Swap rsETH -> ETH on Uniswap\n// Convert through Curve pools\n// Drain all available liquidity" 
      },
      { 
        id: "t6", 
        phase: "Cross-Chain Laundering", 
        description: "Profits moved through multiple chains to evade tracking.", 
        functionsCall: ["LayerZero.send()", "TornadoCash.withdraw()"], 
        pseudocode: "// Bridge profits to other chains\n// Mix through privacy protocols\n// Distribute to wallet network" 
      }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Compromised DVN RPC", x: 50, y: 200 },
        { id: "n2", type: "oracle", label: "DVN Oracle", detail: "Forged validation", x: 250, y: 200 },
        { id: "n3", type: "bridge", label: "LayerZero", detail: "Message relay", x: 450, y: 200 },
        { id: "n4", type: "contract", label: "Kelp DAO", detail: "Mints rsETH", x: 650, y: 200 },
        { id: "n5", type: "pool", label: "DEX Pools", detail: "Liquidity drain", x: 850, y: 200 },
        { id: "n6", type: "result", label: "Profit", detail: "$292M", x: 1050, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "RPC compromise", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Fake validation" },
        { id: "e3", source: "n3", target: "n4", label: "Trigger mint" },
        { id: "e4", source: "n4", target: "n5", label: "Dump rsETH", animated: true },
        { id: "e5", source: "n5", target: "n6", label: "Extract profit" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Fake Deposit\nProof", type: "bridge" },
      { id: "b", label: "Kelp DAO\nVault", type: "vault" },
      { id: "c", label: "rsETH\nMinted", type: "pool" },
      { id: "d", label: "Uniswap\nPool", type: "pool" },
      { id: "e", label: "Curve\nPool", type: "pool" },
      { id: "f", label: "Attacker\nWallet", type: "attacker" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 292, label: "Fake deposit" },
      { source: "b", target: "c", value: 292, label: "Mint rsETH" },
      { source: "c", target: "d", value: 150, label: "Uniswap swap" },
      { source: "c", target: "e", value: 142, label: "Curve swap" },
      { source: "d", target: "f", value: 150, label: "ETH profit" },
      { source: "e", target: "f", value: 142, label: "Stablecoin profit" }
    ],
    mitigations: [
      { 
        category: "Infrastructure", 
        description: "Implement multi-DVN validation requiring independent oracle consensus before message acceptance.",
        code: "require(dvns.length >= 3 && dvns.filter(d => d.validate(msg)).length >= 2);"
      },
      { 
        category: "Oracle Security", 
        description: "Use decentralized RPC networks with geographic distribution and validator rotation.",
        code: "rpc_providers = [infura, alchemy, quicknode, local_nodes];"
      },
      { 
        category: "Cross-Chain Validation", 
        description: "Implement time-delayed message execution with challenge periods.",
        code: "require(block.timestamp > msg.receivedAt + CHALLENGE_PERIOD);"
      },
      { 
        category: "Access Control", 
        description: "Enforce multi-signature requirements for bridge parameter changes.",
        code: "require(signatures.length >= required_sigs && verifySignatures(data, signatures));"
      }
    ],
    quiz: [
      { 
        question: "What infrastructure component was compromised in the Kelp DAO hack?", 
        options: ["Validator RPC node", "KMS encryption keys", "Smart contract logic", "Front-end server"], 
        correct: 0, 
        explanation: "The attacker compromised a validator's RPC node used by the LayerZero DVN oracle, allowing message forgery." 
      },
      { 
        question: "How did attackers create fake rsETH tokens?", 
        options: ["Flash loan manipulation", "Cross-chain message forgery", "Direct contract exploit", "Social engineering"], 
        correct: 1, 
        explanation: "Attackers forged cross-chain deposit messages that appeared legitimate to the Kelp DAO contract." 
      },
      { 
        question: "What was the primary vulnerability exploited?", 
        options: ["Reentrancy", "Oracle manipulation", "Integer overflow", "Access control failure"], 
        correct: 1, 
        explanation: "The core vulnerability was oracle manipulation through compromised DVN validation." 
      }
    ]
  },

  // Abracadabra Finance 2025
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

  // Phemex (2025)
  {
    id: "phemex-2025",
    slug: "phemex-2025",
    title: "Phemex",
    subtitle: "CEX Hot Wallet Compromise",
    year: 2025,
    chain: "Multi-chain",
    type: ["Access Control"],
    shortDesc: "Hot wallet private keys compromised across multiple chains, draining $73.5M from Singapore-based exchange.",
    longDesc: "On January 23, 2025, Phemex, a Singapore-based cryptocurrency exchange, suffered the largest centralized exchange hack of 2025 with $73.5M stolen. Attackers systematically emptied hot wallets across Solana, Ethereum, Base, Avalanche, and other chains. The breach unfolded like a game of blockchain whack-a-mole - as soon as Phemex spotted suspicious activity on one chain, the attacker was already draining another. The incident highlighted the vulnerability of CEX hot wallets that lack proper multi-sig protection.",
    technicalDesc: "This was a private key compromise affecting multiple hot wallets across different blockchains. The attacker: (1) obtained Phemex's hot wallet private keys through unknown means; (2) systematically drained funds from wallets on Solana, Ethereum, Base, Avalanche, and other chains; (3) moved funds rapidly to evade detection; (4) exchanged tokens for ETH and moved through mixers. The multi-chain nature of the attack suggested the attacker had comprehensive access to Phemex's infrastructure.",
    impact: "$73.5M",
    impactUSD: 73500000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Key Compromise", description: "Attacker obtained hot wallet private keys.", functionsCall: [], pseudocode: "// Infrastructure breach\n// Multi-chain keys exposed" },
      { id: "t2", phase: "Multi-Chain Drain", description: "Drained wallets across Solana, Ethereum, Base, Avalanche.", functionsCall: ["Wallet.transfer(SOL)", "Wallet.transfer(ETH)", "Wallet.transfer(BASE)"], pseudocode: "// Systematic extraction\n// Multiple chains targeted" },
      { id: "t3", phase: "Detection", description: "Phemex detected suspicious activity on one chain.", functionsCall: [], pseudocode: "// Blockchain whack-a-mole\n// Attacker already on next chain" },
      { id: "t4", phase: "Evasion", description: "Funds moved through mixers and exchanges.", functionsCall: ["Mixers.tumble()", "DEX.swap()"], pseudocode: "// Evasion tactics\n// Funds laundered" },
      { id: "t5", phase: "Response", description: "Phemex halted withdrawals and secured remaining funds.", functionsCall: ["Wallet.freeze()"], pseudocode: "// Incident response\n// $73.5M total lost" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Key compromise", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Phemex Keys", detail: "Compromised", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Multi-Chain Wallets", detail: "$73.5M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Access" },
        { id: "e3", source: "n3", target: "n4", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Phemex\nKeys", type: "vault" },
      { id: "b", label: "Hot Wallets\n$73.5M", type: "pool" },
      { id: "c", label: "Attacker\nDrained", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 73.5, label: "Access" },
      { source: "b", target: "c", value: 73.5, label: "Drain" }
    ],
    mitigations: [
      { category: "Multi-sig", description: "Use multi-signature wallets for all hot wallets. Never rely on single private keys." },
      { category: "HSM/MPC", description: "Use hardware security modules (HSMs) or multi-party computation (MPC) for key management." },
      { category: "Cold Storage", description: "Keep majority of funds in cold storage. Limit hot wallet to minimal operational amounts." }
    ],
    quiz: [{ question: "What was Phemex's vulnerability?", options: ["Smart contract bug", "Hot wallet key compromise", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "Compromised hot wallet private keys allowed draining across multiple chains." }]
  },

  // BTCTurk (2025)
  {
    id: "btcturk-2025",
    slug: "btcturk-2025",
    title: "BTCTurk",
    subtitle: "Hot Wallet Private Key Compromise",
    year: 2025,
    chain: "Multi-chain",
    type: ["Access Control"],
    shortDesc: "Private keys compromised again, $51.7M drained from hot wallets across multiple chains.",
    longDesc: "On August 14, 2025, Turkish cryptocurrency exchange BTCTurk suffered a $51.7M hack. This was the second major hack for BTCTurk within 14 months, both involving compromised private keys. Cyvers detected $48M in unusual transfers across ETH, AVAX, ARB, BASE, OP, MANTLE, and MATIC networks. Most funds were consolidated into two addresses. BTCTurk halted deposits and withdrawals, citing a technical issue with hot wallets while trading and local currency operations remained intact.",
    technicalDesc: "This was a private key compromise affecting hot wallets across multiple blockchains. The attacker: (1) obtained BTCTurk's hot wallet private keys; (2) drained funds across ETH, AVAX, ARB, BASE, OP, MANTLE, and MATIC networks; (3) consolidated funds into two addresses; (4) moved funds to evade tracking. This was BTCTurk's second major hack in 14 months, indicating systemic security issues with their key management.",
    impact: "$51.7M",
    impactUSD: 51700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Key Compromise", description: "Attacker obtained hot wallet private keys.", functionsCall: [], pseudocode: "// Second breach in 14 months\n// Systemic security failure" },
      { id: "t2", phase: "Multi-Chain Drain", description: "Drained across ETH, AVAX, ARB, BASE, OP, MANTLE, MATIC.", functionsCall: ["Wallet.transfer(multiple_chains)"], pseudocode: "// $48M detected initially\n// Total $51.7M lost" },
      { id: "t3", phase: "Consolidation", description: "Funds consolidated into two addresses.", functionsCall: ["Wallet.consolidate()"], pseudocode: "// Consolidation for evasion\n// Tracing made difficult" },
      { id: "t4", phase: "Detection", description: "Cyvers detected unusual transfers.", functionsCall: [], pseudocode: "// Monitoring triggered\n// Exchange notified" },
      { id: "t5", phase: "Response", description: "BTCTurk halted deposits and withdrawals.", functionsCall: ["Wallet.freeze()"], pseudocode: "// Trading remained intact\n// Local currency operations continued" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Key compromise", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "BTCTurk Keys", detail: "Compromised", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Multi-Chain Wallets", detail: "$51.7M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Access" },
        { id: "e3", source: "n3", target: "n4", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "BTCTurk\nKeys", type: "vault" },
      { id: "b", label: "Hot Wallets\n$51.7M", type: "pool" },
      { id: "c", label: "Attacker\nDrained", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 51.7, label: "Access" },
      { source: "b", target: "c", value: 51.7, label: "Drain" }
    ],
    mitigations: [
      { category: "Key Rotation", description: "Regularly rotate private keys, especially after any security incident." },
      { category: "Independent Key Storage", description: "Use independent key storage solutions with proper segmentation between chains." },
      { category: "Audit", description: "Conduct regular security audits of key management procedures." }
    ],
    quiz: [{ question: "What was notable about BTCTurk's hack?", options: ["First hack ever", "Second hack in 14 months", "Smart contract bug", "Oracle manipulation"], correct: 1, explanation: "This was BTCTurk's second major hack in 14 months, both involving compromised private keys." }]
  },

  // CoinDCX (2025)
  {
    id: "coindcx-2025",
    slug: "coindcx-2025",
    title: "CoinDCX",
    subtitle: "Server Compromise / Internal Account",
    year: 2025,
    chain: "Solana",
    type: ["Access Control"],
    shortDesc: "Server compromise allowed $44.3M drain from internal account used for liquidity provisioning.",
    longDesc: "On July 19, 2025, CoinDCX, one of India's largest crypto exchanges, lost approximately $44.3M in a suspected hack. The issue was caused by a server compromise that affected an internal account used only for liquidity provisioning on a partner exchange. The company confirmed that customer funds were not affected and that all customer assets remained safe. The hack was traced from just 1 ETH initially by ZachXBT. CoinDCX's CEO stated the treasury was strong enough to continue operations.",
    technicalDesc: "This was a server compromise affecting an operational wallet on the Solana blockchain, not a smart contract vulnerability. The attacker: (1) compromised CoinDCX's server infrastructure; (2) gained access to an internal account used for liquidity provisioning; (3) siphoned approximately $44.2M in USDC and USDT from the wallet; (4) laundered funds through various addresses. The attack was quickly contained by isolating the affected internal account, preventing spread to customer funds.",
    impact: "$44.3M",
    impactUSD: 44300000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Server Compromise", description: "Attacker compromised CoinDCX server infrastructure.", functionsCall: [], pseudocode: "// Infrastructure breach\n// Internal account exposed" },
      { id: "t2", phase: "Access Internal Account", description: "Gained access to liquidity provisioning wallet.", functionsCall: [], pseudocode: "// Partner exchange wallet\n// Not customer funds" },
      { id: "t3", phase: "Drain", description: "Siphoned $44.2M in USDC and USDT.", functionsCall: ["Wallet.transfer(USDC)", "Wallet.transfer(USDT)"], pseudocode: "// Solana blockchain\n// Operational wallet drained" },
      { id: "t4", phase: "Containment", description: "CoinDCX isolated affected internal account.", functionsCall: ["Account.isolate()"], pseudocode: "// Customer funds safe\n// Rapid containment" },
      { id: "t5", phase: "Recovery", description: "CoinDCX confirmed treasury strong, operations continue.", functionsCall: [], pseudocode: "// Business continuity\n// $44.3M operational loss" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Server compromise", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "CoinDCX Server", detail: "Compromised", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Internal Wallet", detail: "$44.3M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Access" },
        { id: "e3", source: "n3", target: "n4", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "CoinDCX\nServer", type: "vault" },
      { id: "b", label: "Internal\nWallet", type: "pool" },
      { id: "c", label: "Attacker\n$44.3M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 44.3, label: "Access" },
      { source: "b", target: "c", value: 44.3, label: "Drain" }
    ],
    mitigations: [
      { category: "Server Security", description: "Implement strict access controls and monitoring for server infrastructure." },
      { category: "Account Segmentation", description: "Segregate operational accounts from customer funds with strict access controls." },
      { category: "Monitoring", description: "Implement real-time monitoring for unusual wallet activity." }
    ],
    quiz: [{ question: "What was CoinDCX's vulnerability?", options: ["Smart contract bug", "Server compromise of internal account", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "Server compromise affected an internal liquidity provisioning wallet, not customer funds." }]
  },

  // Swissborg (2025)
  {
    id: "swissborg-2025",
    slug: "swissborg-2025",
    title: "Swissborg",
    subtitle: "Partner API Compromise",
    year: 2025,
    chain: "Solana",
    type: ["Access Control"],
    shortDesc: "Partner Kiln's API was compromised, resulting in $41.5M SOL drain from SOL Earn program.",
    longDesc: "On September 8, 2025, Swiss wealth management platform SwissBorg lost $41.5M in SOL after their trusted staking partner Kiln's API was compromised. Approximately 192,600 SOL (valued at $41.5M) was stolen from an external wallet used for SwissBorg's Solana Earn strategy. The CEO stated this affected approximately 1% of SwissBorg users and 2% of total assets. SwissBorg assured users that the main app remained secure and all other funds in Earn programs were safe.",
    technicalDesc: "This was a third-party partner API compromise, not a direct SwissBorg vulnerability. The attacker: (1) compromised Kiln's API (SwissBorg's staking partner); (2) obtained withdrawal keys through Kiln's backdoor; (3) drained 192,600 SOL from SwissBorg's external SOL Earn wallet; (4) moved funds to a flagged 'SwissBorg Exploiter' wallet on Solscan. The incident highlighted the risks of relying on third-party partners for critical infrastructure.",
    impact: "$41.5M",
    impactUSD: 41500000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Partner Compromise", description: "Attacker compromised Kiln's API.", functionsCall: [], pseudocode: "// Third-party partner breach\n// API keys exposed" },
      { id: "t2", phase: "Key Access", description: "Obtained withdrawal keys through Kiln's backdoor.", functionsCall: [], pseudocode: "// Kiln's security failure\n// Withdrawal keys handed to hackers" },
      { id: "t3", phase: "Drain SOL", description: "Drained 192,600 SOL from external wallet.", functionsCall: ["Wallet.transfer(SOL)"], pseudocode: "// SOL Earn program affected\n// 1% of users, 2% of assets" },
      { id: "t4", phase: "Flagging", description: "Funds moved to flagged 'SwissBorg Exploiter' wallet.", functionsCall: [], pseudocode: "// Solscan flagged address\n// Tracking enabled" },
      { id: "t5", phase: "Containment", description: "Swissborg assured other funds safe, app secure.", functionsCall: [], pseudocode: "// Main app unaffected\n// Other Earn programs safe" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "API compromise", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Kiln API", detail: "Compromised", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "SOL Earn Wallet", detail: "$41.5M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "192,600 SOL", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Access" },
        { id: "e3", source: "n3", target: "n4", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Kiln\nAPI", type: "vault" },
      { id: "b", label: "SOL Earn\nWallet", type: "pool" },
      { id: "c", label: "Attacker\n192,600 SOL", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 41.5, label: "Access" },
      { source: "b", target: "c", value: 41.5, label: "Drain" }
    ],
    mitigations: [
      { category: "Partner Due Diligence", description: "Conduct thorough security audits of third-party partners before integration." },
      { category: "API Security", description: "Implement strict API key management and rotation for third-party integrations." },
      { category: "Monitoring", description: "Monitor third-party partner activity for unusual patterns." }
    ],
    quiz: [{ question: "What was Swissborg's vulnerability?", options: ["Smart contract bug", "Partner API compromise", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "Kiln's API was compromised, allowing access to Swissborg's SOL Earn wallet." }]
  },

  // UXLink (2025)
  {
    id: "uxlink-2025",
    slug: "uxlink-2025",
    title: "UXLink",
    subtitle: "Smart Contract Vulnerability / Multisig Exploit",
    year: 2025,
    chain: "Multi-chain",
    type: ["Access Control", "Logic Error"],
    shortDesc: "Smart contract vulnerability allowed $41M drain from multisig wallet, token price dropped 70%.",
    longDesc: "On September 22, 2025, UXLink, a cross-chain asset protocol, suffered a hack where attackers moved around $11.3M worth of crypto from a multisig wallet. The token price dropped from $0.30 to $0.09, a 70% decline, erasing market cap. The attacker exploited a smart contract vulnerability and created almost 10 trillion tokens in a second mint. PeckShield flagged the token with 'DO NOT TRADE' warnings. The attacker attempted to trade stolen ETH but ended up with losses due to poor trading decisions.",
    technicalDesc: "The vulnerability was in UXLink's smart contract that allowed unauthorized token minting. The attacker: (1) identified the smart contract vulnerability; (2) exploited it to mint almost 10 trillion tokens in a second mint; (3) drained $11.3M from the multisig wallet; (4) caused token price to drop 70% from $0.30 to $0.09; (5) attempted to trade stolen ETH but made poor trading decisions, ending with losses. The total impact was estimated at $41M including market cap erosion.",
    impact: "$41M",
    impactUSD: 41000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Vulnerability Discovery", description: "Attacker identified smart contract vulnerability.", functionsCall: [], pseudocode: "// Contract flaw found\n// Unauthorized minting possible" },
      { id: "t2", phase: "First Mint", description: "Attacker minted initial tokens.", functionsCall: ["Token.mint()"], pseudocode: "// Initial mint\n// PeckShield flagged token" },
      { id: "t3", phase: "Second Mint", description: "Created almost 10 trillion tokens in second mint.", functionsCall: ["Token.mint(10T)"], pseudocode: "// Massive mint\n// 'DO NOT TRADE' warning" },
      { id: "t4", phase: "Multisig Drain", description: "Drained $11.3M from multisig wallet.", functionsCall: ["Multisig.transfer()"], pseudocode: "// Price dropped 70%\n// $0.30 to $0.09" },
      { id: "t5", phase: "Trading Losses", description: "Attacker tried to trade stolen ETH but lost money.", functionsCall: ["DEX.trade()"], pseudocode: "// Poor trading decisions\n// Net losses incurred" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Contract exploit", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "UXLink Contract", detail: "Vulnerable", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Token Mint", detail: "10T tokens", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "Multisig", detail: "$11.3M", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Trading losses", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Exploit", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Mint", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Price crash" },
        { id: "e4", source: "n4", target: "n5", label: "Drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "UXLink\nContract", type: "vault" },
      { id: "b", label: "Minted\nTokens", type: "pool" },
      { id: "c", label: "Multisig\n$11.3M", type: "pool" },
      { id: "d", label: "Attacker\nLosses", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 41, label: "Mint" },
      { source: "b", target: "c", value: 11.3, label: "Drain" },
      { source: "c", target: "d", value: 41, label: "Total impact" }
    ],
    mitigations: [
      { category: "Mint Controls", description: "Implement strict mint rate limits and governance approvals for token minting." },
      { category: "Multisig Security", description: "Use proper multi-signature wallets with time-locks for critical operations." },
      { category: "Audit", description: "Conduct thorough smart contract audits, especially for minting mechanisms." }
    ],
    quiz: [{ question: "What was UXLink's vulnerability?", options: ["Reentrancy", "Smart contract mint vulnerability", "Oracle manipulation", "Key leak"], correct: 1, explanation: "Smart contract vulnerability allowed unauthorized minting of 10 trillion tokens." }]
  },

  // BigONE (2025)
  {
    id: "bigone-2025",
    slug: "bigone-2025",
    title: "BigONE",
    subtitle: "Supply Chain Attack",
    year: 2025,
    chain: "Multi-chain",
    type: ["Access Control"],
    shortDesc: "Supply chain attack on production environment allowed $27M drain from hot wallets.",
    longDesc: "On July 16, 2025, Seychelles-based cryptocurrency exchange BigONE suffered a $27M breach due to a supply chain attack. The production network was compromised, and the operating logic of account and risk control related servers was modified, enabling the attacker to withdraw funds. This wasn't a typical exchange hack with leaked private keys - the attacker bypassed the front door, rewrote the script, and exited with the vault. BigONE vowed full user compensation.",
    technicalDesc: "This was a sophisticated supply chain attack, not a simple private key compromise. The attacker: (1) compromised BigONE's production environment; (2) modified the operating logic of account and risk control servers; (3) bypassed normal security controls; (4) drained $27M from hot wallets; (5) evaded detection through modified server logic. The attack suggested either extensive reconnaissance or insider access to BigONE's infrastructure.",
    impact: "$27M",
    impactUSD: 27000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Supply Chain Compromise", description: "Attacker compromised production environment.", functionsCall: [], pseudocode: "// Supply chain attack\n// Infrastructure breach" },
      { id: "t2", phase: "Server Logic Modification", description: "Modified account and risk control server logic.", functionsCall: ["Server.modify(logic)"], pseudocode: "// Operating logic changed\n// Security controls bypassed" },
      { id: "t3", phase: "Bypass Security", description: "Bypassed front door security controls.", functionsCall: [], pseudocode: "// Not typical key leak\n// Script rewritten" },
      { id: "t4", phase: "Drain", description: "Drained $27M from hot wallets.", functionsCall: ["Wallet.transfer()"], pseudocode: "// Modified logic enabled\n// Withdrawal allowed" },
      { id: "t5", phase: "Compensation", description: "BigONE vowed full user compensation.", functionsCall: [], pseudocode: "// User funds safe\n// Full reimbursement promised" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Supply chain", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Production Env", detail: "Compromised", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "Server Logic", detail: "Modified", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "Hot Wallets", detail: "$27M", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Drained", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Modify", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Bypass" },
        { id: "e4", source: "n4", target: "n5", label: "Drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Production\nEnvironment", type: "vault" },
      { id: "b", label: "Modified\nLogic", type: "bridge" },
      { id: "c", label: "Hot Wallets\n$27M", type: "pool" },
      { id: "d", label: "Attacker\nDrained", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 27, label: "Modify" },
      { source: "b", target: "c", value: 27, label: "Bypass" },
      { source: "c", target: "d", value: 27, label: "Drain" }
    ],
    mitigations: [
      { category: "Supply Chain Security", description: "Implement strict supply chain security and verification for all software dependencies." },
      { category: "Server Monitoring", description: "Monitor server logic and configuration for unauthorized modifications." },
      { category: "Immutable Infrastructure", description: "Use immutable infrastructure where server logic cannot be modified without proper approval." }
    ],
    quiz: [{ question: "What was BigONE's vulnerability?", options: ["Private key leak", "Supply chain attack on production", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "Supply chain attack modified server logic, bypassing normal security controls." }]
  },

  // SBI Crypto (2025)
  {
    id: "sbi-crypto-2025",
    slug: "sbi-crypto-2025",
    title: "SBI Crypto",
    subtitle: "Hot Wallet Compromise Across 5 Chains",
    year: 2025,
    chain: "Multi-chain",
    type: ["Access Control"],
    shortDesc: "Hot wallet compromise drained $24M across Bitcoin, Ethereum, Litecoin, Dogecoin, and Bitcoin Cash.",
    longDesc: "On September 24, 2025, SBI Crypto, a mining pool subsidiary of Japan's SBI Holdings, suffered approximately $24M theft across five blockchains: Bitcoin, Ethereum, Litecoin, Dogecoin, and Bitcoin Cash. The attackers systematically drained funds from SBI Crypto's hot wallets across all five chains. Suspicious outflows were detected by ZachXBT, with funds laundered through Tornado Cash. North Korean hackers were suspected to be behind the attack. This was particularly notable as SBI had acquired customers from DMM Bitcoin's closure in March 2025.",
    technicalDesc: "This was a hot wallet compromise affecting multiple blockchains. The attacker: (1) obtained SBI Crypto's hot wallet private keys across five chains; (2) systematically drained funds from Bitcoin, Ethereum, Litecoin, Dogecoin, and Bitcoin Cash wallets; (3) laundered funds through Tornado Cash; (4) evaded tracking. The attack was attributed to North Korean hackers (Lazarus Group). The multi-chain nature suggested comprehensive access to SBI's infrastructure.",
    impact: "$24M",
    impactUSD: 24000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Key Compromise", description: "Attacker obtained hot wallet keys across 5 chains.", functionsCall: [], pseudocode: "// BTC, ETH, LTC, DOGE, BCH\n// Comprehensive access" },
      { id: "t2", phase: "Multi-Chain Drain", description: "Drained funds across all five blockchains.", functionsCall: ["Wallet.transfer(BTC)", "Wallet.transfer(ETH)", "Wallet.transfer(LTC)", "Wallet.transfer(DOGE)", "Wallet.transfer(BCH)"], pseudocode: "$24M total\n// Systematic extraction" },
      { id: "t3", phase: "Laundering", description: "Funds laundered through Tornado Cash.", functionsCall: ["TornadoCash.deposit()"], pseudocode: "// Evasion tactics\n// DPRK attribution" },
      { id: "t4", phase: "Detection", description: "ZachXBT detected suspicious outflows.", functionsCall: [], pseudocode: "// On-chain analysis\n// Attribution made" },
      { id: "t5", phase: "Context", description: "Notable as SBI acquired DMM Bitcoin customers.", functionsCall: [], pseudocode: "// March 2025 DMM closure\n// Customer transfer irony" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "DPRK suspected", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "SBI Keys", detail: "5 chains", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Hot Wallets", detail: "$24M", x: 450, y: 200 },
        { id: "n4", type: "contract", label: "Tornado Cash", detail: "Laundering", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Drained", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Access" },
        { id: "e3", source: "n3", target: "n4", label: "Launder", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Extract" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "SBI\nKeys", type: "vault" },
      { id: "b", label: "5 Chain\nWallets", type: "pool" },
      { id: "c", label: "Tornado\nCash", type: "bridge" },
      { id: "d", label: "Attacker\n$24M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 24, label: "Access" },
      { source: "b", target: "c", value: 24, label: "Launder" },
      { source: "c", target: "d", value: 24, label: "Extract" }
    ],
    mitigations: [
      { category: "Key Management", description: "Use hardware security modules (HSMs) for hot wallet keys across all chains." },
      { category: "Chain Segregation", description: "Segregate hot wallet keys by chain to limit blast radius of compromise." },
      { category: "Monitoring", description: "Implement real-time cross-chain monitoring for suspicious outflows." }
    ],
    quiz: [{ question: "What was SBI Crypto's vulnerability?", options: ["Smart contract bug", "Hot wallet compromise across 5 chains", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "Hot wallet keys across Bitcoin, Ethereum, Litecoin, Dogecoin, and Bitcoin Cash were compromised." }]
  },

  // --- CLASSIC HACKS ---

  // The DAO (2016)
  {
    id: "the-dao-2016",
    slug: "the-dao-2016",
    title: "The DAO",
    subtitle: "Reentrancy in splitDAO() - Historic Ethereum Hard Fork",
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

  // Harvest Finance (2020)
  {
    id: "harvest-finance-2020",
    slug: "harvest-finance-2020",
    title: "Harvest Finance",
    subtitle: "Flash Loan Reentrancy on Curve",
    year: 2020,
    chain: "Ethereum",
    type: ["Flash Loan", "Reentrancy"],
    shortDesc: "Flash loan reentrancy exploited price discrepancies between USDC and USDT pools, draining $24M.",
    longDesc: "On October 26, 2020, Harvest Finance, a DeFi yield aggregator, suffered a $24M exploit via flash loan reentrancy. The attacker exploited price discrepancies between Curve's USDC and USDT pools. By borrowing massive amounts via flash loans, manipulating prices, and re-entering the protocol before state updates completed, the attacker drained $13M USDC and $11M USDT. The attacker later returned $2.5M and Harvest offered a $100K bounty for the rest.",
    technicalDesc: "The exploit leveraged reentrancy in Harvest's vault contracts. The attacker: (1) borrowed 50M USDC via Aave flash loan; (2) deposited into Harvest's USDC vault; (3) swapped to fUSDT (wrapped USDT); (4) withdrew from fUSDT vault - this triggered a reentrancy window where the contract hadn't updated internal state; (5) re-entered to deposit back and manipulate the share price; (6) withdrew at inflated share prices; (7) repaid flash loan with profit.",
    impact: "$24M",
    impactUSD: 24000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Borrowed 50M USDC via Aave flash loan.", functionsCall: ["Aave.flashLoan(50M USDC)"], pseudocode: "// Atomic borrowing - must repay in same tx" },
      { id: "t2", phase: "Deposit", description: "Deposited into Harvest's USDC vault.", functionsCall: ["VaultUSDC.deposit(50M)"], pseudocode: "// Received fUSDC tokens representing share" },
      { id: "t3", phase: "Swap", description: "Swapped fUSDC to fUSDT on Curve.", functionsCall: ["Curve.swap(fUSDC, fUSDT)"], pseudocode: "// Cross-vault arbitrage opportunity" },
      { id: "t4", phase: "Reentrancy", description: "Withdrew from fUSDT vault, triggering reentrancy before state update.", functionsCall: ["VaultUSDT.withdraw()"], pseudocode: "// Reentrancy window opened\n// Internal state not yet updated" },
      { id: "t5", phase: "Manipulation", description: "Re-entered to manipulate share prices and drain value.", functionsCall: ["VaultUSDC.deposit()", "VaultUSDC.withdraw()"], pseudocode: "// Exploited stale state\n// Extracted at inflated prices" },
      { id: "t6", phase: "Exit", description: "Repaid flash loan, kept ~$24M profit.", functionsCall: ["Aave.repay(50M USDC)"], pseudocode: "// $2.5M later returned\n// $100K bounty offered" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Flash loan exploit", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Aave Flash Loan", detail: "50M USDC", x: 200, y: 100 },
        { id: "n3", type: "contract", label: "Harvest Vaults", detail: "Reentrancy bug", x: 400, y: 200 },
        { id: "n4", type: "pool", label: "Curve Pools", detail: "USDC/USDT", x: 600, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$24M profit", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Flash loan", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Deposit" },
        { id: "e3", source: "n3", target: "n4", label: "Swap" },
        { id: "e4", source: "n4", target: "n3", label: "Reenter", animated: true },
        { id: "e5", source: "n3", target: "n5", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Aave\n50M USDC", type: "pool" },
      { id: "b", label: "Harvest\nVaults", type: "vault" },
      { id: "c", label: "Curve\nSwap", type: "bridge" },
      { id: "d", label: "Attacker\n$24M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 50, label: "Flash loan" },
      { source: "b", target: "c", value: 50, label: "Swap" },
      { source: "c", target: "b", value: 50, label: "Reenter" },
      { source: "b", target: "d", value: 24, label: "Profit" }
    ],
    mitigations: [
      { category: "ReentrancyGuard", description: "Use OpenZeppelin ReentrancyGuard on all vault withdraw/deposit functions." },
      { category: "State Update Order", description: "Update all state variables before making external calls (Checks-Effects-Interactions)." },
      { category: "Flash Loan Protection", description: "Add delays or limits on rapid deposit/withdraw cycles." }
    ],
    quiz: [{ question: "What vulnerability did Harvest Finance have?", options: ["Oracle bug", "Reentrancy", "Access control", "Integer overflow"], correct: 1, explanation: "Reentrancy in vault withdraw functions allowed state manipulation before updates completed." }]
  },

  // PancakeBunny (2021)
  {
    id: "pancakebunny-2021",
    slug: "pancakebunny-2021",
    title: "PancakeBunny",
    subtitle: "Flash Loan Price Manipulation on BSC",
    year: 2021,
    chain: "BNB Chain",
    type: ["Flash Loan", "Oracle Manipulation"],
    shortDesc: "Flash loan attacker manipulated PancakeSwap LP prices to mint 7M BUNNY tokens from nothing, draining $45M.",
    longDesc: "On May 19, 2021, PancakeBunny, a BSC yield aggregator, suffered a $45M exploit. The attacker used a $200M flash loan from PancakeSwap to manipulate the price of the BUNNY-BNB LP token. By abusing incorrect price computation in Bunny's PriceCalculatorBSC contract, the attacker minted 6.97M BUNNY tokens from nothing, which were then sold for ~114,631 WBNB (~$45M). Three forked projects (AutoShark, Merlin Labs, PancakeHunny) were also attacked similarly.",
    technicalDesc: "The exploit targeted PriceCalculatorBSC which used PancakeSwap's getAmountsOut to compute LP token prices. The attacker: (1) borrowed 200M BUSD via PancakeSwap flash loan; (2) swapped 180M BUSD to BNB, causing massive price impact; (3) used BNB to add liquidity to BUNNY-BNB pool, inflating LP price; (4) called Bunny's mint() which read inflated LP price from PriceCalculator; (5) minted 6.97M BUNNY tokens at calculated reward rate; (6) sold BUNNY for WBNB; (7) repaid flash loan.",
    impact: "$45M",
    impactUSD: 45000000,
    contracts: [{ label: "PancakeBunny BUNNY Token", address: "0xC9849E6fdB743d08fAeE3E34dd2D1bc69EA11a51", url: "https://bscscan.com/address/0xc9849e6fdb743d08faee3e34dd2d1bc69ea11a51" }],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Borrowed 200M BUSD via PancakeSwap flash loan.", functionsCall: ["PancakeSwap.flashLoan(200M BUSD)"], pseudocode: "// Massive borrowing for price manipulation" },
      { id: "t2", phase: "Price Pump", description: "Swapped 180M BUSD to BNB, pumping BNB price significantly.", functionsCall: ["PancakeSwap.swap(180M BUSD → BNB)"], pseudocode: "// Created artificial BNB scarcity\n// Pumped price for LP manipulation" },
      { id: "t3", phase: "LP Injection", description: "Added BNB to BUNNY-BNB pool, inflating LP token price.", functionsCall: ["PancakeSwap.addLiquidity(BUNNY-BNB)"], pseudocode: "// Inflated LP token value\n// Used for reward calculation" },
      { id: "t4", phase: "Mint Exploit", description: "Called Bunny mint() which read inflated LP price from PriceCalculatorBSC.", functionsCall: ["Bunny.mint()"], pseudocode: "// PriceCalculatorBSC.getLpTokenPrice()\n// Returned inflated value\n// Minted 6.97M BUNNY from nothing" },
      { id: "t5", phase: "Dump", description: "Sold minted BUNNY tokens for WBNB.", functionsCall: ["PancakeSwap.sell(6.97M BUNNY)"], pseudocode: "// 114,631 WBNB obtained (~$45M)" },
      { id: "t6", phase: "Repay", description: "Repaid flash loan, kept profit.", functionsCall: ["PancakeSwap.repay(200M BUSD)"], pseudocode: "// ~$45M net profit\n// Forked projects also hit" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Flash loan exploit", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "PancakeSwap", detail: "$200M flash loan", x: 200, y: 100 },
        { id: "n3", type: "contract", label: "PriceCalculatorBSC", detail: "Wrong LP price", x: 400, y: 200 },
        { id: "n4", type: "pool", label: "BUNNY-BNB Pool", detail: "Inflated LP", x: 600, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$45M WBNB", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Flash loan", animated: true },
        { id: "e2", source: "n2", target: "n4", label: "Pump price" },
        { id: "e3", source: "n4", target: "n3", label: "Inflated price read" },
        { id: "e4", source: "n3", target: "n5", label: "Mint BUNNY", animated: true },
        { id: "e5", source: "n2", target: "n1", label: "Repay" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "PancakeSwap\n$200M", type: "pool" },
      { id: "b", label: "Price\nCalculator", type: "vault" },
      { id: "c", label: "BUNNY\nMinted", type: "pool" },
      { id: "d", label: "Attacker\n$45M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 200, label: "Flash loan" },
      { source: "b", target: "c", value: 45, label: "Mint exploit" },
      { source: "c", target: "d", value: 45, label: "Sell for profit" },
      { source: "d", target: "a", value: 200, label: "Repay" }
    ],
    mitigations: [
      { category: "Oracle Security", description: "Use TWAP oracles instead of spot prices. Don't trust single DEX prices for critical calculations." },
      { category: "Price Validation", description: "Add sanity checks on price inputs. Reject extreme deviations from expected ranges." },
      { category: "Rate Limiting", description: "Implement mint rate limits to prevent massive token creation in single transactions." }
    ],
    quiz: [{ question: "How did PancakeBunny's PriceCalculator fail?", options: ["Reentrancy", "Used spot LP price from manipulated DEX", "Key leak", "Overflow"], correct: 1, explanation: "It used PancakeSwap's getAmountsOut which reflected manipulated spot prices, allowing inflated reward calculations." }]
  },

  // Cashio (2022)
  {
    id: "cashio-2022",
    slug: "cashio-2022",
    title: "Cashio",
    subtitle: "Infinite Mint Bridge Exploit on Solana",
    year: 2022,
    chain: "Solana",
    type: ["Bridge", "Access Control"],
    shortDesc: "Missing validation allowed infinite minting of CASH stablecoin, draining $48M.",
    longDesc: "On March 23, 2022, Cashio, a Solana algorithmic stablecoin backed by USDT-USDC LP tokens, suffered an 'infinite mint glitch.' An attacker exploited missing validation code to mint unlimited CASH tokens without proper collateral. The protocol's TVL plummeted from $28.8M to near zero as the attacker minted and sold unbacked CASH. The hack was possible because the bridge contract didn't verify that minted CASH had corresponding collateral deposits.",
    technicalDesc: "Cashio's bridge/minting contract lacked proper validation of collateral backing for CASH minting. The attacker: (1) identified the missing validation in the mint function; (2) crafted transactions to mint CASH tokens without depositing equivalent USDT-USDC LP collateral; (3) repeated this to mint large amounts of unbacked CASH; (4) sold CASH on DEXs for other tokens; (5) bridged profits off Solana. The root cause was unaudited code with insufficient checks on the relationship between minted tokens and collateral.",
    impact: "$48M",
    impactUSD: 48000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Discovery", description: "Attacker identified missing validation in CASH minting function.", functionsCall: [], pseudocode: "// Found infinite mint vulnerability\n// No collateral check on mint()" },
      { id: "t2", phase: "Infinite Mint", description: "Minted unbacked CASH tokens without depositing LP collateral.", functionsCall: ["CashioBridge.mint(unlimited_CASH)"], pseudocode: "// Bypassed collateral requirement\n// Minted CASH from nothing" },
      { id: "t3", phase: "Sell", description: "Sold unbacked CASH on DEXs for other tokens.", functionsCall: ["DEX.sell(CASH)"], pseudocode: "// CASH price collapsed\n// Converted to other assets" },
      { id: "t4", phase: "Bridge", description: "Bridged profits off Solana to other chains.", functionsCall: ["Bridge.transfer(profits)"], pseudocode: "// Moved funds to evade tracking\n// TVL dropped from $28.8M to $579K" },
      { id: "t5", phase: "Collapse", description: "CASH stablecoin depegged to zero as unbacked supply flooded market.", functionsCall: [], pseudocode: "// Stablecoin collapsed\n// Protocol paused" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Infinite mint", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Cashio Bridge", detail: "No validation", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "CASH Token", detail: "Unbacked minted", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "DEX Pools", detail: "Sell pressure", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$48M drained", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Exploit", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Mint unbacked" },
        { id: "e3", source: "n3", target: "n4", label: "Sell" },
        { id: "e4", source: "n4", target: "n5", label: "Profit", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Cashio\nBridge", type: "vault" },
      { id: "b", label: "CASH\nMinted", type: "pool" },
      { id: "c", label: "DEX\nSell", type: "bridge" },
      { id: "d", label: "Attacker\n$48M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 48, label: "Infinite mint" },
      { source: "b", target: "c", value: 48, label: "Sell CASH" },
      { source: "c", target: "d", value: 48, label: "Extract" }
    ],
    mitigations: [
      { category: "Collateral Validation", description: "Always verify that minted tokens have corresponding 1:1 collateral backing." },
      { category: "Audit", description: "Conduct thorough audits before mainnet launch, especially for bridge/minting contracts." },
      { category: "Circuit Breakers", description: "Implement mint rate limits and automatic pause on unusual minting patterns." }
    ],
    quiz: [{ question: "What allowed Cashio's infinite mint?", options: ["Reentrancy", "Missing collateral validation", "Oracle bug", "Flash loan"], correct: 1, explanation: "The bridge contract didn't verify that minted CASH had corresponding USDT-USDC LP collateral deposits." }]
  },

  // Wintermute (2022)
  {
    id: "wintermute-2022",
    slug: "wintermute-2022",
    title: "Wintermute",
    subtitle: "Optimism Airdrop Wallet Misconfiguration",
    year: 2022,
    chain: "Optimism",
    type: ["Access Control"],
    shortDesc: "Deployed L1 multisig on L2, allowing attacker to steal 20M OP tokens worth $27.6M.",
    longDesc: "In June 2022, Wintermute, a crypto market maker, was supposed to receive 20M OP tokens from Optimism Foundation for liquidity provision. However, Wintermute deployed an Ethereum L1 multisig contract address on Optimism L2 instead of using a proper L2 multisig. An attacker noticed this, deployed the same contract on L2 first, and claimed the 20M OP tokens. The attacker later returned 17M OP tokens after negotiations.",
    technicalDesc: "The exploit was a wallet management mistake. Optimism sent 20M OP tokens to an address that Wintermute controlled on L1. Wintermute assumed this address would work the same on L2, but L1 multisig contracts don't function on L2 without proper deployment. The attacker: (1) monitored the transaction; (2) deployed their own version of the multisig contract on L2 at the same address; (3) claimed the 20M OP tokens when they arrived; (4) sold or transferred tokens. Wintermute took responsibility for the operational error.",
    impact: "$27.6M (20M OP tokens)",
    impactUSD: 27600000,
    contracts: [{ label: "Wintermute Exploiter Multisig (Optimism)", address: "0x4f3a120E72C76c22ae802D129F599BFDbc31cb81", url: "https://optimistic.etherscan.io/address/0x4f3a120e72c76c22ae802d129f599bfdbc31cb81" }],
    timeline: [
      { id: "t1", phase: "Setup", description: "Optimism planned to send 20M OP tokens to Wintermute for liquidity.", functionsCall: [], pseudocode: "// Airdrop for market maker services" },
      { id: "t2", phase: "Misconfiguration", description: "Wintermute used L1 multisig address instead of deploying proper L2 multisig.", functionsCall: [], pseudocode: "// Operational error\n// L1 contract doesn't work on L2" },
      { id: "t3", phase: "Attacker Action", description: "Attacker deployed same multisig contract on L2 at the target address.", functionsCall: ["Attacker.deploy(multisig_contract)"], pseudocode: "// Front-ran the address\n// Prepared to claim tokens" },
      { id: "t4", phase: "Token Claim", description: "20M OP tokens arrived and attacker claimed them.", functionsCall: ["OP.transfer(attacker_address)"], pseudocode: "// Attacker controlled the L2 address\n// Claimed entire airdrop" },
      { id: "t5", phase: "Negotiation", description: "Wintermute offered bounty; attacker returned 17M OP tokens.", functionsCall: ["Attacker.return(17M OP)"], pseudocode: "// 17M returned\n// 3M kept as 'bounty'\n// ~$27.6M total value" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Address front-run", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "L1 Multisig", detail: "Wrong network", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "L2 Contract", detail: "Attacker deployed", x: 250, y: 300 },
        { id: "n4", type: "pool", label: "20M OP Tokens", detail: "$27.6M", x: 450, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Claimed tokens", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n3", label: "Deploy on L2", animated: true },
        { id: "e2", source: "n2", target: "n4", label: "Sent to wrong addr" },
        { id: "e3", source: "n4", target: "n3", label: "Arrived at attacker", animated: true },
        { id: "e4", source: "n3", target: "n5", label: "Claimed" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Optimism\n20M OP", type: "pool" },
      { id: "b", label: "Wrong\nAddress", type: "vault" },
      { id: "c", label: "Attacker\nClaimed", type: "attacker" },
      { id: "d", label: "Returned\n17M OP", type: "pool" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 27.6, label: "Sent to wrong addr" },
      { source: "b", target: "c", value: 27.6, label: "Attacker claimed" },
      { source: "c", target: "d", value: 23.5, label: "17M returned" }
    ],
    mitigations: [
      { category: "Cross-Chain Deployment", description: "Always deploy proper contracts on each chain. Never assume L1 addresses work on L2." },
      { category: "Address Verification", description: "Verify contract deployment on target chain before sending significant funds." }
    ],
    quiz: [{ question: "What was Wintermute's mistake?", options: ["Reentrancy bug", "Used L1 multisig address on L2", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "They deployed an L1 multisig contract address on L2, which doesn't work, allowing an attacker to front-run the address." }]
  },

  // KyberSwap (2023)
  {
    id: "kyberswap-2023",
    slug: "kyberswap-2023",
    title: "KyberSwap",
    subtitle: "Precision Loss in Tick Calculation",
    year: 2023,
    chain: "Multi-chain",
    type: ["Math Bug", "Logic Error"],
    shortDesc: "Rounding error in tick calculation caused double liquidity counting, draining $48M across 6 chains.",
    longDesc: "On November 23, 2023, KyberSwap Elastic suffered a $48M exploit across 6 chains (Ethereum, Arbitrum, Optimism, Polygon, Avalanche, BNB). The root cause was a precision loss bug in the SwapMath contract's estimateIncrementalLiquidity function. Incorrect rounding direction in delta liquidity calculation caused tick calculation errors, allowing liquidity to be double-counted. Attackers manipulated pool prices to trigger the bug and drain funds.",
    technicalDesc: "The vulnerability was in SwapMath.computeSwapStep which called estimateIncrementalLiquidity. Line 188 intended to round up deltaL to round down nextSqrtP, but used mulDivFloor (rounds down) instead. This caused nextSqrtP to round up incorrectly. Attackers: (1) borrowed 2,000 WETH via Aave flash loan; (2) swapped to push current tick to location with no liquidity; (3) added/removed liquidity to control range; (4) manipulated tick so nextTick == currentTick; (5) swapped opposite direction to double-count liquidity; (6) drained pools with profitable swaps.",
    impact: "$48M",
    impactUSD: 48000000,
    contracts: [{ label: "KyberSwap Elastic Legacy Router", address: "0xC1e7dFE73E1598E3910EF4C7845B68A9Ab6F4c83", url: "https://etherscan.io/address/0xc1e7dfe73e1598e3910ef4c7845b68a9ab6f4c83" }],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Borrowed 2,000 WETH via Aave flash loan.", functionsCall: ["Aave.flashLoan(2000 WETH)"], pseudocode: "// Seed capital for manipulation" },
      { id: "t2", phase: "Price Push", description: "Swapped to push current tick outside liquidity zone.", functionsCall: ["KyberSwap.swap(WETH→frxETH)"], pseudocode: "// Moved price to empty tick\n// baseL = 0, reinvestL != 0" },
      { id: "t3", phase: "Liquidity Control", description: "Added then removed liquidity to control range precisely.", functionsCall: ["KyberSwap.addLiquidity()", "KyberSwap.removeLiquidity()"], pseudocode: "// Precise tick manipulation\n// Controlled total liquidity" },
      { id: "t4", phase: "Tick Manipulation", description: "Swapped small amount to make nextTick == currentTick.", functionsCall: ["KyberSwap.swap(small_amount)"], pseudocode: "// Triggered precision bug\n// Prepared for double-count" },
      { id: "t5", phase: "Double Count", description: "Swapped opposite direction - liquidity double-counted, making swap profitable.", functionsCall: ["KyberSwap.swap(reverse_direction)"], pseudocode: "// Bug: liquidity counted twice\n// Swap extracted more than input" },
      { id: "t6", phase: "Drain", description: "Repaid flash loan, kept ~$48M profit across all chains.", functionsCall: ["Aave.repay(2000 WETH)"], pseudocode: "// 6 chains attacked\n// $48M total drained" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Precision exploit", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Aave Flash Loan", detail: "2,000 WETH", x: 200, y: 100 },
        { id: "n3", type: "contract", label: "SwapMath", detail: "Rounding bug", x: 400, y: 200 },
        { id: "n4", type: "pool", label: "Kyber Pools", detail: "$48M drained", x: 600, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$48M profit", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Flash loan", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Manipulate tick" },
        { id: "e3", source: "n3", target: "n4", label: "Double-count liquidity", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Aave\n2K WETH", type: "pool" },
      { id: "b", label: "SwapMath\nBug", type: "vault" },
      { id: "c", label: "Kyber\nPools", type: "pool" },
      { id: "d", label: "Attacker\n$48M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 2, label: "Flash loan" },
      { source: "b", target: "c", value: 48, label: "Exploit" },
      { source: "c", target: "d", value: 48, label: "Profit" }
    ],
    mitigations: [
      { category: "Rounding Direction", description: "Carefully verify rounding direction in all math operations. Use mulDivCeiling when ceiling is required." },
      { category: "Tick Validation", description: "Add bounds checks on tick calculations to prevent edge case manipulation." },
      { category: "Liquidity Accounting", description: "Ensure liquidity is never double-counted in swap calculations." }
    ],
    quiz: [{ question: "What caused KyberSwap's precision loss?", options: ["Reentrancy", "Wrong rounding direction in delta liquidity", "Oracle bug", "Key leak"], correct: 1, explanation: "estimateIncrementalLiquidity used mulDivFloor instead of mulDivCeiling, causing incorrect tick calculations and double-counted liquidity." }]
  },

  // Alpha Homora (2021)
  {
    id: "alpha-homora-2021",
    slug: "alpha-homora-2021",
    title: "Alpha Homora",
    subtitle: "Flash Loan Attack on Iron Bank",
    year: 2021,
    chain: "Ethereum",
    type: ["Flash Loan", "Logic Error"],
    shortDesc: "Flash loan attacker used counterfeit 'spell' contract to manipulate Iron Bank lending records, draining $37.5M.",
    longDesc: "On February 13, 2021, Alpha Finance's leveraged lending protocol Alpha Homora V2 was exploited for $37.5M via a sophisticated flash loan attack. The attacker deployed a counterfeit 'spell' contract to manipulate Alpha's Iron Bank lending records, inflating their borrowing limits. The attack also affected Cream Finance which shared similar code. The attacker used multiple flash loans to drain WETH, USDC, and other assets.",
    technicalDesc: "The exploit targeted Alpha Homora V2's integration with Iron Bank (a lending protocol). The attacker: (1) deployed a malicious 'spell' contract that mimicked the real spell contract; (2) used flash loans from Aave/dYdX to get initial capital; (3) deposited collateral into Alpha Homora; (4) manipulated the Iron Bank records through the counterfeit spell to show inflated collateral; (5) borrowed maximally against the inflated position; (6) repaid flash loans and kept the difference.",
    impact: "$37.5M",
    impactUSD: 37500000,
    contracts: [{ label: "Alpha Homora V2 Exploiter", address: "0x905315602Ed9a854e325F692FF82F58799BEAB57", url: "https://etherscan.io/address/0x905315602ed9a854e325f692ff82f58799beab57" }],
    timeline: [
      { id: "t1", phase: "Setup", description: "Attacker deployed counterfeit 'spell' contract mimicking real implementation.", functionsCall: ["deploy(fake_spell_contract)"], pseudocode: "// Malicious contract to manipulate Iron Bank" },
      { id: "t2", phase: "Flash Loan", description: "Borrowed assets via Aave/dYdX flash loans for initial capital.", functionsCall: ["Aave.flashLoan()", "dYdX.flashLoan()"], pseudocode: "// Multi-source flash loans\n// Seed capital for exploit" },
      { id: "t3", phase: "Deposit", description: "Deposited collateral into Alpha Homora V2.", functionsCall: ["AlphaHomora.deposit(collateral)"], pseudocode: "// Opened leveraged position" },
      { id: "t4", phase: "Manipulation", description: "Used counterfeit spell to inflate Iron Bank lending records.", functionsCall: ["IronBank.manipulate(fake_spell)"], pseudocode: "// Showed inflated collateral value\n// Borrowing limit artificially increased" },
      { id: "t5", phase: "Borrow", description: "Borrowed maximum assets against inflated position.", functionsCall: ["AlphaHomora.borrow(max_amount)"], pseudocode: "// Drained WETH, USDC, others" },
      { id: "t6", phase: "Exit", description: "Repaid flash loans, kept $37.5M profit.", functionsCall: ["Aave.repay()", "dYdX.repay()"], pseudocode: "// $37.5M net extracted\n// Cream Finance also affected" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Flash loan exploit", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Fake Spell", detail: "Counterfeit", x: 200, y: 100 },
        { id: "n3", type: "pool", label: "Flash Loans", detail: "Aave/dYdX", x: 200, y: 300 },
        { id: "n4", type: "contract", label: "Alpha Homora", detail: "V2 vulnerable", x: 400, y: 200 },
        { id: "n5", type: "pool", label: "Iron Bank", detail: "Records manipulated", x: 600, y: 200 },
        { id: "n6", type: "result", label: "Attacker", detail: "$37.5M", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Deploy fake", animated: true },
        { id: "e2", source: "n3", target: "n1", label: "Flash loan" },
        { id: "e3", source: "n1", target: "n4", label: "Deposit" },
        { id: "e4", source: "n4", target: "n5", label: "Manipulate", animated: true },
        { id: "e5", source: "n5", target: "n6", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Flash Loans\nCapital", type: "pool" },
      { id: "b", label: "Alpha\nHomora", type: "vault" },
      { id: "c", label: "Iron Bank\nManipulated", type: "pool" },
      { id: "d", label: "Attacker\n$37.5M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 37.5, label: "Flash loan" },
      { source: "b", target: "c", value: 37.5, label: "Deposit" },
      { source: "c", target: "d", value: 37.5, label: "Borrow & drain" }
    ],
    mitigations: [
      { category: "Contract Verification", description: "Verify all external contract addresses and interfaces. Never trust unverified contracts." },
      { category: "Integration Security", description: "Audit all third-party protocol integrations, especially lending/borrowing dependencies." },
      { category: "Borrow Limits", description: "Implement conservative borrowing limits with circuit breakers for unusual activity." }
    ],
    quiz: [{ question: "How did Alpha Homora get exploited?", options: ["Reentrancy", "Counterfeit spell contract", "Oracle bug", "Key leak"], correct: 1, explanation: "Attacker deployed a fake 'spell' contract to manipulate Iron Bank lending records, inflating borrowing limits." }]
  },

  // Vee Finance (2021)
  {
    id: "vee-finance-2021",
    slug: "vee-finance-2021",
    title: "Vee Finance",
    subtitle: "Reentrancy on Avalanche",
    year: 2021,
    chain: "Avalanche",
    type: ["Reentrancy"],
    shortDesc: "Reentrancy in lending contract allowed attacker to drain 8,804 ETH and 214 BTC ($34M).",
    longDesc: "On September 21, 2021, Vee Finance, a lending protocol on Avalanche, suffered a $34M exploit. The attacker exploited a reentrancy vulnerability in the protocol's smart contracts. By re-entering functions before state updates completed, the attacker drained 8,804.7 ETH (~$26.2M) and 213.93 BTC (~$9M). This was the second major Avalanche DeFi hack in a week, following Zabu Finance's $3.2M exploit.",
    technicalDesc: "The vulnerability was a classic reentrancy bug in Vee's lending contract. The attacker: (1) deposited collateral as normal; (2) borrowed against the collateral; (3) used a malicious contract to re-enter the borrow function before state was updated; (4) the reentrancy allowed multiple borrows against the same collateral; (5) repeated this to drain all available liquidity; (6) bridged funds off Avalanche. The protocol lacked ReentrancyGuard on critical functions.",
    impact: "$34M (8,804 ETH + 214 BTC)",
    impactUSD: 34000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Deposit", description: "Attacker deposited collateral into Vee Finance.", functionsCall: ["Vee.deposit(collateral)"], pseudocode: "// Normal deposit to open position" },
      { id: "t2", phase: "Initial Borrow", description: "Borrowed assets against collateral.", functionsCall: ["Vee.borrow(assets)"], pseudocode: "// First borrow transaction" },
      { id: "t3", phase: "Reentrancy", description: "Malicious contract re-entered borrow function before state update.", functionsCall: ["MaliciousContract.reenter(borrow)"], pseudocode: "// Reentrancy window opened\n// State not yet updated" },
      { id: "t4", phase: "Multiple Borrows", description: "Re-entered multiple times to borrow against same collateral.", functionsCall: ["Vee.borrow(repeat)"], pseudocode: "// Collateral not decremented\n// Multiple borrows succeeded" },
      { id: "t5", phase: "Drain", description: "Drained 8,804 ETH and 214 BTC from protocol.", functionsCall: ["Vee.withdraw(all)"], pseudocode: "// $26.2M ETH + $9M BTC\n// All liquidity drained" },
      { id: "t6", phase: "Bridge", description: "Bridged profits off Avalanche to other chains.", functionsCall: ["Bridge.transfer(profits)"], pseudocode: "// Cross-chain laundering\n// Protocol paused" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Reentrancy", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Vee Lending", detail: "No ReentrancyGuard", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Collateral", detail: "Deposited", x: 450, y: 100 },
        { id: "n4", type: "pool", label: "Liquidity Pool", detail: "ETH + BTC", x: 450, y: 300 },
        { id: "n5", type: "result", label: "Attacker", detail: "$34M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Deposit", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Lock collateral" },
        { id: "e3", source: "n3", target: "n2", label: "Reenter", animated: true },
        { id: "e4", source: "n2", target: "n4", label: "Drain", animated: true },
        { id: "e5", source: "n4", target: "n5", label: "Extract" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Vee\nLending", type: "vault" },
      { id: "b", label: "Collateral\nDeposited", type: "pool" },
      { id: "c", label: "Reentrancy\nBypass", type: "bridge" },
      { id: "d", label: "Attacker\n$34M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 34, label: "Deposit" },
      { source: "b", target: "c", value: 34, label: "Reenter" },
      { source: "c", target: "d", value: 34, label: "Drain" }
    ],
    mitigations: [
      { category: "ReentrancyGuard", description: "Use OpenZeppelin ReentrancyGuard on all state-changing functions." },
      { category: "Checks-Effects-Interactions", description: "Update all state variables before making external calls." },
      { category: "Audit", description: "Conduct thorough audits, especially for lending protocols on newer chains." }
    ],
    quiz: [{ question: "What vulnerability did Vee Finance have?", options: ["Oracle bug", "Reentrancy", "Access control", "Integer overflow"], correct: 1, explanation: "Lending contract lacked ReentrancyGuard, allowing attacker to borrow multiple times against same collateral." }]
  },

  // Meerkat Finance (2021)
  {
    id: "meerkat-finance-2021",
    slug: "meerkat-finance-2021",
    title: "Meerkat Finance",
    subtitle: "Rug Pull / Developer Exit Scam",
    year: 2021,
    chain: "BNB Chain",
    type: ["Access Control"],
    shortDesc: "Developer drained 73,635 WBNB and $14M BUSD ($32M total) one day after launch.",
    longDesc: "On March 4, 2021, one day after launch, Meerkat Finance, a BSC yield vault project that forked Yearn.Finance, suffered a $32M exit scam. The developer called a method to transfer out 73,635 WBNB and $14M BUSD from the vaults. The dev initially claimed it was a 'test' and would return funds, but this was widely viewed as a rug pull. It remains one of BSC's largest frauds.",
    technicalDesc: "This was a malicious developer exit scam, not a smart contract vulnerability. The developer: (1) deployed Meerkat Finance as a Yearn fork on BSC; (2) attracted users with yield farming promises; (3) users deposited BNB and BUSD into vaults; (4) one day later, the dev used admin privileges to call a withdraw function (0x70fcb0a7) on the WBNB vault; (5) transferred 73,635 WBNB and $14M BUSD to personal address; (6) initially claimed it was a 'test' but funds were never returned.",
    impact: "$32M (73,635 WBNB + $14M BUSD)",
    impactUSD: 32000000,
    contracts: [{ label: "Meerkat WBNB Vault (Compromised)", address: "0x9D3a4c3acEe56dCe2392fB75DD274a249AEe7D57", url: "https://bscscan.com/address/0x9d3a4c3acee56dce2392fb75dd274a249aee7d57" }],
    timeline: [
      { id: "t1", phase: "Launch", description: "Meerkat Finance launched as Yearn fork on BSC.", functionsCall: ["deploy(meerkat)"], pseudocode: "// Yield farming protocol\n// Attracted users with high APY" },
      { id: "t2", phase: "Deposits", description: "Users deposited BNB and BUSD into vaults.", functionsCall: ["Vault.deposit(BNB)", "Vault.deposit(BUSD)"], pseudocode: "// TVL grew rapidly\n// One day of operation" },
      { id: "t3", phase: "Rug Pull", description: "Dev called method 0x70fcb0a7 to drain WBNB vault.", functionsCall: ["Vault.transferOut(73,635 WBNB)"], pseudocode: "// Admin privilege abuse\n// Direct vault drain" },
      { id: "t4", phase: "Second Drain", description: "Dev also drained $14M BUSD from vaults.", functionsCall: ["Vault.transferOut(14M BUSD)"], pseudocode: "// Complete protocol drain\n// $32M total stolen" },
      { id: "t5", phase: "Cover Story", description: "Dev claimed it was a 'test' and would return funds.", functionsCall: [], pseudocode: "// 'Test' excuse\n// Community skeptical" },
      { id: "t6", phase: "Exit", description: "Funds never returned; confirmed as rug pull.", functionsCall: [], pseudocode: "// One of BSC's largest frauds\n// Dev vanished with funds" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Developer", detail: "Malicious admin", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "User Deposits", detail: "BNB + BUSD", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "Meerkat Vaults", detail: "Admin controlled", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Dev Wallet", detail: "$32M stolen", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n2", target: "n3", label: "User deposits" },
        { id: "e2", source: "n1", target: "n3", label: "Admin drain", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Transfer", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "User\nFunds", type: "pool" },
      { id: "b", label: "Meerkat\nVaults", type: "vault" },
      { id: "c", label: "Admin\nDrain", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 32, label: "Deposits" },
      { source: "b", target: "c", value: 32, label: "Rug pull" }
    ],
    mitigations: [
      { category: "Timelock", description: "Implement timelocks on admin functions to prevent sudden drains." },
      { category: "Multi-sig", description: "Require multi-signature approval for large fund transfers." },
      { category: "DAO Governance", description: "Transfer admin control to DAO to prevent single-point failures." }
    ],
    quiz: [{ question: "What was Meerkat Finance's exploit?", options: ["Smart contract bug", "Developer rug pull", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "The developer used admin privileges to drain all vault funds one day after launch - a classic rug pull." }]
  },

  // MonoX (2021)
  {
    id: "monox-2021",
    slug: "monox-2021",
    title: "MonoX",
    subtitle: "Smart Contract Bug in Price Update",
    year: 2021,
    chain: "Ethereum",
    type: ["Logic Error", "Oracle Manipulation"],
    shortDesc: "Smart contract bug caused incorrect price updates during token swaps, draining $31.4M.",
    longDesc: "On November 30, 2021, MonoX Finance, a DeFi protocol allowing single-sided token deposits, suffered a $31.4M exploit. The vulnerability was a smart contract bug that led to incorrect price updates when conducting token swaps. The attacker drained $18M in WETH and $10.5M in MATIC, among other tokens. The bug was in how the protocol updated internal token prices during swaps.",
    technicalDesc: "The vulnerability was in MonoX's price update logic during swaps. The protocol used a virtual balance system to track token prices. The attacker: (1) identified that price updates didn't correctly account for swap amounts; (2) performed swaps that manipulated the internal price oracle; (3) used the manipulated prices to borrow at favorable rates; (4) repeated this to drain the protocol; (5) the bug allowed price manipulation without proper checks on the resulting prices.",
    impact: "$31.4M ($18M WETH + $10.5M MATIC)",
    impactUSD: 31400000,
    contracts: [{ label: "MonoX Pool", address: "0xE50CE2E7def2A10c258C0BdAf8653ed99FaC6291", url: "https://etherscan.io/address/0xe50ce2e7def2a10c258c0bdaf8653ed99fac6291" }],
    timeline: [
      { id: "t1", phase: "Discovery", description: "Attacker identified price update bug in swap logic.", functionsCall: [], pseudocode: "// Price oracle vulnerable\n// Incorrect update calculation" },
      { id: "t2", phase: "Manipulation", description: "Performed swaps to manipulate internal token prices.", functionsCall: ["MonoX.swap(manipulate)"], pseudocode: "// Swaps affected virtual balances\n// Internal prices distorted" },
      { id: "t3", phase: "Borrow", description: "Used manipulated prices to borrow at favorable rates.", functionsCall: ["MonoX.borrow(at_manipulated_price)"], pseudocode: "// Borrowed against distorted prices\n// Extracted more value than deposited" },
      { id: "t4", phase: "Drain WETH", description: "Drained $18M in WETH from protocol.", functionsCall: ["MonoX.withdraw(WETH)"], pseudocode: "// Largest asset drained" },
      { id: "t5", phase: "Drain MATIC", description: "Drained $10.5M in MATIC and other tokens.", functionsCall: ["MonoX.withdraw(MATIC)"], pseudocode: "// Additional assets extracted" },
      { id: "t6", phase: "Exit", description: "Attacker exited with $31.4M total.", functionsCall: [], pseudocode: "// Protocol paused\n// Bug identified and fixed" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Price manipulation", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "MonoX Swap", detail: "Price bug", x: 250, y: 200 },
        { id: "n3", type: "oracle", label: "Price Oracle", detail: "Manipulated", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "Protocol Funds", detail: "$31.4M", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$31.4M", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Swap", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Corrupt prices" },
        { id: "e3", source: "n3", target: "n4", label: "Borrow cheap", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "MonoX\nSwap", type: "vault" },
      { id: "b", label: "Price\nOracle", type: "pool" },
      { id: "c", label: "Protocol\nFunds", type: "pool" },
      { id: "d", label: "Attacker\n$31.4M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 31.4, label: "Manipulate" },
      { source: "b", target: "c", value: 31.4, label: "Borrow" },
      { source: "c", target: "d", value: 31.4, label: "Extract" }
    ],
    mitigations: [
      { category: "Price Validation", description: "Validate all price updates against external oracles. Reject extreme deviations." },
      { category: "Swap Limits", description: "Implement limits on swap impact to prevent oracle manipulation." },
      { category: "Math Verification", description: "Formally verify all price calculation logic, especially virtual balance systems." }
    ],
    quiz: [{ question: "What caused MonoX's exploit?", options: ["Reentrancy", "Incorrect price update in swaps", "Key leak", "Flash loan"], correct: 1, explanation: "Smart contract bug caused incorrect price updates during token swaps, allowing manipulation of internal oracle." }]
  },

  // Spartan Protocol (2021)
  {
    id: "spartan-2021",
    slug: "spartan-2021",
    title: "Spartan Protocol",
    subtitle: "Flash Loan Oracle Manipulation",
    year: 2021,
    chain: "BNB Chain",
    type: ["Flash Loan", "Oracle Manipulation"],
    shortDesc: "Flash loan attacker manipulated synthetic asset prices to drain $30.5M.",
    longDesc: "In May 2021, Spartan Protocol on BSC suffered a $30.5M exploit via flash loan oracle manipulation. The protocol allowed users to mint synthetic assets. The attacker used flash loans to manipulate the prices of these synthetic assets, then used the inflated prices as collateral to borrow real assets. The exploit targeted the protocol's reliance on its own AMM for price discovery.",
    technicalDesc: "The vulnerability was in Spartan's use of its own AMM as the price oracle for synthetic assets. The attacker: (1) borrowed large amounts via flash loans; (2) used the capital to manipulate Spartan's AMM prices; (3) minted synthetic assets at manipulated prices; (4) used the synthetic assets as collateral to borrow real assets; (5) repaid flash loans with profit. The protocol lacked external price feeds or TWAP oracles.",
    impact: "$30.5M",
    impactUSD: 30500000,
    contracts: [{ label: "Spartan Protocol Hacker", address: "0x3b6E77722E2BBE97C1cFa337b42C0939Aeb83671", url: "https://bscscan.com/address/0x3b6e77722e2bbe97c1cfa337b42c0939aeb83671" }],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Borrowed large amounts via BSC flash loans.", functionsCall: ["PancakeSwap.flashLoan()"], pseudocode: "// Capital for price manipulation" },
      { id: "t2", phase: "Price Manipulation", description: "Used capital to manipulate Spartan AMM prices.", functionsCall: ["Spartan.swap(manipulate_prices)"], pseudocode: "// Moved AMM prices\n// Synthetic asset prices inflated" },
      { id: "t3", phase: "Mint Synthetic", description: "Minted synthetic assets at manipulated prices.", functionsCall: ["Spartan.mint(synthetic)"], pseudocode: "// Minted at inflated values\n// Used as collateral" },
      { id: "t4", phase: "Borrow Real", description: "Used synthetic assets as collateral to borrow real assets.", functionsCall: ["Spartan.borrow(real_assets)"], pseudocode: "// Borrowed against inflated collateral\n// Drained real value" },
      { id: "t5", phase: "Repay", description: "Repaid flash loans, kept $30.5M profit.", functionsCall: ["PancakeSwap.repay()"], pseudocode: "// Net profit extracted\n// Protocol drained" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Oracle manipulation", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Flash Loan", detail: "BSC", x: 200, y: 100 },
        { id: "n3", type: "contract", label: "Spartan AMM", detail: "Price oracle", x: 400, y: 200 },
        { id: "n4", type: "pool", label: "Synthetic Assets", detail: "Inflated", x: 600, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$30.5M", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "Flash loan", animated: true },
        { id: "e2", source: "n1", target: "n3", label: "Manipulate" },
        { id: "e3", source: "n3", target: "n4", label: "Inflate prices", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Borrow & drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Flash Loan\nCapital", type: "pool" },
      { id: "b", label: "Spartan\nAMM", type: "vault" },
      { id: "c", label: "Synthetic\nAssets", type: "pool" },
      { id: "d", label: "Attacker\n$30.5M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 30.5, label: "Flash loan" },
      { source: "b", target: "c", value: 30.5, label: "Manipulate" },
      { source: "c", target: "d", value: 30.5, label: "Drain" }
    ],
    mitigations: [
      { category: "External Oracles", description: "Use external price feeds (Chainlink, Band) instead of internal AMM prices for critical operations." },
      { category: "TWAP", description: "Implement Time-Weighted Average Price oracles to resist manipulation." },
      { category: "Collateral Limits", description: "Limit synthetic asset minting and borrowing against volatile collateral." }
    ],
    quiz: [{ question: "What was Spartan Protocol's vulnerability?", options: ["Reentrancy", "Internal AMM as oracle", "Key leak", "Integer overflow"], correct: 1, explanation: "Protocol used its own AMM as price oracle, which could be manipulated via flash loans." }]
  },

  // Grim Finance (2021)
  {
    id: "grim-finance-2021",
    slug: "grim-finance-2021",
    title: "Grim Finance",
    subtitle: "Reentrancy on Fantom",
    year: 2021,
    chain: "Fantom",
    type: ["Reentrancy"],
    shortDesc: "Reentrancy in vault contract allowed attacker to drain $30M from Fantom DeFi protocol.",
    longDesc: "In December 2021, Grim Finance, a yield optimizer on Fantom, suffered a $30M exploit via reentrancy. The attacker exploited a reentrancy vulnerability in the protocol's vault contract. By re-entering functions before state updates, the attacker drained multiple vaults. This was one of several reentrancy attacks that highlighted the importance of proper state update ordering.",
    technicalDesc: "The vulnerability was a reentrancy bug in Grim's vault withdraw function. The attacker: (1) deposited collateral into Grim vaults; (2) initiated a withdraw; (3) used a malicious contract to re-enter the withdraw function before state was updated; (4) the reentrancy allowed multiple withdrawals against the same deposit; (5) repeated this across multiple vaults; (6) drained $30M in total. The contract lacked ReentrancyGuard.",
    impact: "$30M",
    impactUSD: 30000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Deposit", description: "Attacker deposited collateral into Grim vaults.", functionsCall: ["Grim.deposit(collateral)"], pseudocode: "// Opened positions in multiple vaults" },
      { id: "t2", phase: "Withdraw", description: "Initiated withdraw from vault.", functionsCall: ["Grim.withdraw()"], pseudocode: "// First withdraw request" },
      { id: "t3", phase: "Reentrancy", description: "Malicious contract re-entered before state update.", functionsCall: ["MaliciousContract.reenter(withdraw)"], pseudocode: "// State not updated\n// Reentrancy window open" },
      { id: "t4", phase: "Multiple Withdraws", description: "Re-entered multiple times to withdraw same deposit repeatedly.", functionsCall: ["Grim.withdraw(repeat)"], pseudocode: "// Balance not decremented\n// Multiple withdrawals succeeded" },
      { id: "t5", phase: "Cross-Vault", description: "Repeated exploit across multiple vaults.", functionsCall: ["Grim.exploit(other_vaults)"], pseudocode: "// $30M total drained\n// Multiple vaults affected" },
      { id: "t6", phase: "Exit", description: "Attacker bridged funds off Fantom.", functionsCall: ["Bridge.transfer(profits)"], pseudocode: "// Protocol paused\n// ReentrancyGuard added" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Reentrancy", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Grim Vaults", detail: "No guard", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "User Deposits", detail: "Multiple vaults", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$30M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Deposit", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Reenter", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Grim\nVaults", type: "vault" },
      { id: "b", label: "Reentrancy\nBypass", type: "bridge" },
      { id: "c", label: "Attacker\n$30M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 30, label: "Reenter" },
      { source: "b", target: "c", value: 30, label: "Drain" }
    ],
    mitigations: [
      { category: "ReentrancyGuard", description: "Use OpenZeppelin ReentrancyGuard on all state-changing functions." },
      { category: "State Update Order", description: "Update all state before external calls (Checks-Effects-Interactions)." },
      { category: "Audit", description: "Audit protocols on newer chains thoroughly, especially vault/lending contracts." }
    ],
    quiz: [{ question: "What vulnerability did Grim Finance have?", options: ["Oracle bug", "Reentrancy", "Access control", "Integer overflow"], correct: 1, explanation: "Vault contract lacked ReentrancyGuard, allowing multiple withdrawals against same deposit." }]
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

  // Pickle Finance (2020)
  {
    id: "pickle-finance-2020",
    slug: "pickle-finance-2020",
    title: "Pickle Finance",
    subtitle: "Design Bugs in Yield Aggregator",
    year: 2020,
    chain: "Ethereum",
    type: ["Logic Error", "Flash Loan"],
    shortDesc: "Design flaws in jar contract allowed $19.7M drain via DAI pJar manipulation.",
    longDesc: "On November 21, 2020, Pickle Finance, a yield aggregator on Ethereum, suffered a $19.7M exploit. The attacker stole exactly 19.76M DAI from the pDAI PickleJar liquidity pool. The hack was caused by several design issues within the Pickle contract. By combining these design flaws, the attacker was able to manipulate the pickle price and drain the pJar.",
    technicalDesc: "The vulnerability was in Pickle's jar design which allowed manipulation of the PICKLE token price. The attacker: (1) used flash loans to get DAI; (2) deposited DAI into pJar; (3) manipulated the PICKLE/DAI price via swaps; (4) used the inflated PICKLE as collateral to borrow more DAI; (5) withdrew and repaid flash loans. The design flaws included lack of proper price oracles.",
    impact: "$19.7M (19.76M DAI)",
    impactUSD: 19700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Borrowed DAI via flash loans for initial capital.", functionsCall: ["dYdX.flashLoan(DAI)"], pseudocode: "// Seed capital for manipulation" },
      { id: "t2", phase: "Deposit", description: "Deposited DAI into pDAI PickleJar.", functionsCall: ["pJar.deposit(DAI)"], pseudocode: "// Received pDAI tokens\n// Opened position" },
      { id: "t3", phase: "Price Manipulation", description: "Manipulated PICKLE/DAI price via DEX swaps.", functionsCall: ["Uniswap.swap(manipulate)"], pseudocode: "// Inflated PICKLE price\n// Used as collateral" },
      { id: "t4", phase: "Borrow", description: "Used inflated PICKLE as collateral to borrow more DAI.", functionsCall: ["Pickle.borrow(DAI)"], pseudocode: "// Borrowed against inflated value\n// Drained 19.76M DAI" },
      { id: "t5", phase: "Withdraw", description: "Withdrew from pJar and repaid flash loans.", functionsCall: ["pJar.withdraw()", "dYdX.repay()"], pseudocode: "// Kept 19.76M DAI profit\n// Protocol drained" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Price manipulation", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Flash Loan", detail: "DAI", x: 200, y: 100 },
        { id: "n3", type: "contract", label: "pJar", detail: "Design flaw", x: 400, y: 200 },
        { id: "n4", type: "oracle", label: "PICKLE Price", detail: "Manipulated", x: 600, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$19.7M", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "Flash loan", animated: true },
        { id: "e2", source: "n1", target: "n3", label: "Deposit" },
        { id: "e3", source: "n3", target: "n4", label: "Manipulate", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Borrow" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Flash Loan\nDAI", type: "pool" },
      { id: "b", label: "pJar\nDesign Flaw", type: "vault" },
      { id: "c", label: "PICKLE\nManipulated", type: "pool" },
      { id: "d", label: "Attacker\n$19.7M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 19.7, label: "Flash loan" },
      { source: "b", target: "c", value: 19.7, label: "Manipulate" },
      { source: "c", target: "d", value: 19.7, label: "Drain" }
    ],
    mitigations: [
      { category: "External Oracles", description: "Use external price feeds instead of internal DEX prices for critical operations." },
      { category: "TWAP", description: "Implement Time-Weighted Average Price oracles to resist manipulation." },
      { category: "Audit", description: "Audit yield aggregator designs thoroughly, especially jar mechanisms." }
    ],
    quiz: [{ question: "What was Pickle Finance's vulnerability?", options: ["Reentrancy", "Design flaws in jar mechanism", "Key leak", "Integer overflow"], correct: 1, explanation: "Design issues in the jar contract allowed manipulation of PICKLE token price via DEX swaps." }]
  },

  // Ankr & Helio (2022)
  {
    id: "ankr-helio-2022",
    slug: "ankr-helio-2022",
    title: "Ankr & Helio",
    subtitle: "Key Compromise + Oracle Manipulation",
    year: 2022,
    chain: "BNB Chain",
    type: ["Access Control", "Oracle Manipulation"],
    shortDesc: "Compromised Ankr deployment key allowed malicious contract, enabling $15M Helio oracle exploit.",
    longDesc: "In December 2022, connected attacks on Ankr (infrastructure provider) and Helio Protocol (stablecoin issuer) totaled $20M. The Ankr exploit was caused by a compromised private key - since Ankr's update process used a single key, the attacker deployed a malicious contract that minted 6 quadrillion aBNBc tokens, crashing the price. A second attacker then bought the crashed aBNBc cheap and used it to exploit Helio's oracle for $15M.",
    technicalDesc: "This was a two-stage attack. Stage 1 (Ankr): (1) attacker compromised Ankr's single deployment key; (2) deployed malicious contract; (3) minted 6 quadrillion aBNBc tokens; (4) crashed aBNBc price from ~$300 to near zero. Stage 2 (Helio): (1) second attacker bought 183,885 aBNBc for 10 BNB (~$2,900); (2) deposited into Helio Money to receive 191,130 hBNB; (3) used crashed aBNBc as collateral to borrow HAY stablecoin; (4) oracle didn't reflect crashed price; (5) drained $15M.",
    impact: "$24M (combined Ankr + Helio)",
    impactUSD: 24000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Key Compromise", description: "Attacker compromised Ankr's single deployment key.", functionsCall: [], pseudocode: "// Single point of failure\n// Private key exposed" },
      { id: "t2", phase: "Malicious Deploy", description: "Deployed malicious Ankr contract.", functionsCall: ["deploy(malicious_contract)"], pseudocode: "// Unauthorized deployment\n// Key gave full control" },
      { id: "t3", phase: "Infinite Mint", description: "Minted 6 quadrillion aBNBc tokens, crashing price.", functionsCall: ["aBNBc.mint(6 quadrillion)"], pseudocode: "// Price crashed from ~$300\n// Near zero value" },
      { id: "t4", phase: "Cheap Purchase", description: "Second attacker bought 183,885 aBNBc for 10 BNB ($2,900).", functionsCall: ["DEX.buy(aBNBc)"], pseudocode: "// Bought crashed tokens\n// Should have been worth ~$55M" },
      { id: "t5", phase: "Helio Exploit", description: "Deposited aBNBc into Helio, borrowed HAY at stale oracle price.", functionsCall: ["Helio.deposit(aBNBc)", "Helio.borrow(HAY)"], pseudocode: "// Oracle didn't update\n// Borrowed $15M against $2,900 collateral" },
      { id: "t6", phase: "Profit", description: "Drained $15M from Helio; Ankr lost ~$5M in aBNBc value.", functionsCall: [], pseudocode: "// $20M total combined loss\n// Multi-sig would have prevented" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker 1", detail: "Key compromise", x: 50, y: 100 },
        { id: "n2", type: "attacker", label: "Attacker 2", detail: "Oracle exploit", x: 50, y: 300 },
        { id: "n3", type: "contract", label: "Ankr Key", detail: "Compromised", x: 250, y: 200 },
        { id: "n4", type: "pool", label: "aBNBc", detail: "Price crashed", x: 450, y: 200 },
        { id: "n5", type: "contract", label: "Helio Oracle", detail: "Stale price", x: 650, y: 200 },
        { id: "n6", type: "result", label: "Attackers", detail: "$20M total", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n3", label: "Compromise key", animated: true },
        { id: "e2", source: "n3", target: "n4", label: "Mint & crash", animated: true },
        { id: "e3", source: "n2", target: "n4", label: "Buy cheap" },
        { id: "e4", source: "n4", target: "n5", label: "Deposit" },
        { id: "e5", source: "n5", target: "n6", label: "Borrow", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Ankr\nKey", type: "vault" },
      { id: "b", label: "aBNBc\nCrashed", type: "pool" },
      { id: "c", label: "Helio\nOracle", type: "pool" },
      { id: "d", label: "Attackers\n$20M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 20, label: "Compromise" },
      { source: "b", target: "c", value: 15, label: "Oracle exploit" },
      { source: "c", target: "d", value: 20, label: "Drain" }
    ],
    mitigations: [
      { category: "Multi-sig", description: "Use multi-signature wallets for all critical operations. Never rely on single private keys." },
      { category: "Oracle Updates", description: "Implement frequent oracle price updates with deviation checks. Pause operations on extreme price movements." },
      { category: "Rate Limiting", description: "Implement mint rate limits to prevent infinite token creation." }
    ],
    quiz: [{ question: "What enabled the Ankr & Helio attacks?", options: ["Reentrancy", "Single key compromise + stale oracle", "Flash loan", "Integer overflow"], correct: 1, explanation: "Ankr's single deployment key was compromised, allowing malicious aBNBc minting. Helio's oracle didn't update to the crashed price, enabling exploitation." }]
  },

  // Stake (2023)
  {
    id: "stake-2023",
    slug: "stake-2023",
    title: "Stake.com",
    subtitle: "Hot Wallet Key Compromise",
    year: 2023,
    chain: "Multi-chain",
    type: ["Access Control"],
    shortDesc: "Compromised hot wallet private keys allowed $41.6M drain across Ethereum, BNB, and Polygon.",
    longDesc: "On September 4, 2023, Stake.com, a crypto betting platform, suffered a $41.6M exploit across Ethereum, BNB Chain, and Polygon. The attack was caused by compromised private keys for Stake's hot wallets. Attackers gained unauthorized access and drained funds from multiple chains. The incident was attributed to potential North Korean-affiliated hackers (Lazarus Group).",
    technicalDesc: "This was a private key compromise, not a smart contract vulnerability. The attacker: (1) obtained Stake's hot wallet private keys through unknown means (possibly phishing or infrastructure breach); (2) used the keys to sign transactions across multiple chains; (3) drained ETH, BNB, MATIC, and other tokens; (4) moved funds through mixers and bridges for obfuscation. The incident highlighted the importance of proper key management for CEX hot wallets.",
    impact: "$41.6M",
    impactUSD: 41600000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Key Compromise", description: "Attacker obtained Stake's hot wallet private keys.", functionsCall: [], pseudocode: "// Infrastructure breach or phishing\n// Private keys exposed" },
      { id: "t2", phase: "Access", description: "Attacker used keys to access hot wallets on multiple chains.", functionsCall: ["Wallet.sign(transaction)"], pseudocode: "// Ethereum, BNB, Polygon wallets\n// Unauthorized access granted" },
      { id: "t3", phase: "Drain ETH", description: "Drained ETH and ERC-20 tokens from Ethereum hot wallet.", functionsCall: ["Wallet.transfer(ETH)", "Wallet.transfer(ERC20)"], pseudocode: "// Largest drain on Ethereum\n// Multiple tokens transferred" },
      { id: "t4", phase: "Drain BNB", description: "Drained BNB and BEP-20 tokens from BNB Chain.", functionsCall: ["Wallet.transfer(BNB)", "Wallet.transfer(BEP20)"], pseudocode: "// BNB Chain wallet drained\n// Cross-chain attack" },
      { id: "t5", phase: "Drain Polygon", description: "Drained MATIC and ERC-20 tokens from Polygon.", functionsCall: ["Wallet.transfer(MATIC)", "Wallet.transfer(ERC20)"], pseudocode: "// Polygon wallet affected\n// $41.6M total extracted" },
      { id: "t6", phase: "Launder", description: "Funds moved through mixers and bridges for obfuscation.", functionsCall: ["Mixers.tumble()", "Bridge.transfer()"], pseudocode: "// Attribution to Lazarus Group\n// Funds not recovered" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Key compromise", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Compromised Keys", detail: "Hot wallets", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Stake Hot Wallets", detail: "Multi-chain", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$41.6M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Obtain keys", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Access wallets" },
        { id: "e3", source: "n3", target: "n4", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Compromised\nKeys", type: "vault" },
      { id: "b", label: "Stake\nHot Wallets", type: "pool" },
      { id: "c", label: "Attacker\n$41.6M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 41.6, label: "Access" },
      { source: "b", target: "c", value: 41.6, label: "Drain" }
    ],
    mitigations: [
      { category: "Key Management", description: "Use hardware security modules (HSMs) for hot wallet keys. Implement multi-party computation (MPC) for critical signing operations." },
      { category: "Cold Storage", description: "Keep majority of funds in cold storage. Limit hot wallet to minimal operational amounts." },
      { category: "Monitoring", description: "Implement real-time monitoring for unusual wallet activity and automatic freezes on suspicious transactions." }
    ],
    quiz: [{ question: "What caused Stake.com's exploit?", options: ["Smart contract bug", "Hot wallet key compromise", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "Compromised private keys for hot wallets allowed unauthorized access across multiple chains." }]
  },

  // Hedgey Finance (2024)
  {
    id: "hedgey-finance-2024",
    slug: "hedgey-finance-2024",
    title: "Hedgey Finance",
    subtitle: "Flash Loan Input Validation Bug",
    year: 2024,
    chain: "Arbitrum/Ethereum",
    type: ["Flash Loan", "Logic Error"],
    shortDesc: "Input validation flaw in ClaimCampaigns contract allowed $44.7M drain via flash loans.",
    longDesc: "On April 19, 2024, Hedgey Finance, a token infrastructure platform, suffered $44.7M in parallel exploits on Arbitrum ($42.6M) and Ethereum ($2.1M). Attackers used flash loans to exploit a business logic flaw in the ClaimCampaigns smart contract. The vulnerability was failure to properly implement input validation for a key function, allowing attackers to claim tokens they shouldn't have had access to.",
    technicalDesc: "The vulnerability was in Hedgey's ClaimCampaigns contract which lacked proper input validation. The attacker: (1) took flash loans to get initial capital; (2) called the vulnerable claim function with manipulated inputs; (3) the missing validation allowed claiming of tokens without proper authorization; (4) repeated this across multiple campaigns; (5) repaid flash loans with profit. The bug was a business logic flaw, not a reentrancy or math error.",
    impact: "$44.7M ($42.6M Arbitrum + $2.1M Ethereum)",
    impactUSD: 44700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Attacker took flash loans for initial capital.", functionsCall: ["Aave.flashLoan()", "Balancer.flashLoan()"], pseudocode: "// Multi-chain flash loans\n// Arbitrum and Ethereum" },
      { id: "t2", phase: "Identify Bug", description: "Found input validation flaw in ClaimCampaigns.", functionsCall: [], pseudocode: "// Missing parameter checks\n// Business logic vulnerability" },
      { id: "t3", phase: "Exploit Arbitrum", description: "Exploited on Arbitrum for $42.6M.", functionsCall: ["ClaimCampaigns.claim(manipulated)"], pseudocode: "// Used invalid inputs\n// Claimed unauthorized tokens" },
      { id: "t4", phase: "Exploit Ethereum", description: "Exploited on Ethereum for $2.1M.", functionsCall: ["ClaimCampaigns.claim(manipulated)"], pseudocode: "// Same vulnerability\n// Parallel attack" },
      { id: "t5", phase: "Repay", description: "Repaid flash loans, kept $44.7M profit.", functionsCall: ["Aave.repay()", "Balancer.repay()"], pseudocode: "// Net profit extracted\n// Protocol paused" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Flash loan exploit", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Flash Loans", detail: "Multi-chain", x: 200, y: 100 },
        { id: "n3", type: "contract", label: "ClaimCampaigns", detail: "No validation", x: 400, y: 200 },
        { id: "n4", type: "pool", label: "Token Claims", detail: "$44.7M", x: 600, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$44.7M", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "Flash loan", animated: true },
        { id: "e2", source: "n1", target: "n3", label: "Exploit" },
        { id: "e3", source: "n3", target: "n4", label: "Claim", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Flash Loans\nCapital", type: "pool" },
      { id: "b", label: "ClaimCampaigns\nBug", type: "vault" },
      { id: "c", label: "Tokens\nClaimed", type: "pool" },
      { id: "d", label: "Attacker\n$44.7M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 44.7, label: "Flash loan" },
      { source: "b", target: "c", value: 44.7, label: "Claim" },
      { source: "c", target: "d", value: 44.7, label: "Drain" }
    ],
    mitigations: [
      { category: "Input Validation", description: "Implement comprehensive input validation on all external-facing functions. Validate all parameters against expected ranges and formats." },
      { category: "Access Control", description: "Implement proper authorization checks for token claims. Verify caller has right to claim specific tokens." },
      { category: "Audit", description: "Audit all business logic, especially token distribution and claim mechanisms." }
    ],
    quiz: [{ question: "What was Hedgey Finance's vulnerability?", options: ["Reentrancy", "Missing input validation", "Oracle bug", "Key leak"], correct: 1, explanation: "ClaimCampaigns contract lacked proper input validation, allowing unauthorized token claims via manipulated inputs." }]
  },

  // BingX (2024)
  {
    id: "bingx-2024",
    slug: "bingx-2024",
    title: "BingX",
    subtitle: "CEX Hot Wallet Compromise",
    year: 2024,
    chain: "Multi-chain",
    type: ["Access Control"],
    shortDesc: "Hot wallet compromise across multiple chains drained $44.7M from centralized exchange.",
    longDesc: "On September 19, 2024, BingX, a Singaporean centralized cryptocurrency exchange, suffered a $44.7M security breach. The attacker gained access to BingX's hot wallets across multiple blockchains. BingX detected abnormal network activity at 04:00 UTC+8 and immediately responded by freezing withdrawals and transferring assets to cold wallets. A compensation plan was announced for affected users.",
    technicalDesc: "This was a CEX hot wallet compromise, not a DeFi smart contract vulnerability. The attacker: (1) gained unauthorized access to BingX's infrastructure; (2) obtained control of hot wallet private keys across multiple chains; (3) drained funds from at least 10 different exploit addresses; (4) moved assets rapidly through the blockchain; (5) BingX responded within an hour by freezing withdrawals. The exact attack vector (phishing, insider, infrastructure breach) was not publicly disclosed.",
    impact: "$44.7M",
    impactUSD: 44700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Breach", description: "Attacker gained unauthorized access to BingX infrastructure.", functionsCall: [], pseudocode: "// Infrastructure breach\n// Hot wallet keys compromised" },
      { id: "t2", phase: "Access", description: "Accessed hot wallets across multiple blockchains.", functionsCall: ["Wallet.sign()"], pseudocode: "// Multi-chain control\n// At least 10 addresses" },
      { id: "t3", phase: "Drain", description: "Drained $44.7M from hot wallets.", functionsCall: ["Wallet.transfer(multiple_chains)"], pseudocode: "// Rapid extraction\n// Multiple tokens affected" },
      { id: "t4", phase: "Detection", description: "BingX detected abnormal activity at 04:00 UTC+8.", functionsCall: [], pseudocode: "// Network monitoring triggered\n// Security team alerted" },
      { id: "t5", phase: "Response", description: "Froze withdrawals, moved remaining assets to cold storage.", functionsCall: ["Wallet.freeze()", "ColdWallet.transfer()"], pseudocode: "// Response within 1 hour\n// Limited further damage" },
      { id: "t6", phase: "Compensation", description: "Announced compensation plan for affected users.", functionsCall: [], pseudocode: "// User protection\n// CEX responsibility" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Infrastructure breach", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "BingX Infrastructure", detail: "Compromised", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Hot Wallets", detail: "$44.7M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Breach", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Access" },
        { id: "e3", source: "n3", target: "n4", label: "Drain", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "BingX\nInfrastructure", type: "vault" },
      { id: "b", label: "Hot Wallets\n$44.7M", type: "pool" },
      { id: "c", label: "Attacker\nDrained", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 44.7, label: "Compromise" },
      { source: "b", target: "c", value: 44.7, label: "Drain" }
    ],
    mitigations: [
      { category: "Infrastructure Security", description: "Implement strict access controls, network segmentation, and monitoring for exchange infrastructure." },
      { category: "Key Management", description: "Use HSMs and MPC for hot wallet keys. Rotate keys regularly." },
      { category: "Cold Storage", description: "Keep minimal funds in hot wallets. Majority in multi-sig cold storage." }
    ],
    quiz: [{ question: "What was BingX's vulnerability?", options: ["Smart contract bug", "Hot wallet infrastructure compromise", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "Attacker gained access to infrastructure and hot wallet private keys across multiple chains." }]
  },

  // ZKasino (2024)
  {
    id: "zkasino-2024",
    slug: "zkasino-2024",
    title: "ZKasino",
    subtitle: "Exit Scam - Fund Diversion",
    year: 2024,
    chain: "Ethereum",
    type: ["Access Control"],
    shortDesc: "Gambling project diverted $33M of investor funds to Lido staking instead of returning them as promised.",
    longDesc: "In April 2024, ZKasino, a blockchain gambling project, abruptly diverted $33 million worth of investor funds to Lido's staking protocol instead of returning them as promised to presale participants. Over 10,000 users deposited ETH to earn ZKAS tokens. The project misrepresented its Series A funding, claiming $350M backing from MEXC and Big Brain Holdings which was later debunked. Dutch authorities arrested a 26-year-old connected to the incident.",
    technicalDesc: "This was an exit scam, not a smart contract vulnerability. The project: (1) opened a token bridge allowing investors to deposit ETH to earn ZKAS; (2) collected $33M from 10,000+ users; (3) instead of returning funds or launching as promised, diverted ETH to Lido staking; (4) claimed technical issues and delays; (5) investigations revealed false funding claims; (6) Dutch authorities arrested a suspect. The chain was a simple Arbitrum Nitro deployment with no actual zk-tech.",
    impact: "$33M",
    impactUSD: 33000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Presale", description: "ZKasino opened token bridge for ETH deposits to earn ZKAS tokens.", functionsCall: ["Bridge.deposit(ETH)"], pseudocode: "// 10,000+ users deposited\n// $33M ETH collected" },
      { id: "t2", phase: "False Claims", description: "Project claimed $350M Series A backing from MEXC and Big Brain.", functionsCall: [], pseudocode: "// Misrepresented funding\n// Later debunked" },
      { id: "t3", phase: "Launch Delay", description: "Project delayed launch, citing technical issues.", functionsCall: [], pseudocode: "// Stalling tactics\n// User concerns grew" },
      { id: "t4", phase: "Fund Diversion", description: "$33M diverted to Lido staking instead of returned to users.", functionsCall: ["Lido.stake(33M ETH)"], pseudocode: "// Funds locked in staking\n// Not accessible to users" },
      { id: "t5", phase: "Investigation", description: "Investigations revealed false claims and exit scam.", functionsCall: [], pseudocode: "// ZachXBT exposed scheme\n// Dutch authorities involved" },
      { id: "t6", phase: "Arrest", description: "Dutch authorities arrested 26-year-old suspect.", functionsCall: [], pseudocode: "// Assets seized\n// Partial refunds promised" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "ZKasino Team", detail: "Exit scam", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "User Deposits", detail: "$33M ETH", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "Lido Staking", detail: "Funds diverted", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Team", detail: "Control", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "Users deposit" },
        { id: "e2", source: "n1", target: "n3", label: "Divert", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Control" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "User\n$33M", type: "pool" },
      { id: "b", label: "ZKasino\nBridge", type: "vault" },
      { id: "c", label: "Lido\nStaking", type: "pool" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 33, label: "Deposit" },
      { source: "b", target: "c", value: 33, label: "Diverge" }
    ],
    mitigations: [
      { category: "Due Diligence", description: "Investigate project team, funding claims, and technical implementation before investing." },
      { category: "Custody", description: "Use escrow or time-locked contracts for presale funds rather than direct transfers to team." },
      { category: "Verification", description: "Verify all funding claims with stated partners. Be skeptical of unverified announcements." }
    ],
    quiz: [{ question: "What was ZKasino's exploit?", options: ["Smart contract bug", "Exit scam - fund diversion", "Oracle manipulation", "Flash loan"], correct: 1, explanation: "Project diverted $33M of investor funds to Lido staking instead of returning them as promised." }]
  },

  // XToken (2021)
  {
    id: "xtoken-2021",
    slug: "xtoken-2021",
    title: "XToken",
    subtitle: "Flash Loan Attack on Tokenized Positions",
    year: 2021,
    chain: "Ethereum",
    type: ["Flash Loan", "Logic Error"],
    shortDesc: "Flash loan attacker exploited xSNXa and xBNTa contracts to drain $24.5M.",
    longDesc: "On May 12, 2021, DeFi protocol xToken suffered a $24.5M exploit via flash loans. The attacker used flash loans to exploit vulnerabilities in the xSNXa and xBNTa contracts, which represented tokenized positions in Synthetix and Bancor. The attacker got away with over $8M in SNX tokens and drained liquidity pools. Minting was paused on all contracts as the team investigated.",
    technicalDesc: "The vulnerability was in xToken's implementation of tokenized leveraged positions. The attacker: (1) took flash loans to get initial capital; (2) exploited price calculation flaws in xSNXa/xBNTa; (3) manipulated the tokenized positions to extract value; (4) swapped and drained liquidity pools; (5) repaid flash loans with profit. The bug was related to how the contracts calculated the value of underlying tokenized positions.",
    impact: "$24.5M",
    impactUSD: 24500000,
    contracts: [{ label: "xToken xSNXa", address: "0x2367012aB9C3da91290F71590D5cE217721EEFE4", url: "https://etherscan.io/address/0x2367012ab9c3da91290f71590d5ce217721eefe4" }],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Borrowed assets via flash loans.", functionsCall: ["Aave.flashLoan()", "dYdX.flashLoan()"], pseudocode: "// Initial capital for exploit" },
      { id: "t2", phase: "Exploit xSNXa", description: "Exploited xSNXa contract price calculation.", functionsCall: ["xSNXa.exploit()"], pseudocode: "$8M+ SNX tokens extracted" },
      { id: "t3", phase: "Exploit xBNTa", description: "Exploited xBNTa contract.", functionsCall: ["xBNTa.exploit()"], pseudocode: "// Additional value drained" },
      { id: "t4", phase: "Drain Liquidity", description: "Drained liquidity pools.", functionsCall: ["DEX.drain(liquidity)"], pseudocode: "// Liquidity pools emptied\n// Most SNX/BNT remained in contracts" },
      { id: "t5", phase: "Repay", description: "Repaid flash loans, kept $24.5M profit.", functionsCall: ["Aave.repay()", "dYdX.repay()"], pseudocode: "// Minting paused\n// Protocol investigated" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Flash loan", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Flash Loans", detail: "Capital", x: 200, y: 100 },
        { id: "n3", type: "contract", label: "xSNXa/xBNTa", detail: "Vulnerable", x: 400, y: 200 },
        { id: "n4", type: "pool", label: "Liquidity", detail: "$24.5M", x: 600, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Profit", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "Flash loan", animated: true },
        { id: "e2", source: "n1", target: "n3", label: "Exploit" },
        { id: "e3", source: "n3", target: "n4", label: "Drain", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Profit" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Flash Loans\nCapital", type: "pool" },
      { id: "b", label: "xToken\nContracts", type: "vault" },
      { id: "c", label: "Liquidity\n$24.5M", type: "pool" },
      { id: "d", label: "Attacker\nProfit", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 24.5, label: "Flash loan" },
      { source: "b", target: "c", value: 24.5, label: "Exploit" },
      { source: "c", target: "d", value: 24.5, label: "Drain" }
    ],
    mitigations: [
      { category: "Price Calculation", description: "Rigorously test price calculation logic for tokenized positions, especially with external dependencies." },
      { category: "Flash Loan Protection", description: "Add delays or limits on rapid position changes that could be flash loan driven." },
      { category: "Audit", description: "Audit tokenized position implementations thoroughly, focusing on edge cases." }
    ],
    quiz: [{ question: "What was XToken's vulnerability?", options: ["Reentrancy", "Flash loan price calculation exploit", "Key leak", "Oracle bug"], correct: 1, explanation: "Flash loan attacker exploited price calculation flaws in xSNXa and xBNTa tokenized position contracts." }]
  },

  // Popsicle Finance (2021)
  {
    id: "popsicle-finance-2021",
    slug: "popsicle-finance-2021",
    title: "Popsicle Finance",
    subtitle: "State Tracking Bug in Sorbetto Fragola",
    year: 2021,
    chain: "Ethereum",
    type: ["Logic Error", "Flash Loan"],
    shortDesc: "State tracking bug in Uniswap V3 LP optimizer allowed $20.7M drain.",
    longDesc: "On August 4, 2021, Popsicle Finance, a multi-chain yield optimization platform for liquidity providers, was hacked for $20.7M. The exploit targeted Sorbetto Fragola, a Uniswap V3 LP optimizer. The hack demonstrated the importance of proper state tracking within DeFi protocols. While the project tracked state within a particular account, testing did not consider the impacts of transfers.",
    technicalDesc: "The vulnerability was in Popsicle's state tracking for Sorbetto Fragola. The contract tracked user-specific state but didn't properly handle transfers. The attacker: (1) used flash loans for capital; (2) deposited into Sorbetto Fragola; (3) transferred position to bypass state tracking; (4) withdrew at inflated values; (5) repaid flash loans. The bug was that state wasn't properly updated on transfers, allowing position manipulation.",
    impact: "$20.7M",
    impactUSD: 20700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Borrowed capital via flash loans.", functionsCall: ["Aave.flashLoan()"], pseudocode: "// Seed capital for exploit" },
      { id: "t2", phase: "Deposit", description: "Deposited into Sorbetto Fragola LP optimizer.", functionsCall: ["Sorbetto.deposit()"], pseudocode: "// Uniswap V3 LP position\n// State tracked per account" },
      { id: "t3", phase: "Transfer", description: "Transferred position to bypass state tracking.", functionsCall: ["Sorbetto.transfer()"], pseudocode: "// State not updated on transfer\n// Position manipulation possible" },
      { id: "t4", phase: "Withdraw", description: "Withdrew at inflated values.", functionsCall: ["Sorbetto.withdraw()"], pseudocode: "// Exploited stale state\n// $20.7M drained" },
      { id: "t5", phase: "Repay", description: "Repaid flash loans, kept profit.", functionsCall: ["Aave.repay()"], pseudocode: "// Net profit extracted\n// State tracking fixed" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "State exploit", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Flash Loan", detail: "Capital", x: 200, y: 100 },
        { id: "n3", type: "contract", label: "Sorbetto Fragola", detail: "State bug", x: 400, y: 200 },
        { id: "n4", type: "pool", label: "LP Position", detail: "Manipulated", x: 600, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "$20.7M", x: 800, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "Flash loan", animated: true },
        { id: "e2", source: "n1", target: "n3", label: "Deposit" },
        { id: "e3", source: "n3", target: "n4", label: "Transfer bypass", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Withdraw" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Flash Loan\nCapital", type: "pool" },
      { id: "b", label: "Sorbetto\nState Bug", type: "vault" },
      { id: "c", label: "LP Position\n$20.7M", type: "pool" },
      { id: "d", label: "Attacker\nProfit", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 20.7, label: "Flash loan" },
      { source: "b", target: "c", value: 20.7, label: "Manipulate" },
      { source: "c", target: "d", value: 20.7, label: "Drain" }
    ],
    mitigations: [
      { category: "State Tracking", description: "Ensure all state updates correctly handle transfers and account changes. Test all transfer scenarios." },
      { category: "Invariant Testing", description: "Use formal verification and invariant testing to ensure state consistency across all operations." },
      { category: "Audit", description: "Audit LP optimizer contracts thoroughly, focusing on state management." }
    ],
    quiz: [{ question: "What was Popsicle Finance's vulnerability?", options: ["Reentrancy", "State tracking bug on transfers", "Key leak", "Oracle bug"], correct: 1, explanation: "State wasn't properly updated on position transfers, allowing manipulation in Sorbetto Fragola." }]
  },

  // Cream Finance (2021)
  {
    id: "cream-finance-2021",
    slug: "cream-finance-2021",
    title: "Cream Finance",
    subtitle: "Reentrancy via ERC-777 Token",
    year: 2021,
    chain: "Ethereum",
    type: ["Reentrancy"],
    shortDesc: "ERC-777 token standard in AMP created reentrancy vulnerability, draining $18.8M.",
    longDesc: "On August 30, 2021, Cream Finance, a DeFi lending protocol, suffered an $18.8M exploit. The hacker exploited a reentrancy vulnerability arising from how CREAM integrated the AMP token. AMP implements the ERC-777 token standard, which includes hooks that can trigger reentrancy. The _callPostTransfersHook hook called the token contract during transfers, creating a reentrancy window that the attacker exploited to drain 418M AMP and 1,308 ETH.",
    technicalDesc: "The vulnerability was in CREAM's integration with AMP's ERC-777 implementation. ERC-777 tokens have hooks that execute during transfers. The attacker: (1) deposited AMP as collateral into CREAM; (2) borrowed against the collateral; (3) the ERC-777 _callPostTransfersHook fired during transfer; (4) this hook re-entered the borrow function before state updated; (5) repeated to drain 418,311,571 AMP and 1,308.09 ETH; (6) CREAM paused AMP supply and borrow contracts.",
    impact: "$18.8M (418M AMP + 1,308 ETH)",
    impactUSD: 18800000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Deposit", description: "Deposited AMP tokens as collateral into CREAM.", functionsCall: ["Cream.deposit(AMP)"], pseudocode: "// AMP is ERC-777 token\n// Has transfer hooks" },
      { id: "t2", phase: "Borrow", description: "Borrowed assets against AMP collateral.", functionsCall: ["Cream.borrow()"], pseudocode: "// Normal borrow operation" },
      { id: "t3", phase: "Reentrancy", description: "ERC-777 _callPostTransfersHook fired, re-entering borrow function.", functionsCall: ["AMP._callPostTransfersHook()", "Cream.borrow()"], pseudocode: "// Hook triggered during transfer\n// Reentrancy window opened" },
      { id: "t4", phase: "Drain", description: "Re-entered multiple times to drain 418M AMP and 1,308 ETH.", functionsCall: ["Cream.borrow(repeat)"], pseudocode: "// State not updated\n// Multiple borrows succeeded" },
      { id: "t5", phase: "Pause", description: "CREAM paused AMP supply and borrow contracts.", functionsCall: ["Cream.pause(AMP)"], pseudocode: "// Protocol paused\n// $18.8M total drained" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "ERC-777 reentrancy", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "AMP Token", detail: "ERC-777 hooks", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "Cream Finance", detail: "No reentrancy guard", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "Treasury", detail: "$18.8M", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Drained", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Deposit AMP", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Hook triggers" },
        { id: "e3", source: "n3", target: "n4", label: "Reenter & drain", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Extract" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "AMP\nERC-777", type: "vault" },
      { id: "b", label: "Cream\nFinance", type: "vault" },
      { id: "c", label: "Reentrancy\nHook", type: "bridge" },
      { id: "d", label: "Attacker\n$18.8M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 18.8, label: "Deposit" },
      { source: "b", target: "c", value: 18.8, label: "Hook" },
      { source: "c", target: "d", value: 18.8, label: "Drain" }
    ],
    mitigations: [
      { category: "ERC-777 Awareness", description: "Be aware that ERC-777 tokens have hooks that can trigger reentrancy. Treat them as untrusted external calls." },
      { category: "ReentrancyGuard", description: "Use ReentrancyGuard on all functions that handle token transfers, especially with ERC-777 tokens." },
      { category: "Token Allowlisting", description: "Consider allowlisting only safe token standards (ERC-20) or adding special handling for ERC-777." }
    ],
    quiz: [{ question: "What caused Cream Finance's exploit?", options: ["Oracle bug", "ERC-777 reentrancy via AMP hooks", "Key leak", "Integer overflow"], correct: 1, explanation: "AMP's ERC-777 implementation has hooks that triggered reentrancy during transfers, which CREAM didn't protect against." }]
  },

  // Sonne Finance (2024)
  {
    id: "sonne-finance-2024",
    slug: "sonne-finance-2024",
    title: "Sonne Finance",
    subtitle: "Compound Fork Precision Loss Vulnerability",
    year: 2024,
    chain: "Optimism",
    type: ["Math Bug", "Logic Error"],
    shortDesc: "Known Compound fork vulnerability allowed $20M drain via precision loss in exchange rate calculation.",
    longDesc: "On May 14, 2024, Sonne Finance on Optimism was exploited for approximately $20M using a known precision loss vulnerability first seen in the Hundred Finance exploit in April 2023. This is the largest exploit on Optimism. The attacker used a 'donation attack' to manipulate markets. The vulnerability affects all Compound v2 forks when deploying new markets without proper initialization.",
    technicalDesc: "The vulnerability was a precision loss bug in the exchange rate calculation, a known issue with Compound v2 forks. The attacker: (1) identified uninitialized or poorly initialized markets; (2) used a 'donation' attack to manipulate exchange rates; (3) exploited precision loss to borrow more than should be possible; (4) drained $20M from lending pools. The bug occurs when new markets are deployed without proper initialization of exchange rate variables.",
    impact: "$20M",
    impactUSD: 20000000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Market Addition", description: "Sonne added VELO markets via multisig proposal.", functionsCall: ["Multisig.execute(add_market)"], pseudocode: "// New market deployed\n// Known vulnerability not addressed" },
      { id: "t2", phase: "Donation Attack", description: "Attacker used donation to manipulate exchange rates.", functionsCall: ["Sonne.donate(manipulate)"], pseudocode: "// Precision loss exploited\n// Exchange rate distorted" },
      { id: "t3", phase: "Borrow", description: "Borrowed at manipulated rates to extract value.", functionsCall: ["Sonne.borrow(at_manipulated_rate)"], pseudocode: "// Borrowed more than collateral\n// $20M drained" },
      { id: "t4", phase: "Cross-Chain", description: "Funds bridged off Optimism.", functionsCall: ["Bridge.transfer(profits)"], pseudocode: "// Largest Optimism exploit\n// Funds moved to evade tracking" },
      { id: "t5", phase: "Pause", description: "Sonne paused all markets on Optimism.", functionsCall: ["Sonne.pause(all)"], pseudocode: "// Base chain also affected\n// Protocol halted" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Precision loss", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Sonne Markets", detail: "Compound fork", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Exchange Rate", detail: "Manipulated", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "Treasury", detail: "$20M", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Drained", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Donation", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Manipulate rate" },
        { id: "e3", source: "n3", target: "n4", label: "Borrow", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Extract" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Sonne\nMarkets", type: "vault" },
      { id: "b", label: "Exchange Rate\nPrecision Loss", type: "pool" },
      { id: "c", label: "Treasury\n$20M", type: "pool" },
      { id: "d", label: "Attacker\nDrained", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 20, label: "Manipulate" },
      { source: "b", target: "c", value: 20, label: "Borrow" },
      { source: "c", target: "d", value: 20, label: "Drain" }
    ],
    mitigations: [
      { category: "Market Initialization", description: "Properly initialize all market variables, especially exchange rates, before enabling operations." },
      { category: "Known Vulnerabilities", description: "Research and address known vulnerabilities in forked code before deployment." },
      { category: "Precision Handling", description: "Use high-precision math libraries and validate all exchange rate calculations." }
    ],
    quiz: [{ question: "What was Sonne Finance's vulnerability?", options: ["Reentrancy", "Known Compound fork precision loss", "Key leak", "Oracle bug"], correct: 1, explanation: "Known Compound v2 fork vulnerability in exchange rate calculation was not addressed when deploying new markets." }]
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
