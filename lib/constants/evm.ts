import { 
  Settings, Cpu, Activity, Factory, Hammer, 
  CircuitBoard, Box, Database, ShieldCheck, 
  TrendingUp, Timer, Gauge, Clock, GitBranch, Zap,
  Package, Code2, FileCode, AlertCircle,
  Plus, Minus, X, Divide, ArrowUp, ArrowDown,
  MemoryStick, HardDrive, PhoneCall, CornerDownRight,
  Hash, Layers, Component
} from 'lucide-react'
import type { 
  TraitInterface, ExecutionStage, TimingConsideration,
  Opcode, ExecutionPhase, TraitLayer, OpcodeCategory 
} from '@/lib/types/evm'

// EVM trait interfaces configuration
export const TRAIT_INTERFACES: TraitInterface[] = [
  {
    id: "configure-evm",
    name: "ConfigureEvm",
    layer: "ConfigureEvm",
    description: "Top-level trait for complete EVM configuration",
    icon: Settings,
    color: "from-purple-500 to-pink-500",
    dependencies: [],
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/evm/evm/src/lib.rs#L184-L410",
    methods: [
      "fn block_executor_factory() -> BlockExecutorFactory",
      "fn block_assembler() -> BlockAssembler",
      "fn evm_env(header) -> EvmEnv",
      "fn next_evm_env(parent, attributes) -> EvmEnv",
      "fn builder_for_next_block(...) -> BlockBuilder"
    ]
  },
  {
    id: "block-executor-factory",
    name: "BlockExecutorFactory",
    layer: "BlockExecutorFactory",
    description: "Factory for creating block executors",
    icon: Factory,
    color: "from-blue-500 to-cyan-500",
    dependencies: ["configure-evm"],
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/evm/evm/src/lib.rs#L57",
    methods: [
      "fn create_executor(evm, ctx) -> BlockExecutor",
      "fn evm_factory() -> EvmFactory",
      "type ExecutionCtx",
      "type Transaction",
      "type Receipt"
    ]
  },
  {
    id: "evm-factory",
    name: "EvmFactory",
    layer: "EvmFactory",
    description: "Factory for creating EVM instances",
    icon: Hammer,
    color: "from-green-500 to-emerald-500",
    dependencies: ["block-executor-factory"],
    githubLink: "https://github.com/paradigmxyz/reth/blob/main/crates/evm/evm/src/lib.rs#L57",
    methods: [
      "fn create_evm(db, env) -> Evm",
      "fn create_evm_with_inspector(db, env, inspector) -> Evm",
      "type Spec",
      "type Precompiles"
    ]
  },
  {
    id: "evm",
    name: "Evm (Revm)",
    layer: "Evm",
    description: "Core EVM execution engine",
    icon: Cpu,
    color: "from-orange-500 to-red-500",
    dependencies: ["evm-factory"],
    githubLink: "https://github.com/bluealloy/revm",
    methods: [
      "fn transact() -> ExecutionResult",
      "fn transact_with_commit() -> ExecutionResult",
      "fn apply_state_changeset()",
      "fn db() -> &mut State"
    ]
  }
]

