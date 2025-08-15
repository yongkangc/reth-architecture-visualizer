"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  GitBranch, Play, Pause, RotateCcw, Info, AlertTriangle,
  Hash, Database, Cpu, Clock, Zap, CheckCircle, XCircle,
  Activity, Layers, Binary, HardDrive, ArrowRight, ArrowDown,
  Package, Shield, ChevronRight, Gauge, Network, FileCode,
  BarChart3, TreePine, type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import PageContainer from "@/components/ui/PageContainer"

// Trie node types
interface TrieNode {
  id: string
  type: "branch" | "extension" | "leaf" | "account"
  path?: string
  value?: string
  children?: string[]
  hash?: string
  depth: number
  x?: number
  y?: number
  isModified?: boolean
  isComputed?: boolean
}

// State change types
interface StateChange {
  address: string
  field: "balance" | "nonce" | "code" | "storage"
  oldValue: string
  newValue: string
  trieImpact: "leaf" | "branch" | "multiple"
}

// Computation phase
interface ComputationPhase {
  id: string
  name: string
  description: string
  icon: LucideIcon
  duration: string
  steps: ComputationStep[]
  parallelizable: boolean
  bottleneck?: string
}

interface ComputationStep {
  id: string
  name: string
  description: string
  code?: string
  timing: string
  canParallelize: boolean
}

// Sample trie structure for visualization
const sampleTrie: TrieNode[] = [
  { id: "root", type: "branch", depth: 0, x: 400, y: 50, hash: "0xabcd..." },
  { id: "ext1", type: "extension", path: "a7", depth: 1, x: 200, y: 150, children: ["branch1"] },
  { id: "ext2", type: "extension", path: "b3", depth: 1, x: 600, y: 150, children: ["branch2"] },
  { id: "branch1", type: "branch", depth: 2, x: 200, y: 250, children: ["leaf1", "leaf2"] },
  { id: "branch2", type: "branch", depth: 2, x: 600, y: 250, children: ["leaf3", "leaf4"] },
  { id: "leaf1", type: "leaf", path: "4f1b", value: "Account1", depth: 3, x: 100, y: 350 },
  { id: "leaf2", type: "leaf", path: "4f2c", value: "Account2", depth: 3, x: 300, y: 350 },
  { id: "leaf3", type: "leaf", path: "8a3d", value: "Account3", depth: 3, x: 500, y: 350 },
  { id: "leaf4", type: "leaf", path: "8a4e", value: "Account4", depth: 3, x: 700, y: 350 },
]

