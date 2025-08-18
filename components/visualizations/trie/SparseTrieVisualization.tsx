"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TreePine, Eye, EyeOff, Hash, Database, Cpu, CheckCircle,
  ArrowRight, ArrowLeft, Play, Pause, RotateCcw, Zap, Info,
  AlertTriangle, Lock, Unlock, Binary, GitBranch, Package
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for sparse trie nodes
interface SparseTrieNode {
  id: string
  type: "branch" | "extension" | "leaf" | "hash"
  path: string
  value?: string
  hash: string
  revealed: boolean
  modified?: boolean
  children?: (SparseTrieNode | null)[]
  depth: number
  x?: number
  y?: number
}

interface AnimationStep {
  id: string
  title: string
  description: string
  action: () => void
  highlights: string[]
  codeSnippet?: string
  metrics?: {
    nodesLoaded: number
    nodesHashed: number
    memoryUsed: string
    timeElapsed: string
  }
}

// Create sample trie structure
function createSampleTrie(): SparseTrieNode {
  return {
    id: "root",
    type: "branch",
    path: "",
    hash: "0xabc123...",
    revealed: false,
    depth: 0,
    children: [
      {
        id: "node-5",
        type: "branch",
        path: "5",
        hash: "0xdef456...",
        revealed: false,
        depth: 1,
        children: [
          {
            id: "node-5a",
            type: "extension",
            path: "5a",
            hash: "0x789abc...",
            revealed: false,
            depth: 2,
            children: [
              {
                id: "node-5a2",
                type: "leaf",
                path: "5a2",
                value: "Alice: 100 ETH",
                hash: "0x111222...",
                revealed: false,
                depth: 3
              }
            ]
          },
          {
            id: "node-5b",
            type: "leaf",
            path: "5b",
            value: "Bob: 50 ETH",
            hash: "0x333444...",
            revealed: false,
            depth: 2
          }
        ]
      },
      null, null, null, // Empty slots
      {
        id: "node-9",
        type: "branch",
        path: "9",
        hash: "0x555666...",
        revealed: false,
        depth: 1,
        children: [
          {
            id: "node-9c",
            type: "leaf",
            path: "9c",
            value: "Charlie: 75 ETH",
            hash: "0x777888...",
            revealed: false,
            depth: 2
          },
          {
            id: "node-9d",
            type: "extension",
            path: "9d",
            hash: "0x999aaa...",
            revealed: false,
            depth: 2,
            children: [
              {
                id: "node-9d1",
                type: "leaf",
                path: "9d1",
                value: "Dave: 200 ETH",
                hash: "0xbbbccc...",
                revealed: false,
                depth: 3
              }
            ]
          }
        ]
      }
    ]
  }
}

