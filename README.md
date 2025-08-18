# Reth Architecture Visualizer

Interactive learning platform for understanding [Reth](https://github.com/paradigmxyz/reth)'s internals through animated visualizations and real code examples.

[![Live Demo](https://img.shields.io/badge/Demo-Live-green)](https://reth.chiayong.com)
[![Reth](https://img.shields.io/badge/Reth-Architecture-orange)](https://github.com/paradigmxyz/reth)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)

## 🌐 Live Demo

**[reth.chiayong.com](https://reth.chiayong.com)**

## ✨ Features

- **Interactive Simulations** - Step through Engine API flows, state root computation, and trie navigation in real-time
- **Performance Visualizations** - See how Reth achieves 59% speedup through transaction prewarming
- **Real Code Examples** - Actual Rust implementations from Reth's codebase with explanations
- **Progressive Learning** - 14 chapters from high-level architecture to deep implementation details

## 📚 Available Chapters

### Core Architecture
- **Overview** - Ethereum execution client fundamentals
- **High-Level Architecture** - Reth's modular component design
- **Staged Sync** - Pipeline architecture for blockchain synchronization

### Consensus & Execution
- **Engine API** - Block processing via newPayload and forkchoiceUpdated
- **Block Lifecycle** - End-to-end flow from proposal to finalization
- **Payload Validation** - Deep dive into block validation pipeline
- **Engine Tree Prewarming** - Parallel optimization achieving 59% performance boost
- **Prewarming Deep Dive** - Transaction cache warming implementation details

### State Management
- **State Root** - Three-tier computation strategy (Sparse, Parallel, Sequential)
- **Trie Architecture** - Merkle Patricia Trie with TrieWalker optimization

### Stack Components
- **EVM Stack** - Revm integration and Alloy framework
- **P2P Network** - DevP2P protocol and peer discovery
- **Transactions** - Journey from mempool to finalized block

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/yongkangc/reth-architecture-visualizer.git
cd visualizations

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
visualizations/
├── app/                          # Next.js 15 app router
│   ├── chapters/                 # Chapter pages
│   │   ├── overview/            # Fundamentals
│   │   ├── architecture/        # High-level design
│   │   ├── engine-api/          # Consensus integration
│   │   ├── state-root/          # State computation
│   │   ├── trie/                # Trie deep dive
│   │   └── ...                  # 9 more chapters
│   └── page.tsx                 # Landing page
├── components/                   
│   ├── visualizations/          # Interactive animations
│   │   ├── engine-api/         # Engine flow diagrams
│   │   ├── state-root/         # Computation strategies
│   │   ├── trie/               # Walker visualization
│   │   └── prewarming/         # Performance metrics
│   ├── ui/                     # Reusable UI components
│   └── layouts/                # Navigation & layout
└── lib/                        # Utilities & hooks
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router + Turbopack)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Visualizations**: Custom Canvas + SVG animations
- **Code Display**: Syntax highlighting with Prism

## 🎨 Key Visualizations

### Engine API Flow
Interactive simulation of block processing showing:
- Payload arrival and validation
- Fork choice state transitions
- Canonical chain updates

### State Root Computation
Three-tier strategy visualization:
- Sparse trie for recent state
- Parallel computation for subtries
- Sequential fallback for conflicts

### Trie Walker
Step-by-step navigation showing:
- Skip optimization (99.99% node reduction)
- PrefixSet change tracking
- Cache hit visualization

### Transaction Prewarming
Performance optimization showing:
- Parallel sender recovery
- Out-of-order cache warming
- 59% execution time reduction

## 🤝 Contributing

Contributions welcome! Please:

1. Follow existing component patterns
2. Use TypeScript with proper types
3. Add smooth animations for UX
4. Include real Reth code examples
5. Test on mobile devices

## 📖 Resources

- [Reth Book](https://paradigmxyz.github.io/reth/)
- [Engine API Spec](https://github.com/ethereum/execution-apis)
- [Reth GitHub](https://github.com/paradigmxyz/reth)

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

Built with ❤️ for the Reth community to accelerate developer onboarding and understanding.

---

**Note**: This is an educational visualization tool. For production usage, refer to [official Reth documentation](https://paradigmxyz.github.io/reth/).