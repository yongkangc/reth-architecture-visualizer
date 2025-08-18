"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Zap, TrendingUp, Database, Clock, 
  AlertTriangle, CheckCircle, Gauge
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PerformanceMetric {
  label: string
  withoutOptimization: number
  withOptimization: number
  unit: string
  color: string
}

export default function TriePerformanceComparison() {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({})
  const [showAnimation, setShowAnimation] = useState(false)

  const metrics: PerformanceMetric[] = [
    {
      label: "Nodes Traversed",
      withoutOptimization: 200000000,
      withOptimization: 1000,
      unit: "nodes",
      color: "from-red-500 to-orange-500"
    },
    {
      label: "Database Reads",
      withoutOptimization: 200000000,
      withOptimization: 1000,
      unit: "reads",
      color: "from-orange-500 to-yellow-500"
    },
    {
      label: "Time to Compute",
      withoutOptimization: 200000,
      withOptimization: 200,
      unit: "ms",
      color: "from-purple-500 to-pink-500"
    },
    {
      label: "Memory Usage",
      withoutOptimization: 32000,
      withOptimization: 128,
      unit: "MB",
      color: "from-blue-500 to-cyan-500"
    },
    {
      label: "Cache Efficiency",
      withoutOptimization: 0.001,
      withOptimization: 99.95,
      unit: "%",
      color: "from-green-500 to-emerald-500"
    }
  ]

  useEffect(() => {
    if (showAnimation) {
      metrics.forEach((metric, index) => {
        setTimeout(() => {
          const animateValue = (key: string, target: number) => {
            let current = 0
            const increment = target / 50
            const interval = setInterval(() => {
              current += increment
              if (current >= target) {
                current = target
                clearInterval(interval)
              }
              setAnimatedValues(prev => ({ ...prev, [key]: current }))
            }, 20)
          }
          
          animateValue(`${metric.label}-without`, metric.withoutOptimization)
          animateValue(`${metric.label}-with`, metric.withOptimization)
        }, index * 200)
      })
    }
  }, [showAnimation])

  const formatNumber = (num: number, unit: string) => {
    if (unit === "%" && num < 1) {
      return (num * 100).toFixed(3)
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(0) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K"
    }
    if (unit === "%") {
      return num.toFixed(1)
    }
    return num.toFixed(0)
  }

  const calculateImprovement = (before: number, after: number) => {
    if (before === 0) return 0
    const improvement = ((before - after) / before) * 100
    return improvement > 0 ? improvement : Math.abs(improvement)
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-yellow-500" />
            Performance Impact of Trie Walker Optimization
          </h3>
          <button
            onClick={() => setShowAnimation(!showAnimation)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
          >
            {showAnimation ? "Reset" : "Animate"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Without Optimization */}
          <div className="bg-zinc-950/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="font-semibold text-red-400">Without Trie Walker</h4>
            </div>
            
            <div className="space-y-3">
              {metrics.map(metric => (
                <div key={`without-${metric.label}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">{metric.label}</span>
                    <span className="font-mono text-red-400">
                      {formatNumber(
                        animatedValues[`${metric.label}-without`] || 0,
                        metric.unit
                      )} {metric.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: showAnimation ? "100%" : "0%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-red-500 to-red-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-xs text-red-400">
                ❌ Infeasible for real-time block validation
              </p>
            </div>
          </div>

          {/* With Optimization */}
          <div className="bg-zinc-950/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold text-green-400">With Trie Walker</h4>
            </div>
            
            <div className="space-y-3">
              {metrics.map(metric => (
                <div key={`with-${metric.label}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">{metric.label}</span>
                    <span className="font-mono text-green-400">
                      {formatNumber(
                        animatedValues[`${metric.label}-with`] || 0,
                        metric.unit
                      )} {metric.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: showAnimation 
                          ? `${(metric.withOptimization / metric.withoutOptimization) * 100}%` 
                          : "0%"
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-500 to-green-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-xs text-green-400">
                ✅ Meets MEV timing requirements (&lt;200ms)
              </p>
            </div>
          </div>
        </div>

        {/* Improvement Metrics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {metrics.map(metric => {
            const improvement = calculateImprovement(
              metric.withoutOptimization,
              metric.withOptimization
            )
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showAnimation ? 1 : 0, y: showAnimation ? 0 : 20 }}
                transition={{ delay: 1.5 }}
                className="bg-zinc-950/50 rounded-lg p-3 text-center"
              >
                <div className="text-2xl font-bold">
                  <span className={cn(
                    "bg-gradient-to-r bg-clip-text text-transparent",
                    metric.color
                  )}>
                    {improvement > 1000 ? `${(improvement / 1000).toFixed(0)}K` : improvement.toFixed(0)}x
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {metric.label === "Cache Efficiency" ? "Better" : "Faster"}
                </div>
                <div className="text-xs text-zinc-600">
                  {metric.label.split(" ")[0]}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Real-world Impact */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Real-World Impact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-950/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h4 className="font-semibold text-blue-400">Block Validation</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Enables validation within the 12-second slot time, with room for MEV building
            </p>
            <div className="mt-2 text-xs text-zinc-500">
              Target: &lt;4 seconds for MEV
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-purple-400" />
              <h4 className="font-semibold text-purple-400">I/O Reduction</h4>
            </div>
            <p className="text-sm text-zinc-400">
              99.99% fewer database reads means less disk wear and lower latency
            </p>
            <div className="mt-2 text-xs text-zinc-500">
              From 200M to ~1K reads
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h4 className="font-semibold text-yellow-400">Energy Efficiency</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Reduced computation means lower energy consumption per block
            </p>
            <div className="mt-2 text-xs text-zinc-500">
              ~1000x less CPU cycles
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Techniques */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Key Optimization Techniques
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-400 font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400">Prefix Set Tracking</h4>
              <p className="text-sm text-zinc-400">
                Track which parts of the trie have changed using a PrefixSet data structure
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-400 font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400">Hash Flag Checking</h4>
              <p className="text-sm text-zinc-400">
                Skip subtrees that have a valid hash and no changes in their prefix
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-400 font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400">Stack-based Traversal</h4>
              <p className="text-sm text-zinc-400">
                Maintain a stack of nodes to visit, allowing for efficient depth-first traversal
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-400 font-bold">4</span>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400">Intermediate State Handling</h4>
              <p className="text-sm text-zinc-400">
                Pause and resume computation at thresholds to maintain bounded memory usage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}