export default function SparseTrieVisualization() {
  const [trie, setTrie] = useState<SparseTrieNode>(createSampleTrie())
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [revealedNodes, setRevealedNodes] = useState<Set<string>>(new Set())
  const [modifiedNodes, setModifiedNodes] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [scenario, setScenario] = useState<"newPayload" | "stateUpdate" | "verification">("newPayload")

  // Metrics tracking
  const [metrics, setMetrics] = useState({
    nodesLoaded: 0,
    nodesHashed: 50, // Start with all nodes as hashes
    memoryUsed: "2 KB",
    timeElapsed: "0 ms"
  })

  // Animation steps for new_payload scenario
  const newPayloadSteps: AnimationStep[] = [
    {
      id: "receive",
      title: "1. Receive new_payload",
      description: "Engine API receives a new block with transactions to execute. The state root needs to be computed to verify the block.",
      action: () => {
        setRevealedNodes(new Set())
        setModifiedNodes(new Set())
        setMetrics({
          nodesLoaded: 0,
          nodesHashed: 50,
          memoryUsed: "2 KB",
          timeElapsed: "0 ms"
        })
      },
      highlights: [],
      codeSnippet: `// Engine API receives new block
async fn new_payload(&mut self, block: Block) {
    // Need to compute state root after execution
    let state_root = self.compute_state_root()?;
    
    // Verify against block header
    assert_eq!(state_root, block.header.state_root);
}`,
      metrics: {
        nodesLoaded: 0,
        nodesHashed: 50,
        memoryUsed: "2 KB",
        timeElapsed: "0 ms"
      }
    },
    {
      id: "identify",
      title: "2. Identify Modified Accounts",
      description: "Track which accounts were modified during transaction execution. Only these paths need to be updated in the trie.",
      action: () => {
        setModifiedNodes(new Set(["node-5a2", "node-9c"]))
        setMetrics({
          nodesLoaded: 0,
          nodesHashed: 50,
          memoryUsed: "3 KB",
          timeElapsed: "5 ms"
        })
      },
      highlights: ["node-5a2", "node-9c"],
      codeSnippet: `// Build prefix set of modified paths
let mut prefix_set = PrefixSet::new();
for (address, account) in state_changes {
    prefix_set.insert(address.to_nibbles());
}

// Only 2 accounts modified out of millions
// Alice: 100 -> 90 ETH (sent 10)
// Charlie: 75 -> 85 ETH (received 10)`,
      metrics: {
        nodesLoaded: 0,
        nodesHashed: 50,
        memoryUsed: "3 KB",
        timeElapsed: "5 ms"
      }
    },
    {
      id: "reveal-path",
      title: "3. Reveal Path to Modified Nodes",
      description: "Use reveal_node() to load only the nodes along the path to modified accounts. Other nodes remain as hashes.",
      action: () => {
        setRevealedNodes(new Set(["root", "node-5", "node-5a", "node-5a2", "node-9", "node-9c"]))
        setMetrics({
          nodesLoaded: 6,
          nodesHashed: 44,
          memoryUsed: "8 KB",
          timeElapsed: "15 ms"
        })
      },
      highlights: ["root", "node-5", "node-5a", "node-5a2", "node-9", "node-9c"],
      codeSnippet: `impl RevealedSparseTrie {
    /// Reveal a node in the trie, making it directly accessible
    pub fn reveal_node(&mut self, path: Nibbles, node: TrieNode) {
        match node {
            TrieNode::Branch(branch) => {
                // Only reveal children on modified paths
                for nibble in prefix_set.iter() {
                    if let Some(child) = branch.children[nibble] {
                        self.reveal_node(child_path, child);
                    }
                }
            }
            TrieNode::Leaf(leaf) => {
                self.values.insert(path, leaf.value);
            }
            _ => { /* Keep as hash */ }
        }
    }
}`,
      metrics: {
        nodesLoaded: 6,
        nodesHashed: 44,
        memoryUsed: "8 KB",
        timeElapsed: "15 ms"
      }
    },
    {
      id: "update-values",
      title: "4. Update Modified Values",
      description: "Update the values of modified accounts in the revealed sparse trie. Only these leaf nodes change.",
      action: () => {
        // Visual indication of value updates
        setMetrics({
          nodesLoaded: 6,
          nodesHashed: 44,
          memoryUsed: "8 KB",
          timeElapsed: "20 ms"
        })
      },
      highlights: ["node-5a2", "node-9c"],
      codeSnippet: `// Update values in sparse trie
sparse_trie.update_leaf(
    Nibbles::from("5a2"),
    alice_new_balance  // 90 ETH
);

sparse_trie.update_leaf(
    Nibbles::from("9c"),
    charlie_new_balance  // 85 ETH
);

// Only 2 leaf nodes updated
// Millions of other nodes untouched`,
      metrics: {
        nodesLoaded: 6,
        nodesHashed: 44,
        memoryUsed: "8 KB",
        timeElapsed: "20 ms"
      }
    },
    {
      id: "recompute-hashes",
      title: "5. Recompute Affected Hashes",
      description: "Recompute hashes only for nodes along the modified paths, bubbling up to the root. Unchanged subtrees keep their cached hashes.",
      action: () => {
        setMetrics({
          nodesLoaded: 6,
          nodesHashed: 44,
          memoryUsed: "9 KB",
          timeElapsed: "25 ms"
        })
      },
      highlights: ["node-5a2", "node-5a", "node-5", "node-9c", "node-9", "root"],
      codeSnippet: `// Recompute hashes bottom-up
fn update_hashes(&mut self, path: Nibbles) {
    let node = self.revealed.get_mut(&path).unwrap();
    
    // Compute new hash for this node
    node.hash = match node {
        Node::Leaf(val) => keccak256(val),
        Node::Branch(children) => {
            // Use cached hashes for unchanged children
            let child_hashes = children.map(|c| 
                c.hash_or_cached()
            );
            keccak256(child_hashes)
        }
    };
    
    // Bubble up to parent
    if let Some(parent) = self.get_parent(path) {
        self.update_hashes(parent);
    }
}`,
      metrics: {
        nodesLoaded: 6,
        nodesHashed: 44,
        memoryUsed: "9 KB",
        timeElapsed: "25 ms"
      }
    },
    {
      id: "verify",
      title: "6. Verify State Root",
      description: "The new state root is computed efficiently. Compare with block header to verify correctness.",
      action: () => {
        setMetrics({
          nodesLoaded: 6,
          nodesHashed: 44,
          memoryUsed: "9 KB",
          timeElapsed: "30 ms"
        })
      },
      highlights: ["root"],
      codeSnippet: `// Get the new state root
let computed_root = sparse_trie.root();

// Verify against block header
if computed_root != block.header.state_root {
    return Err(InvalidStateRoot);
}

// SUCCESS: State root verified!
// Time: 30ms vs 200,000ms (full trie)
// Memory: 9KB vs 50GB (full trie)
// Speedup: 6,666x faster!`,
      metrics: {
        nodesLoaded: 6,
        nodesHashed: 44,
        memoryUsed: "9 KB",
        timeElapsed: "30 ms"
      }
    }
  ]

  // Navigate steps
  const handleNextStep = useCallback(() => {
    if (currentStep < newPayloadSteps.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      newPayloadSteps[nextStep].action()
    }
  }, [currentStep])

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      newPayloadSteps[prevStep].action()
    }
  }, [currentStep])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && currentStep < newPayloadSteps.length - 1) {
      const timer = setTimeout(() => {
        handleNextStep()
      }, 3000)
      return () => clearTimeout(timer)
    } else if (isPlaying && currentStep === newPayloadSteps.length - 1) {
      setIsPlaying(false)
    }
  }, [isPlaying, currentStep, handleNextStep])

  // Initialize first step
  useEffect(() => {
    newPayloadSteps[0].action()
  }, [])

  // Render trie visualization
  const renderTrieNode = (node: SparseTrieNode, x: number = 400, y: number = 80): React.JSX.Element | null => {
    if (!node) return null

    const isRevealed = revealedNodes.has(node.id)
    const isModified = modifiedNodes.has(node.id)
    const isHighlighted = newPayloadSteps[currentStep]?.highlights.includes(node.id)
    const nodeSize = 36

    // Calculate children positions
    const childSpacing = Math.max(400 / Math.pow(2, node.depth), 80)
    const childY = y + 100

    return (
      <g key={node.id}>
        {/* Render connections to children */}
        {node.children?.map((child, index) => {
          if (!child) return null
          const childX = x - childSpacing * 2 + (index * childSpacing)
          
          return (
            <motion.line
              key={`line-${node.id}-${child.id}`}
              x1={x}
              y1={y + nodeSize / 2}
              x2={childX}
              y2={childY - nodeSize / 2}
              stroke={
                revealedNodes.has(child.id) 
                  ? isHighlighted ? "#fbbf24" : "#525252"
                  : "#303030"
              }
              strokeWidth={revealedNodes.has(child.id) ? 2 : 1}
              strokeDasharray={revealedNodes.has(child.id) ? "0" : "5,5"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )
        })}

        {/* Render the node */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: node.depth * 0.05 }}
          onClick={() => setSelectedNode(node.id)}
          className="cursor-pointer"
        >
          {/* Node background */}
          <motion.rect
            x={x - nodeSize / 2}
            y={y - nodeSize / 2}
            width={nodeSize}
            height={nodeSize}
            rx={8}
            fill={
              isRevealed
                ? node.type === "branch" ? "#8b5cf6"
                : node.type === "extension" ? "#06b6d4"
                : node.type === "leaf" ? "#10b981"
                : "#525252"
                : "#262626"
            }
            stroke={
              isHighlighted ? "#fbbf24" :
              isModified ? "#ef4444" :
              isRevealed ? "transparent" : "#404040"
            }
            strokeWidth={isHighlighted ? 3 : 2}
            animate={{
              fill: isRevealed
                ? node.type === "branch" ? "#8b5cf6"
                : node.type === "extension" ? "#06b6d4"
                : node.type === "leaf" ? "#10b981"
                : "#525252"
                : "#262626"
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Node icon */}
          {isRevealed ? (
            <text
              x={x}
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-xs font-bold pointer-events-none"
            >
              {node.type[0].toUpperCase()}
            </text>
          ) : (
            <g transform={`translate(${x - 8}, ${y - 8})`}>
              <Hash className="w-4 h-4 text-zinc-500 pointer-events-none" />
            </g>
          )}

          {/* Modified indicator */}
          {isModified && (
            <motion.circle
              cx={x + nodeSize / 2 - 4}
              cy={y - nodeSize / 2 + 4}
              r={4}
              fill="#ef4444"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Node label */}
          <text
            x={x}
            y={y - nodeSize / 2 - 8}
            textAnchor="middle"
            className="fill-zinc-400 text-xs"
          >
            {node.path || "root"}
          </text>

          {/* Hash preview */}
          {!isRevealed && (
            <text
              x={x}
              y={y + nodeSize / 2 + 12}
              textAnchor="middle"
              className="fill-zinc-600 text-xs font-mono"
            >
              {node.hash.slice(0, 8)}...
            </text>
          )}

          {/* Value for leaf nodes */}
          {isRevealed && node.type === "leaf" && node.value && (
            <text
              x={x}
              y={y + nodeSize / 2 + 12}
              textAnchor="middle"
              className="fill-zinc-400 text-xs"
            >
              {node.value.split(":")[0]}
            </text>
          )}
        </motion.g>

        {/* Render children recursively */}
        {node.children?.map((child, index) => {
          if (!child) return null
          const childX = x - childSpacing * 2 + (index * childSpacing)
          return renderTrieNode(child, childX, childY)
        })}
      </g>
    )
  }

  const step = newPayloadSteps[currentStep]

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <TreePine className="w-6 h-6 text-purple-400" />
          Sparse Trie: How Reth Achieves 6,666x Speedup
        </h3>
        <p className="text-zinc-400">
          Interactive visualization of Reth&apos;s sparse trie approach for efficient state root computation.
          See how only modified paths are loaded while unchanged regions stay as hashes.
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <button
          onClick={() => setScenario("newPayload")}
          className={cn(
            "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
            scenario === "newPayload"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          new_payload Flow
        </button>
        <button
          onClick={() => setScenario("stateUpdate")}
          disabled
          className="flex-1 px-4 py-2 rounded-lg font-medium text-zinc-600 cursor-not-allowed"
        >
          State Updates (Coming Soon)
        </button>
        <button
          onClick={() => setScenario("verification")}
          disabled
          className="flex-1 px-4 py-2 rounded-lg font-medium text-zinc-600 cursor-not-allowed"
        >
          Proof Verification (Coming Soon)
        </button>
      </div>

      {/* Step Progress */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">Step-by-Step Walkthrough</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              {showCode ? "Hide" : "Show"} Code
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause" : "Auto-play"}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          {newPayloadSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 h-2 rounded-full transition-all",
                index <= currentStep
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : "bg-zinc-700"
              )}
            />
          ))}
        </div>

        {/* Current Step Info */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h5 className="text-xl font-bold text-white mb-2">{step.title}</h5>
            <p className="text-zinc-400">{step.description}</p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center gap-2 transition-colors",
                currentStep === 0
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-zinc-800 hover:bg-zinc-700 text-white"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            
            <span className="text-sm text-zinc-500">
              Step {currentStep + 1} of {newPayloadSteps.length}
            </span>
            
            <button
              onClick={handleNextStep}
              disabled={currentStep === newPayloadSteps.length - 1}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center gap-2 transition-colors",
                currentStep === newPayloadSteps.length - 1
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
              )}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setCurrentStep(0)
                newPayloadSteps[0].action()
                setIsPlaying(false)
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {/* Code Snippet */}
          <AnimatePresence>
            {showCode && step.codeSnippet && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-950 rounded-lg p-4 overflow-x-auto"
              >
                <pre className="text-sm">
                  <code className="language-rust">
                    {step.codeSnippet}
                  </code>
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trie Visualization - Takes 2 columns */}
        <div className="lg:col-span-2 bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-zinc-300">Sparse Trie State</h4>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-zinc-400">Revealed: {revealedNodes.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-zinc-600" />
                <span className="text-zinc-400">Hashed: {50 - revealedNodes.size}</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <svg width="800" height="500" viewBox="0 0 800 500" className="w-full">
              {renderTrieNode(trie)}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-500" />
              <span className="text-zinc-400">Branch (Revealed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500" />
              <span className="text-zinc-400">Extension (Revealed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500" />
              <span className="text-zinc-400">Leaf (Revealed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-zinc-700 border border-zinc-600" />
              <span className="text-zinc-400">Hash (Not Loaded)</span>
            </div>
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="space-y-4">
          {/* Performance Metrics */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <h4 className="font-semibold text-zinc-300 mb-3">Performance Metrics</h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Nodes Loaded</span>
                  <span className="text-white font-mono">{step.metrics?.nodesLoaded || 0}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((step.metrics?.nodesLoaded || 0) / 50) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Nodes as Hashes</span>
                  <span className="text-white font-mono">{step.metrics?.nodesHashed || 50}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-zinc-600"
                    initial={{ width: "100%" }}
                    animate={{ width: `${((step.metrics?.nodesHashed || 50) / 50) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Memory Used</span>
                  <span className="text-green-400 font-mono">{step.metrics?.memoryUsed}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-zinc-400">Time Elapsed</span>
                  <span className="text-blue-400 font-mono">{step.metrics?.timeElapsed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison with Full Trie */}
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
            <h4 className="font-semibold text-zinc-300 mb-3">vs Full Trie</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Memory (Full)</span>
                <span className="text-red-400 font-mono">50 GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Memory (Sparse)</span>
                <span className="text-green-400 font-mono">{step.metrics?.memoryUsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Time (Full)</span>
                <span className="text-red-400 font-mono">200,000 ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Time (Sparse)</span>
                <span className="text-green-400 font-mono">{step.metrics?.timeElapsed}</span>
              </div>
            </div>

            {currentStep === newPayloadSteps.length - 1 && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-green-400">6,666x Faster!</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Sparse trie reduces state root computation from 200s to 30ms
                </p>
              </div>
            )}
          </div>

          {/* Key Benefits */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <h4 className="font-semibold text-blue-400 mb-2">Key Benefits</h4>
            <ul className="space-y-1 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Only load modified paths into memory</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Unchanged subtrees remain as hashes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Minimal database reads needed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Enables fast block validation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Explanation */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-zinc-300">
            <p>
              <strong>The Problem:</strong> Ethereum&apos;s state contains ~200 million accounts. 
              Computing the state root from scratch requires loading the entire 50GB+ trie into memory 
              and takes 200+ seconds.
            </p>
            <p>
              <strong>Reth&apos;s Solution:</strong> The RevealedSparseTrie only loads nodes that are 
              actually modified. For a typical block affecting 100-1000 accounts, this means loading 
              only ~0.0001% of the trie, reducing computation time to 30ms.
            </p>
            <p>
              <strong>How it Works:</strong> Nodes are kept as hashes until reveal_node() is called. 
              The prefix_set tracks which paths need updating. After modifications, only affected 
              hashes are recomputed, bubbling up to the root.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}