// Block execution stages configuration
export const EXECUTION_STAGES: ExecutionStage[] = [
  {
    id: "pre-execution",
    name: "Pre-Execution Changes",
    phase: "pre-execution",
    description: "Apply system calls and prepare block environment",
    icon: CircuitBoard,
    systemCalls: [
      "apply_beacon_root_contract_call (EIP-4788)",
      "apply_blockhashes_contract_call (EIP-2935)",
      "apply_withdrawals"
    ],
    gasEstimate: 0,
    timing: "~5ms"
  },
  {
    id: "execute-txs",
    name: "Execute All Transactions",
    phase: "executing",
    description: "Process all transactions sequentially, updating state after each",
    icon: Activity,
    systemCalls: [
      "for tx in block.transactions:",
      "  evm.transact(tx) -> ExecutionResult",
      "  state.apply_changeset(result.state)",
      "  receipts.push(result.receipt)"
    ],
    gasEstimate: 15000000,
    timing: "~50-200ms"
  },
  {
    id: "post-execution",
    name: "Post-Execution Processing",
    phase: "post-execution",
    description: "Finalize block and process consensus layer requests",
    icon: Box,
    systemCalls: [
      "process_consolidation_requests",
      "process_deposit_requests",
      "calculate_request_hash"
    ],
    gasEstimate: 0,
    timing: "~3ms"
  },
  {
    id: "get-output",
    name: "Get Execution Output",
    phase: "validation",
    description: "Collect execution results: state root, receipts root, gas used",
    icon: Database,
    systemCalls: [
      "state_root = calculate_state_root()",
      "receipts_root = calculate_receipts_root()",
      "logs_bloom = aggregate_logs_bloom()",
      "gas_used = sum(receipt.gas_used)"
    ],
    gasEstimate: 0,
    timing: "~100-300ms"
  },
  {
    id: "validate-header",
    name: "Validate Against Block Header",
    phase: "validation",
    description: "Verify execution output matches the block header commitments",
    icon: ShieldCheck,
    systemCalls: [
      "assert(header.state_root == state_root)",
      "assert(header.receipts_root == receipts_root)",
      "assert(header.logs_bloom == logs_bloom)",
      "assert(header.gas_used == gas_used)"
    ],
    gasEstimate: 0,
    timing: "~1ms"
  }
]

// MEV and timing considerations
export const TIMING_CONSIDERATIONS: TimingConsideration[] = [
  {
    id: "mev-window",
    name: "4s MEV Building Window",
    description: "Builders compete in auctions, bundle transactions for maximum profit, and pay validators bribes to include their blocks",
    impact: "critical",
    latency: "0-4s",
    icon: TrendingUp
  },
  {
    id: "mev-deadline",
    name: "Builder Submission Deadline",
    description: "Builders submit final bid to relay. Delayed submission captures more MEV but risks missing slot",
    impact: "critical",
    latency: "4s deadline",
    icon: Timer
  },
  {
    id: "payload-validation",
    name: "Fast Payload Validation",
    description: "Execution layer must validate payload quickly so validator can attest at 8s mark",
    impact: "critical",
    latency: "4-8s window",
    icon: Gauge
  },
  {
    id: "attestation",
    name: "8s Attestation Deadline",
    description: "Validators must attest to block. Cannot attest until execution layer validates payload",
    impact: "critical",
    latency: "8s hard deadline",
    icon: Clock
  },
  {
    id: "state-root",
    name: "State Root Calculation",
    description: "Parallel trie computation is critical bottleneck - must be fast for validation",
    impact: "high",
    latency: "~100-300ms",
    icon: GitBranch
  },
  {
    id: "execution-speed",
    name: "Transaction Execution Speed",
    description: "Faster execution = more time for MEV extraction and building",
    impact: "high",
    latency: "~50-200ms",
    icon: Zap
  }
]

