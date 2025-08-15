"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
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
    status: "coming-soon"
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
      <section className="relative min-h-[90vh] flex items-center justify-center px-8 py-20 overflow-hidden">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#627eea]/20 to-[#a16ae8]/20 border border-[#627eea]/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#a16ae8]" />
            <span className="text-sm font-medium text-zinc-300">Interactive Learning Platform</span>
          </motion.div>

          {/* Main title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="block gradient-text">Understanding Reth</span>
            <span className="block text-3xl md:text-4xl text-zinc-400 mt-4">
              The Next-Generation Ethereum Client
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Dive deep into Reth&apos;s architecture through interactive visualizations, 
            real-time simulations, and comprehensive explanations of core systems.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chapters/engine-api"
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#627eea] to-[#a16ae8]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#a16ae8] to-[#ff8867] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative">Start Learning</span>
              <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <a
              href="https://github.com/paradigmxyz/reth"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border border-zinc-700 text-zinc-300 hover:bg-white/5 hover:border-zinc-600 transition-all duration-300"
            >
              View on GitHub
            </a>
          </div>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#627eea] to-[#a16ae8] opacity-20 blur-xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#ff8867] to-[#a16ae8] opacity-20 blur-xl"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#627eea]/10 to-[#a16ae8]/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                <div className="relative p-6 rounded-2xl bg-gradient-to-b from-zinc-900/50 to-zinc-900/30 border border-zinc-800 backdrop-blur-sm hover:border-zinc-700 transition-all duration-300">
                  <feature.icon className="w-10 h-10 mb-4 text-[#627eea]" />
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Chapters Grid */}
      <section className="relative py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 gradient-text">Learning Chapters</h2>
            <p className="text-lg text-zinc-400">
              Master Reth&apos;s architecture step by step
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
                className="relative group"
              >
                <Link 
                  href={chapter.status === "available" ? chapter.href : "#"}
                  className={cn(
                    "block relative p-6 rounded-2xl transition-all duration-300",
                    chapter.status === "available" 
                      ? "cursor-pointer" 
                      : "cursor-not-allowed opacity-60"
                  )}
                >
                  {/* Background gradient on hover */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    `bg-gradient-to-br ${chapter.gradient}`
                  )} style={{ filter: "blur(40px)" }} />
                  
                  {/* Card content */}
                  <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 group-hover:border-zinc-700 p-6 transition-all duration-300 group-hover:transform group-hover:scale-[1.02]">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                        chapter.gradient
                      )}>
                        <chapter.icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-white">
                            {chapter.title}
                          </h3>
                          {chapter.status === "coming-soon" && (
                            <span className="px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-400">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400">
                          {chapter.description}
                        </p>
                      </div>
                      
                      {chapter.status === "available" && (
                        <ArrowRight className={cn(
                          "w-5 h-5 text-zinc-600 transition-all duration-300",
                          hoveredChapter === chapter.id && "text-white translate-x-1"
                        )} />
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-8 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-zinc-500 text-sm">
            Built with ❤️ for the Reth community • Learn more at{" "}
            <a 
              href="https://paradigmxyz.github.io/reth/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#627eea] hover:text-[#a16ae8] transition-colors"
            >
              reth.rs
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}