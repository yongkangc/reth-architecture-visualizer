"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Cpu, Zap, Package, Server, Activity,
  Play, Pause, RotateCcw, ChevronRight,
  Binary, Code, FileCode, GitBranch,
  Shield, CheckCircle, Gauge, AlertCircle,
  TreePine, FlameIcon, Hash,
  Timer, type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import PageContainer from "@/components/ui/PageContainer"
import Link from "next/link"

// Transaction execution phases
interface ExecutionPhase {
  id: string
  name: string
  description: string
  icon: LucideIcon
  duration: number // in ms
  color: string
  parallel: boolean
  code?: string
  githubLink?: string
}

// Prewarming worker state
interface Worker {
  id: number
  status: "idle" | "decoding" | "recovering" | "executing" | "caching"
  currentTx?: number
  progress: number
}

// Transaction state during prewarming
interface Transaction {
  id: number
  hash: string
  status: "pending" | "decoding" | "recovering" | "executing" | "cached" | "complete"
  worker?: number
  gasUsed?: number
  stateChanges?: number
}

// Cache entry types
// interface CacheEntry {
//   key: string
//   type: "account" | "storage" | "bytecode"
//   size: number
//   hits: number
//   lastAccess: number
// }

const executionPhases: ExecutionPhase[] = [
  {
    id: "receive",
    name: "Payload Reception",
    description: "Receive execution payload from consensus layer via Engine API",
    icon: Package,
    duration: 5,
    color: "from-blue-500 to-cyan-500",
    parallel: false,
    code: `// Engine API: newPayload handler
async fn handle_new_payload(
    &mut self,
    payload: ExecutionPayloadV3,
) -> PayloadStatus {
    // Extract block hash and validate structure
    let block_hash = payload.block_hash();
    let block_number = payload.block_number();
    
    // Create payload transaction iterator
    let tx_iterator = PayloadTransactions::new(
        payload.transactions.clone()
    );
    
    // Spawn prewarming task immediately
    self.spawn_prewarm_task(tx_iterator);
}`,
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_validator.rs#L219-L229"
  },
  {
    id: "decode",
    name: "Lazy Transaction Decoding",
    description: "Decode RLP-encoded transactions on-demand as iterator advances",
    icon: Binary,
    duration: 50,
    color: "from-purple-500 to-pink-500",
    parallel: true,
    code: `// Lazy decoding iterator implementation
impl Iterator for PayloadTransactions {
    type Item = TransactionSignedEcRecovered;
    
    fn next(&mut self) -> Option<Self::Item> {
        let raw_tx = self.raw_transactions.get(self.cursor)?;
        
        // Only decode when actually needed
        let decoded = match &self.decoded_cache[self.cursor] {
            Some(tx) => tx.clone(),
            None => {
                // Decode RLP bytes to transaction
                let tx = TransactionSigned::decode(&mut raw_tx.as_ref())?;
                self.decoded_cache[self.cursor] = Some(tx.clone());
                tx
            }
        };
        
        self.cursor += 1;
        Some(decoded)
    }
}`,
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_processor/mod.rs#L150-L164"
  },
  {
    id: "recover",
    name: "Parallel Sender Recovery",
    description: "Recover sender addresses using ECDSA signature verification across 64 workers",
    icon: Shield,
    duration: 100,
    color: "from-green-500 to-emerald-500",
    parallel: true,
    code: `// Parallel sender recovery with worker pool
pub fn recover_senders_parallel(
    transactions: Vec<TransactionSigned>,
    num_workers: usize,
) -> Vec<TransactionSignedEcRecovered> {
    let chunk_size = transactions.len() / num_workers;
    let (tx, rx) = mpsc::channel();
    
    // Spawn worker threads
    for chunk in transactions.chunks(chunk_size) {
        let worker_tx = tx.clone();
        let chunk = chunk.to_vec();
        
        thread::spawn(move || {
            for tx in chunk {
                // ECDSA recovery using secp256k1
                let signer = tx.recover_signer_unchecked();
                worker_tx.send(TransactionSignedEcRecovered {
                    signed_transaction: tx,
                    signer,
                }).unwrap();
            }
        });
    }
    
    // Collect results
    rx.into_iter().take(transactions.len()).collect()
}`,
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_processor/prewarm.rs#L90-L123"
  },
  {
    id: "prewarm",
    name: "State Cache Prewarming",
    description: "Execute transactions out-of-order to warm state caches without nonce checking",
    icon: FlameIcon,
    duration: 200,
    color: "from-orange-500 to-red-500",
    parallel: true,
    code: `// Prewarming execution with cache population
fn transact_batch(
    &self,
    transactions: Receiver<TransactionSignedEcRecovered>,
    actions_tx: Sender<PrewarmTaskEvent>,
) {
    // Create isolated EVM instance for prewarming
    let mut evm = Evm::new_with_state(self.state_provider.clone());
    
    // Disable nonce checking for out-of-order execution
    evm.disable_balance_check();
    evm.disable_nonce_check();
    
    while let Ok(tx) = transactions.recv() {
        // Execute transaction to populate caches
        let result = evm.transact(tx);
        
        // Cache the accessed state
        for (address, account) in result.state.accounts {
            self.cache.insert_account(address, account);
        }
        
        // Cache accessed storage slots
        for (address, storage) in result.state.storage {
            for (slot, value) in storage {
                self.cache.insert_storage(address, slot, value);
            }
        }
        
        // Cache accessed bytecode
        for (address, bytecode) in result.state.bytecodes {
            self.cache.insert_bytecode(address, bytecode);
        }
    }
}`,
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_processor/prewarm.rs#L103-L105"
  },
  {
    id: "multiproof",
    name: "Multiproof Target Extraction",
    description: "Extract state proof targets for parallel state root computation",
    icon: TreePine,
    duration: 30,
    color: "from-teal-500 to-cyan-500",
    parallel: true,
    code: `// Extract multiproof targets from execution results
pub fn extract_multiproof_targets(
    execution_results: &[ExecutionResult],
) -> MultiProofTargets {
    let mut targets = MultiProofTargets::default();
    
    for result in execution_results {
        // Collect all accessed accounts
        for account in &result.accessed_accounts {
            targets.accounts.insert(*account);
        }
        
        // Collect all accessed storage slots
        for (account, slots) in &result.accessed_storage {
            targets.storage
                .entry(*account)
                .or_default()
                .extend(slots);
        }
        
        // Mark nodes that need proof generation
        for node in &result.modified_nodes {
            targets.proof_nodes.insert(node.hash);
        }
    }
    
    // Send to parallel state root workers
    self.send_multiproof_targets(targets);
}`,
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_processor/prewarm.rs#L126-L130"
  },
  {
    id: "execute",
    name: "Sequential Execution",
    description: "Execute transactions in order with warm caches for final state",
    icon: Activity,
    duration: 300,
    color: "from-blue-600 to-indigo-600",
    parallel: false,
    code: `// Sequential execution with prewarmed caches
pub fn execute_block_with_cache(
    &mut self,
    block: &Block,
    cached_state: CachedStateProvider,
) -> ExecutionOutcome {
    let mut cumulative_gas = 0;
    let mut receipts = Vec::new();
    
    // Create EVM with cached state provider
    let mut evm = self.evm_config.evm_with_env(
        cached_state,  // Uses prewarmed caches!
        self.env.clone(),
    );
    
    for tx in &block.transactions {
        // Cache hit rate typically 85%+ due to prewarming
        let result = evm.transact_commit(tx)?;
        
        cumulative_gas += result.gas_used();
        receipts.push(Receipt {
            cumulative_gas_used: cumulative_gas,
            logs: result.logs(),
            success: result.is_success(),
        });
    }
    
    ExecutionOutcome { receipts, state: evm.state }
}`,
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_processor/mod.rs#L200-L250"
  }
]

