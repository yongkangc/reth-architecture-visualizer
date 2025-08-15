"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Network, Shield, Users, 
  ArrowRight, Info, Play, Pause,
  Eye, EyeOff,
  UserPlus,
  MessageSquare, Lock,
  Award, Ban,
  Server, Radar,
  ArrowDown, ArrowUp, Layers,
  Clock, Zap, Check, X,
  AlertCircle, BookOpen,
  ChevronRight, Globe,
  Wifi, WifiOff, Radio,
  Search, Hash, Key,
  Binary, Package, GitBranch
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
type PeerId = string
type NodeId = string
type ConnectionState = "disconnected" | "connecting" | "connected" | "handshaking" | "established"
type PeerType = "trusted" | "basic" | "discovered" | "banned"
type MessageType = "ping" | "pong" | "findnode" | "neighbors" | "enr_request" | "enr_response" | "status" | "tx" | "block" | "pooled_tx" | "new_block_hashes"
type DiscoveryPhase = "idle" | "bootstrap" | "lookup" | "refresh" | "maintain"

interface NetworkNode {
  id: NodeId
  peerId: PeerId
  address: string
  port: number
  type: PeerType
  distance?: number // Kademlia distance
  reputation: number
  connectionState: ConnectionState
  capabilities: string[]
  lastSeen?: number
  bucketIndex?: number // K-bucket index
  rtt?: number // Round trip time
  inbound: boolean
  enr?: string // Ethereum Node Record
  discoveryPort?: number
  rlpxPort?: number
}

interface KBucket {
  index: number
  distance: string
  nodes: NetworkNode[]
  maxSize: number
  replacementCache: NetworkNode[] // Nodes waiting to replace dead entries
}

interface NetworkMessage {
  id: string
  from: NodeId
  to: NodeId
  type: MessageType
  data?: unknown
  timestamp: number
  protocol?: "discovery" | "rlpx" | "eth"
  size?: number // bytes
}

interface ReputationChange {
  peerId: PeerId
  change: number
  reason: string
  timestamp: number
}

interface ProtocolCapability {
  name: string
  version: number
  messages: number
  offset: number
}

interface HandshakeState {
  step: "auth" | "ack" | "hello" | "status" | "established"
  localCapabilities: ProtocolCapability[]
  remoteCapabilities: ProtocolCapability[]
  agreedCapabilities: ProtocolCapability[]
  encryption?: "ECIES" | "AES"
  authData?: {
    signature?: string
    pubkey?: string
    nonce?: string
  }
}

interface DiscoveryStep {
  id: string
  phase: string
  action: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  timestamp: number
}

// Constants
const MAX_PEERS = 50
const MAX_OUTBOUND = 30
const MAX_INBOUND = 20
const BUCKET_SIZE = 16 // K-bucket size
const BUCKET_COUNT = 256 // Number of K-buckets
const BASE_REPUTATION = 100
const MAX_REPUTATION = 150
const MIN_REPUTATION = -100
const ALPHA = 3 // Kademlia concurrency parameter
const K_VALUE = 16 // K-bucket size

// Reputation weights (from Reth's reputation.rs)
const REPUTATION_UNIT = -1024;
const REPUTATION_WEIGHTS = {
  BAD_MESSAGE: 16 * REPUTATION_UNIT, // -16384
  BAD_BLOCK: 16 * REPUTATION_UNIT, // -16384
  BAD_TRANSACTIONS: 16 * REPUTATION_UNIT, // -16384
  BAD_ANNOUNCEMENT: REPUTATION_UNIT, // -1024
  ALREADY_SEEN_TRANSACTION: 0, // Common in practice, no penalty
  TIMEOUT: 4 * REPUTATION_UNIT, // -4096
  BAD_PROTOCOL: Number.MIN_SAFE_INTEGER, // Protocol violations
  FAILED_TO_CONNECT: 25 * REPUTATION_UNIT, // -25600
  DROPPED: 4 * REPUTATION_UNIT, // -4096
  // Additional reputation changes
  DEFAULT: 0,
  RESET: 0, // Reset to default reputation
  BANNED_THRESHOLD: 50 * REPUTATION_UNIT, // -51200
}

// Educational content sections
const educationalSections = {
  overview: {
    title: "Ethereum P2P Network Stack",
    icon: Network,
    content: `
      The Ethereum P2P network consists of two main protocols:
      
      **Discovery v4/v5**: UDP-based node discovery using Kademlia DHT
      - Finds new peers in the network
      - Maintains routing tables (K-buckets)
      - Uses 256-bit node IDs from public keys
      
      **RLPx**: TCP-based encrypted transport protocol
      - Handles actual data exchange
      - ECIES encryption for security
      - Multiplexes sub-protocols (ETH, SNAP, etc.)
      
      Together, they enable Ethereum nodes to discover peers and exchange blockchain data securely.
    `
  },
  discovery: {
    title: "Node Discovery Process",
    icon: Radar,
    content: `
      **Kademlia DHT (Distributed Hash Table)**
      
      The discovery protocol organizes nodes in a structured overlay network:
      
      1. **Node IDs**: 256-bit identifiers from keccak256(pubkey)
      2. **XOR Distance**: Logical distance between nodes (not geographic)
      3. **K-Buckets**: 256 buckets storing nodes at different distances
      4. **Lookup Algorithm**: Iteratively query α=3 closest nodes
      
      **Discovery Phases:**
      - **Bootstrap**: Connect to known seed nodes
      - **Lookup**: Find nodes close to random target
      - **Refresh**: Keep buckets fresh with periodic lookups
      - **Maintain**: Replace stale nodes, update routing table
    `
  },
  handshake: {
    title: "RLPx Handshake Protocol",
    icon: Lock,
    content: `
      **Secure Connection Establishment**
      
      The RLPx handshake establishes encrypted channels:
      
      1. **Auth Message (Initiator → Recipient)**
         - ECIES-encrypted with recipient's public key
         - Contains ephemeral key, signature, nonce
         - Initiates ECDH key agreement
      
      2. **Auth-Ack Message (Recipient → Initiator)**
         - Confirms authentication
         - Shares recipient's ephemeral key
         - Establishes shared secrets
      
      3. **Protocol Handshake**
         - HELLO: Exchange capabilities (ETH/69, SNAP/1, etc.)
         - STATUS: Share blockchain state (genesis, head, fork IDs)
         - Connection ready for data exchange
      
      All subsequent messages are encrypted with AES-256-CTR using derived keys.
    `
  },
  reputation: {
    title: "Peer Reputation System",
    icon: Award,
    content: `
      **Reputation-Based Peer Management**
      
      Nodes track peer behavior to maintain network quality:
      
      **Reputation Scoring:**
      - Start at baseline (100 points)
      - Penalize bad behavior (invalid blocks, timeouts)
      - Reward good behavior (valid data, responsiveness)
      - Ban peers below threshold (-51200)
      
      **Common Penalties:**
      - Invalid block/transactions: -16384 points
      - Connection timeout: -4096 points
      - Failed connection: -25600 points
      - Protocol violation: Immediate ban
      
      This system protects against malicious peers and ensures efficient resource allocation.
    `
  },
  messages: {
    title: "Protocol Messages",
    icon: MessageSquare,
    content: `
      **Message Types & Purpose**
      
      **Discovery Messages (UDP):**
      - PING/PONG: Liveness check, endpoint verification
      - FINDNODE: Request nodes near target
      - NEIGHBORS: Response with closest nodes
      - ENR_REQUEST/RESPONSE: Share node records
      
      **ETH Protocol Messages (TCP):**
      - STATUS: Exchange chain info
      - NEW_BLOCK_HASHES: Announce new blocks
      - GET_BLOCK_HEADERS: Request headers
      - BLOCK_HEADERS: Send headers
      - GET_BLOCK_BODIES: Request transactions/uncles
      - TRANSACTIONS: Broadcast new transactions
      - GET_RECEIPTS: Request transaction receipts
      - POOLED_TRANSACTIONS: Share mempool transactions
      
      Each message type serves specific synchronization needs.
    `
  }
}

