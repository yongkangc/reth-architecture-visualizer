"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home,
  Cpu,
  GitBranch,
  TreePine,
  Activity,
  Settings,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Blocks,
  Layers,
  Code2,
  Network,
  Package,
  Shield,
  Zap
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { 
    href: "/", 
    label: "Home", 
    icon: Home,
    description: "Start here",
    gradient: "from-zinc-500 to-zinc-600"
  },
  { 
    href: "/chapters/overview",
    label: "Architecture Overview",
    icon: Blocks,
    description: "System design",
    gradient: "from-blue-500 to-cyan-500"
  },
  { 
    href: "/chapters/architecture", 
    label: "High-Level Architecture", 
    icon: Layers,
    description: "Components overview",
    gradient: "from-orange-500 to-red-500"
  },
  { 
    href: "/chapters/staged-sync", 
    label: "Staged Sync", 
    icon: Activity,
    description: "Sync pipeline",
    gradient: "from-yellow-500 to-orange-500"
  },
  { 
    href: "/chapters/engine-api", 
    label: "Engine API", 
    icon: Cpu,
    description: "Block processing",
    gradient: "from-purple-500 to-pink-500"
  },
  { 
    href: "/chapters/block-lifecycle", 
    label: "Block Lifecycle", 
    icon: Package,
    description: "End-to-end flow",
    gradient: "from-amber-500 to-orange-500"
  },
  { 
    href: "/chapters/payload-validation", 
    label: "Payload Validation", 
    icon: Shield,
    description: "Deep validation flow",
    gradient: "from-rose-500 to-pink-500"
  },
  { 
    href: "/chapters/state-root", 
    label: "State Root", 
    icon: GitBranch,
    description: "Computation strategies",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    href: "/chapters/engine-tree-prewarming",
    label: "Engine Tree Prewarming",
    icon: Zap,
    description: "Parallel optimization",
    gradient: "from-orange-500 to-red-500"
  },
  {
    href: "/chapters/prewarming-deep-dive",
    label: "Prewarming Deep Dive",
    icon: Zap,
    description: "59% performance boost",
    gradient: "from-orange-600 to-red-600"
  },
  { 
    href: "/chapters/trie", 
    label: "Trie Architecture", 
    icon: TreePine,
    description: "Deep dive & optimization",
    gradient: "from-teal-500 to-cyan-500"
  },
  { 
    href: "/chapters/evm", 
    label: "EVM Stack", 
    icon: Code2,
    description: "Revm & Alloy",
    gradient: "from-pink-500 to-rose-500"
  },
  { 
    href: "/chapters/p2p-network", 
    label: "P2P Network", 
    icon: Network,
    description: "DevP2P & Discovery",
    gradient: "from-blue-500 to-indigo-500"
  },
  { 
    href: "/chapters/transaction", 
    label: "Transactions", 
    icon: Settings,
    description: "Mempool to block",
    gradient: "from-indigo-500 to-purple-500"
  }
]

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [visitedChapters, setVisitedChapters] = useState<Set<string>>(new Set())

  // Track visited chapters
  useEffect(() => {
    // Load visited chapters from localStorage
    const stored = localStorage.getItem('visitedChapters')
    if (stored) {
      setVisitedChapters(new Set(JSON.parse(stored)))
    }
  }, [])

  useEffect(() => {
    // Track current chapter as visited
    if (pathname && pathname !== '/') {
      setVisitedChapters(prev => {
        const updated = new Set(prev)
        updated.add(pathname)
        // Save to localStorage
        localStorage.setItem('visitedChapters', JSON.stringify(Array.from(updated)))
        return updated
      })
    }
  }, [pathname])

  // Calculate progress (excluding home page)
  const chapterItems = navItems.filter(item => item.href !== '/')
  const completedCount = chapterItems.filter(item => visitedChapters.has(item.href)).length
  const totalChapters = chapterItems.length
  const progressPercentage = totalChapters > 0 ? (completedCount / totalChapters) * 100 : 0

  return (
    <>
      {/* Mobile Header - Fixed at top */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 z-[99] bg-[#0a0a0a] border-b border-zinc-800">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#627eea] to-[#a16ae8] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Reth Architecture</h2>
            </div>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] sm:w-[320px] z-[101] bg-[#0a0a0a] border-r border-zinc-800 overflow-y-auto shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#627eea] to-[#a16ae8] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white">Reth Architecture</h2>
                      <p className="text-xs text-zinc-400">Interactive Learning</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <NavigationItems 
                  pathname={pathname} 
                  onItemClick={() => setMobileMenuOpen(false)} 
                />
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Fixed on left */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 bg-[#0a0a0a] border-r border-zinc-800 overflow-y-auto z-40">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#627eea] to-[#a16ae8] flex items-center justify-center shadow-lg shadow-[#627eea]/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Reth Architecture</h2>
              <p className="text-xs text-zinc-400">Interactive Learning Platform</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <NavigationItems pathname={pathname} />
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Progress</span>
            <span>{completedCount}/{totalChapters} Chapters</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#627eea] to-[#a16ae8]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          {completedCount === totalChapters && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-green-400 mt-2 text-center"
            >
              🎉 All chapters completed!
            </motion.p>
          )}
        </div>

      </aside>
    </>
  )
}

function NavigationItems({ 
  pathname, 
  onItemClick 
}: { 
  pathname: string
  onItemClick?: () => void 
}) {
  return (
    <div className="space-y-2">
      {navItems.map((item, index) => {
        const isActive = pathname === item.href || 
          (item.href !== "/" && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20" 
                  : "hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl border border-[#627eea]/30 bg-gradient-to-r from-[#627eea]/10 to-[#a16ae8]/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <div className={cn(
                "relative w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center transition-transform duration-300",
                item.gradient,
                isActive ? "scale-110 shadow-lg" : "group-hover:scale-105 opacity-80 group-hover:opacity-100"
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 relative z-10">
                <div className={cn(
                  "font-medium transition-colors",
                  isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
                )}>
                  {item.label}
                </div>
                <div className={cn(
                  "text-xs transition-colors",
                  isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                )}>
                  {item.description}
                </div>
              </div>

              <ChevronRight className={cn(
                "w-4 h-4 transition-all duration-300",
                isActive 
                  ? "text-[#627eea] translate-x-0 opacity-100" 
                  : "text-zinc-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              )} />
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}