// Performance metrics
const performanceMetrics = {
  withoutPrewarming: {
    decode: 150,
    recover: 300,
    stateLoad: 200,
    execute: 200,
    total: 850
  },
  withPrewarming: {
    decode: 0, // Off hot path
    recover: 0, // Off hot path
    stateLoad: 50, // Cache hits
    execute: 300,
    total: 350
  }
}

// Cache statistics
const cacheStats = {
  storage: { size: 800, hits: 15420, misses: 2103, hitRate: 88 },
  account: { size: 50, hits: 8932, misses: 543, hitRate: 94 },
  bytecode: { size: 50, hits: 3201, misses: 189, hitRate: 94 },
}

export default function PrewarmingDeepDivePage() {
  const [activePhase, setActivePhase] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<"architecture" | "execution" | "performance" | "code">("architecture")
  const [animationStep, setAnimationStep] = useState(0)
  const [workers, setWorkers] = useState<Worker[]>(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      status: "idle",
      progress: 0
    }))
  )
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      hash: `0x${i.toString(16).padStart(3, '0')}...`,
      status: "pending"
    }))
  )
  const [executionTime, setExecutionTime] = useState(0)
  const [cacheHitRate, setCacheHitRate] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)

  // Animation control
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setAnimationStep(prev => {
        const next = prev + 1
        if (next >= executionPhases.length) {
          setIsPlaying(false)
          return 0
        }
        return next
      })
      setActivePhase(executionPhases[animationStep]?.id || null)
      
      // Update execution time
      setExecutionTime(prev => prev + (executionPhases[animationStep]?.duration || 0))
      
      // Simulate cache hit rate improvement
      setCacheHitRate(prev => Math.min(95, prev + 15))
      
      // Update worker states
      setWorkers(prev => prev.map(worker => ({
        ...worker,
        status: animationStep === 2 ? "recovering" : 
                animationStep === 3 ? "executing" :
                animationStep === 4 ? "caching" : "idle",
        progress: Math.min(100, worker.progress + 20)
      })))
      
      // Update transaction states
      setTransactions(prev => prev.map((tx, idx) => {
        if (idx < animationStep * 20) {
          return {
            ...tx,
            status: animationStep >= 5 ? "complete" : 
                   animationStep >= 3 ? "cached" :
                   animationStep >= 2 ? "recovering" : "decoding",
            worker: idx % 8
          }
        }
        return tx
      }))
    }, 1500)

    return () => clearInterval(interval)
  }, [isPlaying, animationStep])

  const startAnimation = () => {
    setAnimationStep(0)
    setIsPlaying(true)
    setActivePhase(executionPhases[0].id)
    setExecutionTime(0)
    setCacheHitRate(0)
    setWorkers(prev => prev.map(w => ({ ...w, status: "idle", progress: 0 })))
    setTransactions(prev => prev.map(tx => ({ ...tx, status: "pending", worker: undefined })))
  }

  const resetAnimation = () => {
    setIsPlaying(false)
    setAnimationStep(0)
    setActivePhase(null)
    setExecutionTime(0)
    setCacheHitRate(0)
    setWorkers(prev => prev.map(w => ({ ...w, status: "idle", progress: 0 })))
    setTransactions(prev => prev.map(tx => ({ ...tx, status: "pending", worker: undefined })))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "#10b981"
      case "cached": return "#f59e0b"
      case "executing": return "#3b82f6"
      case "recovering": return "#8b5cf6"
      case "decoding": return "#ec4899"
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
            <h1 className="text-3xl font-bold text-white">Transaction Prewarming Deep Dive</h1>
            <p className="text-zinc-400 mt-1">How Reth achieves 59% performance improvement through parallel cache warming</p>
          </div>
        </div>

        {/* Critical Innovation Box */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-orange-400 font-semibold mb-1">The Prewarming Innovation</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Traditional execution: <span className="text-red-400 font-mono">Decode → Recover → Load State → Execute</span> (850ms sequential)
              </p>
              <p className="text-zinc-300 text-sm leading-relaxed mt-1">
                With prewarming: <span className="text-green-400 font-mono">Execute with warm caches</span> (350ms, everything else parallel)
              </p>
              <p className="text-zinc-400 text-xs mt-2">
                Key insight: 80%+ of transactions don&apos;t conflict, so we can execute them out-of-order to populate caches
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mt-6">
          {["architecture", "execution", "performance", "code"].map((mode) => (
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

      {/* Animation Controls */}
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
        
        {/* Live Metrics */}
        <div className="flex items-center gap-6 ml-auto">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-400 text-sm">Execution:</span>
            <span className="font-mono text-white">{executionTime}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-400 text-sm">Cache Hit:</span>
            <span className="font-mono text-white">{cacheHitRate}%</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "architecture" && (
          <motion.div
            key="architecture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Prewarming Architecture Diagram */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Prewarming Architecture</h3>
              
              <svg
                ref={svgRef}
                className="w-full h-[600px]"
                viewBox="0 0 1200 600"
              >
                {/* Background layers */}
                <rect x="50" y="50" width="300" height="500" fill="#18181b" stroke="#3f3f46" rx="8" />
                <text x="200" y="80" textAnchor="middle" fill="#71717a" fontSize="14" fontWeight="bold">
                  ENGINE API
                </text>
                
                <rect x="400" y="50" width="350" height="500" fill="#18181b" stroke="#3f3f46" rx="8" />
                <text x="575" y="80" textAnchor="middle" fill="#71717a" fontSize="14" fontWeight="bold">
                  PREWARMING PIPELINE
                </text>
                
                <rect x="800" y="50" width="350" height="500" fill="#18181b" stroke="#3f3f46" rx="8" />
                <text x="975" y="80" textAnchor="middle" fill="#71717a" fontSize="14" fontWeight="bold">
                  EXECUTION ENGINE
                </text>

                {/* Engine API Components */}
                <motion.g
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <rect x="100" y="120" width="200" height="60" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" rx="6" />
                  <text x="200" y="145" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    newPayload Handler
                  </text>
                  <text x="200" y="165" textAnchor="middle" fill="#94a3b8" fontSize="10">
                    Receives execution payload
                  </text>
                </motion.g>

                <motion.g
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <rect x="100" y="200" width="200" height="60" fill="#1e293b" stroke="#10b981" strokeWidth="2" rx="6" />
                  <text x="200" y="225" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    PayloadTransactions
                  </text>
                  <text x="200" y="245" textAnchor="middle" fill="#94a3b8" fontSize="10">
                    Lazy iterator (no upfront cost)
                  </text>
                </motion.g>

                {/* Prewarming Components */}
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <rect x="450" y="120" width="250" height="80" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" rx="6" />
                  <text x="575" y="145" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    PrewarmCacheTask
                  </text>
                  <text x="575" y="165" textAnchor="middle" fill="#94a3b8" fontSize="10">
                    64 parallel workers
                  </text>
                  <text x="575" y="185" textAnchor="middle" fill="#fbbf24" fontSize="11">
                    max_concurrency: 64
                  </text>
                </motion.g>

                {/* Worker Pool */}
                {[0, 1, 2, 3].map((row) => (
                  [0, 1].map((col) => {
                    const workerId = row * 2 + col
                    const worker = workers[workerId]
                    return (
                      <motion.g
                        key={workerId}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + workerId * 0.05 }}
                      >
                        <rect
                          x={450 + col * 125}
                          y={220 + row * 80}
                          width="120"
                          height="70"
                          fill="#0f172a"
                          stroke={worker?.status === "idle" ? "#3f3f46" : "#f59e0b"}
                          strokeWidth="1"
                          rx="4"
                        />
                        <text
                          x={510 + col * 125}
                          y={240 + row * 80}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          Worker #{workerId}
                        </text>
                        <text
                          x={510 + col * 125}
                          y={255 + row * 80}
                          textAnchor="middle"
                          fill={worker?.status === "idle" ? "#71717a" : "#fbbf24"}
                          fontSize="9"
                        >
                          {worker?.status || "idle"}
                        </text>
                        {worker && worker.progress > 0 && (
                          <rect
                            x={455 + col * 125}
                            y={270 + row * 80}
                            width={110 * (worker.progress / 100)}
                            height="4"
                            fill="#f59e0b"
                            rx="2"
                          />
                        )}
                      </motion.g>
                    )
                  })
                ))}

                {/* Execution Engine Components */}
                <motion.g
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <rect x="850" y="120" width="250" height="80" fill="#1e293b" stroke="#10b981" strokeWidth="2" rx="6" />
                  <text x="975" y="145" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    CachedStateProvider
                  </text>
                  <text x="975" y="165" textAnchor="middle" fill="#94a3b8" fontSize="10">
                    ~900MB cross-block cache
                  </text>
                  <text x="975" y="185" textAnchor="middle" fill="#10b981" fontSize="11">
                    Hit Rate: 85%+
                  </text>
                </motion.g>

                <motion.g
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <rect x="850" y="220" width="250" height="80" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" rx="6" />
                  <text x="975" y="245" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    Sequential Executor
                  </text>
                  <text x="975" y="265" textAnchor="middle" fill="#94a3b8" fontSize="10">
                    Executes with warm caches
                  </text>
                  <text x="975" y="285" textAnchor="middle" fill="#3b82f6" fontSize="11">
                    No decode/recover overhead
                  </text>
                </motion.g>

                <motion.g
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <rect x="850" y="320" width="250" height="80" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" rx="6" />
                  <text x="975" y="345" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    State Root Computer
                  </text>
                  <text x="975" y="365" textAnchor="middle" fill="#94a3b8" fontSize="10">
                    Parallel multiproof generation
                  </text>
                  <text x="975" y="385" textAnchor="middle" fill="#8b5cf6" fontSize="11">
                    Uses proof targets from prewarm
                  </text>
                </motion.g>

                {/* Data Flow Arrows */}
                <motion.path
                  d="M 300 150 L 450 150"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-blue)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                />
                
                <motion.path
                  d="M 300 230 L 450 230"
                  stroke="#10b981"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-green)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                />
                
                <motion.path
                  d="M 700 160 L 850 160"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-orange)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                />
                
                <motion.path
                  d="M 700 260 L 850 260"
                  stroke="#10b981"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead-green)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                />

                {/* Arrow markers */}
                <defs>
                  <marker id="arrowhead-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                  </marker>
                  <marker id="arrowhead-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
                  </marker>
                  <marker id="arrowhead-orange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
                  </marker>
                </defs>

                {/* Cache Distribution */}
                <g transform="translate(850, 430)">
                  <rect x="0" y="0" width="250" height="100" fill="#0f172a" stroke="#3f3f46" rx="4" />
                  <text x="125" y="20" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
                    Cache Distribution
                  </text>
                  
                  {/* Storage Cache */}
                  <rect x="10" y="30" width="230" height="15" fill="#1e293b" rx="2" />
                  <rect x="10" y="30" width={230 * 0.88} height="15" fill="#3b82f6" rx="2" />
                  <text x="15" y="41" fill="white" fontSize="9">Storage: 88%</text>
                  
                  {/* Account Cache */}
                  <rect x="10" y="50" width="230" height="15" fill="#1e293b" rx="2" />
                  <rect x="10" y="50" width={230 * 0.06} height="15" fill="#10b981" rx="2" />
                  <text x="15" y="61" fill="white" fontSize="9">Account: 6%</text>
                  
                  {/* Bytecode Cache */}
                  <rect x="10" y="70" width="230" height="15" fill="#1e293b" rx="2" />
                  <rect x="10" y="70" width={230 * 0.06} height="15" fill="#8b5cf6" rx="2" />
                  <text x="15" y="81" fill="white" fontSize="9">Bytecode: 6%</text>
                </g>
              </svg>
            </div>

            {/* Key Components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-semibold">Engine API Layer</h4>
                </div>
                <p className="text-zinc-400 text-sm mb-3">
                  Receives payloads from consensus layer and creates lazy iterators
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">newPayload handler</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">PayloadTransactions iterator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">Zero upfront decoding cost</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FlameIcon className="w-5 h-5 text-orange-400" />
                  <h4 className="text-white font-semibold">Prewarming Pipeline</h4>
                </div>
                <p className="text-zinc-400 text-sm mb-3">
                  64 parallel workers execute transactions to populate caches
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">Parallel ECDSA recovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">Out-of-order execution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">No nonce/balance checks</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-green-400" />
                  <h4 className="text-white font-semibold">Execution Engine</h4>
                </div>
                <p className="text-zinc-400 text-sm mb-3">
                  Sequential execution with prewarmed state for correctness
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">85%+ cache hit rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">No decode/recover overhead</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-300">Parallel state root after</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "execution" && (
          <motion.div
            key="execution"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Execution Phases */}
            <div className="space-y-4">
              {executionPhases.map((phase, index) => {
                const isActive = activePhase === phase.id
                const isPast = animationStep > index
                
                return (
                  <motion.div
                    key={phase.id}
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
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            phase.color
                          )}>
                            <phase.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                            <p className="text-zinc-400 text-sm mt-1">{phase.description}</p>
                            
                            {phase.githubLink && (
                              <a
                                href={phase.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 text-xs"
                              >
                                <FileCode className="w-3 h-3" />
                                View in Reth codebase
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-zinc-500 text-xs">Duration</p>
                          <p className="text-zinc-300 font-mono text-lg">{phase.duration}ms</p>
                          {phase.parallel && (
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              <Cpu className="w-3 h-3 text-green-400" />
                              <span className="text-green-400 text-xs">Parallel</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {phase.code && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-500 text-xs">Implementation</span>
                          </div>
                          <pre className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 overflow-x-auto">
                            <code className="text-xs text-zinc-300 font-mono">
                              {phase.code}
                            </code>
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-b-xl"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: phase.duration / 100 }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Transaction Status Grid */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Transaction Processing Status</h3>
              <div className="grid grid-cols-20 gap-1">
                {transactions.slice(0, 100).map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: tx.id * 0.01 }}
                    className="relative group"
                  >
                    <div
                      className="w-full aspect-square rounded"
                      style={{ backgroundColor: getStatusColor(tx.status) }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-full mb-1 px-2 py-1 bg-zinc-900 rounded text-xs text-white whitespace-nowrap z-10">
                        Tx #{tx.id}: {tx.status}
                        {tx.worker !== undefined && ` (Worker ${tx.worker})`}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#6b7280" }} />
                  <span className="text-zinc-400">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ec4899" }} />
                  <span className="text-zinc-400">Decoding</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#8b5cf6" }} />
                  <span className="text-zinc-400">Recovering</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
                  <span className="text-zinc-400">Cached</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#10b981" }} />
                  <span className="text-zinc-400">Complete</span>
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
            {/* Performance Comparison */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Performance Impact Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Without Prewarming */}
                <div>
                  <h4 className="text-red-400 font-medium mb-4">Without Prewarming (Sequential)</h4>
                  <div className="space-y-3">
                    {Object.entries(performanceMetrics.withoutPrewarming).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-zinc-400 capitalize">{key}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(value / 850) * 100}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="h-full bg-red-500"
                            />
                          </div>
                          <span className="text-red-400 font-mono text-sm w-16 text-right">{value}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* With Prewarming */}
                <div>
                  <h4 className="text-green-400 font-medium mb-4">With Prewarming (Parallel)</h4>
                  <div className="space-y-3">
                    {Object.entries(performanceMetrics.withPrewarming).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-zinc-400 capitalize">{key}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: value > 0 ? `${(value / 850) * 100}%` : "0%" }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="h-full bg-green-500"
                            />
                          </div>
                          <span className="text-green-400 font-mono text-sm w-16 text-right">
                            {value === 0 ? "0ms*" : `${value}ms`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">* Moved off critical path</p>
                </div>
              </div>

              {/* Improvement Summary */}
              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 font-semibold">Total Performance Improvement</p>
                    <p className="text-zinc-400 text-sm">850ms → 350ms execution time</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-400">59%</p>
                    <p className="text-zinc-500 text-xs">Faster</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cache Performance */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Cache Performance Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(cacheStats).map(([type, stats]) => (
                  <div key={type} className="space-y-3">
                    <h4 className="text-zinc-300 font-medium capitalize">{type} Cache</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-sm">Size</span>
                        <span className="text-white font-mono">{stats.size}MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-sm">Hits</span>
                        <span className="text-green-400 font-mono">{stats.hits.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-sm">Misses</span>
                        <span className="text-red-400 font-mono">{stats.misses.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-500 text-sm">Hit Rate</span>
                        <span className="text-white font-mono">{stats.hitRate}%</span>
                      </div>
                      <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.hitRate}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className={cn(
                            "h-full",
                            stats.hitRate > 90 ? "bg-green-500" :
                            stats.hitRate > 80 ? "bg-yellow-500" : "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Path Analysis */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Critical Path Optimization</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Traditional Approach Problem</h4>
                      <p className="text-zinc-400 text-sm mt-1">
                        Every operation is on the critical path: decode → recover → load → execute
                      </p>
                      <p className="text-red-400 font-mono text-xs mt-2">
                        Critical path: 850ms (100% of execution time)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Prewarming Solution</h4>
                      <p className="text-zinc-400 text-sm mt-1">
                        Only sequential execution remains on critical path
                      </p>
                      <p className="text-green-400 font-mono text-xs mt-2">
                        Critical path: 300ms (35% of traditional time)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
                  <h4 className="text-blue-400 font-medium mb-2">Key Innovation</h4>
                  <p className="text-zinc-300 text-sm">
                    By executing transactions out-of-order with disabled checks, we can populate 
                    caches before the sequential execution begins. This moves 550ms of work 
                    completely off the critical path.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "code" && (
          <motion.div
            key="code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Implementation Links */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Reth Implementation</h3>
              
              <div className="space-y-3">
                <a
                  href="https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_processor/prewarm.rs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-white font-medium">prewarm.rs</p>
                        <p className="text-zinc-500 text-xs">Core prewarming task implementation</p>
                      </div>
                    </div>
                    <GitBranch className="w-4 h-4 text-zinc-500" />
                  </div>
                </a>

                <a
                  href="https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_processor/mod.rs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">payload_processor/mod.rs</p>
                        <p className="text-zinc-500 text-xs">Payload processing and transaction iteration</p>
                      </div>
                    </div>
                    <GitBranch className="w-4 h-4 text-zinc-500" />
                  </div>
                </a>

                <a
                  href="https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/payload_validator.rs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">payload_validator.rs</p>
                        <p className="text-zinc-500 text-xs">Engine API integration and validation</p>
                      </div>
                    </div>
                    <GitBranch className="w-4 h-4 text-zinc-500" />
                  </div>
                </a>

                <a
                  href="https://github.com/paradigmxyz/reth/blob/main/crates/engine/tree/src/tree/cached_state.rs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white font-medium">cached_state.rs</p>
                        <p className="text-zinc-500 text-xs">Cross-block cache implementation</p>
                      </div>
                    </div>
                    <GitBranch className="w-4 h-4 text-zinc-500" />
                  </div>
                </a>
              </div>
            </div>

            {/* Key Configuration */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
              
              <pre className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 overflow-x-auto">
                <code className="text-sm text-zinc-300 font-mono">{`// Key configuration parameters
pub struct PrewarmConfig {
    /// Number of parallel workers for prewarming
    /// Default: 64 (optimal for most hardware)
    pub max_concurrency: usize,
    
    /// Size of cross-block cache in MB
    /// Default: 900MB (configurable via CLI)
    pub cross_block_cache_size: usize,
    
    /// Enable multiproof prefetching
    /// Default: true
    pub enable_multiproof: bool,
    
    /// Transaction batch size per worker
    /// Default: dynamic based on block size
    pub batch_size: Option<usize>,
}

// CLI flags
--engine.max-execute-parallelism 64
--engine.cross-block-cache-size 900000000
--engine.enable-multiproof-prefetch`}</code>
              </pre>
            </div>

            {/* Implementation Notes */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Implementation Notes</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-yellow-400 font-medium mb-2">Why 64 Workers?</h4>
                  <p className="text-zinc-400 text-sm">
                    Empirically determined optimal concurrency. More workers increase contention 
                    without improving throughput. Most blocks have 100-500 transactions, so 64 
                    workers provide good parallelism without overhead.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-cyan-400 font-medium mb-2">Cache Size Trade-offs</h4>
                  <p className="text-zinc-400 text-sm">
                    900MB default balances memory usage with hit rate. Larger caches improve 
                    hit rate marginally but increase memory pressure. Storage cache dominates 
                    (88%) because contract storage is the most frequent access pattern.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-green-400 font-medium mb-2">Out-of-Order Safety</h4>
                  <p className="text-zinc-400 text-sm">
                    Prewarming execution has no side effects. Disabled nonce/balance checks 
                    allow any execution order. Results are only used for cache population, 
                    not state changes. Sequential execution provides final correctness.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-purple-400 font-medium mb-2">Future Optimizations</h4>
                  <p className="text-zinc-400 text-sm">
                    Active research into caching transaction outputs for true parallel EVM. 
                    If transactions don&apos;t conflict (80%+ case), we can reuse prewarmed results 
                    directly. See <a href="https://github.com/paradigmxyz/reth/issues/17833" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">issue #17833</a> for BlockSTM experiments.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Visualizations */}
      <div className="mt-12 pt-8 border-t border-zinc-800">
        <h3 className="text-lg font-semibold text-white mb-4">Related Visualizations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/chapters/engine-tree-prewarming"
            className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <TreePine className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">Engine Tree Handler</p>
                <p className="text-zinc-500 text-xs">Chain candidate management</p>
              </div>
            </div>
          </Link>

          <Link
            href="/chapters/state-root"
            className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">State Root Computation</p>
                <p className="text-zinc-500 text-xs">Parallel multiproof generation</p>
              </div>
            </div>
          </Link>

          <Link
            href="/chapters/payload-validation"
            className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white font-medium">Payload Validation</p>
                <p className="text-zinc-500 text-xs">Block validation pipeline</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}