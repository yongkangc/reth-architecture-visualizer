"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TreePine, Hash, Database, Cpu, Zap, Info, 
  ChevronRight, GitBranch, Layers, Binary
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TrieNodeType {
  id: string
  type: "branch" | "extension" | "leaf" | "empty"
  nibbles: string[]
  key?: string
  value?: string
  children?: (TrieNodeType | null)[]
  hash?: string
  rlpSize?: number
}

export default function TrieStructureVisualization() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showRlpEncoding, setShowRlpEncoding] = useState(false)
  
  // Example trie structure showing different node types
  const exampleTrie: TrieNodeType = {
    id: "root",
    type: "branch",
    nibbles: [],
    hash: "0xd7f897...",
    rlpSize: 123,
    children: [
      null, // 0
      { // 1
        id: "ext1",
        type: "extension",
        nibbles: ["1", "a", "7"],
        hash: "0xabc123...",
        rlpSize: 45,
        children: [{
          id: "branch1",
          type: "branch",
          nibbles: ["1", "a", "7"],
          hash: "0xdef456...",
          rlpSize: 89,
          children: [
            null, null, // 0, 1
            { // 2
              id: "leaf1",
              type: "leaf",
              nibbles: ["1", "a", "7", "2", "f", "3"],
              key: "0x1a72f3",
              value: "Account{nonce: 5, balance: 1000 ETH}",
              hash: "0x111222...",
              rlpSize: 67
            },
            null, null, null, null, null, null, null, // 3-9
            { // a
              id: "leaf2",
              type: "leaf",
              nibbles: ["1", "a", "7", "a", "b", "c"],
              key: "0x1a7abc",
              value: "Account{nonce: 0, balance: 50 ETH}",
              hash: "0x333444...",
              rlpSize: 65
            },
            null, null, null, null, null // b-f
          ]
        }]
      },
      null, null, null, null, null, null, null, null, // 2-9
      { // a
        id: "leaf3",
        type: "leaf",
        nibbles: ["a", "5", "c", "9"],
        key: "0xa5c9",
        value: "Account{nonce: 100, balance: 0.5 ETH}",
        hash: "0x555666...",
        rlpSize: 64
      },
      null, null, null, null, null // b-f
    ]
  }

  const renderNode = (node: TrieNodeType | null, depth: number = 0, nibbleIndex: number = 0): React.JSX.Element | null => {
    if (!node) return null

    const isSelected = selectedNode === node.id
    const nodeColor = {
      branch: "from-purple-500 to-pink-500",
      extension: "from-blue-500 to-cyan-500",
      leaf: "from-green-500 to-emerald-500",
      empty: "from-zinc-600 to-zinc-700"
    }[node.type]

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: depth * 0.1 }}
        className="relative"
      >
        <motion.div
          onClick={() => setSelectedNode(isSelected ? null : node.id)}
          className={cn(
            "cursor-pointer rounded-xl p-3 transition-all",
            "bg-zinc-900/50 border",
            isSelected ? "border-white shadow-xl" : "border-zinc-700 hover:border-zinc-600"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={cn(
            "w-20 h-20 rounded-lg bg-gradient-to-br flex flex-col items-center justify-center",
            nodeColor
          )}>
            {node.type === "branch" && <GitBranch className="w-8 h-8 text-white" />}
            {node.type === "extension" && <ChevronRight className="w-8 h-8 text-white" />}
            {node.type === "leaf" && <TreePine className="w-8 h-8 text-white" />}
            <span className="text-xs text-white/80 mt-1 font-mono">
              {node.type[0].toUpperCase()}
            </span>
          </div>
          
          <div className="mt-2 text-center">
            <div className="text-xs font-mono text-zinc-400">
              {node.nibbles.join("")}
            </div>
            {node.hash && (
              <div className="text-xs text-zinc-500 truncate max-w-[80px]">
                {node.hash}
              </div>
            )}
          </div>
        </motion.div>

        {/* Show children for branch nodes */}
        {node.type === "branch" && node.children && (
          <div className="flex gap-2 mt-4 justify-center flex-wrap">
            {node.children.map((child, i) => (
              <div key={i} className="relative">
                {child && (
                  <>
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs text-zinc-500 font-mono">
                      {i.toString(16)}
                    </div>
                    <svg className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-px h-4">
                      <line x1="0" y1="0" x2="0" y2="16" stroke="rgb(113 113 122)" />
                    </svg>
                    {renderNode(child, depth + 1, i)}
                  </>
                )}
                {!child && (
                  <div className="w-20 h-20 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center">
                    <span className="text-xs text-zinc-600 font-mono">{i.toString(16)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show child for extension nodes */}
        {node.type === "extension" && node.children && node.children[0] && (
          <div className="mt-4 flex justify-center">
            <div className="relative">
              <svg className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-px h-4">
                <line x1="0" y1="0" x2="0" y2="16" stroke="rgb(113 113 122)" />
              </svg>
              {renderNode(node.children[0], depth + 1, 0)}
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Node Types Explanation */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          Merkle Patricia Trie Node Types
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-950/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-semibold text-purple-400">Branch Node</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Has up to 16 children (one for each hex nibble 0-F). 
              Used when multiple keys share a common prefix.
            </p>
            <div className="mt-2 p-2 bg-zinc-900 rounded text-xs font-mono text-zinc-500">
              children[16] + value?
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-semibold text-blue-400">Extension Node</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Optimizes long shared paths. Contains a shared nibble sequence 
              and points to another node.
            </p>
            <div className="mt-2 p-2 bg-zinc-900 rounded text-xs font-mono text-zinc-500">
              sharedNibbles + nextNode
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <TreePine className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-semibold text-green-400">Leaf Node</h4>
            </div>
            <p className="text-sm text-zinc-400">
              Terminal node containing the actual value (account data). 
              Includes remaining key nibbles.
            </p>
            <div className="mt-2 p-2 bg-zinc-900 rounded text-xs font-mono text-zinc-500">
              keySuffix + value
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Trie Structure */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TreePine className="w-5 h-5 text-green-500" />
          Interactive Trie Structure
        </h3>
        
        <div className="overflow-auto">
          <div className="min-w-[800px] p-8">
            {renderNode(exampleTrie)}
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-700"
            >
              <h4 className="font-semibold mb-2 text-zinc-300">Node Details</h4>
              {(() => {
                const findNodeById = (node: TrieNodeType | null, id: string): TrieNodeType | null => {
                  if (!node) return null
                  if (node.id === id) return node
                  if (node.children) {
                    for (const child of node.children) {
                      const found = findNodeById(child, id)
                      if (found) return found
                    }
                  }
                  return null
                }
                
                const node = findNodeById(exampleTrie, selectedNode)
                if (!node) return null
                
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Type:</span>
                      <span className="font-mono text-zinc-300">{node.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Path:</span>
                      <span className="font-mono text-zinc-300">{node.nibbles.join("")}</span>
                    </div>
                    {node.hash && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Hash:</span>
                        <span className="font-mono text-zinc-300">{node.hash}</span>
                      </div>
                    )}
                    {node.value && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Value:</span>
                        <span className="font-mono text-zinc-300 text-xs">{node.value}</span>
                      </div>
                    )}
                    {node.rlpSize && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">RLP Size:</span>
                        <span className="font-mono text-zinc-300">{node.rlpSize} bytes</span>
                      </div>
                    )}
                  </div>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RLP Encoding Visualization */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Binary className="w-5 h-5 text-orange-500" />
          RLP Encoding in Tries
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-zinc-950/50 rounded-xl">
            <h4 className="font-semibold text-orange-400 mb-2">Compact Encoding</h4>
            <p className="text-sm text-zinc-400 mb-3">
              Nibbles are packed into bytes with a prefix indicating node type and parity:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-zinc-900 rounded">
                <div className="font-mono text-green-400">0x20</div>
                <div className="text-xs text-zinc-500">Even extension node</div>
              </div>
              <div className="p-3 bg-zinc-900 rounded">
                <div className="font-mono text-green-400">0x1_</div>
                <div className="text-xs text-zinc-500">Odd extension node</div>
              </div>
              <div className="p-3 bg-zinc-900 rounded">
                <div className="font-mono text-blue-400">0x00</div>
                <div className="text-xs text-zinc-500">Even leaf node</div>
              </div>
              <div className="p-3 bg-zinc-900 rounded">
                <div className="font-mono text-blue-400">0x3_</div>
                <div className="text-xs text-zinc-500">Odd leaf node</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/50 rounded-xl">
            <h4 className="font-semibold text-orange-400 mb-2">Example Encoding</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Nibbles:</span>
                <span className="text-green-400">[1, a, 7, c]</span>
                <span className="text-zinc-500">→</span>
                <span className="text-blue-400">0x201a7c</span>
              </div>
              <div className="text-xs text-zinc-500">
                Extension node (0x20) + packed nibbles (1a7c)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}