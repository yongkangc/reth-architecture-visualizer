import { 
  Database, Network, Shield, Cpu, GitBranch,
  Activity, Zap, HardDrive, Terminal, Users,
  RefreshCw, Server, Layers, Globe
} from 'lucide-react'
import type { SystemComponent, Connection, Scenario, LayerInfo } from '@/lib/types/architecture'

// Layer configuration
export const LAYER_INFO: Record<string, LayerInfo> = {
  external: { 
    label: "External Layer", 
    color: "text-blue-400", 
    description: "External interfaces and consensus layer" 
  },
  api: { 
    label: "API Layer", 
    color: "text-purple-400", 
    description: "Communication and interface layers" 
  },
  core: { 
    label: "Core Systems", 
    color: "text-orange-400", 
    description: "Main processing and execution components" 
  },
  storage: { 
    label: "Storage Layer", 
    color: "text-pink-400", 
    description: "Data persistence and state management" 
  }
}

// Default system components (original architecture)
export const SYSTEM_COMPONENTS: SystemComponent[] = [
  {
    id: "consensus",
    name: "Consensus Layer",
    description: "Beacon chain client (Lighthouse, Prysm, etc)",
    beginnerDescription: "The brain that decides which blocks are valid and final",
    icon: Shield,
    position: { x: 50, y: 5 },
    color: "from-blue-500 to-cyan-500",
    layer: "external",
    details: [
      "Proof of Stake consensus",
      "Block proposals every 12 seconds",
      "Attestations from validators",
      "Finality after 2 epochs (~13 min)"
    ],
    metrics: {
      throughput: "1 block/12s",
      latency: "4-6s",
      size: "~100KB/block"
    },
    codeExample: `// Engine API communication
client.engine_newPayloadV3(payload)
client.engine_forkchoiceUpdatedV3(state)`
  },
  {
    id: "engine",
    name: "Engine API",
    description: "Consensus-Execution communication layer",
    beginnerDescription: "The messenger between consensus and execution",
    icon: Cpu,
    position: { x: 50, y: 20 },
    color: "from-purple-500 to-pink-500",
    layer: "api",
    details: [
      "newPayload: Validate & execute block",
      "forkchoiceUpdated: Update chain head",
      "getPayload: Build new block",
      "Payload validation & caching"
    ],
    metrics: {
      latency: "~100ms",
      throughput: "100+ req/s"
    }
  },
  {
    id: "networking",
    name: "P2P Network",
    description: "DevP2P protocol and discovery",
    beginnerDescription: "How Reth talks to other nodes",
    icon: Network,
    position: { x: 20, y: 40 },
    color: "from-green-500 to-emerald-500",
    layer: "core",
    details: [
      "Node discovery (Discv4/5)",
      "RLPx encrypted protocol",
      "Transaction gossip",
      "Block propagation",
      "Snap sync protocol"
    ],
    metrics: {
      throughput: "10MB/s",
      latency: "50-200ms"
    }
  },
  {
    id: "mempool",
    name: "Transaction Pool",
    description: "Pending transaction management",
    beginnerDescription: "The waiting room for transactions",
    icon: Users,
    position: { x: 20, y: 55 },
    color: "from-amber-500 to-yellow-500",
    layer: "core",
    details: [
      "Transaction validation",
      "Gas price ordering",
      "Nonce management",
      "Transaction replacement",
      "Pool size limits"
    ],
    metrics: {
      size: "~5000 txs",
      throughput: "1000 tx/s"
    }
  },
  {
    id: "sync",
    name: "Staged Sync",
    description: "Pipeline for blockchain synchronization",
    beginnerDescription: "Downloads and processes the blockchain in stages",
    icon: Activity,
    position: { x: 50, y: 40 },
    color: "from-orange-500 to-red-500",
    layer: "core",
    details: [
      "Headers download",
      "Bodies download",
      "Sender recovery",
      "Execution",
      "State root computation",
      "Transaction lookup"
    ],
    metrics: {
      throughput: "1000 blocks/s",
      latency: "varies by stage"
    }
  },
  {
    id: "evm",
    name: "EVM Executor",
    description: "Transaction execution with Revm",
    beginnerDescription: "The calculator that runs smart contracts",
    icon: Zap,
    position: { x: 80, y: 40 },
    color: "from-yellow-500 to-orange-500",
    layer: "core",
    details: [
      "Revm: Rust EVM implementation",
      "Opcode execution",
      "Gas metering",
      "State transitions",
      "Precompiles"
    ],
    metrics: {
      throughput: "10k tx/s",
      latency: "1-10ms/tx"
    },
    codeExample: `// Execute transaction
let result = evm
  .transact()
  .unwrap();`
  },
  {
    id: "trie",
    name: "State Trie",
    description: "Merkle Patricia Trie management",
    beginnerDescription: "The tree structure that proves all account balances",
    icon: GitBranch,
    position: { x: 65, y: 60 },
    color: "from-indigo-500 to-purple-500",
    layer: "core",
    details: [
      "State root calculation",
      "Merkle proofs",
      "Trie updates",
      "Parallel computation",
      "Intermediate hashing"
    ],
    metrics: {
      throughput: "100k nodes/s",
      size: "~50GB"
    }
  },
  {
    id: "storage",
    name: "MDBX Database",
    description: "Primary key-value storage",
    beginnerDescription: "The hard drive that stores all blockchain data",
    icon: Database,
    position: { x: 35, y: 80 },
    color: "from-pink-500 to-rose-500",
    layer: "storage",
    details: [
      "MDBX key-value store",
      "ACID transactions",
      "Memory-mapped files",
      "Pruning support",
      "~1TB full archive"
    ],
    metrics: {
      throughput: "100k ops/s",
      size: "300GB-1TB"
    }
  },
  {
    id: "static-files",
    name: "Static Files",
    description: "Immutable data storage",
    beginnerDescription: "Frozen historical data that never changes",
    icon: HardDrive,
    position: { x: 65, y: 80 },
    color: "from-teal-500 to-cyan-500",
    layer: "storage",
    details: [
      "Headers & bodies",
      "Receipts",
      "Transactions",
      "Compression",
      "Fast sequential reads"
    ],
    metrics: {
      size: "~200GB",
      throughput: "1GB/s reads"
    }
  },
  {
    id: "rpc",
    name: "RPC Server",
    description: "JSON-RPC API endpoints",
    beginnerDescription: "The API that wallets and apps use to talk to Reth",
    icon: Terminal,
    position: { x: 80, y: 20 },
    color: "from-teal-500 to-cyan-500",
    layer: "api",
    details: [
      "eth_ namespace",
      "debug_ namespace",
      "trace_ namespace",
      "WebSocket subscriptions",
      "10k+ req/s capacity"
    ],
    metrics: {
      throughput: "10k req/s",
      latency: "5-50ms"
    }
  }
]

