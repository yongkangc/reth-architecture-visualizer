// Shared types across all visualizations
import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

// Engine API types
export interface ValidationStep {
  id: string
  name: string
  description: string
  status: "pending" | "active" | "success" | "error"
  duration: number
}

export type PayloadStatus = "idle" | "validating" | "executing" | "computing" | "success" | "invalid"

// State Root types
export type Strategy = "sparse" | "parallel" | "sequential"
export type ScenarioType = "small-block" | "large-block" | "cache-hot" | "cache-cold"

export interface StrategyMetrics {
  strategy: Strategy
  executionTime: number
  dbReads: number
  cpuUsage: number
  cacheHitRate: number
  recommendation: string
}

export interface Scenario {
  id: ScenarioType
  name: string
  description: string
  blockSize: number
  cacheState: "hot" | "cold"
  expectedStrategy: Strategy
}

export interface StrategyInfo {
  name: string
  color: string
  icon: LucideIcon
  description: string
  pros: string[]
  cons: string[]
}

// Trie types
export interface TrieNode {
  id: string
  type: "branch" | "extension" | "leaf" | "hash"
  path: string
  value?: string
  children?: TrieNode[]
  isExpanded?: boolean
  isVisited?: boolean
  isSkipped?: boolean
}

export interface WalkerState {
  stack: string[]
  currentNode: string | null
  visitedNodes: Set<string>
  skippedNodes: Set<string>
  decision: string
  stats: WalkerStats
}

export interface WalkerStats {
  nodesVisited: number
  nodesSkipped: number
  dbReads: number
  cacheHits: number
}

// Common types
export interface SimulationControls {
  isPlaying: boolean
  speed: number
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeedChange: (speed: number) => void
}

export interface MetricCardData {
  label: string
  value: string | number
  unit?: string
  color?: string
  icon?: LucideIcon | ComponentType
}