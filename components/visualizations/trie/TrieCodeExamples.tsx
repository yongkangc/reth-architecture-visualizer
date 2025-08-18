"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Code2, Copy, Check, FileCode, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeExample {
  id: string
  title: string
  description: string
  file: string
  lines: string
  code: string
  language: string
}

export default function TrieCodeExamples() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState(0)

  const codeExamples: CodeExample[] = [
    {
      id: "walker-struct",
      title: "TrieWalker Structure",
      description: "Core walker implementation with skip optimization",
      file: "crates/trie/trie/src/walker.rs",
      lines: "13-33",
      language: "rust",
      code: `/// \`TrieWalker\` is a structure that enables traversal of a Merkle trie.
/// It allows moving through the trie in a depth-first manner, skipping certain branches
/// if they have not changed.
#[derive(Debug)]
pub struct TrieWalker<C> {
    /// A mutable reference to a trie cursor instance used for navigating the trie.
    pub cursor: C,
    /// A vector containing the trie nodes that have been visited.
    pub stack: Vec<CursorSubNode>,
    /// A flag indicating whether the current node can be skipped when traversing the trie.
    /// This is determined by whether the current key's prefix is included in the prefix set
    /// and if the hash flag is set.
    pub can_skip_current_node: bool,
    /// A \`PrefixSet\` representing the changes to be applied to the trie.
    pub changes: PrefixSet,
    /// The retained trie node keys that need to be removed.
    removed_keys: Option<HashSet<Nibbles>>,
    #[cfg(feature = "metrics")]
    /// Walker metrics.
    metrics: WalkerMetrics,
}`
    },
    {
      id: "skip-logic",
      title: "Skip Node Logic",
      description: "Determines when subtrees can be skipped",
      file: "crates/trie/trie/src/walker.rs",
      lines: "150-164",
      language: "rust",
      code: `/// Updates the skip node flag based on the walker's current state.
fn update_skip_node(&mut self) {
    let old = self.can_skip_current_node;
    self.can_skip_current_node = self
        .stack
        .last()
        .is_some_and(|node| !self.changes.contains(node.full_key()) && node.hash_flag());
    trace!(
        target: "trie::walker",
        old,
        new = self.can_skip_current_node,
        last = ?self.stack.last(),
        "updated skip node flag"
    );
}`
    },
    {
      id: "state-root",
      title: "StateRoot Implementation",
      description: "State root computation with intermediate handling",
      file: "crates/trie/trie/src/trie.rs",
      lines: "29-45",
      language: "rust",
      code: `/// \`StateRoot\` is used to compute the root node of a state trie.
#[derive(Debug)]
pub struct StateRoot<T, H> {
    /// The factory for trie cursors.
    pub trie_cursor_factory: T,
    /// The factory for hashed cursors.
    pub hashed_cursor_factory: H,
    /// A set of prefix sets that have changed.
    pub prefix_sets: TriePrefixSets,
    /// Previous intermediate state.
    previous_state: Option<IntermediateStateRootState>,
    /// The number of updates after which the intermediate progress should be returned.
    threshold: u64,
    #[cfg(feature = "metrics")]
    /// State root metrics.
    metrics: StateRootMetrics,
}`
    },
    {
      id: "parallel-proof",
      title: "Parallel Trie Computation",
      description: "Spawning parallel tasks for subtrie computation",
      file: "crates/trie/parallel/src/proof.rs",
      lines: "95-112",
      language: "rust",
      code: `/// Spawn storage proof tasks for the given hashed address.
fn spawn_storage_proof(
    &self,
    hashed_address: B256,
    storages: impl IntoIterator<Item = B256>,
) -> StorageProofResult {
    let mut handler = self.inner.provider_factory.storage_proof(
        self.inner.state.clone(),
        hashed_address,
    )?;
    
    let mut storage_keys = Vec::new();
    for hashed_slot in storages {
        let key = handler.generate_proof(hashed_slot)?;
        storage_keys.push(key);
    }
    
    Ok((hashed_address, handler.finish()?, storage_keys))
}`
    },
    {
      id: "advance-walker",
      title: "Walker Advance Logic",
      description: "Moving through the trie with optimization",
      file: "crates/trie/trie/src/walker.rs",
      lines: "221-246",
      language: "rust",
      code: `/// Advances the walker to the next trie node and updates the skip node flag.
/// The new key can then be obtained via \`key()\`.
pub fn advance(&mut self) -> Result<(), DatabaseError> {
    if let Some(last) = self.stack.last() {
        if !self.can_skip_current_node && self.children_are_in_trie() {
            trace!(
                target: "trie::walker",
                position = ?last.position(),
                "cannot skip current node and children are in the trie"
            );
            // If we can't skip the current node and the children are in the trie,
            // either consume the next node or move to the next sibling.
            match last.position() {
                SubNodePosition::ParentBranch => self.move_to_next_sibling(true)?,
                SubNodePosition::Child(_) => self.consume_node()?,
            }
        } else {
            trace!(target: "trie::walker", "can skip current node");
            // If we can skip the current node, move to the next sibling.
            self.move_to_next_sibling(false)?;
        }

        // Update the skip node flag based on the new position in the trie.
        self.update_skip_node();
    }
    Ok(())
}`
    },
    {
      id: "intermediate-threshold",
      title: "Intermediate State Thresholds",
      description: "Bounded memory usage through intermediate states",
      file: "crates/trie/trie/src/trie.rs",
      lines: "22-24",
      language: "rust",
      code: `/// The default updates after which root algorithms should return intermediate 
/// progress rather than finishing the computation.
const DEFAULT_INTERMEDIATE_THRESHOLD: u64 = 100_000;`
    }
  ]

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Code Examples Header */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileCode className="w-5 h-5 text-blue-500" />
          Reth Implementation Code
        </h3>

        {/* Example Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {codeExamples.map((example, index) => (
            <button
              key={example.id}
              onClick={() => setActiveExample(index)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                activeExample === index
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              {example.title}
            </button>
          ))}
        </div>

        {/* Active Code Example */}
        <motion.div
          key={codeExamples[activeExample].id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-lg text-white">
                {codeExamples[activeExample].title}
              </h4>
              <p className="text-sm text-zinc-400 mt-1">
                {codeExamples[activeExample].description}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <a
                  href={`https://github.com/paradigmxyz/reth/blob/main/${codeExamples[activeExample].file}#L${codeExamples[activeExample].lines}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <GitBranch className="w-3 h-3" />
                  {codeExamples[activeExample].file}:{codeExamples[activeExample].lines}
                </a>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(
                codeExamples[activeExample].code,
                codeExamples[activeExample].id
              )}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              {copiedId === codeExamples[activeExample].id ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="bg-zinc-950/50 rounded-xl p-4 overflow-x-auto">
              <code className="text-sm font-mono">
                {codeExamples[activeExample].code.split('\n').map((line, i) => (
                  <div key={i} className="group hover:bg-zinc-800/30">
                    <span className="inline-block w-12 text-zinc-600 select-none">
                      {i + 1}
                    </span>
                    <span className={cn(
                      line.startsWith('///') || line.startsWith('//') 
                        ? "text-zinc-500" 
                        : line.includes('pub ') || line.includes('fn ')
                        ? "text-blue-400"
                        : line.includes('struct ') || line.includes('impl ')
                        ? "text-purple-400"
                        : line.includes('Option<') || line.includes('Vec<') || line.includes('HashSet<')
                        ? "text-green-400"
                        : line.includes('bool') || line.includes('u64')
                        ? "text-yellow-400"
                        : "text-zinc-300"
                    )}>
                      {line}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </motion.div>
      </div>

      {/* Key Concepts */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-purple-500" />
          Key Implementation Concepts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-950/50 rounded-xl p-4">
            <h4 className="font-semibold text-purple-400 mb-2">PrefixSet</h4>
            <p className="text-sm text-zinc-400 mb-2">
              A data structure that tracks which parts of the trie have changed. 
              It allows the walker to quickly determine if a subtree needs to be traversed.
            </p>
            <div className="p-2 bg-zinc-900 rounded text-xs font-mono text-zinc-500">
              changes.contains(node.full_key())
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4">
            <h4 className="font-semibold text-purple-400 mb-2">CursorSubNode</h4>
            <p className="text-sm text-zinc-400 mb-2">
              Represents a position in the trie during traversal. Maintains the full key path 
              and metadata about the node&apos;s state.
            </p>
            <div className="p-2 bg-zinc-900 rounded text-xs font-mono text-zinc-500">
              stack: Vec&lt;CursorSubNode&gt;
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4">
            <h4 className="font-semibold text-purple-400 mb-2">Hash Flag</h4>
            <p className="text-sm text-zinc-400 mb-2">
              Indicates whether a node has a pre-computed hash. If true and no changes 
              in the prefix, the entire subtree can be skipped.
            </p>
            <div className="p-2 bg-zinc-900 rounded text-xs font-mono text-zinc-500">
              node.hash_flag() && !has_changes
            </div>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4">
            <h4 className="font-semibold text-purple-400 mb-2">Intermediate State</h4>
            <p className="text-sm text-zinc-400 mb-2">
              Allows pausing and resuming trie computation to maintain bounded memory usage. 
              Essential for handling large state roots.
            </p>
            <div className="p-2 bg-zinc-900 rounded text-xs font-mono text-zinc-500">
              threshold: u64 = 100_000
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}