"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Cpu, Zap, Package, Clock,
  Play, Pause, RotateCcw, Database,
  Binary,
  Shield,
  TreePine, FlameIcon, type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import PageContainer from "@/components/ui/PageContainer"

// Tree node for canonical chain candidates
interface ChainCandidate {
  id: string
  blockNumber: number
  hash: string
  parentHash: string
  isCanonical: boolean
  payloads: PayloadNode[]
  x?: number
  y?: number
}

interface PayloadNode {
  id: string
  hash: string
  status: "pending" | "prewarming" | "executing" | "complete"
  transactions: number
}

// Prewarming stages
interface PrewarmingStage {
  id: string
  name: string
  description: string
  icon: LucideIcon
  timing: string
  parallel: boolean
  code?: string
}

const prewarmingStages: PrewarmingStage[] = [
  {
    id: "extract",
    name: "Transaction Extraction",
    description: "Extract all transactions from payload and create iterator",
    icon: Package,
    timing: "~1ms",
    parallel: false,
    code: `// Create transaction iterator from payload
impl PayloadTransactions {
    pub fn new(payload: ExecutionPayload) -> Self {
        let transactions = payload.transactions
            .into_iter()
            .map(|raw| TransactionItem::Raw(raw))
            .collect();
        
        Self {
            transactions,
            recovered: Vec::new(),
            cursor: 0,
        }
    }
}`
  },
  {
    id: "decode",
    name: "Lazy Decoding",
    description: "Decode transaction RLP only when needed",
    icon: Binary,
    timing: "~0.5ms/tx",
    parallel: true,
    code: `// Lazy decoding - only decode when iterator advances
impl Iterator for PayloadTransactions {
    fn next(&mut self) -> Option<TransactionSigned> {
        match self.transactions.get(self.cursor)? {
            TransactionItem::Raw(bytes) => {
                // Decode on-demand
                let tx = TransactionSigned::decode(&mut bytes.as_ref())?;
                self.cursor += 1;
                Some(tx)
            }
            TransactionItem::Decoded(tx) => {
                self.cursor += 1;
                Some(tx.clone())
            }
        }
    }
}`
  },
  {
    id: "recover",
    name: "Sender Recovery",
    description: "Recover sender addresses using ECDSA signature verification",
    icon: Shield,
    timing: "~3ms/tx",
    parallel: true,
    code: `// Parallel sender recovery
pub fn recover_senders_parallel(
    transactions: Vec<TransactionSigned>,
    num_threads: usize,
) -> Vec<TransactionSignedEcRecovered> {
    transactions
        .par_chunks(transactions.len() / num_threads)
        .flat_map(|chunk| {
            chunk.iter().map(|tx| {
                let signer = tx.recover_signer()?;
                Ok(TransactionSignedEcRecovered {
                    signed_transaction: tx.clone(),
                    signer,
                })
            })
        })
        .collect()
}`
  },
  {
    id: "prewarm-state",
    name: "State Cache Prewarming",
    description: "Execute transactions in parallel to warm state caches",
    icon: FlameIcon,
    timing: "~50ms total",
    parallel: true,
    code: `// Parallel prewarming execution
pub fn prewarm_state(
    transactions: Vec<TransactionSignedEcRecovered>,
    state: Arc<CachedStateProvider>,
) {
    // Split transactions across worker threads
    let (tx, rx) = channel::bounded(64);
    
    // Spawn prewarming workers
    for _ in 0..num_cpus::get() {
        let worker_state = state.clone();
        let worker_rx = rx.clone();
        
        thread::spawn(move || {
            while let Ok(tx) = worker_rx.recv() {
                // Execute with nonce checking disabled
                let mut evm = Evm::new_with_state(worker_state.clone());
                evm.disable_nonce_check();
                
                // Execute transaction to warm caches
                let result = evm.transact(tx);
                
                // Cache results
                worker_state.cache_execution_result(result);
            }
        });
    }
    
    // Feed transactions to workers
    for tx in transactions {
        tx.send(tx).unwrap();
    }
}`
  },
  {
    id: "multiproof",
    name: "Multiproof Prefetching",
    description: "Extract and prefetch state proof targets",
    icon: TreePine,
    timing: "~20ms",
    parallel: true,
    code: `// Extract multiproof targets for parallel state root
pub fn extract_multiproof_targets(
    execution_results: Vec<ExecutionResult>,
) -> MultiProofTargets {
    let mut targets = MultiProofTargets::default();
    
    for result in execution_results {
        // Collect accessed accounts
        for account in result.accessed_accounts {
            targets.accounts.insert(account);
        }
        
        // Collect accessed storage slots
        for (account, slots) in result.accessed_storage {
            targets.storage
                .entry(account)
                .or_default()
                .extend(slots);
        }
    }
    
    targets
}`
  }
]