// Connection definitions
export const COMPONENT_CONNECTIONS: Connection[] = [
  {
    id: "cl-engine",
    from: "consensus",
    to: "engine",
    type: "bidirectional",
    label: "Engine API",
    description: "Consensus layer sends blocks to execute, execution layer sends results back",
    dataFormat: "JSON-RPC",
    protocol: "HTTP/JWT",
    frequency: "Every 12 seconds"
  },
  {
    id: "engine-sync",
    from: "engine",
    to: "sync",
    type: "control",
    label: "Block Processing",
    description: "Engine triggers sync pipeline to process new blocks",
    dataFormat: "Internal structs",
    frequency: "On new block"
  },
  {
    id: "net-sync",
    from: "networking",
    to: "sync",
    type: "data",
    label: "Block/TX Data",
    description: "P2P network provides blocks and transactions to sync",
    dataFormat: "RLP encoded",
    protocol: "DevP2P",
    frequency: "Continuous"
  },
  {
    id: "net-mempool",
    from: "networking",
    to: "mempool",
    type: "data",
    label: "New Transactions",
    description: "Incoming transactions from network peers",
    dataFormat: "RLP encoded",
    frequency: "~100 tx/s"
  },
  {
    id: "mempool-sync",
    from: "mempool",
    to: "sync",
    type: "data",
    label: "Pending TXs",
    description: "Transactions ready for inclusion in blocks",
    dataFormat: "Transaction pool",
    frequency: "On block building"
  },
  {
    id: "sync-evm",
    from: "sync",
    to: "evm",
    type: "control",
    label: "Execute TXs",
    description: "Sync pipeline sends transactions to EVM for execution",
    dataFormat: "Transaction batch",
    frequency: "Per block"
  },
  {
    id: "evm-trie",
    from: "evm",
    to: "trie",
    type: "data",
    label: "State Updates",
    description: "Account and storage changes from transaction execution",
    dataFormat: "State changeset",
    frequency: "After each tx"
  },
  {
    id: "trie-storage",
    from: "trie",
    to: "storage",
    type: "data",
    label: "Persist Nodes",
    description: "Merkle trie nodes saved to database",
    dataFormat: "Key-value pairs",
    frequency: "Batch writes"
  },
  {
    id: "sync-storage",
    from: "sync",
    to: "storage",
    type: "data",
    label: "Store Blocks",
    description: "Headers, bodies, and receipts saved to database",
    dataFormat: "Encoded blocks",
    frequency: "Per block"
  },
  {
    id: "sync-static",
    from: "sync",
    to: "static-files",
    type: "data",
    label: "Archive Data",
    description: "Historical data moved to static files",
    dataFormat: "Compressed",
    frequency: "Periodically"
  },
  {
    id: "rpc-storage",
    from: "rpc",
    to: "storage",
    type: "data",
    label: "Query Data",
    description: "RPC reads blockchain data from storage",
    dataFormat: "Database queries",
    frequency: "Per request"
  },
  {
    id: "rpc-evm",
    from: "rpc",
    to: "evm",
    type: "control",
    label: "eth_call",
    description: "Simulate transaction execution without committing",
    dataFormat: "Call request",
    frequency: "On demand"
  },
  {
    id: "rpc-mempool",
    from: "rpc",
    to: "mempool",
    type: "bidirectional",
    label: "TX Pool Access",
    description: "Submit transactions and query pool status",
    dataFormat: "JSON-RPC",
    frequency: "On demand"
  }
]

