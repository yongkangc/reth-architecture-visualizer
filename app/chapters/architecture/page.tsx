"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  Database, Network, Shield, Cpu, GitBranch,
  Activity, Zap,
  HardDrive, Layers,
  BookOpen, Route,
  Globe,
  Sparkles, X,
  RefreshCw, Server, ExternalLink, ChevronRight,
  Info, Code, FileCode, Package
} from "lucide-react"
import { cn } from "@/lib/utils"

type ComponentType = "rpc" | "p2p" | "engine" | "mempool" | "validator" | "executor" | "state_root" | "database" | "sync" | "consensus" | "builder"
type FlowType = "transaction" | "consensus" | "p2p" | "query" | "internal" | "storage"

interface SystemComponent {
  id: ComponentType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  position: { x: number; y: number }
  color: string
  layer: "entry" | "processing" | "state" | "pipeline"
  codeLocation?: string
  isEntryPoint?: boolean
  chapterLink?: string
  details?: {
    responsibilities: string[]
    keyMethods?: string[]
    dependencies?: string[]
  }
}

interface Connection {
  from: ComponentType
  to: ComponentType
  label: string
  flowType: FlowType
  animated?: boolean
  description?: string
}

// Enhanced component definitions with chapter links
const systemComponents: SystemComponent[] = [
  // Entry Points
  {
    id: "rpc",
    label: "RPC Server",
    description: "JSON-RPC API endpoints",
    icon: Globe,
    position: { x: 100, y: 50 },
    color: "from-blue-500 to-cyan-500",
    layer: "entry",
    codeLocation: "crates/rpc/rpc-engine-api/src/engine_api.rs",
    isEntryPoint: true,
    chapterLink: "/chapters/engine-api",
    details: {
      responsibilities: [
        "Handle JSON-RPC requests from clients",
        "Manage WebSocket connections",
        "Route requests to appropriate handlers",
        "Serialize/deserialize JSON data"
      ],
      keyMethods: [
        "eth_sendRawTransaction",
        "eth_call",
        "eth_getBlockByNumber",
        "eth_getLogs"
      ],
      dependencies: ["mempool", "executor", "database"]
    }
  },
  {
    id: "p2p",
    label: "P2P Network",
    description: "Peer-to-peer communication",
    icon: Network,
    position: { x: 300, y: 50 },
    color: "from-purple-500 to-pink-500",
    layer: "entry",
    codeLocation: "crates/net/network/src/swarm.rs",
    isEntryPoint: true,
    chapterLink: "/chapters/p2p-network",
    details: {
      responsibilities: [
        "Discover and connect to peers",
        "Propagate transactions and blocks",
        "Handle network protocols (ETH/68, ETH/69)",
        "Manage peer reputation"
      ],
      keyMethods: [
        "handle_incoming_message",
        "broadcast_transaction",
        "request_block_bodies",
        "send_pooled_transactions"
      ],
      dependencies: ["mempool", "sync", "database"]
    }
  },
  {
    id: "engine",
    label: "Engine API",
    description: "Consensus layer interface",
    icon: Zap,
    position: { x: 500, y: 50 },
    color: "from-orange-500 to-red-500",
    layer: "entry",
    codeLocation: "crates/rpc/rpc-engine-api/src/engine_api.rs:247-266",
    isEntryPoint: true,
    chapterLink: "/chapters/engine-api",
    details: {
      responsibilities: [
        "Receive payloads from consensus layer",
        "Validate and execute blocks",
        "Build execution payloads",
        "Manage fork choice updates"
      ],
      keyMethods: [
        "engine_newPayloadV3",
        "engine_forkchoiceUpdatedV3",
        "engine_getPayloadV3",
        "engine_exchangeCapabilities"
      ],
      dependencies: ["validator", "consensus", "builder"]
    }
  },
  
  // Processing Layer
  {
    id: "mempool",
    label: "Transaction Pool",
    description: "Pending transactions",
    icon: Database,
    position: { x: 100, y: 180 },
    color: "from-green-500 to-emerald-500",
    layer: "processing",
    codeLocation: "crates/transaction-pool/src/pool/",
    chapterLink: "/chapters/transaction",
    details: {
      responsibilities: [
        "Store pending transactions",
        "Validate transaction signatures",
        "Order by gas price/priority",
        "Evict low-value transactions"
      ],
      keyMethods: [
        "add_transaction",
        "best_transactions",
        "remove_invalid",
        "on_new_block"
      ],
      dependencies: ["executor", "builder"]
    }
  },
  {
    id: "validator",
    label: "Block Validator",
    description: "Consensus validation",
    icon: Shield,
    position: { x: 300, y: 180 },
    color: "from-yellow-500 to-orange-500",
    layer: "processing",
    codeLocation: "crates/consensus/consensus/src/validation.rs",
    chapterLink: "/chapters/payload-validation",
    details: {
      responsibilities: [
        "Validate block headers",
        "Check consensus rules",
        "Verify state transitions",
        "Validate uncle blocks"
      ],
      keyMethods: [
        "validate_header",
        "validate_body",
        "validate_state_root",
        "check_difficulty"
      ],
      dependencies: ["executor", "state_root", "database"]
    }
  },
  {
    id: "executor",
    label: "EVM Executor",
    description: "Transaction execution",
    icon: Cpu,
    position: { x: 500, y: 180 },
    color: "from-indigo-500 to-purple-500",
    layer: "processing",
    codeLocation: "crates/evm/evm/src/execute.rs:313-318",
    chapterLink: "/chapters/evm",
    details: {
      responsibilities: [
        "Execute EVM bytecode",
        "Apply state changes",
        "Calculate gas usage",
        "Generate execution receipts"
      ],
      keyMethods: [
        "execute_transaction",
        "apply_state_transitions",
        "compute_gas_used",
        "revert_to_snapshot"
      ],
      dependencies: ["state_root", "database"]
    }
  },
  
  // State Layer
  {
    id: "state_root",
    label: "State Root",
    description: "Merkle trie computation",
    icon: GitBranch,
    position: { x: 200, y: 300 },
    color: "from-teal-500 to-green-500",
    layer: "state",
    codeLocation: "crates/trie/trie/src/trie.rs:31-45",
    chapterLink: "/chapters/state-root",
    details: {
      responsibilities: [
        "Build Merkle Patricia Tries",
        "Compute state root hash",
        "Cache intermediate nodes",
        "Parallel trie computation"
      ],
      keyMethods: [
        "state_root_with_updates",
        "storage_root",
        "receipts_root",
        "hash_builder"
      ],
      dependencies: ["database"]
    }
  },
  {
    id: "database",
    label: "State Database",
    description: "MDBX storage backend",
    icon: HardDrive,
    position: { x: 400, y: 300 },
    color: "from-gray-600 to-gray-700",
    layer: "state",
    codeLocation: "crates/storage/db/",
    details: {
      responsibilities: [
        "Persist blockchain state",
        "Store blocks and receipts",
        "Manage state snapshots",
        "Handle database transactions"
      ],
      keyMethods: [
        "get_block_by_hash",
        "insert_block",
        "get_account",
        "update_storage"
      ],
      dependencies: []
    }
  },
  
  // Pipeline Layer
  {
    id: "sync",
    label: "Staged Sync",
    description: "Blockchain synchronization",
    icon: RefreshCw,
    position: { x: 100, y: 420 },
    color: "from-pink-500 to-rose-500",
    layer: "pipeline",
    codeLocation: "crates/stages/api/src/pipeline/",
    chapterLink: "/chapters/staged-sync",
    details: {
      responsibilities: [
        "Download blockchain data",
        "Process in sequential stages",
        "Handle reorganizations",
        "Optimize sync performance"
      ],
      keyMethods: [
        "run_stage",
        "unwind_stage",
        "checkpoint_progress",
        "handle_reorg"
      ],
      dependencies: ["executor", "database", "p2p"]
    }
  },
  {
    id: "consensus",
    label: "Consensus Engine",
    description: "Fork choice & finality",
    icon: Activity,
    position: { x: 300, y: 420 },
    color: "from-red-500 to-pink-500",
    layer: "pipeline",
    codeLocation: "crates/engine/tree/src/engine.rs:173-188",
    chapterLink: "/chapters/engine-tree-prewarming",
    details: {
      responsibilities: [
        "Track canonical chain",
        "Handle fork choice updates",
        "Manage finalized blocks",
        "Coordinate with beacon chain"
      ],
      keyMethods: [
        "on_forkchoice_updated",
        "insert_block",
        "make_canonical",
        "prune_old_blocks"
      ],
      dependencies: ["database", "validator", "builder"]
    }
  },
  {
    id: "builder",
    label: "Block Builder",
    description: "Block assembly",
    icon: Layers,
    position: { x: 500, y: 420 },
    color: "from-violet-500 to-purple-500",
    layer: "pipeline",
    codeLocation: "crates/payload/builder/src/",
    chapterLink: "/chapters/block-lifecycle",
    details: {
      responsibilities: [
        "Assemble new blocks",
        "Select transactions from mempool",
        "Optimize for MEV extraction",
        "Build payload for proposers"
      ],
      keyMethods: [
        "build_payload",
        "select_transactions",
        "compute_block_value",
        "seal_block"
      ],
      dependencies: ["mempool", "executor", "state_root"]
    }
  }
]

