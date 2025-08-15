"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Settings, Cpu, Layers, GitBranch, Zap, Code2, 
  Package, ArrowRight, CheckCircle, 
  FileCode, Activity,
  Play, Pause, RotateCcw, Info, Factory,
  Clock, Box, Component, CircuitBoard,
  Hammer, AlertCircle, Timer,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "architecture" | "execution" | "traits" | "timing"
type ExecutionPhase = "idle" | "pre-execution" | "executing" | "post-execution" | "complete"
type TraitLayer = "ConfigureEvm" | "BlockExecutorFactory" | "EvmFactory" | "Evm"

interface TraitInterface {
  id: string
  name: string
  layer: TraitLayer
  methods: string[]
  description: string
  icon: LucideIcon
  color: string
  dependencies: string[]
}

interface ExecutionStage {
  id: string
  name: string
  phase: ExecutionPhase
  description: string
  icon: LucideIcon
  systemCalls?: string[]
  gasEstimate?: number
  timing?: string
}

interface TimingConsideration {
  id: string
  name: string
  description: string
  impact: "critical" | "high" | "medium"
  latency: string
  icon: LucideIcon
}

const traitInterfaces: TraitInterface[] = [
  {
    id: "configure-evm",
    name: "ConfigureEvm",
    layer: "ConfigureEvm",
    description: "Top-level trait for complete EVM configuration",
    icon: Settings,
    color: "from-purple-500 to-pink-500",
    dependencies: [],
    methods: [
      "fn block_executor_factory() -> BlockExecutorFactory",
      "fn block_assembler() -> BlockAssembler",
      "fn evm_env(header) -> EvmEnv",
      "fn next_evm_env(parent, attributes) -> EvmEnv",
      "fn builder_for_next_block(...) -> BlockBuilder"
    ]
  },
  {
    id: "block-executor-factory",
    name: "BlockExecutorFactory",
    layer: "BlockExecutorFactory",
    description: "Factory for creating block executors",
    icon: Factory,
    color: "from-blue-500 to-cyan-500",
    dependencies: ["configure-evm"],
    methods: [
      "fn create_executor(evm, ctx) -> BlockExecutor",
      "fn evm_factory() -> EvmFactory",
      "type ExecutionCtx",
      "type Transaction",
      "type Receipt"
    ]
  },
  {
    id: "evm-factory",
    name: "EvmFactory",
    layer: "EvmFactory",
    description: "Factory for creating EVM instances",
    icon: Hammer,
    color: "from-green-500 to-emerald-500",
    dependencies: ["block-executor-factory"],
    methods: [
      "fn create_evm(db, env) -> Evm",
      "fn create_evm_with_inspector(db, env, inspector) -> Evm",
      "type Spec",
      "type Precompiles"
    ]
  },
  {
    id: "evm",
    name: "Evm (Revm)",
    layer: "Evm",
    description: "Core EVM execution engine",
    icon: Cpu,
    color: "from-orange-500 to-red-500",
    dependencies: ["evm-factory"],
    methods: [
      "fn transact() -> ExecutionResult",
      "fn transact_with_commit() -> ExecutionResult",
      "fn apply_state_changeset()",
      "fn db() -> &mut State"
    ]
  }
]

const executionStages: ExecutionStage[] = [
  {
    id: "pre-execution",
    name: "Pre-Execution Changes",
    phase: "pre-execution",
    description: "Apply system calls and prepare block environment",
    icon: CircuitBoard,
    systemCalls: [
      "apply_beacon_root_contract_call (EIP-4788)",
      "apply_blockhashes_contract_call (EIP-2935)",
      "apply_withdrawals"
    ],
    gasEstimate: 0,
    timing: "~5ms"
  },
  {
    id: "execute-txs",
    name: "Execute Transactions",
    phase: "executing",
    description: "Process all transactions sequentially",
    icon: Activity,
    gasEstimate: 15000000,
    timing: "~50-200ms"
  },
  {
    id: "post-execution",
    name: "Post-Execution Processing",
    phase: "post-execution",
    description: "Finalize block and process consensus layer requests",
    icon: Box,
    systemCalls: [
      "process_consolidation_requests",
      "process_deposit_requests",
      "calculate_request_hash"
    ],
    gasEstimate: 0,
    timing: "~3ms"
  }
]