// Core EVM opcodes with gas costs and descriptions
export const EVM_OPCODES: Record<string, Opcode> = {
  // Arithmetic Operations (0x01 - 0x0b)
  ADD: {
    name: "ADD",
    code: 0x01,
    category: "arithmetic",
    description: "Addition operation: a + b",
    gasBase: 3,
    inputs: 2,
    outputs: 1,
    examples: ["5 + 3 = 8", "0x10 + 0x20 = 0x30"],
    color: "from-blue-500 to-cyan-500",
    icon: Plus
  },
  SUB: {
    name: "SUB",
    code: 0x03,
    category: "arithmetic",
    description: "Subtraction operation: a - b",
    gasBase: 3,
    inputs: 2,
    outputs: 1,
    examples: ["10 - 3 = 7", "0x20 - 0x10 = 0x10"],
    color: "from-blue-500 to-cyan-500",
    icon: Minus
  },
  MUL: {
    name: "MUL",
    code: 0x02,
    category: "arithmetic",
    description: "Multiplication operation: a * b",
    gasBase: 5,
    inputs: 2,
    outputs: 1,
    examples: ["5 * 3 = 15", "0x10 * 0x2 = 0x20"],
    color: "from-blue-500 to-cyan-500",
    icon: X
  },
  DIV: {
    name: "DIV",
    code: 0x04,
    category: "arithmetic",
    description: "Integer division operation: a / b",
    gasBase: 5,
    inputs: 2,
    outputs: 1,
    examples: ["10 / 3 = 3", "0x20 / 0x4 = 0x8"],
    color: "from-blue-500 to-cyan-500",
    icon: Divide
  },

  // Comparison Operations (0x10 - 0x13)
  LT: {
    name: "LT",
    code: 0x10,
    category: "comparison",
    description: "Less than comparison: a < b",
    gasBase: 3,
    inputs: 2,
    outputs: 1,
    examples: ["5 < 10 = 1 (true)", "10 < 5 = 0 (false)"],
    color: "from-green-500 to-emerald-500"
  },
  GT: {
    name: "GT", 
    code: 0x11,
    category: "comparison",
    description: "Greater than comparison: a > b",
    gasBase: 3,
    inputs: 2,
    outputs: 1,
    examples: ["10 > 5 = 1 (true)", "5 > 10 = 0 (false)"],
    color: "from-green-500 to-emerald-500"
  },
  EQ: {
    name: "EQ",
    code: 0x14,
    category: "comparison", 
    description: "Equality comparison: a == b",
    gasBase: 3,
    inputs: 2,
    outputs: 1,
    examples: ["5 == 5 = 1 (true)", "5 == 10 = 0 (false)"],
    color: "from-green-500 to-emerald-500"
  },

  // Memory Operations (0x51 - 0x53)
  MLOAD: {
    name: "MLOAD",
    code: 0x51,
    category: "memory",
    description: "Load 32 bytes from memory at offset",
    gasBase: 3,
    gasDynamic: (args) => Math.floor((args[0] + 31) / 32) * 3, // Memory expansion cost
    inputs: 1,
    outputs: 1,
    examples: ["MLOAD(0x40) - Load from free memory pointer"],
    color: "from-purple-500 to-pink-500",
    icon: MemoryStick
  },
  MSTORE: {
    name: "MSTORE",
    code: 0x52,
    category: "memory",
    description: "Store 32 bytes to memory at offset",
    gasBase: 3,
    gasDynamic: (args) => Math.floor((args[0] + 31) / 32) * 3,
    inputs: 2,
    outputs: 0,
    examples: ["MSTORE(0x40, value) - Store to free memory pointer"],
    color: "from-purple-500 to-pink-500",
    icon: MemoryStick
  },

  // Storage Operations (0x54 - 0x55)
  SLOAD: {
    name: "SLOAD",
    code: 0x54,
    category: "storage",
    description: "Load value from storage slot",
    gasBase: 2100, // Cold storage access
    inputs: 1,
    outputs: 1,
    examples: ["SLOAD(0) - Load from storage slot 0"],
    color: "from-orange-500 to-red-500",
    icon: HardDrive
  },
  SSTORE: {
    name: "SSTORE",
    code: 0x55,
    category: "storage",
    description: "Store value to storage slot",
    gasBase: 20000, // Setting storage slot costs
    gasDynamic: (args) => args[1] !== 0 ? 20000 : 5000, // Different costs for setting vs clearing
    inputs: 2,
    outputs: 0,
    examples: ["SSTORE(0, value) - Store to slot 0"],
    color: "from-orange-500 to-red-500",
    icon: HardDrive
  },

  // Stack Operations (0x50, 0x80-0x8f, 0x90-0x9f)
  POP: {
    name: "POP",
    code: 0x50,
    category: "stack",
    description: "Remove item from top of stack",
    gasBase: 2,
    inputs: 1,
    outputs: 0,
    examples: ["Remove top stack item"],
    color: "from-gray-500 to-gray-600",
    icon: ArrowDown
  },
  PUSH1: {
    name: "PUSH1",
    code: 0x60,
    category: "stack",
    description: "Push 1 byte onto stack",
    gasBase: 3,
    inputs: 0,
    outputs: 1,
    examples: ["PUSH1 0x42 - Push byte 0x42"],
    color: "from-yellow-500 to-orange-500",
    icon: ArrowUp
  },

  // Control Flow (0x56-0x5b)
  JUMP: {
    name: "JUMP",
    code: 0x56,
    category: "flow",
    description: "Jump to program counter position",
    gasBase: 8,
    inputs: 1,
    outputs: 0,
    examples: ["JUMP(0x100) - Jump to position 256"],
    color: "from-indigo-500 to-purple-500",
    icon: CornerDownRight
  },
  JUMPI: {
    name: "JUMPI",
    code: 0x57,
    category: "flow",
    description: "Conditional jump if condition is true",
    gasBase: 10,
    inputs: 2,
    outputs: 0,
    examples: ["JUMPI(dest, condition) - Jump if condition != 0"],
    color: "from-indigo-500 to-purple-500",
    icon: CornerDownRight
  },

  // System Operations (0xf0-0xff)
  CALL: {
    name: "CALL",
    code: 0xf1,
    category: "system",
    description: "Call another contract",
    gasBase: 700,
    gasDynamic: (args) => args[2] > 0 ? 9000 : 0, // Transfer value cost
    inputs: 7,
    outputs: 1,
    examples: ["CALL(gas, address, value, argsOffset, argsSize, retOffset, retSize)"],
    color: "from-red-500 to-pink-500",
    icon: PhoneCall
  },
  RETURN: {
    name: "RETURN",
    code: 0xf3,
    category: "system",
    description: "Return data and halt execution",
    gasBase: 0,
    inputs: 2,
    outputs: 0,
    examples: ["RETURN(offset, size) - Return data from memory"],
    color: "from-red-500 to-pink-500",
    icon: CornerDownRight
  },
  REVERT: {
    name: "REVERT",
    code: 0xfd,
    category: "system",
    description: "Revert state changes and return data",
    gasBase: 0,
    inputs: 2,
    outputs: 0,
    examples: ["REVERT(offset, size) - Revert with error data"],
    color: "from-red-500 to-pink-500",
    icon: AlertCircle
  }
}