// Computation phases
const computationPhases: ComputationPhase[] = [
  {
    id: "collect-changes",
    name: "Collect State Changes",
    description: "Gather all modifications from transaction execution",
    icon: Package,
    duration: "~10ms",
    parallelizable: false,
    steps: [
      {
        id: "gather-accounts",
        name: "Gather Modified Accounts",
        description: "Collect all accounts that were modified during execution",
        timing: "~5ms",
        canParallelize: false,
        code: `// Collect state changes from execution
let state_changes = ChangeSet {
    accounts: HashMap<Address, Account>,
    storage: HashMap<(Address, U256), U256>,
    bytecodes: HashMap<B256, Bytecode>,
};

// Iterate through journal entries
for entry in evm.journal {
    match entry {
        AccountCreated(addr) => changes.accounts.insert(addr, ...),
        StorageChanged(addr, key, val) => changes.storage.insert(...),
        BalanceTransfer(from, to, amount) => {
            changes.accounts.get_mut(from).balance -= amount;
            changes.accounts.get_mut(to).balance += amount;
        }
    }
}`
      },
      {
        id: "sort-changes",
        name: "Sort Changes by Path",
        description: "Order changes for optimal trie traversal",
        timing: "~3ms",
        canParallelize: false,
        code: `// Sort by hash for trie locality
let sorted_accounts: BTreeMap<B256, Account> = changes
    .accounts
    .into_iter()
    .map(|(addr, acc)| (keccak256(addr), acc))
    .collect();`
      },
      {
        id: "deduplicate",
        name: "Deduplicate Changes",
        description: "Remove redundant updates to same addresses",
        timing: "~2ms",
        canParallelize: false
      }
    ]
  },
  {
    id: "trie-walking",
    name: "Trie Walking & Node Collection",
    description: "Traverse the trie to find nodes that need updating",
    icon: TreePine,
    duration: "~50ms",
    parallelizable: true,
    bottleneck: "Database I/O",
    steps: [
      {
        id: "load-trie",
        name: "Load Trie Structure",
        description: "Fetch trie nodes from database",
        timing: "~20ms",
        canParallelize: true,
        code: `// Parallel trie walking
pub struct ParallelWalker {
    walkers: Vec<TrieWalker>,
    prefix_sets: Vec<PrefixSet>,
}

impl ParallelWalker {
    pub fn new(num_walkers: usize) -> Self {
        // Split trie into regions by prefix
        let prefix_sets = split_by_prefix(num_walkers);
        let walkers = prefix_sets
            .iter()
            .map(|prefix| TrieWalker::new(prefix.clone()))
            .collect();
        
        Self { walkers, prefix_sets }
    }
    
    pub fn walk(&mut self) -> Vec<TrieNode> {
        self.walkers
            .par_iter_mut()
            .flat_map(|walker| walker.walk())
            .collect()
    }
}`
      },
      {
        id: "identify-paths",
        name: "Identify Update Paths",
        description: "Find all paths from root to modified leaves",
        timing: "~15ms",
        canParallelize: true,
        code: `// Find paths to modified accounts
fn find_update_paths(
    trie: &Trie,
    modified: &[Address]
) -> Vec<TriePath> {
    modified
        .par_iter()
        .map(|addr| {
            let key = keccak256(addr);
            trie.find_path(&key)
        })
        .collect()
}`
      },
      {
        id: "collect-siblings",
        name: "Collect Sibling Nodes",
        description: "Gather sibling hashes needed for proof",
        timing: "~15ms",
        canParallelize: true,
        code: `// Collect siblings for merkle proof
for node in path {
    match node {
        Branch(children) => {
            for (i, child) in children.iter().enumerate() {
                if i != target_index && !child.is_empty() {
                    siblings.push(child.hash());
                }
            }
        }
    }
}`
      }
    ]
  },
  {
    id: "compute-hashes",
    name: "Hash Computation",
    description: "Calculate new hashes for modified nodes",
    icon: Hash,
    duration: "~100ms",
    parallelizable: true,
    bottleneck: "CPU computation",
    steps: [
      {
        id: "hash-leaves",
        name: "Hash Leaf Nodes",
        description: "Compute hashes for modified account states",
        timing: "~30ms",
        canParallelize: true,
        code: `// Hash account state
fn hash_account(account: &Account) -> B256 {
    if account.is_empty() {
        return EMPTY_ROOT;
    }
    
    let encoded = rlp::encode(&[
        account.nonce,
        account.balance,
        account.storage_root,
        account.code_hash,
    ]);
    
    keccak256(&encoded)
}`
      },
      {
        id: "hash-branches",
        name: "Hash Branch Nodes",
        description: "Compute branch node hashes bottom-up",
        timing: "~40ms",
        canParallelize: false,
        code: `// Hash branch node with 16 children + value
fn hash_branch(children: &[Option<B256>; 16], value: Option<&[u8]>) -> B256 {
    let mut stream = RlpStream::new_list(17);
    
    for child in children {
        match child {
            Some(hash) if hash.len() == 32 => stream.append(hash),
            Some(embedded) => stream.append_raw(embedded, 1),
            None => stream.append_empty_data(),
        }
    }
    
    stream.append(&value.unwrap_or_default());
    keccak256(&stream.out())
}`
      },
      {
        id: "propagate-up",
        name: "Propagate Hashes Upward",
        description: "Update parent nodes with new child hashes",
        timing: "~30ms",
        canParallelize: false,
        code: `// Propagate changes up the trie
while let Some(node) = nodes_to_update.pop() {
    let new_hash = match node {
        Leaf(key, value) => hash_leaf(key, value),
        Branch(children, value) => hash_branch(children, value),
        Extension(key, child) => hash_extension(key, child),
    };
    
    if let Some(parent) = node.parent() {
        parent.update_child(node.index(), new_hash);
        nodes_to_update.push(parent);
    }
}`
      }
    ]
  },
  {
    id: "optimization",
    name: "Optimization Strategies",
    description: "Apply optimizations based on workload",
    icon: Zap,
    duration: "Variable",
    parallelizable: true,
    steps: [
      {
        id: "incremental-update",
        name: "Incremental Updates",
        description: "Only recompute changed subtrees",
        timing: "Saves ~40%",
        canParallelize: true,
        code: `// Track dirty nodes for incremental updates
struct IncrementalTrie {
    root: NodeRef,
    dirty: HashSet<NodeId>,
    cache: HashMap<NodeId, B256>,
}

impl IncrementalTrie {
    fn update(&mut self, changes: ChangeSet) {
        // Mark modified paths as dirty
        for (addr, _) in changes.accounts {
            self.mark_path_dirty(addr);
        }
        
        // Only recompute dirty nodes
        self.recompute_dirty();
    }
}`
      },
      {
        id: "parallel-subtrees",
        name: "Parallel Subtree Processing",
        description: "Process independent subtrees concurrently",
        timing: "2-4x speedup",
        canParallelize: true,
        code: `// Split trie into independent subtrees
let subtrees = trie.split_by_prefix(num_threads);

let handles: Vec<_> = subtrees
    .into_iter()
    .map(|subtree| {
        thread::spawn(move || {
            compute_subtree_root(subtree)
        })
    })
    .collect();

// Combine results
let subtree_roots: Vec<B256> = handles
    .into_iter()
    .map(|h| h.join().unwrap())
    .collect();`
      },
      {
        id: "caching",
        name: "Node Caching",
        description: "Cache frequently accessed nodes in memory",
        timing: "Saves ~30% I/O",
        canParallelize: false,
        code: `// LRU cache for trie nodes
struct TrieCache {
    nodes: LruCache<B256, TrieNode>,
    stats: CacheStats,
}

impl TrieCache {
    fn get(&mut self, key: &B256) -> Option<TrieNode> {
        if let Some(node) = self.nodes.get(key) {
            self.stats.hits += 1;
            Some(node.clone())
        } else {
            self.stats.misses += 1;
            None
        }
    }
}`
      }
    ]
  },
  {
    id: "verification",
    name: "Verification & Commitment",
    description: "Verify computed root and commit to state",
    icon: Shield,
    duration: "~5ms",
    parallelizable: false,
    steps: [
      {
        id: "verify-root",
        name: "Verify Root Hash",
        description: "Ensure computed root matches expected",
        timing: "~1ms",
        canParallelize: false,
        code: `// Verify state root matches block header
if computed_root != block.header.state_root {
    return Err(ConsensusError::StateMismatch {
        expected: block.header.state_root,
        computed: computed_root,
    });
}`
      },
      {
        id: "commit-db",
        name: "Commit to Database",
        description: "Persist new trie nodes",
        timing: "~3ms",
        canParallelize: false,
        code: `// Atomic commit of trie updates
let tx = db.begin_transaction();
for (key, node) in updated_nodes {
    tx.put(key, node.encode())?;
}
tx.commit()?;`
      },
      {
        id: "update-cache",
        name: "Update Caches",
        description: "Refresh in-memory caches",
        timing: "~1ms",
        canParallelize: false
      }
    ]
  }
]