// Sample network data
const generateSampleNodes = (): NetworkNode[] => {
  const nodes: NetworkNode[] = []
  
  // Our node
  nodes.push({
    id: "self",
    peerId: "0x1234...abcd",
    address: "127.0.0.1",
    port: 30303,
    type: "trusted",
    reputation: BASE_REPUTATION,
    connectionState: "established",
    capabilities: ["eth/68", "eth/69", "snap/1"],
    inbound: false,
    enr: "enr:-KO4QGfSx...",
    discoveryPort: 30301,
    rlpxPort: 30303
  })

  // Trusted nodes (bootstrap nodes)
  for (let i = 0; i < 3; i++) {
    nodes.push({
      id: `trusted-${i}`,
      peerId: `0xaaaa...${i}${i}${i}${i}`,
      address: `10.0.0.${10 + i}`,
      port: 30303,
      type: "trusted",
      reputation: BASE_REPUTATION + 50,
      connectionState: i === 0 ? "established" : "connected",
      capabilities: ["eth/68", "eth/69", "snap/1"],
      lastSeen: Date.now() - i * 1000,
      bucketIndex: i,
      rtt: 10 + i * 5,
      inbound: false,
      enr: `enr:-trusted${i}...`,
      discoveryPort: 30301,
      rlpxPort: 30303
    })
  }

  // Basic nodes
  for (let i = 0; i < 5; i++) {
    nodes.push({
      id: `basic-${i}`,
      peerId: `0xbbbb...${i}${i}${i}${i}`,
      address: `192.168.1.${100 + i}`,
      port: 30303,
      type: "basic",
      reputation: BASE_REPUTATION,
      connectionState: i < 2 ? "established" : i < 4 ? "connected" : "connecting",
      capabilities: ["eth/68", "eth/69"],
      lastSeen: Date.now() - i * 5000,
      bucketIndex: 10 + i,
      rtt: 50 + i * 10,
      inbound: i % 2 === 0,
      discoveryPort: 30301,
      rlpxPort: 30303
    })
  }

  // Discovered nodes
  for (let i = 0; i < 8; i++) {
    nodes.push({
      id: `discovered-${i}`,
      peerId: `0xcccc...${i}${i}${i}${i}`,
      address: `172.16.0.${50 + i}`,
      port: 30303,
      type: "discovered",
      reputation: BASE_REPUTATION - i * 5,
      connectionState: i < 2 ? "connected" : "disconnected",
      capabilities: ["eth/68"],
      lastSeen: Date.now() - i * 10000,
      bucketIndex: 50 + i * 10,
      distance: i * 20,
      rtt: 100 + i * 20,
      inbound: i % 3 === 0,
      discoveryPort: 30301,
      rlpxPort: 30303
    })
  }

  return nodes
}

// Generate K-buckets with replacement cache
const generateKBuckets = (nodes: NetworkNode[]): KBucket[] => {
  const buckets: KBucket[] = []
  
  // Create simplified buckets (showing first 8 for visualization)
  for (let i = 0; i < 8; i++) {
    const bucketNodes = nodes.filter(n => 
      n.bucketIndex !== undefined && 
      Math.floor(n.bucketIndex / 32) === i
    )
    
    // Simulate replacement cache
    const replacementNodes = nodes.filter(n =>
      n.bucketIndex !== undefined &&
      Math.floor(n.bucketIndex / 32) === i &&
      n.connectionState === "disconnected"
    ).slice(0, 3)
    
    buckets.push({
      index: i,
      distance: `2^${255 - i}`,
      nodes: bucketNodes.slice(0, BUCKET_SIZE),
      maxSize: BUCKET_SIZE,
      replacementCache: replacementNodes
    })
  }
  
  return buckets
}

