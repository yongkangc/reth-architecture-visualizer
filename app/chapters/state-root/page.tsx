"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Zap, GitBranch, Activity, ChevronRight, 
  Layers, Play, Pause, RotateCcw, Terminal,
  CheckCircle, XCircle, ArrowDown, Gauge,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

type Strategy = "sparse" | "parallel" | "sequential"
type ScenarioType = "small-block" | "large-block" | "cache-hot" | "cache-cold"
type DecisionStep = {
  id: string
  text: string
  type: "check" | "decision" | "result" | "metric"
  icon?: LucideIcon
  color?: string
  value?: string | number
}

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
  const [decisionSteps, setDecisionSteps] = useState<DecisionStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [showCursor, setShowCursor] = useState(true)

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const generateDecisionFlow = (scenario: Scenario): DecisionStep[] => {
    const steps: DecisionStep[] = [
      { 
        id: "init", 
        text: "$ reth_state_root --analyze", 
        type: "check",
        icon: Terminal,
        color: "text-zinc-400"
      },
      { 
        id: "check-cache", 
        text: "→ Checking sparse trie cache...", 
        type: "check",
        color: "text-yellow-400"
      },
      { 
        id: "cache-result",
        text: scenario.cacheState === "hot" 
          ? "✓ Cache HIT - Found recent trie state" 
          : "✗ Cache MISS - No recent state available",
        type: scenario.cacheState === "hot" ? "result" : "decision",
        icon: scenario.cacheState === "hot" ? CheckCircle : XCircle,
        color: scenario.cacheState === "hot" ? "text-green-400" : "text-red-400"
      }
    ]

    if (scenario.cacheState === "hot") {
      steps.push(
        { 
          id: "sparse-selected", 
          text: "→ Strategy selected: SPARSE_ROOT", 
          type: "result",
          color: "text-green-400"
        },
        { 
          id: "sparse-metrics", 
          text: "  └─ Expected time: <10ms", 
          type: "metric",
          color: "text-green-300"
        }
      )
    } else {
      steps.push(
        { 
          id: "check-size", 
          text: `→ Analyzing block size: ${scenario.blockSize} transactions`, 
          type: "check",
          color: "text-yellow-400"
        },
        { 
          id: "size-threshold", 
          text: `  └─ Threshold check: ${scenario.blockSize} ${scenario.blockSize > 100 ? '>' : '<'} 100`, 
          type: "metric",
          color: "text-cyan-400"
        }
      )

      if (scenario.blockSize > 100) {
        steps.push(
          { 
            id: "parallel-selected", 
            text: "→ Strategy selected: PARALLEL_COMPUTATION", 
            type: "result",
            color: "text-purple-400"
          },
          { 
            id: "parallel-cores", 
            text: "  ├─ Distributing across 16 CPU cores", 
            type: "metric",
            color: "text-purple-300"
          },
          { 
            id: "parallel-time", 
            text: `  └─ Expected time: ~${Math.round(scenario.blockSize * 0.1)}ms`, 
            type: "metric",
            color: "text-purple-300"
          }
        )
      } else {
        steps.push(
          { 
            id: "sequential-selected", 
            text: "→ Strategy selected: SEQUENTIAL_FALLBACK", 
            type: "result",
            color: "text-blue-400"
          },
          { 
            id: "sequential-reason", 
            text: "  └─ Small block - overhead not justified", 
            type: "metric",
            color: "text-blue-300"
          }
        )
      }
    }

    steps.push(
      { 
        id: "complete", 
        text: "✓ Decision complete - executing strategy", 
        type: "result",
        icon: CheckCircle,
        color: "text-green-400"
      }
    )

    return steps
  }

  const simulateDecision = async () => {
    setIsSimulating(true)
    setDecisionSteps([])
    setCurrentStep(-1)
    setActiveStrategy(null)
    setMetrics(null)

    const steps = generateDecisionFlow(selectedScenario)
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600))
      setDecisionSteps(prev => [...prev, steps[i]])
      setCurrentStep(i)
      
      // Set active strategy when selected
      if (steps[i].id.includes("-selected")) {
        if (steps[i].id === "sparse-selected") setActiveStrategy("sparse")
        else if (steps[i].id === "parallel-selected") setActiveStrategy("parallel")
        else if (steps[i].id === "sequential-selected") setActiveStrategy("sequential")
      }
      
      // Set metrics on completion
      if (steps[i].id === "complete") {
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
    setDecisionSteps([])
    setCurrentStep(-1)
    setIsSimulating(false)
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">
                State Root Computation Strategies
              </h1>
              <p className="text-zinc-400">
                Adaptive three-tier approach for optimal performance
              </p>
            </div>
          </div>
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
                  "p-4 rounded-xl border-2 transition-all",
                  selectedScenario.id === scenario.id
                    ? "border-[#627eea] bg-gradient-to-br from-[#627eea]/10 to-[#a16ae8]/10 shadow-lg"
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
          {/* Decision Flow Terminal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
            <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-950/80 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-mono text-zinc-400">reth_decision_engine</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
              </div>
              
              <div className="p-6 font-mono text-sm bg-black/80 min-h-[400px]">
                <AnimatePresence mode="popLayout">
                  {decisionSteps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={cn("mb-2", step.color)}
                    >
                      <div className="flex items-center gap-2">
                        {step.icon && <step.icon className="w-4 h-4" />}
                        <span>{step.text}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Blinking cursor */}
                {isSimulating && showCursor && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-block w-2 h-4 bg-zinc-400"
                  />
                )}
                
                {!isSimulating && decisionSteps.length === 0 && (
                  <div className="text-zinc-600">
                    <span>$ Ready to analyze scenario...</span>
                    {showCursor && <span className="inline-block w-2 h-4 bg-zinc-600 ml-1" />}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="px-6 pb-6 flex items-center gap-3">
                <button
                  onClick={isSimulating ? () => setIsSimulating(false) : simulateDecision}
                  disabled={isSimulating && currentStep < 2}
                  className={cn(
                    "group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#627eea] to-[#a16ae8]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#a16ae8] to-[#ff8867] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {isSimulating ? <Pause className="relative w-4 h-4" /> : <Play className="relative w-4 h-4" />}
                  <span className="relative text-sm">{isSimulating ? "Running" : "Run Decision"}</span>
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

          {/* Strategy Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Active Strategy Display */}
            {activeStrategy && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div className={cn(
                  "absolute inset-0 rounded-2xl blur-xl bg-gradient-to-br",
                  strategyInfo[activeStrategy].color.replace("from-", "from-").replace("to-", "/20 to-") + "/20"
                )} />
                <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                      strategyInfo[activeStrategy].color
                    )}>
                      <strategyInfo[activeStrategy].icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {strategyInfo[activeStrategy].name}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-4">
                        {strategyInfo[activeStrategy].description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-green-400 mb-2">PROS</h4>
                          <ul className="space-y-1">
                            {strategyInfo[activeStrategy].pros.map((pro, i) => (
                              <li key={i} className="text-xs text-zinc-300 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-400" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-red-400 mb-2">CONS</h4>
                          <ul className="space-y-1">
                            {strategyInfo[activeStrategy].cons.map((con, i) => (
                              <li key={i} className="text-xs text-zinc-300 flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-400" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Metrics Display */}
            {metrics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-zinc-400">Execution Time</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {metrics.executionTime}ms
                  </div>
                </div>
                
                <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-zinc-400">CPU Usage</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-500">
                    {metrics.cpuUsage}%
                  </div>
                </div>
                
                <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-zinc-400">DB Reads</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-500">
                    {metrics.dbReads.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-zinc-400">Cache Hit Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    {metrics.cacheHitRate}%
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Strategy Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {Object.entries(strategyInfo).map(([key, strategy]) => {
            const Icon = strategy.icon
            const isActive = activeStrategy === key
            
            return (
              <div
                key={key}
                className={cn(
                  "relative rounded-2xl border transition-all duration-500",
                  isActive
                    ? "border-[#627eea]/50 shadow-lg shadow-[#627eea]/20"
                    : "border-zinc-800"
                )}
              >
                {isActive && (
                  <div className={cn(
                    "absolute inset-0 rounded-2xl blur-xl bg-gradient-to-br opacity-20",
                    strategy.color
                  )} />
                )}
                <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                      strategy.color
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">{strategy.name}</h3>
                  </div>
                  <p className="text-sm text-zinc-400">{strategy.description}</p>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}