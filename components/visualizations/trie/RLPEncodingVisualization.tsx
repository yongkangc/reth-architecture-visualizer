"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Binary, Package, Minimize2, Maximize2, ArrowRight, 
  Info, AlertTriangle, CheckCircle, Hash, Database,
  FileText, Layers, Zap, Code2
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for RLP encoding examples
interface RLPExample {
  id: string
  name: string
  input: string | string[] | { type: string; children?: (string | null)[]; value: string | null; key?: string }
  encoded: string
  bytes: number[]
  explanation: string
  category: "single" | "string" | "list" | "trie"
}

interface EncodingStep {
  step: number
  description: string
  value: string
  encoded: string
  rule: string
}

// RLP encoding examples
const RLP_EXAMPLES: RLPExample[] = [
  {
    id: "single-byte",
    name: "Single Byte (< 128)",
    input: "a",
    encoded: "0x61",
    bytes: [0x61],
    explanation: "Single bytes less than 128 (0x80) are their own RLP encoding",
    category: "single"
  },
  {
    id: "empty-string",
    name: "Empty String",
    input: "",
    encoded: "0x80",
    bytes: [0x80],
    explanation: "Empty string is encoded as 0x80",
    category: "string"
  },
  {
    id: "short-string",
    name: "Short String (1-55 bytes)",
    input: "dog",
    encoded: "0x83646f67",
    bytes: [0x83, 0x64, 0x6f, 0x67],
    explanation: "Prefix 0x80 + length (3) = 0x83, followed by UTF-8 bytes",
    category: "string"
  },
  {
    id: "long-string",
    name: "Long String (> 55 bytes)",
    input: "Lorem ipsum dolor sit amet, consectetur adipisicing elit",
    encoded: "0xb8384c6f72656d20697073756d...",
    bytes: [0xb8, 0x38, /* ... */],
    explanation: "Prefix 0xb7 + 1 (length of length) = 0xb8, then length (56 = 0x38), then data",
    category: "string"
  },
  {
    id: "empty-list",
    name: "Empty List",
    input: [],
    encoded: "0xc0",
    bytes: [0xc0],
    explanation: "Empty list is encoded as 0xc0",
    category: "list"
  },
  {
    id: "simple-list",
    name: "Simple List",
    input: ["cat", "dog"],
    encoded: "0xc88363617483646f67",
    bytes: [0xc8, 0x83, 0x63, 0x61, 0x74, 0x83, 0x64, 0x6f, 0x67],
    explanation: "Prefix 0xc0 + total length (8) = 0xc8, then encoded items",
    category: "list"
  },
  {
    id: "branch-node",
    name: "Trie Branch Node",
    input: {
      type: "branch",
      children: ["hash1", "hash2", null, null, "hash3"],
      value: null
    },
    encoded: "0xf851a0...",
    bytes: [0xf8, 0x51, /* ... */],
    explanation: "Branch nodes have 17 elements: 16 children + 1 value",
    category: "trie"
  },
  {
    id: "leaf-node",
    name: "Trie Leaf Node",
    input: {
      type: "leaf",
      key: "0x20365b",
      value: "100 ETH"
    },
    encoded: "0xc98320365b87313030204554",
    bytes: [0xc9, 0x83, 0x20, 0x36, 0x5b, 0x87, /* ... */],
    explanation: "Leaf nodes are lists with [encoded_path, value]",
    category: "trie"
  }
]

// RLP encoding rules
const RLP_RULES = [
  {
    range: "[0x00, 0x7f]",
    description: "Single byte",
    encoding: "Itself",
    example: "'a' → 0x61"
  },
  {
    range: "[0x80, 0xb7]",
    description: "String 0-55 bytes",
    encoding: "0x80 + len, data",
    example: "'dog' → 0x83 + 'dog'"
  },
  {
    range: "[0xb8, 0xbf]",
    description: "String 56+ bytes",
    encoding: "0xb7 + len_of_len, len, data",
    example: "Long string → 0xb8 + 0x38 + data"
  },
  {
    range: "[0xc0, 0xf7]",
    description: "List 0-55 bytes total",
    encoding: "0xc0 + total_len, items",
    example: "['cat'] → 0xc4 + encoded_items"
  },
  {
    range: "[0xf8, 0xff]",
    description: "List 56+ bytes total",
    encoding: "0xf7 + len_of_len, total_len, items",
    example: "Large list → 0xf8 + size + items"
  }
]

