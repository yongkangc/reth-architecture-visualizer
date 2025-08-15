"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Network, Shield, Users, Activity, Zap, Globe, 
  ArrowRight, ArrowLeft, ArrowUpDown, Info, Play, Pause,
  HardDrive, Cloud, Terminal, Blocks, ChevronRight,
  Eye, EyeOff, HelpCircle, BookOpen, Route,
  CheckCircle, Circle, AlertCircle, XCircle,
  FileCode, Package, Settings, Sparkles,
  Wifi, WifiOff, Search, UserPlus, UserMinus,
  MessageSquare, Lock, Unlock, Hash, Timer,
  TrendingUp, TrendingDown, Award, Ban,
  Gauge, Server, Radio, Radar, Link2,
  AlertTriangle, CheckCircle2, Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
type PeerId = string
type NodeId = string
type ConnectionState = "disconnected" | "connecting" | "connected" | "handshaking" | "established"
type PeerType = "trusted" | "basic" | "discovered" | "banned"
type MessageType = "ping" | "pong" | "findnode" | "neighbors" | "enr_request" | "enr_response" | "status" | "tx" | "block"
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
}

interface KBucket {
  index: number
  distance: string
  nodes: NetworkNode[]
  maxSize: number
}

interface NetworkMessage {
  id: string
  from: NodeId
  to: NodeId
  type: MessageType
  data?: any
  timestamp: number
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
  step: "hello" | "status" | "established"
  localCapabilities: ProtocolCapability[]
  remoteCapabilities: ProtocolCapability[]
  agreedCapabilities: ProtocolCapability[]
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
    inbound: false
  })

  // Trusted nodes
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
      inbound: false
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
      inbound: i % 2 === 0
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
      inbound: i % 3 === 0
    })
  }

  return nodes
}