const timingConsiderations: TimingConsideration[] = [
  {
    id: "mev-deadline",
    name: "MEV Builder Deadline",
    description: "Builders need time to bundle transactions optimally",
    impact: "critical",
    latency: "< 4s total",
    icon: Timer
  },
  {
    id: "attestation",
    name: "Validator Attestation",
    description: "Validators must attest by slot 8s mark",
    impact: "critical",
    latency: "< 8s validation",
    icon: Clock
  },
  {
    id: "state-root",
    name: "State Root Calculation",
    description: "Parallel trie computation for merkle root",
    impact: "high",
    latency: "~100-300ms",
    icon: GitBranch
  },
  {
    id: "payload-building",
    name: "Payload Building",
    description: "Time to assemble and validate new block",
    impact: "high",
    latency: "~50-100ms",
    icon: Package
  }
]

export default function EVMPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("architecture")
  const [executionPhase, setExecutionPhase] = useState<ExecutionPhase>("idle")
  const [currentStage, setCurrentStage] = useState(-1)
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeLayer, setActiveLayer] = useState<TraitLayer | null>(null)
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null)
  const [totalGasUsed, setTotalGasUsed] = useState(0)
  const [blockTime, setBlockTime] = useState(0)
  const [showSystemCalls, setShowSystemCalls] = useState(false)

  // Simulation timer
  useEffect(() => {
    if (viewMode === "timing" && isSimulating) {
      const interval = setInterval(() => {
        setBlockTime(prev => {
          if (prev >= 12000) {
            setIsSimulating(false)
            return 0
          }
          return prev + 100
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [viewMode, isSimulating])

  const startExecution = () => {
    setIsSimulating(true)
    setExecutionPhase("pre-execution")
    setCurrentStage(0)
    setTotalGasUsed(0)
    setShowSystemCalls(true)
    
    let stageIndex = 0
    const runStage = () => {
      if (stageIndex >= executionStages.length) {
        setExecutionPhase("complete")
        setIsSimulating(false)
        return
      }

      const stage = executionStages[stageIndex]
      setCurrentStage(stageIndex)
      setExecutionPhase(stage.phase)
      
      const gasEstimate = stage.gasEstimate
      if (gasEstimate !== undefined && gasEstimate > 0) {
        setTotalGasUsed(prev => prev + gasEstimate)
      }

      setTimeout(() => {
        stageIndex++
        runStage()
      }, stage.phase === "executing" ? 2000 : 1000)
    }

    runStage()
  }

  const resetSimulation = () => {
    setExecutionPhase("idle")
    setCurrentStage(-1)
    setIsSimulating(false)
    setTotalGasUsed(0)
    setBlockTime(0)
    setShowSystemCalls(false)
    setActiveLayer(null)
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">EVM Stack Architecture</h1>
              <p className="text-zinc-400">
                ConfigureEvm → BlockExecutor → Revm Integration
              </p>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex gap-2 mt-6">
            {[
              { id: "architecture" as ViewMode, label: "Architecture", icon: Layers },
              { id: "execution" as ViewMode, label: "Block Execution", icon: Activity },
              { id: "traits" as ViewMode, label: "Trait Interfaces", icon: Code2 },
              { id: "timing" as ViewMode, label: "MEV & Timing", icon: Clock }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
                  viewMode === mode.id
                    ? "bg-gradient-to-r from-[#627eea] to-[#a16ae8] text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <mode.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{mode.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Architecture View */}
        <AnimatePresence mode="wait">
          {viewMode === "architecture" && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Factory Pattern Hierarchy */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#627eea]/10 to-[#a16ae8]/10 rounded-2xl blur-xl" />
                <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Factory className="w-5 h-5 text-[#627eea]" />
                    Factory Pattern Hierarchy
                  </h2>

                  <div className="space-y-3">
                    {traitInterfaces.map((trait, index) => {
                      const Icon = trait.icon
                      const isActive = activeLayer === trait.layer
                      
                      return (
                        <motion.div
                          key={trait.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative"
                        >
                          {/* Connection Line */}
                          {index > 0 && (
                            <div className="absolute -top-3 left-5 w-0.5 h-3 bg-gradient-to-b from-transparent to-zinc-700" />
                          )}
                          
                          <div
                            onClick={() => setActiveLayer(isActive ? null : trait.layer)}
                            className={cn(
                              "relative p-4 rounded-xl border cursor-pointer transition-all duration-300",
                              isActive 
                                ? "bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border-[#627eea]/50"
                                : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                            )}
                            style={{ marginLeft: `${index * 20}px` }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                trait.color
                              )}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-semibold text-white mb-1">{trait.name}</h3>
                                <p className="text-xs text-zinc-400">{trait.description}</p>
                              </div>

                              <ArrowRight className={cn(
                                "w-4 h-4 transition-transform",
                                isActive && "rotate-90"
                              )} />
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Alloy & Revm Integration */}
                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-400 mb-3">Dependencies</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">Alloy</span>
                        </div>
                        <p className="text-xs text-zinc-400">Types & Encoding</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-white">Revm</span>
                        </div>
                        <p className="text-xs text-zinc-400">EVM Execution</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Example */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff8867]/10 to-[#627eea]/10 rounded-2xl blur-xl" />
                <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-[#ff8867]" />
                    ConfigureEvm Implementation
                  </h2>
                  
                  <div className="bg-black/50 rounded-xl border border-zinc-800 p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-zinc-300">
{`impl ConfigureEvm for EthEvmConfig {
    type Primitives = EthPrimitives;
    type BlockExecutorFactory = EthBlockExecutorFactory;
    type BlockAssembler = EthBlockAssembler;
    
    fn block_executor_factory(&self) -> &Self::BlockExecutorFactory {
        &self.executor_factory
    }
    
    fn evm_env(&self, header: &Header) -> EvmEnv {
        // Create BlockEnv from header
        let block_env = BlockEnv {
            number: header.number,
            timestamp: header.timestamp,
            beneficiary: header.beneficiary,
            gas_limit: header.gas_limit,
            basefee: header.base_fee_per_gas,
            prevrandao: header.mix_hash,
        };
        
        // Determine spec ID from hardfork
        let spec_id = self.chain_spec.fork_id(header.number);
        
        EvmEnv {
            cfg: CfgEnv { chain_id: self.chain_spec.chain_id(), spec_id },
            block: block_env,
        }
    }
    
    fn builder_for_next_block<'a, DB>(
        &'a self,
        db: &'a mut State<DB>,
        parent: &'a SealedHeader,
        attributes: NextBlockEnvAttributes,
    ) -> Result<BlockBuilder<'a, Self, DB>> {
        let evm_env = self.next_evm_env(parent, &attributes)?;
        let evm = self.evm_with_env(db, evm_env);
        let ctx = self.context_for_next_block(parent, attributes);
        
        Ok(self.create_block_builder(evm, parent, ctx))
    }
}`}</pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Block Execution View */}
          {viewMode === "execution" && (
            <motion.div
              key="execution"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Execution Flow */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#627eea]/10 to-[#a16ae8]/10 rounded-2xl blur-xl" />
                <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#627eea]" />
                    Block Execution Flow
                  </h2>

                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">Execution Progress</span>
                      <span className={cn(
                        "text-sm font-mono font-semibold",
                        executionPhase !== "idle" && "bg-gradient-to-r from-[#627eea] to-[#a16ae8] bg-clip-text text-transparent"
                      )}>
                        {executionPhase.toUpperCase()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#627eea] to-[#a16ae8]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((currentStage + 1) / executionStages.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Execution Stages */}
                  <div className="space-y-4">
                    {executionStages.map((stage, index) => {
                      const Icon = stage.icon
                      const isActive = currentStage === index
                      const isComplete = currentStage > index
                      
                      return (
                        <motion.div
                          key={stage.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "relative p-4 rounded-xl border transition-all duration-300",
                            isActive
                              ? "bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border-[#627eea]/50"
                              : isComplete
                              ? "bg-zinc-900/50 border-green-900/50"
                              : "bg-zinc-950/50 border-zinc-800"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isComplete
                                ? "bg-green-500"
                                : isActive
                                ? "bg-gradient-to-br from-[#627eea] to-[#a16ae8]"
                                : "bg-zinc-800"
                            )}>
                              {isComplete ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <Icon className="w-5 h-5 text-white" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-white">{stage.name}</h3>
                                {stage.timing && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                                    {stage.timing}
                                  </span>
                                )}
                                {stage.gasEstimate && stage.gasEstimate > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                    {(stage.gasEstimate / 1000000).toFixed(1)}M gas
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-zinc-400 mb-2">{stage.description}</p>
                              
                              {/* System Calls */}
                              <AnimatePresence>
                                {stage.systemCalls && showSystemCalls && (isActive || isComplete) && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 pt-3 border-t border-zinc-800"
                                  >
                                    <div className="space-y-1">
                                      {stage.systemCalls.map((call, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                          <CircuitBoard className="w-3 h-3 text-purple-400" />
                                          <code className="text-purple-400 font-mono">{call}</code>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Controls & Metrics */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={isSimulating ? () => setIsSimulating(false) : startExecution}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#627eea] to-[#a16ae8]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#a16ae8] to-[#ff8867] opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isSimulating ? <Pause className="relative w-4 h-4" /> : <Play className="relative w-4 h-4" />}
                        <span className="relative text-sm">Execute Block</span>
                      </button>
                      
                      <button
                        onClick={resetSimulation}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium border border-zinc-700 text-zinc-300 hover:bg-white/5"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-sm">Reset</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-zinc-400">Gas Used:</span>
                        <span className="text-sm font-mono font-semibold text-yellow-500">
                          {(totalGasUsed / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showSystemCalls}
                          onChange={(e) => setShowSystemCalls(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-9 h-5 rounded-full transition-colors",
                          showSystemCalls ? "bg-[#627eea]" : "bg-zinc-700"
                        )}>
                          <div className={cn(
                            "w-4 h-4 rounded-full bg-white transition-transform mt-0.5",
                            showSystemCalls ? "translate-x-4" : "translate-x-0.5"
                          )} />
                        </div>
                        <span className="text-sm text-zinc-400">Show System Calls</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trait Interfaces View */}
          {viewMode === "traits" && (
            <motion.div
              key="traits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {traitInterfaces.map((trait, index) => {
                const Icon = trait.icon
                const isExpanded = expandedTrait === trait.id
                
                return (
                  <motion.div
                    key={trait.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className={cn(
                      "absolute inset-0 rounded-2xl blur-xl",
                      "bg-gradient-to-br " + trait.color.replace("from-", "from-").replace("to-", "/20 to-") + "/20"
                    )} />
                    <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
                      <div 
                        onClick={() => setExpandedTrait(isExpanded ? null : trait.id)}
                        className="flex items-start gap-3 cursor-pointer"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                          trait.color
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg mb-1">{trait.name}</h3>
                          <p className="text-sm text-zinc-400">{trait.description}</p>
                        </div>

                        <Info className={cn(
                          "w-5 h-5 transition-transform",
                          isExpanded ? "rotate-180 text-[#627eea]" : "text-zinc-600"
                        )} />
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-zinc-800"
                          >
                            <h4 className="text-sm font-semibold text-zinc-400 mb-3">Key Methods</h4>
                            <div className="space-y-2">
                              {trait.methods.map((method, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <Component className="w-3 h-3 text-zinc-500 mt-1" />
                                  <code className="text-xs font-mono text-zinc-300 break-all">
                                    {method}
                                  </code>
                                </div>
                              ))}
                            </div>
                            
                            {trait.dependencies.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-zinc-800">
                                <h4 className="text-sm font-semibold text-zinc-400 mb-2">Dependencies</h4>
                                <div className="flex flex-wrap gap-2">
                                  {trait.dependencies.map(dep => {
                                    const depTrait = traitInterfaces.find(t => t.id === dep)
                                    return depTrait && (
                                      <span
                                        key={dep}
                                        className="text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400"
                                      >
                                        {depTrait.name}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* MEV & Timing View */}
          {viewMode === "timing" && (
            <motion.div
              key="timing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Block Timeline */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl blur-xl" />
                <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      12-Second Block Timeline
                    </h2>
                    <button
                      onClick={() => {
                        setIsSimulating(!isSimulating)
                        if (!isSimulating) setBlockTime(0)
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                    >
                      {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span className="text-sm font-medium">
                        {isSimulating ? "Pause" : "Start"} Timer
                      </span>
                    </button>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    <div className="h-16 bg-zinc-800/50 rounded-lg overflow-hidden">
                      {/* Time markers */}
                      <div className="absolute inset-0 flex items-center justify-between px-2">
                        {[0, 4, 8, 12].map(time => (
                          <div key={time} className="flex flex-col items-center">
                            <div className="w-0.5 h-3 bg-zinc-600" />
                            <span className="text-xs text-zinc-500 mt-1">{time}s</span>
                          </div>
                        ))}
                      </div>

                      {/* Progress */}
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500/30 to-red-500/30"
                        animate={{ width: `${(blockTime / 12000) * 100}%` }}
                        transition={{ duration: 0.1 }}
                      />

                      {/* Critical points */}
                      <div className="absolute top-1/2 -translate-y-1/2 left-[33.33%] w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      <div className="absolute top-1/2 -translate-y-1/2 left-[66.66%] w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>

                    {/* Current time */}
                    <div className="mt-4 text-center">
                      <span className="text-3xl font-mono font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        {(blockTime / 1000).toFixed(1)}s
                      </span>
                      <span className="text-zinc-500 ml-2">/ 12.0s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timing Considerations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {timingConsiderations.map((consideration, index) => {
                  const Icon = consideration.icon
                  const impactColor = {
                    critical: "from-red-500 to-orange-500",
                    high: "from-yellow-500 to-orange-500",
                    medium: "from-blue-500 to-cyan-500"
                  }[consideration.impact]
                  
                  return (
                    <motion.div
                      key={consideration.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl blur-xl" />
                      <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-5">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            impactColor
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{consideration.name}</h3>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                consideration.impact === "critical" 
                                  ? "bg-red-500/20 text-red-400"
                                  : consideration.impact === "high"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400"
                              )}>
                                {consideration.impact}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-400 mb-2">{consideration.description}</p>
                            <div className="flex items-center gap-2">
                              <Timer className="w-3 h-3 text-zinc-500" />
                              <span className="text-xs font-mono text-zinc-500">{consideration.latency}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* MEV Workflow */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
                <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-500" />
                    MEV Block Building Workflow
                  </h2>
                  
                  <div className="bg-black/50 rounded-xl border border-zinc-800 p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-zinc-300">
{`// MEV-optimized block building timeline
async fn build_mev_block(builder: &mut BlockBuilder) -> Result<Block> {
    // T+0ms: Start building
    let start = Instant::now();
    
    // T+0-3800ms: Collect and order transactions
    while start.elapsed() < Duration::from_millis(3800) {
        // MEV searchers submit bundles
        let bundle = receive_bundle().await?;
        
        // Simulate bundle for profitability
        let profit = simulate_bundle(&bundle)?;
        
        if profit > MIN_PROFIT_THRESHOLD {
            builder.add_bundle(bundle)?;
        }
    }
    
    // T+3800ms: Submit bid to relay
    let block = builder.finish()?;
    let bid = calculate_bid(&block);
    relay.submit_bid(bid, block.clone()).await?;
    
    // T+4000ms: Builder deadline
    // Validator makes decision
    
    // T+8000ms: Attestation deadline
    // Block must be validated by this point
    
    Ok(block)
}`}</pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Code Examples Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Block Executor Implementation */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Hammer className="w-5 h-5 text-blue-500" />
                BlockExecutor Implementation
              </h3>
              <div className="bg-black/50 rounded-xl border border-zinc-800 p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-300">
{`impl<DB: Database> BlockExecutor for BasicBlockExecutor<DB> {
    fn apply_pre_execution_changes(&mut self) -> Result<()> {
        // System calls before transactions
        self.apply_beacon_root_contract_call()?;
        self.apply_blockhashes_contract_call()?;
        self.apply_withdrawals()?;
        Ok(())
    }
    
    fn execute_transaction(
        &mut self,
        tx: RecoveredTx,
    ) -> Result<ExecutionResult> {
        // Convert to TxEnv
        let tx_env = self.tx_env(&tx);
        
        // Execute in Revm
        let result = self.evm.transact(tx_env)?;
        
        // Apply state changes
        self.state.apply_changeset(result.state)?;
        
        Ok(result)
    }
    
    fn apply_post_execution_changes(&mut self) -> Result<()> {
        // Process consensus layer requests
        self.process_consolidation_requests()?;
        self.process_deposit_requests()?;
        
        // Calculate request hash for header
        let request_hash = self.calculate_request_hash()?;
        
        Ok(())
    }
}`}</pre>
              </div>
            </div>
          </div>

          {/* System Calls */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CircuitBoard className="w-5 h-5 text-purple-500" />
                System Calls (EIP-4788)
              </h3>
              <div className="bg-black/50 rounded-xl border border-zinc-800 p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-300">
{`// EIP-4788: Beacon block root in EVM
fn apply_beacon_root_contract_call(
    &mut self,
    parent_beacon_block_root: B256,
    timestamp: u64,
) -> Result<()> {
    const BEACON_ROOTS_ADDRESS: Address = 
        address!("000F3df6D732807Ef1319fB7B8bB8522d0Beac02");
    
    // System call to update beacon root
    let input = encode_beacon_root_input(
        parent_beacon_block_root,
        timestamp
    );
    
    self.evm.transact_system_call(
        SYSTEM_ADDRESS,        // Caller (0xffffffff...)
        BEACON_ROOTS_ADDRESS,  // Contract
        input,                 // Calldata
    )?;
    
    Ok(())
}

// EIP-2935: Historical block hashes in state
fn apply_blockhashes_contract_call(
    &mut self,
    block_number: u64,
    block_hash: B256,
) -> Result<()> {
    const HISTORY_STORAGE_ADDRESS: Address = 
        address!("0aae40965e6800cd9b1f4b05ff21581047e3f91e");
    
    // Store block hash in state
    let slot = U256::from(block_number % 8191);
    self.state.set_storage(
        HISTORY_STORAGE_ADDRESS,
        slot,
        block_hash.into()
    )?;
    
    Ok(())
}`}</pre>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}