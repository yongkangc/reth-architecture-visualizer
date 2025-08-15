'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, CheckCircle, Clock, Send, Package, Shield, Database, Zap } from 'lucide-react';
import PageContainer from '@/components/ui/PageContainer';

interface TransactionStage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  details: string[];
  status: 'pending' | 'active' | 'completed';
}

export default function TransactionJourneyPage() {
  const [activeStage, setActiveStage] = useState(0);
  
  const stages: TransactionStage[] = [
    {
      id: 'submission',
      title: 'Transaction Submission',
      description: 'User submits transaction via RPC',
      icon: <Send className="w-5 h-5" />,
      details: [
        'Transaction received via JSON-RPC (eth_sendRawTransaction)',
        'Basic validation: signature, nonce, gas price',
        'Transaction decoded and verified',
        'Initial fee validation'
      ],
      status: activeStage > 0 ? 'completed' : activeStage === 0 ? 'active' : 'pending'
    },
    {
      id: 'mempool',
      title: 'Mempool Entry',
      description: 'Transaction enters the mempool',
      icon: <Package className="w-5 h-5" />,
      details: [
        'Added to transaction pool',
        'Sorted by gas price/priority fee',
        'Broadcast to peer nodes',
        'Replacement logic for same nonce'
      ],
      status: activeStage > 1 ? 'completed' : activeStage === 1 ? 'active' : 'pending'
    },
    {
      id: 'validation',
      title: 'Validation & Ordering',
      description: 'Full validation and prioritization',
      icon: <Shield className="w-5 h-5" />,
      details: [
        'Account balance check',
        'Nonce sequencing validation',
        'Gas limit verification',
        'Priority ordering for block inclusion'
      ],
      status: activeStage > 2 ? 'completed' : activeStage === 2 ? 'active' : 'pending'
    },
    {
      id: 'block-building',
      title: 'Block Building',
      description: 'Selected for block inclusion',
      icon: <Database className="w-5 h-5" />,
      details: [
        'Block builder selects transactions',
        'Ordered by priority fee',
        'Block gas limit enforcement',
        'MEV considerations'
      ],
      status: activeStage > 3 ? 'completed' : activeStage === 3 ? 'active' : 'pending'
    },
    {
      id: 'execution',
      title: 'Execution',
      description: 'Transaction executed in EVM',
      icon: <Zap className="w-5 h-5" />,
      details: [
        'State loaded from database',
        'EVM bytecode execution',
        'State changes calculated',
        'Gas consumption tracked'
      ],
      status: activeStage > 4 ? 'completed' : activeStage === 4 ? 'active' : 'pending'
    },
    {
      id: 'consensus',
      title: 'Consensus & Finalization',
      description: 'Block proposed and finalized',
      icon: <CheckCircle className="w-5 h-5" />,
      details: [
        'Block proposed to consensus layer',
        'Validators attest to block',
        'Block finalized after 2 epochs (~13 min)',
        'State permanently committed'
      ],
      status: activeStage > 5 ? 'completed' : activeStage === 5 ? 'active' : 'pending'
    }
  ];

  const handleStageClick = (index: number) => {
    setActiveStage(index);
  };

  const handleSimulate = () => {
    let stage = 0;
    const interval = setInterval(() => {
      if (stage < stages.length - 1) {
        stage++;
        setActiveStage(stage);
      } else {
        clearInterval(interval);
        setTimeout(() => setActiveStage(0), 2000);
      }
    }, 1500);
  };

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Transaction Journey
          </h1>
          <p className="text-xl text-gray-400">
            Follow a transaction from submission to finalization in Reth
          </p>
        </div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex gap-4"
        >
          <button
            onClick={handleSimulate}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Simulate Transaction Flow
          </button>
          <button
            onClick={() => setActiveStage(0)}
            className="px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </motion.div>

        {/* Journey Visualization */}
        <div className="mb-12">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-800"></div>
            
            {/* Stages */}
            <div className="relative grid grid-cols-6 gap-4">
              {stages.map((stage, index) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => handleStageClick(index)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col items-center">
                    {/* Stage Icon */}
                    <div
                      className={`
                        w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all
                        ${stage.status === 'completed' 
                          ? 'bg-green-500/20 border-2 border-green-500 text-green-400' 
                          : stage.status === 'active'
                          ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400 animate-pulse'
                          : 'bg-gray-800 border-2 border-gray-700 text-gray-500'
                        }
                      `}
                    >
                      {stage.icon}
                    </div>
                    
                    {/* Stage Title */}
                    <h3 className={`
                      text-sm font-semibold text-center transition-colors
                      ${stage.status === 'active' ? 'text-blue-400' : stage.status === 'completed' ? 'text-green-400' : 'text-gray-500'}
                    `}>
                      {stage.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Details */}
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12 p-8 bg-gray-900/50 rounded-xl border border-gray-800"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 mr-4">
              {stages[activeStage].icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{stages[activeStage].title}</h2>
              <p className="text-gray-400">{stages[activeStage].description}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {stages[activeStage].details.map((detail, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start"
              >
                <ArrowRight className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">{detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Transaction Data Example */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-12 p-6 bg-gray-900/30 rounded-xl border border-gray-800"
        >
          <h3 className="text-xl font-bold mb-4">Example Transaction Data</h3>
          <pre className="text-sm text-gray-400 overflow-x-auto">
{`{
  "hash": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3",
  "nonce": 42,
  "from": "0x32Be343B94f860124dC4fEe278FDCBD38C102D88",
  "to": "0xd8dA6BF26964aF9D7eEd9e0BE3531d2E213A5E42",
  "value": "1000000000000000000",
  "gas": 21000,
  "gasPrice": "20000000000",
  "input": "0x",
  "v": 27,
  "r": "0x5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e",
  "s": "0x4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f"
}`}
          </pre>
        </motion.div>

        {/* Key Concepts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="p-6 bg-gray-900/30 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">Gas & Priority Fees</h3>
            <p className="text-gray-400 text-sm">
              Transactions compete for block space through gas pricing. Higher priority fees 
              incentivize validators to include transactions sooner.
            </p>
          </div>
          
          <div className="p-6 bg-gray-900/30 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-3 text-purple-400">MEV Protection</h3>
            <p className="text-gray-400 text-sm">
              Reth supports MEV-boost integration, allowing transactions to be bundled and 
              ordered optimally while protecting users from sandwich attacks.
            </p>
          </div>
          
          <div className="p-6 bg-gray-900/30 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-3 text-green-400">State Changes</h3>
            <p className="text-gray-400 text-sm">
              Each transaction modifies the Ethereum state tree. Reth efficiently computes 
              these changes using parallel processing when possible.
            </p>
          </div>
          
          <div className="p-6 bg-gray-900/30 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">Finalization</h3>
            <p className="text-gray-400 text-sm">
              After consensus layer finalization (~13 minutes), transactions become part of 
              the canonical chain and cannot be reverted.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}