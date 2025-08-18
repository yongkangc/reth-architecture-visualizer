"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Database, Network, Shield, Cpu, GitBranch,
  Activity, Zap,
  HardDrive, Layers,
  Globe,
  RefreshCw, Server
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
}

interface Connection {
  from: ComponentType
  to: ComponentType
  label: string
  flowType: FlowType
  animated?: boolean
}

// Entry points clearly marked at the top
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
    isEntryPoint: true
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
    isEntryPoint: true
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
    isEntryPoint: true
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
    codeLocation: "crates/transaction-pool/src/pool/"
  },
  {
    id: "validator",
    label: "Block Validator",
    description: "Consensus validation",
    icon: Shield,
    position: { x: 300, y: 180 },
    color: "from-yellow-500 to-orange-500",
    layer: "processing",
    codeLocation: "crates/consensus/consensus/src/validation.rs"
  },
  {
    id: "executor",
    label: "EVM Executor",
    description: "Transaction execution",
    icon: Cpu,
    position: { x: 500, y: 180 },
    color: "from-indigo-500 to-purple-500",
    layer: "processing",
    codeLocation: "crates/evm/evm/src/execute.rs:313-318"
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
    codeLocation: "crates/trie/trie/src/trie.rs:31-45"
  },
  {
    id: "database",
    label: "State Database",
    description: "MDBX storage backend",
    icon: HardDrive,
    position: { x: 400, y: 300 },
    color: "from-gray-600 to-gray-700",
    layer: "state",
    codeLocation: "crates/storage/db/"
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
    codeLocation: "crates/stages/api/src/pipeline/"
  },
  {
    id: "consensus",
    label: "Consensus Engine",
    description: "Fork choice & finality",
    icon: Activity,
    position: { x: 300, y: 420 },
    color: "from-red-500 to-pink-500",
    layer: "pipeline",
    codeLocation: "crates/engine/tree/src/engine.rs:173-188"
  },
  {
    id: "builder",
    label: "Block Builder",
    description: "Block assembly",
    icon: Layers,
    position: { x: 500, y: 420 },
    color: "from-violet-500 to-purple-500",
    layer: "pipeline",
    codeLocation: "crates/payload/builder/src/"
  }
]

// Define clear flow paths from entry points
const componentConnections: Connection[] = [
  // Entry Point: RPC Server flows
  { from: "rpc", to: "mempool", label: "Submit TX", flowType: "transaction", animated: true },
  { from: "rpc", to: "executor", label: "eth_call", flowType: "query" },
  { from: "rpc", to: "database", label: "Query state", flowType: "query" },

  // Entry Point: Engine API flows (from Consensus Layer)
  { from: "engine", to: "validator", label: "newPayload", flowType: "consensus", animated: true },
  { from: "engine", to: "consensus", label: "forkchoiceUpdated", flowType: "consensus" },
  { from: "validator", to: "executor", label: "Execute block", flowType: "consensus" },

  // Entry Point: P2P Network flows
  { from: "p2p", to: "mempool", label: "Broadcast TX", flowType: "p2p" },
  { from: "p2p", to: "sync", label: "Sync blocks", flowType: "p2p", animated: true },
  { from: "sync", to: "executor", label: "Execute synced blocks", flowType: "p2p" },

  // Internal Processing flows
  { from: "mempool", to: "builder", label: "Include TXs", flowType: "internal" },
  { from: "builder", to: "executor", label: "Build block", flowType: "internal" },
  { from: "executor", to: "state_root", label: "Update state", flowType: "internal", animated: true },
  { from: "executor", to: "database", label: "Persist changes", flowType: "internal" },

  // State management flows
  { from: "state_root", to: "database", label: "Store trie", flowType: "storage" },
  { from: "sync", to: "database", label: "Write blocks", flowType: "storage" },
  { from: "consensus", to: "database", label: "Update chain", flowType: "storage" },
  { from: "consensus", to: "builder", label: "Trigger building", flowType: "internal" }
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
  entry: { label: "Entry Points", color: "text-yellow-400", description: "External interfaces that receive requests" },
  processing: { label: "Processing", color: "text-blue-400", description: "Core transaction and block processing" },
  state: { label: "State", color: "text-green-400", description: "State management and persistence" },
  pipeline: { label: "Pipeline", color: "text-pink-400", description: "Synchronization and consensus coordination" }
}