// Why we need state root computation
const whyStateRoot = [
  {
    title: "Consensus Verification",
    description: "Every node must compute the same state root for the same block. This ensures all nodes agree on the exact state of the blockchain.",
    icon: Shield,
    critical: true,
    example: "If nodes computed different roots, they would fork into separate chains"
  },
  {
    title: "State Integrity",
    description: "The state root is a cryptographic commitment to the entire state. Any change, no matter how small, produces a completely different root.",
    icon: Hash,
    critical: true,
    example: "Changing 1 wei in any account changes the entire state root"
  },
  {
    title: "Light Client Proofs",
    description: "Light clients can verify account balances and storage values using Merkle proofs against the state root without downloading the entire state.",
    icon: Network,
    critical: false,
    example: "MetaMask can prove your balance using only ~10 hashes instead of 1GB+ of state"
  },
  {
    title: "Fraud Detection",
    description: "Invalid state transitions are immediately detectable by comparing computed vs declared state roots.",
    icon: AlertTriangle,
    critical: true,
    example: "A malicious validator cannot claim false state without being caught"
  },
  {
    title: "State Sync",
    description: "Nodes can sync state incrementally and verify correctness using the state root as a checkpoint.",
    icon: Activity,
    critical: false,
    example: "Snap sync can download state in parallel and verify against root"
  }
]