// Gas cost constants
export const GAS_COSTS = {
  // Basic operation costs
  G_ZERO: 0,
  G_BASE: 2,
  G_VERYLOW: 3,
  G_LOW: 5,
  G_MID: 8,
  G_HIGH: 10,
  
  // Memory operations
  G_MEMORY: 3,
  G_COPY: 3,
  
  // Storage operations
  G_SLOAD: 2100,        // Cold storage read
  G_SLOAD_WARM: 100,    // Warm storage read
  G_SSTORE_SET: 20000,  // Set storage slot
  G_SSTORE_RESET: 5000, // Reset storage slot
  G_SSTORE_REFUND: 4800, // Refund for clearing storage
  
  // Call operations
  G_CALL: 700,
  G_CALLVALUE: 9000,
  G_NEWACCOUNT: 25000,
  
  // Transaction costs
  G_TRANSACTION: 21000,
  G_TXDATAZERO: 4,
  G_TXDATANONZERO: 16,
  
  // Precompile costs
  G_ECRECOVER: 3000,
  G_SHA256: 60,
  G_RIPEMD160: 600,
  G_IDENTITY: 15,
  
  // EIP-2929 access list costs
  G_ACCESS_LIST_ADDRESS: 2400,
  G_ACCESS_LIST_STORAGE: 1900
}

// Block gas limits and timing
export const BLOCK_CONSTANTS = {
  // Mainnet block gas limit
  MAX_GAS_LIMIT: 30000000,
  MIN_GAS_LIMIT: 5000,
  
  // Block timing (12 second slots)
  SLOT_TIME: 12000, // milliseconds
  EPOCH_SLOTS: 32,
  EPOCH_TIME: 32 * 12000, // ~6.4 minutes
  
  // MEV timing windows
  MEV_BUILDING_WINDOW: 4000, // 4 seconds
  ATTESTATION_DEADLINE: 8000, // 8 seconds
  
  // Execution timing targets
  EXECUTION_TARGET: 200, // 200ms target
  STATE_ROOT_TARGET: 300, // 300ms target
  
  // Memory and stack limits
  MAX_STACK_SIZE: 1024,
  MAX_CODE_SIZE: 24576, // 24KB
  MAX_INIT_CODE_SIZE: 49152 // 48KB (EIP-3860)
}

// Precompiled contract addresses
export const PRECOMPILES = {
  ECRECOVER: "0x0000000000000000000000000000000000000001",
  SHA256: "0x0000000000000000000000000000000000000002", 
  RIPEMD160: "0x0000000000000000000000000000000000000003",
  IDENTITY: "0x0000000000000000000000000000000000000004",
  MODEXP: "0x0000000000000000000000000000000000000005",
  ECADD: "0x0000000000000000000000000000000000000006",
  ECMUL: "0x0000000000000000000000000000000000000007",
  ECPAIRING: "0x0000000000000000000000000000000000000008",
  BLAKE2F: "0x0000000000000000000000000000000000000009",
  POINT_EVALUATION: "0x000000000000000000000000000000000000000A" // EIP-4844
}

