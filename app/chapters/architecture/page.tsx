"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Database, Network, Shield, Cpu, GitBranch,
  Activity, Zap, ArrowRight,
  HardDrive, Terminal, Blocks,
  Eye, EyeOff, HelpCircle, BookOpen, Route,
  CheckCircle, Circle, Users,
  Settings, Sparkles, X
} from "lucide-react"
import { cn } from "@/lib/utils"

type ComponentType = "consensus" | "engine" | "networking" | "storage" | "rpc" | "sync" | "evm" | "trie" | "mempool" | "static-files"
type ConnectionType = "data" | "control" | "api" | "bidirectional"
type ViewMode = "beginner" | "intermediate" | "expert"
type ScenarioType = "transaction" | "block-sync" | "rpc-query" | "reorg" | "new-block"

interface SystemComponent {
  id: ComponentType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  position: { x: number; y: number }
  color: string
  layer: "external" | "api" | "core" | "storage"
  details: string[]
  beginnerDescription?: string
  codeExample?: string
  metrics?: {
    throughput?: string
    latency?: string
    size?: string
  }
}

interface Connection {
  id: string
  from: ComponentType
  to: ComponentType
  type: ConnectionType
  label: string
  description: string
  dataFormat?: string
  protocol?: string
  frequency?: string
}

interface Scenario {
  id: ScenarioType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  steps: {
    component: ComponentType
    action: string
    duration: number
    highlight?: ComponentType[]
  }[]
  color: string
}

