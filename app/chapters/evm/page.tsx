"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Settings, Cpu, Layers, GitBranch, Zap, Code2, 
  Package, Database, ArrowRight, CheckCircle, 
  FileCode, Wrench, Activity, MemoryStick,
  Play, Pause, RotateCcw, Info,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

type EVMLayer = "alloy" | "revm" | "reth" | "config"
type ExecutionPhase = "idle" | "decoding" | "validating" | "executing" | "applying" | "complete"

interface EVMComponent {
  id: string
  name: string
  layer: EVMLayer
  description: string
  icon: LucideIcon
  color: string
  features: string[]
}

interface ExecutionStep {
  id: string
  name: string
  description: string
  layer: EVMLayer
  duration: number
  gasUsed?: number
  stateChanges?: number
}

const evmComponents: EVMComponent[] = [
  {
    id: "alloy-evm",
    name: "Alloy EVM",
    layer: "alloy",
    description: "High-level Ethereum types and encoding",
    icon: Package,
    color: "from-purple-500 to-pink-500",
    features: [
      "Transaction types (Legacy, EIP-1559, EIP-4844)",
      "RLP encoding/decoding",
      "ABI encoding/decoding",
      "Keccak hashing"
    ]
  },
  {
    id: "revm",
    name: "Revm",
    layer: "revm",
    description: "Rust EVM implementation",
    icon: Cpu,
    color: "from-blue-500 to-cyan-500",
    features: [
      "EVM interpreter",
      "Opcode execution",
      "Gas calculation",
      "State transitions"
    ]
  },
  {
    id: "reth-evm",
    name: "Reth EVM",
    layer: "reth",
    description: "Reth-specific EVM configuration",
    icon: Settings,
    color: "from-orange-500 to-red-500",
    features: [
      "Block executor",
      "State provider",
      "Receipt builder",
      "Hardfork handling"
    ]
  },
  {
    id: "evm-config",
    name: "EVM Config",
    layer: "config",
    description: "Chain-specific configuration",
    icon: Wrench,
    color: "from-green-500 to-emerald-500",
    features: [
      "Chain spec",
      "Fork activation",
      "Precompiles",
      "System contracts"
    ]
  }
]

const executionSteps: ExecutionStep[] = [
  {
    id: "decode",
    name: "Decode Transaction",
    description: "Parse RLP-encoded transaction using Alloy",
    layer: "alloy",
    duration: 50,
    gasUsed: 0,
    stateChanges: 0
  },
  {
    id: "validate",
    name: "Validate Transaction",
    description: "Check signature, nonce, and balance",
    layer: "reth",
    duration: 100,
    gasUsed: 21000,
    stateChanges: 0
  },
  {
    id: "load-state",
    name: "Load State",
    description: "Fetch account state from database",
    layer: "reth",
    duration: 150,
    gasUsed: 0,
    stateChanges: 0
  },
  {
    id: "execute",
    name: "Execute in Revm",
    description: "Run EVM bytecode interpreter",
    layer: "revm",
    duration: 300,
    gasUsed: 45000,
    stateChanges: 3
  },
  {
    id: "apply-state",
    name: "Apply State Changes",
    description: "Update accounts and storage",
    layer: "reth",
    duration: 200,
    gasUsed: 0,
    stateChanges: 3
  },
  {
    id: "build-receipt",
    name: "Build Receipt",
    description: "Create execution receipt with logs",
    layer: "reth",
    duration: 50,
    gasUsed: 0,
    stateChanges: 0
  }
]

