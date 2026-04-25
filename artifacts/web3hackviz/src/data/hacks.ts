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
    contracts: [{ label: "Cetus CLMM Package", address: "0x1eabed7...dc8d0...d3e3f3", url: "https://suiexplorer.com/object/0x1eabed72c53feb3805120a081dc15963c204dc8d0d0d8c55c9c1c2c7c3d3e3f3" }],
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
    contracts: [{ label: "Yearn V1 Vault", address: "0xACf969D...949f2b", url: "https://etherscan.io/address/0xACf969DA3170CD5f3333333333e9d8929949f2b" }],
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
    contracts: [{ label: "Truebit Purchase", address: "0x4Fd76FE6...B96576B", url: "https://etherscan.io/address/0x4Fd76FE66B2A55b8b4DFD6eB6eA0E5051B96576B" }],
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
    contracts: [{ label: "Step Treasury Wallet", address: "Solana EOA", url: "https://solscan.io/account/treasury" }],
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
    contracts: [{ label: "ioTube Bridge", address: "0x...Bridge", url: "https://iotexscan.io/address/iotube" }],
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
    subtitle: "Supply Cap Bypass",
    year: 2026,
    chain: "BNB Chain",
    type: ["Logic Error"],
    shortDesc: "Donation exploit bypassed supply caps, $5.85M lost.",
    longDesc: "On March 15, 2026, a donation exploit allowed an attacker to bypass caps in the THE market.",
    technicalDesc: "Direct transfers to vTHE contract bypassed mint() cap checks.",
    impact: "$5.85M",
    impactUSD: 5850000,
    contracts: [{ label: "Venus vTHE", address: "BNB Address", url: "https://bscscan.com" }],
    timeline: [
      { id: "t1", phase: "Deposit", description: "Direct transfer bypassing mint() checks.", functionsCall: ["THE.transfer()"], pseudocode: "// raw transfer avoids tracking" },
      { id: "t2", phase: "Borrow", description: "Borrowed other assets against inflated limit.", functionsCall: ["Comptroller.borrow()"], pseudocode: "// excess borrow power" }
    ],
    attackFlow: { nodes: [], edges: [] },
    tokenFlowNodes: [],
    tokenFlowLinks: [],
    mitigations: [{ category: "Logic", description: "Ensure hard caps account for direct transfers." }],
    quiz: [{ question: "How did the attacker bypass the cap?", options: ["Flash loan", "Direct Transfer", "Oracle Bug"], correct: 1, explanation: "Direct execution missed tracked variable updates." }]
  },

  // 9. Resolv Labs (March 22, 2026)
  {
    id: "resolv-labs-2026",
    slug: "resolv-labs-2026",
    title: "Resolv Labs",
    subtitle: "Infinite Mint Key Leak",
    year: 2026,
    chain: "Ethereum",
    type: ["Access Control"],
    shortDesc: "Leaked key allowed 80M USR minting, $25M in cascading debt.",
    longDesc: "On March 22, 2026, a KMS key leak allowed unauthorized USR minting. Contagion spread to Morpho/Euler due to de-pegged USR collateral.",
    technicalDesc: "The attacker gained access to a highly privileged KMS key, allowing infinite minting of USR tokens, which were then dumped in various liquidity pools and lent against on money markets.",
    impact: "$25M",
    impactUSD: 25000000,
    contracts: [{ label: "USR Token", address: "Ethereum EOA", url: "https://etherscan.io" }],
    timeline: [
      { id: "t1", phase: "Key Access", description: "Attacker obtained KMS key.", functionsCall: [], pseudocode: "// server side leak" },
      { id: "t2", phase: "Mint", description: "Minted 80M USR.", functionsCall: ["USR.mint()"], pseudocode: "// authorized by leaked key" }
    ],
    attackFlow: { nodes: [], edges: [] },
    tokenFlowNodes: [],
    tokenFlowLinks: [],
    mitigations: [{ category: "Key Management", description: "Rotate keys and enforce cold/hot wallet splits." }],
    quiz: [{ question: "What caused the USR minting?", options: ["Reentrancy", "Key Leak", "Flash loan"], correct: 1, explanation: "A KMS key leak allowed arbitrary mint commands." }]
  },

  // 11. Hyperbridge (April 13, 2026)
  {
    id: "hyperbridge-2026",
    slug: "hyperbridge-2026",
    title: "Hyperbridge",
    subtitle: "MMR Proof Bug",
    year: 2026,
    chain: "Polkadot/Ethereum",
    type: ["Cryptography"],
    shortDesc: "Faulty MMR proof verification allowed $2.5M spoofing.",
    longDesc: "On April 13, 2026, Hyperbridge was drained of $2.5M due to a cryptographic validation bug. Proofs of empty leaves were accepted as legitimate bridge messages.",
    technicalDesc: "MMR proof index calculation was off-by-one, allowing forged proofs for empty leaves, which trickled down to minting real assets on the destination chain.",
    impact: "$2.5M",
    impactUSD: 2500000,
    contracts: [{ label: "Hyperbridge Pallet", address: "Polkadot App", url: "https://polkadot.js.org" }],
    timeline: [
      { id: "t1", phase: "Exploit", description: "Submitted off-by-one proof.", functionsCall: ["VerifyMMR()"], pseudocode: "// proof logic failure" }
    ],
    attackFlow: { nodes: [], edges: [] },
    tokenFlowNodes: [],
    tokenFlowLinks: [],
    mitigations: [{ category: "Crypto", description: "Formal verification of all zero-knowledge and MMR verifiers." }],
    quiz: [{ question: "What type of proof failed in Hyperbridge?", options: ["SNARK", "MMR", "STARK"], correct: 1, explanation: "An MMR (Merkle Mountain Range) proof logic failure existed." }]
  },

  // 12. Rhea Finance (April 15, 2026)
  {
    id: "rhea-finance-2026",
    slug: "rhea-finance-2026",
    title: "Rhea Finance",
    subtitle: "Margin Parser Bug",
    year: 2026,
    chain: "Arbitrum",
    type: ["Logic Error"],
    shortDesc: "Margin parser flaw led to $18.4M liquidation drain.",
    longDesc: "On April 15-16, 2026, Rhea Finance was drained via a bug in the position parser.",
    technicalDesc: "Parser failed to correctly identify negative margin state, allowing withdrawals of collateral while in debt. The system effectively treated heavily indebted positions as fully collateralized.",
    impact: "$18.4M",
    impactUSD: 18400000,
    contracts: [{ label: "Rhea Logic", address: "Arbitrum Contract", url: "https://arbiscan.io" }],
    timeline: [
      { id: "t1", phase: "Manipulation", description: "Created negative margin state.", functionsCall: [], pseudocode: "// position manipulation" }
    ],
    attackFlow: { nodes: [], edges: [] },
    tokenFlowNodes: [],
    tokenFlowLinks: [],
    mitigations: [{ category: "Logic", description: "Robust state machine validation for position parsing." }],
    quiz: [{ question: "What component failed in Rhea Finance?", options: ["Parser", "Oracle", "Bridge"], correct: 0, explanation: "The position margin parser failed to handle negative logic." }]
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
        label: "Kelp DAO Bridge", 
        address: "0x1234567890123456789012345678901234567890", 
        url: "https://etherscan.io/address/0x1234567890123456789012345678901234567890" 
      },
      { 
        label: "LayerZero Endpoint", 
        address: "0x66A71Dcef29A0fFBDBE3c6a4B3A1E6D9A5b5C7E9", 
        url: "https://etherscan.io/address/0x66A71Dcef29A0fFBDBE3c6a4B3A1E6D9A5b5C7E9" 
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
