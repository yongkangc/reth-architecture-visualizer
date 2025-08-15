"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw, CheckCircle, XCircle, AlertCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type PayloadStatus = "idle" | "validating" | "executing" | "computing" | "success" | "invalid"

interface ValidationStep {
  id: string
  name: string
  description: string
  status: "pending" | "active" | "success" | "error"
  duration: number
}

const initialSteps: ValidationStep[] = [
  { id: "receive", name: "Receive Payload", description: "Engine API receives newPayloadV4 from CL", status: "pending", duration: 500 },
  { id: "decode", name: "Decode & Parse", description: "Parse execution payload and extract block data", status: "pending", duration: 300 },
  { id: "validate-header", name: "Validate Header", description: "Check block header fields and parent hash", status: "pending", duration: 400 },
  { id: "validate-body", name: "Validate Body", description: "Verify transactions and withdrawals", status: "pending", duration: 600 },
  { id: "execute", name: "Execute Transactions", description: "Run EVM on all transactions sequentially", status: "pending", duration: 1500 },
  { id: "state-root", name: "Calculate State Root", description: "Compute Merkle Patricia Trie root", status: "pending", duration: 1200 },
  { id: "compare", name: "Compare Roots", description: "Verify calculated root matches header", status: "pending", duration: 300 },
  { id: "respond", name: "Send Response", description: "Return VALID/INVALID/SYNCING status", status: "pending", duration: 200 },
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

  const getStatusColor = () => {
    switch (status) {
      case "idle": return "text-zinc-500"
      case "validating": return "text-yellow-500"
      case "executing": return "text-blue-500"
      case "computing": return "text-purple-500"
      case "success": return "text-green-500"
      case "invalid": return "text-red-500"
      default: return "text-zinc-500"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Engine API Flow</h1>
          <p className="text-zinc-400">
            Understanding how Reth processes blocks through the Engine API
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visualization Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-950 rounded-xl border border-zinc-800 p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Payload Processing Pipeline</h2>
            
            {/* Status Display */}
            <div className="mb-6 p-4 bg-black rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500">Current Status</span>
                <span className={cn("font-mono text-sm uppercase", getStatusColor())}>
                  {status}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    step.status === "active" 
                      ? "bg-zinc-900 border-orange-500 shadow-lg shadow-orange-500/20"
                      : step.status === "success"
                      ? "bg-zinc-950/50 border-green-900"
                      : "bg-zinc-950/50 border-zinc-800"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {step.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : step.status === "active" ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                        </motion.div>
                      ) : step.status === "error" ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "font-medium",
                          step.status === "active" ? "text-white" : "text-zinc-400"
                        )}>
                          {step.name}
                        </h3>
                        <span className="text-xs font-mono text-zinc-600">
                          {step.duration}ms
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={isPlaying ? () => setIsPlaying(false) : startSimulation}
                disabled={status === "success"}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Pause" : "Start"}
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <div className="flex-1" />
              <select
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
              >
                <option value={0.5}>0.5x Speed</option>
                <option value={1}>1x Speed</option>
                <option value={2}>2x Speed</option>
                <option value={4}>4x Speed</option>
              </select>
            </div>
          </motion.div>

          {/* Code & Explanation Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-950 rounded-xl border border-zinc-800 p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Implementation Details</h2>
            
            <div className="space-y-4">
              {/* Code Example */}
              <div className="bg-black rounded-lg border border-zinc-800 p-4">
                <div className="text-xs font-mono text-zinc-500 mb-2">// Engine API Handler</div>
                <pre className="text-xs font-mono text-zinc-300 overflow-x-auto">
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

              {/* Key Concepts */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Key Concepts</h3>
                
                <div className="space-y-2">
                  <div className="p-3 bg-zinc-900 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Payload Validation</h4>
                    <p className="text-xs text-zinc-500">
                      Ensures block follows consensus rules and parent exists
                    </p>
                  </div>
                  
                  <div className="p-3 bg-zinc-900 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Transaction Execution</h4>
                    <p className="text-xs text-zinc-500">
                      Sequentially processes transactions using EVM
                    </p>
                  </div>
                  
                  <div className="p-3 bg-zinc-900 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">State Root Verification</h4>
                    <p className="text-xs text-zinc-500">
                      Confirms computed state matches block header
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-4 bg-zinc-900 rounded-lg">
                <h3 className="font-medium text-sm mb-3">Typical Performance</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Block Validation</span>
                    <span className="font-mono">~5-10ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Transaction Execution</span>
                    <span className="font-mono">~50-200ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">State Root Calculation</span>
                    <span className="font-mono">~30-100ms</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-2 flex justify-between font-medium">
                    <span className="text-zinc-400">Total Processing Time</span>
                    <span className="font-mono text-orange-500">~85-310ms</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}