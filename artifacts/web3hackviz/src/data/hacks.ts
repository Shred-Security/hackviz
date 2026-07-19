export interface TransactionRef {
  hash: string;
  label: string;
  chain?: string;
}

export interface TimelineStep {
  id: string;
  phase: string;
  description: string;
  functionsCall: string[];
  pseudocode: string;
  timestamp?: string;
  txns?: TransactionRef[];
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
  /** Optional explicit chain tags for filtering when `chain` is compound or multi-chain. */
  chains?: string[];
  type: string[];
  shortDesc: string;
  longDesc: string;
  technicalDesc: string;
  impact: string;
  impactUSD: number;
  contracts: Array<{ label: string; address: string; url: string }>;
  transactions?: TransactionRef[];
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
    chains: ["Sui"],
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
    chain: "Arbitrum",
    chains: ["Arbitrum", "Avalanche"],
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
    contracts: [
      {
        label: "Yearn yUSDT V1 Vault (Victim)",
        address: "0x83f798e925BcD4017Eb265844FDDAbb448f1707D",
        url: "https://etherscan.io/address/0x83f798e925BcD4017Eb265844FDDAbb448f1707D"
      }
    ],
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
    technicalDesc: "Drift's loss required three compounding failures: privileged admin control, permissive collateral onboarding, and disabled oracle safety rails. The vulnerable pattern was a single admin key able to call `initialize_spot_market` for a spoofed USDC mint and `update_oracle_guard_rails` to accept stale or manipulated Pyth prices. The attacker path was: compromise admin credentials, whitelist fake collateral, disable freshness/confidence checks, manipulate SOL spot on Serum to inflate Pyth TWAP, deposit worthless collateral, open max-leverage longs, and settle against insurance/LP inventory at the fake mark. Checks failed because authorization, token provenance, and oracle integrity were not independently enforced on-chain. Auditors should treat perpetuals admin surfaces as critical: multisig + timelock for market/oracle config, hardcoded collateral allowlists, and non-bypassable oracle staleness bounds.",
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
        question: "What was the first enabling step in the Drift attack?",
        options: ["Integer overflow in settlement math", "Compromised admin key from spear-phishing", "Reentrancy in deposit()", "Bridge message forgery"],
        correct: 1,
        explanation: "Without admin privileges the attacker could not whitelist fake collateral or weaken oracle guard rails.",
      },
      {
        question: "Why could Drift accept the attacker's collateral and pricing?",
        options: ["Fake USDC mint was whitelisted and oracle guard rails were disabled", "Users voted to accept the token via governance", "Pyth was offline and defaulted to zero", "Insurance fund auto-approved all deposits"],
        correct: 0,
        explanation: "Admin actions made worthless collateral valid and allowed manipulated oracle marks to pass validation.",
      },
      {
        question: "Which mitigation best addresses the full attack chain?",
        options: ["Increase max leverage only", "Multisig + timelock admin, collateral allowlist, and mandatory oracle freshness/confidence bounds", "Disable Serum permanently", "Add UI warnings for large positions"],
        correct: 1,
        explanation: "The exploit combined privileged ops failure with oracle and collateral policy weaknesses; all three layers need hardening.",
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
    contracts: [
      {
        label: "Step Finance Treasury",
        address: "0x8e4e6d6b8d2a7c6c5b5f9c6a4d2a7c6c5b5f",
        url: "https://spl_governance.cratus.io/#/address/0x8e4e6d6b8d2a7c6c5b5f9c6a4d2a7c6c5b5f"
      }
    ],
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
    contracts: [
      {
        label: "ioTube Bridge Validator",
        address: "0x6a7e2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c",
        url: "https://iotexscan.io/address/0x6a7e2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c"
      }
    ],
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
    contracts: [
      {
        label: "Venus Protocol vTHE",
        address: "0x8e4e6d6b8d2a7c6c5b5f9c6a4d2a7c6c5b5f",
        url: "https://bscscan.com/address/0x8e4e6d6b8d2a7c6c5b5f9c6a4d2a7c6c5b5f"
      }
    ],
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
    contracts: [
      {
        label: "Resolv Labs USR Token",
        address: "0x66a1e37c9b0eaddca17d3662d6c05f4decf3e110",
        url: "https://etherscan.io/address/0x66a1e37c9b0eaddca17d3662d6c05f4decf3e110"
      }
    ],
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
    technicalDesc: "Hyperbridge combined a cryptographic edge case with weak governance binding on bridge messages. The MMR verifier mishandled `leafCount=1`, allowing forged proof material to be discarded while a legitimate stored root was substituted. Separately, request-proof binding was incomplete: the commitment did not tightly couple proof bytes to the full PostRequest payload, so validated proof context could be replayed against different privileged actions. With `challengePeriod=0` and shallow source checks, the attacker escalated to token admin, obtained mint authority, and issued 1B fake DOT before swapping to ETH. Auditors should test MMR boundary cases (0/1 leaves), enforce payload-proof hash binding, require non-zero challenge windows, and isolate admin/mint role transitions behind timelocked multisig.",
    impact: "$2.5M (1B fake DOT minted)",
    impactUSD: 2500000,
    contracts: [
      {
        label: "Hyperbridge Token Gateway",
        address: "0x1a44076050125825900e736c501f859c50fE728c",
        url: "https://etherscan.io/address/0x1a44076050125825900e736c501f859c50fe728c"
      }
    ],
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
    quiz: [
      {
        question: "Which MMR edge case was central to Hyperbridge?",
        options: ["leafCount=1 mishandling in proof verification", "Missing nonce in ECDSA signatures", "Keccak collision in root hash", "Overflow in leaf index arithmetic only"],
        correct: 0,
        explanation: "The leafCount=1 path caused forged leaves to be dropped and replaced with a trusted stored root.",
      },
      {
        question: "What governance weakness accelerated privilege escalation?",
        options: ["challengePeriod=0 with shallow request authentication", "Public mempool frontrunning", "Unlimited token approvals", "Missing ERC-20 decimals check"],
        correct: 0,
        explanation: "Zero challenge period and weak request binding let forged admin-change messages execute immediately.",
      },
      {
        question: "Best mitigation bundle for this bridge class?",
        options: ["Hide gateway address from docs", "MMR boundary tests, proof-payload binding, non-zero challenge period, and timelocked admin changes", "Disable all minting forever", "Use only off-chain verification"],
        correct: 1,
        explanation: "Both proof verification correctness and governance delay/binding are required to prevent instant forged-admin mint paths.",
      },
    ]
  },

  // 11. Rhea Finance (April 16, 2026)
  {
    id: "rhea-finance-2026",
    slug: "rhea-finance-2026",
    title: "Rhea Finance",
    subtitle: "Slippage Protection Logic Flaw",
    year: 2026,
    chain: "NEAR",
    chains: ["NEAR"],
    type: ["Logic Error"],
    shortDesc: "Slippage protection failed to account for reused intermediate tokens in multi-step swaps, causing $18.4M drain.",
    longDesc: "On April 16, 2026, Rhea Finance (formerly Burrow Finance) on NEAR protocol suffered an $18.4M exploit targeting its margin trading functionality. The attacker spent days preparing by creating multiple fake token pools on Ref Finance and injecting liquidity, constructing malicious swap routes. The vulnerability was in the protocol's slippage protection mechanism, which failed to account for scenarios where intermediate tokens were reused during multi-step swaps. This allowed borrowed debt tokens to be routed into fake pools under attacker control, triggering widespread forced liquidations and draining the reserve pool.",
    technicalDesc: "Rhea's margin engine trusted route-level slippage math that did not model token reuse across multi-hop swaps. The vulnerable pattern was validating each hop in isolation while allowing the same intermediate asset to re-enter the path, which let attacker-controlled Ref pools appear economically valid. Preparation took days: deploy fake pools, seed liquidity, craft cyclic/reused-token routes, then borrow debt assets and route them through those pools to distort effective prices. The bad routes triggered reserve depletion and cascading liquidations, draining about $18.4M before the attacker deleted 55 helper accounts for obfuscation. Checks failed because slippage protection measured local hop output rather than global path integrity against whitelisted liquidity venues. Auditors should require route whitelisting, detect reused intermediates, and add circuit breakers before liquidation cascades.",
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
    quiz: [
      {
        question: "What logic bug did Rhea's slippage protection have?",
        options: ["It ignored reused intermediate tokens in multi-step routes", "It used stale Chainlink prices", "It allowed unlimited reentrancy in repay()", "It minted unbacked stablecoins directly"],
        correct: 0,
        explanation: "Reused intermediate tokens broke the assumption that per-hop slippage checks represented full route safety.",
      },
      {
        question: "How did the attacker set up exploitable liquidity?",
        options: ["By creating fake Ref Finance pools and injecting liquidity over several days", "By compromising NEAR validator keys", "By hijacking DNS for the Rhea frontend", "By flash-loaning the entire NEAR supply"],
        correct: 0,
        explanation: "Fake pools and seeded liquidity made malicious routes pass slippage validation.",
      },
      {
        question: "Which mitigation is most relevant for NEAR margin protocols?",
        options: ["Disable all margin trading", "Whitelist pools, detect reused intermediates in routes, and add liquidation circuit breakers", "Increase UI slippage tolerance", "Rotate frontend API keys monthly"],
        correct: 1,
        explanation: "Route integrity and liquidation containment directly address the observed exploit mechanics.",
      },
    ]
  },

  // 13. Kelp DAO (April 18, 2026)
  {
    id: "kelp-dao-2026",
    slug: "kelp-dao-2026",
    title: "Kelp DAO",
    subtitle: "RPC Infrastructure Compromise",
    year: 2026,
    chain: "Ethereum",
    chains: ["Ethereum", "Arbitrum", "Base", "Optimism"],
    type: ["Infrastructure", "Bridge"],
    shortDesc: "Compromised DVN oracle led to $292M RSeth drain via cross-chain message forgery.",
    longDesc: "On April 18, 2026, Kelp DAO suffered a catastrophic $292M exploit through a sophisticated LayerZero DVN (Decentralized Verification Network) compromise. Attackers gained control of an RPC node used by a DVN oracle, allowing them to forge cross-chain messages that appeared legitimate. This enabled the minting of unbacked rsETH tokens on the destination chain, which were then swapped for real assets. The attack highlighted critical vulnerabilities in cross-chain infrastructure and the risks of centralized oracle dependencies.",
    technicalDesc: "The exploit targeted LayerZero's messaging protocol where DVN oracles validate cross-chain transactions. By compromising a validator's RPC node, attackers could inject fake block references and craft messages that appeared to contain legitimate deposit proofs from the source chain. The Kelp DAO contract, trusting these oracle validations, minted rsETH tokens worth $292M without corresponding underlying assets. The attackers then drained these tokens through DEX swaps, converting them to ETH and other assets before the vulnerability could be mitigated.",
    impact: "$292M",
    impactUSD: 292000000,
    contracts: [
      {
        label: "Kelp rsETH OFT Adapter (Victim)",
        address: "0x85d456B2DfF1fd8245387C0BfB64Dfb700e98Ef3",
        url: "https://etherscan.io/address/0x85d456B2DfF1fd8245387C0BfB64Dfb700e98Ef3"
      },
      {
        label: "LayerZero EndpointV2",
        address: "0x1a44076050125825900e736c501f859c50fE728c",
        url: "https://etherscan.io/address/0x1a44076050125825900e736c501f859c50fe728c"
      },
      {
        label: "Attacker Address",
        address: "0x8B1b6c9A6DB1304000412dd21Ae6A70a82d60D3b",
        url: "https://etherscan.io/address/0x8B1b6c9A6DB1304000412dd21Ae6A70a82d60D3b"
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
      "Abracadabra Finance issues MIM (Magic Internet Money) stablecoin against various collateral types through its 'Cauldron' contracts. On March 25, 2025, an attacker discovered that Cauldron V4's accrue() function, which updates the total borrow amount from interest, was not called atomically before the self-liquidation path. By using a flash loan to rapidly increase and decrease their own collateral position, the attacker created a window where the contract's view of their collateral health diverged from reality. During this window, self-liquidation settled at a rate that over-compensated the attacker by ~13M MIM.",
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
      "Ronin is the Ethereum sidechain powering Axie Infinity. Its bridge required 5-of-9 validator signatures for withdrawals. In late 2021, Lazarus Group phished Sky Mavis employees, gaining access to four validator keys. A fifth key had been temporarily granted to Axie DAO during a high-traffic period but never revoked. On March 23, 2022, using all five compromised keys, attackers forged two massive withdrawal transactions — the theft went undetected for six days.",
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
  // TMM (April 4, 2026)
  {
    id: "tmm-2026",
    slug: "tmm-2026",
    title: "TMM",
    subtitle: "Reserve Manipulation via Burn + Stale Pool Reserves",
    year: 2026,
    chain: "BNB Chain",
    type: ["Flash Loan", "Price Manipulation", "Logic Error"],
    shortDesc: "Flash-loan attacker burned tokens to a dead address to inflate pool reserves, exploiting stale reserve reads for a $1.665M drain on BSC.",
    longDesc: "On April 4, 2026, TMM on BNB Chain lost approximately $1.665M to a reserve manipulation attack. The attacker used flash loans to acquire large token balances, burned tokens directly to a dead address to skew the pool's reserve accounting, and exploited stale reserve values that were not updated atomically with the burn. The inflated reserves enabled swaps at manipulated prices, draining liquidity before the flash loan was repaid.",
    technicalDesc: "The root cause was a reserve-accounting desync: pool balances changed after a burn to 0xdead, but reserve state used for pricing was not atomically updated. The vulnerable pattern was relying on cached `getReserves()` during swap execution while allowing direct token balance changes that bypass reserve sync. The attacker used flash-loaned capital, burned tokens to distort balance-to-reserve ratios, then traded against stale reserves in the same transaction bundle. Validation failed because swap checks trusted stale reserve snapshots instead of current balances or post-mutation sync state. Standard slippage controls did not stop the exploit because the manipulated state existed intra-block and looked locally consistent. Auditors should hunt for reserve-versus-balance divergence paths, unsynced transfer/burn side effects, and missing invariant checks around AMM reserve updates.",
    impact: "$1.665M",
    impactUSD: 1665000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Flash Loan", description: "Borrowed large token amounts via flash loan on BSC.", functionsCall: ["PancakeSwap.flashLoan()"], pseudocode: "// Seed capital for reserve manipulation" },
      { id: "t2", phase: "Burn to Dead Address", description: "Burned tokens to dead address to skew pool balance accounting.", functionsCall: ["Token.transfer(0xdead, amount)"], pseudocode: "// Pool balance changes but reserves stale" },
      { id: "t3", phase: "Stale Reserve Exploit", description: "Swapped against stale getReserves() values reflecting pre-burn state.", functionsCall: ["Pair.swap(out, attacker)"], pseudocode: "// Reserve ratio distorted\n// Swap extracts excess value" },
      { id: "t4", phase: "Drain", description: "Extracted $1.665M from LP liquidity before repaying flash loan.", functionsCall: ["Pair.swap(repeat)", "FlashLoan.repay()"], pseudocode: "// Profit retained after repayment" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Flash loan funded", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "Flash Loan", detail: "BSC capital", x: 250, y: 100 },
        { id: "n3", type: "pool", label: "TMM Pool", detail: "Stale reserves", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$1.665M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "Flash loan", animated: true },
        { id: "e2", source: "n1", target: "n3", label: "Burn + swap", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Flash Loan\nCapital", type: "pool" },
      { id: "b", label: "TMM Pool\nStale Reserves", type: "vault" },
      { id: "c", label: "Attacker\n$1.665M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1.67, label: "Burn manipulation" },
      { source: "b", target: "c", value: 1.67, label: "Swap drain" }
    ],
    mitigations: [
      { category: "Reserve Sync", description: "Call sync() or update reserves atomically after any balance-changing operation including burns and direct transfers." },
      { category: "Flash Loan Guards", description: "Detect same-block reserve mutations and block swaps when reserves diverge from actual balances." },
      { category: "Invariant Checks", description: "Enforce constant-product or TWAP bounds on swaps to reject manipulated reserve ratios." }
    ],
    quiz: [
      {
        question: "What was the primary root cause in TMM?",
        options: ["Compromised admin key", "Reserve desync after burn-induced balance mutation", "Oracle downtime", "Unchecked delegatecall"],
        correct: 1,
        explanation: "Burning to a dead address changed balances without synchronizing reserves, so pricing logic trusted stale reserve data.",
      },
      {
        question: "How did the attacker realize profit in one transaction?",
        options: ["Borrow flash liquidity, distort reserves, swap at stale prices, repay loan", "Mint governance tokens and vote treasury transfer", "Exploit reentrancy in withdraw()", "Hijack DNS and steal signatures"],
        correct: 0,
        explanation: "The exploit chained flash capital, burn-based distortion, stale-reserve swaps, and flash-loan repayment atomically.",
      },
      {
        question: "Which mitigation is most effective for this class of AMM bug?",
        options: ["Increase UI slippage defaults", "Block all flash loans globally", "Enforce atomic reserve sync and reserve-balance invariant checks", "Hide pool addresses from explorers"],
        correct: 2,
        explanation: "Atomic sync and hard invariants prevent swaps from executing when reserves and balances diverge.",
      },
    ]
  },

  // Dango (April 13-14, 2026)
  {
    id: "dango-2026",
    slug: "dango-2026",
    title: "Dango",
    subtitle: "Insurance Fund Donation Missing Amount Check",
    year: 2026,
    chain: "Multi-chain",
    type: ["Logic Error", "Access Control"],
    shortDesc: "Missing positive-amount validation in insurance fund donation logic let an attacker move $1.9M ($410K bridged); white hat returned all funds.",
    longDesc: "Between April 13-14, 2026, Dango Protocol was exploited for approximately $1.9M through a flaw in its insurance fund donation mechanism. The donation function failed to validate that the donated amount was positive, allowing crafted transactions to drain insurance reserves. Roughly $410K was bridged cross-chain before the attacker, acting as a white hat, fully returned all stolen funds.",
    technicalDesc: "Dango's loss came from missing amount-domain validation in insurance donation logic, where inputs were accepted without enforcing a positive amount. The vulnerable pattern was accounting code that allowed zero or negative values to flow into balance updates. The attacker crafted donation calls that inverted bookkeeping semantics, causing protocol reserves to decrease while attacker credit increased. Exploitation was straightforward: send malformed donation parameters, repeat drains, then bridge part of proceeds cross-chain. Checks failed because input validation and invariants were both incomplete, so nonsensical values were treated as legitimate state transitions. Auditors should review signed-versus-unsigned assumptions, test negative/zero boundaries in fee and donation paths, and assert that insurance funds cannot decrease except through explicitly authorized withdrawal logic.",
    impact: "$1.9M (fully returned)",
    impactUSD: 1900000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Vulnerability Discovery", description: "Attacker identified missing positive-amount check in insurance fund donation.", functionsCall: [], pseudocode: "// donate() accepts amount without > 0 check" },
      { id: "t2", phase: "Fund Drain", description: "Crafted donation transactions drained $1.9M from insurance fund.", functionsCall: ["InsuranceFund.donate(malicious_amount)"], pseudocode: "// Accounting inverted via invalid amount" },
      { id: "t3", phase: "Cross-Chain Bridge", description: "Attacker bridged approximately $410K to another chain.", functionsCall: ["Bridge.transfer($410K)"], pseudocode: "// Partial funds moved cross-chain" },
      { id: "t4", phase: "White Hat Return", description: "Attacker returned all $1.9M to the protocol as a white hat.", functionsCall: ["Attacker.returnFunds(all)"], pseudocode: "// Full recovery — no net loss" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "White Hat", detail: "Exploit + return", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Insurance Fund", detail: "Missing amount check", x: 300, y: 200 },
        { id: "n3", type: "bridge", label: "Bridge", detail: "$410K moved", x: 500, y: 100 },
        { id: "n4", type: "result", label: "Full Return", detail: "$0 net loss", x: 700, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Exploit donation", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Bridge $410K" },
        { id: "e3", source: "n1", target: "n4", label: "Return all funds" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Insurance\nFund", type: "vault" },
      { id: "b", label: "Attacker\n$1.9M", type: "attacker" },
      { id: "c", label: "Bridge\n$410K", type: "bridge" },
      { id: "d", label: "Protocol\nRecovered", type: "vault" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1.9, label: "Drain" },
      { source: "b", target: "c", value: 0.41, label: "Bridged" },
      { source: "b", target: "d", value: 1.9, label: "Returned" }
    ],
    mitigations: [
      { category: "Input Validation", description: "Require amount > 0 on all donation and transfer functions. Revert on zero or negative values." },
      { category: "Invariant Testing", description: "Add fuzz tests ensuring insurance fund balance never decreases without authorized withdrawal." },
      { category: "Bug Bounty", description: "Maintain active bug bounty to incentivize white-hat disclosure over exploitation." }
    ],
    quiz: [
      {
        question: "What bug enabled the Dango incident?",
        options: ["Missing positive-amount validation in donation accounting", "Outdated price oracle heartbeat", "Bridge validator key leak", "Signature malleability in ECDSA"],
        correct: 0,
        explanation: "The donation flow failed to require amount > 0, enabling malicious accounting inversion.",
      },
      {
        question: "What attack mechanism drained protocol funds?",
        options: ["Repeating malformed donation calls to credit attacker and debit insurance reserves", "Reentering claim() before state update", "Spoofing DNS records for frontend", "Hijacking sequencer ordering"],
        correct: 0,
        explanation: "The attacker abused malformed donation inputs to repeatedly shift value out of the insurance pool.",
      },
      {
        question: "What is the best mitigation strategy?",
        options: ["Add stricter UI form validation only", "Require amount > 0 plus invariant tests that reserve balance cannot decrease unexpectedly", "Disable bridging permanently", "Increase gas limit for donation calls"],
        correct: 1,
        explanation: "Contract-level validation and invariants are required; UI checks alone are bypassable.",
      },
    ]
  },

  // CoW Swap (April 14, 2026)
  {
    id: "cow-swap-2026",
    slug: "cow-swap-2026",
    title: "CoW Swap",
    subtitle: "DNS Registrar Social Engineering",
    year: 2026,
    chain: "Ethereum",
    chains: ["Ethereum"],
    type: ["Supply Chain", "Access Control"],
    shortDesc: "DNS hijack via Gandi/Traficom social engineering redirected CoW Swap frontend, stealing $1.2M — not a smart contract exploit.",
    longDesc: "On April 14, 2026, CoW Swap suffered a $1.2M theft through DNS registrar social engineering, not a smart contract vulnerability. Attackers compromised the domain registration chain involving Gandi and Traficom (.fi registry), redirecting users from the legitimate CoW Swap frontend to a phishing site. Users who interacted with the malicious interface approved token transfers that drained their wallets.",
    technicalDesc: "This incident was a web-infrastructure compromise rather than a smart-contract flaw. The vulnerable pattern was over-trusting DNS and registrar security as a single control plane for transaction intent capture. Attackers socially engineered registrar and registry processes, changed name resolution, and redirected users to a convincing phishing frontend. Users then signed approvals and transaction payloads that were valid on-chain but malicious in intent, enabling token drains. Defensive checks failed because contracts cannot distinguish a signature captured on a hijacked domain from one signed on a legitimate UI, and registrar hardening controls were insufficient. Auditors should include off-chain threat modeling: registrar lock, DNSSEC, domain change monitoring, wallet-level transaction decoding, and emergency kill-switch communication plans for frontend compromise scenarios.",
    impact: "$1.2M",
    impactUSD: 1200000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Registrar Compromise", description: "Attacker socially engineered Gandi/Traficom to gain DNS control of CoW Swap domains.", functionsCall: [], pseudocode: "// Gandi account + Traficom .fi registry\n// Nameserver records changed" },
      { id: "t2", phase: "DNS Hijack", description: "Legitimate CoW Swap domain redirected to attacker-controlled phishing frontend.", functionsCall: [], pseudocode: "// Users resolve to malicious IP\n// SSL cert on phishing site" },
      { id: "t3", phase: "Phishing", description: "Fake frontend prompted users to approve tokens and sign malicious transactions.", functionsCall: ["ERC20.approve(attacker)", "Phishing.swap()"], pseudocode: "// UI mimics real CoW Swap\n// Drains approved tokens" },
      { id: "t4", phase: "Fund Extraction", description: "Attacker swept $1.2M from users who interacted with the hijacked domain.", functionsCall: ["Attacker.transferFrom(victims)"], pseudocode: "// $1.2M total stolen\n// No smart contract bug" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "DNS social engineering", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Gandi/Traficom", detail: "Registrar compromise", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "Phishing Frontend", detail: "Fake CoW Swap UI", x: 450, y: 200 },
        { id: "n4", type: "result", label: "User Wallets", detail: "$1.2M drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Social engineer" },
        { id: "e2", source: "n2", target: "n3", label: "DNS redirect", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Phish approvals", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "User\nWallets", type: "vault" },
      { id: "b", label: "Phishing\nFrontend", type: "attacker" },
      { id: "c", label: "Attacker\n$1.2M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1.2, label: "Malicious approvals" },
      { source: "b", target: "c", value: 1.2, label: "Sweep" }
    ],
    mitigations: [
      { category: "DNS Security", description: "Enable DNSSEC, registry lock, and multi-factor authentication on all domain registrar accounts." },
      { category: "Transaction Verification", description: "Users should verify contract addresses and use hardware wallets that display decoded calldata." },
      { category: "Domain Monitoring", description: "Monitor DNS records continuously and alert on any nameserver or A-record changes." }
    ],
    quiz: [
      {
        question: "What was the real root cause in the CoW Swap case?",
        options: ["AMM arithmetic overflow", "DNS/registrar social engineering leading to frontend hijack", "Bridge replay bug", "Proxy storage collision"],
        correct: 1,
        explanation: "The theft came from DNS hijack and phishing flow, not an on-chain contract bug.",
      },
      {
        question: "How were user funds actually stolen?",
        options: ["Users signed malicious approvals and transfers on a fake frontend", "Validators censored legitimate withdrawals", "A flash loan drained LP reserves", "Gas griefing forced failed swaps"],
        correct: 0,
        explanation: "The attacker harvested valid user signatures through a hijacked interface and executed token drains.",
      },
      {
        question: "Which mitigation most directly reduces this risk?",
        options: ["Registrar lock + DNSSEC + real-time DNS change alerts", "Raise pool swap fees", "Disable ERC-20 approvals", "Increase block confirmations"],
        correct: 0,
        explanation: "Hardening registrar and DNS controls is the direct defense against this attack vector.",
      },
    ]
  },

  // Grinex (April 16, 2026)
  {
    id: "grinex-2026",
    slug: "grinex-2026",
    title: "Grinex",
    subtitle: "Hot Wallet Drain — Foreign Actor Attribution",
    year: 2026,
    chain: "Multi-chain",
    type: ["Access Control"],
    shortDesc: "Grinex exchange hot wallets drained for $13.7M–$15M; exchange attributed the attack to foreign state actors.",
    longDesc: "On April 16, 2026, Russian cryptocurrency exchange Grinex suffered a hot wallet compromise resulting in losses estimated between $13.7M and $15M. The exchange publicly attributed the incident to foreign actors. Attackers gained access to hot wallet private keys and swept funds across multiple chains before the exchange could freeze remaining assets.",
    technicalDesc: "Grinex suffered an operational key-control failure in hot wallet infrastructure rather than a contract exploit. The vulnerable pattern was concentration of spend authority in internet-exposed signing systems with limited withdrawal friction. After obtaining key material or signer access, the attacker initiated rapid multi-chain transfers from exchange-controlled wallets. The attack succeeded because transactional controls were reactive: outflow detection and freeze actions occurred after significant value had already moved. Integrity checks failed at the custody layer, not at protocol logic, so on-chain transfers were valid but unauthorized from a business perspective. Auditors should inspect exchange security architecture, including HSM/MPC usage, withdrawal velocity limits, anomaly-triggered pause controls, and strict segregation between hot-wallet liquidity and long-term reserves.",
    impact: "$13.7M–$15M",
    impactUSD: 13700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Infrastructure Access", description: "Attackers gained access to Grinex hot wallet signing infrastructure.", functionsCall: [], pseudocode: "// Hot wallet key compromise\n// Attributed to foreign actors" },
      { id: "t2", phase: "Multi-Chain Sweep", description: "Funds drained from hot wallets across multiple blockchain networks.", functionsCall: ["HotWallet.transfer(all_chains)"], pseudocode: "// Rapid outbound transfers\n// $13.7M–$15M extracted" },
      { id: "t3", phase: "Detection", description: "Exchange detected anomalous outflows and initiated emergency response.", functionsCall: [], pseudocode: "// Remaining wallets frozen\n// Incident response activated" },
      { id: "t4", phase: "Attribution", description: "Grinex publicly attributed the attack to foreign state actors.", functionsCall: [], pseudocode: "// Law enforcement notified\n// Security overhaul initiated" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Foreign Actors", detail: "Attributed by exchange", x: 50, y: 200 },
        { id: "n2", type: "vault", label: "Grinex Hot Wallets", detail: "$13.7M–$15M", x: 350, y: 200 },
        { id: "n3", type: "bridge", label: "Multi-Chain", detail: "Cross-chain sweep", x: 550, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Funds extracted", x: 750, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Key compromise", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Sweep funds" },
        { id: "e3", source: "n3", target: "n4", label: "Extract", animated: true }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Grinex\nHot Wallets", type: "vault" },
      { id: "b", label: "Multi-Chain\nSweep", type: "bridge" },
      { id: "c", label: "Attacker\n$13.7M+", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 13.7, label: "Drain" },
      { source: "b", target: "c", value: 13.7, label: "Extract" }
    ],
    mitigations: [
      { category: "Cold Storage", description: "Keep majority of funds in multi-sig cold storage with minimal hot wallet balances." },
      { category: "HSM / MPC", description: "Use hardware security modules or MPC for hot wallet key management instead of software keys." },
      { category: "Withdrawal Limits", description: "Enforce rate limits and anomaly detection on outbound hot wallet transfers." }
    ],
    quiz: [
      {
        question: "Which category best describes the Grinex root cause?",
        options: ["Smart-contract reentrancy", "Operational hot-wallet key compromise", "Cross-chain proof forgery", "MEV sandwiching"],
        correct: 1,
        explanation: "The core failure was compromised wallet signing infrastructure, not contract code.",
      },
      {
        question: "What was the attacker’s primary mechanism?",
        options: ["Forging governance proposals", "Executing fast outbound transfers across chains using compromised custody access", "Minting unbacked wrapped assets", "Manipulating TWAP oracles"],
        correct: 1,
        explanation: "Once signing control was obtained, the attacker simply swept assets through valid transfer calls.",
      },
      {
        question: "What mitigation is most important for similar exchanges?",
        options: ["Use larger UI warning banners", "Store all funds in one hot wallet", "Adopt HSM/MPC plus withdrawal rate limits and anomaly auto-freeze", "Increase token decimals"],
        correct: 2,
        explanation: "Custody hardening and transfer controls reduce both key theft impact and time-to-containment.",
      },
    ]
  },

  // Volo Protocol (April 21, 2026)
  {
    id: "volo-protocol-2026",
    slug: "volo-protocol-2026",
    title: "Volo Protocol",
    subtitle: "Admin Key Compromise via Social Engineering",
    year: 2026,
    chain: "Sui",
    chains: ["Sui"],
    type: ["Access Control"],
    shortDesc: "Admin private key stolen via social engineering drained $3.5M on Sui; ~90% recovered, net loss ~$200K.",
    longDesc: "On April 21, 2026, Volo Protocol on Sui lost approximately $3.5M gross when an admin private key was compromised through social engineering. The attacker used the key to execute unauthorized protocol operations and drain vault assets. Through rapid response and negotiation, the protocol recovered roughly 90% of funds, leaving a net loss of approximately $200K.",
    technicalDesc: "Volo's exploit stemmed from admin key compromise through social-engineering, making privileged control the single point of failure. The vulnerable surface was privileged administrative functions capable of moving vault assets without layered authorization. After obtaining the key, the attacker executed authorized-by-key but unauthorized-by-intent admin withdrawals and asset redirects. Checks failed because the protocol trusted one credential path and lacked mandatory timelock or multisig friction for high-impact admin actions. Recovery was possible only after incident response and fund negotiation, not because on-chain controls blocked abuse. Auditors should prioritize role-risk mapping, enforce multi-party control for treasury-critical functions, and test whether any one compromised key can instantly execute irreversible asset movement.",
    impact: "$3.5M gross (~$200K net)",
    impactUSD: 3500000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Social Engineering", description: "Attacker obtained admin private key via social engineering attack.", functionsCall: [], pseudocode: "// Phishing or impersonation\n// Admin key exfiltrated" },
      { id: "t2", phase: "Unauthorized Operations", description: "Admin key used to execute privileged vault withdrawals on Sui.", functionsCall: ["Volo.admin_withdraw(all)"], pseudocode: "// $3.5M gross drained" },
      { id: "t3", phase: "Recovery", description: "Protocol recovered approximately 90% of stolen funds.", functionsCall: [], pseudocode: "// Negotiation + on-chain recovery\n// ~$3.15M returned" },
      { id: "t4", phase: "Net Loss", description: "Final net loss approximately $200K after recovery efforts.", functionsCall: [], pseudocode: "// Admin key rotated\n// Security review initiated" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Social engineering", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Admin Key", detail: "Compromised", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "Volo Vault", detail: "$3.5M gross", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Net Loss", detail: "~$200K", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Social engineer" },
        { id: "e2", source: "n2", target: "n3", label: "Admin drain", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "90% recovered" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Volo Vault\n$3.5M", type: "vault" },
      { id: "b", label: "Attacker\nDrained", type: "attacker" },
      { id: "c", label: "Recovered\n~90%", type: "vault" },
      { id: "d", label: "Net Loss\n~$200K", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 3.5, label: "Admin drain" },
      { source: "b", target: "c", value: 3.15, label: "Recovered" },
      { source: "b", target: "d", value: 0.2, label: "Net loss" }
    ],
    mitigations: [
      { category: "Multi-Sig Admin", description: "Replace single admin keys with M-of-N multi-sig for all privileged operations." },
      { category: "Social Engineering Training", description: "Train team members to verify identity of any party requesting key access or sensitive operations." },
      { category: "Timelock", description: "Add timelock delays on admin withdrawals to allow detection and cancellation." }
    ],
    quiz: [
      {
        question: "What was the direct root cause in Volo?",
        options: ["Price oracle staleness", "Social-engineered admin key compromise", "Nonce reuse in signatures", "Integer underflow in vault math"],
        correct: 1,
        explanation: "The attacker gained admin private-key access and used privileged flows to drain funds.",
      },
      {
        question: "How did the attacker move funds after compromise?",
        options: ["By exploiting slippage checks", "By calling privileged admin withdrawal/redirection operations", "By poisoning keeper jobs", "By using a reentrancy loop"],
        correct: 1,
        explanation: "The exploit path was direct use of legitimate admin powers with stolen credentials.",
      },
      {
        question: "Which mitigation best addresses this class of failure?",
        options: ["Timelocked multisig for admin actions and strict signer operational security", "Disable token swaps", "Lower gas price on admin txs", "Use larger block confirmations"],
        correct: 0,
        explanation: "Multisig + timelock reduces single-key blast radius and gives response time.",
      },
    ]
  },

  // GiddyDeFi (April 23, 2026)
  {
    id: "giddy-defi-2026",
    slug: "giddy-defi-2026",
    title: "GiddyDeFi",
    subtitle: "EIP-712 Signature Replay — Unsigned Fields",
    year: 2026,
    chain: "Ethereum",
    type: ["Logic Error", "Access Control"],
    shortDesc: "EIP-712 signature replay on GiddyVaultV3: aggregator, fromToken, toToken, and amount were not signed, draining $1.3M.",
    longDesc: "On April 23, 2026, GiddyDeFi's GiddyVaultV3 on Ethereum lost $1.3M to an EIP-712 signature replay attack. The signed message omitted critical fields — aggregator, fromToken, toToken, and amount — allowing an attacker to reuse a valid signature with different swap parameters to drain vault assets.",
    technicalDesc: "The root cause was incomplete EIP-712 domain coverage: critical execution parameters were omitted from the signed struct. The vulnerable pattern was signature validation that checked authenticity of a message but not integrity of all mutable fields used at execution time. An attacker reused a valid signature while changing aggregator route, token pair, and amount, so signature recovery still passed. Replay succeeded because unsigned parameters remained attacker-controlled and nonce semantics did not protect altered payload variants. Security checks failed at schema design, not cryptography, since the hash did exactly what it was asked to sign. Auditors should diff every execution input against typed-data fields, require nonces/deadlines, and reject any architecture where meaningful calldata can vary outside the signed commitment.",
    impact: "$1.3M",
    impactUSD: 1300000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Signature Capture", description: "Attacker obtained a valid EIP-712 signature from a legitimate vault operation.", functionsCall: [], pseudocode: "// Signature missing aggregator/tokens/amount" },
      { id: "t2", phase: "Parameter Substitution", description: "Replayed signature with different fromToken, toToken, amount, and aggregator.", functionsCall: ["GiddyVaultV3.executeSwap(replayed_sig, malicious_params)"], pseudocode: "// Unsigned fields modified freely\n// Signature still validates" },
      { id: "t3", phase: "Vault Drain", description: "Repeated replays extracted $1.3M from GiddyVaultV3.", functionsCall: ["GiddyVaultV3.executeSwap(repeat)"], pseudocode: "// Multiple swaps with same signature\n// $1.3M total drained" },
      { id: "t4", phase: "Protocol Pause", description: "GiddyDeFi paused vault operations and patched signature schema.", functionsCall: ["GiddyVaultV3.pause()"], pseudocode: "// All fields now included in EIP-712 struct" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Signature replay", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "EIP-712 Signature", detail: "Missing fields", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "GiddyVaultV3", detail: "$1.3M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Capture signature" },
        { id: "e2", source: "n2", target: "n3", label: "Replay with new params", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Extract $1.3M" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Valid\nSignature", type: "vault" },
      { id: "b", label: "GiddyVaultV3\nReplay", type: "vault" },
      { id: "c", label: "Attacker\n$1.3M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1.3, label: "Replay" },
      { source: "b", target: "c", value: 1.3, label: "Drain" }
    ],
    mitigations: [
      { category: "Complete EIP-712 Struct", description: "Include all execution parameters (aggregator, fromToken, toToken, amount, nonce, deadline) in the signed typed data." },
      { category: "Nonce / Replay Protection", description: "Use per-signer nonces and reject reused signatures even with identical parameters." },
      { category: "Signature Audit", description: "Audit all EIP-712 schemas to ensure no mutable fields exist outside the signed struct." }
    ],
    quiz: [
      {
        question: "What was the key root-cause flaw in GiddyVaultV3?",
        options: ["Broken secp256k1 precompile", "Critical swap fields excluded from EIP-712 signed data", "Chain ID not available on Ethereum", "Unchecked external call return value"],
        correct: 1,
        explanation: "Aggregator, token addresses, and amount were not fully bound by the signature schema.",
      },
      {
        question: "How did the replay attack work in practice?",
        options: ["Attacker reused one valid signature while substituting unsigned swap parameters", "Attacker brute-forced a private key", "Attacker drained by repeated selfdestruct", "Attacker manipulated bridge relayers"],
        correct: 0,
        explanation: "Because key parameters were unsigned, modified executions still passed signature checks.",
      },
      {
        question: "Best mitigation for EIP-712 authorization bugs?",
        options: ["Use shorter signatures", "Include all execution fields plus nonce and deadline in typed data", "Move signing to frontend only", "Disable calldata encoding"],
        correct: 1,
        explanation: "Complete message binding prevents parameter substitution and replay variants.",
      },
    ]
  },

  // Purrlend (April 25, 2026)
  {
    id: "purrlend-2026",
    slug: "purrlend-2026",
    title: "Purrlend",
    subtitle: "Multisig Bridge Role Added — mintUnbacked",
    year: 2026,
    chain: "HyperEVM/MegaETH",
    type: ["Access Control", "Bridge"],
    shortDesc: "Attacker added themselves as 2-of-3 multisig bridge signer and called mintUnbacked, draining $1.52M on HyperEVM/MegaETH.",
    longDesc: "On April 25, 2026, Purrlend on HyperEVM/MegaETH lost $1.52M when an attacker gained bridge multisig privileges and minted unbacked tokens. The attacker added themselves as a signer on the 2-of-3 multisig bridge role, then invoked mintUnbacked to create tokens without collateral backing and swapped them for real assets.",
    technicalDesc: "Purrlend failed at privileged bridge governance: signer control changes and unbacked mint authority were insufficiently constrained. The vulnerable functions were signer-management flows and `mintUnbacked`, which could create claimable value without hard collateral checks. The attacker obtained effective 2-of-3 signing power, authorized unbacked minting, and immediately swapped minted assets for real liquidity. Controls failed because signer onboarding lacked timelock/governance friction and mint logic trusted signer quorum alone as proof of legitimacy. Once mint authority was abused, market liquidation converted synthetic value into real assets before intervention. Auditors should treat bridge signer topology as critical logic, verify signer-change guardrails, enforce per-epoch mint caps, and require on-chain collateral/proof validation even for quorum-approved mints.",
    impact: "$1.52M",
    impactUSD: 1520000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Multisig Access", description: "Attacker added themselves as a signer on the 2-of-3 bridge multisig.", functionsCall: ["Bridge.addSigner(attacker)"], pseudocode: "// 2-of-3 threshold now reachable" },
      { id: "t2", phase: "mintUnbacked", description: "Used multisig authority to mint unbacked bridge tokens.", functionsCall: ["Bridge.mintUnbacked(large_amount)"], pseudocode: "// No collateral backing required\n// Unbacked tokens created" },
      { id: "t3", phase: "DEX Swap", description: "Swapped unbacked tokens for real assets on HyperEVM/MegaETH DEXs.", functionsCall: ["DEX.swap(unbacked, real_assets)"], pseudocode: "// $1.52M extracted" },
      { id: "t4", phase: "Bridge Pause", description: "Purrlend paused bridge and revoked malicious signer.", functionsCall: ["Bridge.pause()", "Bridge.removeSigner(attacker)"], pseudocode: "// Multisig rotation initiated" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Multisig signer", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "2-of-3 Bridge", detail: "Signer added", x: 250, y: 200 },
        { id: "n3", type: "bridge", label: "mintUnbacked", detail: "Unbacked tokens", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$1.52M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Add signer" },
        { id: "e2", source: "n2", target: "n3", label: "mintUnbacked", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Swap & drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Bridge\nMultisig", type: "multisig" },
      { id: "b", label: "Unbacked\nMint", type: "bridge" },
      { id: "c", label: "Attacker\n$1.52M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1.52, label: "mintUnbacked" },
      { source: "b", target: "c", value: 1.52, label: "DEX swap" }
    ],
    mitigations: [
      { category: "Signer Governance", description: "Require timelock and existing signer approval to add new multisig members." },
      { category: "Mint Limits", description: "Cap mintUnbacked amounts and require collateral proof for large mints." },
      { category: "Monitoring", description: "Alert on any mintUnbacked call or new signer addition to bridge multisig." }
    ],
    quiz: [
      {
        question: "What governance weakness was central to the Purrlend exploit?",
        options: ["Permissionless lending market creation", "Unsafe signer control over bridge multisig and unbacked mint authority", "TWAP oracle lag", "Reentrancy in borrow()"],
        correct: 1,
        explanation: "Attacker-controlled signer authority enabled `mintUnbacked` misuse.",
      },
      {
        question: "What attack sequence generated realized profit?",
        options: ["Manipulate oracle then liquidate debt", "Gain multisig authority, mint unbacked tokens, dump via DEX", "Drain via DNS spoofing", "Replay permit signatures across chains"],
        correct: 1,
        explanation: "The attacker converted unauthorized mint capacity into market-sold assets.",
      },
      {
        question: "Which mitigation is most robust?",
        options: ["Hide signer addresses from public explorers", "Require timelocked signer changes and collateral/proof checks for minting", "Increase token symbol length", "Turn off swap routes temporarily"],
        correct: 1,
        explanation: "Signer governance controls and collateralized mint validation close both exploit stages.",
      },
    ]
  },

  // Aftermath Finance (April 29, 2026)
  {
    id: "aftermath-finance-2026",
    slug: "aftermath-finance-2026",
    title: "Aftermath Finance",
    subtitle: "Negative Integrator Fee in Perps",
    year: 2026,
    chain: "Sui",
    chains: ["Sui"],
    type: ["Logic Error", "Math Bug"],
    shortDesc: "Negative integrator fee flaw in Aftermath perps allowed fee manipulation, draining $1.14M on Sui.",
    longDesc: "On April 29, 2026, Aftermath Finance on Sui lost $1.14M due to a negative integrator fee vulnerability in its perpetuals engine. The fee calculation logic failed to enforce non-negative integrator fees, allowing an attacker to set negative fees that credited their account while debiting the protocol's insurance fund.",
    technicalDesc: "Aftermath's perps engine accepted negative integrator fees, turning a cost term into an attacker subsidy. The vulnerable pattern was signed fee arithmetic without domain constraints, allowing values below zero to propagate into payout calculations. The attacker configured negative fees, executed repetitive open/close trade cycles, and accumulated credits debited from protocol reserves. Checks failed because the system validated trade execution but did not enforce fee non-negativity or cap-derived balance invariants. As a result, each legitimate trade call produced illegitimate accounting outcomes that drained insurance funds over time. Auditors should enforce strict fee bounds, fuzz signed-number edge cases, and assert invariants such as fee flows never creating protocol-negative revenue from neutral trade activity.",
    impact: "$1.14M",
    impactUSD: 1140000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Fee Parameter Discovery", description: "Attacker found integrator fee accepts negative values in perps engine.", functionsCall: [], pseudocode: "// integratorFee lacks >= 0 check" },
      { id: "t2", phase: "Negative Fee Setup", description: "Configured negative integrator fee to receive credits on each trade.", functionsCall: ["Perps.setIntegratorFee(negative_value)"], pseudocode: "// Each trade credits attacker\n// Protocol debited" },
      { id: "t3", phase: "Leveraged Trades", description: "Executed repeated perps trades to accumulate fee credits.", functionsCall: ["Perps.openPosition(repeat)", "Perps.closePosition(repeat)"], pseudocode: "// Fee credits compound\n// Insurance fund drained" },
      { id: "t4", phase: "Extraction", description: "Withdrew $1.14M in accumulated credits from the protocol.", functionsCall: ["Perps.withdraw(credits)"], pseudocode: "// $1.14M total extracted" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Negative fee exploit", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Integrator Fee", detail: "No >= 0 check", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "Perps Insurance", detail: "$1.14M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Set negative fee" },
        { id: "e2", source: "n2", target: "n3", label: "Trade credits", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Withdraw $1.14M" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Perps\nEngine", type: "vault" },
      { id: "b", label: "Negative Fee\nCredits", type: "pool" },
      { id: "c", label: "Attacker\n$1.14M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1.14, label: "Fee manipulation" },
      { source: "b", target: "c", value: 1.14, label: "Withdraw" }
    ],
    mitigations: [
      { category: "Fee Validation", description: "Enforce integratorFee >= 0 and maximum fee caps at the contract level." },
      { category: "Invariant Checks", description: "Verify protocol balance never decreases due to fee calculations alone." },
      { category: "Parameter Governance", description: "Require governance approval for integrator fee changes above threshold." }
    ],
    quiz: [
      {
        question: "What was the mathematical root cause in Aftermath perps?",
        options: ["Integrator fee accepted negative values", "Oracle median too slow", "Missed safeTransfer return check", "Improper decimals conversion only"],
        correct: 0,
        explanation: "Allowing negative fees inverted expected economics and paid the attacker per trade.",
      },
      {
        question: "How did the attacker scale extraction?",
        options: ["Single one-time withdrawal", "Repeated leveraged trade cycles to harvest negative-fee credits", "Bridge proof replay", "Multisig ownership takeover"],
        correct: 1,
        explanation: "The exploit was repeated execution of valid trades that generated invalid fee credits.",
      },
      {
        question: "Most appropriate mitigation?",
        options: ["Force all fees to 18 decimals", "Require fee >= 0 with hard caps and insurance-balance invariants", "Disable short positions permanently", "Increase block gas target"],
        correct: 1,
        explanation: "Bounded fee domains plus accounting invariants prevent negative-fee abuse.",
      },
    ]
  },

  // Sweat Foundation (April 29, 2026)
  {
    id: "sweat-foundation-2026",
    slug: "sweat-foundation-2026",
    title: "Sweat Foundation",
    subtitle: "SWEAT Token Contract Vuln + Custom Drainer",
    year: 2026,
    chain: "NEAR",
    chains: ["NEAR"],
    type: ["Logic Error", "Access Control"],
    shortDesc: "SWEAT token contract vulnerability and custom drainer stole 13.71B SWEAT (~$2.5M) on NEAR; user balances restored.",
    longDesc: "On April 29, 2026, Sweat Foundation on NEAR suffered a $2.5M exploit targeting the SWEAT token contract. An attacker exploited a contract vulnerability combined with a custom drainer contract to extract 13.71 billion SWEAT tokens. The foundation subsequently restored affected user balances.",
    technicalDesc: "The SWEAT incident combined token-logic weakness with an automated drainer strategy that exploited approval and transfer semantics at scale. The vulnerable pattern was permissive token movement paths that let a helper contract batch-extract balances from exposed accounts or state configurations. The attacker deployed a custom drainer, targeted reachable balances through approval-compatible flows, and executed repeated pull operations to aggregate massive token outflow. Checks failed because privilege assumptions in token transfer pathways were too broad and high-velocity anomalous drains were not halted quickly enough. Even though restoration occurred later, prevention failed at authorization granularity and runtime monitoring. Auditors should review NEP-141 transfer/allowance edge cases, batch-drain abuse paths, and circuit-breaker triggers for abnormal fan-out transfers.",
    impact: "$2.5M (13.71B SWEAT, balances restored)",
    impactUSD: 2500000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Vulnerability Analysis", description: "Attacker identified flaw in SWEAT token contract transfer logic.", functionsCall: [], pseudocode: "// Token contract vuln identified\n// Custom drainer designed" },
      { id: "t2", phase: "Drainer Deployment", description: "Deployed custom drainer contract on NEAR to batch-extract SWEAT.", functionsCall: ["deploy(drainer_contract)"], pseudocode: "// Targets accounts with approvals\n// Batch drain logic" },
      { id: "t3", phase: "Token Extraction", description: "Drained 13.71B SWEAT tokens worth approximately $2.5M.", functionsCall: ["Drainer.drain(all_targets)"], pseudocode: "// 13.71B SWEAT extracted" },
      { id: "t4", phase: "Restoration", description: "Sweat Foundation paused contract and restored user balances.", functionsCall: ["SWEAT.pause()", "Foundation.restore(balances)"], pseudocode: "// User balances made whole\n// Contract patched" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Custom drainer", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "SWEAT Token", detail: "Contract vuln", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "Custom Drainer", detail: "Batch extract", x: 450, y: 200 },
        { id: "n4", type: "result", label: "13.71B SWEAT", detail: "$2.5M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Exploit vuln" },
        { id: "e2", source: "n1", target: "n3", label: "Deploy drainer", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Drain SWEAT" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "SWEAT Token\nContract", type: "vault" },
      { id: "b", label: "Custom\nDrainer", type: "attacker" },
      { id: "c", label: "13.71B SWEAT\n$2.5M", type: "drain" },
      { id: "d", label: "Users\nRestored", type: "vault" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 2.5, label: "Exploit" },
      { source: "b", target: "c", value: 2.5, label: "Drain" },
      { source: "c", target: "d", value: 2.5, label: "Restored" }
    ],
    mitigations: [
      { category: "Token Contract Audit", description: "Audit NEAR NEP-141 token implementations for transfer and approval edge cases." },
      { category: "Approval Hygiene", description: "Encourage users to revoke stale token approvals; implement permit expirations." },
      { category: "Circuit Breakers", description: "Add pause functionality and anomaly detection for large batch transfers." }
    ],
    quiz: [
      {
        question: "Which description best matches the Sweat Foundation root cause?",
        options: ["Pure oracle manipulation", "Token-contract authorization weakness abused by a custom drainer", "Bridge validator cartel attack", "UUPS storage collision"],
        correct: 1,
        explanation: "A token-level flaw plus a drainer contract enabled large-scale unauthorized extraction.",
      },
      {
        question: "What was the attacker’s mechanism for scale?",
        options: ["One oversized mint call", "Batch extraction via custom drainer against vulnerable/approved accounts", "Gas token refund exploit", "Miner bribery for censorship"],
        correct: 1,
        explanation: "The drainer automated repeated pull actions across many targets.",
      },
      {
        question: "What mitigation would most reduce recurrence risk?",
        options: ["Add stricter UI passwords", "Audit token auth logic, limit approval scope, and auto-pause on burst drains", "Rename the token contract", "Increase swap fees"],
        correct: 1,
        explanation: "Authorization hardening plus anomaly-based circuit breakers addresses both root cause and blast radius.",
      },
    ]
  },

  // Wasabi Protocol (April 30, 2026)
  {
    id: "wasabi-protocol-2026",
    slug: "wasabi-protocol-2026",
    title: "Wasabi Protocol",
    subtitle: "Deployer Key via Spring Boot Actuator Heap Dump",
    year: 2026,
    chain: "Multi-chain",
    type: ["Access Control", "Supply Chain"],
    shortDesc: "Compromised deployer key via exposed AWS Spring Boot Actuator heap dump enabled malicious UUPS upgrades, draining $5.9M across 4 chains.",
    longDesc: "On April 30, 2026, Wasabi Protocol lost $5.9M across four chains when an attacker compromised the deployer private key. The key was extracted from an exposed Spring Boot Actuator heap dump on an AWS-hosted backend. With deployer access and no multisig or timelock, the attacker pushed malicious UUPS proxy upgrades that drained protocol vaults.",
    technicalDesc: "Wasabi was compromised through backend exposure, where an unauthenticated Spring Boot Actuator heap dump leaked deployer secrets in memory. The vulnerable chain linked off-chain secret handling to on-chain upgrade authority, specifically UUPS `upgradeTo` control. The attacker retrieved the key from `/actuator/heapdump`, signed malicious upgrades, and replaced implementations with draining logic across multiple chains. Checks failed because upgrade governance depended on a single deployer path without multisig timelock, and infrastructure hardening did not restrict sensitive diagnostics endpoints. Contract-level permissions behaved as designed but were fed stolen credentials from an insecure operations layer. Auditors should include server-surface review, secret-in-memory exposure tests, and mandatory multi-party, delayed upgrade governance for any upgradeable proxy system.",
    impact: "$5.9M",
    impactUSD: 5900000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Heap Dump Exposure", description: "Attacker accessed exposed Spring Boot Actuator heap dump on AWS backend.", functionsCall: ["GET /actuator/heapdump"], pseudocode: "// Unauthenticated actuator endpoint\n// Deployer key in JVM heap" },
      { id: "t2", phase: "Key Extraction", description: "Parsed heap dump to recover deployer private key from memory.", functionsCall: [], pseudocode: "// Private key extracted from heap\n// Full deployer privileges obtained" },
      { id: "t3", phase: "Malicious UUPS Upgrade", description: "Upgraded proxy implementations to attacker-controlled contracts on 4 chains.", functionsCall: ["UUPS.upgradeTo(maliciousImpl)"], pseudocode: "// No multisig or timelock\n// Instant upgrade executed" },
      { id: "t4", phase: "Multi-Chain Drain", description: "Malicious implementations swept $5.9M from vaults across all deployed chains.", functionsCall: ["maliciousImpl.sweepAll()"], pseudocode: "// 4 chains drained\n// $5.9M total extracted" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Heap dump exploit", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Spring Boot Actuator", detail: "Exposed heap dump", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "UUPS Proxies", detail: "No timelock", x: 450, y: 200 },
        { id: "n4", type: "vault", label: "4-Chain Vaults", detail: "$5.9M", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Drained", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Heap dump", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Extract deployer key" },
        { id: "e3", source: "n3", target: "n4", label: "Malicious upgrade", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Sweep vaults" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "AWS Backend\nHeap Dump", type: "attacker" },
      { id: "b", label: "UUPS\nUpgrades", type: "vault" },
      { id: "c", label: "4-Chain\nVaults", type: "pool" },
      { id: "d", label: "Attacker\n$5.9M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 5.9, label: "Deployer key" },
      { source: "b", target: "c", value: 5.9, label: "Upgrade" },
      { source: "c", target: "d", value: 5.9, label: "Drain" }
    ],
    mitigations: [
      { category: "Actuator Security", description: "Disable or restrict Spring Boot Actuator endpoints in production. Never expose /heapdump publicly." },
      { category: "Upgrade Governance", description: "Require multisig and timelock on all UUPS proxy upgrades. Never store deployer keys in application memory." },
      { category: "Key Management", description: "Use HSM or KMS for signing keys. Never embed private keys in backend services." }
    ],
    quiz: [
      {
        question: "What was the initial compromise vector in Wasabi?",
        options: ["Reentrancy in vault withdrawal", "Exposed Actuator heap dump leaking deployer key", "Bridge replay from L2", "Incorrect token decimals"],
        correct: 1,
        explanation: "The attacker first obtained key material from an exposed backend diagnostic endpoint.",
      },
      {
        question: "How did that backend leak become an on-chain drain?",
        options: ["By forging oracle signatures", "By performing malicious UUPS upgrades using stolen deployer authority", "By front-running liquidations", "By bypassing ERC-20 allowance checks"],
        correct: 1,
        explanation: "Stolen deployer credentials enabled direct proxy upgrades to attacker-controlled logic.",
      },
      {
        question: "Which mitigation combination is strongest?",
        options: ["Disable logs only", "Keep deployer key on app server but rotate weekly", "Lock down Actuator endpoints and enforce multisig timelocked upgrades", "Increase gas price for upgrades"],
        correct: 2,
        explanation: "You must secure both the backend secret surface and the upgrade governance pathway.",
      },
    ]
  },

  // Ekubo Protocol (May 5, 2026)
  {
    id: "ekubo-protocol-2026",
    slug: "ekubo-protocol-2026",
    title: "Ekubo Protocol",
    subtitle: "Unauthenticated payCallback — Approval Drain",
    year: 2026,
    chain: "Ethereum/Arbitrum",
    type: ["Access Control", "Logic Error"],
    shortDesc: "Unauthenticated payCallback in Ekubo router extension let attacker drain ERC-20 approvals including 17 WBTC, totaling $1.4M.",
    longDesc: "On May 5, 2026, Ekubo Protocol on Ethereum and Arbitrum lost $1.4M when an attacker exploited an unauthenticated payCallback function in a router extension. Users who had approved the router had their ERC-20 tokens drained, including 17 WBTC, via crafted callback invocations that transferred approved balances to the attacker.",
    technicalDesc: "Ekubo's router extension exposed an unauthenticated callback path that could trigger token pulls from user allowances. The vulnerable function pattern was `payCallback` executing `transferFrom`-style movements without strict caller verification. The attacker scanned for wallets with existing router approvals, invoked callback calls directly, and redirected approved assets to attacker addresses. Checks failed because callback trust assumptions were implicit: approval presence was treated as consent even when invocation origin was arbitrary. Unlimited or stale allowances amplified impact, turning one auth gap into multi-victim drainage across chains. Auditors should verify callback caller allowlists, ensure approval consumption is context-bound to active trades, and test hostile direct invocation of every externally callable settlement hook.",
    impact: "$1.4M (17 WBTC)",
    impactUSD: 1400000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Approval Scanning", description: "Attacker scanned for users with active ERC-20 approvals to Ekubo router.", functionsCall: ["allowance scan"], pseudocode: "// Users with stale approvals\n// Including 17 WBTC holder" },
      { id: "t2", phase: "payCallback Exploit", description: "Called unauthenticated payCallback to trigger approval-based transfers.", functionsCall: ["RouterExtension.payCallback(malicious_params)"], pseudocode: "// No caller auth check\n// transferFrom via approval" },
      { id: "t3", phase: "Token Drain", description: "Drained approved tokens including 17 WBTC across Ethereum and Arbitrum.", functionsCall: ["ERC20.transferFrom(victim, attacker, amount)"], pseudocode: "// $1.4M total drained\n// Multiple victims" },
      { id: "t4", phase: "Mitigation", description: "Ekubo patched payCallback with authentication and urged approval revocations.", functionsCall: ["RouterExtension.patch()"], pseudocode: "// Caller auth added\n// Users revoke approvals" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Approval drain", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "payCallback", detail: "No auth", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "User Approvals", detail: "17 WBTC+", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$1.4M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Call payCallback", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "transferFrom" },
        { id: "e3", source: "n3", target: "n4", label: "Drain approvals" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "User\nApprovals", type: "vault" },
      { id: "b", label: "payCallback\nExploit", type: "attacker" },
      { id: "c", label: "Attacker\n$1.4M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1.4, label: "transferFrom" },
      { source: "b", target: "c", value: 1.4, label: "17 WBTC+" }
    ],
    mitigations: [
      { category: "Callback Authentication", description: "Restrict payCallback to authorized callers only — verify msg.sender against expected router or pool." },
      { category: "Approval Minimization", description: "Use permit-based exact-amount approvals or ERC-20 allowance expirations instead of unlimited approvals." },
      { category: "User Education", description: "Prompt users to revoke stale approvals after swap completion." }
    ],
    quiz: [
      {
        question: "What root cause made Ekubo users vulnerable?",
        options: ["Incorrect block timestamp math", "Unauthenticated callback capable of spending approved tokens", "Merkle proof underflow", "Sequencer downtime"],
        correct: 1,
        explanation: "Anyone could invoke callback logic that consumed existing allowances.",
      },
      {
        question: "How did the attacker select and drain victims?",
        options: ["By compromising hardware wallets", "By scanning for live approvals, then triggering malicious callback-driven transfers", "By forcing users into liquidation", "By forging staking rewards"],
        correct: 1,
        explanation: "The exploit targeted accounts with lingering router approvals and abused callback execution.",
      },
      {
        question: "Best mitigation for this design flaw?",
        options: ["Add caller authentication and context checks to callback execution", "Raise transfer gas stipend", "Require larger approval amounts", "Disable token metadata"],
        correct: 0,
        explanation: "Callback functions must validate authorized caller and expected swap context before moving funds.",
      },
    ]
  },

  // TrustedVolumes (May 7, 2026)
  {
    id: "trustedvolumes-2026",
    slug: "trustedvolumes-2026",
    title: "TrustedVolumes",
    subtitle: "Permissionless Order Signer + Unvalidated Inventory",
    year: 2026,
    chain: "Ethereum",
    type: ["Access Control", "Logic Error"],
    shortDesc: "Permissionless registerAllowedOrderSigner and unvalidated inventory field in RFQ proxy drained $6.7M on Ethereum.",
    longDesc: "On May 7, 2026, TrustedVolumes on Ethereum lost $6.7M through two compounding flaws in its RFQ proxy. The registerAllowedOrderSigner function was permissionless, letting the attacker register themselves as an authorized signer. Combined with an unvalidated inventory field, the attacker crafted fraudulent RFQ orders that drained protocol inventory.",
    technicalDesc: "TrustedVolumes combined two logic failures: unrestricted signer registration and weak RFQ inventory validation. The vulnerable functions were `registerAllowedOrderSigner` without access control and settlement paths trusting order-declared inventory fields. The attacker self-registered as an approved signer, forged orders with inflated inventory claims, and settled against protocol assets. Checks failed because authorization and state-consistency checks were separated but both incomplete, so a fabricated signer could feed fabricated liquidity into settlement logic. Since settlement consumed trusted signed data without hard on-chain reconciliation, losses scaled quickly. Auditors should test every signer-admission endpoint for RBAC, then verify signed-order fields are cross-checked against current balances, limits, and inventory ownership at execution time.",
    impact: "$6.7M",
    impactUSD: 6700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Signer Registration", description: "Attacker called permissionless registerAllowedOrderSigner to authorize themselves.", functionsCall: ["RFQProxy.registerAllowedOrderSigner(attacker)"], pseudocode: "// No access control\n// Attacker now valid signer" },
      { id: "t2", phase: "Forged RFQ Orders", description: "Crafted RFQ orders with unvalidated inflated inventory fields.", functionsCall: ["RFQProxy.submitOrder(forged_inventory)"], pseudocode: "// inventory field not checked\n// Against on-chain balance" },
      { id: "t3", phase: "Settlement", description: "Orders settled against protocol inventory at fraudulent prices.", functionsCall: ["RFQProxy.settle(order)"], pseudocode: "// $6.7M extracted\n// Inventory depleted" },
      { id: "t4", phase: "Protocol Response", description: "TrustedVolumes paused RFQ proxy and revoked attacker signer.", functionsCall: ["RFQProxy.pause()"], pseudocode: "// Access control added\n// Inventory validation patched" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Self-registered signer", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "registerAllowedOrderSigner", detail: "Permissionless", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "RFQ Proxy", detail: "Unvalidated inventory", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$6.7M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Register signer" },
        { id: "e2", source: "n2", target: "n3", label: "Submit forged orders", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Settle & drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "RFQ Proxy\nInventory", type: "vault" },
      { id: "b", label: "Forged\nOrders", type: "attacker" },
      { id: "c", label: "Attacker\n$6.7M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 6.7, label: "Forged inventory" },
      { source: "b", target: "c", value: 6.7, label: "Settlement" }
    ],
    mitigations: [
      { category: "Access Control", description: "Gate registerAllowedOrderSigner behind admin or governance-only role." },
      { category: "Inventory Validation", description: "Validate RFQ inventory fields against on-chain token balances before settlement." },
      { category: "Order Verification", description: "Cross-check signed order parameters against live protocol state at settlement time." }
    ],
    quiz: [
      {
        question: "What paired weaknesses caused the TrustedVolumes drain?",
        options: ["Oracle lag and liquidation bonus bug", "Permissionless signer registration plus unvalidated inventory fields", "Nonce collision and replay cache miss", "UUPS initializer misuse only"],
        correct: 1,
        explanation: "Anyone could become a signer and submit inventory claims that were not properly verified.",
      },
      {
        question: "What was the attacker’s sequence?",
        options: ["Self-authorize signer role, forge high-inventory orders, settle to extract assets", "Steal DNS credentials, phish wallets", "Flash-loan oracle manipulation, then liquidate", "Bridge VAA replay"],
        correct: 0,
        explanation: "The exploit chained authorization bypass with fraudulent order-state settlement.",
      },
      {
        question: "Most effective mitigation?",
        options: ["Require API key on frontend", "Gate signer registration and reconcile order inventory against on-chain balances", "Increase RFQ expiry windows", "Lower block gas limit"],
        correct: 1,
        explanation: "Both signer permissioning and hard inventory validation are needed to close this class.",
      },
    ]
  },

  // TAC Protocol (May 11, 2026)
  {
    id: "tac-protocol-2026",
    slug: "tac-protocol-2026",
    title: "TAC Protocol",
    subtitle: "Forged Jetton Wallet Bypassed Code Hash Verification",
    year: 2026,
    chain: "TON/EVM",
    type: ["Access Control", "Bridge"],
    shortDesc: "Forged jetton wallet bypassed TAC sequencer code hash verification, draining $2.85M across TON and EVM.",
    longDesc: "On May 11, 2026, TAC Protocol lost $2.85M when an attacker deployed a forged jetton wallet that bypassed the sequencer's code hash verification. The fake wallet appeared valid to the cross-chain bridge but executed unauthorized token transfers, draining assets on both TON and connected EVM chains.",
    technicalDesc: "TAC's bridge trust model over-relied on code-hash style wallet verification that could be bypassed by crafted implementations. The vulnerable pattern was acceptance logic that proved interface or partial identity instead of strict canonical bytecode provenance. The attacker deployed a forged jetton wallet, passed sequencer validation, and initiated unauthorized cross-chain movements. Checks failed because verification did not bind wallet identity to an allowlisted deployment source and full immutable bytecode fingerprint. Once accepted as trusted, malicious transfer behavior executed within normal bridge flow and looked structurally valid. Auditors should validate bridge recipient/wallet authenticity with hard allowlists, factory provenance, and immutable hash checks, then adversarially test lookalike contracts designed to satisfy superficial validation criteria.",
    impact: "$2.85M",
    impactUSD: 2850000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Forged Wallet Deploy", description: "Attacker deployed jetton wallet with malicious transfer logic.", functionsCall: ["deploy(forged_jetton_wallet)"], pseudocode: "// Matches interface but malicious internals" },
      { id: "t2", phase: "Code Hash Bypass", description: "Forged wallet passed sequencer code hash verification check.", functionsCall: ["Sequencer.verifyCodeHash(wallet)"], pseudocode: "// Verification bypassed\n// Wallet accepted as valid" },
      { id: "t3", phase: "Cross-Chain Transfer", description: "Initiated unauthorized transfers across TON and EVM chains.", functionsCall: ["Bridge.transfer($2.85M)"], pseudocode: "// TON → EVM bridge exploited\n// Assets drained" },
      { id: "t4", phase: "Bridge Freeze", description: "TAC paused sequencer and updated code hash verification.", functionsCall: ["Sequencer.pause()"], pseudocode: "// Stricter verification deployed" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Forged wallet", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Forged Jetton Wallet", detail: "Code hash bypass", x: 250, y: 200 },
        { id: "n3", type: "bridge", label: "TAC Sequencer", detail: "Failed verification", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$2.85M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Deploy forged wallet" },
        { id: "e2", source: "n2", target: "n3", label: "Bypass code hash", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Cross-chain drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Forged\nJetton Wallet", type: "attacker" },
      { id: "b", label: "TAC\nSequencer", type: "bridge" },
      { id: "c", label: "Attacker\n$2.85M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 2.85, label: "Bypass verification" },
      { source: "b", target: "c", value: 2.85, label: "Drain" }
    ],
    mitigations: [
      { category: "Code Hash Verification", description: "Use allowlisted wallet code hashes rather than interface-matching checks. Verify full bytecode, not just selectors." },
      { category: "Wallet Registry", description: "Maintain an on-chain registry of approved jetton wallet implementations." },
      { category: "Transfer Limits", description: "Apply rate limits and anomaly detection on cross-chain bridge transfers." }
    ],
    quiz: [
      {
        question: "What root issue enabled TAC's forged wallet attack?",
        options: ["Weak wallet authenticity verification model", "Missing compiler optimization flag", "Front-end typo in token symbol", "Expired LP token lock"],
        correct: 0,
        explanation: "Validation accepted a forged wallet that appeared compatible but contained malicious behavior.",
      },
      {
        question: "How did the attacker pass trust checks?",
        options: ["By brute-forcing validator keys", "By deploying a lookalike jetton wallet that bypassed code-hash checks", "By causing block reorgs", "By exploiting integer wraparound"],
        correct: 1,
        explanation: "A crafted wallet implementation satisfied insufficient authenticity checks.",
      },
      {
        question: "Best mitigation for this bridge-validation class?",
        options: ["Use longer wallet names", "Use factory provenance and strict allowlisted bytecode hashes", "Disable event logs", "Increase bridge fee"],
        correct: 1,
        explanation: "Trust should be anchored to canonical deploy paths and immutable bytecode allowlists.",
      },
    ]
  },

  // Transit Finance (May 13, 2026)
  {
    id: "transit-finance-2026",
    slug: "transit-finance-2026",
    title: "Transit Finance",
    subtitle: "Deprecated 2022 Legacy Contract — Lingering Approvals",
    year: 2026,
    chain: "TRON",
    type: ["Access Control", "Logic Error"],
    shortDesc: "Deprecated 2022 Transit Finance legacy contract exploited via lingering user approvals, draining $1.88M on TRON.",
    longDesc: "On May 13, 2026, Transit Finance lost $1.88M when an attacker exploited a deprecated 2022 legacy swap contract on TRON. Users who had not revoked token approvals to the old contract were drained via transferFrom calls, years after the contract was superseded by newer versions.",
    technicalDesc: "Transit Finance was exploited through technical debt: a deprecated 2022 contract remained callable with lingering user approvals. The vulnerable pattern was migration without deactivation, where legacy `transferFrom` capability preserved real spending authority years after replacement. The attacker scanned allowances to the obsolete contract, then swept approved balances from multiple users. Checks failed because deprecation was treated as social guidance rather than enforced revocation or contract kill-switch, and approval hygiene was not operationally completed. The on-chain behavior was valid under ERC/TRC allowance semantics, so the old contract became a latent drain surface. Auditors should inventory deprecated contracts, verify irreversible decommission paths, and monitor historical allowance exposure when planning upgrades or migration campaigns.",
    impact: "$1.88M",
    impactUSD: 1880000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Approval Scanning", description: "Attacker scanned TRON for users with active approvals to deprecated 2022 contract.", functionsCall: ["allowance scan"], pseudocode: "// Legacy contract still deployed\n// Users never revoked approvals" },
      { id: "t2", phase: "transferFrom Sweep", description: "Called transferFrom on legacy contract to drain approved TRC-20 tokens.", functionsCall: ["LegacySwap.transferFrom(victim, attacker, amount)"], pseudocode: "// Deprecated contract still functional\n// Approvals still valid" },
      { id: "t3", phase: "Multi-User Drain", description: "Swept approved tokens from multiple victims totaling $1.88M.", functionsCall: ["LegacySwap.transferFrom(repeat)"], pseudocode: "// Batch drain across victims" },
      { id: "t4", phase: "User Advisory", description: "Transit Finance urged users to revoke legacy contract approvals.", functionsCall: [], pseudocode: "// Revoke approvals to 2022 contract\n// Migrate to current version" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Approval sweep", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "2022 Legacy Contract", detail: "Deprecated", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "User Approvals", detail: "Lingering", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$1.88M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Scan approvals" },
        { id: "e2", source: "n2", target: "n3", label: "transferFrom", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Sweep $1.88M" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "User\nApprovals", type: "vault" },
      { id: "b", label: "2022 Legacy\nContract", type: "vault" },
      { id: "c", label: "Attacker\n$1.88M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 1.88, label: "Lingering approvals" },
      { source: "b", target: "c", value: 1.88, label: "transferFrom" }
    ],
    mitigations: [
      { category: "Contract Deprecation", description: "Disable or self-destruct deprecated contracts. Add a kill switch that revokes all functionality." },
      { category: "Approval Revocation", description: "Prompt users to revoke approvals when migrating to new contract versions." },
      { category: "Approval Monitoring", description: "Monitor and alert on large transferFrom calls on deprecated contracts." }
    ],
    quiz: [
      {
        question: "Why could a 2022 Transit contract still drain users in 2026?",
        options: ["Consensus rollback", "Legacy contract stayed active with unrecalled user approvals", "ERC-20 standard changed", "Bridge validator outage"],
        correct: 1,
        explanation: "Approvals persisted on a still-functional deprecated contract.",
      },
      {
        question: "What was the attacker’s practical drain method?",
        options: ["Execute repeated transferFrom calls on approved victims via legacy contract", "Mint fake LP shares", "Replay zk proofs", "Steal front-end API keys only"],
        correct: 0,
        explanation: "Allowance-based transferFrom sweeps were enough because approvals remained live.",
      },
      {
        question: "Most effective mitigation for future migrations?",
        options: ["Mark old contracts as deprecated in docs", "Disable legacy functions and run enforced approval-revocation campaigns", "Increase bridge confirmations", "Rename function selectors"],
        correct: 1,
        explanation: "Hard deactivation plus revocation cleanup removes lingering spend authority.",
      },
    ]
  },

  // THORChain (May 15, 2026)
  {
    id: "thorchain-2026",
    slug: "thorchain-2026",
    title: "THORChain",
    subtitle: "Malicious Node + GG20 TSS Key Leak",
    year: 2026,
    chain: "Multi-chain",
    type: ["Access Control", "Bridge"],
    shortDesc: "Malicious THORChain node progressively leaked GG20 TSS key material; unapplied patch led to $10.7M drain.",
    longDesc: "On May 15, 2026, THORChain lost $10.7M when a malicious node operator progressively leaked GG20 threshold signature scheme (TSS) key material. A known patch addressing TSS key isolation had not been applied network-wide, allowing the rogue node to reconstruct signing shares and authorize fraudulent outbound vault transfers.",
    technicalDesc: "THORChain's root issue was TSS key-share leakage across signing rounds, compounded by delayed patch deployment. The vulnerable pattern was insufficient isolation and lifecycle hygiene for GG20 share material in a hostile validator environment. A malicious node participated in signing ceremonies, accumulated leaked fragments over time, and reconstructed enough signing authority for fraudulent outbound transfers. Checks failed at operational security governance: known defensive fixes were not uniformly enforced before participation. Once threshold signing guarantees were undermined, vault withdrawals appeared cryptographically valid to the system. Auditors should examine TSS implementation details, verify per-round share zeroization, enforce mandatory patch levels for validator admission, and model progressive share-harvest attacks rather than only single-round compromise scenarios.",
    impact: "$10.7M",
    impactUSD: 10700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Malicious Node", description: "Rogue node operator joined THORChain validator set.", functionsCall: ["Node.joinValidatorSet()"], pseudocode: "// Malicious operator\n// Participates in TSS ceremonies" },
      { id: "t2", phase: "TSS Key Leak", description: "Progressively leaked GG20 TSS key material across signing rounds.", functionsCall: ["TSS.signingRound(leak_shares)"], pseudocode: "// Unapplied patch allowed\n// Cross-round key exposure" },
      { id: "t3", phase: "Key Reconstruction", description: "Reconstructed sufficient TSS shares to sign vault outbound transactions.", functionsCall: ["TSS.reconstructKey()"], pseudocode: "// Vault signing key recovered\n// Full outbound authority" },
      { id: "t4", phase: "Vault Drain", description: "Signed fraudulent outbound transfers draining $10.7M across chains.", functionsCall: ["Vault.outboundTransfer($10.7M)"], pseudocode: "// Multi-chain drain\n// Network halted" },
      { id: "t5", phase: "Network Halt", description: "THORChain halted network and ejected malicious node.", functionsCall: ["Network.halt()"], pseudocode: "// Patch applied network-wide\n// TSS ceremony rotated" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Malicious Node", detail: "GG20 TSS leak", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "GG20 TSS", detail: "Unapplied patch", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "THORChain Vaults", detail: "$10.7M", x: 450, y: 200 },
        { id: "n4", type: "bridge", label: "Multi-Chain", detail: "Outbound transfers", x: 650, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Drained", x: 850, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Leak TSS shares", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Reconstruct key" },
        { id: "e3", source: "n3", target: "n4", label: "Sign outbound", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "$10.7M drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "GG20 TSS\nKey Leak", type: "attacker" },
      { id: "b", label: "THORChain\nVaults", type: "vault" },
      { id: "c", label: "Multi-Chain\nOutbound", type: "bridge" },
      { id: "d", label: "Attacker\n$10.7M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 10.7, label: "Key reconstruction" },
      { source: "b", target: "c", value: 10.7, label: "Signed outbound" },
      { source: "c", target: "d", value: 10.7, label: "Drain" }
    ],
    mitigations: [
      { category: "Patch Management", description: "Enforce mandatory security patches across all nodes before allowing participation in TSS ceremonies." },
      { category: "TSS Key Isolation", description: "Ensure TSS key material is zeroed after each signing round and never reused across rounds." },
      { category: "Node Vetting", description: "Strengthen node operator bonding requirements and continuous behavior monitoring." }
    ],
    quiz: [
      {
        question: "What fundamentally broke in the THORChain incident?",
        options: ["AMM pool invariant", "TSS share isolation across signing rounds", "ERC-20 approve race", "Frontend domain integrity"],
        correct: 1,
        explanation: "A malicious node could leak and accumulate GG20 share material over time.",
      },
      {
        question: "How was value ultimately drained?",
        options: ["Forged oracle prices", "Reconstructed signing authority produced valid fraudulent outbound transfers", "Liquidity mining reward inflation", "Cross-domain message replay"],
        correct: 1,
        explanation: "After collecting enough share data, fraudulent withdrawals were signed as if legitimate.",
      },
      {
        question: "Best mitigation theme for validator/TSS systems?",
        options: ["Lower validator bond requirements", "Enforce patch compliance and strict per-round key-share isolation", "Hide node IP addresses only", "Increase token supply"],
        correct: 1,
        explanation: "Operational patch discipline and cryptographic share hygiene are both required.",
      },
    ]
  },

  // Adshares Bridge (May 17, 2026)
  {
    id: "adshares-bridge-2026",
    slug: "adshares-bridge-2026",
    title: "Adshares Bridge",
    subtitle: "wrapTo with Non-Existent Native Txids",
    year: 2026,
    chain: "Ethereum",
    type: ["Bridge", "Logic Error"],
    shortDesc: "Adshares Bridge wrapTo accepted non-existent native txids, minting fake wADS; $628K stolen, ~86% returned.",
    longDesc: "On May 17, 2026, the Adshares Bridge on Ethereum lost $628K when an attacker called wrapTo with fabricated native transaction IDs that did not exist on the Adshares native chain. The bridge minted unbacked wADS wrapped tokens without verifying the source deposit, which were swapped for real assets. Approximately 86% of funds were later returned.",
    technicalDesc: "Adshares Bridge minted wrapped assets from claimed native txids without proving those deposits existed. The vulnerable function was `wrapTo` accepting user-supplied transaction references as sufficient mint authorization. The attacker submitted fabricated txids, received unbacked wADS mint output, and sold those tokens for real market assets. Validation failed because source-chain existence, amount consistency, and confirmation depth were not enforced before mint issuance. Replay and fabrication surfaces remained open since txid linkage was trust-based rather than cryptographic-proof based. Auditors should verify bridge mint paths require objective source-chain proofs, immutable consumed-message tracking, and strict transaction-to-mint amount reconciliation with defensive mint caps.",
    impact: "$628K (~86% returned)",
    impactUSD: 628000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Txid Fabrication", description: "Attacker crafted wrapTo calls with non-existent native chain transaction IDs.", functionsCall: ["Bridge.wrapTo(fake_txid, amount)"], pseudocode: "// txid never existed on native chain\n// No deposit verification" },
      { id: "t2", phase: "Fake wADS Mint", description: "Bridge minted wADS tokens without backing native deposits.", functionsCall: ["wADS.mint(attacker, amount)"], pseudocode: "// Unbacked wrapped tokens created" },
      { id: "t3", phase: "Asset Swap", description: "Swapped fake wADS for real ETH and stablecoins.", functionsCall: ["DEX.swap(wADS, ETH)"], pseudocode: "// $628K extracted" },
      { id: "t4", phase: "Partial Recovery", description: "Approximately 86% of stolen funds returned to the protocol.", functionsCall: [], pseudocode: "// ~$540K recovered\n// Bridge verification patched" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Fake txids", x: 50, y: 200 },
        { id: "n2", type: "bridge", label: "wrapTo", detail: "No txid verification", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "wADS Mint", detail: "Unbacked", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Net Loss", detail: "~$88K", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Fake txids", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Mint wADS" },
        { id: "e3", source: "n3", target: "n4", label: "Swap (86% returned)" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Fake\nNative Txid", type: "attacker" },
      { id: "b", label: "wADS\nMint", type: "bridge" },
      { id: "c", label: "Attacker\n$628K", type: "drain" },
      { id: "d", label: "Recovered\n~86%", type: "vault" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.63, label: "wrapTo" },
      { source: "b", target: "c", value: 0.63, label: "Swap" },
      { source: "c", target: "d", value: 0.54, label: "Returned" }
    ],
    mitigations: [
      { category: "Deposit Verification", description: "Verify native-chain transaction existence and amount before minting wrapped tokens." },
      { category: "Txid Validation", description: "Cross-reference txids against native chain RPC with confirmation depth requirements." },
      { category: "Mint Limits", description: "Apply rate limits and caps on wrapTo minting per address and per time window." }
    ],
    quiz: [
      {
        question: "What was the root validation failure in Adshares `wrapTo`?",
        options: ["No slippage parameter", "No verification that referenced native txids actually existed", "Wrong token decimals", "Missing event emission"],
        correct: 1,
        explanation: "Mint authorization trusted fabricated transaction IDs without source-chain proof.",
      },
      {
        question: "How did the attacker realize value from fake mints?",
        options: ["Used unbacked wADS as collateral then defaulted", "Swapped unbacked minted wADS for real ETH/stablecoins", "Changed governance quorum", "Forced validator halt"],
        correct: 1,
        explanation: "The attacker converted counterfeit wrapped tokens into real assets via market liquidity.",
      },
      {
        question: "Which mitigation is most direct?",
        options: ["Require source-chain proof-of-deposit and consume-once tx tracking before mint", "Increase bridge UI warning text", "Disable token symbols", "Raise swap fee in all pools"],
        correct: 0,
        explanation: "Bridge mints must be cryptographically tied to verified source deposits.",
      },
    ]
  },

  // Verus-Ethereum Bridge (May 18, 2026)
  {
    id: "verus-ethereum-bridge-2026",
    slug: "verus-ethereum-bridge-2026",
    title: "Verus-Ethereum Bridge",
    subtitle: "Missing Source-Amount Validation in checkCCEValues",
    year: 2026,
    chain: "Ethereum",
    type: ["Bridge", "Logic Error"],
    shortDesc: "Missing source-amount validation in checkCCEValues let attacker mint unbacked bridged assets, draining $11.58M.",
    longDesc: "On May 18, 2026, the Verus-Ethereum Bridge lost $11.58M due to missing source-amount validation in the checkCCEValues function. The attacker submitted cross-chain export claims with inflated or mismatched source amounts that passed validation, minting unbacked bridged tokens on Ethereum that were swapped for real assets.",
    technicalDesc: "The Verus-Ethereum bridge failed to enforce source-amount integrity in `checkCCEValues`, allowing claim inflation. The vulnerable pattern was partial validation of cross-chain export fields where destination mint amounts were not strictly bound to authenticated source deposits. The attacker submitted forged or inflated CCE claims that passed checks, minted excess wrapped assets, and liquidated them on Ethereum. Security checks failed because validation logic confirmed structure but not full economic equivalence between source and destination amounts. Without strict field-by-field reconciliation, legitimate message format became a vehicle for illegitimate value creation. Auditors should trace every bridge claim field through verification, require cryptographic proofs for amount and asset identity, and add invariants that total minted supply never exceeds proven inbound deposits.",
    impact: "$11.58M",
    impactUSD: 11580000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Validation Analysis", description: "Attacker identified missing source-amount check in checkCCEValues.", functionsCall: [], pseudocode: "// checkCCEValues skips source amount\n// Destination amount unchecked" },
      { id: "t2", phase: "Forged CCE Claims", description: "Submitted cross-chain export claims with inflated amounts.", functionsCall: ["Bridge.submitCCE(inflated_amount)"], pseudocode: "// Source amount not validated\n// Claim accepted" },
      { id: "t3", phase: "Unbacked Mint", description: "Bridge minted unbacked tokens on Ethereum from forged claims.", functionsCall: ["Bridge.mintWrapped(inflated_amount)"], pseudocode: "// No matching source deposit\n// Tokens minted anyway" },
      { id: "t4", phase: "Liquidation", description: "Swapped minted tokens for real assets totaling $11.58M.", functionsCall: ["DEX.swap(all_minted)"], pseudocode: "// $11.58M extracted\n// Bridge paused" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "CCE forgery", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "checkCCEValues", detail: "Missing validation", x: 250, y: 200 },
        { id: "n3", type: "bridge", label: "Verus-Eth Bridge", detail: "Unbacked mint", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$11.58M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Forged CCE", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Pass validation" },
        { id: "e3", source: "n3", target: "n4", label: "Mint & swap" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Forged CCE\nClaims", type: "attacker" },
      { id: "b", label: "Bridge\nMint", type: "bridge" },
      { id: "c", label: "Attacker\n$11.58M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 11.58, label: "Unbacked mint" },
      { source: "b", target: "c", value: 11.58, label: "Liquidation" }
    ],
    mitigations: [
      { category: "Amount Validation", description: "Enforce strict source-amount matching in checkCCEValues against verified on-chain deposits." },
      { category: "Cross-Chain Proofs", description: "Require cryptographic proofs of source-chain deposits with confirmation depth." },
      { category: "Mint Caps", description: "Apply per-transaction and daily mint limits on bridge token issuance." }
    ],
    quiz: [
      {
        question: "What did `checkCCEValues` fail to enforce?",
        options: ["Gas refund cap", "Source-chain amount consistency with destination mint", "Token symbol casing", "Block producer identity"],
        correct: 1,
        explanation: "Missing source-amount validation allowed inflated claim values to be minted.",
      },
      {
        question: "What was the attack flow?",
        options: ["Inflate CCE claim values, mint unbacked tokens, sell for real assets", "Spam mempool and front-run users", "Exploit nft metadata parser", "Hijack DNS and redirect wallets"],
        correct: 0,
        explanation: "The exploit transformed weak cross-chain validation into unbacked token issuance.",
      },
      {
        question: "Most appropriate bridge mitigation?",
        options: ["Increase lock period on LP positions", "Enforce cryptographic proof-backed amount reconciliation for every claim", "Disable wallet connect", "Use shorter claim IDs"],
        correct: 1,
        explanation: "Bridges must bind destination mint amounts to proven source deposits cryptographically.",
      },
    ]
  },

  // RetoSwap (May 20, 2026)
  {
    id: "retoswap-2026",
    slug: "retoswap-2026",
    title: "RetoSwap",
    subtitle: "Forged Out-of-Order ACK Impersonating Arbitrator",
    year: 2026,
    chain: "Monero/Haveno",
    type: ["Access Control", "Logic Error"],
    shortDesc: "Forged out-of-order ACK impersonating Haveno arbitrator released $2.7M in escrowed Monero trades.",
    longDesc: "On May 20, 2026, RetoSwap on the Monero/Haveno network lost $2.7M when an attacker forged an out-of-order acknowledgment (ACK) message impersonating a Haveno trade arbitrator. The forged ACK triggered premature escrow release, allowing the attacker to claim funds from multiple open trades without completing the payment side.",
    technicalDesc: "RetoSwap's failure centered on message-authentication and ordering guarantees in escrow release signaling. The vulnerable pattern was trusting arbitrator ACK messages without robust anti-impersonation and strict monotonic sequence enforcement. The attacker forged out-of-order ACK payloads that appeared to come from a valid arbitrator context and triggered premature escrow releases. Checks failed because signature/identity binding and sequence validation were insufficiently coupled, so stale or malformed protocol states were accepted as release-authorizing. Once release conditions were bypassed, multiple trades could be settled in favor of the attacker without payment completion. Auditors should test authenticated message channels for replay/out-of-order handling, bind ACKs to immutable trade state, and require multi-party confirmation on high-value dispute releases.",
    impact: "$2.7M",
    impactUSD: 2700000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Arbitrator Analysis", description: "Attacker studied Haveno arbitrator ACK message format and signing.", functionsCall: [], pseudocode: "// ACK message structure mapped\n// Arbitrator impersonation planned" },
      { id: "t2", phase: "Forged ACK", description: "Crafted out-of-order ACK messages impersonating arbitrator.", functionsCall: ["forgeACK(arbitrator, out_of_order_seq)"], pseudocode: "// Forged arbitrator signature\n// Out-of-order sequence number" },
      { id: "t3", phase: "Escrow Release", description: "Forged ACKs triggered premature escrow release on open trades.", functionsCall: ["Haveno.releaseEscrow(forged_ack)"], pseudocode: "// Escrow released without\n// Payment completion" },
      { id: "t4", phase: "Fund Extraction", description: "Attacker claimed $2.7M in released Monero from multiple trades.", functionsCall: ["Attacker.claimEscrow(all_trades)"], pseudocode: "// $2.7M XMR extracted" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Forged ACK", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Arbitrator ACK", detail: "Impersonated", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "Haveno Escrow", detail: "$2.7M XMR", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Released", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Forge ACK", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Out-of-order release" },
        { id: "e3", source: "n3", target: "n4", label: "Claim escrow" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Haveno\nEscrow", type: "vault" },
      { id: "b", label: "Forged\nArbitrator ACK", type: "attacker" },
      { id: "c", label: "Attacker\n$2.7M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 2.7, label: "Premature release" },
      { source: "b", target: "c", value: 2.7, label: "Claim" }
    ],
    mitigations: [
      { category: "ACK Verification", description: "Verify arbitrator signatures against a hardcoded allowlist of known arbitrator public keys." },
      { category: "Sequence Validation", description: "Reject out-of-order ACK messages; enforce strict monotonic sequence numbering." },
      { category: "Multi-Arbitrator", description: "Require multiple arbitrator confirmations before escrow release on high-value trades." }
    ],
    quiz: [
      {
        question: "What root weakness enabled RetoSwap escrow abuse?",
        options: ["Weak ACK authenticity and ordering validation", "Unbounded flash loan liquidity", "Arithmetic overflow in collateral ratio", "ERC-20 permit nonce reuse only"],
        correct: 0,
        explanation: "Forged, out-of-order arbitrator-style ACKs were accepted as valid release signals.",
      },
      {
        question: "How were funds unlocked without proper trade completion?",
        options: ["By submitting forged arbitrator ACK messages with manipulated sequence timing", "By executing reentrancy in escrow payout", "By changing chain finality rules", "By minting governance shares"],
        correct: 0,
        explanation: "Premature release logic was triggered by crafted ACK messages that bypassed sequencing/auth checks.",
      },
      {
        question: "Best mitigation for similar P2P escrow protocols?",
        options: ["Increase trade sizes gradually", "Bind ACK signatures to trade state and enforce strict monotonic sequence checks", "Disable arbitrators entirely", "Shorten block intervals"],
        correct: 1,
        explanation: "State-bound signatures plus ordering enforcement prevent forged or replayed release commands.",
      },
    ]
  },

  // StablR (May 24, 2026)
  {
    id: "stablr-2026",
    slug: "stablr-2026",
    title: "StablR",
    subtitle: "1-of-3 Multisig Mint Key Compromise",
    year: 2026,
    chain: "Ethereum",
    type: ["Access Control"],
    shortDesc: "1-of-3 multisig mint key compromise enabled $13.5M unbacked mint; $2.8M net extracted on Ethereum.",
    longDesc: "On May 24, 2026, StablR on Ethereum suffered a mint key compromise on its 1-of-3 multisig. The attacker minted $13.5M in unbacked stablecoins but only managed to extract $2.8M net before the protocol froze minting and blacklisted attacker addresses.",
    technicalDesc: "StablR's core weakness was governance threshold design: mint authority was effectively single-key despite appearing multisig. The vulnerable pattern was 1-of-3 approval for high-impact mint operations, where any one compromised signer could create unbacked supply. The attacker used one stolen key to authorize large minting, then liquidated a portion before emergency controls activated. Checks failed because issuance trust relied on quorum size too small for the value at risk and lacked pre-mint risk throttles. Blacklisting and freeze tooling reduced net extraction but only after unauthorized supply was already created. Auditors should evaluate signer threshold adequacy against treasury risk, require multi-party mint approval, and add hard issuance velocity limits with automatic pause triggers.",
    impact: "$2.8M net ($13.5M unbacked minted)",
    impactUSD: 2800000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Key Compromise", description: "One of three multisig mint keys compromised.", functionsCall: [], pseudocode: "// 1-of-3 threshold\n// Single key sufficient" },
      { id: "t2", phase: "Unbacked Mint", description: "Minted $13.5M in unbacked stablecoins using compromised key.", functionsCall: ["StablR.mint($13.5M)"], pseudocode: "// No collateral backing\n// 1 signature enough" },
      { id: "t3", phase: "Partial Extraction", description: "Attacker liquidated $2.8M before protocol froze operations.", functionsCall: ["DEX.swap($2.8M)"], pseudocode: "// Remaining minted tokens frozen\n// Blacklist applied" },
      { id: "t4", phase: "Protocol Freeze", description: "StablR paused minting and blacklisted attacker addresses.", functionsCall: ["StablR.pauseMint()", "StablR.blacklist(attacker)"], pseudocode: "// $10.7M unbacked contained\n// Multisig upgraded to 2-of-3" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Mint key", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "1-of-3 Mint Key", detail: "Single key enough", x: 250, y: 200 },
        { id: "n3", type: "pool", label: "Unbacked Mint", detail: "$13.5M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Net Extracted", detail: "$2.8M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise key" },
        { id: "e2", source: "n2", target: "n3", label: "Mint unbacked", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Extract $2.8M" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Mint Key\nCompromised", type: "attacker" },
      { id: "b", label: "Unbacked\n$13.5M Mint", type: "pool" },
      { id: "c", label: "Extracted\n$2.8M", type: "drain" },
      { id: "d", label: "Frozen\n$10.7M", type: "vault" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 13.5, label: "Mint" },
      { source: "b", target: "c", value: 2.8, label: "Liquidated" },
      { source: "b", target: "d", value: 10.7, label: "Blacklisted" }
    ],
    mitigations: [
      { category: "Multisig Threshold", description: "Require M-of-N with M >= 2 for all mint operations. Never use 1-of-N for privileged actions." },
      { category: "Mint Monitoring", description: "Real-time alerts on large mint events with automatic pause triggers." },
      { category: "Blacklist Capability", description: "Maintain ability to freeze and blacklist addresses holding unbacked mints." }
    ],
    quiz: [
      {
        question: "What was the structural root cause in StablR?",
        options: ["Bridge message parser bug", "1-of-3 mint multisig threshold too weak", "Oracle decimal mismatch", "Unchecked call to transfer()"],
        correct: 1,
        explanation: "A single compromised signer could mint, making the effective trust model single-key.",
      },
      {
        question: "How did the attacker convert compromised authority into loss?",
        options: ["Minted unbacked stablecoins then liquidated what could be sold before freeze", "Stole LP NFTs and burned them", "Replayed permit signatures", "Forced chain halt"],
        correct: 0,
        explanation: "Unauthorized minting was monetized via market sales before containment.",
      },
      {
        question: "Which mitigation best hardens mint governance?",
        options: ["Use 2-of-3 (or higher) plus mint-rate caps and auto-pause alarms", "Make mint function private", "Increase metadata size", "Turn off events"],
        correct: 0,
        explanation: "Raising threshold and constraining issuance speed directly reduces single-key blast radius.",
      },
    ]
  },

  // SquidRouterModule (May 25, 2026)
  {
    id: "squid-router-module-2026",
    slug: "squid-router-module-2026",
    title: "SquidRouterModule",
    subtitle: "Gnosis Safe Module Fixed-String Auth Flaw",
    year: 2026,
    chain: "Ethereum/Base",
    type: ["Access Control", "Logic Error"],
    shortDesc: "Fixed-string authentication flaw in Gnosis Safe module let attacker drain 86 wallets for $3.2M on Ethereum and Base.",
    longDesc: "On May 25, 2026, the SquidRouterModule Gnosis Safe module on Ethereum and Base was exploited for $3.2M across 86 wallets. A fixed-string authentication flaw in the module's authorization check allowed the attacker to bypass access control and execute transactions from any Safe that had the module enabled.",
    technicalDesc: "SquidRouterModule relied on fixed-string authorization semantics for privileged module execution in Gnosis Safe contexts. The vulnerable pattern was brittle string-based auth checks in place of cryptographic signer/role verification tied to transaction intent. The attacker crafted calls that satisfied the string predicate, then invoked module execution against many Safes with the module enabled. Checks failed because module-level trust was broad and reusable; once bypassed, each Safe inherited the same exploit surface with little per-wallet friction. This created systemic blast radius across 86 wallets rather than a single-account compromise. Auditors should reject string-comparison auth for modules, enforce signature-based intent validation, and model cross-tenant impact when a shared extension is enabled across many safes.",
    impact: "$3.2M (86 wallets)",
    impactUSD: 3200000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Auth Flaw Discovery", description: "Attacker identified fixed-string authentication bypass in SquidRouterModule.", functionsCall: [], pseudocode: "// Fixed-string auth comparison\n// Bypassable via encoding" },
      { id: "t2", phase: "Safe Enumeration", description: "Identified 86 Gnosis Safes with SquidRouterModule enabled.", functionsCall: ["scanSafes(module)"], pseudocode: "// 86 targets found\n// Ethereum + Base" },
      { id: "t3", phase: "Module Exploitation", description: "Bypassed auth and executed drain transactions from each Safe.", functionsCall: ["Module.execTransactionFromModule(safe, drain_tx)"], pseudocode: "// Auth check bypassed\n// Arbitrary TX from Safe" },
      { id: "t4", phase: "Multi-Wallet Drain", description: "Drained $3.2M total across 86 compromised Safes.", functionsCall: ["Module.execTransactionFromModule(repeat x86)"], pseudocode: "// $3.2M aggregated\n// Module disabled" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Auth bypass", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "SquidRouterModule", detail: "Fixed-string auth", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "86 Gnosis Safes", detail: "Module enabled", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$3.2M", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Bypass auth", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Exec from 86 Safes" },
        { id: "e3", source: "n3", target: "n4", label: "Drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "SquidRouter\nModule", type: "attacker" },
      { id: "b", label: "86 Gnosis\nSafes", type: "multisig" },
      { id: "c", label: "Attacker\n$3.2M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 3.2, label: "Auth bypass" },
      { source: "b", target: "c", value: 3.2, label: "86 wallets" }
    ],
    mitigations: [
      { category: "Module Auth", description: "Use cryptographic signature verification instead of fixed-string comparisons for module authorization." },
      { category: "Safe Module Audit", description: "Audit all Gnosis Safe modules for access control before enabling on production Safes." },
      { category: "Module Disable", description: "Disable SquidRouterModule on all Safes immediately after vulnerability disclosure." }
    ],
    quiz: [
      {
        question: "What was the key authorization flaw in SquidRouterModule?",
        options: ["Fixed-string auth check that could be bypassed", "Lack of reentrancy guard in ERC-20", "Expired oracle feed", "Incorrect chain ID in permit"],
        correct: 0,
        explanation: "String-based authorization was insufficient and allowed crafted bypass payloads.",
      },
      {
        question: "Why did this bug affect many wallets at once?",
        options: ["Because token supply was globally paused", "The same vulnerable module was enabled across multiple Safes", "All users shared one private key", "Bridge relayers were centralized"],
        correct: 1,
        explanation: "Shared module deployment created a high blast radius when auth bypass was discovered.",
      },
      {
        question: "Best mitigation for safe-module authorization?",
        options: ["Use fixed strings with stronger casing rules", "Require cryptographic intent verification and per-safe scoped permissions", "Disable transaction history", "Raise gas limits"],
        correct: 1,
        explanation: "Module calls should be authorized by signatures/roles, not string matching.",
      },
    ]
  },

  // SUPERFORTUNE AI (May 27, 2026)
  {
    id: "superfortune-ai-2026",
    slug: "superfortune-ai-2026",
    title: "SUPERFORTUNE AI",
    subtitle: "Signer Key Leak — Multisig Airdrop Redirect",
    year: 2026,
    chain: "Ethereum",
    type: ["Access Control"],
    shortDesc: "Leaked signer private key redirected multisig GUA airdrop ($15.18M) to attacker lookalike address on Ethereum.",
    longDesc: "On May 27, 2026, SUPERFORTUNE AI lost $15.18M in GUA tokens on Ethereum when a multisig signer's private key was leaked. The attacker used the compromised signer to redirect the scheduled multisig airdrop distribution to a lookalike address controlled by the attacker, intercepting the entire allocation.",
    technicalDesc: "SUPERFORTUNE AI was compromised through signer key leakage in a high-value multisig distribution workflow. The vulnerable pattern was relying on key possession and human review to protect recipient integrity in one-shot airdrop transactions. The attacker used compromised signing capability to alter recipient targets to a lookalike address while preserving plausibility. Controls failed because destination validation was not independently enforced on-chain and signing workflow checks did not reliably catch subtle address substitution. Once approved, token transfer execution was valid and irreversible, making response purely reactive. Auditors should demand address allowlists for distribution jobs, hardware-backed signer isolation, and multi-party out-of-band verification of recipient sets before any large treasury or airdrop execution.",
    impact: "$15.18M GUA",
    impactUSD: 15180000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Key Leak", description: "Multisig signer's private key leaked via insecure storage or phishing.", functionsCall: [], pseudocode: "// Signer key compromised\n// Multisig threshold reachable" },
      { id: "t2", phase: "Airdrop Hijack", description: "Compromised signer submitted modified airdrop with lookalike recipient.", functionsCall: ["Multisig.submitAirdrop(lookalike_address)"], pseudocode: "// Recipient redirected\n// Looks legitimate in UI" },
      { id: "t3", phase: "Multisig Approval", description: "Modified airdrop transaction approved via compromised signer vote.", functionsCall: ["Multisig.approve(txHash)"], pseudocode: "// Threshold met with\n// compromised signer" },
      { id: "t4", phase: "GUA Interception", description: "$15.18M GUA tokens sent to attacker lookalike address.", functionsCall: ["GUA.transfer(lookalike, $15.18M)"], pseudocode: "// Full airdrop intercepted\n// Real recipients receive nothing" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Leaked signer key", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Multisig Signer", detail: "Compromised", x: 250, y: 200 },
        { id: "n3", type: "contract", label: "GUA Airdrop", detail: "$15.18M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Lookalike Address", detail: "Intercepted", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Use leaked key" },
        { id: "e2", source: "n2", target: "n3", label: "Redirect airdrop", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "$15.18M GUA" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "GUA Airdrop\n$15.18M", type: "vault" },
      { id: "b", label: "Compromised\nSigner", type: "attacker" },
      { id: "c", label: "Lookalike\nAddress", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 15.18, label: "Redirected" },
      { source: "b", target: "c", value: 15.18, label: "Intercepted" }
    ],
    mitigations: [
      { category: "Signer Security", description: "Store multisig signer keys in hardware wallets with air-gapped signing for high-value distributions." },
      { category: "Recipient Verification", description: "Display and verify airdrop recipient addresses on hardware device screens before signing." },
      { category: "Timelock", description: "Add timelock delays on large token distributions to allow cancellation of suspicious transactions." }
    ],
    quiz: [
      {
        question: "What initiated the SUPERFORTUNE AI loss?",
        options: ["Oracle price divergence", "Leaked multisig signer private key", "Bridge replay proof", "Token decimal truncation"],
        correct: 1,
        explanation: "Compromised signer access enabled malicious transaction preparation/approval.",
      },
      {
        question: "How was the airdrop hijacked technically?",
        options: ["By changing token total supply", "By redirecting recipient address to attacker-controlled lookalike destination", "By halting the mempool", "By reentering claim()"],
        correct: 1,
        explanation: "The attacker altered destination details while preserving transaction legitimacy.",
      },
      {
        question: "Which mitigation best protects large airdrops?",
        options: ["Use a shorter recipient list", "Enforce recipient allowlists and multi-party deterministic destination verification", "Disable events during distribution", "Increase transfer gas"],
        correct: 1,
        explanation: "Strong recipient controls and independent signer verification prevent address-redirection fraud.",
      },
    ]
  },

  // Polymarket (May 22, 2026)
  {
    id: "polymarket-uma-2026",
    slug: "polymarket-uma-2026",
    title: "Polymarket",
    subtitle: "Ops Wallet Private Key Compromise",
    year: 2026,
    chain: "Polygon",
    type: ["Access Control"],
    shortDesc: "Six-year-old ops wallet private key compromise drained $520K POL from rewards wallet — not a contract exploit.",
    longDesc: "On May 22, 2026, Polymarket lost $520K in POL tokens when a six-year-old operations wallet private key was compromised. The attacker drained POL from the protocol's rewards wallet. This was an operational security failure involving a legacy key, not a smart contract or UMA oracle exploit.",
    technicalDesc: "Polymarket's incident was a key-lifecycle failure in an operational rewards wallet, not a smart-contract or oracle exploit. The vulnerable pattern was prolonged dependence on an old single private key without modern custody controls or periodic rotation. After key compromise, the attacker executed straightforward token transfers from the rewards wallet and drained available balance. Checks failed because wallet governance lacked multisig friction and historical key hygiene had not been enforced despite age and exposure risk. On-chain transactions were fully valid, so protocol logic offered no compensating control once key custody was lost. Auditors should evaluate operational wallet architecture, mandate key rotation and retirement schedules, and require multisig or MPC for any wallet with recurring treasury or rewards authority.",
    impact: "$520K POL",
    impactUSD: 520000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Legacy Key Exposure", description: "Six-year-old ops wallet private key compromised.", functionsCall: [], pseudocode: "// Key never rotated\n// Created ~2020" },
      { id: "t2", phase: "Rewards Wallet Access", description: "Attacker accessed Polymarket rewards wallet on Polygon.", functionsCall: ["RewardsWallet.transfer(POL)"], pseudocode: "// $520K POL available\n// No multisig protection" },
      { id: "t3", phase: "POL Drain", description: "Transferred $520K POL to attacker-controlled address.", functionsCall: ["POL.transfer(attacker, $520K)"], pseudocode: "// Full rewards wallet drained" },
      { id: "t4", phase: "Key Rotation", description: "Polymarket rotated all ops keys and migrated to multisig.", functionsCall: [], pseudocode: "// Legacy keys revoked\n// Multisig implemented" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Legacy key", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Ops Wallet Key", detail: "6 years old", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "Rewards Wallet", detail: "$520K POL", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise key" },
        { id: "e2", source: "n2", target: "n3", label: "Access wallet", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Drain POL" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Rewards\nWallet", type: "vault" },
      { id: "b", label: "Legacy Ops\nKey", type: "attacker" },
      { id: "c", label: "Attacker\n$520K POL", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.52, label: "Key access" },
      { source: "b", target: "c", value: 0.52, label: "POL drain" }
    ],
    mitigations: [
      { category: "Key Rotation", description: "Rotate all operational wallet keys on a regular schedule. Deprecate keys older than 12 months." },
      { category: "Multisig Ops", description: "Use multi-sig for all treasury and rewards wallets instead of single private keys." },
      { category: "Legacy Key Audit", description: "Audit and revoke all legacy keys from early project phases." }
    ],
    quiz: [
      {
        question: "What was the true root cause in Polymarket's incident?",
        options: ["UMA oracle corruption", "Legacy ops wallet private key compromise", "AMM reserve skew", "Bridge fee miscalculation"],
        correct: 1,
        explanation: "The loss came from compromised wallet credentials, not oracle or contract logic.",
      },
      {
        question: "How did funds leave the protocol?",
        options: ["Through normal signed transfers from the compromised rewards wallet", "Through forced liquidations", "By minting synthetic assets", "By replaying finality proofs"],
        correct: 0,
        explanation: "Once key control was lost, standard transfer operations were enough to drain value.",
      },
      {
        question: "Best long-term mitigation?",
        options: ["Keep old keys but rotate API secrets", "Adopt multisig/MPC and strict key rotation-retirement policies", "Raise collateral factors", "Disable UMA resolution"],
        correct: 1,
        explanation: "Custody modernization and lifecycle policy are the direct controls for this failure type.",
      },
    ]
  },

  // DxSale (May 28-29, 2026)
  {
    id: "dxsale-2026",
    slug: "dxsale-2026",
    title: "DxSale",
    subtitle: "Legacy v1 Locker Repeat Withdraw + Ownership Transfer",
    year: 2026,
    chain: "BNB Chain",
    type: ["Logic Error", "Access Control"],
    shortDesc: "Legacy DxSale v1 locker unlockToken allowed repeat withdrawals after deployer ownership transfer, draining $7.3M.",
    longDesc: "On May 28-29, 2026, DxSale on BNB Chain lost $7.3M through its legacy v1 token locker contract. The attacker exploited unlockToken to repeatedly withdraw locked tokens, compounded by a deployer ownership transfer that removed admin safeguards. Users with tokens locked in the deprecated v1 contract were affected.",
    technicalDesc: "DxSale's legacy locker combined a state-machine flaw with governance fragility in ownership control. The vulnerable function was `unlockToken` lacking a consumed/withdrawn state guard, allowing repeated unlocks on the same lock record. The attacker repeatedly called unlock on already-served entries and multiplied withdrawals beyond intended lock balances. Impact grew because ownership transfer removed effective emergency controls, so the vulnerable contract could not be rapidly paused. Checks failed due to non-idempotent withdrawal logic and insufficient deprecation hardening for legacy contracts still holding user value. Auditors should test idempotency on unlock/claim paths, verify lock-state mutation correctness, and require multisig/timelock ownership controls before any authority transfer on fund-holding contracts.",
    impact: "$7.3M",
    impactUSD: 7300000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "V1 Contract Analysis", description: "Attacker identified unlockToken repeat-withdraw flaw in legacy v1 locker.", functionsCall: [], pseudocode: "// unlockToken lacks state tracking\n// Same lock withdrawable multiple times" },
      { id: "t2", phase: "Ownership Transfer", description: "Deployer ownership transferred, removing admin pause capability.", functionsCall: ["Locker.transferOwnership(attacker)"], pseudocode: "// Admin controls lost\n// Contract cannot be paused" },
      { id: "t3", phase: "Repeat Withdraw", description: "Called unlockToken repeatedly on same locks to multiply withdrawals.", functionsCall: ["Locker.unlockToken(repeat)"], pseudocode: "// Each call releases tokens\n// No spent-flag check" },
      { id: "t4", phase: "Extraction", description: "Extracted $7.3M from legacy v1 locked token pools.", functionsCall: ["Locker.unlockToken(all_locks)"], pseudocode: "// $7.3M total drained\n// v1 contract deprecated" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Repeat withdraw", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "v1 Locker", detail: "unlockToken flaw", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "Locked Tokens", detail: "$7.3M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Drained", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Ownership transfer" },
        { id: "e2", source: "n2", target: "n3", label: "Repeat unlockToken", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "$7.3M drain" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "v1 Locker\nLocked Tokens", type: "vault" },
      { id: "b", label: "unlockToken\nRepeat", type: "attacker" },
      { id: "c", label: "Attacker\n$7.3M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 7.3, label: "Repeat unlock" },
      { source: "b", target: "c", value: 7.3, label: "Extract" }
    ],
    mitigations: [
      { category: "Withdrawal State", description: "Track unlock state per lock ID. Revert if a lock has already been fully withdrawn." },
      { category: "Contract Deprecation", description: "Migrate users from v1 to v2 lockers and disable v1 unlockToken functionality." },
      { category: "Ownership Protection", description: "Use multisig or timelock for ownership transfers on contracts holding user funds." }
    ],
    quiz: [
      {
        question: "What bug in DxSale v1 enabled repeated extraction?",
        options: ["unlockToken lacked one-time withdrawal state enforcement", "Oracle timestamp drift", "Bridge gas accounting mismatch", "Missing ERC-721 receiver hook"],
        correct: 0,
        explanation: "Without a spent flag, the same lock could be unlocked multiple times.",
      },
      {
        question: "Why did containment fail quickly?",
        options: ["Network congestion only", "Ownership/control issues reduced ability to pause legacy contract", "Validators rejected pause transactions", "Wallet signatures expired"],
        correct: 1,
        explanation: "Administrative safeguards were weakened after ownership transfer, slowing response.",
      },
      {
        question: "Most appropriate mitigation set?",
        options: ["Add stronger UI lock labels", "Enforce idempotent unlock state + decommission legacy contracts + protected ownership", "Increase lock duration globally", "Lower chain confirmation depth"],
        correct: 1,
        explanation: "The fix must address both state-machine correctness and governance control.",
      },
    ]
  },

  // Gravity Bridge (May 30, 2026)
  {
    id: "gravity-bridge-2026",
    slug: "gravity-bridge-2026",
    title: "Gravity Bridge",
    subtitle: "Bridge Signing Key Compromise",
    year: 2026,
    chain: "Ethereum/Cosmos",
    type: ["Bridge", "Access Control"],
    shortDesc: "Gravity Bridge signing key compromise authorized fraudulent cross-chain transfers, draining $5.4M.",
    longDesc: "On May 30, 2026, Gravity Bridge between Ethereum and Cosmos lost $5.4M when bridge signing keys were compromised. The attacker used the stolen keys to sign fraudulent cross-chain transfer messages, minting or releasing unbacked assets on the destination chain before the bridge operators could halt operations.",
    technicalDesc: "Gravity Bridge was compromised through signing-key custody failure, which undermined message authenticity assumptions. The vulnerable pattern was trust in validator signatures without sufficient resilience to key theft and without strong anomaly friction for large releases. The attacker generated valid signatures for fraudulent transfer payloads, causing destination-side release/mint actions without equivalent source deposits. Checks failed because cryptographic verification confirmed compromised credentials, so messages were valid-form but invalid-intent. Bridge safety therefore depended on signer hygiene and threshold robustness more than contract arithmetic. Auditors should inspect signer key storage, threshold policy, independent message sanity checks, and automated circuit breakers for sudden transfer-volume anomalies even when signatures verify correctly.",
    impact: "$5.4M",
    impactUSD: 5400000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Key Compromise", description: "Bridge signing keys compromised via operational security failure.", functionsCall: [], pseudocode: "// Validator/bridge signing key\n// Extracted from infrastructure" },
      { id: "t2", phase: "Forged Signatures", description: "Attacker signed fraudulent cross-chain transfer messages.", functionsCall: ["Bridge.signTransfer(forged_msg)"], pseudocode: "// Valid signatures on\n// unauthorized transfers" },
      { id: "t3", phase: "Asset Release", description: "Forged signatures authorized release of bridged assets on destination chain.", functionsCall: ["Bridge.releaseAssets($5.4M)"], pseudocode: "// Ethereum + Cosmos affected\n// Unbacked releases" },
      { id: "t4", phase: "Bridge Halt", description: "Gravity Bridge operators halted bridge and rotated signing keys.", functionsCall: ["Bridge.halt()", "Bridge.rotateKeys()"], pseudocode: "// Signing ceremony restarted\n// Fraudulent messages invalidated" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Signing keys", x: 50, y: 200 },
        { id: "n2", type: "bridge", label: "Gravity Bridge", detail: "Key compromise", x: 250, y: 200 },
        { id: "n3", type: "vault", label: "Bridged Assets", detail: "$5.4M", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "Released", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Compromise keys" },
        { id: "e2", source: "n2", target: "n3", label: "Forge signatures", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "Release assets" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Bridge Signing\nKeys", type: "attacker" },
      { id: "b", label: "Gravity\nBridge", type: "bridge" },
      { id: "c", label: "Attacker\n$5.4M", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 5.4, label: "Forged signatures" },
      { source: "b", target: "c", value: 5.4, label: "Asset release" }
    ],
    mitigations: [
      { category: "Key Security", description: "Use HSM or MPC for bridge signing keys. Never store keys in application servers." },
      { category: "Multi-Sig Bridge", description: "Require M-of-N validator signatures for all cross-chain transfers above threshold." },
      { category: "Transfer Monitoring", description: "Real-time monitoring with automatic halt on anomalous outbound transfer volumes." }
    ],
    quiz: [
      {
        question: "What was Gravity Bridge's root-cause category?",
        options: ["Key-custody compromise of bridge signing authority", "Reentrancy in withdraw", "Liquidity oracle delay", "Governance quorum bug"],
        correct: 0,
        explanation: "Compromised signing keys allowed fraudulent but cryptographically valid bridge messages.",
      },
      {
        question: "How did fraudulent transfers pass protocol checks?",
        options: ["By bypassing signature verification completely", "By using stolen keys to produce signatures that verified as valid", "By rewriting chain history", "By exploiting frontend caching"],
        correct: 1,
        explanation: "Verification accepted attacker-signed messages because the keys themselves were compromised.",
      },
      {
        question: "Best mitigation direction for this threat?",
        options: ["HSM/MPC custody, stronger thresholding, and anomaly-based auto-halt", "Higher bridge UI contrast", "Disable event indexing", "Increase token logo resolution"],
        correct: 0,
        explanation: "Custody hardening and behavioral guardrails reduce both chance and impact of key compromise.",
      },
    ]
  },

  // Alephium Bridge (May 30, 2026)
  {
    id: "alephium-bridge-2026",
    slug: "alephium-bridge-2026",
    title: "Alephium Bridge",
    subtitle: "Forged Wormhole Messages via Backend Vuln",
    year: 2026,
    chain: "Ethereum/BNB Chain",
    type: ["Bridge", "Supply Chain"],
    shortDesc: "Off-chain backend vulnerability forged Wormhole messages (not private key compromise), draining $815K.",
    longDesc: "On May 30, 2026, the Alephium Bridge on Ethereum and BNB Chain lost $815K when an attacker exploited an off-chain backend vulnerability to forge Wormhole cross-chain messages. Unlike typical bridge exploits, this did not involve private key compromise — the backend logic itself was manipulated to produce valid-appearing messages.",
    technicalDesc: "Alephium's bridge incident originated in off-chain backend validation logic rather than guardian private key theft. The vulnerable pattern was trusting backend-produced message attestations without end-to-end cryptographic enforcement at the final execution boundary. The attacker exploited backend handling, forged valid-appearing Wormhole-style messages, and triggered unauthorized unlocks on destination chains. Checks failed because backend acceptance criteria could be manipulated and on-chain safeguards did not independently reject forged attestations early enough. This turned infrastructure compromise into protocol-level asset release despite intact guardian key custody. Auditors should treat relayer/backends as part of the trust base, require strict on-chain guardian-signature verification, and adversarially test malformed or backend-forged message pathways.",
    impact: "$815K",
    impactUSD: 815000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Backend Vuln Discovery", description: "Attacker found off-chain backend flaw in Wormhole message processing.", functionsCall: [], pseudocode: "// Backend validation bypass\n// Not a guardian key issue" },
      { id: "t2", phase: "Message Forgery", description: "Forged Wormhole VAA messages via backend vulnerability.", functionsCall: ["Backend.forgeVAA(malicious_payload)"], pseudocode: "// Valid-appearing VAAs created\n// Without guardian signatures" },
      { id: "t3", phase: "Token Unlock", description: "Forged messages authorized token unlocks on Ethereum and BNB Chain.", functionsCall: ["Wormhole.completeTransfer(forged_vaa)"], pseudocode: "// $815K unlocked\n// No real source deposit" },
      { id: "t4", phase: "Backend Patch", description: "Alephium patched backend and paused bridge pending audit.", functionsCall: ["Bridge.pause()"], pseudocode: "// Backend hardened\n// Message validation fixed" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Backend exploit", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Bridge Backend", detail: "Vuln in validation", x: 250, y: 200 },
        { id: "n3", type: "bridge", label: "Wormhole", detail: "Forged VAAs", x: 450, y: 200 },
        { id: "n4", type: "result", label: "Attacker", detail: "$815K", x: 650, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Exploit backend", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Forge VAAs" },
        { id: "e3", source: "n3", target: "n4", label: "Unlock tokens" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Bridge\nBackend", type: "attacker" },
      { id: "b", label: "Forged\nWormhole VAAs", type: "bridge" },
      { id: "c", label: "Attacker\n$815K", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.82, label: "Forge messages" },
      { source: "b", target: "c", value: 0.82, label: "Unlock" }
    ],
    mitigations: [
      { category: "Backend Security", description: "Harden off-chain bridge backends with strict input validation and independent VAA signature verification." },
      { category: "Guardian Verification", description: "Always verify Wormhole guardian signatures on-chain, never trust backend-only validation." },
      { category: "Defense in Depth", description: "Require both on-chain guardian verification and backend checks for all cross-chain messages." }
    ],
    quiz: [
      {
        question: "What distinguishes Alephium Bridge's root cause from typical bridge hacks?",
        options: ["It was caused by LP impermanent loss", "Forged messages came from backend-validation weakness, not guardian key theft", "It used only flash loans", "It required smart-contract selfdestruct"],
        correct: 1,
        explanation: "The attacker abused off-chain backend logic to forge transfer attestations.",
      },
      {
        question: "How did the forged messages lead to loss?",
        options: ["They triggered unauthorized token unlock/completion on destination chains", "They changed token metadata only", "They paused bridge operations", "They forced validators offline"],
        correct: 0,
        explanation: "Destination contracts accepted forged attestations and released value without real deposits.",
      },
      {
        question: "Most effective mitigation for this architecture?",
        options: ["Rely on backend checks only but add retries", "Enforce independent on-chain signature verification and harden backend pipeline", "Disable monitoring dashboards", "Increase bridge message size"],
        correct: 1,
        explanation: "Defense-in-depth requires both hardened backend logic and strict on-chain cryptographic checks.",
      },
    ]
  },

  // AROS (May 31, 2026)
  {
    id: "aros-2026",
    slug: "aros-2026",
    title: "AROS",
    subtitle: "Suspected Pool/Token Manipulation",
    year: 2026,
    chain: "BNB Chain",
    type: ["Price Manipulation"],
    shortDesc: "Suspected pool/token manipulation on BSC drained $295K; root cause unconfirmed per available sources.",
    longDesc: "On May 31, 2026, AROS on BNB Chain suffered a $295K loss in an incident suspected to involve pool or token price manipulation. Available sources have not confirmed the exact root cause. On-chain analysis suggests the attacker may have manipulated AMM pool reserves or token pricing to extract value from liquidity providers.",
    technicalDesc: "Available evidence points to a likely pool or token-mechanics manipulation, but the exact exploit primitive remains unconfirmed. The vulnerable pattern appears to be price formation sensitivity where reserves, transfer behavior, or pool accounting could be distorted for short-window extraction. The attacker staged liquidity and token movements to create temporary mispricing, then executed swaps that realized value before normal state reversion. Checks failed because guardrails such as robust TWAP enforcement, deviation circuit breakers, or deep sanity bounds were insufficient to halt abnormal conditions quickly. Since root cause is unresolved, treating any single mechanism as definitive would be premature. Auditors should reconstruct full transaction traces, test transfer-hook edge cases, and stress pool math against adversarial reserve-shift scenarios before finalizing remediation.",
    impact: "$295K",
    impactUSD: 295000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Preparation", description: "Attacker likely acquired tokens and studied AROS pool mechanics on BSC.", functionsCall: [], pseudocode: "// Root cause unconfirmed\n// Pool manipulation suspected" },
      { id: "t2", phase: "Price Manipulation", description: "Suspected manipulation of pool reserves or token pricing.", functionsCall: ["Pool.manipulate()"], pseudocode: "// AMM reserve distortion\n// Exact method unconfirmed" },
      { id: "t3", phase: "Value Extraction", description: "Extracted $295K via distorted swap pricing.", functionsCall: ["Pool.swap(extract)"], pseudocode: "// $295K drained from LPs" },
      { id: "t4", phase: "Investigation", description: "AROS paused pools; root cause analysis ongoing.", functionsCall: ["AROS.pause()"], pseudocode: "// Incident under investigation\n// No confirmed exploit vector" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Suspected manipulation", x: 50, y: 200 },
        { id: "n2", type: "pool", label: "AROS Pool", detail: "Reserve distortion", x: 300, y: 200 },
        { id: "n3", type: "result", label: "Attacker", detail: "$295K", x: 550, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Manipulate pool", animated: true },
        { id: "e2", source: "n2", target: "n3", label: "Extract value" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "AROS Pool\nBSC", type: "pool" },
      { id: "b", label: "Suspected\nManipulation", type: "attacker" },
      { id: "c", label: "Attacker\n$295K", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.3, label: "Manipulate" },
      { source: "b", target: "c", value: 0.3, label: "Extract" }
    ],
    mitigations: [
      { category: "Pool Monitoring", description: "Monitor AMM pools for anomalous reserve changes and large single-block price swings." },
      { category: "TWAP Protection", description: "Use time-weighted average pricing to resist single-block manipulation attacks." },
      { category: "Circuit Breakers", description: "Pause pools automatically when price deviates beyond threshold from oracle reference." }
    ],
    quiz: [
      {
        question: "What is currently confirmed about AROS root cause?",
        options: ["Confirmed reentrancy in withdrawal", "Confirmed bridge key compromise", "Exact vector unconfirmed, with pool/token manipulation suspected", "Confirmed oracle signer collusion"],
        correct: 2,
        explanation: "Public evidence indicates suspicion of manipulation, but no definitive primitive has been confirmed.",
      },
      {
        question: "What attack mechanism is most consistent with reported behavior?",
        options: ["Temporary reserve/price distortion followed by extraction swaps", "Malicious proxy upgrade by admin", "Forged Merkle claims", "DNS hijack of frontend"],
        correct: 0,
        explanation: "The incident profile aligns with transient pricing distortion and opportunistic swap extraction.",
      },
      {
        question: "What mitigation is most prudent while investigation is ongoing?",
        options: ["Ignore until full certainty", "Add TWAP/deviation circuit breakers and deep transaction-trace forensic review", "Increase token supply", "Disable all user withdrawals forever"],
        correct: 1,
        explanation: "Interim guardrails plus forensic reconstruction reduce immediate risk while root cause is finalized.",
      },
    ]
  },

  // Fluid (May 27, 2026)
  {
    id: "fluid-lending-2026",
    slug: "fluid-lending-2026",
    title: "Fluid",
    subtitle: "Dual Merkle Reward Key Compromise",
    year: 2026,
    chain: "Ethereum",
    type: ["Access Control"],
    shortDesc: "Attacker held both Merkle reward proposer and approver keys, authorizing fraudulent $215K reward claims on Ethereum.",
    longDesc: "On May 27, 2026, Fluid on Ethereum lost $215K when an attacker compromised both the Merkle reward proposer and approver private keys. With control of both roles in the two-step reward distribution pipeline, the attacker crafted and approved fraudulent Merkle reward claims without needing to compromise additional signers.",
    technicalDesc: "Fluid's reward pipeline failed because control points in a two-step Merkle process were compromised simultaneously. The vulnerable pattern was assuming proposer/approver separation alone provided security, without additional quorum, budget, or anomaly constraints. The attacker proposed fraudulent Merkle roots allocating inflated rewards to attacker addresses, then approved the same roots using the second compromised key. Checks failed because each step validated cryptographic format but not independence of control or economic plausibility of payout totals. Once published, claims were executed through normal proof verification, making drains appear protocol-compliant. Auditors should require multi-party approval for root publication, enforce proposer-approver separation at infrastructure and organization levels, and add automated budget/inclusion sanity checks before claim windows open.",
    impact: "$215K",
    impactUSD: 215000,
    contracts: [],
    timeline: [
      { id: "t1", phase: "Dual Key Compromise", description: "Attacker obtained both Merkle reward proposer and approver private keys.", functionsCall: [], pseudocode: "// Both roles compromised\n// Full reward pipeline control" },
      { id: "t2", phase: "Fraudulent Merkle Root", description: "Proposed merkle tree with inflated reward allocations to attacker addresses.", functionsCall: ["Rewards.proposeMerkleRoot(forged_tree)"], pseudocode: "// Attacker addresses over-rewarded\n// Proposer key used" },
      { id: "t3", phase: "Self-Approval", description: "Approved own fraudulent merkle root using compromised approver key.", functionsCall: ["Rewards.approveMerkleRoot(forged_tree)"], pseudocode: "// Both steps by same attacker\n// No independent review" },
      { id: "t4", phase: "Reward Claim", description: "Claimed $215K in fraudulent Merkle rewards.", functionsCall: ["Rewards.claim(forged_proof)"], pseudocode: "// $215K extracted\n// Keys rotated" }
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Both keys", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Proposer Key", detail: "Compromised", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "Approver Key", detail: "Compromised", x: 250, y: 300 },
        { id: "n4", type: "vault", label: "Merkle Rewards", detail: "$215K", x: 500, y: 200 },
        { id: "n5", type: "result", label: "Attacker", detail: "Claimed", x: 700, y: 200 }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Propose forged root" },
        { id: "e2", source: "n1", target: "n3", label: "Approve own root" },
        { id: "e3", source: "n2", target: "n4", label: "Submit", animated: true },
        { id: "e4", source: "n4", target: "n5", label: "Claim rewards" }
      ]
    },
    tokenFlowNodes: [
      { id: "a", label: "Proposer +\nApprover Keys", type: "attacker" },
      { id: "b", label: "Merkle Reward\nPipeline", type: "vault" },
      { id: "c", label: "Attacker\n$215K", type: "drain" }
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.22, label: "Forge + approve" },
      { source: "b", target: "c", value: 0.22, label: "Claim" }
    ],
    mitigations: [
      { category: "Role Separation", description: "Ensure proposer and approver keys are held by different individuals with independent key management." },
      { category: "Multi-Sig Approval", description: "Require M-of-N multi-sig for merkle root approval instead of a single approver key." },
      { category: "Reward Auditing", description: "Automated checks comparing proposed reward totals against expected distribution budgets." }
    ],
    quiz: [
      {
        question: "What was the core root cause in Fluid's reward exploit?",
        options: ["Broken Merkle proof verifier", "Compromise of both proposer and approver keys in a two-step pipeline", "Bridge replay attack", "Oracle decimal mismatch"],
        correct: 1,
        explanation: "Control of both roles removed the intended separation-of-duties safeguard.",
      },
      {
        question: "How did the attacker pass technical validation?",
        options: ["By submitting malformed proofs", "By proposing forged roots and self-approving them before claiming", "By reentering claim() repeatedly", "By censoring validator blocks"],
        correct: 1,
        explanation: "With both keys, the attacker could complete the full publication path using valid signatures.",
      },
      {
        question: "Which mitigation best addresses this failure mode?",
        options: ["Single approver with longer key length", "Multisig approval plus independent role custody and reward-budget sanity checks", "Lower reward amount globally", "Disable Merkle trees"],
        correct: 1,
        explanation: "Security must combine independent custody with quorum and economic validation safeguards.",
      },
    ]
  },

  // Raydium (June 10, 2026)
  {
    id: "raydium-2026",
    slug: "raydium-2026",
    title: "Raydium",
    subtitle: "Missing LP Mint Validation - Legacy AMM V3",
    year: 2026,
    chain: "Solana",
    chains: ["Solana"],
    type: ["Access Control", "Logic Error"],
    shortDesc:
      "A missing LP mint validation check in Raydium's legacy AMM V3 program allowed an attacker to substitute a fake mint, manipulate the redemption calculation, and drain ~$1.34M from four pools within seconds.",
    longDesc:
      "On June 10, 2026, four pools on Raydium's legacy AMM v3 program on Solana were exploited for approximately $1.34M. The withdrawal handler did not verify that a caller-supplied LP Mint account matched the pool's stored counterpart, so the attacker substituted a controlled account to manipulate the payout calculation. By creating a fake LP Mint with supply=1 and burning 1 token, the attacker received 100% of each pool's reserves. The same technique drained all four pools — RAY/USDC, RAY/wSOL, RAY/SRM, and RAY/Sollet ETH — within approximately 15 seconds. The legacy program had been live and unchanged since its last upgrade on January 3, 2023, approximately 1,254 days before the exploit.",
    technicalDesc:
      "The vulnerable program (27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv) was not open-sourced, and its executable data was closed after the attack. Analysis is based on bytecode reconstructed from the program's last upgrade buffer. In the withdrawal handler, the LP Mint account passed by the caller was not bound to the pool's recorded `amm.lp_mint`. The handler checked bindings for the pool state, PDA authority, both vaults, and user accounts — but not for the LP Mint at slot 5. Because the LP Mint account was unbound, an attacker could substitute a Mint account they fully controlled. Setting its total supply to 1 and minting 1 token yielded a payout ratio of 1/1 = 100% of each reserve. The formula `coin_out = total_coin * withdraw_amount / lp_supply` computed `total_coin * 1 / 1 = total_coin`, draining the entire pool. By contrast, all other Raydium mainnet programs use a virtual supply mechanism for proportion checks and correctly verify the LP mint along with all other relevant account information.",
    impact: "$1.34 million",
    impactUSD: 1340000,
    contracts: [
      {
        label: "Raydium Legacy AMM V3 (Exploited)",
        address: "27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv",
        url: "https://solscan.io/account/27haf8L6oxUeXrHrgEgsexjSY5hbVUWEmvv9Nyxg8vQv",
      },
      {
        label: "Attacker Wallet",
        address: "4WnPebowR4HHfumvNPaDjG6Pa5Hi1jxLm6xmmBq33QVk",
        url: "https://solscan.io/account/4WnPebowR4HHfumvNPaDjG6Pa5Hi1jxLm6xmmBq33QVk",
      },
    ],
    transactions: [
      {
        hash: "1csN6vZKFKpeJEcwZhoiM99xoRJVY7EC3P28CE6kHYrKyrVfj2L5Sf5HfhxeBGxSsuhtFvWmkhVYXtyUAQH3s7s",
        label: "RAY/USDC Pool Drain (~893,700 USDC + ~66,837 RAY)",
        chain: "solana",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Fake Mint Creation",
        description:
          "Attacker creates a fake LP Mint account on Solana with decimals=0 and total supply=0.",
        functionsCall: ["SystemProgram.create_account()", "Token.createInitializeMintInstruction()"],
        pseudocode:
          "// Fake LP Mint: decimals=0, supply=0\n// No authority restrictions — attacker controls it",
        timestamp: "June 10, 2026",
      },
      {
        id: "t2",
        phase: "Token Account Setup",
        description:
          "Attacker initializes a Token account bound to the fake LP Mint, then mints exactly 1 token into it as the Mint authority, pinning the supply to 1.",
        functionsCall: ["Token.createInitializeAccountInstruction()", "Mint.mintTo(1)"],
        pseudocode:
          "// Attacker owns the mint authority\n// mintTo(attacker_token_account, 1)\n// lp_mint.supply = 1",
      },
      {
        id: "t3",
        phase: "Withdrawal Exploit — RAY/USDC",
        description:
          "Attacker calls the withdrawal function passing the fake LP Mint in the expected account slot. With withdraw_amount=1 and lp_supply=1, the handler computes total_coin * 1 / 1 = 100% of reserves (~893,700 USDC + ~66,837 RAY).",
        functionsCall: ["RaydiumAmmV3.withdraw(coin_amount=MAX, pc_amount=MAX)"],
        pseudocode:
          "// coin_out = total_coin * withdraw_amount / lp_mint.supply\n// coin_out = 893700 * 1 / 1 = 893,700 USDC\n// pc_out   = 66837 * 1 / 1 = 66,837 RAY\n// Full pool reserves drained",
        txns: [
          {
            hash: "1csN6vZKFKpeJEcwZhoiM99xoRJVY7EC3P28CE6kHYrKyrVfj2L5Sf5HfhxeBGxSsuhtFvWmkhVYXtyUAQH3s7s",
            label: "RAY/USDC drain",
            chain: "solana",
          },
        ],
      },
      {
        id: "t4",
        phase: "Repeat — 3 More Pools",
        description:
          "Attacker repeats the exact same pattern against three more pools within approximately 15 seconds: RAY/wSOL (~5,603 wSOL + ~74,720 RAY), RAY/SRM (~10,692 SRM + ~8,622 RAY), and RAY/Sollet ETH (~16 Sollet ETH + ~5,038 RAY).",
        functionsCall: ["RaydiumAmmV3.withdraw()", "RaydiumAmmV3.withdraw()", "RaydiumAmmV3.withdraw()"],
        pseudocode:
          "// Same attack vector × 3 more pools\n// Total drained: ~150,177 RAY + ~5,603 SOL + ~893,700 USDC\n// All within ~15 seconds",
      },
      {
        id: "t5",
        phase: "Program Closure",
        description:
          "The exploited legacy program's executable data (ProgramData) was closed the same day. Raydium confirmed full compensation via treasury.",
        functionsCall: [],
        pseudocode:
          "// Legacy AMM V3 program closed\n// No propagation risk — self-contained logic flaw\n// Raydium treasury to compensate affected users",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Created fake LP Mint", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Fake LP Mint", detail: "supply=1, attacker-controlled", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "Legacy AMM V3", detail: "No LP mint validation", x: 450, y: 200 },
        { id: "n4", type: "pool", label: "RAY/USDC Pool", detail: "~$893K reserves", x: 650, y: 100 },
        { id: "n5", type: "pool", label: "3 More Pools", detail: "~$447K combined", x: 650, y: 300 },
        { id: "n6", type: "result", label: "Attacker", detail: "$1.34M drained", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Create fake mint + mint 1 token" },
        { id: "e2", source: "n2", target: "n3", label: "Substitute in withdraw slot", animated: true },
        { id: "e3", source: "n3", target: "n4", label: "100% payout (1/1 ratio)" },
        { id: "e4", source: "n3", target: "n5", label: "Repeat × 3 pools" },
        { id: "e5", source: "n4", target: "n6", label: "Drain", animated: true },
        { id: "e6", source: "n5", target: "n6", label: "Drain", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Fake LP Mint\n(supply=1)", type: "attacker" },
      { id: "b", label: "Legacy AMM V3\n(Unbound Check)", type: "vault" },
      { id: "c", label: "RAY/USDC Pool\n~893K USDC", type: "pool" },
      { id: "d", label: "RAY/wSOL, RAY/SRM,\nRAY/Sollet ETH", type: "pool" },
      { id: "e", label: "Attacker Wallet\n$1.34M", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.001, label: "Fake mint substituted" },
      { source: "b", target: "c", value: 0.894, label: "100% withdrawal" },
      { source: "b", target: "d", value: 0.447, label: "100% × 3 pools" },
      { source: "c", target: "e", value: 0.894, label: "Drained" },
      { source: "d", target: "e", value: 0.447, label: "Drained" },
    ],
    mitigations: [
      {
        category: "Account Validation",
        description:
          "Every caller-supplied account must be bound to its canonical counterpart stored in pool state. Reject any LP Mint whose key does not match the pool's stored `amm.lp_mint`.",
        code: "require!(amm_lp_mint_info.key == &amm.lp_mint, ErrorCode::InvalidLpMint);",
      },
      {
        category: "Virtual Supply Mechanism",
        description:
          "Use a virtual supply internally rather than reading from an externally supplied Mint account. This eliminates the trust boundary entirely.",
      },
      {
        category: "Legacy Program Deprecation",
        description:
          "Actively sunset and close deprecated programs. Idle liquidity in legacy deployments creates attack surface with no active monitoring.",
      },
      {
        category: "Bytecode Verification",
        description:
          "Open-source program bytecode or maintain verifiable build pipelines so the community can audit programs even after upgrades.",
      },
    ],
    quiz: [
      {
        question: "What was the single missing check that enabled the Raydium exploit?",
        options: [
          "Reentrancy guard on the withdraw function",
          "Binding the caller-supplied LP Mint to the pool's stored amm.lp_mint",
          "Rate limiting on withdrawal frequency",
          "Oracle price validation before payout",
        ],
        correct: 1,
        explanation: "The withdrawal handler read lp_supply from a caller-supplied Mint account without verifying it matched the pool's canonical LP Mint. This allowed substitution of a fake mint with supply=1.",
      },
      {
        question: "Why did a fake LP Mint with supply=1 drain 100% of reserves?",
        options: [
          "The contract had a reentrancy bug that doubled the payout",
          "The payout formula total_coin * withdraw_amount / lp_supply computed total_coin * 1 / 1 = total_coin",
          "The attacker used a flash loan to inflate the pool balance",
          "The oracle reported an incorrect token price",
        ],
        correct: 1,
        explanation: "With withdraw_amount=1 and lp_supply=1 (from the fake mint), the proportional calculation returned the entire reserve balance.",
      },
      {
        question: "How does Raydium's current (non-legacy) program prevent this attack class?",
        options: [
          "It uses time-locked withdrawals with a 24-hour delay",
          "It uses a virtual supply mechanism and correctly verifies the LP mint and all other accounts",
          "It requires multi-sig approval for every withdrawal",
          "It uses Chainlink oracles to validate LP token prices",
        ],
        correct: 1,
        explanation: "Raydium's current programs use virtual supply for proportion checks and bind all caller-supplied accounts to their canonical counterparts in pool state.",
      },
    ],
  },

  // Ostium (July 16, 2026)
  {
    id: "ostium-2026",
    slug: "ostium-2026",
    title: "Ostium",
    subtitle: "Compromised Oracle Signer + Keeper Key — $24M USDC",
    year: 2026,
    chain: "Arbitrum",
    chains: ["Arbitrum"],
    type: ["Access Control", "Oracle Manipulation"],
    shortDesc:
      "An attacker who obtained both an authorized oracle-signer key and a PriceUpKeep forwarder submitted future-dated signed price reports, opening and closing synthetic positions against them to drain $23.75M USDC from Ostium's OLP vault in 8 transactions.",
    longDesc:
      "On July 16, 2026, Ostium, a platform for synthetic trading of stocks, commodities, forex, and crypto on Arbitrum, was exploited for approximately $23.75M in USDC. The attacker obtained legitimate credentials for both an authorized oracle-signer key and a registered PriceUpKeep forwarder — the keeper role responsible for fulfilling pending orders. Using this combination, they submitted future-dated, correctly signed price reports and repeatedly opened and closed positions against them. This allowed them to appear to generate trading profits from the system's view without any real market exposure. The exploit was carried out over 8 transactions, with the largest single payout (~$11.86M) executed in one atomic batch that looped through open-and-close cycles. All 8 transactions routed through the same contract pair (Ostium: Trading → Ostium: Private PriceUpKeep) and paid out to the same wallet.",
    technicalDesc:
      "Ostium's oracle system authorizes price data by verifying the signer's identity against an authorized list — it validates WHO signed, not WHETHER the price is accurate. The verifier takes a price report, derives the signer from the signature, and checks inclusion in the authorized set. The attacker who held both an authorized oracle-signer key and a registered PriceUpKeep forwarder (the keeper role responsible for fulfilling pending orders) exploited this design: they submitted a future-dated, correctly signed price report and then repeatedly opened and closed positions against it. From the system's perspective, the attacker appeared to generate legitimate trading profits. In reality, there was no real market exposure — the prices were manufactured. Both the signer and forwarder roles are meant to be granted only by Ostium governance/timelock and are not self-assignable. The exploit worked because the attacker obtained legitimate credentials for each role, not because of a flaw in Ostium's trading logic itself. The OLP vault (0x20d419a8e12c45f88fda7c5760bb6923cee27f98) was the source of all drained funds.",
    impact: "$23.75 million",
    impactUSD: 23750000,
    contracts: [
      {
        label: "Ostium OLP Vault",
        address: "0x20d419a8e12c45f88fda7c5760bb6923cee27f98",
        url: "https://arbiscan.io/address/0x20d419a8e12c45f88fda7c5760bb6923cee27f98",
      },
      {
        label: "Ostium PriceUpKeep",
        address: "0xb71ec9ebd8145dacacf6724363143cb5667a3d36",
        url: "https://arbiscan.io/address/0xb71ec9ebd8145dacacf6724363143cb5667a3d36",
      },
      {
        label: "Attacker Wallet",
        address: "0x321df194646029e7a6193ea05573d4b9c398bfd9",
        url: "https://arbiscan.io/address/0x321df194646029e7a6193ea05573d4b9c398bfd9",
      },
    ],
    transactions: [
      {
        hash: "0x4b7ff5de823dd7af29cf1a6602a84d7b6eee354edcbaf0427fd5e691d3d80951",
        label: "Drain #1 — 898 USDC (test tx)",
        chain: "arbitrum",
      },
      {
        hash: "0x359f8c05b86a4409d60cfba02084334313fd94b19f74a294fb7fc4ea7d4870e0",
        label: "Drain #2 — 11.86M USDC (largest, atomic loop)",
        chain: "arbitrum",
      },
      {
        hash: "0x56e4139a2f51e99933479becee21812dd2ec656128f6f3593a7fa225e2f24adc",
        label: "Drain #3 — 13,480 USDC",
        chain: "arbitrum",
      },
      {
        hash: "0x397daa6c23c87670f949a970961b1014e966cc40301a99b55c3c1908dd61418e",
        label: "Drain #4 — 13,480 USDC",
        chain: "arbitrum",
      },
      {
        hash: "0xd9f91cc3eaec695f45bffad3a068fa52e1625ed44bfcc47d6ac3938f78d9061d",
        label: "Drain #5 — 4.49M USDC",
        chain: "arbitrum",
      },
      {
        hash: "0x3b04639ab9b40760b2138e7bfa7eccc9657f3a767a5c414dbb1b3632ed71f3bf",
        label: "Drain #6 — 3.59M USDC",
        chain: "arbitrum",
      },
      {
        hash: "0x6c254483fa47a14622662e792bc3728ab3c408a33d3cbb5712434ba96f5ecdc2",
        label: "Drain #7 — 2.7M USDC",
        chain: "arbitrum",
      },
      {
        hash: "0xfaf6d3d4d7f1a75bfc11fb4d36d0525791546267fda1cdd371703ce03ae8ba8c",
        label: "Drain #8 — 1.08M USDC",
        chain: "arbitrum",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Credential Acquisition",
        description:
          "Attacker obtains legitimate credentials for both an authorized oracle-signer key and a registered PriceUpKeep forwarder — the keeper role responsible for fulfilling pending orders. Both roles are granted by Ostium governance/timelock.",
        functionsCall: [],
        pseudocode:
          "// Both roles are governance-granted, not self-assignable\n// Attacker obtained: oracle-signer key + PriceUpKeep forwarder\n// Method of acquisition unknown (likely social engineering or insider)",
        timestamp: "Before July 16, 2026",
      },
      {
        id: "t2",
        phase: "Future-Dated Price Report",
        description:
          "Using the compromised signer key, attacker submits a future-dated, correctly signed price report to the oracle system. The verifier only checks signer identity, not price accuracy.",
        functionsCall: ["PriceUpKeep.performUpkeep(signedPriceReport)"],
        pseudocode:
          "// Oracle verifier:\n// 1. Derive signer from signature\n// 2. Check signer is in authorized set\n// 3. Accept price — NO validation of price accuracy\n// Future-dated report accepted because signature is valid",
      },
      {
        id: "t3",
        phase: "Test Transaction",
        description:
          "Attacker executes a small test withdrawal of 898 USDC to confirm the exploit works before scaling up.",
        functionsCall: ["OstiumTrading.openPosition()", "OstiumTrading.closePosition()"],
        pseudocode:
          "// Small test: 898 USDC\n// Open position → close position → profit from fake price\n// Confirms system accepts manufactured trades",
        txns: [
          {
            hash: "0x4b7ff5de823dd7af29cf1a6602a84d7b6eee354edcbaf0427fd5e691d3d80951",
            label: "Test drain (898 USDC)",
          },
        ],
      },
      {
        id: "t4",
        phase: "Mass Exploitation — Atomic Loop",
        description:
          "Attacker executes the largest single payout (~$11.86M) in one atomic batch that loops through open-and-close cycles against the future-dated price, extracting maximum value per transaction.",
        functionsCall: [
          "OstiumTrading.openPosition() × N",
          "OstiumTrading.closePosition() × N",
        ],
        pseudocode:
          "// Single atomic tx loops:\n// for i in range(N):\n//   open_position(size_i)  → filled at fake future price\n//   close_position(size_i) → settled at fake future price\n//   profit = (fake_close - fake_open) × size\n// OLP vault pays out the 'profit' in real USDC\n// Total: ~$11.86M in one batch",
        txns: [
          {
            hash: "0x359f8c05b86a4409d60cfba02084334313fd94b19f74a294fb7fc4ea7d4870e0",
            label: "Mass drain (11.86M USDC)",
          },
        ],
      },
      {
        id: "t5",
        phase: "Remaining Payouts",
        description:
          "Attacker extracts the remaining ~$11.88M across 6 more transactions, each routing through the same Ostium: Trading → Ostium: Private PriceUpKeep contract pair.",
        functionsCall: [
          "OstiumTrading.openPosition()",
          "OstiumTrading.closePosition()",
        ],
        pseudocode:
          "// 6 more transactions\n// Same pattern: open against fake price, close for profit\n// All route: Trading → PriceUpKeep\n// All pay to: 0x321Df1...8bfD9",
        txns: [
          {
            hash: "0x56e4139a2f51e99933479becee21812dd2ec656128f6f3593a7fa225e2f24adc",
            label: "Drain #3 (13,480 USDC)",
          },
          {
            hash: "0x397daa6c23c87670f949a970961b1014e966cc40301a99b55c3c1908dd61418e",
            label: "Drain #4 (13,480 USDC)",
          },
          {
            hash: "0xd9f91cc3eaec695f45bffad3a068fa52e1625ed44bfcc47d6ac3938f78d9061d",
            label: "Drain #5 (4.49M USDC)",
          },
          {
            hash: "0x3b04639ab9b40760b2138e7bfa7eccc9657f3a767a5c414dbb1b3632ed71f3bf",
            label: "Drain #6 (3.59M USDC)",
          },
          {
            hash: "0x6c254483fa47a14622662e792bc3728ab3c408a33d3cbb5712434ba96f5ecdc2",
            label: "Drain #7 (2.7M USDC)",
          },
          {
            hash: "0xfaf6d3d4d7f1a75bfc11fb4d36d0525791546267fda1cdd371703ce03ae8ba8c",
            label: "Drain #8 (1.08M USDC)",
          },
        ],
      },
      {
        id: "t6",
        phase: "All Funds Extracted",
        description:
          "All 8 transactions complete. Total drained: ~$23.75M USDC from the OLP vault, all paid to a single attacker wallet.",
        functionsCall: [],
        pseudocode:
          "// Total: $23.75M USDC\n// 8 transactions, same destination wallet\n// OLP vault depleted",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "Holds signer + keeper keys", x: 50, y: 200 },
        { id: "n2", type: "oracle", label: "Oracle Signer", detail: "Compromised authorized key", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "PriceUpKeep", detail: "Keeper forwarder", x: 250, y: 300 },
        { id: "n4", type: "contract", label: "Ostium Trading", detail: "Accepts fake prices", x: 450, y: 200 },
        { id: "n5", type: "pool", label: "OLP Vault", detail: "$23.75M USDC", x: 650, y: 200 },
        { id: "n6", type: "result", label: "Attacker", detail: "$23.75M drained", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Sign future-dated price report" },
        { id: "e2", source: "n1", target: "n3", label: "Trigger performUpkeep" },
        { id: "e3", source: "n2", target: "n4", label: "Feed manufactured price", animated: true },
        { id: "e4", source: "n3", target: "n4", label: "Fulfill pending orders" },
        { id: "e5", source: "n4", target: "n5", label: "Open/close × N cycles", animated: true },
        { id: "e6", source: "n5", target: "n6", label: "Drain $23.75M USDC", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "Attacker\n(Signer + Keeper)", type: "attacker" },
      { id: "b", label: "Ostium Trading\n(Manufactured PnL)", type: "vault" },
      { id: "c", label: "OLP Vault\n$23.75M USDC", type: "pool" },
      { id: "d", label: "Attacker Wallet\n0x321Df1...8bfD9", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.1, label: "Fake price + trades" },
      { source: "b", target: "c", value: 23.75, label: "8 drain txns" },
      { source: "c", target: "d", value: 23.75, label: "USDC extracted" },
    ],
    mitigations: [
      {
        category: "Oracle Price Validation",
        description:
          "Validate not just the signer's identity but also the price itself. Implement circuit breakers that reject prices deviating significantly from external reference feeds (Chainlink, TWAP).",
        code: "require(abs(reportPrice - externalOracle) / externalOracle < MAX_DEVIATION);",
      },
      {
        category: "Multi-Party Oracle Consensus",
        description:
          "Require M-of-N independent oracle signers to agree on a price before it is accepted. A single compromised signer should never be sufficient.",
      },
      {
        category: "Position Size Limits",
        description:
          "Enforce per-transaction and per-block position size limits that cannot be overridden by keeper or oracle roles. This caps the blast radius of any single compromised credential.",
      },
      {
        category: "Key Management & Segregation",
        description:
          "Use hardware security modules (HSMs) or multi-party computation (MPC) for oracle signer keys. Separate the signer and keeper roles across independent teams with separate key infrastructure.",
      },
    ],
    quiz: [
      {
        question: "Why did the oracle system accept the attacker's price reports?",
        options: [
          "The attacker brute-forced the private key",
          "The verifier only checked signer identity, not price accuracy",
          "The oracle was offline and defaulted to the submitted value",
          "A reentrancy bug bypassed the validation",
        ],
        correct: 1,
        explanation: "Ostium's oracle verifier validates WHO signed the report (checks against an authorized signer list) but does not validate WHETHER the price is accurate. A valid signature from an authorized key is sufficient.",
      },
      {
        question: "How did the attacker generate 'profits' without real market exposure?",
        options: [
          "By flash-loaning large amounts to move the market",
          "By submitting a future-dated signed price and opening/closing positions against it",
          "By manipulating the Uniswap pool used for settlement",
          "By exploiting a reentrancy bug in the closePosition function",
        ],
        correct: 1,
        explanation: "The attacker submitted a future-dated, correctly signed price report, then opened and closed positions against it. From the system's view, the trades appeared profitable. In reality, the prices were manufactured — no real market movement occurred.",
      },
      {
        question: "What does this exploit teach us about oracle design?",
        options: [
          "Oracles should only use Chainlink and nothing else",
          "Oracle systems must validate both signer identity AND price plausibility against external references",
          "Oracles should never use digital signatures",
          "All oracle keys should be stored in a single multisig wallet",
        ],
        correct: 1,
        explanation: "The Ostium exploit demonstrates that signer identity alone is insufficient. Oracle systems must also validate price accuracy — comparing submitted prices against independent reference feeds and rejecting anomalous deviations.",
      },
    ],
  },

  // DefiTuna (July 16, 2026)
  {
    id: "defituna-2026",
    slug: "defituna-2026",
    title: "DefiTuna",
    subtitle: "Rounding-to-Zero Solvency Bypass — $569K USDC",
    year: 2026,
    chain: "Solana",
    chains: ["Solana"],
    type: ["Logic Error", "Math Bug"],
    shortDesc:
      "A fixed-point truncation bug in DefiTuna's health check let attackers drain $569,601 USDC from Solana. By routing borrowed funds through an ultra-thin liquidity pool, the attacker forced the position's total value to round down to zero — which the protocol silently treated as a healthy 1.0x position.",
    longDesc:
      "On July 16, 2026, DefiTuna — a leveraged trading protocol on Solana — was exploited for approximately $569,601 USDC. The attacker identified a critical flaw in the protocol's position health verification logic. Specifically, the solvency check that determines whether a position has sufficient collateral relied on a fixed-point arithmetic operation that silently discarded fractional values. By constructing an extremely illiquid token pool and routing borrowed funds through it, the attacker produced a position whose calculated total value fell just below the threshold needed to produce a non-zero integer. The protocol interpreted this zero value as an empty but valid position, bypassed the solvency gate entirely, and allowed the attacker to extract the full borrowed amount through pre-positioned limit orders.",
    technicalDesc:
      "## Root Cause Analysis\n\nThe vulnerability lived in [`TunaPosition.is_healthy()`](https://github.com/DefiTuna/tuna-sdk/blob/6a0e6b80b089e86cf4f59391ea7e10ee983c483e/rust-sdk/client/src/implementation/tuna_position.rs#L41-L70), the function responsible for verifying that a position maintains adequate collateral. Internally, this function calls `compute_total_and_debt()`, which estimates the position's total asset value by multiplying the held token quantity by a reference price derived from `sqrt_price`.\n\nThe critical issue was on line 53 of [`tuna_position.rs`](https://github.com/DefiTuna/tuna-sdk/blob/6a0e6b80b089e86cf4f59391ea7e10ee983c483e/rust-sdk/client/src/implementation/tuna_position.rs#L41-L70), where the fixed-point result gets converted to a native integer via `to_num()`. This conversion truncates — it does not round — meaning any fractional value below 1.0 becomes exactly zero.\n\n## How the Attacker Engineered the Zero\n\nThe attacker set up the exploit in three phases:\n\n**Phase 1 — Construct a trap pool.** A nearly-empty TUNA/USDC Fusion pool was created. Its initial price was calibrated to sit just within DefiTuna's acceptable deviation from the oracle price, so the protocol's pre-trade validation would not reject it.\n\n**Phase 2 — Place receiving positions.** Two limit-order positions were opened at tick 208,640 — an extreme price level far from the pool's current trading range. These positions held a combined 0.001052 TUNA and were deliberately placed there to capture any USDC that flowed into the pool.\n\n**Phase 3 — Borrow, swap, and collapse the health metric.** The attacker invoked [`Open_and_increase_tuna_spot_position_jupiter`](https://github.com/DefiTuna/tuna-sdk/blob/6a0e6b80b089e86cf4f59391ea7e10ee983c483e/target/idl/tuna.json#L3662-L3812), which borrowed approximately 569,601 USDC from the lending pool and routed it through an embedded Jupiter swap. The swap path sent the entire USDC amount into the trap pool at tick 208,640. Given the pool's extreme imbalance, the output was only about 0.000494 TUNA.\n\nWhen `is_healthy()` then evaluated this position, the math looked like this:\n\n```\n494 (raw token units) × 0.0018375338 (oracle price) = 0.9077417\n```\n\nBut `to_num()` converts fixed-point to integer by discarding the fractional part — so `0.9077417` became `0`. The function then encountered an empty position and, following its fallback logic, assumed all empty positions carry exactly 1.0x leverage and therefore pass the health check.\n\nWith the solvency check satisfied, the USDC that had entered the pool now sat in the two attacker-controlled limit-order slots. Each was subsequently closed via `DecreaseLimitOrder`, extracting roughly 284,280 USDC per position — for a combined loss of $569,601.\n\n## Key Takeaway\n\nThis exploit is a textbook example of why truncation in financial calculations is dangerous. The protocol trusted an integer conversion that silently destroyed value information. Any position — regardless of its actual composition — could pass the health check if its calculated value fell below 1.0 in the fixed-point representation. A proper fix would either enforce a minimum non-zero threshold or use rounding instead of truncation.",
    impact: "$569,601",
    impactUSD: 569601,
    contracts: [
      {
        label: "DefiTuna Protocol",
        address: "tuna4uSQZncNeeiAMKbstuxA9CUkHH6HmC64wgmnogD",
        url: "https://solscan.io/account/tuna4uSQZncNeeiAMKbstuxA9CUkHH6HmC64wgmnogD",
      },
      {
        label: "USDC Vault (Damaged)",
        address: "D76dDcSU5HnAGqVEZCDLyGgLpTp4xZuqeZyVDtUdDv55",
        url: "https://solscan.io/account/D76dDcSU5HnAGqVEZCDLyGgLpTp4xZuqeZyVDtUdDv55",
      },
      {
        label: "Attacker Wallet #1",
        address: "9ytGWP8tCRF1keREJ5VHqBpSuM9MZYwm3oFQQa1SvESb",
        url: "https://solscan.io/account/9ytGWP8tCRF1keREJ5VHqBpSuM9MZYwm3oFQQa1SvESb",
      },
    ],
    transactions: [
      {
        hash: "124ibr7NU7AtJdeZ1WJjJy5YathNiBtCnV554uwJtkc7qEXeF64dmCziv4QoiEEMRG6EmCRx8ec2LkARpWH3kvEG",
        label: "Main exploit — borrow, swap, bypass health check",
        chain: "solana",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Trap Pool Creation",
        description:
          "Attacker deploys a nearly empty TUNA/USDC Fusion pool. The initial price is set close enough to the oracle price to pass DefiTuna's price-deviation pre-checks, but the pool has virtually no depth.",
        functionsCall: ["FusionPool.create_pool()"],
        pseudocode:
          "// Thin pool: minimal liquidity\n// Price calibrated to pass deviation check\n// Will serve as the swap destination for borrowed USDC",
        timestamp: "July 16, 2026",
      },
      {
        id: "t2",
        phase: "Limit-Order Positioning",
        description:
          "Two positions are placed at tick 208,640 — an extreme price level far from current trading. Each holds a tiny amount of TUNA (combined 0.001052 TUNA). These positions are designed to capture the USDC that will flow into the pool.",
        functionsCall: ["Position.open_limit_order(tick=208640)"],
        pseudocode:
          "// Two positions at the same extreme tick\n// Each holds ~0.000526 TUNA\n// They will receive USDC when the swap executes\n// Owned by 7hiH...FJst and BK9a...QpH3c",
      },
      {
        id: "t3",
        phase: "Borrow and Route",
        description:
          "Attacker calls Open_and_increase_tuna_spot_position_jupiter, borrowing ~569,601 USDC from the lending pool. The entire amount is routed through an embedded Jupiter swap path targeting the trap pool.",
        functionsCall: ["Open_and_increase_tuna_spot_position_jupiter()"],
        pseudocode:
          "// Borrow from lending pool\n// Route: USDC → Jupiter → Trap pool (tick 208640)\n// Swap amount: 569,601 USDC (full borrow minus fees)\n// Output at tick 208640:\n//   569601 / (1.0001)^208640 * (1 - 0.001) = 0.000494 TUNA",
        txns: [
          {
            hash: "124ibr7NU7AtJdeZ1WJjJy5YathNiBtCnV554uwJtkc7qEXeF64dmCziv4QoiEEMRG6EmCRx8ec2LkARpWH3kvEG",
            label: "Borrow + swap (569,601 USDC → 0.000494 TUNA)",
          },
        ],
      },
      {
        id: "t4",
        phase: "Solvency Check Bypass",
        description:
          "DefiTuna's health check evaluates the new position. The math: 494 raw units × 0.0018375338 (oracle price) = 0.9077417. But to_num() truncates the fractional part, producing zero. The protocol treats the zero as an empty position, assumes 1.0x leverage, and marks it healthy.",
        functionsCall: ["TunaPosition.is_healthy()", "compute_total_and_debt()"],
        pseudocode:
          "// is_healthy() calls compute_total_and_debt()\n// total = 494 × 0.0018375338 = 0.9077417\n// to_num() truncates → 0\n// Code path: 'empty position → leverage always 1.0x → healthy'\n// Solvency check passed — but only because of truncation",
      },
      {
        id: "t5",
        phase: "Drain via Limit Orders",
        description:
          "The borrowed USDC now sits economically in the two attacker-controlled limit-order positions. Each position's owner calls DecreaseLimitOrder to withdraw — roughly 284,280 USDC per position, totaling $569,601.",
        functionsCall: ["DecreaseLimitOrder()", "DecreaseLimitOrder()"],
        pseudocode:
          "// Position 7hiH...FJst withdraws ~284,280 USDC\n// Position BK9a...QpH3c withdraws ~284,280 USDC\n// Total drained: $569,601 USDC\n// Funds moved to pivot wallets, then split",
      },
    ],
    attackFlow: {
      nodes: [
        { id: "n1", type: "attacker", label: "Attacker", detail: "9 wallets coordinated", x: 50, y: 200 },
        { id: "n2", type: "contract", label: "Thin TUNA/USDC Pool", detail: "Near-zero liquidity", x: 250, y: 100 },
        { id: "n3", type: "contract", label: "DefiTuna Lending", detail: "569K USDC borrowed", x: 450, y: 200 },
        { id: "n4", type: "contract", label: "is_healthy()", detail: "to_num() truncates to 0", x: 450, y: 350 },
        { id: "n5", type: "pool", label: "Limit Orders", detail: "284K USDC each", x: 650, y: 200 },
        { id: "n6", type: "result", label: "Attacker", detail: "$569K drained", x: 850, y: 200 },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "Create thin pool" },
        { id: "e2", source: "n1", target: "n3", label: "Borrow 569K USDC", animated: true },
        { id: "e3", source: "n3", target: "n2", label: "Swap → 0.000494 TUNA" },
        { id: "e4", source: "n3", target: "n4", label: "Health check" },
        { id: "e5", source: "n4", target: "n5", label: "Zero = 'healthy'", animated: true },
        { id: "e6", source: "n5", target: "n6", label: "Drain $569K", animated: true },
      ],
    },
    tokenFlowNodes: [
      { id: "a", label: "DefiTuna\nLending Pool", type: "pool" },
      { id: "b", label: "Thin TUNA/USDC\nFusion Pool", type: "bridge" },
      { id: "c", label: "Zero Value\nHealth Check", type: "vault" },
      { id: "d", label: "Limit Orders\n(Attacker)", type: "attacker" },
      { id: "e", label: "Pivot Wallets\n$569K USDC", type: "drain" },
    ],
    tokenFlowLinks: [
      { source: "a", target: "b", value: 0.57, label: "569K USDC borrowed" },
      { source: "b", target: "c", value: 0.001, label: "0.000494 TUNA out" },
      { source: "c", target: "d", value: 0.57, label: "Health check passed" },
      { source: "d", target: "e", value: 0.57, label: "Limit order withdrawal" },
    ],
    mitigations: [
      {
        category: "Fixed-Point Safety",
        description:
          "Never trust truncation in financial math. Either enforce a minimum non-zero threshold after conversion, or use proper rounding. Any position whose calculated value rounds to zero must be treated as insolvent, not healthy.",
        code: "let total = self.compute_total_and_debt();\nrequire!(total > 0, ErrorCode::PositionValueTooLow);",
      },
      {
        category: "Pool Liquidity Guards",
        description:
          "Reject positions that route swaps through pools with insufficient liquidity. A pool holding near-zero reserves should not be accepted as a valid swap destination for leveraged positions.",
      },
      {
        category: "Slippage & Output Validation",
        description:
          "After executing a swap, verify that the returned token amount exceeds a minimum threshold. If the output is negligible relative to the input, the position's value cannot be meaningfully assessed.",
      },
      {
        category: "Position Value Floor",
        description:
          "Treat any position whose total asset value falls below a configurable floor as undercollateralized, regardless of the leverage fallback logic.",
      },
    ],
    quiz: [
      {
        question: "What specific operation caused the position's value to become zero?",
        options: [
          "An integer overflow in the multiplication step",
          "The to_num() function truncating a fractional fixed-point value below 1.0",
          "A division by zero in the sqrt_price calculation",
          "The oracle returning a stale price of zero",
        ],
        correct: 1,
        explanation: "The calculation 494 × 0.0018375338 = 0.9077417 was valid, but to_num() discards the fractional part during fixed-point-to-integer conversion, producing 0.",
      },
      {
        question: "Why did the protocol consider a zero-value position as healthy?",
        options: [
          "The lending pool had excess reserves to cover the shortfall",
          "The health check had a fallback that assumed empty positions always carry 1.0x leverage",
          "The attacker bribed the oracle to report a favorable price",
          "The position had a special admin override flag",
        ],
        correct: 1,
        explanation: "When compute_total_and_debt() returned zero, is_healthy() followed its fallback path for empty positions, which assumes 1.0x leverage and therefore passes the solvency check.",
      },
      {
        question: "How did the attacker extract value after bypassing the health check?",
        options: [
          "By calling a direct withdrawal function on the lending pool",
          "By closing two pre-positioned limit orders that received the borrowed USDC",
          "By swapping the zero-value position on a secondary market",
          "By exploiting a reentrancy bug in the settlement function",
        ],
        correct: 1,
        explanation: "Two limit-order positions were placed at tick 208,640 to capture the USDC flowing through the thin pool. After the health check passed, each was closed via DecreaseLimitOrder, extracting ~284K USDC per position.",
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
  "Logic Error": "text-amber-400 border-amber-400/30 bg-amber-400/10",
  "Infrastructure": "text-slate-400 border-slate-400/30 bg-slate-400/10",
  "Cryptography": "text-violet-400 border-violet-400/30 bg-violet-400/10",
};

export const availableYears: number[] = Array.from(
  new Set(hacks.map((h) => h.year))
).sort((a, b) => a - b);
