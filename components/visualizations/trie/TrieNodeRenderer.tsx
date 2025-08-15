import { motion } from "framer-motion"
import { ChevronRight, Cpu, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TrieNode, WalkerState } from "@/lib/types"

interface TrieNodeRendererProps {
  node: TrieNode
  depth?: number
  walkerState: WalkerState
  onNodeClick?: (node: TrieNode) => void
}

export default function TrieNodeRenderer({ 
  node, 
  depth = 0, 
  walkerState,
  onNodeClick 
}: TrieNodeRendererProps) {
  const isVisited = walkerState.visitedNodes.has(node.id)
  const isSkipped = walkerState.skippedNodes.has(node.id)
  const isCurrent = walkerState.currentNode === node.id
  const isInStack = walkerState.stack.includes(node.id)

  const getNodeColor = (type: string) => {
    switch (type) {
      case "branch": return "bg-purple-500/20 text-purple-400"
      case "extension": return "bg-blue-500/20 text-blue-400"
      case "leaf": return "bg-green-500/20 text-green-400"
      case "hash": return "bg-orange-500/20 text-orange-400"
      default: return "bg-zinc-700 text-zinc-400"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.05 }}
      className="ml-4"
    >
      <div
        onClick={() => onNodeClick?.(node)}
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
          getNodeColor(node.type)
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
          {node.children.map(child => (
            <TrieNodeRenderer
              key={child.id}
              node={child}
              depth={depth + 1}
              walkerState={walkerState}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}