export default function P2PNetworkPage() {
  const [nodes, setNodes] = useState<NetworkNode[]>(generateSampleNodes())
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [messages, setMessages] = useState<NetworkMessage[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveryPhase, setDiscoveryPhase] = useState<DiscoveryPhase>("idle")
  const [discoverySteps, setDiscoverySteps] = useState<DiscoveryStep[]>([])
  const [viewMode, setViewMode] = useState<"topology" | "kbuckets" | "handshake" | "reputation" | "education">("topology")
  const [activeEducationSection, setActiveEducationSection] = useState<keyof typeof educationalSections>("overview")
  const [showMessages, setShowMessages] = useState(true)
  const [reputationHistory, setReputationHistory] = useState<ReputationChange[]>([])
  const [handshakeState, setHandshakeState] = useState<HandshakeState>({
    step: "auth",
    localCapabilities: [
      { name: "eth", version: 69, messages: 17, offset: 16 },
      { name: "eth", version: 68, messages: 17, offset: 33 },
      { name: "snap", version: 1, messages: 8, offset: 50 }
    ],
    remoteCapabilities: [],
    agreedCapabilities: [],
    encryption: undefined,
    authData: {}
  })
  const [connectedPeers, setConnectedPeers] = useState(0)
  const [inboundPeers, setInboundPeers] = useState(0)
  const [outboundPeers, setOutboundPeers] = useState(0)
  const discoveryIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Calculate connection stats
  useEffect(() => {
    const connected = nodes.filter(n => n.connectionState === "established").length
    const inbound = nodes.filter(n => n.connectionState === "established" && n.inbound).length
    const outbound = connected - inbound
    
    setConnectedPeers(connected)
    setInboundPeers(inbound)
    setOutboundPeers(outbound)
  }, [nodes])

  // K-buckets for Kademlia routing
  const kBuckets = useMemo(() => generateKBuckets(nodes), [nodes])

  // Enhanced discovery simulation with visual steps
  const startDiscovery = () => {
    setIsDiscovering(true)
    setDiscoveryPhase("bootstrap")
    setDiscoverySteps([])
    
    let phase = 0
    const phases: DiscoveryPhase[] = ["bootstrap", "lookup", "refresh", "maintain"]
    
    const addDiscoveryStep = (step: DiscoveryStep) => {
      setDiscoverySteps(prev => [...prev.slice(-5), step])
    }
    
    const runPhase = () => {
      if (phase >= phases.length) {
        setIsDiscovering(false)
        setDiscoveryPhase("idle")
        addDiscoveryStep({
          id: `complete-${Date.now()}`,
          phase: "complete",
          action: "Discovery Complete",
          detail: "Node discovery cycle finished",
          icon: Check,
          color: "text-green-400",
          timestamp: Date.now()
        })
        return
      }
      
      const currentPhase = phases[phase]
      setDiscoveryPhase(currentPhase)
      
      // Simulate discovery messages and visual feedback
      if (currentPhase === "bootstrap") {
        addDiscoveryStep({
          id: `bootstrap-${Date.now()}`,
          phase: "bootstrap",
          action: "Connecting to Bootstrap Nodes",
          detail: "Initiating connection to known seed nodes",
          icon: Globe,
          color: "text-blue-400",
          timestamp: Date.now()
        })
        
        // Send initial pings to bootstrap nodes
        const bootstrapNodes = nodes.filter(n => n.type === "trusted")
        bootstrapNodes.forEach((node, i) => {
          setTimeout(() => {
            addMessage("self", node.id, "ping", "discovery")
            setTimeout(() => {
              addMessage(node.id, "self", "pong", "discovery")
              addDiscoveryStep({
                id: `pong-${Date.now()}-${i}`,
                phase: "bootstrap",
                action: "Bootstrap Response",
                detail: `Received PONG from ${node.peerId.slice(0, 10)}`,
                icon: Wifi,
                color: "text-green-400",
                timestamp: Date.now()
              })
            }, 200)
          }, i * 300)
        })
      } else if (currentPhase === "lookup") {
        addDiscoveryStep({
          id: `lookup-${Date.now()}`,
          phase: "lookup",
          action: "Performing Node Lookup",
          detail: `Finding nodes close to random target (α=${ALPHA})`,
          icon: Search,
          color: "text-purple-400",
          timestamp: Date.now()
        })
        
        // Send FINDNODE messages
        const connectedNodes = nodes.filter(n => n.connectionState === "established")
        connectedNodes.slice(0, ALPHA).forEach((node, i) => {
          setTimeout(() => {
            addMessage("self", node.id, "findnode", "discovery")
            setTimeout(() => {
              addMessage(node.id, "self", "neighbors", "discovery")
              addDiscoveryStep({
                id: `neighbors-${Date.now()}-${i}`,
                phase: "lookup",
                action: "Neighbors Received",
                detail: `Got ${Math.floor(Math.random() * 10) + 5} nodes from ${node.peerId.slice(0, 10)}`,
                icon: Users,
                color: "text-cyan-400",
                timestamp: Date.now()
              })
            }, 400)
          }, i * 500)
        })
      } else if (currentPhase === "refresh") {
        addDiscoveryStep({
          id: `refresh-${Date.now()}`,
          phase: "refresh",
          action: "Refreshing K-Buckets",
          detail: "Updating routing table with fresh nodes",
          icon: RotateCcw,
          color: "text-amber-400",
          timestamp: Date.now()
        })
        
        // Refresh buckets
        simulateNewNodeDiscovery()
      } else if (currentPhase === "maintain") {
        addDiscoveryStep({
          id: `maintain-${Date.now()}`,
          phase: "maintain",
          action: "Maintenance Phase",
          detail: "Checking node liveness and updating reputation",
          icon: Shield,
          color: "text-indigo-400",
          timestamp: Date.now()
        })
      }
      
      discoveryIntervalRef.current = setTimeout(() => {
        phase++
        runPhase()
      }, 3000)
    }
    
    runPhase()
  }

  const stopDiscovery = () => {
    setIsDiscovering(false)
    setDiscoveryPhase("idle")
    if (discoveryIntervalRef.current) {
      clearTimeout(discoveryIntervalRef.current)
    }
    setDiscoverySteps([])
  }

  // Add a message to the message list
  const addMessage = (from: NodeId, to: NodeId, type: MessageType, protocol: "discovery" | "rlpx" | "eth" = "eth") => {
    const message: NetworkMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      from,
      to,
      type,
      timestamp: Date.now(),
      protocol,
      size: Math.floor(Math.random() * 1000) + 100
    }
    
    setMessages(prev => [...prev.slice(-9), message])
  }

  // Enhanced new node discovery simulation
  const simulateNewNodeDiscovery = () => {
    const newNode: NetworkNode = {
      id: `discovered-new-${Date.now()}`,
      peerId: `0xdddd...${Math.random().toString(16).slice(2, 6)}`,
      address: `172.16.0.${Math.floor(Math.random() * 255)}`,
      port: 30303,
      type: "discovered",
      reputation: BASE_REPUTATION,
      connectionState: "disconnected",
      capabilities: ["eth/68", "eth/69"],
      lastSeen: Date.now(),
      bucketIndex: Math.floor(Math.random() * 256),
      distance: Math.floor(Math.random() * 100),
      inbound: false,
      enr: `enr:-new-${Date.now()}`,
      discoveryPort: 30301,
      rlpxPort: 30303
    }
    
    setNodes(prev => [...prev, newNode])
    
    // Simulate connection attempt with visual feedback
    setTimeout(() => {
      setNodes(prev => prev.map(n => 
        n.id === newNode.id 
          ? { ...n, connectionState: "connecting" }
          : n
      ))
    }, 500)
    
    setTimeout(() => {
      setNodes(prev => prev.map(n => 
        n.id === newNode.id 
          ? { ...n, connectionState: "handshaking" }
          : n
      ))
    }, 1000)
    
    setTimeout(() => {
      setNodes(prev => prev.map(n => 
        n.id === newNode.id 
          ? { ...n, connectionState: "connected" }
          : n
      ))
    }, 1500)
    
    setTimeout(() => {
      setNodes(prev => prev.map(n => 
        n.id === newNode.id 
          ? { ...n, connectionState: "established", rtt: Math.floor(Math.random() * 100) + 20 }
          : n
      ))
    }, 2000)
  }

  // Enhanced handshake simulation
  const simulateHandshake = () => {
    // Step 1: Auth
    setHandshakeState(prev => ({
      ...prev,
      step: "auth",
      remoteCapabilities: [],
      agreedCapabilities: [],
      encryption: undefined,
      authData: {}
    }))
    
    // Step 2: Auth message sent
    setTimeout(() => {
      setHandshakeState(prev => ({
        ...prev,
        authData: {
          signature: "0xf8a9b2c3...",
          pubkey: "0x04abcd...",
          nonce: "0x1234..."
        },
        encryption: "ECIES"
      }))
    }, 500)
    
    // Step 3: Ack received
    setTimeout(() => {
      setHandshakeState(prev => ({
        ...prev,
        step: "ack",
        encryption: "AES"
      }))
    }, 1000)
    
    // Step 4: Hello exchange
    setTimeout(() => {
      setHandshakeState(prev => ({
        ...prev,
        step: "hello"
      }))
    }, 1500)
    
    // Step 5: Receive remote capabilities
    setTimeout(() => {
      setHandshakeState(prev => ({
        ...prev,
        remoteCapabilities: [
          { name: "eth", version: 69, messages: 17, offset: 16 },
          { name: "eth", version: 68, messages: 17, offset: 33 }
        ]
      }))
    }, 2000)
    
    // Step 6: Status exchange
    setTimeout(() => {
      setHandshakeState(prev => ({
        ...prev,
        step: "status"
      }))
    }, 2500)
    
    // Step 7: Established
    setTimeout(() => {
      setHandshakeState(prev => ({
        ...prev,
        step: "established",
        agreedCapabilities: [
          { name: "eth", version: 69, messages: 17, offset: 16 }
        ]
      }))
    }, 3000)
  }

  // Update peer reputation
  const updateReputation = (peerId: PeerId, change: number, reason: string) => {
    setNodes(prev => prev.map(node => {
      if (node.peerId === peerId) {
        const newReputation = Math.max(
          MIN_REPUTATION,
          Math.min(MAX_REPUTATION, node.reputation + change)
        )
        return { ...node, reputation: newReputation }
      }
      return node
    }))
    
    setReputationHistory(prev => [...prev, {
      peerId,
      change,
      reason,
      timestamp: Date.now()
    }])
  }

  // Ban a peer
  const banPeer = (peerId: PeerId) => {
    setNodes(prev => prev.map(node => {
      if (node.peerId === peerId) {
        return { 
          ...node, 
          type: "banned" as PeerType,
          connectionState: "disconnected",
          reputation: MIN_REPUTATION
        }
      }
      return node
    }))
    
    updateReputation(peerId, REPUTATION_WEIGHTS.BAD_PROTOCOL, "Banned for protocol violation")
  }

  // Get node position for topology view (improved circular layout)
  const getNodePosition = (node: NetworkNode, index: number, total: number) => {
    if (node.id === "self") {
      return { x: 50, y: 50 }
    }
    
    // Create rings based on node type and connection state
    let radius: number
    let angleOffset = 0
    
    if (node.type === "trusted") {
      radius = 15
      angleOffset = 0
    } else if (node.connectionState === "established") {
      radius = 25
      angleOffset = Math.PI / 6
    } else if (node.connectionState === "connected" || node.connectionState === "handshaking") {
      radius = 35
      angleOffset = Math.PI / 4
    } else {
      radius = 42
      angleOffset = Math.PI / 3
    }
    
    const angle = (index / total) * 2 * Math.PI + angleOffset
    const x = 50 + radius * Math.cos(angle)
    const y = 50 + radius * Math.sin(angle)
    
    return { x, y }
  }

  // Get connection color based on state
  const getConnectionColor = (state: ConnectionState) => {
    switch (state) {
      case "established": return "#10b981" // green
      case "connected": return "#3b82f6" // blue
      case "handshaking": return "#f59e0b" // amber
      case "connecting": return "#8b5cf6" // purple
      default: return "#6b7280" // gray
    }
  }

  // Get reputation color
  const getReputationColor = (reputation: number) => {
    if (reputation >= 120) return "#10b981" // green
    if (reputation >= 100) return "#3b82f6" // blue
    if (reputation >= 50) return "#f59e0b" // amber
    if (reputation >= 0) return "#ef4444" // red
    return "#991b1b" // dark red
  }

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (discoveryIntervalRef.current) {
        clearTimeout(discoveryIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">P2P Network Stack</h1>
              <p className="text-zinc-400">
                DevP2P protocol, Kademlia DHT discovery, and peer reputation management
              </p>
            </div>
          </div>
        </motion.div>

        {/* Connection Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
        >
          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Connected Peers</span>
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">{connectedPeers}/{MAX_PEERS}</div>
            <div className="text-xs text-zinc-500 mt-1">
              {((connectedPeers / MAX_PEERS) * 100).toFixed(0)}% capacity
            </div>
            <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${(connectedPeers / MAX_PEERS) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Inbound</span>
              <ArrowDown className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">{inboundPeers}/{MAX_INBOUND}</div>
            <div className="text-xs text-zinc-500 mt-1">Incoming connections</div>
            <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${(inboundPeers / MAX_INBOUND) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Outbound</span>
              <ArrowUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-500">{outboundPeers}/{MAX_OUTBOUND}</div>
            <div className="text-xs text-zinc-500 mt-1">Outgoing connections</div>
            <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${(outboundPeers / MAX_OUTBOUND) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Discovery</span>
              <Radar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-amber-500 capitalize">{discoveryPhase}</div>
            <div className="text-xs text-zinc-500 mt-1">Current phase</div>
            {isDiscovering && (
              <motion.div 
                className="mt-2 h-1 bg-amber-500/20 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ width: "50%" }}
                />
              </motion.div>
            )}
          </div>

          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Banned</span>
              <Ban className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500">
              {nodes.filter(n => n.type === "banned").length}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Blacklisted peers</div>
            <div className="mt-2 flex gap-1">
              {nodes.filter(n => n.type === "banned").slice(0, 3).map((n, i) => (
                <div key={i} className="w-2 h-2 bg-red-500 rounded-full" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setViewMode("topology")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              viewMode === "topology"
                ? "bg-[#627eea] text-white shadow-lg shadow-[#627eea]/25"
                : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
            )}
          >
            <Network className="w-4 h-4 inline mr-2" />
            Network Topology
          </button>
          <button
            onClick={() => setViewMode("kbuckets")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              viewMode === "kbuckets"
                ? "bg-[#627eea] text-white shadow-lg shadow-[#627eea]/25"
                : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
            )}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            K-Buckets
          </button>
          <button
            onClick={() => setViewMode("handshake")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              viewMode === "handshake"
                ? "bg-[#627eea] text-white shadow-lg shadow-[#627eea]/25"
                : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
            )}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            RLPx Handshake
          </button>
          <button
            onClick={() => setViewMode("reputation")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              viewMode === "reputation"
                ? "bg-[#627eea] text-white shadow-lg shadow-[#627eea]/25"
                : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
            )}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Reputation
          </button>
          <button
            onClick={() => setViewMode("education")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              viewMode === "education"
                ? "bg-[#627eea] text-white shadow-lg shadow-[#627eea]/25"
                : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
            )}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Learn More
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2"
          >
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
              {/* Network Topology View */}
              {viewMode === "topology" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Network className="w-5 h-5 text-green-500" />
                    Network Topology
                    <span className="text-xs text-zinc-500 ml-auto">
                      Real-time peer connections
                    </span>
                  </h2>
                  
                  <div className="relative h-[600px] bg-gradient-to-br from-zinc-950 to-zinc-900 rounded-xl overflow-hidden">
                    {/* Grid background */}
                    <div className="absolute inset-0 opacity-10">
                      <svg className="w-full h-full">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>

                    {/* Connection lines */}
                    <svg className="absolute inset-0 w-full h-full">
                      {nodes.filter(n => n.id !== "self" && n.connectionState !== "disconnected").map((node, i) => {
                        const nodePos = getNodePosition(node, i, nodes.length - 1)
                        const selfPos = { x: 50, y: 50 }
                        
                        return (
                          <g key={node.id}>
                            <motion.line
                              x1={`${selfPos.x}%`}
                              y1={`${selfPos.y}%`}
                              x2={`${nodePos.x}%`}
                              y2={`${nodePos.y}%`}
                              stroke={getConnectionColor(node.connectionState)}
                              strokeWidth={node.connectionState === "established" ? 2 : 1}
                              strokeDasharray={node.connectionState === "connecting" ? "5,5" : "0"}
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 0.6 }}
                              transition={{ duration: 1 }}
                            />
                            {node.connectionState === "established" && showMessages && (
                              <motion.circle
                                r="3"
                                fill={getConnectionColor(node.connectionState)}
                                initial={{ x: `${selfPos.x}%`, y: `${selfPos.y}%` }}
                                animate={{ 
                                  x: [`${selfPos.x}%`, `${nodePos.x}%`, `${selfPos.x}%`],
                                  y: [`${selfPos.y}%`, `${nodePos.y}%`, `${selfPos.y}%`]
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                              />
                            )}
                          </g>
                        )
                      })}
                    </svg>

                    {/* Nodes */}
                    {nodes.map((node, i) => {
                      const pos = getNodePosition(node, i, nodes.length - 1)
                      const isSelected = selectedNode?.id === node.id
                      
                      return (
                        <motion.div
                          key={node.id}
                          className="absolute"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: "translate(-50%, -50%)"
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: isSelected ? 1.2 : 1 }}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => setSelectedNode(node)}
                        >
                          <div className={cn(
                            "relative cursor-pointer group",
                            node.id === "self" && "z-10"
                          )}>
                            {/* Node glow */}
                            {(node.connectionState === "established" || node.id === "self") && (
                              <motion.div
                                className="absolute inset-0 rounded-full blur-xl"
                                style={{
                                  background: node.type === "trusted" 
                                    ? "radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)"
                                    : node.type === "banned"
                                    ? "radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)"
                                    : "radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)"
                                }}
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity
                                }}
                              />
                            )}
                            
                            {/* Node circle */}
                            <div className={cn(
                              "relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                              node.id === "self" 
                                ? "bg-gradient-to-br from-[#627eea] to-[#a16ae8] border-white shadow-lg"
                                : node.type === "trusted"
                                ? "bg-green-500/20 border-green-500"
                                : node.type === "banned"
                                ? "bg-red-500/20 border-red-500"
                                : node.type === "basic"
                                ? "bg-blue-500/20 border-blue-500"
                                : "bg-zinc-700/50 border-zinc-600",
                              isSelected && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                            )}>
                              {node.id === "self" ? (
                                <Server className="w-6 h-6 text-white" />
                              ) : node.type === "trusted" ? (
                                <Shield className="w-5 h-5 text-green-400" />
                              ) : node.type === "banned" ? (
                                <Ban className="w-5 h-5 text-red-400" />
                              ) : node.inbound ? (
                                <ArrowDown className="w-5 h-5 text-blue-400" />
                              ) : (
                                <ArrowUp className="w-5 h-5 text-purple-400" />
                              )}
                            </div>

                            {/* Node label */}
                            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                              <div className="text-xs text-zinc-400 text-center">
                                {node.id === "self" ? "Your Node" : node.peerId.slice(0, 10)}
                              </div>
                              {node.rtt && (
                                <div className="text-xs text-zinc-500 text-center">
                                  {node.rtt}ms
                                </div>
                              )}
                            </div>

                            {/* Hover tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                              <div className="bg-zinc-800 rounded-lg p-3 text-xs whitespace-nowrap shadow-xl">
                                <div className="font-semibold text-white mb-1">{node.peerId}</div>
                                <div className="space-y-1 text-zinc-400">
                                  <div>Address: {node.address}:{node.port}</div>
                                  <div>Type: <span className="text-zinc-300">{node.type}</span></div>
                                  <div>State: <span className="text-zinc-300">{node.connectionState}</span></div>
                                  <div>Reputation: <span className="text-zinc-300">{node.reputation}</span></div>
                                  {node.enr && <div>ENR: <span className="text-zinc-300">{node.enr.slice(0, 12)}...</span></div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-zinc-400">Trusted/Bootstrap</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-zinc-400">Basic Peer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-600" />
                      <span className="text-zinc-400">Discovered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-zinc-400">Banned</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDown className="w-3 h-3 text-blue-400" />
                      <span className="text-zinc-400">Inbound</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-3 h-3 text-purple-400" />
                      <span className="text-zinc-400">Outbound</span>
                    </div>
                  </div>
                </div>
              )}

              {/* K-Buckets View */}
              {viewMode === "kbuckets" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-500" />
                    Kademlia K-Buckets
                    <span className="text-xs text-zinc-500 ml-auto">
                      DHT routing table structure
                    </span>
                  </h2>
                  
                  <div className="space-y-3">
                    {kBuckets.map((bucket) => (
                      <motion.div 
                        key={bucket.index} 
                        className="bg-zinc-950/50 rounded-lg p-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: bucket.index * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold">
                              {bucket.index}
                            </div>
                            <div>
                              <span className="text-sm font-medium">Bucket {bucket.index}</span>
                              <span className="text-xs text-zinc-500 ml-2">Distance: {bucket.distance}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">
                              {bucket.nodes.length}/{bucket.maxSize} nodes
                            </span>
                            {bucket.replacementCache.length > 0 && (
                              <span className="text-xs text-amber-400">
                                +{bucket.replacementCache.length} cache
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: bucket.maxSize }).map((_, i) => {
                            const node = bucket.nodes[i]
                            return (
                              <motion.div
                                key={i}
                                className={cn(
                                  "flex-1 h-10 rounded border flex items-center justify-center transition-all cursor-pointer",
                                  node
                                    ? node.connectionState === "established"
                                      ? "bg-green-500/20 border-green-500/50 hover:bg-green-500/30"
                                      : node.connectionState === "connected"
                                      ? "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30"
                                      : "bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30"
                                    : "bg-zinc-800/50 border-zinc-700"
                                )}
                                title={node ? `${node.peerId} (${node.connectionState})` : "Empty slot"}
                                whileHover={{ scale: node ? 1.05 : 1 }}
                                onClick={() => node && setSelectedNode(node)}
                              >
                                {node ? (
                                  <div className="text-xs text-zinc-300 font-mono">
                                    {node.peerId.slice(0, 6)}
                                  </div>
                                ) : (
                                  <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                        
                        {/* Replacement cache */}
                        {bucket.replacementCache.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-1">Replacement cache:</div>
                            <div className="flex gap-1">
                              {bucket.replacementCache.map((node, i) => (
                                <div
                                  key={i}
                                  className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-400"
                                >
                                  {node.peerId.slice(0, 8)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/30">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      Kademlia DHT Structure
                    </h3>
                    <div className="text-xs text-zinc-400 space-y-2">
                      <p>
                        The routing table organizes peers into {BUCKET_COUNT} k-buckets based on XOR distance.
                        Each bucket holds up to {K_VALUE} nodes at a specific distance range from our node ID.
                      </p>
                      <p>
                        Closer nodes (lower bucket indices) are kept in smaller buckets for efficient routing.
                        The replacement cache stores additional nodes that can replace unresponsive entries.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-zinc-900/50 rounded p-2">
                          <div className="text-zinc-300 font-medium">Concurrency (α)</div>
                          <div className="text-zinc-500">{ALPHA} parallel lookups</div>
                        </div>
                        <div className="bg-zinc-900/50 rounded p-2">
                          <div className="text-zinc-300 font-medium">Replication (k)</div>
                          <div className="text-zinc-500">{K_VALUE} nodes per bucket</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RLPx Handshake View */}
              {viewMode === "handshake" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-500" />
                    RLPx Handshake Protocol
                    <span className="text-xs text-zinc-500 ml-auto">
                      Secure connection establishment
                    </span>
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Visual Handshake Flow */}
                    <div className="bg-zinc-950/50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-center flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Server className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-sm font-medium">Initiator</div>
                          <div className="text-xs text-zinc-500">Your Node</div>
                        </div>
                        
                        <div className="flex-1 px-4">
                          {/* Connection flow arrows */}
                          <div className="space-y-3">
                            <motion.div 
                              className="flex items-center gap-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: handshakeState.step !== "auth" ? 1 : 0.3, x: 0 }}
                            >
                              <ArrowRight className="w-4 h-4 text-purple-400" />
                              <div className="flex-1 h-px bg-purple-400/50" />
                              <span className="text-xs text-purple-400">Auth</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center gap-2"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: ["ack", "hello", "status", "established"].includes(handshakeState.step) ? 1 : 0.3, x: 0 }}
                            >
                              <span className="text-xs text-green-400">Ack</span>
                              <div className="flex-1 h-px bg-green-400/50" />
                              <ArrowRight className="w-4 h-4 text-green-400 rotate-180" />
                            </motion.div>
                            <motion.div 
                              className="flex items-center gap-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: ["hello", "status", "established"].includes(handshakeState.step) ? 1 : 0.3, x: 0 }}
                            >
                              <ArrowRight className="w-4 h-4 text-blue-400" />
                              <div className="flex-1 h-px bg-blue-400/50" />
                              <span className="text-xs text-blue-400">Hello</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center gap-2"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: ["status", "established"].includes(handshakeState.step) ? 1 : 0.3, x: 0 }}
                            >
                              <span className="text-xs text-amber-400">Status</span>
                              <div className="flex-1 h-px bg-amber-400/50" />
                              <ArrowRight className="w-4 h-4 text-amber-400 rotate-180" />
                            </motion.div>
                          </div>
                        </div>
                        
                        <div className="text-center flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Server className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-sm font-medium">Recipient</div>
                          <div className="text-xs text-zinc-500">Remote Node</div>
                        </div>
                      </div>
                      
                      {/* Current Step Details */}
                      <div className="bg-zinc-900/50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            handshakeState.step === "auth" ? "bg-purple-500" :
                            handshakeState.step === "ack" ? "bg-green-500" :
                            handshakeState.step === "hello" ? "bg-blue-500" :
                            handshakeState.step === "status" ? "bg-amber-500" :
                            "bg-emerald-500"
                          )}>
                            {handshakeState.step === "auth" ? <Key className="w-5 h-5 text-white" /> :
                             handshakeState.step === "ack" ? <Check className="w-5 h-5 text-white" /> :
                             handshakeState.step === "hello" ? <Radio className="w-5 h-5 text-white" /> :
                             handshakeState.step === "status" ? <GitBranch className="w-5 h-5 text-white" /> :
                             <Zap className="w-5 h-5 text-white" />}
                          </div>
                          <div>
                            <div className="font-medium capitalize">{handshakeState.step} Phase</div>
                            <div className="text-xs text-zinc-500">
                              {handshakeState.step === "auth" ? "Initiating secure connection" :
                               handshakeState.step === "ack" ? "Confirming authentication" :
                               handshakeState.step === "hello" ? "Exchanging capabilities" :
                               handshakeState.step === "status" ? "Sharing blockchain state" :
                               "Connection established"}
                            </div>
                          </div>
                        </div>
                        
                        {/* Encryption Status */}
                        {handshakeState.encryption && (
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Lock className="w-3 h-3" />
                            Encryption: <span className="text-zinc-300 font-mono">{handshakeState.encryption}</span>
                          </div>
                        )}
                        
                        {/* Auth Data */}
                        {handshakeState.authData && Object.keys(handshakeState.authData).length > 0 && (
                          <div className="mt-3 space-y-1">
                            {handshakeState.authData.signature && (
                              <div className="text-xs">
                                <span className="text-zinc-500">Signature:</span>
                                <span className="ml-2 font-mono text-zinc-400">{handshakeState.authData.signature}</span>
                              </div>
                            )}
                            {handshakeState.authData.pubkey && (
                              <div className="text-xs">
                                <span className="text-zinc-500">Public Key:</span>
                                <span className="ml-2 font-mono text-zinc-400">{handshakeState.authData.pubkey}</span>
                              </div>
                            )}
                            {handshakeState.authData.nonce && (
                              <div className="text-xs">
                                <span className="text-zinc-500">Nonce:</span>
                                <span className="ml-2 font-mono text-zinc-400">{handshakeState.authData.nonce}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Capabilities Exchange */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Local Capabilities */}
                      <div className="bg-zinc-950/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-blue-400 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Local Capabilities
                        </h3>
                        <div className="space-y-2">
                          {handshakeState.localCapabilities.map((cap, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-zinc-900/50 rounded p-2">
                              <span className="font-mono text-blue-300">{cap.name}/{cap.version}</span>
                              <span className="text-zinc-500">
                                {cap.messages} msgs
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remote Capabilities */}
                      <div className="bg-zinc-950/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-purple-400 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Remote Capabilities
                        </h3>
                        <div className="space-y-2">
                          {handshakeState.remoteCapabilities.length > 0 ? (
                            handshakeState.remoteCapabilities.map((cap, i) => (
                              <motion.div 
                                key={i} 
                                className="flex items-center justify-between text-xs bg-zinc-900/50 rounded p-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <span className="font-mono text-purple-300">{cap.name}/{cap.version}</span>
                                <span className="text-zinc-500">
                                  {cap.messages} msgs
                                </span>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-xs text-zinc-600 text-center py-4">
                              Waiting for remote...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Agreed Capabilities */}
                      <div className="bg-zinc-950/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-green-400 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Agreed Capabilities
                        </h3>
                        <div className="space-y-2">
                          {handshakeState.agreedCapabilities.length > 0 ? (
                            handshakeState.agreedCapabilities.map((cap, i) => (
                              <motion.div 
                                key={i} 
                                className="flex items-center justify-between text-xs bg-green-900/20 rounded p-2 border border-green-500/30"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <span className="font-mono text-green-300">
                                  ✓ {cap.name}/{cap.version}
                                </span>
                                <span className="text-green-400">
                                  Active
                                </span>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-xs text-zinc-600 text-center py-4">
                              Negotiating...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Simulate Button */}
                    <button
                      onClick={simulateHandshake}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#627eea] to-[#a16ae8] rounded-lg font-medium hover:shadow-lg hover:shadow-[#627eea]/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Simulate Full Handshake
                    </button>
                  </div>
                </div>
              )}

              {/* Reputation View */}
              {viewMode === "reputation" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Peer Reputation System
                    <span className="text-xs text-zinc-500 ml-auto">
                      Behavior-based peer scoring
                    </span>
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Reputation Weights */}
                    <div className="bg-zinc-950/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-3">Reputation Weights</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        {Object.entries(REPUTATION_WEIGHTS).slice(0, 9).map(([key, value]) => (
                          <div key={key} className="bg-zinc-900/50 rounded p-2">
                            <div className="text-zinc-400 mb-1">
                              {key.replace(/_/g, ' ').toLowerCase()}
                            </div>
                            <div className={cn(
                              "font-mono font-bold text-lg",
                              value > 0 ? "text-green-400" : value === 0 ? "text-zinc-500" : "text-red-400"
                            )}>
                              {value > 0 ? '+' : ''}{value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Peer Reputation List */}
                    <div className="bg-zinc-950/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-3">Top Peers by Reputation</h3>
                      <div className="space-y-2">
                        {nodes
                          .filter(n => n.id !== "self")
                          .sort((a, b) => b.reputation - a.reputation)
                          .slice(0, 10)
                          .map((node, i) => (
                            <motion.div 
                              key={node.id} 
                              className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg hover:bg-zinc-900/70 transition-colors cursor-pointer"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => setSelectedNode(node)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-xs font-bold text-zinc-500 w-6">#{i + 1}</div>
                                <div className={cn(
                                  "w-3 h-3 rounded-full",
                                  node.reputation >= 100 ? "bg-green-500" : 
                                  node.reputation >= 50 ? "bg-yellow-500" :
                                  node.reputation >= 0 ? "bg-orange-500" : "bg-red-500"
                                )} />
                                <div>
                                  <div className="text-xs font-mono">{node.peerId.slice(0, 16)}</div>
                                  <div className="text-xs text-zinc-500">{node.type} • {node.connectionState}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="h-full transition-all"
                                    initial={{ width: 0 }}
                                    animate={{ 
                                      width: `${Math.max(0, Math.min(100, ((node.reputation + 100) / 250) * 100))}%`
                                    }}
                                    style={{
                                      backgroundColor: getReputationColor(node.reputation)
                                    }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                  />
                                </div>
                                <span className="text-sm font-mono font-bold w-12 text-right">{node.reputation}</span>
                                {node.reputation <= REPUTATION_WEIGHTS.BANNED_THRESHOLD && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      banPeer(node.peerId)
                                    }}
                                    className="p-1.5 rounded hover:bg-red-500/20 transition-colors"
                                  >
                                    <Ban className="w-4 h-4 text-red-400" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>

                    {/* Recent Reputation Changes */}
                    {reputationHistory.length > 0 && (
                      <div className="bg-zinc-950/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3">Recent Changes</h3>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {reputationHistory.slice(-10).reverse().map((change, i) => (
                            <motion.div 
                              key={i} 
                              className="flex items-center justify-between text-xs p-2 bg-zinc-900/30 rounded"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-zinc-500" />
                                <span className="text-zinc-400">
                                  {new Date(change.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="text-zinc-500">•</span>
                                <span className="font-mono text-zinc-400">
                                  {change.peerId.slice(0, 10)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-500">{change.reason}</span>
                                <span className={cn(
                                  "font-mono font-bold",
                                  change.change > 0 ? "text-green-400" : "text-red-400"
                                )}>
                                  {change.change > 0 ? '+' : ''}{change.change}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Educational Content View */}
              {viewMode === "education" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    Learn About P2P Networking
                  </h2>
                  
                  {/* Section Tabs */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {Object.keys(educationalSections).map((section) => {
                      const Icon = educationalSections[section as keyof typeof educationalSections].icon
                      return (
                        <button
                          key={section}
                          onClick={() => setActiveEducationSection(section as keyof typeof educationalSections)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeEducationSection === section
                              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50"
                              : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {educationalSections[section as keyof typeof educationalSections].title}
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Content Display */}
                  <motion.div
                    key={activeEducationSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-950/50 rounded-xl p-6"
                  >
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
                        {educationalSections[activeEducationSection].content}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Side Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Discovery Controls */}
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Radar className="w-5 h-5 text-amber-500" />
                Node Discovery
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={isDiscovering ? stopDiscovery : startDiscovery}
                  disabled={discoveryPhase !== "idle" && !isDiscovering}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                    isDiscovering
                      ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/50"
                      : "bg-gradient-to-r from-[#627eea] to-[#a16ae8] hover:shadow-lg hover:shadow-[#627eea]/25"
                  )}
                >
                  {isDiscovering ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Stop Discovery
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Discovery
                    </>
                  )}
                </button>

                {/* Discovery Steps Log */}
                {discoverySteps.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto bg-zinc-950/50 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-2">Discovery Log:</div>
                    {discoverySteps.map((step) => {
                      const Icon = step.icon
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-2 text-xs"
                        >
                          <Icon className={cn("w-3 h-3 mt-0.5", step.color)} />
                          <div className="flex-1">
                            <div className={cn("font-medium", step.color)}>
                              {step.action}
                            </div>
                            <div className="text-zinc-500">{step.detail}</div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* Discovery Phases */}
                <div className="space-y-2">
                  {["bootstrap", "lookup", "refresh", "maintain"].map((phase) => (
                    <div key={phase} className="flex items-center gap-2">
                      <motion.div 
                        className={cn(
                          "w-2 h-2 rounded-full",
                          discoveryPhase === phase ? "bg-amber-500" : "bg-zinc-700"
                        )}
                        animate={discoveryPhase === phase ? {
                          scale: [1, 1.5, 1],
                          opacity: [1, 0.5, 1]
                        } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className={cn(
                        "text-sm capitalize",
                        discoveryPhase === phase ? "text-amber-400 font-medium" : "text-zinc-500"
                      )}>
                        {phase}
                      </span>
                      {discoveryPhase === phase && isDiscovering && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="ml-auto"
                        >
                          <Radio className="w-3 h-3 text-amber-400" />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={simulateNewNodeDiscovery}
                  className="w-full px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Discover New Node
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Protocol Messages
                </h3>
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  className="p-1 rounded hover:bg-zinc-800 transition-colors"
                >
                  {showMessages ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-xs p-2 bg-zinc-950/50 rounded"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        msg.protocol === "discovery" ? "bg-amber-500" :
                        msg.protocol === "rlpx" ? "bg-purple-500" :
                        msg.type === "tx" ? "bg-blue-500" :
                        msg.type === "block" ? "bg-green-500" :
                        "bg-zinc-500"
                      )} />
                      <span className="font-mono text-zinc-500">
                        {msg.from === "self" ? "→" : "←"}
                      </span>
                      <span className={cn(
                        "font-semibold uppercase",
                        msg.protocol === "discovery" ? "text-amber-400" :
                        msg.protocol === "rlpx" ? "text-purple-400" :
                        "text-zinc-300"
                      )}>
                        {msg.type}
                      </span>
                      <span className="text-zinc-500">
                        {msg.from === "self" ? `to ${msg.to}` : `from ${msg.from}`}
                      </span>
                      {msg.size && (
                        <span className="text-zinc-600 ml-auto">
                          {msg.size}B
                        </span>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-xs text-zinc-600 text-center py-4">
                    No messages yet. Start discovery to see protocol messages.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Node Details */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-4"
                >
                  <h3 className="text-lg font-semibold mb-3">Node Details</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Peer ID</span>
                      <span className="font-mono text-xs">{selectedNode.peerId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Address</span>
                      <span className="font-mono text-xs">{selectedNode.address}:{selectedNode.port}</span>
                    </div>
                    {selectedNode.enr && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">ENR</span>
                        <span className="font-mono text-xs">{selectedNode.enr.slice(0, 16)}...</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Type</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        selectedNode.type === "trusted" ? "bg-green-500/20 text-green-400" :
                        selectedNode.type === "banned" ? "bg-red-500/20 text-red-400" :
                        selectedNode.type === "basic" ? "bg-blue-500/20 text-blue-400" :
                        "bg-zinc-700 text-zinc-400"
                      )}>
                        {selectedNode.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Connection</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        selectedNode.connectionState === "established" ? "bg-green-500/20 text-green-400" :
                        selectedNode.connectionState === "connected" ? "bg-blue-500/20 text-blue-400" :
                        selectedNode.connectionState === "handshaking" ? "bg-purple-500/20 text-purple-400" :
                        selectedNode.connectionState === "connecting" ? "bg-amber-500/20 text-amber-400" :
                        "bg-zinc-700 text-zinc-400"
                      )}>
                        {selectedNode.connectionState}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Direction</span>
                      <div className="flex items-center gap-1">
                        {selectedNode.inbound ? (
                          <>
                            <ArrowDown className="w-3 h-3 text-blue-400" />
                            <span className="text-xs">Inbound</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp className="w-3 h-3 text-purple-400" />
                            <span className="text-xs">Outbound</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Reputation</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all"
                            style={{
                              width: `${Math.max(0, Math.min(100, ((selectedNode.reputation + 100) / 250) * 100))}%`,
                              backgroundColor: getReputationColor(selectedNode.reputation)
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono">{selectedNode.reputation}</span>
                      </div>
                    </div>
                    {selectedNode.rtt && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">RTT</span>
                        <span className="text-xs">{selectedNode.rtt}ms</span>
                      </div>
                    )}
                    {selectedNode.bucketIndex !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">K-Bucket</span>
                        <span className="text-xs">#{selectedNode.bucketIndex}</span>
                      </div>
                    )}
                    {selectedNode.distance !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">XOR Distance</span>
                        <span className="text-xs font-mono">{selectedNode.distance}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-zinc-800">
                      <div className="text-zinc-400 mb-1">Capabilities</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.capabilities.map((cap) => (
                          <span key={cap} className="px-2 py-0.5 bg-zinc-800 rounded text-xs font-mono">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedNode.id !== "self" && (
                    <div className="mt-4 flex gap-2">
                      {selectedNode.connectionState === "disconnected" && (
                        <button
                          onClick={() => {
                            setNodes(prev => prev.map(n => 
                              n.id === selectedNode.id 
                                ? { ...n, connectionState: "connecting" }
                                : n
                            ))
                            setTimeout(() => {
                              setNodes(prev => prev.map(n => 
                                n.id === selectedNode.id 
                                  ? { ...n, connectionState: "handshaking" }
                                  : n
                              ))
                            }, 500)
                            setTimeout(() => {
                              setNodes(prev => prev.map(n => 
                                n.id === selectedNode.id 
                                  ? { ...n, connectionState: "connected" }
                                  : n
                              ))
                            }, 1000)
                          }}
                          className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm transition-colors"
                        >
                          <Wifi className="w-3 h-3 inline mr-1" />
                          Connect
                        </button>
                      )}
                      {selectedNode.connectionState !== "disconnected" && (
                        <button
                          onClick={() => {
                            setNodes(prev => prev.map(n => 
                              n.id === selectedNode.id 
                                ? { ...n, connectionState: "disconnected" }
                                : n
                            ))
                          }}
                          className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-colors"
                        >
                          <WifiOff className="w-3 h-3 inline mr-1" />
                          Disconnect
                        </button>
                      )}
                      {selectedNode.type !== "banned" && (
                        <button
                          onClick={() => banPeer(selectedNode.peerId)}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-colors"
                        >
                          <Ban className="w-3 h-3 inline mr-1" />
                          Ban
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}