// Simulation and visualization parameters
export const SIMULATION_CONFIG = {
  // Animation timing
  DEFAULT_STEP_DELAY: 1000, // milliseconds
  FAST_STEP_DELAY: 300,
  SLOW_STEP_DELAY: 2000,
  
  // Execution phases
  EXECUTION_PHASE_DURATION: {
    "pre-execution": 1000,
    "executing": 2000,
    "post-execution": 1000,
    "validation": 1500,
    "complete": 500
  },
  
  // Visualization limits
  MAX_STACK_DISPLAY: 10,
  MAX_MEMORY_DISPLAY: 32, // 32 bytes
  MAX_STORAGE_DISPLAY: 10,
  MAX_EXECUTION_STEPS: 1000,
  
  // Color coding
  COLORS: {
    arithmetic: "from-blue-500 to-cyan-500",
    comparison: "from-green-500 to-emerald-500", 
    bitwise: "from-yellow-500 to-orange-500",
    crypto: "from-purple-500 to-pink-500",
    memory: "from-purple-500 to-pink-500",
    storage: "from-orange-500 to-red-500",
    flow: "from-indigo-500 to-purple-500",
    stack: "from-gray-500 to-gray-600",
    environment: "from-teal-500 to-cyan-500",
    system: "from-red-500 to-pink-500"
  }
}

// Educational content for EVM concepts
export const EDUCATIONAL_SECTIONS = {
  stack: {
    title: "Stack Machine",
    description: "EVM uses a 1024-item stack for computations",
    concepts: [
      "Last In, First Out (LIFO) ordering",
      "256-bit words (32 bytes each)",
      "Most operations consume inputs from top",
      "Results pushed back to top"
    ],
    examples: [
      "PUSH1 0x5, PUSH1 0x3, ADD → Stack: [8]",
      "DUP1 duplicates top item",
      "SWAP1 exchanges top two items"
    ]
  },
  memory: {
    title: "Memory Model",
    description: "Linear memory model with dynamic expansion",
    concepts: [
      "Byte-addressable linear memory",
      "Grows in 32-byte words",
      "Quadratic gas cost for expansion", 
      "Cleared between transactions"
    ],
    examples: [
      "MSTORE(0x40, value) - Store 32 bytes",
      "MLOAD(0x40) - Load 32 bytes",
      "Memory expansion costs gas"
    ]
  },
  storage: {
    title: "Persistent Storage",
    description: "Key-value storage persisted between transactions",
    concepts: [
      "256-bit keys and values",
      "Persistent across transactions",
      "High gas costs (2100 gas cold read)",
      "EIP-2929 warm/cold access pattern"
    ],
    examples: [
      "SSTORE(key, value) - Store permanently",
      "SLOAD(key) - Read from storage",
      "Clearing storage gives gas refund"
    ]
  },
  gas: {
    title: "Gas Mechanism",
    description: "Metering computation and preventing infinite loops",
    concepts: [
      "Each operation costs gas",
      "Transaction provides gas limit",
      "Unused gas refunded",
      "Out of gas = revert transaction"
    ],
    examples: [
      "ADD costs 3 gas",
      "SSTORE costs up to 20,000 gas",
      "Memory expansion costs scale"
    ]
  }
}

// ViewMode configurations for different complexity levels
export const VIEW_MODE_CONFIGS = {
  beginner: {
    showOpcodes: false,
    showGasCosts: false,
    showMemoryDetails: false,
    maxStackDisplay: 5,
    animationSpeed: "slow"
  },
  intermediate: {
    showOpcodes: true,
    showGasCosts: true,
    showMemoryDetails: false,
    maxStackDisplay: 8,
    animationSpeed: "normal"
  },
  expert: {
    showOpcodes: true,
    showGasCosts: true,
    showMemoryDetails: true,
    maxStackDisplay: 10,
    animationSpeed: "fast"
  }
}