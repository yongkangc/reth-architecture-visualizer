"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, Pause, RotateCcw, ChevronRight, Clock, Activity, 
  Package, Check, AlertCircle, Zap, Network, Database,
  GitBranch, Upload, Download, Shield, Cpu, HardDrive,
  ArrowRight, ExternalLink
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import PageContainer from "@/components/ui/PageContainer"

// Block lifecycle phases with detailed steps
interface BlockPhase {
  id: string
  name: string
  description: string
  duration: number // milliseconds for animation
  steps: BlockStep[]
  color: string
  icon: React.ElementType
}

interface BlockStep {
  id: string
  name: string
  description: string
  code?: string
  timing?: string
  critical?: boolean
}

const blockPhases: BlockPhase[] = [
  {
    id: "gossip",
    name: "P2P Gossip & Discovery",
    description: "Block propagation through the network",
    duration: 2000,
    color: "from-blue-500 to-cyan-500",
    icon: Network,
    steps: [
      {
        id: "receive-announcement",
        name: "Receive Block Announcement",
        description: "Peer announces new block via NewBlock or NewBlockHashes",
        timing: "~50ms",
        code: `// crates/net/eth-wire/src/types/blocks.rs
pub struct NewBlock {
    pub block: Block,
    pub td: U256, // total difficulty
}`
      },
      {
        id: "validate-announcement",
        name: "Validate Announcement",
        description: "Check if block is new and worth downloading",
        timing: "~10ms"
      },
      {
        id: "request-block",
        name: "Request Full Block",
        description: "Fetch complete block data if only hash was announced",
        timing: "~100-200ms"
      },
      {
        id: "broadcast",
        name: "Broadcast to Peers",
        description: "Propagate block to √n peers to ensure network coverage",
        timing: "~50ms"
      }
    ]
  },
  {
    id: "pre-validation",
    name: "Pre-Validation",
    description: "Quick sanity checks before expensive operations",
    duration: 1500,
    color: "from-yellow-500 to-orange-500",
    icon: Shield,
    steps: [
      {
        id: "header-check",
        name: "Header Validation",
        description: "Verify block number, timestamp, gas limits",
        timing: "~5ms",
        code: `// Quick header checks
if block.timestamp <= parent.timestamp {
    return Err(ConsensusError::InvalidTimestamp)
}
if block.gas_used > block.gas_limit {
    return Err(ConsensusError::GasUsedExceedsLimit)
}`
      },
      {
        id: "pow-check",
        name: "PoW/PoS Check",
        description: "Verify proof-of-work or validator signature",
        timing: "~10ms",
        critical: true
      },
      {
        id: "parent-check",
        name: "Parent Availability",
        description: "Ensure parent block exists in database",
        timing: "~1ms"
      }
    ]
  },
  {
    id: "engine-api",
    name: "Engine API Processing",
    description: "Consensus layer interaction for PoS blocks",
    duration: 2500,
    color: "from-purple-500 to-pink-500",
    icon: Cpu,
    steps: [
      {
        id: "new-payload",
        name: "newPayloadV4",
        description: "Receive execution payload from consensus client",
        timing: "~10ms",
        code: `// Engine API endpoint
async fn new_payload_v4(
    payload: ExecutionPayloadV4,
    versioned_hashes: Vec<B256>,
    parent_beacon_block_root: B256,
    execution_requests: Vec<Bytes>
) -> PayloadStatus`
      },
      {
        id: "decode-payload",
        name: "Decode Payload",
        description: "Parse execution payload into internal block format",
        timing: "~5ms"
      },
      {
        id: "blob-validation",
        name: "Blob Validation",
        description: "Verify KZG commitments for blob transactions (EIP-4844)",
        timing: "~50ms",
        critical: true
      }
    ]
  },
  {
    id: "execution",
    name: "Transaction Execution",
    description: "Execute all transactions in EVM",
    duration: 4000,
    color: "from-orange-500 to-red-500",
    icon: Zap,
    steps: [
      {
        id: "state-load",
        name: "Load State",
        description: "Fetch accounts and storage from database",
        timing: "~10-50ms",
        code: `// Load state for transaction execution
let mut state = State::new(db);
for tx in block.transactions {
    let sender = state.get_account(tx.from)?;
    // Check balance, nonce, etc.
}`
      },
      {
        id: "tx-execution",
        name: "Execute Transactions",
        description: "Run each transaction through REVM",
        timing: "~100-500ms",
        critical: true,
        code: `// Execute transaction in REVM
let mut evm = Evm::new(env, db);
for tx in transactions {
    let result = evm.transact(tx)?;
    receipts.push(result.receipt);
    cumulative_gas += result.gas_used;
}`
      },
      {
        id: "apply-withdrawals",
        name: "Apply Withdrawals",
        description: "Process validator withdrawals (post-Shanghai)",
        timing: "~5ms"
      },
      {
        id: "apply-rewards",
        name: "Apply Block Rewards",
        description: "Credit coinbase with fees and rewards",
        timing: "~1ms"
      }
    ]
  },
  {
    id: "state-root",
    name: "State Root Calculation",
    description: "Compute Merkle Patricia Trie root",
    duration: 3500,
    color: "from-green-500 to-emerald-500",
    icon: GitBranch,
    steps: [
      {
        id: "collect-changes",
        name: "Collect State Changes",
        description: "Gather all account and storage modifications",
        timing: "~10ms",
        code: `// Collect state changes
let changes = ChangeSet {
    accounts: modified_accounts,
    storage: modified_storage,
    bytecodes: new_contracts
};`
      },
      {
        id: "trie-updates",
        name: "Update Trie Nodes",
        description: "Apply changes to Merkle Patricia Trie",
        timing: "~200-800ms",
        critical: true,
        code: `// Parallel trie computation
let mut trie = StateRoot::new(db);
trie.with_parallel_walker(num_threads)
    .with_prefix_sets(prefix_sets)
    .compute()?;`
      },
      {
        id: "hash-computation",
        name: "Compute Root Hash",
        description: "Calculate final state root hash",
        timing: "~50ms"
      },
      {
        id: "root-validation",
        name: "Validate Root",
        description: "Compare computed root with block header",
        timing: "~1ms",
        critical: true
      }
    ]
  },
  {
    id: "persistence",
    name: "Database Persistence",
    description: "Store block and state to disk",
    duration: 2000,
    color: "from-indigo-500 to-purple-500",
    icon: Database,
    steps: [
      {
        id: "prepare-batch",
        name: "Prepare Write Batch",
        description: "Organize data for efficient storage",
        timing: "~5ms",
        code: `// Prepare database writes
let mut batch = WriteBatch::new();
batch.put_block(block);
batch.put_receipts(receipts);
batch.put_state(state_changes);`
      },
      {
        id: "write-state",
        name: "Write State Changes",
        description: "Persist account and storage updates to MDBX",
        timing: "~50-200ms",
        critical: true
      },
      {
        id: "write-block",
        name: "Write Block Data",
        description: "Store block header, body, and receipts",
        timing: "~20ms"
      },
      {
        id: "update-indices",
        name: "Update Indices",
        description: "Update transaction, log, and account indices",
        timing: "~10ms"
      },
      {
        id: "commit-transaction",
        name: "Commit Transaction",
        description: "Atomically commit all changes",
        timing: "~10ms",
        critical: true
      }
    ]
  },
  {
    id: "post-processing",
    name: "Post-Processing",
    description: "Finalization and network updates",
    duration: 1500,
    color: "from-teal-500 to-cyan-500",
    icon: Check,
    steps: [
      {
        id: "update-head",
        name: "Update Chain Head",
        description: "Move canonical head pointer to new block",
        timing: "~1ms",
        code: `// Update canonical head
chain.set_canonical_head(block.hash);
chain.update_finalized(finalized_hash);`
      },
      {
        id: "prune-old-data",
        name: "Prune Old Data",
        description: "Remove ancient blocks and receipts based on pruning config",
        timing: "~100ms"
      },
      {
        id: "notify-subscribers",
        name: "Notify Subscribers",
        description: "Emit events for new block, logs, and state changes",
        timing: "~5ms"
      },
      {
        id: "update-metrics",
        name: "Update Metrics",
        description: "Record performance metrics and statistics",
        timing: "~1ms"
      }
    ]
  },
  {
    id: "fork-choice",
    name: "Fork Choice Update",
    description: "Handle chain reorganizations if needed",
    duration: 2000,
    color: "from-pink-500 to-rose-500",
    icon: GitBranch,
    steps: [
      {
        id: "calculate-td",
        name: "Calculate Total Difficulty",
        description: "Compute cumulative difficulty/weight",
        timing: "~1ms"
      },
      {
        id: "compare-chains",
        name: "Compare with Current Head",
        description: "Determine if new block creates better chain",
        timing: "~5ms",
        code: `// Fork choice rule
if new_chain.total_difficulty > current_chain.total_difficulty {
    perform_reorg(new_chain);
}`
      },
      {
        id: "reorg-detection",
        name: "Detect Reorganization",
        description: "Check if reorg is needed",
        timing: "~5ms",
        critical: true
      },
      {
        id: "revert-blocks",
        name: "Revert Blocks (if reorg)",
        description: "Unwind state to common ancestor",
        timing: "~500ms (if needed)"
      },
      {
        id: "replay-blocks",
        name: "Replay New Chain (if reorg)",
        description: "Apply blocks from new canonical chain",
        timing: "~1000ms (if needed)"
      }
    ]
  }
]

