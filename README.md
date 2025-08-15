# Reth Architecture Interactive Visualizer

An interactive learning platform for understanding [Reth](https://github.com/paradigmxyz/reth)'s architecture and internal systems. Built with Next.js, TypeScript, and Framer Motion with an Ethereum.org-inspired design.

![Reth Architecture](https://img.shields.io/badge/Reth-Architecture-orange)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🚀 Live Demo

🌐 **[View Live Demo](https://reth.chiayong.com)**

## 🎯 Overview

This visualization tool helps engineers understand Reth's complex architecture through interactive simulations, animations, and step-by-step explanations of core systems. Based on deep analysis of Reth's codebase and comprehensive gists documenting internal architectures.

### ✨ Features

- **🎮 Interactive Simulations**: Real-time visualization of Engine API flow, state root computation strategies, and trie navigation
- **📚 Progressive Learning**: Five chapters covering everything from basics to advanced optimization strategies
- **🎨 Beautiful UI**: Ethereum.org-inspired design with gradients, glassmorphism, and smooth animations
- **💻 Code Examples**: Actual Rust implementation snippets with syntax highlighting
- **📊 Performance Metrics**: Live metrics showing execution times, cache hits, and resource usage
- **🔄 Real-time State**: Watch how Reth processes blocks and manages state in real-time

## 📚 Chapters

1. **Overview**: The big picture of Ethereum execution architecture
2. **Engine API**: Understanding newPayload and forkchoiceUpdated flows
3. **State Root Computation**: Sparse, Parallel, and Sequential strategies (Coming Soon)
4. **Trie Architecture**: TrieWalker, caching, and optimization techniques (Coming Soon)
5. **Transaction Journey**: From mempool to finalized block (Coming Soon)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/reth-visualizations.git
cd visualizations

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure (Refactored)

```
visualizations/
├── app/                        # Next.js app directory
│   ├── chapters/              # Chapter pages
│   │   ├── engine-api/        # Engine API visualization
│   │   ├── state-root/        # State root computation
│   │   ├── trie/              # Trie architecture
│   │   └── transaction/       # Transaction flow
│   └── page.tsx               # Home page
├── components/                # Modular React components
│   ├── visualizations/        # Feature-specific components
│   │   ├── engine-api/       # Engine API components
│   │   ├── state-root/       # State root components
│   │   └── trie/             # Trie visualization components
│   ├── ui/                   # Reusable UI components
│   │   ├── buttons/          # Button components
│   │   ├── cards/            # Card components
│   │   └── metrics/          # Metric display components
│   └── layouts/              # Layout components
└── lib/                       # Core utilities
    ├── types/                # TypeScript type definitions
    ├── constants/            # Shared constants
    ├── hooks/                # Custom React hooks
    └── utils.ts              # Utility functions
```

### 📦 Component Architecture

The codebase has been refactored for maintainability:

- **Small, focused components**: Each component has a single responsibility
- **Shared types and constants**: Centralized in `/lib` for consistency
- **Reusable UI components**: Common UI patterns extracted for reuse
- **Custom hooks**: Simulation logic abstracted into hooks
- **Feature-based organization**: Components grouped by feature area

## 🎨 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Visualizations**: React Flow, Custom Canvas
- **State Management**: Zustand
- **Code Display**: Monaco Editor

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Follow the existing code structure
2. Use TypeScript for all new components
3. Add animations for better user experience
4. Keep visualizations simple and focused
5. Include code examples where relevant

## 📖 Resources

- [Reth Documentation](https://paradigmxyz.github.io/reth/)
- [Engine API Specification](https://github.com/ethereum/execution-apis)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built for the Reth community to improve developer onboarding and understanding of the codebase.

---

**Note**: This is an educational tool. For production Reth usage, refer to the official documentation.