// Enhanced connections with descriptions
const componentConnections: Connection[] = [
  // Entry Point: RPC Server flows
  { 
    from: "rpc", 
    to: "mempool", 
    label: "Submit TX", 
    flowType: "transaction", 
    animated: true,
    description: "User transactions submitted via RPC"
  },
  { 
    from: "rpc", 
    to: "executor", 
    label: "eth_call", 
    flowType: "query",
    description: "Simulate transaction execution"
  },
  { 
    from: "rpc", 
    to: "database", 
    label: "Query state", 
    flowType: "query",
    description: "Read blockchain data"
  },

  // Entry Point: Engine API flows (from Consensus Layer)
  { 
    from: "engine", 
    to: "validator", 
    label: "newPayload", 
    flowType: "consensus", 
    animated: true,
    description: "New block from consensus layer"
  },
  { 
    from: "engine", 
    to: "consensus", 
    label: "forkchoiceUpdated", 
    flowType: "consensus",
    description: "Update canonical chain"
  },
  { 
    from: "validator", 
    to: "executor", 
    label: "Execute block", 
    flowType: "consensus",
    description: "Validate block execution"
  },

  // Entry Point: P2P Network flows
  { 
    from: "p2p", 
    to: "mempool", 
    label: "Broadcast TX", 
    flowType: "p2p",
    description: "Transactions from network peers"
  },
  { 
    from: "p2p", 
    to: "sync", 
    label: "Sync blocks", 
    flowType: "p2p", 
    animated: true,
    description: "Download blockchain data"
  },
  { 
    from: "sync", 
    to: "executor", 
    label: "Execute synced blocks", 
    flowType: "p2p",
    description: "Process downloaded blocks"
  },

  // Internal Processing flows
  { 
    from: "mempool", 
    to: "builder", 
    label: "Include TXs", 
    flowType: "internal",
    description: "Select transactions for new block"
  },
  { 
    from: "builder", 
    to: "executor", 
    label: "Build block", 
    flowType: "internal",
    description: "Execute block during building"
  },
  { 
    from: "executor", 
    to: "state_root", 
    label: "Update state", 
    flowType: "internal", 
    animated: true,
    description: "Compute new state root"
  },
  { 
    from: "executor", 
    to: "database", 
    label: "Persist changes", 
    flowType: "internal",
    description: "Save state to database"
  },

  // State management flows
  { 
    from: "state_root", 
    to: "database", 
    label: "Store trie", 
    flowType: "storage",
    description: "Persist trie nodes"
  },
  { 
    from: "sync", 
    to: "database", 
    label: "Write blocks", 
    flowType: "storage",
    description: "Store synced blocks"
  },
  { 
    from: "consensus", 
    to: "database", 
    label: "Update chain", 
    flowType: "storage",
    description: "Update canonical chain"
  },
  { 
    from: "consensus", 
    to: "builder", 
    label: "Trigger building", 
    flowType: "internal",
    description: "Request new payload"
  }
]