export default function EVMPage() {
  const [activeLayer, setActiveLayer] = useState<EVMLayer | null>(null)
  const [executionPhase, setExecutionPhase] = useState<ExecutionPhase>("idle")
  const [currentStep, setCurrentStep] = useState(-1)
  const [isSimulating, setIsSimulating] = useState(false)
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [totalGasUsed, setTotalGasUsed] = useState(0)
  const [totalStateChanges, setTotalStateChanges] = useState(0)

  const startSimulation = () => {
    setIsSimulating(true)
    setExecutionPhase("decoding")
    setCurrentStep(0)
    setTotalGasUsed(0)
    setTotalStateChanges(0)
    
    let stepIndex = 0
    const runStep = () => {
      if (stepIndex >= executionSteps.length) {
        setExecutionPhase("complete")
        setIsSimulating(false)
        return
      }

      const step = executionSteps[stepIndex]
      setCurrentStep(stepIndex)
      setActiveLayer(step.layer)
      
      // Update phase based on step
      if (step.id === "decode") setExecutionPhase("decoding")
      else if (step.id === "validate") setExecutionPhase("validating")
      else if (step.id === "execute") setExecutionPhase("executing")
      else if (step.id === "apply-state") setExecutionPhase("applying")
      
      // Update metrics
      if (step.gasUsed) {
        setTotalGasUsed(prev => prev + step.gasUsed)
      }
      if (step.stateChanges) {
        setTotalStateChanges(prev => prev + step.stateChanges)
      }

      setTimeout(() => {
        stepIndex++
        runStep()
      }, step.duration * 2)
    }

    runStep()
  }

  const resetSimulation = () => {
    setActiveLayer(null)
    setExecutionPhase("idle")
    setCurrentStep(-1)
    setIsSimulating(false)
    setTotalGasUsed(0)
    setTotalStateChanges(0)
  }

  const getPhaseColor = () => {
    switch (executionPhase) {
      case "decoding": return "from-purple-500 to-pink-500"
      case "validating": return "from-yellow-500 to-orange-500"
      case "executing": return "from-blue-500 to-cyan-500"
      case "applying": return "from-green-500 to-emerald-500"
      case "complete": return "from-green-500 to-emerald-500"
      default: return "from-zinc-600 to-zinc-700"
    }
  }

  return (
    <div className="min-h-screen relative p-8">
      <div className="max-w-7xl mx-auto">
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
              <h1 className="text-4xl font-bold gradient-text">EVM Architecture</h1>
              <p className="text-zinc-400">
                Understanding Reth&apos;s EVM stack with Revm and Alloy
              </p>
            </div>
          </div>
        </motion.div>

        {/* Architecture Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Layer Stack Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#627eea]/10 to-[#a16ae8]/10 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#627eea]" />
                EVM Stack Layers
              </h2>

              <div className="space-y-4">
                {evmComponents.map((component, index) => {
                  const Icon = component.icon
                  const isActive = activeLayer === component.layer
                  
                  return (
                    <motion.div
                      key={component.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setShowDetails(showDetails === component.id ? null : component.id)}
                      className={cn(
                        "relative p-4 rounded-xl border cursor-pointer transition-all duration-300",
                        isActive 
                          ? "bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border-[#627eea]/50 shadow-lg shadow-[#627eea]/20"
                          : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center transition-transform",
                          component.color,
                          isActive && "scale-110"
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{component.name}</h3>
                          <p className="text-xs text-zinc-400">{component.description}</p>
                          
                          <AnimatePresence>
                            {showDetails === component.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-zinc-800"
                              >
                                <div className="space-y-1">
                                  {component.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                      <span className="text-zinc-400">{feature}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <Info className={cn(
                          "w-4 h-4 transition-colors",
                          showDetails === component.id ? "text-[#627eea]" : "text-zinc-600"
                        )} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Execution Flow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff8867]/10 to-[#627eea]/10 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#ff8867]" />
                Transaction Execution Flow
              </h2>

              {/* Status Display */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-zinc-950/50 to-zinc-900/50 border border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-zinc-400">Execution Phase</span>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      executionPhase !== "idle" && "animate-pulse bg-gradient-to-r " + getPhaseColor()
                    )} />
                    <span className={cn(
                      "font-mono text-sm uppercase font-semibold",
                      executionPhase !== "idle" && "bg-gradient-to-r bg-clip-text text-transparent " + getPhaseColor()
                    )}>
                      {executionPhase}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800/50 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-r", getPhaseColor())}
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / executionSteps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Execution Steps */}
              <div className="space-y-3 mb-6">
                {executionSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-300",
                      currentStep === index
                        ? "bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border-[#627eea]/50"
                        : currentStep > index
                        ? "bg-zinc-900/50 border-green-900/50"
                        : "bg-zinc-950/50 border-zinc-800 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        currentStep > index 
                          ? "bg-green-500"
                          : currentStep === index
                          ? "bg-gradient-to-r from-[#627eea] to-[#a16ae8]"
                          : "bg-zinc-800"
                      )}>
                        {currentStep > index ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{step.name}</h4>
                          {step.gasUsed > 0 && currentStep >= index && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                              {step.gasUsed.toLocaleString()} gas
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">{step.description}</p>
                      </div>

                      <ArrowRight className={cn(
                        "w-4 h-4 transition-colors",
                        currentStep === index ? "text-[#627eea]" : "text-zinc-600"
                      )} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-zinc-400">Gas Used</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {totalGasUsed.toLocaleString()}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-zinc-400">State Changes</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-500">
                    {totalStateChanges}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={isSimulating ? () => setIsSimulating(false) : startSimulation}
                  disabled={executionPhase === "complete"}
                  className={cn(
                    "group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#627eea] to-[#a16ae8]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#a16ae8] to-[#ff8867] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {isSimulating ? <Pause className="relative w-4 h-4" /> : <Play className="relative w-4 h-4" />}
                  <span className="relative text-sm">{isSimulating ? "Pause" : "Execute"}</span>
                </button>
                
                <button
                  onClick={resetSimulation}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium border border-zinc-700 text-zinc-300 hover:bg-white/5 hover:border-zinc-600 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">Reset</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Revm Integration */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-500" />
                Revm Integration
              </h3>
              <div className="bg-black/50 rounded-xl border border-zinc-800 p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-300">
{`// Reth's Revm executor implementation
impl<EvmConfig> BlockExecutor for RethEvmExecutor<EvmConfig> {
    fn execute_block(
        &mut self,
        block: &Block,
    ) -> Result<BlockExecutionOutput> {
        // Configure EVM with chain spec
        let mut evm = Evm::builder()
            .with_spec_id(self.chain_spec.fork_id())
            .with_db(&mut self.state)
            .build();

        // Execute each transaction
        for tx in block.transactions() {
            let result = evm.transact()?;
            
            // Apply state changes
            self.state.apply_changeset(
                result.state
            )?;
        }

        Ok(BlockExecutionOutput {
            state_root: self.state.root()?,
            receipts: self.receipts,
            gas_used: self.cumulative_gas,
        })
    }
}`}</pre>
              </div>
            </div>
          </div>

          {/* Alloy Types */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-500" />
                Alloy Types
              </h3>
              <div className="bg-black/50 rounded-xl border border-zinc-800 p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-300">
{`// Using Alloy for transaction handling
use alloy_primitives::{Address, U256, Bytes};
use alloy_consensus::TxEnvelope;

// Decode incoming transaction
let tx_envelope = TxEnvelope::decode(&raw_tx)?;

// Pattern match on transaction type
match tx_envelope {
    TxEnvelope::Legacy(tx) => {
        // Handle legacy transaction
        process_legacy(tx)?;
    }
    TxEnvelope::Eip1559(tx) => {
        // Handle EIP-1559 transaction
        let max_fee = tx.max_fee_per_gas;
        let priority_fee = tx.max_priority_fee;
        process_eip1559(tx, max_fee, priority_fee)?;
    }
    TxEnvelope::Eip4844(tx) => {
        // Handle blob transaction
        let blob_hashes = tx.blob_versioned_hashes;
        process_blob_tx(tx, blob_hashes)?;
    }
}`}</pre>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}