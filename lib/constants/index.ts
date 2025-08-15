import { Zap, GitBranch, Layers, Shield, Cpu, Network, Database } from "lucide-react"
import type { ValidationStep, Scenario, StrategyInfo, TrieNode } from "@/lib/types"

// Engine API constants
export const INITIAL_VALIDATION_STEPS: ValidationStep[] = [
  { id: "receive", name: "Receive Payload", description: "Engine API receives newPayloadV4 from CL", status: "pending", duration: 500 },
  { id: "decode", name: "Decode & Parse", description: "Parse execution payload and extract block data", status: "pending", duration: 300 },
  { id: "validate-header", name: "Validate Header", description: "Check block header fields and parent hash", status: "pending", duration: 400 },
  { id: "validate-body", name: "Validate Body", description: "Verify transactions and withdrawals", status: "pending", duration: 600 },
  { id: "execute", name: "Execute Transactions", description: "Run EVM on all transactions sequentially", status: "pending", duration: 1500 },
  { id: "state-root", name: "Calculate State Root", description: "Compute Merkle Patricia Trie root", status: "pending", duration: 1200 },
  { id: "compare", name: "Compare Roots", description: "Verify calculated root matches header", status: "pending", duration: 300 },
  { id: "respond", name: "Send Response", description: "Return VALID/INVALID/SYNCING status", status: "pending", duration: 200 },
]

// State Root constants
export const STATE_ROOT_SCENARIOS: Scenario[] = [
  {
    id: "cache-hot",
    name: "Cache Hot Path",
    description: "Recent blocks with warm cache",
    blockSize: 150,
    cacheState: "hot",
    expectedStrategy: "sparse"
  },
  {
    id: "large-block",
    name: "Large Block",
    description: "Full block with many transactions",
    blockSize: 500,
    cacheState: "cold",
    expectedStrategy: "parallel"
  },
  {
    id: "small-block",
    name: "Small Block",
    description: "Few transactions, simple state",
    blockSize: 50,
    cacheState: "cold",
    expectedStrategy: "sequential"
  },
  {
    id: "cache-cold",
    name: "Cold Start",
    description: "First block after restart",
    blockSize: 200,
    cacheState: "cold",
    expectedStrategy: "parallel"
  }
]

export const STRATEGY_INFO: Record<string, StrategyInfo> = {
  sparse: {
    name: "Sparse Root",
    color: "from-green-500 to-emerald-500",
    icon: Zap,
    description: "Uses cached sparse trie for fastest computation",
    pros: ["Minimal DB reads", "Sub-10ms execution", "Memory efficient"],
    cons: ["Requires warm cache", "Limited to recent blocks"]
  },
  parallel: {
    name: "Parallel Strategy",
    color: "from-purple-500 to-pink-500",
    icon: GitBranch,
    description: "Distributes computation across CPU cores",
    pros: ["Scales with cores", "Good for large blocks", "Consistent performance"],
    cons: ["Higher CPU usage", "More complex coordination"]
  },
  sequential: {
    name: "Sequential Fallback",
    color: "from-blue-500 to-cyan-500",
    icon: Layers,
    description: "Traditional single-threaded approach",
    pros: ["Simple and reliable", "Low overhead", "Predictable"],
    cons: ["Slower for large blocks", "No parallelization"]
  }
}

// Trie constants
export const SAMPLE_TRIE: TrieNode = {
  id: "root",
  type: "branch",
  path: "",
  isExpanded: true,
  children: [
    {
      id: "n1",
      type: "extension",
      path: "a7",
      children: [
        {
          id: "n11",
          type: "branch",
          path: "a7",
          children: [
            {
              id: "n111",
              type: "leaf",
              path: "a7f3",
              value: "value1"
            },
            {
              id: "n112",
              type: "leaf",
              path: "a7b2",
              value: "value2"
            }
          ]
        }
      ]
    },
    {
      id: "n2",
      type: "branch",
      path: "b",
      children: [
        {
          id: "n21",
          type: "hash",
          path: "b5",
          value: "0x1234...abcd"
        },
        {
          id: "n22",
          type: "extension",
          path: "b8",
          children: [
            {
              id: "n221",
              type: "leaf",
              path: "b8c1",
              value: "value3"
            }
          ]
        }
      ]
    },
    {
      id: "n3",
      type: "hash",
      path: "c",
      value: "0x5678...efgh"
    }
  ]
}

// Animation constants
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4 }
  }
}

// Color constants
export const COLORS = {
  purple: "var(--eth-purple)",
  pink: "var(--eth-pink)",
  orange: "var(--eth-orange)",
  green: "var(--eth-green)",
  blue: "var(--eth-blue)",
  teal: "var(--eth-teal)",
  yellow: "var(--eth-yellow)"
}