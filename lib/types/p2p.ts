import type { LucideIcon } from 'lucide-react'

// P2P Network types
export type PeerId = string
export type NodeId = string

export type ConnectionState = "disconnected" | "connecting" | "connected" | "handshaking" | "established"

export type PeerType = "trusted" | "basic" | "discovered" | "banned"

export type MessageType = 
  | "ping" 
  | "pong" 
  | "findnode" 
  | "neighbors" 
  | "enr_request" 
  | "enr_response" 
  | "status" 
  | "tx" 
  | "block" 
  | "pooled_tx" 
  | "new_block_hashes"

export type DiscoveryPhase = "idle" | "bootstrap" | "lookup" | "refresh" | "maintain"

export interface NetworkNode {
  id: NodeId
  peerId: PeerId
  address: string
  port: number
  publicKey: string
  enr?: string
  clientId: string
  capabilities: ProtocolCapability[]
  reputation: number
  connectionState: ConnectionState
  peerType: PeerType
  distance?: number
  lastSeen: number
  isBootstrap?: boolean
  coordinates: { x: number; y: number }
  bucketIndex?: number
  isActive?: boolean
  messageStats?: {
    sent: number
    received: number
    failed: number
  }
}

export interface KBucket {
  id: number
  distance: number
  nodes: NetworkNode[]
  isFull: boolean
  capacity: number
  lastRefresh: number
}

export interface NetworkMessage {
  id: string
  type: MessageType
  from: NodeId
  to: NodeId
  timestamp: number
  size: number
  payload?: any
  response?: NetworkMessage
  status: "pending" | "sent" | "received" | "failed"
  latency?: number
}

export interface ReputationChange {
  nodeId: NodeId
  change: number
  reason: string
  timestamp: number
  category: "connection" | "protocol" | "discovery" | "misbehavior"
}

export interface ProtocolCapability {
  name: string
  version: number
  features?: string[]
}

export interface HandshakeState {
  nodeId: NodeId
  stage: "init" | "auth" | "ack" | "complete" | "failed"
  startTime: number
  duration?: number
  error?: string
}

export interface DiscoveryStep {
  id: string
  phase: DiscoveryPhase
  target?: NodeId
  action: string
  detail: string
  icon: LucideIcon
  color: string
  timestamp: number
}

export interface NetworkStats {
  totalPeers: number
  connectedPeers: number
  inboundPeers: number
  outboundPeers: number
  pendingConnections: number
  messagesSent: number
  messagesReceived: number
  bytesTransferred: number
  averageLatency: number
  discoveryRequests: number
  bucketStats: {
    filled: number
    total: number
    averageNodes: number
  }
}

export interface NetworkConfig {
  maxPeers: number
  maxOutbound: number
  maxInbound: number
  bucketSize: number
  bucketCount: number
  alpha: number // Kademlia concurrency parameter
  kValue: number // K-bucket size
  baseReputation: number
  maxReputation: number
  minReputation: number
}

export interface EducationalSection {
  title: string
  description: string
  concepts: string[]
  examples?: string[]
}

// Reputation system types
export interface ReputationWeight {
  connectionSuccess: number
  connectionFailure: number
  protocolViolation: number
  timeoutPenalty: number
  goodBehavior: number
}

// Discovery algorithm types
export interface KademliaParams {
  alpha: number
  k: number
  bucketRefreshInterval: number
  lookupTimeout: number
  maxConcurrentLookups: number
}