export default function RLPEncodingVisualization() {
  const [selectedExample, setSelectedExample] = useState<RLPExample>(RLP_EXAMPLES[0])
  const [activeCategory, setActiveCategory] = useState<"single" | "string" | "list" | "trie">("single")
  const [showEncoding, setShowEncoding] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Generate encoding steps for current example
  const generateEncodingSteps = (example: RLPExample): EncodingStep[] => {
    const steps: EncodingStep[] = []
    
    switch (example.category) {
      case "single":
        steps.push({
          step: 1,
          description: "Check if single byte < 128",
          value: example.input,
          encoded: example.encoded,
          rule: "Single bytes < 0x80 are their own encoding"
        })
        break
        
      case "string":
        if (example.input === "") {
          steps.push({
            step: 1,
            description: "Empty string",
            value: "''",
            encoded: "0x80",
            rule: "Empty string is always 0x80"
          })
        } else if (example.input.length <= 55) {
          steps.push({
            step: 1,
            description: "Calculate string length",
            value: `Length: ${example.input.length}`,
            encoded: `0x${(0x80 + example.input.length).toString(16)}`,
            rule: "Prefix = 0x80 + length"
          })
          steps.push({
            step: 2,
            description: "Encode string data",
            value: example.input,
            encoded: example.encoded,
            rule: "Prefix + UTF-8 bytes"
          })
        } else {
          steps.push({
            step: 1,
            description: "String > 55 bytes",
            value: `Length: ${example.input.length}`,
            encoded: `0x${example.input.length.toString(16)}`,
            rule: "Calculate length in bytes"
          })
          steps.push({
            step: 2,
            description: "Calculate length of length",
            value: "1 byte needed for length",
            encoded: "0xb8",
            rule: "Prefix = 0xb7 + len_of_len"
          })
          steps.push({
            step: 3,
            description: "Combine prefix + length + data",
            value: example.input.substring(0, 20) + "...",
            encoded: example.encoded,
            rule: "Final encoding"
          })
        }
        break
        
      case "list":
        if (example.input.length === 0) {
          steps.push({
            step: 1,
            description: "Empty list",
            value: "[]",
            encoded: "0xc0",
            rule: "Empty list is always 0xc0"
          })
        } else {
          steps.push({
            step: 1,
            description: "Encode each item",
            value: JSON.stringify(example.input),
            encoded: "Individual encodings",
            rule: "RLP encode each element"
          })
          steps.push({
            step: 2,
            description: "Calculate total length",
            value: "Sum of encoded items",
            encoded: `Total: ${example.bytes.length - 1} bytes`,
            rule: "Add up all encoded lengths"
          })
          steps.push({
            step: 3,
            description: "Add list prefix",
            value: `0xc0 + ${example.bytes.length - 1}`,
            encoded: example.encoded,
            rule: "Prefix + concatenated items"
          })
        }
        break
        
      case "trie":
        steps.push({
          step: 1,
          description: "Identify node type",
          value: example.input.type,
          encoded: "Determines encoding structure",
          rule: "Branch = 17 items, Leaf = 2 items"
        })
        steps.push({
          step: 2,
          description: "Encode node elements",
          value: "Keys, values, children",
          encoded: "RLP encode each part",
          rule: "Recursive RLP encoding"
        })
        steps.push({
          step: 3,
          description: "Create final list",
          value: "All elements",
          encoded: example.encoded,
          rule: "List encoding of all parts"
        })
        break
    }
    
    return steps
  }

  const encodingSteps = generateEncodingSteps(selectedExample)

  // Auto-advance through steps
  useEffect(() => {
    if (showEncoding && currentStep < encodingSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [showEncoding, currentStep, encodingSteps.length])

  // Visualize byte representation
  const renderByteVisualization = (bytes: number[]) => {
    return (
      <div className="flex flex-wrap gap-2">
        {bytes.map((byte, index) => {
          const isPrefix = index === 0
          const isLength = index === 1 && byte < 0x80 && bytes[0] >= 0xb8
          
          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative group"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center font-mono text-xs",
                isPrefix && "bg-purple-500/20 border-2 border-purple-500",
                isLength && "bg-blue-500/20 border-2 border-blue-500",
                !isPrefix && !isLength && "bg-zinc-800 border border-zinc-700"
              )}>
                {byte.toString(16).padStart(2, '0').toUpperCase()}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-zinc-900 text-xs text-zinc-300 px-2 py-1 rounded whitespace-nowrap border border-zinc-700">
                  {isPrefix ? "Prefix byte" :
                   isLength ? "Length byte" :
                   `Data: ${String.fromCharCode(byte)}`}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <Binary className="w-6 h-6 text-blue-400" />
          RLP Encoding in Ethereum Tries
        </h3>
        <p className="text-zinc-400">
          Recursive Length Prefix (RLP) is Ethereum&apos;s serialization method for encoding arbitrarily 
          nested arrays of binary data. It&apos;s crucial for trie nodes, transactions, and blocks.
        </p>
      </div>

      {/* Why RLP? */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Minimize2 className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold">Space Efficient</h4>
          </div>
          <p className="text-sm text-zinc-400">
            Minimal overhead - no schema needed. Perfect for blockchain storage.
          </p>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h4 className="font-semibold">Fast & Simple</h4>
          </div>
          <p className="text-sm text-zinc-400">
            No complex parsing. Single-pass encoding and decoding.
          </p>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold">Deterministic</h4>
          </div>
          <p className="text-sm text-zinc-400">
            Same input always produces same output. Critical for consensus.
          </p>
        </div>
      </div>

      {/* RLP Rules */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
        <h4 className="text-lg font-semibold mb-4">RLP Encoding Rules</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 px-3 text-zinc-400">Prefix Range</th>
                <th className="text-left py-2 px-3 text-zinc-400">Data Type</th>
                <th className="text-left py-2 px-3 text-zinc-400">Encoding Rule</th>
                <th className="text-left py-2 px-3 text-zinc-400">Example</th>
              </tr>
            </thead>
            <tbody>
              {RLP_RULES.map((rule, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="py-2 px-3 font-mono text-purple-400">{rule.range}</td>
                  <td className="py-2 px-3 text-zinc-300">{rule.description}</td>
                  <td className="py-2 px-3 text-zinc-400">{rule.encoding}</td>
                  <td className="py-2 px-3 font-mono text-xs text-zinc-500">{rule.example}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Examples */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
        <h4 className="text-lg font-semibold mb-4">Interactive RLP Examples</h4>
        
        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          {["single", "string", "list", "trie"].map(category => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category as "single" | "string" | "list" | "trie")
                setSelectedExample(RLP_EXAMPLES.find(e => e.category === category)!)
                setCurrentStep(0)
                setShowEncoding(false)
              }}
              className={cn(
                "px-4 py-2 rounded-lg font-medium capitalize transition-all",
                activeCategory === category
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              {category === "trie" ? "Trie Nodes" : category}
            </button>
          ))}
        </div>

        {/* Example Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Examples List */}
          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-zinc-400 mb-3">Select Example:</h5>
            {RLP_EXAMPLES.filter(e => e.category === activeCategory).map(example => (
              <button
                key={example.id}
                onClick={() => {
                  setSelectedExample(example)
                  setCurrentStep(0)
                  setShowEncoding(false)
                }}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all",
                  selectedExample.id === example.id
                    ? "bg-zinc-800 border border-blue-500/50"
                    : "bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800/50"
                )}
              >
                <div className="font-semibold text-sm text-white">{example.name}</div>
                <div className="text-xs text-zinc-500 mt-1 font-mono">
                  {typeof example.input === "string" 
                    ? `"${example.input}"` 
                    : JSON.stringify(example.input).slice(0, 50)}
                </div>
              </button>
            ))}
          </div>

          {/* Encoding Visualization */}
          <div className="space-y-4">
            <div className="bg-zinc-950/50 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-zinc-400 mb-3">Input:</h5>
              <div className="font-mono text-sm text-white bg-zinc-900 rounded p-3">
                {typeof selectedExample.input === "string" 
                  ? `"${selectedExample.input}"`
                  : JSON.stringify(selectedExample.input, null, 2)}
              </div>
            </div>

            <div className="bg-zinc-950/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-zinc-400">RLP Encoded:</h5>
                <button
                  onClick={() => setShowEncoding(!showEncoding)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition-colors"
                >
                  {showEncoding ? "Hide" : "Show"} Steps
                </button>
              </div>
              
              <div className="font-mono text-sm text-green-400 bg-zinc-900 rounded p-3">
                {selectedExample.encoded}
              </div>
              
              <div className="mt-3">
                {renderByteVisualization(selectedExample.bytes.slice(0, 10))}
                {selectedExample.bytes.length > 10 && (
                  <p className="text-xs text-zinc-500 mt-2">
                    ... and {selectedExample.bytes.length - 10} more bytes
                  </p>
                )}
              </div>
            </div>

            {/* Encoding Steps */}
            <AnimatePresence>
              {showEncoding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-zinc-950/50 rounded-lg p-4"
                >
                  <h5 className="text-sm font-semibold text-zinc-400 mb-3">Encoding Steps:</h5>
                  <div className="space-y-2">
                    {encodingSteps.slice(0, currentStep + 1).map((step, index) => (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="flex gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-xs font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{step.description}</p>
                          <p className="text-xs text-zinc-500 mt-1">{step.rule}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Explanation */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-zinc-300">
                {selectedExample.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trie Node Encoding */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          RLP in Merkle Patricia Tries
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-purple-300 mb-3">Node Types & Encoding:</h5>
            <div className="space-y-3">
              <div className="bg-zinc-900/50 rounded-lg p-3">
                <h6 className="font-semibold text-sm text-white mb-1">Branch Node (17 elements)</h6>
                <p className="text-xs text-zinc-400 mb-2">
                  16 children (one per hex digit) + 1 value
                </p>
                <div className="font-mono text-xs bg-zinc-950 rounded p-2">
                  [child0, child1, ..., child15, value]
                </div>
              </div>
              
              <div className="bg-zinc-900/50 rounded-lg p-3">
                <h6 className="font-semibold text-sm text-white mb-1">Extension Node (2 elements)</h6>
                <p className="text-xs text-zinc-400 mb-2">
                  Shared nibbles + next node reference
                </p>
                <div className="font-mono text-xs bg-zinc-950 rounded p-2">
                  [encoded_path, node_hash]
                </div>
              </div>
              
              <div className="bg-zinc-900/50 rounded-lg p-3">
                <h6 className="font-semibold text-sm text-white mb-1">Leaf Node (2 elements)</h6>
                <p className="text-xs text-zinc-400 mb-2">
                  Remaining path + value
                </p>
                <div className="font-mono text-xs bg-zinc-950 rounded p-2">
                  [encoded_path, value]
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-semibold text-purple-300 mb-3">Reth Implementation:</h5>
            <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs">
                <code className="language-rust">{`// From reth/crates/trie/common/src/node.rs
impl Encodable for BranchNode {
    fn encode(&self, out: &mut dyn BufMut) {
        // Start list encoding
        let mut list = Vec::with_capacity(17);
        
        // Add 16 children
        for child in &self.children {
            match child {
                Some(hash) => list.push(hash.encode()),
                None => list.push(EMPTY_STRING_CODE),
            }
        }
        
        // Add value (17th element)
        list.push(self.value.encode());
        
        // RLP encode the list
        encode_list(&list, out);
    }
}

// Leaf and Extension use Compact Encoding
fn encode_path_leaf(nibbles: &[u8], out: &mut Vec<u8>) {
    let flag = 0x20; // Leaf flag
    compact_encode(nibbles, flag, out);
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-zinc-300">
            <p>
              <strong>Why RLP for Tries?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-4">
              <li>Deterministic encoding ensures same hash for same trie structure</li>
              <li>Compact representation minimizes storage and network overhead</li>
              <li>Simple rules make verification fast and reliable</li>
              <li>Recursive nature perfectly matches trie&apos;s recursive structure</li>
              <li>No schema needed - self-describing format</li>
            </ul>
            <p className="text-zinc-400 mt-2">
              In Reth, RLP encoding happens just before hashing. The node is first constructed,
              then RLP encoded, then hashed with Keccak256 to produce the node&apos;s hash.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}