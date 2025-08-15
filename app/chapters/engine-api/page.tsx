"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw, CheckCircle, XCircle, AlertCircle, Zap, Clock, Activity, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"

type PayloadStatus = "idle" | "validating" | "executing" | "computing" | "success" | "invalid"

interface ValidationStep {
  id: string
  name: string
  description: string
  status: "pending" | "active" | "success" | "error"
  duration: number
  icon: React.ComponentType
}

const initialSteps: ValidationStep[] = [
  { id: "receive", name: "Receive Payload", description: "Engine API receives newPayloadV4 from CL", status: "pending", duration: 500, icon: Activity },
  { id: "decode", name: "Decode & Parse", description: "Parse execution payload and extract block data", status: "pending", duration: 300, icon: Cpu },
  { id: "validate-header", name: "Validate Header", description: "Check block header fields and parent hash", status: "pending", duration: 400, icon: CheckCircle },
  { id: "validate-body", name: "Validate Body", description: "Verify transactions and withdrawals", status: "pending", duration: 600, icon: CheckCircle },
  { id: "execute", name: "Execute Transactions", description: "Run EVM on all transactions sequentially", status: "pending", duration: 1500, icon: Zap },
  { id: "state-root", name: "Calculate State Root", description: "Compute Merkle Patricia Trie root", status: "pending", duration: 1200, icon: Activity },
  { id: "compare", name: "Compare Roots", description: "Verify calculated root matches header", status: "pending", duration: 300, icon: CheckCircle },
  { id: "respond", name: "Send Response", description: "Return VALID/INVALID/SYNCING status", status: "pending", duration: 200, icon: Activity },
]

export default function EngineAPIPage() {
  const [status, setStatus] = useState<PayloadStatus>("idle")
  const [steps, setSteps] = useState<ValidationStep[]>(initialSteps)
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1)

  const startSimulation = () => {
    setIsPlaying(true)
    setStatus("validating")
    setCurrentStep(0)
    
    let stepIndex = 0
    const runStep = () => {
      if (stepIndex >= steps.length) {
        setStatus("success")
        setIsPlaying(false)
        return
      }

      setSteps(prev => prev.map((step, i) => ({
        ...step,
        status: i === stepIndex ? "active" : i < stepIndex ? "success" : "pending"
      })))

      // Update overall status based on step
      if (stepIndex === 4) setStatus("executing")
      if (stepIndex === 5) setStatus("computing")

      setTimeout(() => {
        setSteps(prev => prev.map((step, i) => ({
          ...step,
          status: i === stepIndex ? "success" : step.status
        })))
        stepIndex++
        setCurrentStep(stepIndex)
        runStep()
      }, steps[stepIndex].duration / simulationSpeed)
    }

    runStep()
  }

  const resetSimulation = () => {
    setStatus("idle")
    setSteps(initialSteps)
    setCurrentStep(-1)
    setIsPlaying(false)
  }

  const getStatusGradient = () => {
    switch (status) {
      case "validating": return "from-yellow-500 to-orange-500"
      case "executing": return "from-blue-500 to-purple-500"
      case "computing": return "from-purple-500 to-pink-500"
      case "success": return "from-green-500 to-emerald-500"
      case "invalid": return "from-red-500 to-pink-500"
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Engine API Flow</h1>
              <p className="text-zinc-400">
                Understanding how Reth processes blocks through the Engine API
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visualization Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#627eea]/10 to-[#a16ae8]/10 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#627eea]" />
                Payload Processing Pipeline
              </h2>
              
              {/* Status Display */}
              <div className="mb-8">
                <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-950/50 to-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-400">Current Status</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        status === "idle" ? "bg-zinc-500" : "bg-gradient-to-r " + getStatusGradient()
                      )} />
                      <span className={cn(
                        "font-mono text-sm uppercase font-semibold",
                        "bg-gradient-to-r bg-clip-text text-transparent",
                        getStatusGradient()
                      )}>
                        {status}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800/50 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full bg-gradient-to-r", getStatusGradient())}
                      initial={{ width: "0%" }}
                      animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <AnimatePresence>
                  {steps.map((step, index) => {
                    const Icon = step.icon
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "relative p-4 rounded-xl transition-all duration-300",
                          step.status === "active" 
                            ? "bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border border-[#627eea]/50 shadow-lg shadow-[#627eea]/20"
                            : step.status === "success"
                            ? "bg-zinc-900/50 border border-green-900/50"
                            : "bg-zinc-950/50 border border-zinc-800 opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {step.status === "success" ? (
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            ) : step.status === "active" ? (
                              <motion.div
                                className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#627eea] to-[#a16ae8] flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <Icon className="w-4 h-4 text-white" />
                              </motion.div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-zinc-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={cn(
                                "font-semibold",
                                step.status === "active" ? "text-white" : "text-zinc-400"
                              )}>
                                {step.name}
                              </h3>
                              <span className="text-xs font-mono text-zinc-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.duration}ms
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">{step.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="mt-8 flex items-center gap-3">
                <button
                  onClick={isPlaying ? () => setIsPlaying(false) : startSimulation}
                  disabled={status === "success"}
                  className={cn(
                    "group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    !isPlaying && status !== "success" && "hover:scale-105"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#627eea] to-[#a16ae8]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#a16ae8] to-[#ff8867] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {isPlaying ? <Pause className="relative w-4 h-4" /> : <Play className="relative w-4 h-4" />}
                  <span className="relative">{isPlaying ? "Pause" : "Start Simulation"}</span>
                </button>
                
                <button
                  onClick={resetSimulation}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium border border-zinc-700 text-zinc-300 hover:bg-white/5 hover:border-zinc-600 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                
                <div className="flex-1" />
                
                <select
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm backdrop-blur-sm"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Code & Explanation Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Code Example */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#627eea]/5 to-[#a16ae8]/5 rounded-2xl blur-xl" />
              <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
                <h2 className="text-lg font-semibold mb-4">Implementation</h2>
                <div className="bg-black/50 rounded-xl border border-zinc-800 p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-zinc-300">
{`impl EngineApi {
    async fn new_payload_v4(
        &self,
        payload: ExecutionPayload,
    ) -> PayloadStatus {
        // 1. Decode and validate header
        let block = payload.decode()?;
        block.validate_header()?;
        
        // 2. Execute transactions
        let outcome = self.executor
            .execute_block(&block)?;
        
        // 3. Calculate state root
        let state_root = self.trie
            .calculate_root(outcome.state)?;
        
        // 4. Compare with header
        if state_root != block.state_root {
            return PayloadStatus::Invalid;
        }
        
        PayloadStatus::Valid
    }
}`}</pre>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Block Validation", value: "5-10", unit: "ms", color: "from-green-500 to-emerald-500" },
                { label: "TX Execution", value: "50-200", unit: "ms", color: "from-blue-500 to-purple-500" },
                { label: "State Root", value: "30-100", unit: "ms", color: "from-purple-500 to-pink-500" },
                { label: "Total Time", value: "85-310", unit: "ms", color: "from-orange-500 to-red-500" },
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                  <div className="relative p-4 rounded-xl bg-gradient-to-b from-zinc-900/50 to-zinc-900/30 border border-zinc-800 backdrop-blur-sm">
                    <p className="text-xs text-zinc-500 mb-1">{metric.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                        metric.color
                      )}>
                        {metric.value}
                      </span>
                      <span className="text-sm text-zinc-400">{metric.unit}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}