'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Layers, Cpu, Database, Network, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import PageContainer from '@/components/ui/PageContainer';

export default function OverviewPage() {
  const features = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Modular Architecture",
      description: "Reth is built with a highly modular architecture where each component can be used as a standalone library."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Blazing Fast Performance",
      description: "Written in Rust with extensive parallelism, memory-mapped I/O, and optimized data structures."
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Hybrid Storage",
      description: "Combines MDBX database with static files for optimal storage and retrieval performance."
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: "P2P Networking",
      description: "Full Ethereum wire protocol support with discovery, sync, and transaction propagation."
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "Staged Sync",
      description: "Efficient blockchain synchronization using Erigon's proven staged-sync architecture."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Type Safety",
      description: "Strong typing throughout with minimal dynamic dispatch for reliability and performance."
    }
  ];

  const chapters = [
    {
      title: "Engine API",
      path: "/chapters/engine-api",
      description: "Understand how Reth processes blocks from the consensus layer"
    },
    {
      title: "State Root Computation",
      path: "/chapters/state-root",
      description: "Explore parallel and sequential state root computation strategies"
    },
    {
      title: "Trie Architecture",
      path: "/chapters/trie",
      description: "Deep dive into Merkle Patricia Trie implementation and optimizations"
    },
    {
      title: "Transaction Journey",
      path: "/chapters/transaction",
      description: "Follow a transaction from mempool to finalized block"
    }
  ];

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Reth Architecture Overview
          </h1>
          <p className="text-xl text-gray-400">
            A high-performance Ethereum execution client written in Rust
          </p>
        </div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 p-6 bg-gray-900/50 rounded-xl border border-gray-800"
        >
          <h2 className="text-2xl font-bold mb-4">What is Reth?</h2>
          <p className="text-gray-300 mb-4">
            Reth (Rust Ethereum) is a new Ethereum full node implementation focused on being user-friendly, 
            highly modular, and blazing fast. It&apos;s an Execution Layer (EL) client compatible with all 
            Ethereum Consensus Layer (CL) implementations that support the Engine API.
          </p>
          <p className="text-gray-300">
            Built by Paradigm and licensed under Apache/MIT, Reth represents a new generation of Ethereum 
            clients designed for modularity, performance, and developer experience.
          </p>
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="p-6 bg-gray-900/30 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 mr-3">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                </div>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-12 p-8 bg-gray-900/50 rounded-xl border border-gray-800"
        >
          <h2 className="text-3xl font-bold mb-6">High-Level Architecture</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-semibold text-purple-400 mb-2">Consensus Layer Interface</h3>
              <p className="text-sm text-gray-400">Engine API (newPayload, forkchoiceUpdated)</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-semibold text-blue-400 mb-2">Execution Engine</h3>
              <p className="text-sm text-gray-400">Block processing, state transitions, EVM execution</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">Storage Layer</h3>
              <p className="text-sm text-gray-400">MDBX database + static files for state and history</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-semibold text-yellow-400 mb-2">Network Layer</h3>
              <p className="text-sm text-gray-400">P2P communication, transaction pool, block propagation</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-semibold text-red-400 mb-2">RPC Layer</h3>
              <p className="text-sm text-gray-400">JSON-RPC APIs for external applications</p>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold mb-6">Explore the Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chapters.map((chapter, index) => (
              <Link key={index} href={chapter.path}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">
                      {chapter.title}
                    </h3>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-gray-400 text-sm">{chapter.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-gray-500 text-sm"
        >
          <p>Ready to dive deeper? Choose a chapter above to start exploring!</p>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}