// Performance benchmarks
const performanceBenchmarks = [
  { 
    scenario: "Empty Block", 
    changes: 0, 
    sequential: "5ms", 
    parallel: "5ms", 
    speedup: "1x",
    note: "Overhead dominates" 
  },
  { 
    scenario: "Small Block (100 txs)", 
    changes: 200, 
    sequential: "150ms", 
    parallel: "80ms", 
    speedup: "1.9x",
    note: "Good parallelization" 
  },
  { 
    scenario: "Medium Block (300 txs)", 
    changes: 600, 
    sequential: "350ms", 
    parallel: "120ms", 
    speedup: "2.9x",
    note: "Near-linear scaling" 
  },
  { 
    scenario: "Large Block (500 txs)", 
    changes: 1000, 
    sequential: "600ms", 
    parallel: "180ms", 
    speedup: "3.3x",
    note: "Approaching limit" 
  },
  { 
    scenario: "Massive Block (1000 txs)", 
    changes: 2000, 
    sequential: "1200ms", 
    parallel: "320ms", 
    speedup: "3.8x",
    note: "Diminishing returns" 
  },
]

export default function StateRootPage() {
  const [activePhase, setActivePhase] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCode, setShowCode] = useState(true)
  const [viewMode, setViewMode] = useState<"overview" | "computation" | "performance" | "why">("overview")
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [computedNodes, setComputedNodes] = useState<Set<string>>(new Set())
  const [modifiedNodes, setModifiedNodes] = useState<Set<string>>(new Set(["leaf1", "leaf3"]))
  const svgRef = useRef<SVGSVGElement>(null)

  // Animation control
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)

  useEffect(() => {
    if (!isPlaying) return

    const phase = computationPhases[currentPhaseIndex]
    if (!phase) {
      setIsPlaying(false)
      return
    }

    setActivePhase(phase.id)
    
    if (currentStepIndex < phase.steps.length) {
      const step = phase.steps[currentStepIndex]
      setActiveStep(step.id)
      
      const timeout = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1)
      }, 1500)
      
      return () => clearTimeout(timeout)
    } else {
      setCurrentStepIndex(0)
      setCurrentPhaseIndex(prev => prev + 1)
    }
  }, [isPlaying, currentPhaseIndex, currentStepIndex])

  const startAnimation = () => {
    resetAnimation()
    setIsPlaying(true)
    setCurrentPhaseIndex(0)
    setCurrentStepIndex(0)
    
    // Animate trie computation
    const nodesToCompute = ["leaf1", "leaf3", "branch1", "branch2", "ext1", "ext2", "root"]
    let index = 0
    const interval = setInterval(() => {
      if (index < nodesToCompute.length) {
        setComputedNodes(prev => new Set([...prev, nodesToCompute[index]]))
        index++
      } else {
        clearInterval(interval)
      }
    }, 500)
  }

  const resetAnimation = () => {
    setIsPlaying(false)
    setActivePhase(null)
    setActiveStep(null)
    setCurrentPhaseIndex(-1)
    setCurrentStepIndex(-1)
    setComputedNodes(new Set())
  }

  const getNodeColor = (node: TrieNode) => {
    if (computedNodes.has(node.id)) return "#10b981" // green
    if (modifiedNodes.has(node.id)) return "#f59e0b" // amber
    if (selectedNode === node.id) return "#3b82f6" // blue
    return "#71717a" // zinc
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "branch": return "B"
      case "extension": return "E"
      case "leaf": return "L"
      case "account": return "A"
      default: return "?"
    }
  }

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">State Root Computation</h1>
            <p className="text-zinc-400 mt-1">Understanding Ethereum&apos;s cryptographic state commitment</p>
          </div>
        </div>

        {/* Critical Info */}
        <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Performance Critical</h3>
              <p className="text-zinc-300 text-sm">
                State root computation is the #1 bottleneck in block processing, taking 30-50% of total validation time.
                Every optimization here directly impacts network scalability and validator performance.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2 mt-6">
          {["why", "overview", "computation", "performance"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as typeof viewMode)}
              className={cn(
                "px-4 py-2 rounded-lg transition-all capitalize",
                viewMode === mode
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              {mode === "why" ? "Why Needed?" : mode}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Controls */}
      {viewMode !== "why" && (
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={isPlaying ? () => setIsPlaying(false) : startAnimation}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Start Computation"}
          </button>
          <button
            onClick={resetAnimation}
            className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium flex items-center gap-2 hover:bg-zinc-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          {viewMode === "computation" && (
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-all"
            >
              {showCode ? "Hide" : "Show"} Code
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === "why" && (
          <motion.div
            key="why"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Why Do We Need State Root Computation?</h2>
              <div className="space-y-4">
                {whyStateRoot.map((reason, index) => (
                  <motion.div
                    key={reason.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      reason.critical
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-zinc-800/50 border-zinc-700"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <reason.icon className={cn(
                        "w-5 h-5 mt-0.5",
                        reason.critical ? "text-red-400" : "text-zinc-400"
                      )} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn(
                            "font-semibold",
                            reason.critical ? "text-red-400" : "text-white"
                          )}>
                            {reason.title}
                          </h3>
                          {reason.critical && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-300 text-sm mb-2">{reason.description}</p>
                        <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800">
                          <p className="text-zinc-400 text-xs">
                            <span className="text-zinc-500">Example:</span> {reason.example}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mathematical Foundation */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Mathematical Foundation</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-green-400 font-medium mb-2">Merkle Patricia Trie</h4>
                  <p className="text-zinc-300 text-sm mb-3">
                    Ethereum uses a modified Merkle Patricia Trie that combines:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <div>
                        <span className="text-white font-medium">Merkle Tree:</span>
                        <span className="text-zinc-400"> Cryptographic proofs via hashing</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <div>
                        <span className="text-white font-medium">Patricia Trie:</span>
                        <span className="text-zinc-400"> Space-efficient key-value storage</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <div>
                        <span className="text-white font-medium">RLP Encoding:</span>
                        <span className="text-zinc-400"> Deterministic serialization</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-blue-400 font-medium mb-2">Properties</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-400 mb-1">Deterministic</p>
                      <p className="text-white">Same state → Same root</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 mb-1">Collision Resistant</p>
                      <p className="text-white">Different states → Different roots</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 mb-1">Efficient Updates</p>
                      <p className="text-white">O(log n) for modifications</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 mb-1">Proof Size</p>
                      <p className="text-white">O(log n) for verification</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Interactive Trie Visualization */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Merkle Patricia Trie Structure</h3>
              <div className="relative">
                <svg
                  ref={svgRef}
                  className="w-full h-[400px]"
                  viewBox="0 0 800 400"
                  onClick={(e) => {
                    const rect = svgRef.current?.getBoundingClientRect()
                    if (!rect) return
                    const x = ((e.clientX - rect.left) / rect.width) * 800
                    const y = ((e.clientY - rect.top) / rect.height) * 400
                    
                    // Find clicked node
                    const clicked = sampleTrie.find(node => {
                      const dx = Math.abs((node.x || 0) - x)
                      const dy = Math.abs((node.y || 0) - y)
                      return dx < 30 && dy < 30
                    })
                    
                    if (clicked) {
                      setSelectedNode(clicked.id)
                    }
                  }}
                >
                  {/* Draw connections */}
                  {sampleTrie.map(node => {
                    if (!node.children) return null
                    return node.children.map(childId => {
                      const child = sampleTrie.find(n => n.id === childId)
                      if (!child) return null
                      
                      return (
                        <motion.line
                          key={`${node.id}-${childId}`}
                          x1={node.x}
                          y1={(node.y || 0) + 20}
                          x2={child.x}
                          y2={(child.y || 0) - 20}
                          stroke={
                            computedNodes.has(node.id) && computedNodes.has(childId)
                              ? "#10b981"
                              : "#3f3f46"
                          }
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      )
                    })
                  })}

                  {/* Draw nodes */}
                  {sampleTrie.map((node, index) => (
                    <motion.g
                      key={node.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="25"
                        fill={getNodeColor(node)}
                        stroke={selectedNode === node.id ? "#3b82f6" : "transparent"}
                        strokeWidth="3"
                        className="cursor-pointer transition-all hover:opacity-80"
                      />
                      
                      {/* Node type indicator */}
                      <text
                        x={node.x}
                        y={(node.y || 0) - 5}
                        textAnchor="middle"
                        fill="white"
                        fontSize="16"
                        fontWeight="bold"
                      >
                        {getNodeIcon(node.type)}
                      </text>
                      
                      {/* Node path/value */}
                      <text
                        x={node.x}
                        y={(node.y || 0) + 10}
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                      >
                        {node.path || node.value || node.id}
                      </text>
                      
                      {/* Hash indicator */}
                      {computedNodes.has(node.id) && (
                        <text
                          x={node.x}
                          y={(node.y || 0) + 45}
                          textAnchor="middle"
                          fill="#10b981"
                          fontSize="9"
                        >
                          {node.hash || "0x..."}
                        </text>
                      )}
                    </motion.g>
                  ))}

                  {/* Legend */}
                  <g transform="translate(20, 20)">
                    <rect x="0" y="0" width="150" height="100" fill="#18181b" stroke="#3f3f46" rx="5" />
                    <text x="10" y="20" fill="white" fontSize="12" fontWeight="bold">Node Types:</text>
                    <text x="10" y="35" fill="#a1a1aa" fontSize="10">B = Branch (16 children)</text>
                    <text x="10" y="50" fill="#a1a1aa" fontSize="10">E = Extension (path compression)</text>
                    <text x="10" y="65" fill="#a1a1aa" fontSize="10">L = Leaf (account data)</text>
                    <text x="10" y="85" fill="#f59e0b" fontSize="10">Orange = Modified</text>
                    <text x="10" y="95" fill="#10b981" fontSize="10">Green = Computed</text>
                  </g>
                </svg>
              </div>

              {/* Node Details */}
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg bg-zinc-800/50"
                >
                  <h4 className="text-white font-semibold mb-2">
                    Node Details: {selectedNode}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-400">Type:</p>
                      <p className="text-white">{sampleTrie.find(n => n.id === selectedNode)?.type}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Depth:</p>
                      <p className="text-white">{sampleTrie.find(n => n.id === selectedNode)?.depth}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Status:</p>
                      <p className={cn(
                        "font-medium",
                        computedNodes.has(selectedNode) ? "text-green-400" :
                        modifiedNodes.has(selectedNode) ? "text-amber-400" :
                        "text-zinc-400"
                      )}>
                        {computedNodes.has(selectedNode) ? "Computed" :
                         modifiedNodes.has(selectedNode) ? "Modified" :
                         "Unchanged"}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Hash:</p>
                      <p className="text-white font-mono text-xs">
                        {computedNodes.has(selectedNode) ? "0xabcd...ef12" : "Not computed"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* State Changes Impact */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Impact of State Changes</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Single Account Balance Change</span>
                    <span className="text-green-400 text-sm">~3-5 nodes affected</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/6 bg-gradient-to-r from-green-500 to-green-400" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Smart Contract Storage Update</span>
                    <span className="text-yellow-400 text-sm">~10-20 nodes affected</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-yellow-500 to-yellow-400" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">DEX Trade (Multiple Updates)</span>
                    <span className="text-orange-400 text-sm">~50-100 nodes affected</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-orange-500 to-orange-400" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Large Block (500+ txs)</span>
                    <span className="text-red-400 text-sm">~1000+ nodes affected</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-red-500 to-red-400" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "computation" && (
          <motion.div
            key="computation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Computation Phases */}
            {computationPhases.map((phase, phaseIndex) => {
              const isActive = activePhase === phase.id
              const isPast = currentPhaseIndex > phaseIndex

              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: phaseIndex * 0.1 }}
                  className={cn(
                    "relative rounded-xl border transition-all duration-500",
                    isActive 
                      ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                      : isPast
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-zinc-800 bg-zinc-900/50"
                  )}
                >
                  {/* Phase Header */}
                  <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <phase.icon className={cn(
                          "w-6 h-6",
                          isActive ? "text-green-400" : "text-zinc-400"
                        )} />
                        <div>
                          <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                          <p className="text-zinc-400 text-sm mt-1">{phase.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-xs">Duration</p>
                        <p className="text-zinc-300 font-mono">{phase.duration}</p>
                        {phase.parallelizable && (
                          <div className="flex items-center gap-1 mt-1">
                            <Cpu className="w-3 h-3 text-green-400" />
                            <span className="text-green-400 text-xs">Parallel</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {phase.bottleneck && (
                      <div className="mt-3 flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">
                          Bottleneck: {phase.bottleneck}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Phase Steps */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {phase.steps.map((step, stepIndex) => {
                        const isStepActive = isActive && activeStep === step.id
                        const isStepPast = isPast || (isActive && currentStepIndex > stepIndex)

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: stepIndex * 0.05 }}
                            className={cn(
                              "relative pl-8",
                              stepIndex < phase.steps.length - 1 && "pb-4 border-l-2 border-zinc-800 ml-3"
                            )}
                          >
                            {/* Step Indicator */}
                            <div className={cn(
                              "absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                              isStepActive 
                                ? "border-green-500 bg-green-500 scale-125"
                                : isStepPast
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-zinc-600 bg-zinc-800"
                            )}>
                              {isStepPast && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>

                            {/* Step Content */}
                            <div className={cn(
                              "ml-4 rounded-lg transition-all duration-500",
                              isStepActive
                                ? "bg-green-500/20 border border-green-500/50 p-4"
                                : "bg-zinc-800/30 p-4"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={cn(
                                  "font-semibold transition-colors",
                                  isStepActive ? "text-green-400" : "text-white"
                                )}>
                                  {step.name}
                                </h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-zinc-500 font-mono">{step.timing}</span>
                                  {step.canParallelize && (
                                    <div className="flex items-center gap-1">
                                      <Cpu className="w-3 h-3 text-blue-400" />
                                      <span className="text-blue-400 text-xs">Parallel</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-zinc-400">{step.description}</p>
                              
                              {/* Code Sample */}
                              {showCode && step.code && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3"
                                >
                                  <pre className="p-3 rounded bg-zinc-900 border border-zinc-800 overflow-x-auto">
                                    <code className="text-xs text-zinc-300 font-mono">
                                      {step.code}
                                    </code>
                                  </pre>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {viewMode === "performance" && (
          <motion.div
            key="performance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Performance Benchmarks */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Benchmarks</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-2 text-zinc-400 text-sm">Scenario</th>
                      <th className="text-center py-2 text-zinc-400 text-sm">Changes</th>
                      <th className="text-center py-2 text-zinc-400 text-sm">Sequential</th>
                      <th className="text-center py-2 text-zinc-400 text-sm">Parallel</th>
                      <th className="text-center py-2 text-zinc-400 text-sm">Speedup</th>
                      <th className="text-left py-2 text-zinc-400 text-sm">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceBenchmarks.map((benchmark, index) => (
                      <tr key={index} className="border-b border-zinc-800">
                        <td className="py-3 text-white">{benchmark.scenario}</td>
                        <td className="py-3 text-center text-zinc-300">{benchmark.changes}</td>
                        <td className="py-3 text-center text-red-400 font-mono">{benchmark.sequential}</td>
                        <td className="py-3 text-center text-green-400 font-mono">{benchmark.parallel}</td>
                        <td className="py-3 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-semibold",
                            parseFloat(benchmark.speedup) >= 3 
                              ? "bg-green-500/20 text-green-400"
                              : parseFloat(benchmark.speedup) >= 2
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-zinc-700 text-zinc-400"
                          )}>
                            {benchmark.speedup}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-500 text-sm">{benchmark.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Optimization Techniques */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Optimization Techniques</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h4 className="text-yellow-400 font-medium">Incremental Computation</h4>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">
                    Only recompute nodes along paths from modified leaves to root.
                  </p>
                  <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800">
                    <p className="text-green-400 text-xs font-mono">Performance: 40% faster</p>
                    <p className="text-blue-400 text-xs font-mono">Memory: +20MB cache</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    <h4 className="text-blue-400 font-medium">Parallel Walking</h4>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">
                    Split trie by prefix and process subtrees on different cores.
                  </p>
                  <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800">
                    <p className="text-green-400 text-xs font-mono">Performance: 3-4x speedup</p>
                    <p className="text-blue-400 text-xs font-mono">Cores: Scales to 8</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-purple-400" />
                    <h4 className="text-purple-400 font-medium">Batch Database Reads</h4>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">
                    Prefetch all required nodes in single DB operation.
                  </p>
                  <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800">
                    <p className="text-green-400 text-xs font-mono">I/O: 60% reduction</p>
                    <p className="text-blue-400 text-xs font-mono">Latency: -30ms</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="w-5 h-5 text-green-400" />
                    <h4 className="text-green-400 font-medium">Memory Caching</h4>
                  </div>
                  <p className="text-zinc-400 text-sm mb-2">
                    Keep frequently accessed nodes in LRU cache.
                  </p>
                  <div className="p-2 rounded bg-zinc-900/50 border border-zinc-800">
                    <p className="text-green-400 text-xs font-mono">Hit Rate: 85%+</p>
                    <p className="text-blue-400 text-xs font-mono">Memory: 100-500MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Path Analysis */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Critical Path Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white">Hash Computation</p>
                      <span className="text-red-400 font-mono text-sm">40% of time</span>
                    </div>
                    <p className="text-zinc-500 text-xs">Keccak256 hashing of all modified nodes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white">Database I/O</p>
                      <span className="text-orange-400 font-mono text-sm">30% of time</span>
                    </div>
                    <p className="text-zinc-500 text-xs">Reading and writing trie nodes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white">RLP Encoding</p>
                      <span className="text-yellow-400 font-mono text-sm">20% of time</span>
                    </div>
                    <p className="text-zinc-500 text-xs">Serialization of node data</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">4</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white">Tree Traversal</p>
                      <span className="text-green-400 font-mono text-sm">10% of time</span>
                    </div>
                    <p className="text-zinc-500 text-xs">Walking the trie structure</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}