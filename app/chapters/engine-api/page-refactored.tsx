"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import GlassCard from "@/components/ui/cards/GlassCard"
import SimulationControls from "@/components/ui/buttons/SimulationControls"
import ValidationPipeline from "@/components/visualizations/engine-api/ValidationPipeline"
import StatusDisplay from "@/components/visualizations/engine-api/StatusDisplay"
import MetricCard from "@/components/ui/metrics/MetricCard"
import { useSimulation } from "@/lib/hooks/useSimulation"
import { INITIAL_VALIDATION_STEPS } from "@/lib/constants"
import type { ValidationStep, PayloadStatus } from "@/lib/types"

export default function EngineAPIPage() {
  const [status, setStatus] = useState<PayloadStatus>("idle")
  const [steps, setSteps] = useState<ValidationStep[]>(INITIAL_VALIDATION_STEPS)
  const [currentStep, setCurrentStep] = useState<number>(-1)
  
  const simulateStep = async () => {
    const nextStep = currentStep + 1
    
    if (nextStep >= steps.length) {
      setStatus("success")
      simulation.pause()
      return
    }

    setCurrentStep(nextStep)
    setStatus(nextStep === 0 ? "validating" : nextStep === 4 ? "executing" : nextStep === 5 ? "computing" : status)
    
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === nextStep ? "active" : i < nextStep ? "success" : "pending"
    })))

    await new Promise(r => setTimeout(r, steps[nextStep].duration / simulation.speed))
    
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      status: i === nextStep ? "success" : step.status
    })))
  }

  const resetSimulation = () => {
    setStatus("idle")
    setSteps(INITIAL_VALIDATION_STEPS)
    setCurrentStep(-1)
    simulation.reset()
  }

  const simulation = useSimulation({
    onStep: simulateStep,
    interval: 1000
  })

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#141414] via-[#1a1a2e] to-[#141414] p-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visualization Panel */}
          <GlassCard>
            <h2 className="text-lg font-semibold mb-4">Payload Processing Pipeline</h2>
            
            <StatusDisplay status={status} progress={progress} />
            <ValidationPipeline steps={steps} currentStep={currentStep} />
            
            <div className="mt-6">
              <SimulationControls
                isPlaying={simulation.isPlaying}
                onPlay={simulation.start}
                onPause={simulation.pause}
                onReset={resetSimulation}
                speed={simulation.speed}
                onSpeedChange={simulation.setSpeed}
                disabled={status === "success"}
              />
            </div>
          </GlassCard>

          {/* Code & Metrics Panel */}
          <GlassCard delay={0.1}>
            <h2 className="text-lg font-semibold mb-4">Implementation Details</h2>
            
            {/* Code Example */}
            <div className="bg-black rounded-lg border border-zinc-800 p-4 mb-4">
              <div className="text-xs font-mono text-zinc-500 mb-2">{`// Engine API Handler`}</div>
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

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard 
                label="Block Validation" 
                value="5-10" 
                unit="ms"
                color="text-green-400"
              />
              <MetricCard 
                label="Transaction Execution" 
                value="50-200" 
                unit="ms"
                color="text-blue-400"
              />
              <MetricCard 
                label="State Root Calculation" 
                value="30-100" 
                unit="ms"
                color="text-purple-400"
              />
              <MetricCard 
                label="Total Processing" 
                value="85-310" 
                unit="ms"
                color="text-orange-400"
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}