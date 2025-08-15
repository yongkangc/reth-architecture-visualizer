"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TreePine, ChevronRight, ChevronDown, Hash, 
  SkipForward, Play, Pause, RotateCcw, Layers,
  Database, Cpu, Zap, Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import PageContainer from "@/components/ui/PageContainer"

interface TrieNode {
  id: string
  type: "branch" | "extension" | "leaf" | "hash"
  path: string
  value?: string
  children?: TrieNode[]
  isExpanded?: boolean
  isVisited?: boolean
  isSkipped?: boolean
}

const sampleTrie: TrieNode = {
  id: "root",
  type: "branch",
  path: "",
  isExpanded: true,
  children: [
    {
      id: "n1",
      type: "extension",
      path: "a7",
      children: [
        {
          id: "n11",
          type: "branch",
          path: "a7",
          children: [
            {
              id: "n111",
              type: "leaf",
              path: "a7f3",
              value: "value1"
            },
            {
              id: "n112",
              type: "leaf",
              path: "a7b2",
              value: "value2"
            }
          ]
        }
      ]
    },
    {
      id: "n2",
      type: "branch",
      path: "b",
      children: [
        {
          id: "n21",
          type: "hash",
          path: "b5",
          value: "0x1234...abcd"
        },
        {
          id: "n22",
          type: "extension",
          path: "b8",
          children: [
            {
              id: "n221",
              type: "leaf",
              path: "b8c1",
              value: "value3"
            }
          ]
        }
      ]
    },
    {
      id: "n3",
      type: "hash",
      path: "c",
      value: "0x5678...efgh"
    }
  ]
}

interface WalkerState {
  stack: string[]
  currentNode: string | null
  visitedNodes: Set<string>
  skippedNodes: Set<string>
  decision: string
  stats: {
    nodesVisited: number
    nodesSkipped: number
    dbReads: number
    cacheHits: number
  }
}