// Cache distribution
const cacheDistribution = [
  { name: "Storage Cache", percentage: 88.88, color: "from-blue-500 to-cyan-500", size: "~800MB" },
  { name: "Account Cache", percentage: 5.56, color: "from-green-500 to-emerald-500", size: "~50MB" },
  { name: "Bytecode Cache", percentage: 5.56, color: "from-purple-500 to-pink-500", size: "~50MB" },
]

// Performance comparison
const performanceComparison = [
  {
    metric: "Transaction Decoding",
    sequential: "150ms",
    withPrewarming: "0ms",
    improvement: "100%",
    note: "Completely off hot path"
  },
  {
    metric: "Sender Recovery",
    sequential: "300ms",
    withPrewarming: "0ms",
    improvement: "100%",
    note: "Parallel in background"
  },
  {
    metric: "State Loading",
    sequential: "200ms",
    withPrewarming: "50ms",
    improvement: "75%",
    note: "Cache hits instead of DB"
  },
  {
    metric: "Total Execution",
    sequential: "850ms",
    withPrewarming: "350ms",
    improvement: "59%",
    note: "Overall speedup"
  },
]

// Timeline visualization data
interface TimelineEvent {
  id: string
  name: string
  startTime: number
  duration: number
  lane: "decode" | "recover" | "prewarm" | "execute"
  color: string
}

const sequentialTimeline: TimelineEvent[] = [
  { id: "s1", name: "Decode All", startTime: 0, duration: 150, lane: "decode", color: "#ef4444" },
  { id: "s2", name: "Recover All", startTime: 150, duration: 300, lane: "recover", color: "#f59e0b" },
  { id: "s3", name: "Execute Sequentially", startTime: 450, duration: 400, lane: "execute", color: "#3b82f6" },
]

const parallelTimeline: TimelineEvent[] = [
  // Lazy decoding (happens as needed)
  { id: "p1", name: "Lazy Decode", startTime: 0, duration: 50, lane: "decode", color: "#10b981" },
  { id: "p2", name: "Lazy Decode", startTime: 100, duration: 50, lane: "decode", color: "#10b981" },
  { id: "p3", name: "Lazy Decode", startTime: 200, duration: 50, lane: "decode", color: "#10b981" },
  
  // Parallel recovery
  { id: "r1", name: "Recover Batch 1", startTime: 10, duration: 100, lane: "recover", color: "#06b6d4" },
  { id: "r2", name: "Recover Batch 2", startTime: 10, duration: 100, lane: "recover", color: "#06b6d4" },
  
  // Prewarming
  { id: "w1", name: "Prewarm State", startTime: 20, duration: 200, lane: "prewarm", color: "#8b5cf6" },
  
  // Sequential execution (starts early, uses warm caches)
  { id: "e1", name: "Execute with Warm Cache", startTime: 50, duration: 300, lane: "execute", color: "#22c55e" },
]

