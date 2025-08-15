"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TreePine, ChevronRight, ChevronDown, Hash, 
  SkipForward, Play, Pause, RotateCcw, Layers,
  Database, Cpu, Zap, Info, Search, Archive,
  ArrowRight, ArrowDown, CheckCircle, XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TrieNode {
  id: string
  type: "branch" | "extension" | "leaf" | "hash"
  path: string
  nibbles: string
  value?: string
  stateRoot?: string
  children?: TrieNode[]
  isExpanded?: boolean
  isVisited?: boolean
  isSkipped?: boolean
  inDatabase?: boolean
  hash?: string
}

// More realistic trie structure based on Reth
const sampleTrie: TrieNode = {
  id: "root",
  type: "branch",
  path: "",
  nibbles: "",
  hash: "0xabcd...1234",
  inDatabase: true,
  isExpanded: true,
  children: [
    {
      id: "n1",
      type: "extension",
      path: "a7",
      nibbles: "a7",
      inDatabase: true,
      children: [
        {
          id: "n11",
          type: "branch",
          path: "a7",
          nibbles: "a7",
          inDatabase: true,
          children: [
            {
              id: "n111",
              type: "leaf",
              path: "a7f3",
              nibbles: "a7f3",
              value: "account_data_1",
              stateRoot: "0x1111...aaaa",
              inDatabase: false // New node to be written
            },
            {
              id: "n112",
              type: "leaf",
              path: "a7b2",
              nibbles: "a7b2",
              value: "account_data_2",
              stateRoot: "0x2222...bbbb",
              inDatabase: true
            },
            {
              id: "n113",
              type: "hash",
              path: "a7c",
              nibbles: "a7c",
              hash: "0x3333...cccc",
              inDatabase: true // Already processed subtree
            }
          ]
        }
      ]
    },
    {
      id: "n2",
      type: "branch",
      path: "b",
      nibbles: "b",
      inDatabase: true,
      children: [
        {
          id: "n21",
          type: "hash",
          path: "b5",
          nibbles: "b5",
          hash: "0x4444...dddd",
          inDatabase: true
        },
        {
          id: "n22",
          type: "extension",
          path: "b8",
          nibbles: "b8",
          inDatabase: false, // New extension
          children: [
            {
              id: "n221",
              type: "leaf",
              path: "b8c1",
              nibbles: "b8c1",
              value: "account_data_3",
              stateRoot: "0x5555...eeee",
              inDatabase: false // New leaf
            },
            {
              id: "n222",
              type: "leaf",
              path: "b8d2",
              nibbles: "b8d2",
              value: "account_data_4",
              stateRoot: "0x6666...ffff",
              inDatabase: false // New leaf
            }
          ]
        }
      ]
    },
    {
      id: "n3",
      type: "hash",
      path: "c",
      nibbles: "c",
      hash: "0x7777...gggg",
      inDatabase: true
    },
    {
      id: "n4",
      type: "extension",
      path: "d",
      nibbles: "d",
      inDatabase: true,
      children: [
        {
          id: "n41",
          type: "leaf",
          path: "d4a",
          nibbles: "d4a",
          value: "account_data_5",
          stateRoot: "0x8888...hhhh",
          inDatabase: true
        }
      ]
    }
  ]
}

interface WalkerState {
  stack: Array<{id: string, nibbles: string, position: string}>
  currentNode: string | null
  visitedNodes: Set<string>
  skippedNodes: Set<string>
  dbWrites: Array<{id: string, operation: string, data: string}>
  decision: string
  canSkipCurrent: boolean
  prefixSet: string[]
  stats: {
    nodesVisited: number
    nodesSkipped: number
    dbReads: number
    dbWrites: number
    cacheHits: number
  }
}

interface DatabaseEntry {
  key: string
  value: string
  type: "branch" | "leaf" | "extension" | "hash"
  timestamp: number
}

