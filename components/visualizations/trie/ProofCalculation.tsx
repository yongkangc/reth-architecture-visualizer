"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, Hash, GitBranch, Database, Cpu, CheckCircle,
  ArrowRight, Layers, Binary, Key, Lock, Zap, Info
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProofStep {
  id: string
  title: string
  description: string
  code?: string
  highlight?: string[]
}

interface ProofNode {
  path: string
  hash: string
  type: "branch" | "extension" | "leaf"
  included: boolean
}

const PROOF_STEPS: ProofStep[] = [
  {
    id: "targets",
    title: "1. Collect Proof Targets",
    description: "Gather all accounts and storage slots that need proofs",
    code: `// Collect targets from the state
let mut account_rlp = Vec::with_capacity(targets.len());
let mut storage_roots = HashMap::default();

for (address, (account, storage)) in &self.targets {
    account_proofs.push(address);
    storage_proofs.push((address, storage.keys()));
}`,
    highlight: ["targets", "account_proofs", "storage_proofs"]
  },
  {
    id: "prefix",
    title: "2. Build Prefix Sets",
    description: "Create prefix sets to identify which trie paths need to be included",
    code: `// Build prefix sets for efficient traversal
let account_prefix_set = self.account_proof_nodes
    .iter()
    .map(|(nibbles, _)| nibbles.clone())
    .collect::<PrefixSet>();

let storage_prefix_sets = self.storage_proof_nodes
    .iter()
    .map(|(address, prefix_set)| (*address, prefix_set.clone()))
    .collect();`,
    highlight: ["PrefixSet", "account_prefix_set", "storage_prefix_sets"]
  },
  {
    id: "walk",
    title: "3. Walk the Trie",
    description: "Traverse the trie using TrieWalker, collecting nodes needed for proofs",
    code: `// Walk through the trie collecting proof nodes
let walker = TrieWalker::new(trie_cursor, prefix_set);

while let Some((path, node)) = walker.next() {
    if is_proof_node(&path, &targets) {
        proof_nodes.insert(path, node.clone());
    }
    
    // Skip subtrees that don't contain targets
    if !prefix_set.contains(&path) {
        walker.skip_current_node();
    }
}`,
    highlight: ["TrieWalker", "proof_nodes", "skip_current_node"]
  },
  {
    id: "parallel",
    title: "4. Parallel Storage Proofs",
    description: "Generate storage proofs in parallel for better performance",
    code: `// Spawn parallel tasks for storage proofs
let storage_handles = targets
    .into_iter()
    .map(|(address, slots)| {
        tokio::spawn(async move {
            generate_storage_proof(address, slots).await
        })
    })
    .collect::<Vec<_>>();

// Await all storage proofs
let storage_proofs = futures::future::join_all(storage_handles).await;`,
    highlight: ["tokio::spawn", "parallel", "join_all"]
  },
  {
    id: "rebuild",
    title: "5. Rebuild Root Hash",
    description: "Use HashBuilder to reconstruct the root hash from proof nodes",
    code: `// Rebuild the root using collected nodes
let mut hash_builder = HashBuilder::new();

for (path, node) in proof_nodes {
    hash_builder.add_node(path, node);
}

let computed_root = hash_builder.compute_root();
assert_eq!(computed_root, expected_root, "Proof verification failed");`,
    highlight: ["HashBuilder", "compute_root", "verification"]
  },
  {
    id: "encode",
    title: "6. Encode Multi-Proof",
    description: "Encode all proof data into a compact format for transmission",
    code: `// Create the final MultiProof structure
MultiProof {
    account_subtree: encode_subtree(account_nodes),
    storage_subtrees: storage_proofs
        .into_iter()
        .map(|(addr, nodes)| (addr, encode_subtree(nodes)))
        .collect(),
    branch_node_masks: collect_branch_masks(&proof_nodes)
}`,
    highlight: ["MultiProof", "encode_subtree", "branch_node_masks"]
  }
]

