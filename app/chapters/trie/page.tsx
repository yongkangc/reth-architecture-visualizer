"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  TreePine, ChevronRight, Layers, Zap, Code2, 
  BookOpen, ArrowRight, Info
} from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

// Dynamically import components to avoid SSR issues
const TrieStructureVisualization = dynamic(
  () => import("@/components/visualizations/trie/TrieStructureVisualization"),
  { ssr: false }
)
const TriePerformanceComparison = dynamic(
  () => import("@/components/visualizations/trie/TriePerformanceComparison"),
  { ssr: false }
)
const TrieCodeExamples = dynamic(
  () => import("@/components/visualizations/trie/TrieCodeExamples"),
  { ssr: false }
)

// Import the existing walker visualization
const TrieWalkerVisualization = dynamic(
  () => import("./walker-only"),
  { ssr: false }
)

// Import the new simulation component
const TrieSimulation = dynamic(
  () => import("@/components/visualizations/trie/TrieSimulation"),
  { ssr: false }
)

// Import the proof calculation component
const ProofCalculation = dynamic(
  () => import("@/components/visualizations/trie/ProofCalculation"),
  { ssr: false }
)

// Import the sparse trie visualization
const SparseTrieVisualization = dynamic(
  () => import("@/components/visualizations/trie/SparseTrieVisualization"),
  { ssr: false }
)

// Import the RLP encoding visualization
const RLPEncodingVisualization = dynamic(
  () => import("@/components/visualizations/trie/RLPEncodingVisualization"),
  { ssr: false }
)

type TabType = "overview" | "structure" | "simulation" | "sparse" | "walker" | "performance" | "proof" | "rlp" | "code"

export default function EnhancedTriePage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BookOpen },
    { id: "structure" as TabType, label: "Structure", icon: Layers },
    { id: "simulation" as TabType, label: "Simulation", icon: TreePine },
    { id: "sparse" as TabType, label: "Sparse Trie", icon: Zap },
    { id: "walker" as TabType, label: "Walker", icon: TreePine },
    { id: "performance" as TabType, label: "Performance", icon: Zap },
    { id: "proof" as TabType, label: "Proof", icon: Code2 },
    { id: "rlp" as TabType, label: "RLP", icon: Code2 },
    { id: "code" as TabType, label: "Code", icon: Code2 }
  ]

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Merkle Patricia Trie Deep Dive
              </h1>
              <p className="text-zinc-400">
                Understanding Reth&apos;s trie implementation and optimizations
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/chapters/state-root" className="hover:text-zinc-300 transition-colors">
              State Root
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-zinc-300">Trie Architecture</span>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Insights */}
              <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Info className="w-6 h-6 text-teal-400" />
                  The Trie Challenge in Ethereum
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-teal-300 mb-3">The Problem</h3>
                    <ul className="space-y-2 text-zinc-300">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>Ethereum state contains ~200 million accounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>Each account can have millions of storage slots</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>State root must be computed for every block</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>Naive traversal would take 200+ seconds</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-cyan-300 mb-3">Reth&apos;s Solution</h3>
                    <ul className="space-y-2 text-zinc-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>TrieWalker skips 99.99% of unchanged nodes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>PrefixSet tracks exactly what changed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>Parallel computation for independent subtries</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>Result: 100-300ms state root computation</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Architecture Overview */}
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <h3 className="text-xl font-bold mb-4">Trie Architecture Components</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-950/50 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-400 mb-2">Node Types</h4>
                    <p className="text-sm text-zinc-400">
                      Branch, Extension, and Leaf nodes form the trie structure. 
                      Each optimized for different access patterns.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-950/50 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-400 mb-2">Walker System</h4>
                    <p className="text-sm text-zinc-400">
                      Stack-based traversal with skip optimization. 
                      Maintains state for efficient depth-first search.
                    </p>
                  </div>
                  
                  <div className="bg-zinc-950/50 rounded-xl p-4">
                    <h4 className="font-semibold text-green-400 mb-2">Hash Builder</h4>
                    <p className="text-sm text-zinc-400">
                      Incrementally builds Merkle proofs. 
                      Reuses existing hashes for unchanged subtrees.
                    </p>
                  </div>
                </div>
              </div>

              {/* Learning Path */}
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <h3 className="text-xl font-bold mb-4">Learning Path</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab("structure")}
                    className="w-full p-4 bg-zinc-950/50 rounded-xl hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">1. Understand Trie Structure</h4>
                          <p className="text-sm text-zinc-400">Learn about node types and how they connect</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("simulation")}
                    className="w-full p-4 bg-zinc-950/50 rounded-xl hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <TreePine className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">2. Interactive Simulation</h4>
                          <p className="text-sm text-zinc-400">Try insert, search, and delete operations</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("walker")}
                    className="w-full p-4 bg-zinc-950/50 rounded-xl hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <TreePine className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">3. Explore Walker Algorithm</h4>
                          <p className="text-sm text-zinc-400">See the skip optimization in action</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("performance")}
                    className="w-full p-4 bg-zinc-950/50 rounded-xl hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">4. Analyze Performance Impact</h4>
                          <p className="text-sm text-zinc-400">Compare with and without optimization</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab("code")}
                    className="w-full p-4 bg-zinc-950/50 rounded-xl hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Code2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">4. Study Implementation</h4>
                          <p className="text-sm text-zinc-400">Review actual Reth code examples</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "structure" && <TrieStructureVisualization />}
          
          {activeTab === "simulation" && <TrieSimulation />}
          
          {activeTab === "sparse" && <SparseTrieVisualization />}
          
          {activeTab === "walker" && <TrieWalkerVisualization />}
          
          {activeTab === "performance" && <TriePerformanceComparison />}
          
          {activeTab === "proof" && <ProofCalculation />}
          
          {activeTab === "rlp" && <RLPEncodingVisualization />}
          
          {activeTab === "code" && <TrieCodeExamples />}
        </motion.div>
      </div>
    </div>
  )
}