export default function TriePage() {
  const [trie, setTrie] = useState<TrieNode>(sampleTrie)
  const [walkerState, setWalkerState] = useState<WalkerState>({
    stack: [],
    currentNode: null,
    visitedNodes: new Set(),
    skippedNodes: new Set(),
    dbWrites: [],
    decision: "Ready to start trie traversal",
    canSkipCurrent: false,
    prefixSet: ["a7f", "b8"], // Paths that have changes
    stats: {
      nodesVisited: 0,
      nodesSkipped: 0,
      dbReads: 0,
      dbWrites: 0,
      cacheHits: 0
    }
  })
  const [database, setDatabase] = useState<DatabaseEntry[]>([])
  const [isWalking, setIsWalking] = useState(false)
  const [walkSpeed, setWalkSpeed] = useState(1000)
  const walkingRef = useRef(false)

  // More accurate walker algorithm based on Reth implementation
  const walkStep = async () => {
    setWalkerState(prev => {
      const newState = { ...prev }
      
      // Initialize if starting
      if (newState.stack.length === 0 && !newState.currentNode) {
        newState.stack = [{id: "root", nibbles: "", position: "root"}]
        newState.currentNode = "root"
        newState.decision = "🚀 Starting from root node"
        newState.stats.dbReads++
        return newState
      }

      // Check if we have nodes to process
      if (newState.stack.length === 0) {
        newState.decision = "✅ Traversal complete - all nodes processed"
        setIsWalking(false)
        return newState
      }

      // Get current node from stack
      const current = newState.stack[newState.stack.length - 1]
      const node = findNode(trie, current.id)
      
      if (!node) {
        newState.stack.pop()
        return newState
      }

      newState.currentNode = node.id
      
      // Check if we can skip this node
      const hasChangesInSubtree = newState.prefixSet.some(prefix => 
        prefix.startsWith(node.nibbles) || node.nibbles.startsWith(prefix)
      )
      
      newState.canSkipCurrent = !hasChangesInSubtree && (node.inDatabase === true)

      if (node.type === "hash") {
        // Hash nodes represent already-processed subtrees
        newState.decision = `⏭️ Skipping hash node ${node.nibbles} - subtree already in DB`
        newState.skippedNodes.add(node.id)
        newState.stats.nodesSkipped++
        newState.stats.cacheHits++
        newState.stack.pop()
        
      } else if (newState.canSkipCurrent && node.inDatabase === true) {
        // Skip nodes that haven't changed
        newState.decision = `✓ Node ${node.nibbles} unchanged - using cached value`
        newState.skippedNodes.add(node.id)
        newState.stats.nodesSkipped++
        newState.stats.cacheHits++
        newState.stack.pop()
        
      } else {
        // Process this node
        newState.visitedNodes.add(node.id)
        newState.stats.nodesVisited++
        
        if (node.type === "leaf") {
          newState.decision = `🍃 Processing leaf ${node.nibbles}`
          if (!node.inDatabase) {
            // Write new leaf to database
            newState.dbWrites.push({
              id: node.id,
              operation: "INSERT",
              data: `Leaf(${node.nibbles}) -> ${node.value}`
            })
            newState.stats.dbWrites++
            setDatabase(prev => [...prev, {
              key: node.nibbles,
              value: node.value || "",
              type: "leaf",
              timestamp: Date.now()
            }])
          } else {
            newState.stats.dbReads++
          }
          newState.stack.pop()
          
        } else if (node.type === "extension") {
          newState.decision = `🔗 Following extension ${node.nibbles}`
          if (!node.inDatabase) {
            newState.dbWrites.push({
              id: node.id,
              operation: "INSERT",
              data: `Extension(${node.nibbles})`
            })
            newState.stats.dbWrites++
          } else {
            newState.stats.dbReads++
          }
          
          // Remove current and add children
          newState.stack.pop()
          if (node.children) {
            // Add children in reverse for depth-first traversal
            for (let i = node.children.length - 1; i >= 0; i--) {
              const child = node.children[i]
              newState.stack.push({
                id: child.id,
                nibbles: child.nibbles,
                position: `child[${i}]`
              })
            }
          }
          
        } else if (node.type === "branch") {
          newState.decision = `🌳 Exploring branch ${node.nibbles || "root"}`
          if (!node.inDatabase) {
            newState.dbWrites.push({
              id: node.id,
              operation: "UPDATE",
              data: `Branch(${node.nibbles}) with ${node.children?.length || 0} children`
            })
            newState.stats.dbWrites++
          } else {
            newState.stats.dbReads++
          }
          
          // Remove current and add children
          newState.stack.pop()
          if (node.children) {
            // Add children in reverse order for DFS
            for (let i = node.children.length - 1; i >= 0; i--) {
              const child = node.children[i]
              
              // Skip optimization: don't add hash nodes if no changes in that path
              const shouldAdd = child.type !== "hash" || 
                newState.prefixSet.some(p => p.startsWith(child.nibbles))
              
              if (shouldAdd) {
                newState.stack.push({
                  id: child.id,
                  nibbles: child.nibbles,
                  position: `child[${i}]`
                })
              }
            }
          }
        }
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
    walkingRef.current = true
  }

  // Use effect for walking animation
  useEffect(() => {
    if (isWalking && walkingRef.current) {
      const interval = setInterval(() => {
        if (walkingRef.current) {
          walkStep()
        }
      }, walkSpeed)
      
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWalking, walkSpeed])

  const stopWalking = () => {
    setIsWalking(false)
    walkingRef.current = false
  }

  const resetWalker = () => {
    stopWalking()
    setWalkerState({
      stack: [],
      currentNode: null,
      visitedNodes: new Set(),
      skippedNodes: new Set(),
      dbWrites: [],
      decision: "Ready to start trie traversal",
      canSkipCurrent: false,
      prefixSet: ["a7f", "b8"],
      stats: {
        nodesVisited: 0,
        nodesSkipped: 0,
        dbReads: 0,
        dbWrites: 0,
        cacheHits: 0
      }
    })
    setDatabase([])
  }

  const renderNode = (node: TrieNode, depth: number = 0) => {
    const isVisited = walkerState.visitedNodes.has(node.id)
    const isSkipped = walkerState.skippedNodes.has(node.id)
    const isCurrent = walkerState.currentNode === node.id
    const isInStack = walkerState.stack.some(s => s.id === node.id)

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
            isCurrent && "bg-[#627eea]/20 border border-[#627eea] shadow-lg shadow-[#627eea]/20",
            isVisited && !isCurrent && "bg-green-500/10 border border-green-500/30",
            isSkipped && "bg-orange-500/10 border border-orange-500/30 opacity-60",
            isInStack && !isCurrent && "bg-blue-500/10 border border-blue-500/30",
            !isVisited && !isInStack && !isCurrent && !isSkipped && "hover:bg-zinc-800/50"
          )}
        >
          {node.children && (
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform",
              node.isExpanded !== false && "rotate-90"
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
          
          <span className="text-sm font-mono">{node.nibbles || "root"}</span>
          
          {node.value && (
            <span className="text-xs text-zinc-500 ml-2">{node.value}</span>
          )}
          
          {node.hash && (
            <span className="text-xs text-orange-400 ml-2 font-mono">{node.hash.slice(0, 10)}...</span>
          )}
          
          {/* Database indicator */}
          {node.inDatabase && (
            <Database className="w-3 h-3 text-blue-400 ml-auto" />
          )}
          
          {!node.inDatabase && isVisited && (
            <Archive className="w-3 h-3 text-green-400 ml-auto animate-pulse" />
          )}
          
          {isCurrent && (
            <motion.div
              className="ml-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Cpu className="w-4 h-4 text-[#627eea]" />
            </motion.div>
          )}
          
          {isSkipped && (
            <SkipForward className="w-4 h-4 text-orange-400 ml-2" />
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
              <h1 className="text-4xl font-bold gradient-text">Trie Walker Navigation</h1>
              <p className="text-zinc-400">
                Stack-based traversal with skip optimization and database updates
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Trie Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2"
          >
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TreePine className="w-5 h-5 text-teal-500" />
                Merkle Patricia Trie Structure
              </h2>
              
              <div className="bg-zinc-950/50 rounded-xl p-4 font-mono text-sm overflow-auto max-h-[600px]">
                {renderNode(trie)}
              </div>

              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500/20 rounded" />
                  <span>Branch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500/20 rounded" />
                  <span>Extension</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500/20 rounded" />
                  <span>Leaf</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500/20 rounded" />
                  <span>Hash (Cached)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>In Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-green-400" />
                  <span>Writing to DB</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500/20 border border-green-500/30 rounded" />
                  <span>Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500/20 border border-orange-500/30 rounded opacity-60" />
                  <span>Skipped</span>
                </div>
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
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-500" />
                Walker State
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Current Decision</p>
                  <p className="text-sm font-medium text-teal-400">{walkerState.decision}</p>
                </div>
                
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Can Skip Current</p>
                  <p className="text-sm">
                    {walkerState.canSkipCurrent ? (
                      <span className="text-orange-400">✓ Yes (no changes)</span>
                    ) : (
                      <span className="text-blue-400">✗ No (has changes)</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Stack ({walkerState.stack.length} items)</p>
                  <div className="bg-zinc-950/50 rounded p-2 min-h-[80px] max-h-[120px] overflow-auto">
                    {walkerState.stack.length > 0 ? (
                      <div className="font-mono text-xs space-y-1">
                        {walkerState.stack.map((item, i) => (
                          <div key={i} className="text-zinc-400">
                            [{i}] {item.nibbles || "root"} ({item.position})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600">Empty stack</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 mb-1">Changed Paths (Prefix Set)</p>
                  <div className="flex gap-2">
                    {walkerState.prefixSet.map(prefix => (
                      <span key={prefix} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-mono">
                        {prefix}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Database Operations */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-500" />
                Database Operations
              </h3>
              
              <div className="space-y-2 max-h-[200px] overflow-auto">
                {walkerState.dbWrites.length > 0 ? (
                  walkerState.dbWrites.map((write, i) => (
                    <div key={i} className="text-xs p-2 bg-zinc-950/50 rounded">
                      <span className={cn(
                        "font-bold",
                        write.operation === "INSERT" ? "text-green-400" : "text-blue-400"
                      )}>
                        {write.operation}
                      </span>
                      <span className="text-zinc-400 ml-2 font-mono">{write.data}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-600">No database operations yet</p>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-500" />
                Performance Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Nodes Visited</p>
                  <p className="text-xl font-bold text-green-400">{walkerState.stats.nodesVisited}</p>
                </div>
                <div className="bg-zinc-950/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Nodes Skipped</p>
                  <p className="text-xl font-bold text-orange-400">{walkerState.stats.nodesSkipped}</p>
                </div>
                <div className="bg-zinc-950/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">DB Reads</p>
                  <p className="text-xl font-bold text-blue-400">{walkerState.stats.dbReads}</p>
                </div>
                <div className="bg-zinc-950/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">DB Writes</p>
                  <p className="text-xl font-bold text-purple-400">{walkerState.stats.dbWrites}</p>
                </div>
                <div className="bg-zinc-950/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Cache Hits</p>
                  <p className="text-xl font-bold text-cyan-400">{walkerState.stats.cacheHits}</p>
                </div>
                <div className="bg-zinc-950/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500">Efficiency</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {walkerState.stats.nodesVisited + walkerState.stats.nodesSkipped > 0 
                      ? Math.round((walkerState.stats.nodesSkipped / (walkerState.stats.nodesVisited + walkerState.stats.nodesSkipped)) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Controls</h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={isWalking ? stopWalking : startWalking}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all text-white"
                  >
                    {isWalking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isWalking ? "Pause" : "Start"}
                  </button>
                  <button
                    onClick={walkStep}
                    disabled={isWalking}
                    className="px-4 py-2 bg-zinc-800 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 text-white"
                  >
                    Step
                  </button>
                  <button
                    onClick={resetWalker}
                    className="px-4 py-2 bg-zinc-800 rounded-lg font-medium hover:bg-zinc-700 transition-colors text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                
                <div>
                  <label className="text-xs text-zinc-500">Speed (ms per step)</label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={walkSpeed}
                    onChange={(e) => setWalkSpeed(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-zinc-600 mt-1">
                    <span>Fast</span>
                    <span>{walkSpeed}ms</span>
                    <span>Slow</span>
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