"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Server, Database, Network, Shield, Cpu, GitBranch,
  Activity, Layers, Zap, Globe, Box, ArrowRight,
  ArrowUpRight, ArrowDownRight, Info, Play, Pause,
  HardDrive, Cloud, Terminal, Blocks, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

type ComponentType = "consensus" | "engine" | "networking" | "storage" | "rpc" | "sync" | "evm" | "trie"
type ConnectionType = "data" | "control" | "api"

interface SystemComponent {
  id: ComponentType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  position: { x: number; y: number }
  color: string
  layer: "external" | "api" | "core" | "storage"
  details: string[]
}

interface Connection {
  from: ComponentType
  to: ComponentType
  type: ConnectionType
  label: string
  bidirectional?: boolean
}

const systemComponents: SystemComponent[] = [
  {
    id: "consensus",
    name: "Consensus Layer",
    description: "Beacon chain client (Lighthouse, Prysm, etc)",
    icon: Shield,
    position: { x: 50, y: 10 },
    color: "from-blue-500 to-cyan-500",
    layer: "external",
    details: [
      "Proof of Stake consensus",
      "Block proposals",
      "Attestations",
      "Finality"
    ]
  },
  {
    id: "engine",
    name: "Engine API",
    description: "Consensus-Execution communication",
    icon: Cpu,
    position: { x: 50, y: 30 },
    color: "from-purple-500 to-pink-500",
    layer: "api",
    details: [
      "newPayload",
      "forkchoiceUpdated",
      "getPayload",
      "Payload validation"
    ]
  },
  {
    id: "networking",
    name: "P2P Network",
    description: "DevP2P protocol and discovery",
    icon: Network,
    position: { x: 20, y: 50 },
    color: "from-green-500 to-emerald-500",
    layer: "core",
    details: [
      "Node discovery (Discv4/5)",
      "RLPx protocol",
      "Transaction gossip",
      "Block propagation"
    ]
  },
  {
    id: "sync",
    name: "Staged Sync",
    description: "Pipeline for blockchain synchronization",
    icon: Activity,
    position: { x: 50, y: 50 },
    color: "from-orange-500 to-red-500",
    layer: "core",
    details: [
      "Headers download",
      "Bodies download",
      "Sender recovery",
      "Execution",
      "State root computation"
    ]
  },
  {
    id: "evm",
    name: "EVM Executor",
    description: "Transaction execution with Revm",
    icon: Zap,
    position: { x: 80, y: 50 },
    color: "from-yellow-500 to-orange-500",
    layer: "core",
    details: [
      "Revm integration",
      "Opcode execution",
      "Gas metering",
      "State transitions"
    ]
  },
  {
    id: "trie",
    name: "State Trie",
    description: "Merkle Patricia Trie management",
    icon: GitBranch,
    position: { x: 65, y: 70 },
    color: "from-indigo-500 to-purple-500",
    layer: "core",
    details: [
      "State root calculation",
      "Merkle proofs",
      "Trie updates",
      "Parallel computation"
    ]
  },
  {
    id: "storage",
    name: "Storage Layer",
    description: "MDBX database and static files",
    icon: Database,
    position: { x: 50, y: 90 },
    color: "from-pink-500 to-rose-500",
    layer: "storage",
    details: [
      "MDBX key-value store",
      "Static file storage",
      "Pruning",
      "Snapshots"
    ]
  },
  {
    id: "rpc",
    name: "RPC Server",
    description: "JSON-RPC API endpoints",
    icon: Terminal,
    position: { x: 20, y: 30 },
    color: "from-teal-500 to-cyan-500",
    layer: "api",
    details: [
      "eth_ namespace",
      "debug_ namespace",
      "trace_ namespace",
      "WebSocket subscriptions"
    ]
  }
]

const connections: Connection[] = [
  { from: "consensus", to: "engine", type: "api", label: "Engine API", bidirectional: true },
  { from: "engine", to: "sync", type: "control", label: "Block Processing" },
  { from: "networking", to: "sync", type: "data", label: "Block/TX Data" },
  { from: "sync", to: "evm", type: "control", label: "Execute TXs" },
  { from: "evm", to: "trie", type: "data", label: "State Updates" },
  { from: "trie", to: "storage", type: "data", label: "Persist State" },
  { from: "sync", to: "storage", type: "data", label: "Store Blocks" },
  { from: "rpc", to: "storage", type: "data", label: "Query Data" },
  { from: "rpc", to: "evm", type: "control", label: "eth_call" },
  { from: "networking", to: "rpc", type: "data", label: "Mempool TXs" }
]