// Generate K-buckets
const generateKBuckets = (nodes: NetworkNode[]): KBucket[] => {
  const buckets: KBucket[] = []
  
  // Create simplified buckets (showing first 8 for visualization)
  for (let i = 0; i < 8; i++) {
    const bucketNodes = nodes.filter(n => 
      n.bucketIndex !== undefined && 
      Math.floor(n.bucketIndex / 32) === i
    )
    
    buckets.push({
      index: i,
      distance: `2^${255 - i}`,
      nodes: bucketNodes.slice(0, BUCKET_SIZE),
      maxSize: BUCKET_SIZE
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
  const [viewMode, setViewMode] = useState<"topology" | "kbuckets" | "handshake" | "reputation">("topology")
  const [showMessages, setShowMessages] = useState(true)
  const [reputationHistory, setReputationHistory] = useState<ReputationChange[]>([])
  const [handshakeState, setHandshakeState] = useState<HandshakeState>({
    step: "hello",
    localCapabilities: [
      { name: "eth", version: 69, messages: 17, offset: 16 },
      { name: "eth", version: 68, messages: 17, offset: 33 },
      { name: "snap", version: 1, messages: 8, offset: 50 }
    ],
    remoteCapabilities: [],
    agreedCapabilities: []
  })
  const [connectedPeers, setConnectedPeers] = useState(0)
  const [inboundPeers, setInboundPeers] = useState(0)
  const [outboundPeers, setOutboundPeers] = useState(0)
  const discoveryIntervalRef = useRef<NodeJS.Timeout>()

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

  // Start discovery simulation
  const startDiscovery = () => {
    setIsDiscovering(true)
    setDiscoveryPhase("bootstrap")
    
    let phase = 0
    const phases: DiscoveryPhase[] = ["bootstrap", "lookup", "refresh", "maintain"]
    
    const runPhase = () => {
      if (phase >= phases.length) {
        setIsDiscovering(false)
        setDiscoveryPhase("idle")
        return
      }
      
      const currentPhase = phases[phase]
      setDiscoveryPhase(currentPhase)
      
      // Simulate discovery messages
      if (currentPhase === "bootstrap") {
        // Send initial pings to bootstrap nodes
        const bootstrapNodes = nodes.filter(n => n.type === "trusted")
        bootstrapNodes.forEach((node, i) => {
          setTimeout(() => {
            addMessage("self", node.id, "ping")
            setTimeout(() => addMessage(node.id, "self", "pong"), 200)
          }, i * 300)
        })
      } else if (currentPhase === "lookup") {
        // Send FINDNODE messages
        const connectedNodes = nodes.filter(n => n.connectionState === "established")
        connectedNodes.slice(0, 3).forEach((node, i) => {
          setTimeout(() => {
            addMessage("self", node.id, "findnode")
            setTimeout(() => addMessage(node.id, "self", "neighbors"), 400)
          }, i * 500)
        })
      } else if (currentPhase === "refresh") {
        // Refresh buckets
        simulateNewNodeDiscovery()
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
  }

  // Add a message to the message list
  const addMessage = (from: NodeId, to: NodeId, type: MessageType) => {
    const message: NetworkMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      from,
      to,
      type,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev.slice(-9), message])
  }

  // Simulate new node discovery
  const simulateNewNodeDiscovery = () => {
    const newNode: NetworkNode = {
      id: `discovered-new-${Date.now()}`,
      peerId: `0xdddd...${Math.random().toString(16).slice(2, 6)}`,
      address: `172.16.0.${Math.floor(Math.random() * 255)}`,
      port: 30303,
      type: "discovered",
      reputation: BASE_REPUTATION,
      connectionState: "disconnected",
      capabilities: ["eth/68"],
      lastSeen: Date.now(),
      bucketIndex: Math.floor(Math.random() * 256),
      distance: Math.floor(Math.random() * 100),
      inbound: false
    }
    
    setNodes(prev => [...prev, newNode])
    
    // Simulate connection attempt
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
          ? { ...n, connectionState: "connected" }
          : n
      ))
    }, 1500)
  }

  // Simulate handshake process
  const simulateHandshake = () => {
    // Step 1: Hello
    setHandshakeState(prev => ({
      ...prev,
      step: "hello",
      remoteCapabilities: [],
      agreedCapabilities: []
    }))
    
    // Step 2: Receive remote capabilities
    setTimeout(() => {
      setHandshakeState(prev => ({
        ...prev,
        remoteCapabilities: [
          { name: "eth", version: 69, messages: 17, offset: 16 },
          { name: "eth", version: 68, messages: 17, offset: 33 }
        ]
      }))
    }, 1000)
    
    // Step 3: Status exchange
    setTimeout(() => {
      setHandshakeState(prev => ({
        ...prev,
        step: "status"
      }))
    }, 2000)
    
    // Step 4: Established
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
    
    updateReputation(peerId, REPUTATION_WEIGHTS.BAD_BLOCK, "Banned for bad behavior")
  }

  // Get node position for topology view
  const getNodePosition = (node: NetworkNode, index: number, total: number) => {
    if (node.id === "self") {
      return { x: 50, y: 50 }
    }
    
    const angle = (index / total) * 2 * Math.PI
    const radius = node.type === "trusted" ? 20 : node.type === "basic" ? 30 : 40
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
                DevP2P protocol, node discovery, and peer management
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
          </div>

          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Inbound</span>
              <ArrowDown className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">{inboundPeers}/{MAX_INBOUND}</div>
            <div className="text-xs text-zinc-500 mt-1">Incoming connections</div>
          </div>

          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Outbound</span>
              <ArrowUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-500">{outboundPeers}/{MAX_OUTBOUND}</div>
            <div className="text-xs text-zinc-500 mt-1">Outgoing connections</div>
          </div>

          <div className="bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Discovery</span>
              <Radar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-amber-500">{discoveryPhase}</div>
            <div className="text-xs text-zinc-500 mt-1">Current phase</div>
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
          </div>
        </motion.div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("topology")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              viewMode === "topology"
                ? "bg-[#627eea] text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            <Network className="w-4 h-4 inline mr-2" />
            Network Topology
          </button>
          <button
            onClick={() => setViewMode("kbuckets")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              viewMode === "kbuckets"
                ? "bg-[#627eea] text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            K-Buckets
          </button>
          <button
            onClick={() => setViewMode("handshake")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              viewMode === "handshake"
                ? "bg-[#627eea] text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            RLPx Handshake
          </button>
          <button
            onClick={() => setViewMode("reputation")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              viewMode === "reputation"
                ? "bg-[#627eea] text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Reputation
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
                  </h2>
                  
                  <div className="relative h-[600px] bg-zinc-950/50 rounded-xl overflow-hidden">
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
                                ? "bg-gradient-to-br from-[#627eea] to-[#a16ae8] border-white"
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
                              <div className="bg-zinc-800 rounded-lg p-2 text-xs whitespace-nowrap">
                                <div className="font-semibold">{node.peerId}</div>
                                <div className="text-zinc-400">{node.address}:{node.port}</div>
                                <div className="text-zinc-400">Type: {node.type}</div>
                                <div className="text-zinc-400">State: {node.connectionState}</div>
                                <div className="text-zinc-400">Rep: {node.reputation}</div>
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
                      <span className="text-zinc-400">Trusted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-zinc-400">Basic</span>
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
                  </h2>
                  
                  <div className="space-y-3">
                    {kBuckets.map((bucket) => (
                      <div key={bucket.index} className="bg-zinc-950/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Bucket {bucket.index}</span>
                            <span className="text-xs text-zinc-500">Distance: {bucket.distance}</span>
                          </div>
                          <div className="text-xs text-zinc-400">
                            {bucket.nodes.length}/{bucket.maxSize} nodes
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          {Array.from({ length: bucket.maxSize }).map((_, i) => {
                            const node = bucket.nodes[i]
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "flex-1 h-8 rounded border flex items-center justify-center",
                                  node
                                    ? node.connectionState === "established"
                                      ? "bg-green-500/20 border-green-500/50"
                                      : "bg-blue-500/20 border-blue-500/50"
                                    : "bg-zinc-800/50 border-zinc-700"
                                )}
                                title={node ? `${node.peerId} (${node.connectionState})` : "Empty slot"}
                              >
                                {node && (
                                  <div className="text-xs text-zinc-400">
                                    {node.peerId.slice(0, 6)}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      About K-Buckets
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Kademlia uses a routing table of k-buckets to organize peers by XOR distance. 
                      Each bucket holds up to {BUCKET_SIZE} nodes at a specific distance range. 
                      Closer nodes (lower bucket indices) are kept in smaller buckets for efficient routing.
                    </p>
                  </div>
                </div>
              )}

              {/* RLPx Handshake View */}
              {viewMode === "handshake" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-500" />
                    RLPx Handshake Process
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Handshake Steps */}
                    <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg">
                      <div className={cn(
                        "flex items-center gap-3",
                        handshakeState.step === "hello" && "text-[#627eea]"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          handshakeState.step === "hello" 
                            ? "bg-[#627eea]" 
                            : "bg-zinc-700"
                        )}>
                          1
                        </div>
                        <div>
                          <div className="font-medium">Hello</div>
                          <div className="text-xs text-zinc-500">Exchange protocol version & capabilities</div>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-zinc-600" />
                      
                      <div className={cn(
                        "flex items-center gap-3",
                        handshakeState.step === "status" && "text-[#627eea]"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          handshakeState.step === "status" 
                            ? "bg-[#627eea]" 
                            : handshakeState.step === "established"
                            ? "bg-green-500"
                            : "bg-zinc-700"
                        )}>
                          2
                        </div>
                        <div>
                          <div className="font-medium">Status</div>
                          <div className="text-xs text-zinc-500">Exchange blockchain status</div>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-zinc-600" />
                      
                      <div className={cn(
                        "flex items-center gap-3",
                        handshakeState.step === "established" && "text-green-500"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          handshakeState.step === "established" 
                            ? "bg-green-500" 
                            : "bg-zinc-700"
                        )}>
                          3
                        </div>
                        <div>
                          <div className="font-medium">Established</div>
                          <div className="text-xs text-zinc-500">Connection ready</div>
                        </div>
                      </div>
                    </div>

                    {/* Capabilities Exchange */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Local Capabilities */}
                      <div className="bg-zinc-950/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-blue-400">Local Capabilities</h3>
                        <div className="space-y-2">
                          {handshakeState.localCapabilities.map((cap, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="font-mono">{cap.name}/{cap.version}</span>
                              <span className="text-zinc-500">
                                {cap.messages} msgs @ {cap.offset}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remote Capabilities */}
                      <div className="bg-zinc-950/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-purple-400">Remote Capabilities</h3>
                        <div className="space-y-2">
                          {handshakeState.remoteCapabilities.length > 0 ? (
                            handshakeState.remoteCapabilities.map((cap, i) => (
                              <motion.div 
                                key={i} 
                                className="flex items-center justify-between text-xs"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <span className="font-mono">{cap.name}/{cap.version}</span>
                                <span className="text-zinc-500">
                                  {cap.messages} msgs @ {cap.offset}
                                </span>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-xs text-zinc-600">Waiting for remote...</div>
                          )}
                        </div>
                      </div>

                      {/* Agreed Capabilities */}
                      <div className="bg-zinc-950/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3 text-green-400">Agreed Capabilities</h3>
                        <div className="space-y-2">
                          {handshakeState.agreedCapabilities.length > 0 ? (
                            handshakeState.agreedCapabilities.map((cap, i) => (
                              <motion.div 
                                key={i} 
                                className="flex items-center justify-between text-xs"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <span className="font-mono text-green-400">
                                  ✓ {cap.name}/{cap.version}
                                </span>
                                <span className="text-zinc-500">
                                  {cap.messages} msgs @ {cap.offset}
                                </span>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-xs text-zinc-600">Negotiating...</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Simulate Button */}
                    <button
                      onClick={simulateHandshake}
                      className="w-full px-4 py-2 bg-gradient-to-r from-[#627eea] to-[#a16ae8] rounded-lg font-medium hover:shadow-lg hover:shadow-[#627eea]/25 transition-all"
                    >
                      Simulate Handshake
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
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Reputation Weights */}
                    <div className="bg-zinc-950/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-3">Reputation Weights</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(REPUTATION_WEIGHTS).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-zinc-400">{key.replace(/_/g, ' ').toLowerCase()}</span>
                            <span className={cn(
                              "font-mono font-semibold",
                              value > 0 ? "text-green-400" : "text-red-400"
                            )}>
                              {value > 0 ? '+' : ''}{value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Peer Reputation List */}
                    <div className="bg-zinc-950/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold mb-3">Peer Reputations</h3>
                      <div className="space-y-2">
                        {nodes
                          .filter(n => n.id !== "self")
                          .sort((a, b) => b.reputation - a.reputation)
                          .slice(0, 10)
                          .map((node) => (
                            <div key={node.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  node.reputation >= 100 ? "bg-green-500" : 
                                  node.reputation >= 50 ? "bg-yellow-500" :
                                  node.reputation >= 0 ? "bg-orange-500" : "bg-red-500"
                                )} />
                                <span className="text-xs font-mono">{node.peerId.slice(0, 16)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full transition-all"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, ((node.reputation + 100) / 250) * 100))}%`,
                                      backgroundColor: getReputationColor(node.reputation)
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-mono w-12 text-right">{node.reputation}</span>
                                {node.reputation <= -50 && (
                                  <button
                                    onClick={() => banPeer(node.peerId)}
                                    className="p-1 rounded hover:bg-red-500/20 transition-colors"
                                  >
                                    <Ban className="w-3 h-3 text-red-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Recent Reputation Changes */}
                    {reputationHistory.length > 0 && (
                      <div className="bg-zinc-950/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-3">Recent Changes</h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {reputationHistory.slice(-5).reverse().map((change, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">
                                {change.peerId.slice(0, 10)} - {change.reason}
                              </span>
                              <span className={cn(
                                "font-mono font-semibold",
                                change.change > 0 ? "text-green-400" : "text-red-400"
                              )}>
                                {change.change > 0 ? '+' : ''}{change.change}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                    "w-full px-4 py-2 rounded-lg font-medium transition-all",
                    isDiscovering
                      ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/50"
                      : "bg-gradient-to-r from-[#627eea] to-[#a16ae8] hover:shadow-lg hover:shadow-[#627eea]/25"
                  )}
                >
                  {isDiscovering ? (
                    <>
                      <Pause className="w-4 h-4 inline mr-2" />
                      Stop Discovery
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 inline mr-2" />
                      Start Discovery
                    </>
                  )}
                </button>

                {/* Discovery Phases */}
                <div className="space-y-2">
                  {["bootstrap", "lookup", "refresh", "maintain"].map((phase) => (
                    <div key={phase} className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        discoveryPhase === phase ? "bg-amber-500" : "bg-zinc-700"
                      )} />
                      <span className={cn(
                        "text-sm capitalize",
                        discoveryPhase === phase ? "text-amber-400" : "text-zinc-500"
                      )}>
                        {phase}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={simulateNewNodeDiscovery}
                  className="w-full px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Discover New Node
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Messages
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
                        msg.type === "ping" || msg.type === "pong" ? "bg-green-500" :
                        msg.type === "findnode" || msg.type === "neighbors" ? "bg-blue-500" :
                        msg.type === "tx" ? "bg-purple-500" :
                        msg.type === "block" ? "bg-amber-500" :
                        "bg-zinc-500"
                      )} />
                      <span className="font-mono text-zinc-500">
                        {msg.from === "self" ? "→" : "←"}
                      </span>
                      <span className="font-semibold uppercase">{msg.type}</span>
                      <span className="text-zinc-500">
                        {msg.from === "self" ? `to ${msg.to}` : `from ${msg.from}`}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-xs text-zinc-600 text-center py-4">
                    No messages yet
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
                        selectedNode.connectionState === "connecting" ? "bg-amber-500/20 text-amber-400" :
                        "bg-zinc-700 text-zinc-400"
                      )}>
                        {selectedNode.connectionState}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Direction</span>
                      <span className="text-xs">
                        {selectedNode.inbound ? "Inbound" : "Outbound"}
                      </span>
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
                        <span className="text-xs">{selectedNode.bucketIndex}</span>
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
                          }}
                          className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm transition-colors"
                        >
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
                          Disconnect
                        </button>
                      )}
                      {selectedNode.type !== "banned" && (
                        <button
                          onClick={() => banPeer(selectedNode.peerId)}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-colors"
                        >
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