const flowTypeColors: Record<FlowType, string> = {
  transaction: "stroke-green-400",
  consensus: "stroke-orange-400", 
  p2p: "stroke-purple-400",
  query: "stroke-blue-400",
  internal: "stroke-yellow-400",
  storage: "stroke-gray-400"
}

const layerInfo = {
  entry: { 
    label: "Entry Points", 
    color: "text-yellow-400", 
    description: "External interfaces",
    bgColor: "bg-yellow-500/10"
  },
  processing: { 
    label: "Processing", 
    color: "text-blue-400", 
    description: "Core processing",
    bgColor: "bg-blue-500/10"
  },
  state: { 
    label: "State", 
    color: "text-green-400", 
    description: "State management",
    bgColor: "bg-green-500/10"
  },
  pipeline: { 
    label: "Pipeline", 
    color: "text-pink-400", 
    description: "Sync & consensus",
    bgColor: "bg-pink-500/10"
  }
}

export default function ImprovedArchitecturePage() {
  const [activeComponent, setActiveComponent] = useState<ComponentType | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<SystemComponent | null>(null)
  const [selectedFlowType, setSelectedFlowType] = useState<FlowType | null>(null)
  const [showFlow, setShowFlow] = useState(false)
  // const [animationPhase, setAnimationPhase] = useState(0)
  const [viewMode] = useState<"desktop" | "mobile">("desktop")

  const startFlowAnimation = (flowType: FlowType) => {
    setSelectedFlowType(flowType)
    setShowFlow(true)
    // setAnimationPhase(0)
    
    // Animate flow in phases
    // const timer = setInterval(() => {
    //   setAnimationPhase(prev => prev + 1)
    // }, 1000)
    
    setTimeout(() => {
      // clearInterval(timer)
      setShowFlow(false)
      setSelectedFlowType(null)
      // setAnimationPhase(0)
    }, 8000)
  }

  const handleComponentClick = (component: SystemComponent) => {
    setSelectedComponent(component)
  }

  const renderConnection = (connection: Connection) => {
    const fromComp = systemComponents.find(c => c.id === connection.from)
    const toComp = systemComponents.find(c => c.id === connection.to)
    
    if (!fromComp || !toComp) return null
    
    const fromX = fromComp.position.x + 80
    const fromY = fromComp.position.y + 40
    const toX = toComp.position.x + 80  
    const toY = toComp.position.y + 40
    
    const isActive = selectedFlowType === connection.flowType && showFlow
    const isComponentActive = activeComponent === connection.from || activeComponent === connection.to
    const strokeColor = isActive ? flowTypeColors[connection.flowType] : 
                       isComponentActive ? "stroke-zinc-400" : "stroke-zinc-700"
    const opacity = isActive || isComponentActive ? 1 : 0.4
    
    // Create curved path for better visibility
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2
    const controlX = midX
    const controlY = midY - 30
    
    return (
      <g key={`${connection.from}-${connection.to}`} opacity={opacity}>
        <path
          d={`M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`}
          fill="none"
          className={cn("stroke-2 transition-all", strokeColor, isActive && "animate-pulse")}
          strokeDasharray={isActive ? "5,5" : "none"}
        />
        <circle
          cx={toX}
          cy={toY}
          r={4}
          className={cn("fill-current transition-all", strokeColor)}
        />
        {(isActive || isComponentActive) && (
          <g>
            <rect
              x={midX - 40}
              y={midY - 20}
              width={80}
              height={16}
              fill="rgba(0,0,0,0.8)"
              rx={4}
            />
            <text
              x={midX}
              y={midY - 8}
              className="text-xs fill-current text-zinc-300"
              textAnchor="middle"
            >
              {connection.label}
            </text>
          </g>
        )}
      </g>
    )
  }

  const ComponentCard = ({ component }: { component: SystemComponent }) => {
    const Icon = component.icon
    // const isActive = activeComponent === component.id
    const isSelected = selectedComponent?.id === component.id
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "absolute rounded-xl border-2 bg-zinc-900/90 backdrop-blur-sm p-3 cursor-pointer transition-all duration-300",
          "hover:shadow-lg group hover:z-10",
          component.isEntryPoint 
            ? "border-yellow-400/50 hover:border-yellow-400 hover:shadow-yellow-400/20" 
            : "border-zinc-700 hover:border-[#627eea] hover:shadow-[#627eea]/20",
          isSelected && "ring-2 ring-blue-400 border-blue-400"
        )}
        style={{
          left: viewMode === "desktop" ? component.position.x : undefined,
          top: viewMode === "desktop" ? component.position.y : undefined,
          width: viewMode === "desktop" ? 160 : undefined,
          position: viewMode === "desktop" ? "absolute" : "relative"
        }}
        onMouseEnter={() => setActiveComponent(component.id)}
        onMouseLeave={() => setActiveComponent(null)}
        onClick={() => handleComponentClick(component)}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className={cn(
            "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
            component.color
          )}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">
              {component.label}
            </h3>
            {component.isEntryPoint && (
              <span className="text-xs text-yellow-400">Entry →</span>
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-400 line-clamp-2">{component.description}</p>
        {component.chapterLink && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link 
              href={component.chapterLink}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Chapter <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Reth Architecture Overview
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 mt-1">
                Interactive system architecture - click components to explore
              </p>
            </div>
            <Link 
              href="/chapters/overview"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              All Chapters
            </Link>
          </div>
        </motion.div>

        {/* Flow Type Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          <span className="text-sm text-zinc-500 self-center mr-2">Trace Flow:</span>
          {Object.entries(flowTypeColors).map(([flowType, color]) => (
            <button
              key={flowType}
              onClick={() => startFlowAnimation(flowType as FlowType)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                "border border-zinc-700 hover:border-zinc-600",
                "bg-zinc-900/50 hover:bg-zinc-800/50",
                selectedFlowType === flowType && showFlow && "ring-2 ring-yellow-400"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", color.replace("stroke-", "bg-"))} />
                <span className="capitalize">{flowType}</span>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Architecture Diagram - Desktop View */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-zinc-950/50 rounded-2xl border border-zinc-800 overflow-hidden hidden lg:block"
        >
          {/* Layer backgrounds */}
          <div className="absolute inset-0">
            <div className="absolute left-0 top-0 right-0 h-32 bg-gradient-to-b from-yellow-500/5 to-transparent" />
            <div className="absolute left-0 top-32 right-0 h-32 bg-gradient-to-b from-blue-500/5 to-transparent" />
            <div className="absolute left-0 top-64 right-0 h-32 bg-gradient-to-b from-green-500/5 to-transparent" />
            <div className="absolute left-0 top-96 right-0 h-32 bg-gradient-to-b from-pink-500/5 to-transparent" />
          </div>

          <div className="relative p-8">
            {/* Layer Labels */}
            <div className="absolute left-4 top-8 space-y-28 hidden xl:block">
              {Object.entries(layerInfo).map(([layer, info]) => (
                <div key={layer} className="text-left">
                  <div className={cn("text-xs font-bold uppercase tracking-wider mb-1", info.color)}>
                    {info.label}
                  </div>
                  <div className="text-xs text-zinc-600 max-w-[100px]">
                    {info.description}
                  </div>
                </div>
              ))}
            </div>

            <div className="ml-0 xl:ml-32">
              {/* SVG for connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {componentConnections.map(renderConnection)}
              </svg>

              {/* Components */}
              <div className="relative" style={{ height: '520px', width: '100%', minWidth: '600px', zIndex: 2 }}>
                {systemComponents.map(component => (
                  <ComponentCard key={component.id} component={component} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile/Tablet View - Cards Layout */}
        <div className="lg:hidden space-y-6">
          {Object.entries(layerInfo).map(([layer, info]) => (
            <motion.div
              key={layer}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("text-sm font-bold uppercase tracking-wider", info.color)}>
                  {info.label}
                </div>
                <div className="text-xs text-zinc-500">
                  {info.description}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {systemComponents
                  .filter(comp => comp.layer === layer)
                  .map(component => {
                    const Icon = component.icon
                    return (
                      <motion.div
                        key={component.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleComponentClick(component)}
                        className={cn(
                          "p-4 rounded-xl border-2 bg-zinc-900/90 backdrop-blur-sm cursor-pointer transition-all",
                          "hover:shadow-lg",
                          component.isEntryPoint 
                            ? "border-yellow-400/50 hover:border-yellow-400" 
                            : "border-zinc-700 hover:border-zinc-600",
                          selectedComponent?.id === component.id && "ring-2 ring-blue-400"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                            component.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm">
                              {component.label}
                              {component.isEntryPoint && (
                                <span className="ml-2 text-xs text-yellow-400">Entry</span>
                              )}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1">{component.description}</p>
                            {component.chapterLink && (
                              <Link 
                                href={component.chapterLink}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300"
                              >
                                View Chapter <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Component Details Modal */}
        <AnimatePresence>
          {selectedComponent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedComponent(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                      selectedComponent.color
                    )}>
                      <selectedComponent.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {selectedComponent.label}
                      </h2>
                      <p className="text-sm text-zinc-400">{selectedComponent.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedComponent(null)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedComponent.details && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Responsibilities
                      </h3>
                      <ul className="space-y-1">
                        {selectedComponent.details.responsibilities.map((resp, i) => (
                          <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                            <span className="text-zinc-600 mt-1">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedComponent.details.keyMethods && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                          <Code className="w-4 h-4" /> Key Methods
                        </h3>
                        <div className="space-y-1">
                          {selectedComponent.details.keyMethods.map((method, i) => (
                            <code key={i} className="block text-xs text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded">
                              {method}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedComponent.codeLocation && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                          <FileCode className="w-4 h-4" /> Source Code
                        </h3>
                        <code className="block text-xs text-zinc-400 bg-zinc-800/50 px-3 py-2 rounded font-mono">
                          {selectedComponent.codeLocation}
                        </code>
                      </div>
                    )}

                    {selectedComponent.details.dependencies && selectedComponent.details.dependencies.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" /> Dependencies
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedComponent.details.dependencies.map((dep, i) => {
                            const depComp = systemComponents.find(c => c.id === dep)
                            return depComp ? (
                              <button
                                key={i}
                                onClick={() => {
                                  setSelectedComponent(depComp)
                                }}
                                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                              >
                                {depComp.label}
                              </button>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {selectedComponent.chapterLink && (
                      <div className="pt-4 border-t border-zinc-800">
                        <Link
                          href={selectedComponent.chapterLink}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                          View Detailed Chapter
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Entry Points */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Entry Points
            </h3>
            <div className="space-y-1 text-xs text-zinc-400">
              <div><strong className="text-zinc-300">RPC:</strong> External APIs (wallets, dApps)</div>
              <div><strong className="text-zinc-300">P2P:</strong> Other Ethereum nodes</div> 
              <div><strong className="text-zinc-300">Engine:</strong> Consensus layer (beacon chain)</div>
            </div>
          </div>

          {/* Flow Types */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <Route className="w-4 h-4" /> Data Flows
            </h3>
            <div className="space-y-1 text-xs">
              {Object.entries(flowTypeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", color.replace("stroke-", "bg-"))} />
                  <span className="text-zinc-400 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Quick Links
            </h3>
            <div className="space-y-1">
              <Link href="/chapters/block-lifecycle" className="block text-xs text-zinc-400 hover:text-blue-400 transition-colors">
                → Block Lifecycle
              </Link>
              <Link href="/chapters/payload-validation" className="block text-xs text-zinc-400 hover:text-blue-400 transition-colors">
                → Payload Validation
              </Link>
              <Link href="/chapters/state-root" className="block text-xs text-zinc-400 hover:text-blue-400 transition-colors">
                → State Root Computation
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Flow Animation Status */}
        {showFlow && selectedFlowType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl p-4 max-w-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-3 h-3 rounded-full animate-pulse", flowTypeColors[selectedFlowType].replace("stroke-", "bg-"))} />
              <h4 className="font-semibold text-white capitalize">{selectedFlowType} Flow</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Tracing {selectedFlowType} data through the system...
            </p>
            <div className="mt-2">
              <div className="w-full bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  className={cn("h-1.5 rounded-full", flowTypeColors[selectedFlowType].replace("stroke-", "bg-"))}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}