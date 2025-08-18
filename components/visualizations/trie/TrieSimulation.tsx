"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TreePine, Plus, Search, Trash2, Play, Pause, RotateCcw,
  ChevronRight, Hash, Database, Zap, Info, AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

// Trie Node structure for simulation
interface TrieSimNode {
  id: string
  type: "branch" | "extension" | "leaf" | "empty"
  nibbles: string[]
  key?: string
  value?: string
  children: (TrieSimNode | null)[]
  hash?: string
  depth: number
  isHighlighted?: boolean
  isNew?: boolean
  isDeleted?: boolean
  isVisited?: boolean
}

// Operation types
type Operation = "insert" | "search" | "delete"

interface OperationStep {
  node: string
  action: string
  description: string
  highlight: string[]
}

// Sample operations to demonstrate
const SAMPLE_OPERATIONS = [
  { type: "insert" as Operation, key: "0x5a", value: "Alice's Balance: 100 ETH" },
  { type: "insert" as Operation, key: "0x5b", value: "Bob's Balance: 50 ETH" },
  { type: "search" as Operation, key: "0x5a", value: "" },
  { type: "insert" as Operation, key: "0x5abc", value: "Charlie's Balance: 75 ETH" },
  { type: "delete" as Operation, key: "0x5b", value: "" },
]

