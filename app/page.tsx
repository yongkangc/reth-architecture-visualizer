"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Layers, Cpu, Database, Network, Shield, Zap, GitBranch, TreePine, Activity, Sparkles, Code2, Rocket } from "lucide-react"

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
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#141414] to-[#141414]" />
        
        {/* Hero content */}
        <motion.div 
          className="relative z-10 max-w-5xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border border-[#627eea]/30 mb-6 sm:mb-8"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#a16ae8]" />
            <span className="text-xs sm:text-sm font-medium text-zinc-300">Interactive Learning Platform</span>
          </motion.div>

          {/* Main title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
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
            className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 sm:mb-12 px-4"
            {...fadeIn}
            transition={{ delay: 0.3 }}
          >
            Dive deep into the internals of Ethereum&apos;s fastest execution client through interactive visualizations and real-world examples
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
            {...fadeIn}
            transition={{ delay: 0.4 }}
          >
            <Link href="/chapters/overview">
              <button className="w-full sm:w-auto group px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-[#627eea] to-[#a16ae8] text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#627eea]/25 hover:scale-105">
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
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white font-semibold transition-all duration-300 hover:bg-white/5 text-center"
            >
              View on GitHub
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
                  variants={fadeIn}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#627eea]/20 to-[#a16ae8]/20 flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#a16ae8]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-zinc-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Chapters Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Choose Your Path
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-zinc-500 max-w-2xl mx-auto px-4">
              Each chapter builds on the previous one, but feel free to jump to any topic that interests you
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
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
                    <div className="group relative h-full p-4 sm:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 border border-zinc-800 hover:border-zinc-700 transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 overflow-hidden">
                      {/* Background gradient on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${chapter.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${chapter.gradient} flex items-center justify-center transition-transform duration-500 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                          <ArrowRight className={`w-5 h-5 text-zinc-600 transition-all duration-300 ${isHovered ? 'translate-x-2 text-zinc-400' : ''}`} />
                        </div>
                        
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-300 group-hover:bg-clip-text transition-all duration-500">
                          {chapter.title}
                        </h3>
                        
                        <p className="text-sm sm:text-base text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">
                          {chapter.description}
                        </p>

                        {/* Status indicator */}
                        <div className="mt-4 sm:mt-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                            chapter.status === 'available' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              chapter.status === 'available' ? 'bg-green-400' : 'bg-amber-400'
                            } animate-pulse`} />
                            {chapter.status === 'available' ? 'Ready to explore' : 'Coming soon'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 sm:mt-20 lg:mt-32 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-zinc-500 text-center sm:text-left">
            Built for the Reth community • Open source on GitHub
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="https://paradigm.xyz" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Paradigm
            </a>
            <a href="https://reth.rs" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Reth Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}