export default function TriePage() {
  const [trie, setTrie] = useState<TrieNode>(sampleTrie)
  const [walkerState, setWalkerState] = useState<WalkerState>({
    stack: [],
    currentNode: null,
    visitedNodes: new Set(),
    skippedNodes: new Set(),
    decision: "Starting traversal...",
    stats: {
      nodesVisited: 0,
      nodesSkipped: 0,
      dbReads: 0,
      cacheHits: 0
    }
  })
  const [isWalking, setIsWalking] = useState(false)
  const [walkSpeed, setWalkSpeed] = useState(1000)
  const [targetPath, setTargetPath] = useState("a7f3")

  const walkStep = async () => {
    // Simulate one step of the trie walker algorithm
    setWalkerState(prev => {
      const newState = { ...prev }
      
      if (newState.stack.length === 0 && !newState.currentNode) {
        // Initialize
        newState.stack = ["root"]
        newState.currentNode = "root"
        newState.decision = "Starting from root node"
        return newState
      }

      // Pop from stack
      const nodeId = newState.stack.pop()
      if (!nodeId) {
        newState.decision = "Traversal complete"
        setIsWalking(false)
        return newState
      }

      newState.currentNode = nodeId
      newState.visitedNodes.add(nodeId)
      newState.stats.nodesVisited++
      
      // Find node in trie
      const node = findNode(trie, nodeId)
      if (!node) return newState

      // Decision logic based on node type
      if (node.type === "hash") {
        newState.decision = `Skipping hash node ${node.path} - already processed`
        newState.skippedNodes.add(nodeId)
        newState.stats.nodesSkipped++
        newState.stats.cacheHits++
      } else if (node.type === "leaf") {
        newState.decision = `Found leaf at ${node.path} with value: ${node.value}`
        newState.stats.dbReads++
      } else if (node.type === "extension") {
        newState.decision = `Following extension path ${node.path}`
        // Add children to stack
        node.children?.forEach(child => {
          newState.stack.push(child.id)
        })
      } else if (node.type === "branch") {
        newState.decision = `Exploring branch at ${node.path}`
        // Add children in reverse order for DFS
        node.children?.reverse().forEach(child => {
          // Skip optimization: don't add hash nodes if we have their value
          if (child.type !== "hash" || !targetPath.startsWith(child.path)) {
            newState.stack.push(child.id)
          }
        })
        newState.stats.dbReads++
      }

      return newState
    })
  }

  const findNode = (node: TrieNode, id: string): TrieNode | null => {
    if (node.id === id) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, id)
        if (found) return found
      }
    }
    return null
  }

  const startWalking = async () => {
    setIsWalking(true)
    while (isWalking) {
      await walkStep()
      await new Promise(r => setTimeout(r, walkSpeed))
    }
  }

  const resetWalker = () => {
    setIsWalking(false)
    setWalkerState({
      stack: [],
      currentNode: null,
      visitedNodes: new Set(),
      skippedNodes: new Set(),
      decision: "Starting traversal...",
      stats: {
        nodesVisited: 0,
        nodesSkipped: 0,
        dbReads: 0,
        cacheHits: 0
      }
    })
  }

  const renderNode = (node: TrieNode, depth: number = 0) => {
    const isVisited = walkerState.visitedNodes.has(node.id)
    const isSkipped = walkerState.skippedNodes.has(node.id)
    const isCurrent = walkerState.currentNode === node.id
    const isInStack = walkerState.stack.includes(node.id)

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.05 }}
        className="ml-4"
      >
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer",
            isCurrent && "bg-[var(--eth-purple)]/20 border border-[var(--eth-purple)] shadow-lg shadow-[var(--eth-purple)]/20",
            isVisited && !isCurrent && "bg-green-500/10 border border-green-500/30",
            isSkipped && "bg-orange-500/10 border border-orange-500/30 opacity-50",
            isInStack && !isCurrent && "bg-blue-500/10 border border-blue-500/30",
            !isVisited && !isInStack && !isCurrent && "hover:bg-zinc-800/50"
          )}
        >
          {node.children && (
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform",
              node.isExpanded && "rotate-90"
            )} />
          )}
          
          <div className={cn(
            "w-6 h-6 rounded flex items-center justify-center text-xs font-mono",
            node.type === "branch" && "bg-purple-500/20 text-purple-400",
            node.type === "extension" && "bg-blue-500/20 text-blue-400",
            node.type === "leaf" && "bg-green-500/20 text-green-400",
            node.type === "hash" && "bg-orange-500/20 text-orange-400"
          )}>
            {node.type[0].toUpperCase()}
          </div>
          
          <span className="text-sm font-mono">{node.path || "root"}</span>
          
          {node.value && (
            <span className="text-xs text-zinc-500 ml-2">{node.value}</span>
          )}
          
          {isCurrent && (
            <motion.div
              className="ml-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Cpu className="w-4 h-4 text-[var(--eth-purple)]" />
            </motion.div>
          )}
          
          {isSkipped && (
            <SkipForward className="w-4 h-4 text-orange-400 ml-auto" />
          )}
        </div>
        
        {node.children && node.isExpanded !== false && (
          <div className="ml-6 border-l border-zinc-700 pl-2 mt-1">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <PageContainer>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            Trie Walker Navigation
          </h1>
          <p className="text-xl text-zinc-400">
            Stack-based traversal with skip optimization
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trie Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TreePine className="w-5 h-5 text-[var(--eth-purple)]" />
              Merkle Patricia Trie Structure
            </h2>
            
            <div className="bg-zinc-900/50 rounded-xl p-4 font-mono text-sm overflow-auto max-h-[600px]">
              {renderNode(trie)}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500/20 rounded" />
                <span>Branch Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/20 rounded" />
                <span>Extension Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/20 rounded" />
                <span>Leaf Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500/20 rounded" />
                <span>Hash Node</span>
              </div>
            </div>
          </motion.div>

          {/* Walker State & Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Walker State */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--eth-purple)]" />
                Walker State
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Current Decision</p>
                  <p className="text-sm font-mono text-[var(--eth-purple)]">{walkerState.decision}</p>
                </div>
                
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Stack ({walkerState.stack.length} items)</p>
                  <div className="bg-zinc-900/50 rounded p-2 min-h-[60px] max-h-[120px] overflow-auto">
                    {walkerState.stack.length > 0 ? (
                      <div className="font-mono text-xs space-y-1">
                        {walkerState.stack.map((item, i) => (
                          <div key={i} className="text-zinc-400">
                            [{i}] {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600">Empty stack</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 mb-1">Target Path</p>
                  <input
                    type="text"
                    value={targetPath}
                    onChange={(e) => setTargetPath(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg text-sm font-mono"
                    placeholder="e.g., a7f3"
                  />
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-[var(--eth-purple)]" />
                Performance Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Nodes Visited</p>
                  <p className="text-xl font-bold text-green-400">{walkerState.stats.nodesVisited}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Nodes Skipped</p>
                  <p className="text-xl font-bold text-orange-400">{walkerState.stats.nodesSkipped}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">DB Reads</p>
                  <p className="text-xl font-bold text-blue-400">{walkerState.stats.dbReads}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Cache Hits</p>
                  <p className="text-xl font-bold text-purple-400">{walkerState.stats.cacheHits}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Controls</h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={isWalking ? () => setIsWalking(false) : startWalking}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--eth-purple)] to-[var(--eth-pink)] rounded-lg font-medium hover:shadow-lg hover:shadow-[var(--eth-purple)]/25 transition-all"
                  >
                    {isWalking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isWalking ? "Pause" : "Start"}
                  </button>
                  <button
                    onClick={walkStep}
                    disabled={isWalking}
                    className="px-4 py-2 bg-zinc-800 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    Step
                  </button>
                  <button
                    onClick={resetWalker}
                    className="px-4 py-2 bg-zinc-800 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                
                <div>
                  <label className="text-xs text-zinc-500">Speed</label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={2100 - walkSpeed}
                    onChange={(e) => setWalkSpeed(2100 - parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
    </PageContainer>
  )
}