export default function EngineTreePrewarmingPage() {
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<"overview" | "stages" | "timeline" | "performance">("overview")
  const [showCode, setShowCode] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [animationStep, setAnimationStep] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)

  // Sample tree structure
  const chainCandidates: ChainCandidate[] = [
    {
      id: "canonical",
      blockNumber: 1000,
      hash: "0xabc...",
      parentHash: "0x000...",
      isCanonical: true,
      payloads: [
        { id: "p1", hash: "0x111...", status: "complete", transactions: 150 },
        { id: "p2", hash: "0x222...", status: "executing", transactions: 200 },
      ],
      x: 400,
      y: 100
    },
    {
      id: "fork1",
      blockNumber: 1001,
      hash: "0xdef...",
      parentHash: "0xabc...",
      isCanonical: false,
      payloads: [
        { id: "p3", hash: "0x333...", status: "prewarming", transactions: 180 },
      ],
      x: 250,
      y: 250
    },
    {
      id: "fork2",
      blockNumber: 1001,
      hash: "0xghi...",
      parentHash: "0xabc...",
      isCanonical: false,
      payloads: [
        { id: "p4", hash: "0x444...", status: "pending", transactions: 160 },
      ],
      x: 550,
      y: 250
    },
  ]

  // Animation control
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setAnimationStep(prev => {
        if (prev >= prewarmingStages.length - 1) {
          setIsPlaying(false)
          return 0
        }
        return prev + 1
      })
      setActiveStage(prewarmingStages[animationStep]?.id || null)
    }, 2000)

    return () => clearInterval(interval)
  }, [isPlaying, animationStep])

  const startAnimation = () => {
    setAnimationStep(0)
    setIsPlaying(true)
    setActiveStage(prewarmingStages[0].id)
  }

  const resetAnimation = () => {
    setIsPlaying(false)
    setAnimationStep(0)
    setActiveStage(null)
  }

  const getPayloadStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "#10b981"
      case "executing": return "#3b82f6"
      case "prewarming": return "#f59e0b"
      case "pending": return "#6b7280"
      default: return "#6b7280"
    }
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <FlameIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Engine API Tree Handler & Prewarming</h1>
            <p className="text-zinc-400 mt-1">Advanced parallel execution and cache warming strategies</p>
          </div>
        </div>

        {/* Key Insight */}
        <div className="mt-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <h3 className="text-orange-400 font-semibold mb-1">Performance Critical Innovation</h3>
              <p className="text-zinc-300 text-sm">
                The EngineAPITreeHandler maintains a tree of potential canonical chain candidates while 
                using sophisticated prewarming to move all expensive operations (decoding, recovery, state loading) 
                off the hot execution path. This enables Reth to begin execution as soon as the first transaction 
                is ready, achieving up to 60% performance improvement.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2 mt-6">
          {["overview", "stages", "timeline", "performance"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as typeof viewMode)}
              className={cn(
                "px-4 py-2 rounded-lg transition-all capitalize",
                viewMode === mode
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Controls */}
      {viewMode !== "performance" && (
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={isPlaying ? () => setIsPlaying(false) : startAnimation}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Start Prewarming"}
          </button>
          <button
            onClick={resetAnimation}
            className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium flex items-center gap-2 hover:bg-zinc-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          {viewMode === "stages" && (
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-all"
            >
              {showCode ? "Hide" : "Show"} Code
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Chain Candidate Tree */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Chain Candidate Tree</h3>
              <div className="relative">
                <svg
                  ref={svgRef}
                  className="w-full h-[400px]"
                  viewBox="0 0 800 400"
                >
                  {/* Draw connections */}
                  {chainCandidates.map(candidate => {
                    const parent = chainCandidates.find(c => c.hash === candidate.parentHash)
                    if (!parent) return null
                    
                    return (
                      <motion.line
                        key={`${parent.id}-${candidate.id}`}
                        x1={parent.x}
                        y1={(parent.y || 0) + 40}
                        x2={candidate.x}
                        y2={(candidate.y || 0) - 40}
                        stroke={candidate.isCanonical ? "#10b981" : "#3f3f46"}
                        strokeWidth={candidate.isCanonical ? "3" : "2"}
                        strokeDasharray={candidate.isCanonical ? "0" : "5,5"}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                    )
                  })}

                  {/* Draw nodes */}
                  {chainCandidates.map((candidate) => (
                    <motion.g
                      key={candidate.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      onClick={() => setSelectedCandidate(candidate.id)}
                      className="cursor-pointer"
                    >
                      {/* Node background */}
                      <rect
                        x={(candidate.x || 0) - 80}
                        y={(candidate.y || 0) - 40}
                        width="160"
                        height="80"
                        rx="8"
                        fill={candidate.isCanonical ? "#064e3b" : "#18181b"}
                        stroke={
                          selectedCandidate === candidate.id 
                            ? "#f59e0b"
                            : candidate.isCanonical 
                            ? "#10b981" 
                            : "#3f3f46"
                        }
                        strokeWidth={selectedCandidate === candidate.id ? "3" : "2"}
                      />
                      
                      {/* Block info */}
                      <text
                        x={candidate.x}
                        y={(candidate.y || 0) - 15}
                        textAnchor="middle"
                        fill="white"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        Block #{candidate.blockNumber}
                      </text>
                      <text
                        x={candidate.x}
                        y={candidate.y}
                        textAnchor="middle"
                        fill="#a1a1aa"
                        fontSize="10"
                      >
                        {candidate.hash}
                      </text>
                      
                      {/* Canonical indicator */}
                      {candidate.isCanonical && (
                        <text
                          x={candidate.x}
                          y={(candidate.y || 0) + 15}
                          textAnchor="middle"
                          fill="#10b981"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          CANONICAL
                        </text>
                      )}
                      
                      {/* Payload indicators */}
                      <g transform={`translate(${(candidate.x || 0) - 70}, ${(candidate.y || 0) + 25})`}>
                        {candidate.payloads.map((payload, idx) => (
                          <circle
                            key={payload.id}
                            cx={idx * 25}
                            cy={0}
                            r="8"
                            fill={getPayloadStatusColor(payload.status)}
                            opacity="0.8"
                          />
                        ))}
                      </g>
                    </motion.g>
                  ))}

                  {/* Legend */}
                  <g transform="translate(20, 20)">
                    <rect x="0" y="0" width="160" height="120" fill="#18181b" stroke="#3f3f46" rx="5" />
                    <text x="10" y="20" fill="white" fontSize="12" fontWeight="bold">Payload Status:</text>
                    <circle cx="20" cy="35" r="5" fill="#10b981" />
                    <text x="30" y="39" fill="#a1a1aa" fontSize="10">Complete</text>
                    <circle cx="20" cy="50" r="5" fill="#3b82f6" />
                    <text x="30" y="54" fill="#a1a1aa" fontSize="10">Executing</text>
                    <circle cx="20" cy="65" r="5" fill="#f59e0b" />
                    <text x="30" y="69" fill="#a1a1aa" fontSize="10">Prewarming</text>
                    <circle cx="20" cy="80" r="5" fill="#6b7280" />
                    <text x="30" y="84" fill="#a1a1aa" fontSize="10">Pending</text>
                    <text x="10" y="105" fill="#10b981" fontSize="10" fontWeight="bold">Green = Canonical</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Prewarming Benefits */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Prewarming Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-400" />
                    <h4 className="text-green-400 font-medium">Early Execution Start</h4>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Begin executing as soon as first transaction is ready, not after all are decoded
                  </p>
                  <div className="mt-2 p-2 rounded bg-zinc-900/50 border border-zinc-800">
                    <p className="text-green-400 text-xs font-mono">Start: ~50ms vs 450ms</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    <h4 className="text-blue-400 font-medium">Parallel Processing</h4>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Decode, recover, and warm caches using all available CPU cores
                  </p>
                  <div className="mt-2 p-2 rounded bg-zinc-900/50 border border-zinc-800">
                    <p className="text-blue-400 text-xs font-mono">Cores: Up to 64 workers</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-purple-400" />
                    <h4 className="text-purple-400 font-medium">Cache Hit Rate</h4>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    State already in memory when sequential execution needs it
                  </p>
                  <div className="mt-2 p-2 rounded bg-zinc-900/50 border border-zinc-800">
                    <p className="text-purple-400 text-xs font-mono">Hit Rate: 85%+ typical</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cache Distribution */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Cache Distribution Strategy</h3>
              <div className="space-y-3">
                {cacheDistribution.map((cache) => (
                  <div key={cache.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{cache.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-sm">{cache.size}</span>
                        <span className="text-zinc-500 text-sm">({cache.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cache.percentage}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={cn("h-full bg-gradient-to-r", cache.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-zinc-800/50">
                <p className="text-zinc-400 text-sm">
                  <span className="text-zinc-300 font-medium">Storage cache dominates</span> because 
                  contract storage access is the most frequent and expensive operation. Account and 
                  bytecode caches are smaller but still critical for performance.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "stages" && (
          <motion.div
            key="stages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Prewarming Stages */}
            {prewarmingStages.map((stage, index) => {
              const isActive = activeStage === stage.id
              const isPast = animationStep > index

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative rounded-xl border transition-all duration-500",
                    isActive 
                      ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                      : isPast
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-zinc-800 bg-zinc-900/50"
                  )}
                >
                  <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <stage.icon className={cn(
                          "w-6 h-6",
                          isActive ? "text-orange-400" : "text-zinc-400"
                        )} />
                        <div>
                          <h3 className="text-xl font-bold text-white">{stage.name}</h3>
                          <p className="text-zinc-400 text-sm mt-1">{stage.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-xs">Timing</p>
                        <p className="text-zinc-300 font-mono">{stage.timing}</p>
                        {stage.parallel && (
                          <div className="flex items-center gap-1 mt-1">
                            <Cpu className="w-3 h-3 text-green-400" />
                            <span className="text-green-400 text-xs">Parallel</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {showCode && stage.code && (
                    <div className="p-6">
                      <pre className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 overflow-x-auto">
                        <code className="text-xs text-zinc-300 font-mono">
                          {stage.code}
                        </code>
                      </pre>
                    </div>
                  )}
                </motion.div>
              )
            })}

            {/* Key Concepts */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Key Concepts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-yellow-400 font-medium mb-2">Lazy Execution</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    Transactions are decoded and processed only when needed, not all upfront.
                  </p>
                  <ul className="space-y-1 text-xs text-zinc-500">
                    <li>• Reduces initial latency</li>
                    <li>• Spreads CPU load over time</li>
                    <li>• Enables early execution start</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-cyan-400 font-medium mb-2">Parallel Recovery</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    ECDSA signature verification happens across multiple threads.
                  </p>
                  <ul className="space-y-1 text-xs text-zinc-500">
                    <li>• 64+ concurrent workers</li>
                    <li>• Batch processing for efficiency</li>
                    <li>• Results cached for reuse</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-green-400 font-medium mb-2">State Prewarming</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    Execute with nonce checking disabled to populate caches.
                  </p>
                  <ul className="space-y-1 text-xs text-zinc-500">
                    <li>• Isolated state views</li>
                    <li>• No side effects</li>
                    <li>• Pure cache warming</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-purple-400 font-medium mb-2">Hot Path Optimization</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    Sequential execution path has zero preparation overhead.
                  </p>
                  <ul className="space-y-1 text-xs text-zinc-500">
                    <li>• Everything pre-decoded</li>
                    <li>• Senders already recovered</li>
                    <li>• State already cached</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Sequential vs Parallel Timeline */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Execution Timeline Comparison</h3>
              
              {/* Sequential Timeline */}
              <div className="mb-8">
                <h4 className="text-red-400 font-medium mb-3">Sequential Execution (Traditional)</h4>
                <div className="relative h-32 bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                  <svg className="w-full h-full" viewBox="0 0 900 100">
                    {sequentialTimeline.map((event) => {
                      const laneY = {
                        decode: 20,
                        recover: 40,
                        prewarm: 60,
                        execute: 80
                      }[event.lane]

                      return (
                        <motion.g key={event.id}>
                          <motion.rect
                            x={event.startTime}
                            y={laneY - 8}
                            width={event.duration}
                            height="16"
                            rx="4"
                            fill={event.color}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5, delay: event.startTime / 1000 }}
                            style={{ transformOrigin: "left center" }}
                          />
                          <text
                            x={event.startTime + event.duration / 2}
                            y={laneY + 1}
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {event.name}
                          </text>
                        </motion.g>
                      )
                    })}
                    
                    {/* Time markers */}
                    {[0, 200, 400, 600, 800].map((time) => (
                      <g key={time}>
                        <line x1={time} y1="0" x2={time} y2="100" stroke="#3f3f46" strokeWidth="1" />
                        <text x={time} y="10" fill="#71717a" fontSize="9" textAnchor="middle">
                          {time}ms
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm mt-2">
                  Total time: <span className="text-red-400 font-mono">850ms</span> - 
                  Everything happens sequentially, blocking execution
                </p>
              </div>

              {/* Parallel Timeline */}
              <div>
                <h4 className="text-green-400 font-medium mb-3">Parallel Execution with Prewarming</h4>
                <div className="relative h-32 bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                  <svg className="w-full h-full" viewBox="0 0 900 100">
                    {parallelTimeline.map((event) => {
                      const laneY = {
                        decode: 20,
                        recover: 40,
                        prewarm: 60,
                        execute: 80
                      }[event.lane]

                      return (
                        <motion.g key={event.id}>
                          <motion.rect
                            x={event.startTime}
                            y={laneY - 8}
                            width={event.duration}
                            height="16"
                            rx="4"
                            fill={event.color}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5, delay: event.startTime / 1000 }}
                            style={{ transformOrigin: "left center" }}
                          />
                          <text
                            x={event.startTime + event.duration / 2}
                            y={laneY + 1}
                            textAnchor="middle"
                            fill="white"
                            fontSize="9"
                            fontWeight="500"
                          >
                            {event.name}
                          </text>
                        </motion.g>
                      )
                    })}
                    
                    {/* Time markers */}
                    {[0, 200, 400, 600, 800].map((time) => (
                      <g key={time}>
                        <line x1={time} y1="0" x2={time} y2="100" stroke="#3f3f46" strokeWidth="1" />
                        <text x={time} y="10" fill="#71717a" fontSize="9" textAnchor="middle">
                          {time}ms
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm mt-2">
                  Total time: <span className="text-green-400 font-mono">350ms</span> - 
                  Parallel processing and early start cut execution time by 59%
                </p>
              </div>

              {/* Lane Labels */}
              <div className="mt-4 flex justify-around text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-zinc-700" />
                  <span className="text-zinc-400">Decode Lane</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-zinc-700" />
                  <span className="text-zinc-400">Recovery Lane</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-zinc-700" />
                  <span className="text-zinc-400">Prewarm Lane</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-zinc-700" />
                  <span className="text-zinc-400">Execute Lane</span>
                </div>
              </div>
            </div>

            {/* Critical Path Analysis */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Critical Path Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">Decoding & Recovery</p>
                    <p className="text-zinc-500 text-xs">Completely removed from critical path</p>
                  </div>
                  <span className="text-green-400 font-mono text-sm">-450ms</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">↓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">State Loading</p>
                    <p className="text-zinc-500 text-xs">Reduced by 75% through cache hits</p>
                  </div>
                  <span className="text-blue-400 font-mono text-sm">-150ms</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold text-sm">→</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">Sequential Execution</p>
                    <p className="text-zinc-500 text-xs">Now the only item on critical path</p>
                  </div>
                  <span className="text-yellow-400 font-mono text-sm">300ms</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "performance" && (
          <motion.div
            key="performance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Performance Comparison Table */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Impact</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-2 text-zinc-400 text-sm">Metric</th>
                      <th className="text-center py-2 text-zinc-400 text-sm">Sequential</th>
                      <th className="text-center py-2 text-zinc-400 text-sm">With Prewarming</th>
                      <th className="text-center py-2 text-zinc-400 text-sm">Improvement</th>
                      <th className="text-left py-2 text-zinc-400 text-sm">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceComparison.map((metric, index) => (
                      <tr key={index} className="border-b border-zinc-800">
                        <td className="py-3 text-white">{metric.metric}</td>
                        <td className="py-3 text-center text-red-400 font-mono">{metric.sequential}</td>
                        <td className="py-3 text-center text-green-400 font-mono">{metric.withPrewarming}</td>
                        <td className="py-3 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-semibold",
                            metric.improvement === "100%"
                              ? "bg-green-500/20 text-green-400"
                              : parseInt(metric.improvement) >= 70
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {metric.improvement}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-500 text-sm">{metric.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scalability Analysis */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Scalability Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-zinc-300 font-medium mb-3">Transaction Count Scaling</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
                      <span className="text-zinc-400 text-sm">100 txs</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-mono text-sm">300ms</span>
                        <span className="text-zinc-500">→</span>
                        <span className="text-green-400 font-mono text-sm">150ms</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
                      <span className="text-zinc-400 text-sm">500 txs</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-mono text-sm">1500ms</span>
                        <span className="text-zinc-500">→</span>
                        <span className="text-green-400 font-mono text-sm">600ms</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
                      <span className="text-zinc-400 text-sm">1000 txs</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-mono text-sm">3000ms</span>
                        <span className="text-zinc-500">→</span>
                        <span className="text-green-400 font-mono text-sm">1100ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-zinc-300 font-medium mb-3">CPU Core Utilization</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
                      <span className="text-zinc-400 text-sm">Sequential</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full w-1/4 bg-red-400" />
                        </div>
                        <span className="text-red-400 font-mono text-xs">25%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-zinc-800/50">
                      <span className="text-zinc-400 text-sm">With Prewarming</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full w-11/12 bg-green-400" />
                        </div>
                        <span className="text-green-400 font-mono text-xs">92%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Memory Investment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-amber-400 font-medium mb-2">Cache Memory</h4>
                  <p className="text-2xl font-bold text-white mb-1">~900MB</p>
                  <p className="text-zinc-500 text-xs">Configurable via cross_block_cache_size</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-cyan-400 font-medium mb-2">Worker Threads</h4>
                  <p className="text-2xl font-bold text-white mb-1">64</p>
                  <p className="text-zinc-500 text-xs">Default parallel workers</p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-green-400 font-medium mb-2">ROI</h4>
                  <p className="text-2xl font-bold text-white mb-1">59%</p>
                  <p className="text-zinc-500 text-xs">Average speedup achieved</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}