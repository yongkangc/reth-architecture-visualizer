"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Download, Users, Cpu, Zap, Hash, GitBranch, 
  Database, Search, Play, Pause, RotateCcw, 
  CheckCircle, Clock, Activity, HardDrive,
  MemoryStick, Gauge, TrendingUp, Package
} from "lucide-react"
import { cn } from "@/lib/utils"

type StageId = "headers" | "bodies" | "senders" | "execution" | "hash-account" | "hash-storage" | "merkle" | "tx-lookup" | "history"
type StageStatus = "pending" | "active" | "complete" | "error"

interface SyncStage {
  id: StageId
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  resourceType: "network" | "cpu" | "disk" | "memory"
  metrics: {
    throughput: string
    timeEstimate: string
    resourceUsage: number
  }
  details: string[]
  parallelizable: boolean
  batchSize?: string
}

const syncStages: SyncStage[] = [
  {
    id: "headers",
    name: "Headers Download",
    description: "Download and persist block headers",
    icon: Download,
    color: "from-blue-500 to-cyan-500",
    resourceType: "network",
    metrics: {
      throughput: "50k headers/sec",
      timeEstimate: "~5 minutes",
      resourceUsage: 30
    },
    details: [
      "Downloads headers from peers",
      "Validates header chain",
      "Small data size (~500 bytes each)",
      "Fast synchronization"
    ],
    parallelizable: false
  },
  {
    id: "bodies",
    name: "Bodies Download",
    description: "Download full block bodies with transactions",
    icon: Package,
    color: "from-purple-500 to-pink-500",
    resourceType: "network",
    metrics: {
      throughput: "500 blocks/sec",
      timeEstimate: "~2 hours",
      resourceUsage: 80
    },
    details: [
      "Downloads transaction data",
      "Downloads uncle blocks",
      "Network-intensive stage",
      "Large data volume"
    ],
    parallelizable: true,
    batchSize: "1000 blocks"
  },
  {
    id: "senders",
    name: "Sender Recovery",
    description: "Recover transaction senders via ECDSA",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    resourceType: "cpu",
    metrics: {
      throughput: "150k tx/sec",
      timeEstimate: "~1 hour",
      resourceUsage: 95
    },
    details: [
      "Elliptic curve signature recovery",
      "Massively parallel across CPU cores",
      "CPU-intensive cryptography",
      "Validates transaction signatures"
    ],
    parallelizable: true,
    batchSize: "50k blocks"
  },
  {
    id: "execution",
    name: "Execution",
    description: "Execute transactions in EVM",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    resourceType: "cpu",
    metrics: {
      throughput: "1000 tx/sec",
      timeEstimate: "~4 hours",
      resourceUsage: 70
    },
    details: [
      "Processes transactions via revm",
      "Updates account states",
      "Executes smart contracts",
      "Batch commits to database"
    ],
    parallelizable: false,
    batchSize: "50k blocks"
  },
  {
    id: "hash-account",
    name: "Account Hashing",
    description: "Hash changed account data",
    icon: Hash,
    color: "from-yellow-500 to-amber-500",
    resourceType: "cpu",
    metrics: {
      throughput: "500k accounts/sec",
      timeEstimate: "~30 minutes",
      resourceUsage: 60
    },
    details: [
      "Computes keccak256 hashes",
      "Prepares for Merkle trie",
      "Processes changed accounts only",
      "Optimized batch hashing"
    ],
    parallelizable: true
  },
  {
    id: "hash-storage",
    name: "Storage Hashing",
    description: "Hash contract storage slots",
    icon: HardDrive,
    color: "from-indigo-500 to-purple-500",
    resourceType: "cpu",
    metrics: {
      throughput: "1M slots/sec",
      timeEstimate: "~45 minutes",
      resourceUsage: 65
    },
    details: [
      "Hashes storage key-values",
      "Large volume for DeFi contracts",
      "Parallel processing",
      "Memory-intensive"
    ],
    parallelizable: true
  },
  {
    id: "merkle",
    name: "Merkle Root",
    description: "Calculate state root from trie",
    icon: GitBranch,
    color: "from-teal-500 to-cyan-500",
    resourceType: "memory",
    metrics: {
      throughput: "100 blocks/sec",
      timeEstimate: "~2 hours",
      resourceUsage: 75
    },
    details: [
      "Traverses account trie",
      "Computes storage roots",
      "Builds Merkle proofs",
      "Final state root calculation"
    ],
    parallelizable: true,
    batchSize: "10k blocks"
  },
  {
    id: "tx-lookup",
    name: "Transaction Lookup",
    description: "Index transaction hashes",
    icon: Search,
    color: "from-pink-500 to-rose-500",
    resourceType: "disk",
    metrics: {
      throughput: "100k tx/sec",
      timeEstimate: "~20 minutes",
      resourceUsage: 40
    },
    details: [
      "Maps tx hash to block number",
      "Enables eth_getTransactionByHash",
      "Fast RPC lookups",
      "Sequential disk writes"
    ],
    parallelizable: false
  },
  {
    id: "history",
    name: "History Indexing",
    description: "Index account/storage changes",
    icon: Database,
    color: "from-gray-500 to-zinc-500",
    resourceType: "disk",
    metrics: {
      throughput: "50k changes/sec",
      timeEstimate: "~30 minutes",
      resourceUsage: 45
    },
    details: [
      "Tracks historical states",
      "Enables eth_getStorageAt",
      "Archive node functionality",
      "Large disk footprint"
    ],
    parallelizable: false
  }
]

