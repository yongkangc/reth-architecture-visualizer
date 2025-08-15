import type { LucideIcon } from 'lucide-react'

// Architecture component types
export type ComponentType = 
  | "consensus" 
  | "engine" 
  | "networking" 
  | "storage" 
  | "rpc" 
  | "sync" 
  | "evm" 
  | "trie" 
  | "mempool" 
  | "static-files"

export type ConnectionType = "data" | "control" | "api" | "bidirectional"

export type ViewMode = "beginner" | "intermediate" | "expert"

export type ScenarioType = "transaction" | "block-sync" | "rpc-query" | "reorg" | "new-block"

export interface SystemComponent {
  id: ComponentType
  name: string
  description: string
  icon: LucideIcon
  position: { x: number; y: number }
  color: string
  layer: "external" | "api" | "core" | "storage"
  details: string[]
  beginnerDescription?: string
  codeExample?: string
  metrics?: {
    throughput?: string
    latency?: string
    size?: string
  }
}

export interface Connection {
  id: string
  from: ComponentType
  to: ComponentType
  type: ConnectionType
  label: string
  description: string
  dataFormat?: string
  protocol?: string
  frequency?: string
}

export interface Scenario {
  id: ScenarioType
  name: string
  description: string
  icon: LucideIcon
  steps: {
    component: ComponentType
    action: string
    duration: number
    highlight?: ComponentType[]
  }[]
  color: string
}

// Improved architecture types (for the new refactored version)
export type ImprovedComponentType = 
  | "rpc" 
  | "p2p" 
  | "engine" 
  | "mempool" 
  | "validator" 
  | "executor" 
  | "state_root" 
  | "database" 
  | "sync" 
  | "consensus" 
  | "builder"

export type FlowType = "transaction" | "consensus" | "p2p" | "query" | "internal" | "storage"

export interface ImprovedSystemComponent {
  id: ImprovedComponentType
  label: string
  description: string
  icon: LucideIcon
  position: { x: number; y: number }
  color: string
  layer: "entry" | "processing" | "state" | "pipeline"
  codeLocation?: string
  isEntryPoint?: boolean
}

export interface ImprovedConnection {
  from: ImprovedComponentType
  to: ImprovedComponentType
  label: string
  flowType: FlowType
  animated?: boolean
}

export interface LayerInfo {
  label: string
  color: string
  description: string
}