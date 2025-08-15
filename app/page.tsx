"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Layers, Cpu, Database, Network, Shield, Zap } from "lucide-react"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const components = [
  { id: "consensus", label: "Consensus Layer", icon: Shield, color: "from-blue-500 to-cyan-500" },
  { id: "execution", label: "Execution Layer (Reth)", icon: Cpu, color: "from-orange-500 to-red-600" },
  { id: "networking", label: "P2P Network", icon: Network, color: "from-green-500 to-emerald-500" },
  { id: "storage", label: "Storage (MDBX)", icon: Database, color: "from-purple-500 to-pink-500" },
]

export default function HomePage() {
  const [activeComponent, setActiveComponent] = useState<string | null>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    // Simulate message flow
    const messageFlow = [
      "Consensus Layer: New block proposed",
      "Engine API: newPayload received",
      "Reth: Validating block...",
      "Reth: Executing transactions...",
      "Storage: Persisting state changes",
      "Reth: State root calculated",
      "Engine API: Payload validated",
      "Consensus Layer: Block finalized"
    ]

    let index = 0
    const interval = setInterval(() => {
      if (index < messageFlow.length) {
        setMessages(prev => [...prev.slice(-4), messageFlow[index]])
        
        // Highlight components based on message
        if (messageFlow[index].includes("Consensus")) setActiveComponent("consensus")
        else if (messageFlow[index].includes("Engine") || messageFlow[index].includes("Reth")) setActiveComponent("execution")
        else if (messageFlow[index].includes("Storage")) setActiveComponent("storage")
        
        index++
      } else {
        index = 0
        setMessages([])
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
      <motion.div {...fadeIn} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            Reth Architecture
          </h1>
          <p className="text-xl text-zinc-400">
            Interactive Learning Guide for Ethereum Execution Client
          </p>
        </div>

        {/* Main Visualization */}
        <div className="relative bg-zinc-950 rounded-2xl border border-zinc-800 p-12 mb-12">
          <div className="grid grid-cols-2 gap-8 mb-8">
            {components.map((component) => {
              const Icon = component.icon
              const isActive = activeComponent === component.id
              
              return (
                <motion.div
                  key={component.id}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    isActive 
                      ? "border-orange-500 bg-zinc-900 shadow-lg shadow-orange-500/20" 
                      : "border-zinc-800 bg-zinc-950/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${component.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{component.label}</h3>
                      <p className="text-xs text-zinc-500">
                        {component.id === "execution" ? "High-performance client" : ""}
                        {component.id === "consensus" ? "Proof of Stake" : ""}
                        {component.id === "networking" ? "DevP2P Protocol" : ""}
                        {component.id === "storage" ? "Memory-mapped DB" : ""}
                      </p>
                    </div>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-orange-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Message Flow */}
          <div className="bg-black rounded-lg border border-zinc-800 p-4 font-mono text-xs">
            <div className="text-zinc-500 mb-2">MESSAGE FLOW</div>
            <div className="space-y-1">
              {messages.map((msg, i) => (
                <motion.div
                  key={`${msg}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-green-400"
                >
                  {"> "}{msg}
                </motion.div>
              ))}
              <span className="text-zinc-700 animate-pulse">█</span>
            </div>
          </div>
        </div>

        {/* Key Concepts */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { title: "Engine API", desc: "Consensus-Execution communication", icon: Zap },
            { title: "State Root", desc: "Merkle Patricia Trie computation", icon: Layers },
            { title: "EVM Execution", desc: "Transaction processing pipeline", icon: Cpu },
          ].map((concept, i) => (
            <motion.div
              key={concept.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
            >
              <concept.icon className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="font-semibold mb-1">{concept.title}</h3>
              <p className="text-sm text-zinc-500">{concept.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Start Learning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link
            href="/chapters/engine-api"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            Start Learning
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-zinc-500 text-sm mt-4">
            Begin with the Engine API to understand how Reth processes blocks
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