export default function ArchitecturePage() {
  const [activeComponent, setActiveComponent] = useState<ComponentType | null>(null)
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [dataFlow, setDataFlow] = useState<string[]>([])
  const [selectedFlow, setSelectedFlow] = useState<"sync" | "transaction" | "rpc" | null>(null)

  // Simulate data flow animations
  const simulateFlow = (flowType: "sync" | "transaction" | "rpc") => {
    setSelectedFlow(flowType)
    setIsAnimating(true)
    setDataFlow([])
    
    let flow: ComponentType[] = []
    if (flowType === "sync") {
      flow = ["consensus", "engine", "sync", "evm", "trie", "storage"]
    } else if (flowType === "transaction") {
      flow = ["networking", "sync", "evm", "trie", "storage"]
    } else if (flowType === "rpc") {
      flow = ["rpc", "storage"]
    }

    flow.forEach((component, index) => {
      setTimeout(() => {
        setActiveComponent(component)
        setDataFlow(prev => [...prev, component])
      }, index * 500)
    })

    setTimeout(() => {
      setIsAnimating(false)
      setActiveComponent(null)
      setSelectedFlow(null)
    }, flow.length * 500 + 500)
  }

  return (
    <div className="min-h-screen relative p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#627eea] to-[#a16ae8] flex items-center justify-center">
              <Blocks className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Reth Architecture Overview</h1>
              <p className="text-zinc-400">
                High-level view of how all components connect and interact
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Architecture Diagram */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-8 h-[600px]">
              <h2 className="text-lg font-semibold mb-4">System Architecture</h2>
              
              {/* Layer Backgrounds */}
              <div className="absolute inset-x-8 top-20 bottom-8">
                <div className="absolute top-0 h-[15%] bg-gradient-to-b from-blue-500/5 to-transparent rounded-xl" />
                <div className="absolute top-[15%] h-[20%] bg-gradient-to-b from-purple-500/5 to-transparent rounded-xl" />
                <div className="absolute top-[35%] h-[35%] bg-gradient-to-b from-orange-500/5 to-transparent rounded-xl" />
                <div className="absolute bottom-0 h-[15%] bg-gradient-to-b from-pink-500/5 to-pink-500/10 rounded-xl" />
              </div>

              {/* Components */}
              <div className="relative h-full">
                {systemComponents.map((component) => {
                  const Icon = component.icon
                  const isActive = activeComponent === component.id
                  const isInFlow = dataFlow.includes(component.id)
                  
                  return (
                    <motion.div
                      key={component.id}
                      className="absolute"
                      style={{
                        left: `${component.position.x}%`,
                        top: `${component.position.y}%`,
                        transform: "translate(-50%, -50%)"
                      }}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        zIndex: isActive ? 10 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        onClick={() => setActiveComponent(activeComponent === component.id ? null : component.id)}
                        className={cn(
                          "relative group cursor-pointer",
                          isInFlow && "animate-pulse"
                        )}
                      >
                        {/* Glow effect */}
                        {isActive && (
                          <motion.div
                            className={cn(
                              "absolute inset-0 rounded-xl bg-gradient-to-br blur-xl",
                              component.color
                            )}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 0.8, 0.5]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity
                            }}
                          />
                        )}
                        
                        {/* Component box */}
                        <div className={cn(
                          "relative px-4 py-3 rounded-xl border-2 transition-all duration-300",
                          "bg-zinc-900/90 backdrop-blur-sm",
                          isActive 
                            ? "border-[#627eea] shadow-lg shadow-[#627eea]/30"
                            : "border-zinc-700 hover:border-zinc-600"
                        )}>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                              component.color
                            )}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-white">{component.name}</div>
                              <div className="text-xs text-zinc-400">{component.layer}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {/* Connections */}
                <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                  {connections.map((connection, index) => {
                    const from = systemComponents.find(c => c.id === connection.from)
                    const to = systemComponents.find(c => c.id === connection.to)
                    if (!from || !to) return null

                    const fromX = `${from.position.x}%`
                    const fromY = `${from.position.y}%`
                    const toX = `${to.position.x}%`
                    const toY = `${to.position.y}%`

                    const isActive = (activeComponent === connection.from || activeComponent === connection.to) ||
                                   (dataFlow.includes(connection.from) && dataFlow.includes(connection.to))

                    return (
                      <g key={index}>
                        <motion.line
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke={isActive ? "#627eea" : "#3f3f46"}
                          strokeWidth={isActive ? 2 : 1}
                          strokeDasharray={connection.type === "control" ? "5,5" : "0"}
                          initial={{ pathLength: 0 }}
                          animate={{ 
                            pathLength: 1,
                            opacity: isActive ? 1 : 0.3
                          }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                        {connection.bidirectional && (
                          <motion.line
                            x1={toX}
                            y1={toY}
                            x2={fromX}
                            y2={fromY}
                            stroke={isActive ? "#627eea" : "#3f3f46"}
                            strokeWidth={isActive ? 2 : 1}
                            strokeDasharray="5,5"
                            initial={{ pathLength: 0 }}
                            animate={{ 
                              pathLength: 1,
                              opacity: isActive ? 0.5 : 0.2
                            }}
                            transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                          />
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Layer Labels */}
              <div className="absolute right-4 top-20 space-y-8 text-xs">
                <div className="text-blue-400">External</div>
                <div className="text-purple-400">API Layer</div>
                <div className="text-orange-400">Core Systems</div>
                <div className="text-pink-400">Storage</div>
              </div>
            </div>
          </motion.div>

          {/* Control Panel & Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Data Flow Simulations */}
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Data Flow Simulations</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => simulateFlow("sync")}
                  disabled={isAnimating}
                  className={cn(
                    "w-full p-3 rounded-xl border text-left transition-all",
                    selectedFlow === "sync"
                      ? "bg-[#627eea]/20 border-[#627eea]"
                      : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#627eea]" />
                    <div>
                      <div className="font-medium">Block Sync Flow</div>
                      <div className="text-xs text-zinc-400">CL → Engine → Sync → Storage</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => simulateFlow("transaction")}
                  disabled={isAnimating}
                  className={cn(
                    "w-full p-3 rounded-xl border text-left transition-all",
                    selectedFlow === "transaction"
                      ? "bg-[#627eea]/20 border-[#627eea]"
                      : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">Transaction Flow</div>
                      <div className="text-xs text-zinc-400">P2P → Mempool → EVM → State</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => simulateFlow("rpc")}
                  disabled={isAnimating}
                  className={cn(
                    "w-full p-3 rounded-xl border text-left transition-all",
                    selectedFlow === "rpc"
                      ? "bg-[#627eea]/20 border-[#627eea]"
                      : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-teal-500" />
                    <div>
                      <div className="font-medium">RPC Query Flow</div>
                      <div className="text-xs text-zinc-400">Client → RPC → Storage</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Component Details */}
            <AnimatePresence mode="wait">
              {activeComponent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6"
                >
                  {(() => {
                    const component = systemComponents.find(c => c.id === activeComponent)
                    if (!component) return null
                    const Icon = component.icon

                    return (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            component.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{component.name}</h3>
                            <p className="text-xs text-zinc-400">{component.description}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {component.details.map((detail, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <ChevronRight className="w-3 h-3 text-zinc-500" />
                              <span className="text-zinc-300">{detail}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <div className="text-xs text-zinc-500">
                            Connected to:
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {connections
                              .filter(c => c.from === activeComponent || c.to === activeComponent)
                              .map((conn, i) => {
                                const otherId = conn.from === activeComponent ? conn.to : conn.from
                                const other = systemComponents.find(c => c.id === otherId)
                                return (
                                  <span
                                    key={i}
                                    className="px-2 py-1 rounded-lg bg-zinc-800 text-xs"
                                  >
                                    {other?.name}
                                  </span>
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
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Legend</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-1 bg-zinc-500" />
                  <span className="text-zinc-400">Data flow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-1 bg-zinc-500 border-b-2 border-dashed border-zinc-500" />
                  <span className="text-zinc-400">Control flow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-1 bg-[#627eea]" />
                  <span className="text-zinc-400">Active connection</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}