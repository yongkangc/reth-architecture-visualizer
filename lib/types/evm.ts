import type { LucideIcon } from 'lucide-react'

// EVM execution types
export type ExecutionState = "idle" | "executing" | "completed" | "error"

export type OpcodeCategory = 
  | "arithmetic" 
  | "comparison" 
  | "bitwise" 
  | "crypto" 
  | "memory" 
  | "storage" 
  | "flow" 
  | "stack" 
  | "environment" 
  | "system"

export type GasStatus = "sufficient" | "warning" | "insufficient" | "error"

export interface Opcode {
  name: string
  code: number
  category: OpcodeCategory
  description: string
  gasBase: number
  gasDynamic?: (args: unknown[]) => number
  inputs: number
  outputs: number
  examples: string[]
  color: string
  icon?: LucideIcon
}

export interface StackItem {
  id: string
  value: string
  type: "uint256" | "address" | "bytes32" | "bool" | "bytes"
  position: number
  highlighted?: boolean
  operation?: string
}

export interface MemorySegment {
  offset: string
  size: number
  data: string
  highlighted?: boolean
  operation?: string
  type?: "code" | "data" | "return"
}

export interface StorageSlot {
  key: string
  value: string
  originalValue?: string
  changed?: boolean
  highlighted?: boolean
  operation?: string
}

export interface ExecutionStep {
  id: string
  stepNumber: number
  opcode: Opcode
  gasUsed: number
  gasRemaining: number
  stack: StackItem[]
  memory: MemorySegment[]
  storage: StorageSlot[]
  pc: number
  error?: string
  returnData?: string
  logs?: LogEntry[]
  timestamp: number
}

export interface LogEntry {
  address: string
  topics: string[]
  data: string
  blockNumber?: number
  transactionHash?: string
  logIndex?: number
}

export interface Account {
  address: string
  balance: string
  nonce: number
  codeHash?: string
  storageRoot?: string
  code?: string
  isContract: boolean
}

export interface Transaction {
  hash: string
  from: string
  to?: string
  value: string
  gasLimit: number
  gasPrice: string
  data: string
  nonce: number
  v?: string
  r?: string
  s?: string
  type?: number
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
}

export interface ExecutionContext {
  transaction: Transaction
  block: {
    number: number
    timestamp: number
    difficulty: string
    gasLimit: number
    coinbase: string
    baseFee?: string
  }
  chainId: number
  accounts: Record<string, Account>
  precompiles: string[]
}

export interface ExecutionResult {
  success: boolean
  gasUsed: number
  returnData?: string
  error?: string
  logs: LogEntry[]
  createdAddress?: string
  stateChanges: {
    accounts: Record<string, Partial<Account>>
    storage: Record<string, Record<string, string>>
  }
  trace: ExecutionStep[]
}

export interface PrecompileCall {
  address: string
  name: string
  input: string
  output: string
  gasUsed: number
  success: boolean
  description: string
}

export interface EVMMetrics {
  gasUsed: number
  gasLimit: number
  gasRemaining: number
  gasEfficiency: number
  executionTime: number
  opcodeCount: number
  memoryExpansions: number
  storageReads: number
  storageWrites: number
  logCount: number
  callDepth: number
}

export interface DebugFrame {
  type: "CALL" | "STATICCALL" | "DELEGATECALL" | "CALLCODE" | "CREATE" | "CREATE2"
  from: string
  to?: string
  input: string
  output?: string
  gasUsed: number
  gasRemaining: number
  value?: string
  error?: string
  revert?: boolean
  calls?: DebugFrame[]
}

export interface VMState {
  pc: number
  stack: StackItem[]
  memory: MemorySegment[]
  storage: StorageSlot[]
  gasUsed: number
  gasRemaining: number
  depth: number
  returnData?: string
  lastOpcode?: Opcode
  error?: string
}

export interface SimulationConfig {
  stepDelay: number
  autoStep: boolean
  showGasUsage: boolean
  showMemoryExpansion: boolean
  showStorageChanges: boolean
  showStackOperations: boolean
  highlightChanges: boolean
  maxSteps: number
}

// Contract deployment types
export interface ContractDeployment {
  bytecode: string
  constructorArgs?: string[]
  value?: string
  gasLimit: number
  expectedAddress?: string
  salt?: string // For CREATE2
}

// Error types
export interface EVMError {
  type: "OutOfGas" | "StackUnderflow" | "StackOverflow" | "InvalidOpcode" | "InvalidJump" | "Revert" | "InvalidMemoryAccess" | "InvalidStorageAccess"
  message: string
  step: number
  gasUsed: number
  stack?: StackItem[]
  memory?: MemorySegment[]
}

// Visualization types
export interface ExecutionVisualization {
  currentStep: number
  totalSteps: number
  isPlaying: boolean
  speed: number
  focusMode: "stack" | "memory" | "storage" | "overview"
  highlightChanges: boolean
}

export interface GasProfileEntry {
  opcode: string
  count: number
  totalGas: number
  averageGas: number
  percentage: number
}

// Additional types for EVM constants
export type TraitLayer = "ConfigureEvm" | "BlockExecutorFactory" | "EvmFactory" | "Evm"

export interface TraitInterface {
  id: string
  name: string
  layer: TraitLayer
  methods: string[]
  description: string
  icon: LucideIcon
  color: string
  dependencies: string[]
  githubLink?: string
}

export interface ExecutionStage {
  id: string
  name: string
  phase: ExecutionPhase
  description: string
  icon: LucideIcon
  systemCalls?: string[]
  gasEstimate?: number
  timing?: string
}

export interface TimingConsideration {
  id: string
  name: string
  description: string
  impact: "critical" | "high" | "medium"
  latency: string
  icon: LucideIcon
}