export default function TrieSimulation() {
  const [trie, setTrie] = useState<TrieSimNode | null>(null)
  const [currentOperation, setCurrentOperation] = useState<typeof SAMPLE_OPERATIONS[0] | null>(null)
  const [operationIndex, setOperationIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1000)
  const [currentStep, setCurrentStep] = useState<OperationStep | null>(null)
  const [operationHistory, setOperationHistory] = useState<OperationStep[]>([])
  const [customKey, setCustomKey] = useState("")
  const [customValue, setCustomValue] = useState("")
  const [mode, setMode] = useState<"demo" | "interactive">("demo")

  // Initialize empty trie
  useEffect(() => {
    setTrie(createEmptyTrie())
  }, [])

  function createEmptyTrie(): TrieSimNode {
    return {
      id: "root",
      type: "empty",
      nibbles: [],
      children: Array(16).fill(null),
      depth: 0,
      hash: "0x0000"
    }
  }

  // Convert hex string to nibbles
  function hexToNibbles(hex: string): string[] {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex
    return cleanHex.split("")
  }

  // Insert operation
  const insertNode = useCallback((root: TrieSimNode, key: string, value: string): TrieSimNode => {
    const nibbles = hexToNibbles(key)
    const steps: OperationStep[] = []
    
    const insert = (node: TrieSimNode, remainingNibbles: string[], depth: number): TrieSimNode => {
      // Clone node for immutability
      const newNode = { ...node, children: [...node.children] }
      
      if (remainingNibbles.length === 0) {
        // We've reached the insertion point
        newNode.type = "leaf"
        newNode.value = value
        newNode.key = key
        newNode.isNew = true
        steps.push({
          node: newNode.id,
          action: "insert",
          description: `Inserted leaf node with value: ${value}`,
          highlight: [newNode.id]
        })
        return newNode
      }
      
      const nibble = parseInt(remainingNibbles[0], 16)
      const remaining = remainingNibbles.slice(1)
      
      if (newNode.type === "empty") {
        // Convert to branch node
        newNode.type = "branch"
        newNode.nibbles = [remainingNibbles[0]]
        
        // Create new child
        const childId = `${newNode.id}-${nibble}`
        const child: TrieSimNode = {
          id: childId,
          type: remaining.length === 0 ? "leaf" : "extension",
          nibbles: remaining.length > 0 ? [remaining[0]] : [],
          key: remaining.length === 0 ? key : undefined,
          value: remaining.length === 0 ? value : undefined,
          children: Array(16).fill(null),
          depth: depth + 1,
          isNew: true
        }
        
        if (remaining.length > 0) {
          newNode.children[nibble] = insert(child, remaining, depth + 1)
        } else {
          newNode.children[nibble] = child
        }
        
        steps.push({
          node: newNode.id,
          action: "branch",
          description: `Created branch node at nibble ${nibble}`,
          highlight: [newNode.id, childId]
        })
      } else if (newNode.type === "branch") {
        // Navigate through branch
        if (!newNode.children[nibble]) {
          // Create new child
          const childId = `${newNode.id}-${nibble}`
          const child: TrieSimNode = {
            id: childId,
            type: remaining.length === 0 ? "leaf" : "extension",
            nibbles: remaining.length > 0 ? [remaining[0]] : [],
            key: remaining.length === 0 ? key : undefined,
            value: remaining.length === 0 ? value : undefined,
            children: Array(16).fill(null),
            depth: depth + 1,
            isNew: true
          }
          
          if (remaining.length > 0) {
            newNode.children[nibble] = insert(child, remaining, depth + 1)
          } else {
            newNode.children[nibble] = child
          }
        } else {
          // Recurse into existing child
          newNode.children[nibble] = insert(newNode.children[nibble]!, remaining, depth + 1)
        }
        
        steps.push({
          node: newNode.id,
          action: "traverse",
          description: `Traversing branch at nibble ${nibble}`,
          highlight: [newNode.id]
        })
      }
      
      // Update hash
      newNode.hash = `0x${Math.random().toString(16).slice(2, 8)}`
      
      return newNode
    }
    
    const result = insert(root, nibbles, 0)
    setOperationHistory(steps)
    return result
  }, [])

  // Search operation
  const searchNode = useCallback((root: TrieSimNode, key: string): { found: boolean; value?: string } => {
    const nibbles = hexToNibbles(key)
    const steps: OperationStep[] = []
    
    const search = (node: TrieSimNode | null, remainingNibbles: string[], depth: number): { found: boolean; value?: string } => {
      if (!node) {
        steps.push({
          node: "null",
          action: "not_found",
          description: "Node not found",
          highlight: []
        })
        return { found: false }
      }
      
      node.isVisited = true
      
      if (remainingNibbles.length === 0) {
        if (node.type === "leaf" && node.key === key) {
          steps.push({
            node: node.id,
            action: "found",
            description: `Found value: ${node.value}`,
            highlight: [node.id]
          })
          return { found: true, value: node.value }
        }
        return { found: false }
      }
      
      if (node.type === "branch") {
        const nibble = parseInt(remainingNibbles[0], 16)
        steps.push({
          node: node.id,
          action: "search",
          description: `Searching at nibble ${nibble}`,
          highlight: [node.id]
        })
        return search(node.children[nibble], remainingNibbles.slice(1), depth + 1)
      }
      
      return { found: false }
    }
    
    const result = search(root, nibbles, 0)
    setOperationHistory(steps)
    return result
  }, [])

  // Delete operation
  const deleteNode = useCallback((root: TrieSimNode, key: string): TrieSimNode => {
    const nibbles = hexToNibbles(key)
    const steps: OperationStep[] = []
    
    const del = (node: TrieSimNode | null, remainingNibbles: string[], depth: number): TrieSimNode | null => {
      if (!node) return null
      
      const newNode = { ...node, children: [...node.children] }
      
      if (remainingNibbles.length === 0) {
        if (newNode.type === "leaf" && newNode.key === key) {
          newNode.isDeleted = true
          steps.push({
            node: newNode.id,
            action: "delete",
            description: `Deleted node with key: ${key}`,
            highlight: [newNode.id]
          })
          return null
        }
        return newNode
      }
      
      if (newNode.type === "branch") {
        const nibble = parseInt(remainingNibbles[0], 16)
        newNode.children[nibble] = del(newNode.children[nibble], remainingNibbles.slice(1), depth + 1)
        
        // Check if branch should be collapsed
        const nonNullChildren = newNode.children.filter(c => c !== null)
        if (nonNullChildren.length === 0) {
          return null
        } else if (nonNullChildren.length === 1) {
          // Collapse to extension node
          newNode.type = "extension"
        }
        
        steps.push({
          node: newNode.id,
          action: "traverse",
          description: `Traversing for deletion at nibble ${nibble}`,
          highlight: [newNode.id]
        })
      }
      
      return newNode
    }
    
    const result = del(root, nibbles, 0) || createEmptyTrie()
    setOperationHistory(steps)
    return result
  }, [])

  // Execute current operation
  const executeOperation = useCallback(() => {
    if (!currentOperation || !trie) return
    
    let newTrie = trie
    
    switch (currentOperation.type) {
      case "insert":
        newTrie = insertNode(trie, currentOperation.key, currentOperation.value)
        break
      case "search":
        searchNode(trie, currentOperation.key)
        break
      case "delete":
        newTrie = deleteNode(trie, currentOperation.key)
        break
    }
    
    setTrie(newTrie)
  }, [currentOperation, trie, insertNode, searchNode, deleteNode])

  // Auto-play through operations
  useEffect(() => {
    if (!isPlaying || mode !== "demo") return
    
    const timer = setTimeout(() => {
      if (operationIndex < SAMPLE_OPERATIONS.length) {
        setCurrentOperation(SAMPLE_OPERATIONS[operationIndex])
        executeOperation()
        setOperationIndex(prev => prev + 1)
      } else {
        setIsPlaying(false)
        setOperationIndex(0)
      }
    }, speed)
    
    return () => clearTimeout(timer)
  }, [isPlaying, operationIndex, speed, mode, executeOperation])

  // Render trie visualization
  const renderTrie = (node: TrieSimNode | null, x: number = 400, y: number = 50, level: number = 0): React.JSX.Element | null => {
    if (!node) return null
    
    const nodeSize = 40
    const horizontalSpacing = Math.max(300 / (level + 1), 60)
    const verticalSpacing = 80
    
    // Count non-null children for positioning
    const activeChildren = node.children.filter(c => c !== null)
    const childStartX = x - (activeChildren.length - 1) * horizontalSpacing / 2
    
    return (
      <g key={node.id}>
        {/* Draw connections to children */}
        {node.children.map((child, index) => {
          if (!child) return null
          const childX = childStartX + activeChildren.indexOf(child) * horizontalSpacing
          const childY = y + verticalSpacing
          
          return (
            <motion.line
              key={`${node.id}-${child.id}`}
              x1={x}
              y1={y}
              x2={childX}
              y2={childY}
              stroke={child.isNew ? "#10b981" : child.isDeleted ? "#ef4444" : "#525252"}
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          )
        })}
        
        {/* Draw node */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: level * 0.1 }}
        >
          <circle
            cx={x}
            cy={y}
            r={nodeSize / 2}
            fill={
              node.isNew ? "#10b981" :
              node.isDeleted ? "#ef4444" :
              node.isVisited ? "#3b82f6" :
              node.type === "branch" ? "#8b5cf6" :
              node.type === "extension" ? "#06b6d4" :
              node.type === "leaf" ? "#10b981" :
              "#525252"
            }
            stroke={node.isHighlighted ? "#fbbf24" : "transparent"}
            strokeWidth={3}
            className="transition-all duration-300"
          />
          
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white text-xs font-semibold pointer-events-none"
          >
            {node.type[0].toUpperCase()}
          </text>
          
          {/* Show nibbles for branch nodes */}
          {node.type === "branch" && node.nibbles.length > 0 && (
            <text
              x={x}
              y={y - 30}
              textAnchor="middle"
              className="fill-zinc-400 text-xs"
            >
              {node.nibbles.join("")}
            </text>
          )}
          
          {/* Show value for leaf nodes */}
          {node.type === "leaf" && node.value && (
            <text
              x={x}
              y={y + 30}
              textAnchor="middle"
              className="fill-zinc-400 text-xs"
            >
              {node.value.slice(0, 15)}...
            </text>
          )}
        </motion.g>
        
        {/* Render children */}
        {activeChildren.map((child, i) => {
          const childX = childStartX + i * horizontalSpacing
          const childY = y + verticalSpacing
          return renderTrie(child, childX, childY, level + 1)
        })}
      </g>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <TreePine className="w-6 h-6 text-teal-400" />
          Interactive Trie Simulation
        </h3>
        <p className="text-zinc-400">
          Watch how Ethereum&apos;s Merkle Patricia Trie handles insertions, searches, and deletions.
          See how nodes are created, traversed, and modified in real-time.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <button
          onClick={() => setMode("demo")}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
            mode === "demo"
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          Demo Mode
        </button>
        <button
          onClick={() => setMode("interactive")}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
            mode === "interactive"
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          Interactive Mode
        </button>
      </div>

      {/* Controls */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
        {mode === "demo" ? (
          <div className="space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              
              <button
                onClick={() => {
                  setTrie(createEmptyTrie())
                  setOperationIndex(0)
                  setCurrentOperation(null)
                  setOperationHistory([])
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Speed:</span>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="500"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-zinc-500">{speed}ms</span>
              </div>
            </div>
            
            {/* Current Operation */}
            {currentOperation && (
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">Current Operation:</span>
                  <span className={cn(
                    "px-2 py-1 rounded font-medium",
                    currentOperation.type === "insert" && "bg-green-500/20 text-green-400",
                    currentOperation.type === "search" && "bg-blue-500/20 text-blue-400",
                    currentOperation.type === "delete" && "bg-red-500/20 text-red-400"
                  )}>
                    {currentOperation.type.toUpperCase()}
                  </span>
                  <span className="text-zinc-300">Key: {currentOperation.key}</span>
                  {currentOperation.value && (
                    <span className="text-zinc-300">Value: {currentOperation.value}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Interactive Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Key (hex)</label>
                <input
                  type="text"
                  placeholder="0x5abc"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Value</label>
                <input
                  type="text"
                  placeholder="Account balance, storage, etc."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Operations</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (customKey && customValue && trie) {
                        setTrie(insertNode(trie, customKey, customValue))
                      }
                    }}
                    className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Insert
                  </button>
                  
                  <button
                    onClick={() => {
                      if (customKey && trie) {
                        const result = searchNode(trie, customKey)
                        if (result.found) {
                          setCustomValue(result.value || "")
                        }
                      }
                    }}
                    className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                  
                  <button
                    onClick={() => {
                      if (customKey && trie) {
                        setTrie(deleteNode(trie, customKey))
                      }
                    }}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setTrie(createEmptyTrie())
                setCustomKey("")
                setCustomValue("")
                setOperationHistory([])
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Trie
            </button>
          </div>
        )}
      </div>

      {/* Trie Visualization */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
        <div className="mb-4">
          <h4 className="font-semibold text-zinc-300 mb-2">Trie Structure</h4>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <span className="text-zinc-400">Branch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-500" />
              <span className="text-zinc-400">Extension</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-zinc-400">Leaf</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-zinc-500" />
              <span className="text-zinc-400">Empty</span>
            </div>
          </div>
        </div>
        
        <div className="relative overflow-x-auto">
          <svg width="800" height="400" className="w-full">
            {trie && renderTrie(trie)}
          </svg>
        </div>
      </div>

      {/* Operation History */}
      {operationHistory.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <h4 className="font-semibold text-zinc-300 mb-3">Operation Steps</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {operationHistory.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-zinc-500 font-mono">{index + 1}.</span>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  step.action === "insert" && "bg-green-500/20 text-green-400",
                  step.action === "search" && "bg-blue-500/20 text-blue-400",
                  step.action === "delete" && "bg-red-500/20 text-red-400",
                  step.action === "traverse" && "bg-yellow-500/20 text-yellow-400",
                  step.action === "branch" && "bg-purple-500/20 text-purple-400"
                )}>
                  {step.action}
                </span>
                <span className="text-zinc-400">{step.description}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-zinc-300">
            <p>
              <strong>How it works:</strong> The Merkle Patricia Trie combines the benefits of a 
              Patricia Trie (path compression) with Merkle Trees (cryptographic verification).
            </p>
            <p>
              <strong>Key concepts:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-4">
              <li>Branch nodes have up to 16 children (one for each hex nibble)</li>
              <li>Extension nodes compress shared prefixes</li>
              <li>Leaf nodes store the actual values</li>
              <li>Each node has a hash that depends on its children</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}