export default function ProofCalculation() {
  const [activeStep, setActiveStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Auto-advance through steps
  useEffect(() => {
    if (isAnimating && activeStep < PROOF_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setActiveStep(prev => prev + 1)
      }, 3000)
      return () => clearTimeout(timer)
    } else if (isAnimating && activeStep === PROOF_STEPS.length - 1) {
      setIsAnimating(false)
    }
  }, [isAnimating, activeStep])

  const currentStep = PROOF_STEPS[activeStep]

  // Sample proof tree visualization
  const renderProofTree = () => {
    const nodes: ProofNode[] = [
      { path: "0x5", hash: "0xabc...", type: "branch", included: activeStep >= 2 },
      { path: "0x5a", hash: "0xdef...", type: "branch", included: activeStep >= 2 },
      { path: "0x5a2", hash: "0x123...", type: "leaf", included: activeStep >= 3 },
      { path: "0x5a3", hash: "0x456...", type: "leaf", included: false },
      { path: "0x5b", hash: "0x789...", type: "extension", included: activeStep >= 2 },
      { path: "0x5b4", hash: "0xfed...", type: "leaf", included: activeStep >= 3 },
    ]

    return (
      <svg width="100%" height="300" viewBox="0 0 400 300">
        {/* Draw connections */}
        <line x1="200" y1="50" x2="150" y2="120" stroke="#525252" strokeWidth="2" />
        <line x1="200" y1="50" x2="250" y2="120" stroke="#525252" strokeWidth="2" />
        <line x1="150" y1="120" x2="120" y2="190" stroke="#525252" strokeWidth="2" />
        <line x1="150" y1="120" x2="180" y2="190" stroke="#525252" strokeWidth="2" />
        <line x1="250" y1="120" x2="250" y2="190" stroke="#525252" strokeWidth="2" />

        {/* Draw nodes */}
        {nodes.map((node, i) => {
          const positions = [
            { x: 200, y: 50 },   // root
            { x: 150, y: 120 },  // 5a
            { x: 120, y: 190 },  // 5a2
            { x: 180, y: 190 },  // 5a3
            { x: 250, y: 120 },  // 5b
            { x: 250, y: 190 },  // 5b4
          ]
          const pos = positions[i]
          
          return (
            <g key={node.path}>
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="20"
                fill={
                  node.included
                    ? node.type === "branch" ? "#8b5cf6"
                    : node.type === "extension" ? "#06b6d4"
                    : "#10b981"
                    : "#404040"
                }
                initial={{ scale: 0 }}
                animate={{ scale: node.included ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-xs font-bold"
              >
                {node.path.slice(-2)}
              </text>
              {node.included && (
                <motion.text
                  x={pos.x}
                  y={pos.y + 35}
                  textAnchor="middle"
                  className="fill-zinc-400 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {node.hash.slice(0, 6)}
                </motion.text>
              )}
            </g>
          )
        })}

        {/* Highlight proof path */}
        {activeStep >= 3 && (
          <motion.path
            d="M 200 50 L 150 120 L 120 190"
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            strokeDasharray="5,5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
        )}
      </svg>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" />
          Merkle Proof Calculation Algorithm
        </h3>
        <p className="text-zinc-400">
          Understanding how Reth generates cryptographic proofs for state verification.
          The MultiProof system enables efficient batch verification of multiple accounts and storage slots.
        </p>
      </div>

      {/* Key Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold">MultiProof</h4>
          </div>
          <p className="text-sm text-zinc-400">
            Batch proof generation for multiple targets in a single operation
          </p>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold">Parallel Processing</h4>
          </div>
          <p className="text-sm text-zinc-400">
            Storage proofs generated concurrently for maximum performance
          </p>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h4 className="font-semibold">Prefix Optimization</h4>
          </div>
          <p className="text-sm text-zinc-400">
            Skip irrelevant subtrees using prefix sets for efficient traversal
          </p>
        </div>
      </div>

      {/* Algorithm Steps */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">Proof Generation Steps</h4>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveStep(0)
                setIsAnimating(true)
              }}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              Play Animation
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              {showDetails ? "Hide" : "Show"} Code
            </button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-6">
          {PROOF_STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={cn(
                "flex-1 h-2 rounded-full transition-all",
                index <= activeStep
                  ? "bg-gradient-to-r from-purple-500 to-pink-500"
                  : "bg-zinc-700"
              )}
            />
          ))}
        </div>

        {/* Current Step */}
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h5 className="text-xl font-bold text-white mb-2">{currentStep.title}</h5>
            <p className="text-zinc-400">{currentStep.description}</p>
          </div>

          {/* Code Example */}
          <AnimatePresence>
            {showDetails && currentStep.code && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-950 rounded-lg p-4 overflow-x-auto"
              >
                <pre className="text-sm">
                  <code className="language-rust">
                    {currentStep.code.split('\n').map((line, i) => {
                      const shouldHighlight = currentStep.highlight?.some(h => 
                        line.includes(h)
                      )
                      return (
                        <div
                          key={i}
                          className={cn(
                            "leading-relaxed",
                            shouldHighlight && "bg-purple-500/10 -mx-4 px-4"
                          )}
                        >
                          {line}
                        </div>
                      )
                    })}
                  </code>
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Visual Representation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proof Tree */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <h4 className="font-semibold text-zinc-300 mb-4">Proof Node Selection</h4>
          <div className="relative">
            {renderProofTree()}
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-zinc-400">Branch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-zinc-400">Extension</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-zinc-400">Leaf</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-600" />
              <span className="text-zinc-400">Excluded</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <h4 className="font-semibold text-zinc-300 mb-4">Performance Impact</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">Serial Processing</span>
                <span className="text-red-400">~500ms</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">Parallel Processing</span>
                <span className="text-green-400">~150ms</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: "30%" }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">With Prefix Optimization</span>
                <span className="text-blue-400">~80ms</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: "16%" }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-green-400">6.25x Speedup</span>
            </div>
            <p className="text-sm text-zinc-400">
              Combining parallel processing with prefix optimization achieves 
              an 84% reduction in proof generation time.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-zinc-300">
            <p>
              <strong>Key Innovation:</strong> The MultiProof system in Reth allows generating 
              proofs for multiple accounts and their storage in a single pass through the trie.
            </p>
            <p>
              <strong>Optimizations:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-4">
              <li>Prefix sets eliminate unnecessary trie traversal</li>
              <li>Parallel storage proof generation using tokio</li>
              <li>Branch node masks for compact proof representation</li>
              <li>Lazy evaluation prevents unnecessary computation</li>
              <li>In-memory node caching reduces database lookups</li>
            </ul>
            <p className="text-zinc-400">
              This approach is critical for light clients and cross-chain bridges that need 
              to verify state without downloading the entire blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}