const systemComponents: SystemComponent[] = [
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

const connections: Connection[] = [
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

const scenarios: Scenario[] = [
  {
    id: "transaction",
    name: "Follow a Transaction",
    description: "See how a transaction flows from submission to finalization",
    icon: Route,
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

export default function ArchitecturePage() {
  const [activeComponent, setActiveComponent] = useState<ComponentType | null>(null)
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("beginner")
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentScenario, setCurrentScenario] = useState<ScenarioType | null>(null)
  const [scenarioStep, setScenarioStep] = useState(0)
  const [showAllConnections, setShowAllConnections] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [persistentActiveComponent, setPersistentActiveComponent] = useState<ComponentType | null>(null)
  const [showExitButton, setShowExitButton] = useState(false)
  const scenarioTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Run scenario animation
  const runScenario = (scenarioId: ScenarioType) => {
    if (scenarioTimeoutRef.current) {
      clearTimeout(scenarioTimeoutRef.current)
    }

    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    setCurrentScenario(scenarioId)
    setScenarioStep(0)
    setIsAnimating(true)
    setActiveComponent(null)

    let step = 0
    const runStep = () => {
      if (step >= scenario.steps.length) {
        setIsAnimating(false)
        setCurrentScenario(null)
        setActiveComponent(null)
        return
      }

      const currentStep = scenario.steps[step]
      setScenarioStep(step)
      setActiveComponent(currentStep.component)

      scenarioTimeoutRef.current = setTimeout(() => {
        step++
        runStep()
      }, currentStep.duration)
    }

    runStep()
  }

  const stopScenario = () => {
    if (scenarioTimeoutRef.current) {
      clearTimeout(scenarioTimeoutRef.current)
    }
    setIsAnimating(false)
    setCurrentScenario(null)
    setScenarioStep(0)
    setActiveComponent(null)
  }

  // Get active connections based on current state
  const getActiveConnections = () => {
    if (!currentScenario) return []
    
    const scenario = scenarios.find(s => s.id === currentScenario)
    if (!scenario || scenarioStep >= scenario.steps.length) return []

    const currentStep = scenario.steps[scenarioStep]
    const activeConnections: string[] = []

    // Find connections involving the current component
    connections.forEach(conn => {
      if (conn.from === currentStep.component || conn.to === currentStep.component) {
        activeConnections.push(conn.id)
      }
      // Also highlight connections to highlighted components
      if (currentStep.highlight) {
        currentStep.highlight.forEach(h => {
          if (conn.from === h || conn.to === h) {
            activeConnections.push(conn.id)
          }
        })
      }
    })

    return activeConnections
  }

  const activeConnections = getActiveConnections()

  // Filter components by layer
  const getComponentsByLayer = (layer: string) => {
    return systemComponents.filter(c => c.layer === layer)
  }

  // Get beginner-friendly components (core ones)
  const getBeginnerComponents = () => {
    const beginnerIds: ComponentType[] = ["consensus", "engine", "sync", "evm", "storage", "rpc"]
    return systemComponents.filter(c => beginnerIds.includes(c.id))
  }

  const visibleComponents = viewMode === "beginner" 
    ? getBeginnerComponents()
    : selectedLayer 
    ? getComponentsByLayer(selectedLayer)
    : systemComponents

  const visibleConnections = connections.filter(conn => {
    const fromVisible = visibleComponents.some(c => c.id === conn.from)
    const toVisible = visibleComponents.some(c => c.id === conn.to)
    return fromVisible && toVisible
  })

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with View Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#627eea] to-[#a16ae8] flex items-center justify-center">
                <Blocks className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Reth Architecture Overview</h1>
                <p className="text-zinc-400">
                  Interactive guide to understanding how components connect
                </p>
              </div>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm rounded-xl p-1 border border-zinc-800">
              <button
                onClick={() => setViewMode("beginner")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  viewMode === "beginner" 
                    ? "bg-[#627eea] text-white" 
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <BookOpen className="w-4 h-4 inline mr-1" />
                Beginner
              </button>
              <button
                onClick={() => setViewMode("intermediate")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  viewMode === "intermediate" 
                    ? "bg-[#627eea] text-white" 
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                Full View
              </button>
              <button
                onClick={() => setViewMode("expert")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  viewMode === "expert" 
                    ? "bg-[#627eea] text-white" 
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Expert
              </button>
            </div>
          </div>

          {/* Interactive Learning Path */}
          {viewMode === "beginner" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-zinc-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-[#627eea]" />
                <h3 className="font-semibold">New to Reth? Start here!</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">
                Follow these scenarios to understand how Reth processes blockchain data:
              </p>
              <div className="flex gap-2">
                {scenarios.map((scenario, index) => (
                  <button
                    key={scenario.id}
                    onClick={() => runScenario(scenario.id)}
                    disabled={isAnimating}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                      "bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700",
                      currentScenario === scenario.id && "bg-[#627eea]/20 border-[#627eea]"
                    )}
                  >
                    <span className="text-xs font-bold text-zinc-500">{index + 1}</span>
                    {scenario.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Architecture Diagram - Now larger */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-3"
          >
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              {/* Layer Controls */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">System Architecture</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAllConnections(!showAllConnections)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all",
                      "border border-zinc-700 hover:border-zinc-600",
                      showAllConnections && "bg-zinc-800"
                    )}
                  >
                    {showAllConnections ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {showAllConnections ? "Show Active" : "Show All"}
                  </button>
                  {viewMode !== "beginner" && (
                    <div className="flex gap-1">
                      {["external", "api", "core", "storage"].map(layer => (
                        <button
                          key={layer}
                          onClick={() => setSelectedLayer(selectedLayer === layer ? null : layer)}
                          className={cn(
                            "px-2 py-1 rounded text-xs capitalize transition-all",
                            "border border-zinc-700 hover:border-zinc-600",
                            selectedLayer === layer && "bg-zinc-800 border-[#627eea]"
                          )}
                        >
                          {layer}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Scenario Progress Bar */}
              {currentScenario && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#627eea]" />
                      <span className="text-sm font-medium">
                        {scenarios.find(s => s.id === currentScenario)?.name}
                      </span>
                    </div>
                    <button
                      onClick={stopScenario}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Stop
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {scenarios.find(s => s.id === currentScenario)?.steps.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex-1 h-1 rounded-full transition-all",
                          index < scenarioStep 
                            ? "bg-green-500"
                            : index === scenarioStep
                            ? "bg-[#627eea]"
                            : "bg-zinc-800"
                        )}
                      />
                    ))}
                  </div>
                  {scenarios.find(s => s.id === currentScenario)?.steps[scenarioStep] && (
                    <p className="text-xs text-zinc-400 mt-2">
                      {scenarios.find(s => s.id === currentScenario)?.steps[scenarioStep].action}
                    </p>
                  )}
                </div>
              )}
              
              {/* Layer Backgrounds with Labels */}
              <div className="relative h-[700px] overflow-hidden rounded-xl">
                <div className="absolute inset-0">
                  {/* Layer regions */}
                  <div className="absolute top-0 left-0 right-0 h-[15%] bg-gradient-to-b from-blue-500/5 to-transparent">
                    <span className="absolute top-2 left-4 text-xs font-medium text-blue-400/60">External Layer</span>
                  </div>
                  <div className="absolute top-[15%] left-0 right-0 h-[20%] bg-gradient-to-b from-purple-500/5 to-transparent">
                    <span className="absolute top-2 left-4 text-xs font-medium text-purple-400/60">API Layer</span>
                  </div>
                  <div className="absolute top-[35%] left-0 right-0 h-[40%] bg-gradient-to-b from-orange-500/5 to-transparent">
                    <span className="absolute top-2 left-4 text-xs font-medium text-orange-400/60">Core Systems</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-pink-500/10 to-transparent">
                    <span className="absolute bottom-2 left-4 text-xs font-medium text-pink-400/60">Storage Layer</span>
                  </div>
                </div>

                {/* Components */}
                <div className="relative h-full">
                  {visibleComponents.map((component) => {
                    const Icon = component.icon
                    const isActive = activeComponent === component.id || persistentActiveComponent === component.id
                    const isHighlighted = currentScenario && scenarios
                      .find(s => s.id === currentScenario)
                      ?.steps[scenarioStep]?.highlight?.includes(component.id)
                    
                    return (
                      <motion.div
                        key={component.id}
                        className="absolute"
                        style={{
                          left: `${component.position.x}%`,
                          top: `${component.position.y}%`,
                          transform: "translate(-50%, -50%)"
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: 1,
                          scale: isActive ? 1.15 : 1,
                          zIndex: isActive ? 20 : 10
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          onClick={() => {
                            if (persistentActiveComponent === component.id) {
                              setPersistentActiveComponent(null)
                              setShowExitButton(false)
                            } else {
                              setPersistentActiveComponent(component.id)
                              setShowExitButton(true)
                            }
                            setActiveComponent(component.id)
                          }}
                          onMouseEnter={() => !isAnimating && !persistentActiveComponent && setActiveComponent(component.id)}
                          onMouseLeave={() => !isAnimating && !currentScenario && !persistentActiveComponent && setActiveComponent(null)}
                          className="relative group cursor-pointer"
                        >
                          {/* Pulse effect for active component */}
                          {(isActive || isHighlighted) && (
                            <motion.div
                              className={cn(
                                "absolute inset-0 rounded-xl bg-gradient-to-br blur-xl",
                                component.color
                              )}
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.3, 0.6, 0.3]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity
                              }}
                            />
                          )}
                          
                          {/* Component card */}
                          <motion.div 
                            className={cn(
                              "relative px-4 py-3 rounded-xl border-2 transition-all duration-300",
                              "bg-zinc-900/95 backdrop-blur-sm",
                              isActive 
                                ? "border-[#627eea] shadow-lg shadow-[#627eea]/30 bg-zinc-800/95"
                                : isHighlighted
                                ? "border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                                : "border-zinc-700 hover:border-zinc-600"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                component.color
                              )}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{component.name}</div>
                                {viewMode === "beginner" && component.beginnerDescription && (
                                  <div className="text-xs text-zinc-400 max-w-[200px]">
                                    {component.beginnerDescription}
                                  </div>
                                )}
                                {viewMode === "expert" && component.metrics && (
                                  <div className="flex gap-2 mt-1">
                                    {component.metrics.throughput && (
                                      <span className="text-xs text-green-400">{component.metrics.throughput}</span>
                                    )}
                                    {component.metrics.latency && (
                                      <span className="text-xs text-blue-400">{component.metrics.latency}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>

                          {/* Hover tooltip with details */}
                          {(activeComponent === component.id || persistentActiveComponent === component.id) && !isAnimating && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 w-64"
                            >
                              <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 shadow-xl">
                                {persistentActiveComponent === component.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPersistentActiveComponent(null)
                                      setShowExitButton(false)
                                      setActiveComponent(null)
                                    }}
                                    className="absolute top-2 right-2 text-zinc-400 hover:text-white transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                                <p className="text-xs text-zinc-300 mb-2">{component.description}</p>
                                <div className="space-y-1">
                                  {component.details.slice(0, 3).map((detail, i) => (
                                    <div key={i} className="flex items-start gap-1">
                                      <Circle className="w-2 h-2 text-zinc-500 mt-0.5 shrink-0" />
                                      <span className="text-xs text-zinc-400">{detail}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Connections with labels */}
                  <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3, 0 6"
                          fill="#627eea"
                        />
                      </marker>
                      <marker
                        id="arrowhead-inactive"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3, 0 6"
                          fill="#3f3f46"
                        />
                      </marker>
                    </defs>
                    
                    {visibleConnections.map((connection) => {
                      const from = systemComponents.find(c => c.id === connection.from)
                      const to = systemComponents.find(c => c.id === connection.to)
                      if (!from || !to) return null

                      const fromX = (from.position.x / 100) * 1000 // Assuming 1000px width
                      const fromY = (from.position.y / 100) * 700  // 700px height
                      const toX = (to.position.x / 100) * 1000
                      const toY = (to.position.y / 100) * 700

                      const isActive = activeConnections.includes(connection.id) ||
                                     (showAllConnections && !currentScenario) ||
                                     (activeComponent === connection.from || activeComponent === connection.to)
                      const isHovered = hoveredConnection === connection.id

                      // Calculate midpoint for label
                      const midX = (fromX + toX) / 2
                      const midY = (fromY + toY) / 2

                      return (
                        <g 
                          key={connection.id}
                          onMouseEnter={() => setHoveredConnection(connection.id)}
                          onMouseLeave={() => setHoveredConnection(null)}
                          style={{ pointerEvents: 'auto' }}
                        >
                          {/* Connection line */}
                          <motion.line
                            x1={fromX}
                            y1={fromY}
                            x2={toX}
                            y2={toY}
                            stroke={isActive ? "#627eea" : "#3f3f46"}
                            strokeWidth={isActive || isHovered ? 2 : 1}
                            strokeDasharray={connection.type === "control" ? "5,5" : "0"}
                            markerEnd={connection.type !== "bidirectional" ? (isActive ? "url(#arrowhead)" : "url(#arrowhead-inactive)") : undefined}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ 
                              pathLength: 1,
                              opacity: isActive || isHovered ? 1 : 0.3
                            }}
                            transition={{ duration: 0.5 }}
                          />
                          
                          {/* Bidirectional arrow */}
                          {connection.type === "bidirectional" && (
                            <>
                              <motion.line
                                x1={fromX}
                                y1={fromY}
                                x2={toX}
                                y2={toY}
                                stroke={isActive ? "#627eea" : "#3f3f46"}
                                strokeWidth={isActive || isHovered ? 2 : 1}
                                markerEnd={isActive ? "url(#arrowhead)" : "url(#arrowhead-inactive)"}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ 
                                  pathLength: 1,
                                  opacity: isActive || isHovered ? 1 : 0.3
                                }}
                                transition={{ duration: 0.5 }}
                              />
                              <motion.line
                                x1={toX}
                                y1={toY}
                                x2={fromX}
                                y2={fromY}
                                stroke={isActive ? "#627eea" : "#3f3f46"}
                                strokeWidth={isActive || isHovered ? 2 : 1}
                                markerEnd={isActive ? "url(#arrowhead)" : "url(#arrowhead-inactive)"}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ 
                                  pathLength: 1,
                                  opacity: isActive || isHovered ? 0.5 : 0.2
                                }}
                                transition={{ duration: 0.5 }}
                              />
                            </>
                          )}

                          {/* Connection label */}
                          {(isActive || isHovered) && (
                            <g>
                              <rect
                                x={midX - 40}
                                y={midY - 10}
                                width={80}
                                height={20}
                                fill="#18181b"
                                fillOpacity={0.9}
                                rx={4}
                              />
                              <text
                                x={midX}
                                y={midY + 3}
                                textAnchor="middle"
                                className="text-xs fill-zinc-300 font-medium"
                              >
                                {connection.label}
                              </text>
                            </g>
                          )}

                          {/* Hover area for tooltip */}
                          <line
                            x1={fromX}
                            y1={fromY}
                            x2={toX}
                            y2={toY}
                            stroke="transparent"
                            strokeWidth={20}
                            style={{ cursor: 'pointer' }}
                          />
                        </g>
                      )
                    })}

                    {/* Animated data flow particles during scenarios */}
                    {currentScenario && activeConnections.map(connId => {
                      const connection = connections.find(c => c.id === connId)
                      if (!connection) return null
                      
                      const from = systemComponents.find(c => c.id === connection.from)
                      const to = systemComponents.find(c => c.id === connection.to)
                      if (!from || !to) return null

                      const fromX = (from.position.x / 100) * 1000
                      const fromY = (from.position.y / 100) * 700
                      const toX = (to.position.x / 100) * 1000
                      const toY = (to.position.y / 100) * 700

                      return (
                        <motion.circle
                          key={`particle-${connId}`}
                          r="4"
                          fill="#627eea"
                          initial={{ x: fromX, y: fromY }}
                          animate={{ x: toX, y: toY }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      )
                    })}
                  </svg>
                </div>

                {/* Connection Details Tooltip */}
                {hoveredConnection && !isAnimating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-4 left-4 z-30"
                  >
                    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 shadow-xl max-w-sm">
                      {(() => {
                        const conn = connections.find(c => c.id === hoveredConnection)
                        if (!conn) return null
                        
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <ArrowRight className="w-4 h-4 text-[#627eea]" />
                              <h4 className="font-semibold">{conn.label}</h4>
                            </div>
                            <p className="text-xs text-zinc-400 mb-3">{conn.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {conn.dataFormat && (
                                <div>
                                  <span className="text-zinc-500">Format:</span>
                                  <span className="ml-1 text-zinc-300">{conn.dataFormat}</span>
                                </div>
                              )}
                              {conn.protocol && (
                                <div>
                                  <span className="text-zinc-500">Protocol:</span>
                                  <span className="ml-1 text-zinc-300">{conn.protocol}</span>
                                </div>
                              )}
                              {conn.frequency && (
                                <div className="col-span-2">
                                  <span className="text-zinc-500">Frequency:</span>
                                  <span className="ml-1 text-zinc-300">{conn.frequency}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Side Panel with Scenarios and Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Scenario Selector */}
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Route className="w-5 h-5 text-[#627eea]" />
                Interactive Scenarios
              </h3>
              
              <div className="space-y-2">
                {scenarios.map((scenario) => {
                  const Icon = scenario.icon
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => runScenario(scenario.id)}
                      disabled={isAnimating}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left transition-all",
                        currentScenario === scenario.id
                          ? "bg-[#627eea]/20 border-[#627eea]"
                          : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700",
                        isAnimating && currentScenario !== scenario.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                          scenario.color
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{scenario.name}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">{scenario.description}</div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {scenario.steps.length} steps
                          </div>
                        </div>
                        {currentScenario === scenario.id && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Activity className="w-4 h-4 text-[#627eea]" />
                          </motion.div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {isAnimating && (
                <button
                  onClick={stopScenario}
                  className="w-full mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm font-medium transition-all"
                >
                  Stop Animation
                </button>
              )}
            </div>

            {/* Component Details */}
            <AnimatePresence mode="wait">
              {(activeComponent || persistentActiveComponent) && !isAnimating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-4"
                >
                  {(() => {
                    const componentId = persistentActiveComponent || activeComponent
                    const component = systemComponents.find(c => c.id === componentId)
                    if (!component) return null
                    const Icon = component.icon

                    return (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            component.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{component.name}</h3>
                            <p className="text-xs text-zinc-400">{component.layer} layer</p>
                          </div>
                          {persistentActiveComponent && (
                            <button
                              onClick={() => {
                                setPersistentActiveComponent(null)
                                setShowExitButton(false)
                                setActiveComponent(null)
                              }}
                              className="text-zinc-400 hover:text-white transition-colors"
                              title="Close"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-zinc-300 mb-3">
                          {viewMode === "beginner" && component.beginnerDescription
                            ? component.beginnerDescription
                            : component.description}
                        </p>

                        {/* Key Features */}
                        <div className="space-y-2 mb-3">
                          <h4 className="text-xs font-semibold text-zinc-400 uppercase">Key Features</h4>
                          {component.details.map((detail, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                              <span className="text-xs text-zinc-300">{detail}</span>
                            </div>
                          ))}
                        </div>

                        {/* Metrics */}
                        {component.metrics && viewMode !== "beginner" && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <h4 className="col-span-2 text-xs font-semibold text-zinc-400 uppercase">Performance</h4>
                            {component.metrics.throughput && (
                              <div className="bg-zinc-800/50 rounded-lg p-2">
                                <div className="text-xs text-zinc-500">Throughput</div>
                                <div className="text-sm font-semibold text-green-400">{component.metrics.throughput}</div>
                              </div>
                            )}
                            {component.metrics.latency && (
                              <div className="bg-zinc-800/50 rounded-lg p-2">
                                <div className="text-xs text-zinc-500">Latency</div>
                                <div className="text-sm font-semibold text-blue-400">{component.metrics.latency}</div>
                              </div>
                            )}
                            {component.metrics.size && (
                              <div className="bg-zinc-800/50 rounded-lg p-2 col-span-2">
                                <div className="text-xs text-zinc-500">Size</div>
                                <div className="text-sm font-semibold text-purple-400">{component.metrics.size}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Code Example */}
                        {component.codeExample && viewMode === "expert" && (
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Code Example</h4>
                            <div className="bg-black/50 rounded-lg p-2 overflow-x-auto">
                              <pre className="text-xs font-mono text-zinc-300">
                                {component.codeExample}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Connections */}
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Connections</h4>
                          <div className="space-y-1">
                            {connections
                              .filter(c => c.from === componentId || c.to === componentId)
                              .map((conn) => {
                                const isFrom = conn.from === componentId
                                const otherId = isFrom ? conn.to : conn.from
                                const other = systemComponents.find(c => c.id === otherId)
                                
                                return (
                                  <div key={conn.id} className="flex items-center gap-2 text-xs">
                                    <ArrowRight className={cn(
                                      "w-3 h-3",
                                      isFrom ? "text-green-500" : "text-blue-500 rotate-180"
                                    )} />
                                    <span className="text-zinc-400">
                                      {isFrom ? "To" : "From"} {other?.name}:
                                    </span>
                                    <span className="text-zinc-300">{conn.label}</span>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend */}
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-4">
              <h3 className="text-lg font-semibold mb-3">Legend</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-0.5 bg-zinc-500" />
                  <span className="text-zinc-400">Data flow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-0.5 bg-zinc-500" style={{ borderBottom: "2px dashed #71717a" }} />
                  <span className="text-zinc-400">Control flow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <ArrowRight className="w-3 h-3 text-zinc-500 rotate-180" />
                  </div>
                  <span className="text-zinc-400">Bidirectional</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-0.5 bg-[#627eea]" />
                  <span className="text-zinc-400">Active connection</span>
                </div>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-[#627eea]"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-zinc-400">Data in transit</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}