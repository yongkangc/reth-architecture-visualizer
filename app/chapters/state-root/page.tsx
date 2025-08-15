"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, Database, GitBranch, Activity, ChevronRight, 
  Clock, Cpu, HardDrive, AlertTriangle, CheckCircle2,
  Layers, Play, Pause, RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import PageContainer from "@/components/ui/PageContainer"

type Strategy = "sparse" | "parallel" | "sequential"
type ScenarioType = "small-block" | "large-block" | "cache-hot" | "cache-cold"

interface StrategyMetrics {
  strategy: Strategy
  executionTime: number
  dbReads: number
  cpuUsage: number
  cacheHitRate: number
  recommendation: string
}

interface Scenario {
  id: ScenarioType
  name: string
  description: string
  blockSize: number
  cacheState: "hot" | "cold"
  expectedStrategy: Strategy
}

const scenarios: Scenario[] = [
  {
    id: "cache-hot",
    name: "Cache Hot Path",
    description: "Recent blocks with warm cache",
    blockSize: 150,
    cacheState: "hot",
    expectedStrategy: "sparse"
  },
  {
    id: "large-block",
    name: "Large Block",
    description: "Full block with many transactions",
    blockSize: 500,
    cacheState: "cold",
    expectedStrategy: "parallel"
  },
  {
    id: "small-block",
    name: "Small Block",
    description: "Few transactions, simple state",
    blockSize: 50,
    cacheState: "cold",
    expectedStrategy: "sequential"
  },
  {
    id: "cache-cold",
    name: "Cold Start",
    description: "First block after restart",
    blockSize: 200,
    cacheState: "cold",
    expectedStrategy: "parallel"
  }
]

const strategyInfo = {
  sparse: {
    name: "Sparse Root",
    color: "from-green-500 to-emerald-500",
    icon: Zap,
    description: "Uses cached sparse trie for fastest computation",
    pros: ["Minimal DB reads", "Sub-10ms execution", "Memory efficient"],
    cons: ["Requires warm cache", "Limited to recent blocks"]
  },
  parallel: {
    name: "Parallel Strategy",
    color: "from-purple-500 to-pink-500",
    icon: GitBranch,
    description: "Distributes computation across CPU cores",
    pros: ["Scales with cores", "Good for large blocks", "Consistent performance"],
    cons: ["Higher CPU usage", "More complex coordination"]
  },
  sequential: {
    name: "Sequential Fallback",
    color: "from-blue-500 to-cyan-500",
    icon: Layers,
    description: "Traditional single-threaded approach",
    pros: ["Simple and reliable", "Low overhead", "Predictable"],
    cons: ["Slower for large blocks", "No parallelization"]
  }
}

