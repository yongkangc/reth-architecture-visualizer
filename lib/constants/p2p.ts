import type { NetworkConfig, ReputationWeight, KademliaParams, EducationalSection } from '@/lib/types/p2p'

// Network configuration constants
export const MAX_PEERS = 50
export const MAX_OUTBOUND = 30
export const MAX_INBOUND = 20
export const BUCKET_SIZE = 16 // K-bucket size
export const BUCKET_COUNT = 256 // Number of K-buckets
export const BASE_REPUTATION = 100
export const MAX_REPUTATION = 150
export const MIN_REPUTATION = -100
export const ALPHA = 3 // Kademlia concurrency parameter
export const K_VALUE = 16 // K-bucket size

export const NETWORK_CONFIG: NetworkConfig = {
  maxPeers: MAX_PEERS,
  maxOutbound: MAX_OUTBOUND,
  maxInbound: MAX_INBOUND,
  bucketSize: BUCKET_SIZE,
  bucketCount: BUCKET_COUNT,
  alpha: ALPHA,
  kValue: K_VALUE,
  baseReputation: BASE_REPUTATION,
  maxReputation: MAX_REPUTATION,
  minReputation: MIN_REPUTATION
}

// Reputation system weights
export const REPUTATION_WEIGHTS: ReputationWeight = {
  connectionSuccess: 5,
  connectionFailure: -10,
  protocolViolation: -50,
  timeoutPenalty: -5,
  goodBehavior: 1
}

// Kademlia algorithm parameters
export const KADEMLIA_PARAMS: KademliaParams = {
  alpha: 3,
  k: 16,
  bucketRefreshInterval: 3600000, // 1 hour
  lookupTimeout: 5000, // 5 seconds
  maxConcurrentLookups: 3
}

// Protocol versions and capabilities
export const PROTOCOL_VERSIONS = {
  devp2p: 5,
  eth: 68,
  snap: 1,
  discovery: 5
}

export const CAPABILITY_NAMES = {
  ETH: 'eth',
  SNAP: 'snap',
  LES: 'les', // Light Ethereum Subprotocol
  WIT: 'wit'  // Witness protocol
}

// Message type configurations
export const MESSAGE_CONFIGS = {
  ping: { maxSize: 1024, timeout: 5000 },
  pong: { maxSize: 1024, timeout: 5000 },
  findnode: { maxSize: 2048, timeout: 10000 },
  neighbors: { maxSize: 8192, timeout: 10000 },
  enr_request: { maxSize: 1024, timeout: 5000 },
  enr_response: { maxSize: 2048, timeout: 5000 },
  status: { maxSize: 1024, timeout: 5000 },
  tx: { maxSize: 131072, timeout: 30000 }, // 128KB max
  block: { maxSize: 10485760, timeout: 60000 }, // 10MB max
  pooled_tx: { maxSize: 131072, timeout: 30000 },
  new_block_hashes: { maxSize: 4096, timeout: 15000 }
}

// Discovery phase configurations
export const DISCOVERY_PHASES = {
  idle: { duration: 0, description: "No active discovery" },
  bootstrap: { duration: 30000, description: "Initial peer discovery from bootstrap nodes" },
  lookup: { duration: 10000, description: "Active peer lookup for specific node IDs" },
  refresh: { duration: 15000, description: "Refreshing routing table buckets" },
  maintain: { duration: 60000, description: "Maintaining connections and routing table" }
}

// Bootstrap node configurations (mainnet examples)
export const BOOTSTRAP_NODES = [
  "enode://d860a01f9722d78051619d1e2351aba3f43f943f6f00718d1b9baa4101932a1f5011f16bb2b1bb35db20d6fe28fa0bf09636d26a87d31de9ec6203eeedb1f666@18.138.108.67:30303",
  "enode://22a8232c3abc76a16ae9d6c3b164f98775fe226f0917b0ca871128a74a8e9630b458460865bab457221f1d448dd9791d24c4e5d88786180ac185df813a68d4de@3.209.45.79:30303",
  "enode://8499da03c47d637b20eee24eec3c356c9a2e6148d6fe25ca195c7949ab8ec2c03e3556126b0d7ed644675e78c4318b08691b7b57de10e5f0d40d05b09238fa0a@52.187.207.27:30303"
]

// Educational content for P2P networking concepts
export const EDUCATIONAL_SECTIONS: Record<string, EducationalSection> = {
  kademlia: {
    title: "Kademlia DHT",
    description: "Distributed hash table algorithm used for peer discovery",
    concepts: [
      "XOR distance metric for node proximity",
      "K-buckets for routing table organization",
      "Iterative node lookup with α parallelism",
      "Self-healing and fault-tolerant network"
    ],
    examples: [
      "Finding the closest nodes to a target ID",
      "Maintaining routing table with 256 buckets",
      "Parallel queries with α=3 concurrent requests"
    ]
  },
  devp2p: {
    title: "DevP2P Protocol",
    description: "Ethereum's networking protocol stack",
    concepts: [
      "RLPx encrypted transport layer",
      "Capability-based subprotocol negotiation",
      "Message framing and multiplexing",
      "Connection lifecycle management"
    ],
    examples: [
      "Handshake with ECIES encryption",
      "ETH/68 wire protocol messages",
      "SNAP/1 state synchronization"
    ]
  },
  reputation: {
    title: "Reputation System",
    description: "Peer quality assessment and connection management",
    concepts: [
      "Connection success/failure tracking",
      "Protocol compliance monitoring",
      "Adaptive scoring based on behavior",
      "Blacklist management for misbehaving peers"
    ],
    examples: [
      "Rewarding successful connections (+5 points)",
      "Penalizing protocol violations (-50 points)",
      "Automatic disconnection below threshold"
    ]
  },
  discovery: {
    title: "Node Discovery",
    description: "Finding and connecting to Ethereum network peers",
    concepts: [
      "Bootstrap from well-known nodes",
      "ENR (Ethereum Node Records) for node information",
      "UDP-based discovery protocol",
      "Continuous routing table maintenance"
    ],
    examples: [
      "PING/PONG for liveness checking",
      "FINDNODE for neighbor discovery",
      "ENR updates for capability changes"
    ]
  }
}

// Common peer client identifiers
export const CLIENT_IDENTIFIERS = [
  "Geth/v1.13.0",
  "Nethermind/v1.20.0",
  "Besu/v23.7.0",
  "Erigon/v2.48.0",
  "Reth/v0.1.0-alpha"
]

// Network simulation parameters
export const SIMULATION_PARAMS = {
  nodeSpawnRate: 1000, // ms between node spawns
  messageDelay: { min: 50, max: 200 }, // ms
  connectionTimeout: 5000, // ms
  discoveryInterval: 15000, // ms
  reputationDecay: 0.99, // per hour
  bucketRefreshRate: 3600000 // ms (1 hour)
}

// Visualization constants
export const VISUALIZATION_CONFIG = {
  nodeRadius: 8,
  connectionOpacity: 0.6,
  animationDuration: 1000,
  colors: {
    bootstrap: "#fbbf24", // yellow-400
    trusted: "#10b981", // emerald-500
    basic: "#6b7280", // gray-500
    discovered: "#3b82f6", // blue-500
    banned: "#ef4444" // red-500
  },
  layers: {
    nodes: 10,
    connections: 5,
    messages: 15,
    ui: 20
  }
}