// Performance metrics
interface PerformanceMetric {
  name: string
  value: string
  target: string
  status: "good" | "warning" | "critical"
}

const performanceMetrics: PerformanceMetric[] = [
  { name: "Total Block Time", value: "350ms", target: "<400ms", status: "good" },
  { name: "Execution Time", value: "150ms", target: "<200ms", status: "good" },
  { name: "State Root Time", value: "180ms", target: "<300ms", status: "good" },
  { name: "DB Write Time", value: "20ms", target: "<50ms", status: "good" },
]

export default function BlockLifecyclePage() {
  const [activePhase, setActivePhase] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [showCode, setShowCode] = useState(false)
  const [viewMode, setViewMode] = useState<"timeline" | "flow" | "metrics">("timeline")

  // Animation control
  useEffect(() => {
    if (!isPlaying) return

    const phase = blockPhases[currentPhaseIndex]
    if (!phase) {
      // Animation complete
      setIsPlaying(false)
      return
    }

    setActivePhase(phase.id)
    
    // Animate through steps
    if (currentStepIndex < phase.steps.length) {
      const step = phase.steps[currentStepIndex]
      setActiveStep(step.id)
      
      const stepDuration = phase.duration / phase.steps.length
      const timeout = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1)
      }, stepDuration)
      
      return () => clearTimeout(timeout)
    } else {
      // Move to next phase
      setCurrentStepIndex(0)
      setCurrentPhaseIndex(prev => prev + 1)
    }
  }, [isPlaying, currentPhaseIndex, currentStepIndex])

  const startAnimation = () => {
    resetAnimation()
    setIsPlaying(true)
    setCurrentPhaseIndex(0)
    setCurrentStepIndex(0)
  }

  const resetAnimation = () => {
    setIsPlaying(false)
    setActivePhase(null)
    setActiveStep(null)
    setCurrentPhaseIndex(-1)
    setCurrentStepIndex(-1)
  }

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Block Lifecycle</h1>
            <p className="text-zinc-400 mt-1">Complete journey of a block through Reth</p>
          </div>
        </div>

        {/* Related Sections */}
        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <h3 className="text-blue-400 font-semibold mb-3">Related Deep Dives</h3>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/chapters/engine-api"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-white"
            >
              <Cpu className="w-4 h-4" />
              <span>Engine API Details</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </Link>
            <Link 
              href="/chapters/payload-validation"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-white"
            >
              <Shield className="w-4 h-4" />
              <span>Payload Validation Deep Dive</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </Link>
            <Link 
              href="/chapters/state-root"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-white"
            >
              <GitBranch className="w-4 h-4" />
              <span>State Root Computation</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2 mt-6">
          {["timeline", "flow", "metrics"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as "timeline" | "flow" | "metrics")}
              className={cn(
                "px-4 py-2 rounded-lg transition-all capitalize",
                viewMode === mode
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={isPlaying ? () => setIsPlaying(false) : startAnimation}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? "Pause" : "Start Journey"}
        </button>
        <button
          onClick={resetAnimation}
          className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium flex items-center gap-2 hover:bg-zinc-700 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={() => setShowCode(!showCode)}
          className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-all"
        >
          {showCode ? "Hide" : "Show"} Code
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Timeline View */}
            {blockPhases.map((phase, phaseIndex) => {
              const Icon = phase.icon
              const isActive = activePhase === phase.id
              const isPast = currentPhaseIndex > phaseIndex

              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: phaseIndex * 0.1 }}
                  className={cn(
                    "relative rounded-xl border transition-all duration-500",
                    isActive 
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                      : isPast
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-zinc-800 bg-zinc-900/50"
                  )}
                >
                  {/* Phase Header */}
                  <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center transition-transform duration-500",
                          phase.color,
                          isActive && "scale-110 animate-pulse"
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                          <p className="text-zinc-400 text-sm mt-1">{phase.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-400 text-sm">~{phase.duration}ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Phase Steps */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {phase.steps.map((step, stepIndex) => {
                        const isStepActive = isActive && activeStep === step.id
                        const isStepPast = isPast || (isActive && currentStepIndex > stepIndex)

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: stepIndex * 0.05 }}
                            className={cn(
                              "relative pl-8 pb-4",
                              stepIndex < phase.steps.length - 1 && "border-l-2 border-zinc-800 ml-3"
                            )}
                          >
                            {/* Step Indicator */}
                            <div className={cn(
                              "absolute left-0 w-6 h-6 rounded-full border-2 transition-all duration-500",
                              isStepActive 
                                ? "border-blue-500 bg-blue-500 scale-125"
                                : isStepPast
                                ? "border-green-500 bg-green-500"
                                : "border-zinc-600 bg-zinc-800"
                            )}>
                              {isStepPast && (
                                <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                              )}
                            </div>

                            {/* Step Content */}
                            <div className={cn(
                              "ml-4 p-4 rounded-lg transition-all duration-500",
                              isStepActive
                                ? "bg-blue-500/20 border border-blue-500/50"
                                : "bg-zinc-800/50"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={cn(
                                  "font-semibold transition-colors",
                                  isStepActive ? "text-blue-400" : "text-white"
                                )}>
                                  {step.name}
                                </h4>
                                <div className="flex items-center gap-3">
                                  {step.timing && (
                                    <span className="text-xs text-zinc-500">{step.timing}</span>
                                  )}
                                  {step.critical && (
                                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                                      Critical
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-zinc-400">{step.description}</p>
                              
                              {/* Code Sample */}
                              {showCode && step.code && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3"
                                >
                                  <pre className="p-3 rounded bg-zinc-900 border border-zinc-800 overflow-x-auto">
                                    <code className="text-xs text-zinc-300 font-mono">
                                      {step.code}
                                    </code>
                                  </pre>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {viewMode === "flow" && (
          <motion.div
            key="flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {/* Flow Diagram */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-8">
              <svg className="w-full h-[600px]" viewBox="0 0 1200 600">
                {/* Draw connections between phases */}
                {blockPhases.map((phase, index) => {
                  if (index === blockPhases.length - 1) return null
                  const x1 = 150 + (index % 4) * 280
                  const y1 = 100 + Math.floor(index / 4) * 200
                  const x2 = 150 + ((index + 1) % 4) * 280
                  const y2 = 100 + Math.floor((index + 1) / 4) * 200
                  
                  return (
                    <motion.line
                      key={`${phase.id}-line`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={currentPhaseIndex > index ? "#10b981" : "#3f3f46"}
                      strokeWidth="2"
                      strokeDasharray={currentPhaseIndex === index ? "5,5" : "0"}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                    >
                      {currentPhaseIndex === index && (
                        <animate
                          attributeName="stroke-dashoffset"
                          values="10;0"
                          dur="0.5s"
                          repeatCount="indefinite"
                        />
                      )}
                    </motion.line>
                  )
                })}

                {/* Draw phase nodes */}
                {blockPhases.map((phase, index) => {
                  const Icon = phase.icon
                  const x = 150 + (index % 4) * 280
                  const y = 100 + Math.floor(index / 4) * 200
                  const isActive = activePhase === phase.id
                  const isPast = currentPhaseIndex > index

                  return (
                    <motion.g
                      key={phase.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {/* Node background */}
                      <rect
                        x={x - 120}
                        y={y - 60}
                        width="240"
                        height="120"
                        rx="12"
                        fill={isActive ? "url(#active-gradient)" : isPast ? "url(#past-gradient)" : "#18181b"}
                        stroke={isActive ? "#3b82f6" : isPast ? "#10b981" : "#3f3f46"}
                        strokeWidth="2"
                        className={cn(
                          "transition-all duration-500",
                          isActive && "filter drop-shadow-lg"
                        )}
                      />
                      
                      {/* Icon */}
                      <foreignObject x={x - 100} y={y - 40} width="40" height="40">
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                          phase.color
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </foreignObject>

                      {/* Text */}
                      <text x={x - 45} y={y - 15} fill="white" fontSize="14" fontWeight="600">
                        {phase.name}
                      </text>
                      <text x={x - 45} y={y + 5} fill="#a1a1aa" fontSize="12">
                        {phase.steps.length} steps
                      </text>
                      <text x={x - 45} y={y + 25} fill="#71717a" fontSize="11">
                        ~{phase.duration}ms
                      </text>
                    </motion.g>
                  )
                })}

                {/* Gradients */}
                <defs>
                  <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="past-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        )}

        {viewMode === "metrics" && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Performance Metrics */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Targets</h3>
              <div className="space-y-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{metric.name}</p>
                      <p className="text-zinc-500 text-sm">Target: {metric.target}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-lg font-mono",
                        metric.status === "good" ? "text-green-400" :
                        metric.status === "warning" ? "text-yellow-400" :
                        "text-red-400"
                      )}>
                        {metric.value}
                      </span>
                      {metric.status === "good" && <Check className="w-4 h-4 text-green-400" />}
                      {metric.status === "warning" && <AlertCircle className="w-4 h-4 text-yellow-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Path */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Critical Path</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Transaction Execution</p>
                    <p className="text-zinc-500 text-xs">~150ms (parallel possible)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">State Root Calculation</p>
                    <p className="text-zinc-500 text-xs">~180ms (main bottleneck)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Database Writes</p>
                    <p className="text-zinc-500 text-xs">~20ms (batched)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Optimization Opportunities */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Optimization Strategies</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-blue-400 font-medium mb-2">Parallel Execution</h4>
                  <p className="text-zinc-400 text-sm">
                    Execute independent transactions concurrently using REVM&apos;s parallel mode
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-green-400 font-medium mb-2">Incremental State Root</h4>
                  <p className="text-zinc-400 text-sm">
                    Calculate state root incrementally during execution instead of after
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-purple-400 font-medium mb-2">Static File Storage</h4>
                  <p className="text-zinc-400 text-sm">
                    Use memory-mapped files for historical data to reduce I/O overhead
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <p className="text-zinc-400 text-sm mb-1">Total Phases</p>
          <p className="text-2xl font-bold text-white">{blockPhases.length}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <p className="text-zinc-400 text-sm mb-1">Total Steps</p>
          <p className="text-2xl font-bold text-white">
            {blockPhases.reduce((sum, phase) => sum + phase.steps.length, 0)}
          </p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <p className="text-zinc-400 text-sm mb-1">Critical Steps</p>
          <p className="text-2xl font-bold text-red-400">
            {blockPhases.reduce((sum, phase) => 
              sum + phase.steps.filter(s => s.critical).length, 0
            )}
          </p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <p className="text-zinc-400 text-sm mb-1">Avg Block Time</p>
          <p className="text-2xl font-bold text-green-400">~350ms</p>
        </div>
      </motion.div>
    </PageContainer>
  )
}