export default function StateRootPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0])
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [metrics, setMetrics] = useState<StrategyMetrics | null>(null)
  const [decisionPath, setDecisionPath] = useState<string[]>([])

  const simulateDecision = async () => {
    setIsSimulating(true)
    setDecisionPath([])
    setActiveStrategy(null)
    setMetrics(null)

    const steps = [
      "Check sparse trie cache",
      selectedScenario.cacheState === "hot" ? "Cache HIT ✓" : "Cache MISS ✗",
      selectedScenario.cacheState === "hot" ? "Use Sparse Root" : "Evaluate block size",
      selectedScenario.cacheState === "cold" && selectedScenario.blockSize > 100 ? "Large block detected" : "Small block detected",
      selectedScenario.cacheState === "cold" && selectedScenario.blockSize > 100 ? "Use Parallel Strategy" : "Use Sequential Strategy"
    ]

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 500))
      setDecisionPath(prev => [...prev, steps[i]])
      
      if (i === steps.length - 1) {
        setActiveStrategy(selectedScenario.expectedStrategy)
        
        // Calculate metrics based on strategy
        const baseTime = selectedScenario.blockSize * 0.2
        const strategyMultiplier = {
          sparse: 0.1,
          parallel: 0.5,
          sequential: 1.0
        }
        
        setMetrics({
          strategy: selectedScenario.expectedStrategy,
          executionTime: Math.round(baseTime * strategyMultiplier[selectedScenario.expectedStrategy]),
          dbReads: selectedScenario.expectedStrategy === "sparse" ? 10 : selectedScenario.blockSize * 2,
          cpuUsage: selectedScenario.expectedStrategy === "parallel" ? 85 : 25,
          cacheHitRate: selectedScenario.cacheState === "hot" ? 95 : 15,
          recommendation: `Optimal for ${selectedScenario.name.toLowerCase()}`
        })
      }
    }

    setIsSimulating(false)
  }

  const resetSimulation = () => {
    setActiveStrategy(null)
    setMetrics(null)
    setDecisionPath([])
    setIsSimulating(false)
  }

  return (
    <PageContainer>
        {/* Header with gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            State Root Computation Strategies
          </h1>
          <p className="text-xl text-zinc-400">
            Adaptive three-tier approach for optimal performance
          </p>
        </motion.div>

        {/* Scenario Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4 text-zinc-300">Select Scenario</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario)
                  resetSimulation()
                }}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all card-hover",
                  selectedScenario.id === scenario.id
                    ? "border-[var(--eth-purple)] bg-[var(--eth-purple)]/10 shadow-lg shadow-[var(--eth-purple)]/20"
                    : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                )}
              >
                <h3 className="font-semibold text-white mb-1">{scenario.name}</h3>
                <p className="text-xs text-zinc-400 mb-2">{scenario.description}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Size: {scenario.blockSize} txs</span>
                  <span className={cn(
                    "font-mono",
                    scenario.cacheState === "hot" ? "text-green-400" : "text-orange-400"
                  )}>
                    {scenario.cacheState.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Decision Tree Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--eth-purple)]" />
              Decision Flow
            </h2>

            {/* Decision Path */}
            <div className="space-y-3 mb-6 min-h-[300px]">
              <AnimatePresence mode="popLayout">
                {decisionPath.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      step.includes("✓") ? "bg-green-500/10 border border-green-500/30" :
                      step.includes("✗") ? "bg-red-500/10 border border-red-500/30" :
                      "bg-zinc-800/50 border border-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono",
                      step.includes("✓") ? "bg-green-500/20 text-green-400" :
                      step.includes("✗") ? "bg-red-500/20 text-red-400" :
                      "bg-zinc-700 text-zinc-400"
                    )}>
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                    {index < decisionPath.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-zinc-500 ml-auto" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={simulateDecision}
                disabled={isSimulating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--eth-purple)] to-[var(--eth-pink)] rounded-lg font-medium hover:shadow-lg hover:shadow-[var(--eth-purple)]/25 transition-all disabled:opacity-50"
              >
                {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isSimulating ? "Simulating..." : "Run Decision"}
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </motion.div>

          {/* Strategy Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--eth-purple)]" />
              Strategy Analysis
            </h2>

            <div className="space-y-4">
              {Object.entries(strategyInfo).map(([key, info]) => {
                const Icon = info.icon
                const isActive = activeStrategy === key
                
                return (
                  <motion.div
                    key={key}
                    animate={{
                      scale: isActive ? 1.02 : 1,
                      opacity: activeStrategy === null || isActive ? 1 : 0.5
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      isActive 
                        ? "border-[var(--eth-purple)] bg-[var(--eth-purple)]/10 shadow-lg shadow-[var(--eth-purple)]/20"
                        : "border-zinc-700 bg-zinc-800/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        info.color
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{info.name}</h3>
                        <p className="text-xs text-zinc-400 mb-2">{info.description}</p>
                        
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 pt-3 border-t border-zinc-700"
                          >
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-green-400 font-medium mb-1">Advantages</p>
                                {info.pros.map((pro, i) => (
                                  <p key={i} className="text-zinc-400">• {pro}</p>
                                ))}
                              </div>
                              <div>
                                <p className="text-orange-400 font-medium mb-1">Trade-offs</p>
                                {info.cons.map((con, i) => (
                                  <p key={i} className="text-zinc-400">• {con}</p>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <AnimatePresence>
          {metrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 glass rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--eth-purple)]" />
                Performance Metrics
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">Execution Time</p>
                  <p className="text-2xl font-bold text-green-400">{metrics.executionTime}ms</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">DB Reads</p>
                  <p className="text-2xl font-bold text-blue-400">{metrics.dbReads}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">CPU Usage</p>
                  <p className="text-2xl font-bold text-purple-400">{metrics.cpuUsage}%</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-1">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-orange-400">{metrics.cacheHitRate}%</p>
                </div>
                <div className="bg-gradient-to-br from-[var(--eth-purple)] to-[var(--eth-pink)] rounded-lg p-4">
                  <p className="text-xs text-white/80 mb-1">Recommendation</p>
                  <p className="text-sm font-semibold text-white">{metrics.recommendation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </PageContainer>
  )
}