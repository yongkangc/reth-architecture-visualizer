"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Cpu, GitBranch, TreePine, Activity, Sparkles, Code2, Rocket, Zap } from "lucide-react"
import PageContainer from "@/components/ui/PageContainer"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const chapters = [
  {
    id: "engine-api",
    title: "Engine API",
    description: "Learn how Reth processes blocks from the consensus layer",
    icon: Cpu,
    gradient: "from-purple-500 to-pink-500",
    href: "/chapters/engine-api",
    status: "available"
  },
  {
    id: "state-root",
    title: "State Root Computation",
    description: "Explore the three-tier strategy for efficient state root calculation",
    icon: GitBranch,
    gradient: "from-green-500 to-emerald-500",
    href: "/chapters/state-root",
    status: "available"
  },
  {
    id: "trie",
    title: "Trie Architecture",
    description: "Understand Merkle Patricia Trie navigation and optimization",
    icon: TreePine,
    gradient: "from-orange-500 to-red-500",
    href: "/chapters/trie",
    status: "available"
  },
  {
    id: "transaction",
    title: "Transaction Journey",
    description: "Follow transactions from mempool to finalized block",
    icon: Activity,
    gradient: "from-blue-500 to-cyan-500",
    href: "/chapters/transaction",
    status: "available"
  }
]

const features = [
  {
    title: "Interactive Simulations",
    description: "Step through complex processes with visual feedback",
    icon: Rocket
  },
  {
    title: "Real Code Examples",
    description: "Learn from actual Reth implementation code",
    icon: Code2
  },
  {
    title: "Performance Metrics",
    description: "Understand optimization trade-offs and benchmarks",
    icon: Zap
  }
]

export default function HomePage() {
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null)

  return (
    <PageContainer>
      {/* Hero Section */}
      <motion.section 
        className="mb-16 lg:mb-24 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border border-[#627eea]/30 mb-6"
        >
          <Sparkles className="w-4 h-4 text-[#a16ae8]" />
          <span className="text-sm font-medium text-zinc-300">Interactive Learning Platform</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Systems Online</span>
          </span>
        </motion.div>

        {/* Main title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Understand
          </span>
          <br />
          <span className="bg-gradient-to-r from-[#627eea] to-[#a16ae8] bg-clip-text text-transparent">
            Reth Architecture
          </span>
        </h1>

        {/* Subtitle */}
        <motion.p 
          className="text-base sm:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto mb-8"
          {...fadeIn}
          transition={{ delay: 0.3 }}
        >
          Dive deep into the internals of Ethereum&apos;s fastest execution client through interactive visualizations and real-world examples
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          {...fadeIn}
          transition={{ delay: 0.4 }}
        >
          <Link href="/chapters/overview">
            <button className="w-full sm:w-auto group px-8 py-4 rounded-xl bg-gradient-to-r from-[#627eea] to-[#a16ae8] text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#627eea]/25 hover:scale-105">
              <span className="flex items-center justify-center gap-2">
                Start Learning
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
          <a 
            href="https://github.com/paradigmxyz/reth"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white font-semibold transition-all duration-300 hover:bg-white/5 text-center"
          >
            View on GitHub
          </a>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="mb-16 lg:mb-24"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#627eea]/20 to-[#a16ae8]/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#a16ae8]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Chapters Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Choose Your Path
            </span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Each chapter builds on the previous one, but feel free to jump to any topic that interests you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chapters.map((chapter, index) => {
            const Icon = chapter.icon
            const isHovered = hoveredChapter === chapter.id
            
            return (
              <motion.div
                key={chapter.id}
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
              >
                <Link href={chapter.href}>
                  <div className="group relative h-full p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 overflow-hidden">
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${chapter.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${chapter.gradient} flex items-center justify-center transition-transform duration-500 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <ArrowRight className={`w-5 h-5 text-zinc-600 transition-all duration-300 ${isHovered ? 'translate-x-2 text-zinc-400' : ''}`} />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-300 group-hover:bg-clip-text transition-all duration-500">
                        {chapter.title}
                      </h3>
                      
                      <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">
                        {chapter.description}
                      </p>

                      {/* Status indicator */}
                      <div className="mt-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Ready to explore
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="mt-24 pt-8 pb-8 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-sm text-zinc-400 font-medium">
              Built for the Reth community
            </p>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <p className="text-sm text-zinc-500">
              Open source on GitHub
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://paradigm.xyz" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Paradigm
            </a>
            <a href="https://reth.rs" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Reth Docs
            </a>
          </div>
        </div>
      </footer>
    </PageContainer>
  )
}