export default function ImprovedArchitecturePage() {
  const [activeComponent, setActiveComponent] = useState<ComponentType | null>(null)
  const [selectedFlowType, setSelectedFlowType] = useState<FlowType | null>(null)
  const [showFlow, setShowFlow] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  const startFlowAnimation = (flowType: FlowType) => {
    setSelectedFlowType(flowType)
    setShowFlow(true)
    setAnimationPhase(0)
    
    // Animate flow in phases
    const timer = setInterval(() => {
      setAnimationPhase(prev => prev + 1)
    }, 1000)
    
    setTimeout(() => {
      clearInterval(timer)
      setShowFlow(false)
      setSelectedFlowType(null)
      setAnimationPhase(0)
    }, 8000)
  }

  const getConnectionsForFlow = (flowType: FlowType) => {
    return componentConnections.filter(conn => conn.flowType === flowType)
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
    const strokeColor = isActive ? flowTypeColors[connection.flowType] : "stroke-zinc-600"
    
    return (
      <g key={`${connection.from}-${connection.to}`}>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          className={cn("stroke-2", strokeColor, isActive && "animate-pulse")}
          strokeDasharray={isActive ? "5,5" : "none"}
        />
        <circle
          cx={toX}
          cy={toY}
          r={4}
          className={cn("fill-current", strokeColor)}
        />
        {isActive && (
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2 - 8}
            className="text-xs fill-current text-zinc-300"
            textAnchor="middle"
          >
            {connection.label}
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">
                Reth Architecture: Entry Points & Data Flow
              </h1>
              <p className="text-zinc-400">
                Follow the flow from entry points through the modular architecture
              </p>
            </div>
          </div>
        </motion.div>

        {/* Flow Type Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex flex-wrap gap-3"
        >
          <div className="text-sm text-zinc-400 mr-4">Flow Types:</div>
          {Object.entries(flowTypeColors).map(([flowType, color]) => (
            <button
              key={flowType}
              onClick={() => startFlowAnimation(flowType as FlowType)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                "border border-zinc-700 hover:border-zinc-600",
                "bg-zinc-900/50 hover:bg-zinc-800/50",
                selectedFlowType === flowType && showFlow && "ring-2 ring-yellow-400"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", color.replace("stroke-", "bg-"))} />
                {flowType}
              </div>
            </button>
          ))}
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-zinc-950/50 rounded-2xl border border-zinc-800 p-8 overflow-x-auto"
        >
          {/* Layer Labels */}
          <div className="absolute left-4 top-8 space-y-16">
            {Object.entries(layerInfo).map(([layer, info]) => (
              <div key={layer} className="text-left">
                <div className={cn("text-xs font-semibold uppercase tracking-wider mb-1", info.color)}>
                  {info.label}
                </div>
                <div className="text-xs text-zinc-600 max-w-24">
                  {info.description}
                </div>
              </div>
            ))}
          </div>

          <div className="ml-32">
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {componentConnections.map(renderConnection)}
            </svg>

            {/* Components */}
            <div className="relative" style={{ height: '520px', width: '600px', zIndex: 2 }}>
              {systemComponents.map(component => {
                const Icon = component.icon
                const isActive = activeComponent === component.id
                
                return (
                  <motion.div
                    key={component.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      "absolute rounded-xl border-2 bg-zinc-900/90 backdrop-blur-sm p-4 cursor-pointer transition-all duration-300",
                      "hover:shadow-lg group",
                      component.isEntryPoint 
                        ? "border-yellow-400/50 hover:border-yellow-400 hover:shadow-yellow-400/20" 
                        : "border-zinc-700 hover:border-[#627eea] hover:shadow-[#627eea]/20"
                    )}
                    style={{
                      left: component.position.x,
                      top: component.position.y,
                      width: 160,
                      height: 'auto'
                    }}
                    onMouseEnter={() => setActiveComponent(component.id)}
                    onMouseLeave={() => setActiveComponent(null)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        component.color
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">
                          {component.label}
                          {component.isEntryPoint && (
                            <span className="ml-2 text-xs text-yellow-400">→ Entry</span>
                          )}
                        </h3>
                        <p className="text-xs text-zinc-400">{component.description}</p>
                      </div>
                    </div>
                    {component.codeLocation && (
                      <div className="mt-2 pt-2 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 font-mono truncate" title={component.codeLocation}>
                          {component.codeLocation}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Entry Points */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Entry Points</h3>
            <div className="space-y-2 text-sm">
              <div><strong>RPC Server:</strong> External APIs (wallets, dApps)</div>
              <div><strong>P2P Network:</strong> Other Ethereum nodes</div> 
              <div><strong>Engine API:</strong> Consensus layer communication</div>
            </div>
          </div>

          {/* Flow Types */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Data Flow Types</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <strong>Transaction:</strong> User-submitted transactions
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400" />
                <strong>Consensus:</strong> Block validation & finality
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <strong>P2P:</strong> Network synchronization
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current Flow Status */}
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
              Following {selectedFlowType} data through the system...
            </p>
            <div className="mt-2">
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div 
                  className={cn("h-2 rounded-full transition-all duration-1000", flowTypeColors[selectedFlowType].replace("stroke-", "bg-"))}
                  style={{ width: `${(animationPhase / 8) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}