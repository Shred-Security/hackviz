# Adding a New Hack

Edit `artifacts/web3hackviz/src/data/hacks.ts` and add to the `hacks` array.

## Quick Template

```typescript
{
  id: "protocol-year",
  slug: "protocol-year",
  title: "Protocol Name",
  subtitle: "Attack Type - Chain",
  year: 2025,
  chain: "Ethereum",
  type: ["Reentrancy"],
  shortDesc: "One sentence summary.",
  longDesc: "What happened, when, and outcome.",
  technicalDesc: "Root cause and vulnerable code.",
  impact: "$10M",
  impactUSD: 10000000,
  contracts: [{ label: "Vault", address: "0x...", url: "https://etherscan.io/address/0x..." }],
  timeline: [
    { id: "t1", phase: "Setup", description: "...", functionsCall: [], pseudocode: "//" },
    { id: "t2", phase: "Attack", description: "...", functionsCall: [], pseudocode: "//" }
  ],
  attackFlow: {
    nodes: [
      { id: "n1", type: "attacker", label: "Attacker", detail: "...", x: 50, y: 200 },
      { id: "n2", type: "contract", label: "Target", detail: "...", x: 300, y: 200 },
      { id: "n3", type: "result", label: "Outcome", detail: "...", x: 550, y: 200 }
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2", label: "action()", animated: true },
      { id: "e2", source: "n2", target: "n3", label: "drain" }
    ]
  },
  tokenFlowNodes: [
    { id: "a", label: "Vault\n$10M", type: "vault" },
    { id: "b", label: "Attacker", type: "attacker" }
  ],
  tokenFlowLinks: [
    { source: "a", target: "b", value: 10, label: "Drain" }
  ],
  mitigations: [
    { category: "Fix", description: "How to prevent this." }
  ],
  quiz: [
    {
      question: "What caused this?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0,
      explanation: "Why the answer is correct."
    }
  ]
}
```

## Node Types

**Attack Flow:** `attacker`, `contract`, `pool`, `bridge`, `oracle`, `vault`, `result`
**Token Flow:** `attacker`, `vault`, `pool`, `bridge`, `multisig`, `drain`

## Checklist

- [ ] `id` is unique and kebab-case
- [ ] `impactUSD` is a number (no `$` or commas)
- [ ] Timeline IDs are unique within the hack
- [ ] Attack flow node IDs are unique within the hack
- [ ] Token flow node IDs match link source/target values
- [ ] Quiz `correct` is valid index (0 to 3)
- [ ] `pnpm run typecheck` passes

## Submitting Your Hack

1. **Fork** the repository
2. **Create a branch:** `git checkout -b add-hack-protocol-name`
3. **Commit:** `git commit -m "Add Protocol Name hack"`
4. **Push:** `git push origin add-hack-protocol-name`
5. **Open PR** with:
   - Hack name and date
   - Source links (post-mortem, block explorer)
   - Screenshot of the visualizations (optional)
See existing hacks in the file for more examples.