// Scenario definitions
export const SCENARIOS: Scenario[] = [
  {
    id: "transaction",
    name: "Follow a Transaction",
    description: "See how a transaction flows from submission to finalization",
    icon: Globe,
    color: "from-green-500 to-emerald-500",
    steps: [
      { component: "rpc", action: "User submits transaction via eth_sendRawTransaction", duration: 1000 },
      { component: "mempool", action: "Transaction validated and added to pool", duration: 1500, highlight: ["rpc"] },
      { component: "networking", action: "Transaction gossiped to peer nodes", duration: 1000, highlight: ["mempool"] },
      { component: "consensus", action: "Validator includes TX in new block", duration: 2000, highlight: ["mempool"] },
      { component: "engine", action: "Block sent via newPayload", duration: 1000, highlight: ["consensus"] },
      { component: "sync", action: "Block enters sync pipeline", duration: 1000, highlight: ["engine"] },
      { component: "evm", action: "Transaction executed in EVM", duration: 1500, highlight: ["sync"] },
      { component: "trie", action: "State root updated with changes", duration: 1000, highlight: ["evm"] },
      { component: "storage", action: "Changes persisted to database", duration: 1000, highlight: ["trie", "sync"] }
    ]
  },
  {
    id: "block-sync",
    name: "Block Synchronization",
    description: "How Reth syncs new blocks from the network",
    icon: Activity,
    color: "from-blue-500 to-cyan-500",
    steps: [
      { component: "consensus", action: "New block finalized by validators", duration: 1000 },
      { component: "engine", action: "forkchoiceUpdated notification", duration: 1000, highlight: ["consensus"] },
      { component: "networking", action: "Download block from peers", duration: 1500, highlight: [] },
      { component: "sync", action: "Headers stage: Validate headers", duration: 1000, highlight: ["networking"] },
      { component: "sync", action: "Bodies stage: Download transactions", duration: 1500, highlight: ["networking"] },
      { component: "sync", action: "Senders stage: Recover TX signatures", duration: 1000 },
      { component: "evm", action: "Execution stage: Run all transactions", duration: 2000, highlight: ["sync"] },
      { component: "trie", action: "Merkle stage: Compute state root", duration: 1500, highlight: ["sync"] },
      { component: "storage", action: "Commit all changes to database", duration: 1000, highlight: ["trie", "sync"] }
    ]
  },
  {
    id: "rpc-query",
    name: "RPC Query",
    description: "How eth_getBalance retrieves account data",
    icon: Terminal,
    color: "from-purple-500 to-pink-500",
    steps: [
      { component: "rpc", action: "Client calls eth_getBalance", duration: 1000 },
      { component: "storage", action: "Query account state from DB", duration: 1000, highlight: ["rpc"] },
      { component: "trie", action: "Verify merkle proof if needed", duration: 1000, highlight: ["storage"] },
      { component: "rpc", action: "Return balance to client", duration: 500, highlight: ["storage"] }
    ]
  }
]

// View mode configurations
export const VIEW_MODE_CONFIGS = {
  beginner: {
    components: ["consensus", "engine", "sync", "evm", "storage", "rpc"] as const,
    showMetrics: false,
    showCodeExamples: false,
    showConnections: "active" as const
  },
  intermediate: {
    components: "all" as const,
    showMetrics: true,
    showCodeExamples: false,
    showConnections: "hover" as const
  },
  expert: {
    components: "all" as const,
    showMetrics: true,
    showCodeExamples: true,
    showConnections: "all" as const
  }
}