export default function StagedSyncPage() {
  const [currentStage, setCurrentStage] = useState<number>(-1)
  const [stageStatuses, setStageStatuses] = useState<Record<StageId, StageStatus>>({
    headers: "pending",
    bodies: "pending",
    senders: "pending",
    execution: "pending",
    "hash-account": "pending",
    "hash-storage": "pending",
    merkle: "pending",
    "tx-lookup": "pending",
    history: "pending"
  })
  const [isRunning, setIsRunning] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [resourceMetrics, setResourceMetrics] = useState({
    cpu: 0,
    memory: 0,
    network: 0,
    disk: 0
  })

  const startSync = () => {
    setIsRunning(true)
    setCurrentStage(0)
    setSyncProgress(0)
    
    let stageIndex = 0
    const runStage = () => {
      if (stageIndex >= syncStages.length) {
        setIsRunning(false)
        return
      }

      const stage = syncStages[stageIndex]
      
      // Update stage status
      setStageStatuses(prev => ({
        ...prev,
        [stage.id]: "active"
      }))

      // Update resource metrics
      const metrics = { cpu: 0, memory: 0, network: 0, disk: 0 }
      metrics[stage.resourceType] = stage.metrics.resourceUsage
      setResourceMetrics(metrics)

      // Simulate stage completion
      setTimeout(() => {
        setStageStatuses(prev => ({
          ...prev,
          [stage.id]: "complete"
        }))
        
        setSyncProgress((stageIndex + 1) / syncStages.length * 100)
        
        stageIndex++
        setCurrentStage(stageIndex)
        runStage()
      }, 2000) // Simulate 2 seconds per stage
    }

    runStage()
  }

  const resetSync = () => {
    setCurrentStage(-1)
    setIsRunning(false)
    setSyncProgress(0)
    setStageStatuses({
      headers: "pending",
      bodies: "pending",
      senders: "pending",
      execution: "pending",
      "hash-account": "pending",
      "hash-storage": "pending",
      merkle: "pending",
      "tx-lookup": "pending",
      history: "pending"
    })
    setResourceMetrics({
      cpu: 0,
      memory: 0,
      network: 0,
      disk: 0
    })
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Staged Sync Pipeline</h1>
              <p className="text-zinc-400">
                Sequential blockchain synchronization optimized for performance
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pipeline Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Sync Progress</span>
                  <span className="text-sm font-mono text-zinc-300">{syncProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Stages */}
              <div className="space-y-3">
                {syncStages.map((stage, index) => {
                  const Icon = stage.icon
                  const status = stageStatuses[stage.id]
                  
                  return (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "relative p-4 rounded-xl border transition-all duration-300",
                        status === "active" 
                          ? "bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border-[#627eea]/50 shadow-lg"
                          : status === "complete"
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-zinc-950/50 border-zinc-800"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Stage Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center transition-transform",
                          stage.color,
                          status === "active" && "scale-110 animate-pulse"
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        {/* Stage Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white">{stage.name}</h3>
                            {stage.parallelizable && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                                Parallel
                              </span>
                            )}
                            {stage.batchSize && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                                {stage.batchSize}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mb-2">{stage.description}</p>
                          
                          {/* Metrics */}
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-400" />
                              <span className="text-zinc-500">{stage.metrics.throughput}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-400" />
                              <span className="text-zinc-500">{stage.metrics.timeEstimate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center">
                          {status === "complete" ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : status === "active" ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Activity className="w-6 h-6 text-[#627eea]" />
                            </motion.div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-zinc-700" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Controls */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={isRunning ? () => setIsRunning(false) : startSync}
                  disabled={syncProgress === 100}
                  className={cn(
                    "group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#627eea] to-[#a16ae8]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#a16ae8] to-[#ff8867] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {isRunning ? <Pause className="relative w-4 h-4" /> : <Play className="relative w-4 h-4" />}
                  <span className="relative">{isRunning ? "Pause" : "Start Sync"}</span>
                </button>
                
                <button
                  onClick={resetSync}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium border border-zinc-700 text-zinc-300 hover:bg-white/5 hover:border-zinc-600 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </motion.div>

          {/* Resource Metrics & Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Resource Usage */}
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-[#627eea]" />
                Resource Usage
              </h3>
              
              <div className="space-y-4">
                {[
                  { name: "CPU", value: resourceMetrics.cpu, icon: Cpu, color: "from-blue-500 to-cyan-500" },
                  { name: "Memory", value: resourceMetrics.memory, icon: MemoryStick, color: "from-purple-500 to-pink-500" },
                  { name: "Network", value: resourceMetrics.network, icon: Activity, color: "from-green-500 to-emerald-500" },
                  { name: "Disk I/O", value: resourceMetrics.disk, icon: HardDrive, color: "from-orange-500 to-red-500" }
                ].map(metric => {
                  const Icon = metric.icon
                  return (
                    <div key={metric.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm text-zinc-400">{metric.name}</span>
                        </div>
                        <span className="text-sm font-mono">{metric.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className={cn("h-full bg-gradient-to-r", metric.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Current Stage Details */}
            <AnimatePresence mode="wait">
              {currentStage >= 0 && currentStage < syncStages.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6"
                >
                  {(() => {
                    const stage = syncStages[currentStage]
                    const Icon = stage.icon
                    
                    return (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            stage.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Active Stage</h3>
                            <p className="text-sm text-zinc-400">{stage.name}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {stage.details.map((detail, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <div className="w-1 h-1 rounded-full bg-zinc-500 mt-1.5" />
                              <span className="text-zinc-300">{detail}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}