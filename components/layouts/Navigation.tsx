"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Cpu, 
  GitBranch, 
  TreePine, 
  ArrowRightLeft,
  BookOpen,
  ChevronRight
} from "lucide-react"

const chapters = [
  {
    id: "overview",
    title: "Overview",
    subtitle: "The Big Picture",
    icon: Home,
    description: "Understanding Ethereum Execution",
    href: "/"
  },
  {
    id: "engine-api",
    title: "Engine API",
    subtitle: "Consensus Integration",
    icon: Cpu,
    description: "newPayload & forkchoiceUpdated",
    href: "/chapters/engine-api"
  },
  {
    id: "state-root",
    title: "State Root",
    subtitle: "Computation Strategies",
    icon: GitBranch,
    description: "Sparse, Parallel & Sequential",
    href: "/chapters/state-root"
  },
  {
    id: "trie",
    title: "Trie Architecture",
    subtitle: "Data Structures",
    icon: TreePine,
    description: "TrieWalker & Optimization",
    href: "/chapters/trie"
  },
  {
    id: "transaction",
    title: "Transaction Journey",
    subtitle: "End-to-End Flow",
    icon: ArrowRightLeft,
    description: "From Mempool to Block",
    href: "/chapters/transaction"
  }
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Reth Architecture</h1>
            <p className="text-xs text-zinc-400">Interactive Learning Guide</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {chapters.map((chapter, index) => {
            const Icon = chapter.icon
            const isActive = pathname === chapter.href || 
                           (chapter.href !== "/" && pathname.startsWith(chapter.href))
            
            return (
              <Link
                key={chapter.id}
                href={chapter.href}
                className={cn(
                  "group block rounded-lg border transition-all duration-200",
                  isActive 
                    ? "bg-zinc-900 border-zinc-700 shadow-lg shadow-orange-500/10" 
                    : "bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900/50 hover:border-zinc-700"
                )}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                      isActive 
                        ? "bg-gradient-to-br from-orange-500 to-red-600" 
                        : "bg-zinc-800 group-hover:bg-zinc-700"
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className={cn(
                          "font-medium transition-colors",
                          isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
                        )}>
                          {chapter.title}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{chapter.subtitle}</p>
                      <p className="text-xs text-zinc-600 mt-1">{chapter.description}</p>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all",
                      isActive 
                        ? "text-orange-500 translate-x-0" 
                        : "text-zinc-600 -translate-x-1 group-hover:translate-x-0 group-hover:text-zinc-400"
                    )} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 space-y-1">
          <p>Built for Reth Contributors</p>
          <p className="font-mono text-zinc-600">v1.0.0</p>
        </div>
      </div>
    </nav>
  )
}