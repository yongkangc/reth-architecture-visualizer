"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, AlertTriangle, CheckCircle2, XCircle, Clock, Zap,
  FileCode, Database, GitBranch, Hash, Lock, Package,
  Activity, Cpu, HardDrive, Network, Play, Pause, RotateCcw,
  ChevronRight, Info, AlertCircle, Layers, Binary, ArrowRight
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import PageContainer from "@/components/ui/PageContainer"

// Detailed validation phases
interface ValidationPhase {
  id: string
  name: string
  description: string
  checks: ValidationCheck[]
  criticalityLevel: "low" | "medium" | "high" | "critical"
  timeComplexity: string
  gasImpact?: string
  failureMode: string
}

interface ValidationCheck {
  id: string
  name: string
  description: string
  code?: string
  gasUsed?: string
  timing: string
  canFail: boolean
  failureReason?: string
  icon: React.ElementType
}

const validationPhases: ValidationPhase[] = [
  {
    id: "initial-checks",
    name: "Initial Sanity Checks",
    description: "Quick rejection of obviously invalid payloads before expensive operations",
    criticalityLevel: "high",
    timeComplexity: "O(1)",
    failureMode: "INVALID_PARAMS",
    checks: [
      {
        id: "version-check",
        name: "Payload Version Compatibility",
        description: "Verify the payload version matches our capabilities (V1, V2, V3, V4)",
        timing: "<1ms",
        canFail: true,
        failureReason: "Unsupported payload version",
        icon: Package,
        code: `// Check payload version
match payload_version {
    1 => self.validate_v1_fields(&payload)?,
    2 => self.validate_v2_fields(&payload)?, // + withdrawals
    3 => self.validate_v3_fields(&payload)?, // + blob gas
    4 => self.validate_v4_fields(&payload)?, // + requests
    _ => return Err(EngineError::UnsupportedVersion)
}`
      },
      {
        id: "timestamp-check",
        name: "Timestamp Validation",
        description: "Ensure block timestamp is greater than parent and not too far in future",
        timing: "<1ms",
        canFail: true,
        failureReason: "Invalid timestamp (<=parent or >15s future)",
        icon: Clock,
        code: `// Timestamp must be strictly increasing
if payload.timestamp <= parent.timestamp {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::InvalidTimestamp
    );
}

// Check if timestamp is not too far in future (15s tolerance)
let now = SystemTime::now().duration_since(UNIX_EPOCH)?;
if payload.timestamp > now.as_secs() + 15 {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::TimestampTooFarInFuture
    );
}`
      },
      {
        id: "block-hash-check",
        name: "Block Hash Format",
        description: "Verify block hash is properly formatted 32-byte value",
        timing: "<1ms",
        canFail: true,
        failureReason: "Malformed block hash",
        icon: Hash,
        code: `// Validate block hash format
if payload.block_hash == B256::ZERO {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::InvalidBlockHash
    );
}`
      }
    ]
  },
  {
    id: "structural-validation",
    name: "Structural Validation",
    description: "Validate payload structure and field constraints",
    criticalityLevel: "high",
    timeComplexity: "O(n) where n = number of transactions",
    failureMode: "INVALID_BLOCK_HASH",
    checks: [
      {
        id: "parent-hash-lookup",
        name: "Parent Block Verification",
        description: "Ensure parent block exists and is in our canonical chain",
        timing: "~5ms",
        canFail: true,
        failureReason: "Unknown parent hash",
        icon: GitBranch,
        code: `// Look up parent block
let parent = match self.blockchain.block_by_hash(payload.parent_hash) {
    Some(block) => block,
    None => {
        // Parent not found - we might be syncing
        return PayloadStatus::Syncing;
    }
};

// Verify parent is in canonical chain
if !self.blockchain.is_canonical(parent.hash) {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::ParentNotCanonical
    );
}`
      },
      {
        id: "gas-limit-check",
        name: "Gas Limit Validation",
        description: "Check gas limit is within protocol bounds and elasticity rules",
        timing: "<1ms",
        canFail: true,
        failureReason: "Gas limit out of bounds",
        icon: Activity,
        code: `// Validate gas limit elasticity (EIP-1559)
let parent_gas_limit = parent.gas_limit;
let gas_limit = payload.gas_limit;

// Gas limit can only change by 1/1024 of parent
let max_delta = parent_gas_limit / 1024;
if gas_limit > parent_gas_limit + max_delta ||
   gas_limit < parent_gas_limit - max_delta {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::InvalidGasLimit
    );
}

// Check absolute bounds
if gas_limit < MIN_GAS_LIMIT || gas_limit > MAX_GAS_LIMIT {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::GasLimitOutOfBounds
    );
}`
      },
      {
        id: "base-fee-check",
        name: "Base Fee Calculation",
        description: "Verify base fee follows EIP-1559 formula based on parent gas usage",
        timing: "<1ms",
        canFail: true,
        failureReason: "Incorrect base fee",
        icon: Zap,
        code: `// Calculate expected base fee per EIP-1559
let expected_base_fee = calculate_base_fee(
    parent.gas_used,
    parent.gas_limit,
    parent.base_fee_per_gas,
);

if payload.base_fee_per_gas != expected_base_fee {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::InvalidBaseFee {
            expected: expected_base_fee,
            got: payload.base_fee_per_gas,
        }
    );
}`
      }
    ]
  },
  {
    id: "blob-validation",
    name: "Blob Transaction Validation (EIP-4844)",
    description: "Validate blob transactions and KZG commitments for proto-danksharding",
    criticalityLevel: "critical",
    timeComplexity: "O(b*k) where b = blobs, k = KZG proof verification time",
    gasImpact: "~50,000 gas per blob",
    failureMode: "INVALID_BLOCK_HASH",
    checks: [
      {
        id: "blob-count-check",
        name: "Blob Count Limits",
        description: "Ensure blob count is within protocol limits (max 6 blobs per block)",
        timing: "<1ms",
        canFail: true,
        failureReason: "Too many blobs",
        icon: Layers,
        code: `// Count blob transactions
let blob_txs: Vec<_> = payload.transactions
    .iter()
    .filter(|tx| tx.is_eip4844())
    .collect();

let total_blobs = blob_txs
    .iter()
    .map(|tx| tx.blob_versioned_hashes.len())
    .sum::<usize>();

if total_blobs > MAX_BLOBS_PER_BLOCK {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::TooManyBlobs(total_blobs)
    );
}`
      },
      {
        id: "kzg-verification",
        name: "KZG Commitment Verification",
        description: "Verify cryptographic commitments for blob data availability",
        timing: "~50ms per blob",
        canFail: true,
        failureReason: "Invalid KZG proof",
        icon: Lock,
        code: `// Verify KZG commitments
for (i, blob_tx) in blob_txs.iter().enumerate() {
    let versioned_hashes = &blob_tx.blob_versioned_hashes;
    let commitments = &payload.blob_kzg_commitments[i];
    let proofs = &payload.blob_kzg_proofs[i];
    
    // Verify each blob's KZG proof
    for (hash, commitment, proof) in izip!(
        versioned_hashes, commitments, proofs
    ) {
        if !verify_kzg_proof(hash, commitment, proof)? {
            return PayloadStatus::invalid_with_err(
                PayloadValidationError::InvalidKZGProof
            );
        }
    }
}`
      },
      {
        id: "blob-gas-check",
        name: "Blob Gas Price Validation",
        description: "Verify blob gas pricing follows EIP-4844 exponential pricing",
        timing: "<1ms",
        canFail: true,
        failureReason: "Incorrect blob gas price",
        icon: Activity,
        code: `// Calculate expected blob gas price
let expected_blob_gas = calculate_blob_gas_price(
    parent.excess_blob_gas,
    parent.blob_gas_used,
);

if payload.blob_gas_used != expected_blob_gas {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::InvalidBlobGasPrice
    );
}`
      }
    ]
  },
  {
    id: "transaction-validation",
    name: "Transaction Validation",
    description: "Validate all transactions in the payload",
    criticalityLevel: "critical",
    timeComplexity: "O(n*m) where n = txs, m = signature verification time",
    failureMode: "INVALID_BLOCK_HASH",
    checks: [
      {
        id: "tx-encoding",
        name: "Transaction Encoding",
        description: "Decode and validate transaction RLP encoding",
        timing: "~1ms per tx",
        canFail: true,
        failureReason: "Malformed transaction RLP",
        icon: Binary,
        code: `// Decode transactions from RLP
let mut transactions = Vec::with_capacity(payload.transactions.len());
for raw_tx in &payload.transactions {
    let tx = match Transaction::decode(&mut raw_tx.as_ref()) {
        Ok(tx) => tx,
        Err(e) => {
            return PayloadStatus::invalid_with_err(
                PayloadValidationError::InvalidTransaction(e)
            );
        }
    };
    transactions.push(tx);
}`
      },
      {
        id: "signature-verification",
        name: "Signature Verification",
        description: "Verify ECDSA signatures for all transactions",
        timing: "~3ms per tx",
        canFail: true,
        failureReason: "Invalid signature",
        icon: Lock,
        code: `// Verify all transaction signatures
for tx in &transactions {
    let signer = match tx.recover_signer() {
        Ok(signer) => signer,
        Err(_) => {
            return PayloadStatus::invalid_with_err(
                PayloadValidationError::InvalidSignature
            );
        }
    };
    
    // Additional checks for EIP-1559 transactions
    if let Some(max_fee) = tx.max_fee_per_gas {
        if max_fee < payload.base_fee_per_gas {
            return PayloadStatus::invalid_with_err(
                PayloadValidationError::InsufficientMaxFee
            );
        }
    }
}`
      },
      {
        id: "tx-order-check",
        name: "Transaction Order Validation",
        description: "Ensure transactions are properly ordered (nonce sequence)",
        timing: "~1ms",
        canFail: true,
        failureReason: "Invalid transaction ordering",
        icon: Layers,
        code: `// Group transactions by sender
let mut sender_txs: HashMap<Address, Vec<&Transaction>> = HashMap::new();
for tx in &transactions {
    sender_txs.entry(tx.from).or_default().push(tx);
}

// Verify nonce ordering for each sender
for (sender, txs) in sender_txs {
    let account = state.get_account(sender)?;
    let mut expected_nonce = account.nonce;
    
    for tx in txs {
        if tx.nonce != expected_nonce {
            return PayloadStatus::invalid_with_err(
                PayloadValidationError::InvalidNonce
            );
        }
        expected_nonce += 1;
    }
}`
      }
    ]
  },
  {
    id: "execution-validation",
    name: "Full Execution & State Validation",
    description: "Execute all transactions and validate resulting state root",
    criticalityLevel: "critical",
    timeComplexity: "O(n*g) where n = txs, g = gas used",
    gasImpact: "Full gas consumption",
    failureMode: "INVALID_BLOCK_HASH",
    checks: [
      {
        id: "state-loading",
        name: "Load Pre-State",
        description: "Load all accounts and storage touched by transactions",
        timing: "~10-50ms",
        canFail: false,
        icon: Database,
        code: `// Load state at parent block
let mut state_provider = self.blockchain
    .state_provider_at(parent.state_root)?;

// Pre-fetch accounts for all transactions
let mut addresses = HashSet::new();
for tx in &transactions {
    addresses.insert(tx.from);
    if let Some(to) = tx.to {
        addresses.insert(to);
    }
}

// Batch load accounts
let accounts = state_provider.batch_get_accounts(addresses)?;`
      },
      {
        id: "evm-execution",
        name: "EVM Execution",
        description: "Execute each transaction through REVM",
        timing: "~50-200ms total",
        canFail: true,
        failureReason: "Execution reverted",
        icon: Cpu,
        code: `// Set up EVM with proper configuration
let mut evm = Evm::builder()
    .with_spec_id(self.get_spec_id(payload.timestamp))
    .with_env(Environment {
        block: BlockEnv {
            number: payload.number,
            timestamp: payload.timestamp,
            gas_limit: payload.gas_limit,
            base_fee: payload.base_fee_per_gas,
            difficulty: U256::ZERO, // Post-merge
            prevrandao: Some(payload.prev_randao),
            coinbase: payload.fee_recipient,
            blob_gas_price: calculate_blob_gas_price(payload),
        },
        ..Default::default()
    })
    .with_db(state_provider)
    .build();

// Execute all transactions
let mut cumulative_gas = 0u64;
let mut receipts = Vec::new();
let mut logs_bloom = Bloom::default();

for tx in transactions {
    let result = evm.transact(tx)?;
    
    cumulative_gas += result.gas_used;
    logs_bloom |= result.logs_bloom;
    
    receipts.push(Receipt {
        status: result.is_success(),
        cumulative_gas_used: cumulative_gas,
        logs: result.logs,
    });
}

// Verify gas used matches header
if cumulative_gas != payload.gas_used {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::GasUsedMismatch {
            expected: payload.gas_used,
            actual: cumulative_gas,
        }
    );
}`
      },
      {
        id: "withdrawals-processing",
        name: "Process Withdrawals",
        description: "Apply validator withdrawals to state (post-Shanghai)",
        timing: "~5ms",
        canFail: false,
        icon: Package,
        code: `// Process withdrawals (Shanghai+)
if let Some(withdrawals) = &payload.withdrawals {
    for withdrawal in withdrawals {
        // Credit withdrawal amount to validator
        let mut account = state.get_account_mut(withdrawal.address)?;
        account.balance = account.balance
            .checked_add(withdrawal.amount)
            .ok_or(PayloadValidationError::BalanceOverflow)?;
    }
    
    // Verify withdrawals root
    let calculated_root = calculate_withdrawals_root(withdrawals);
    if calculated_root != payload.withdrawals_root {
        return PayloadStatus::invalid_with_err(
            PayloadValidationError::InvalidWithdrawalsRoot
        );
    }
}`
      },
      {
        id: "state-root-computation",
        name: "State Root Calculation",
        description: "Compute Merkle Patricia Trie root of final state",
        timing: "~100-300ms",
        canFail: true,
        failureReason: "State root mismatch",
        icon: GitBranch,
        code: `// Collect all state changes
let state_changes = evm.take_state_changes();

// Build state trie incrementally
let mut trie = StateRoot::new(state_provider.clone());
trie.with_state_changes(state_changes);

// Enable parallel computation for large blocks
if state_changes.len() > PARALLEL_THRESHOLD {
    trie.with_parallel_walker(num_cpus::get());
}

// Compute the state root
let computed_root = trie.compute()?;

// Compare with payload state root
if computed_root != payload.state_root {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::StateMismatch {
            expected: payload.state_root,
            computed: computed_root,
        }
    );
}`
      },
      {
        id: "receipts-root-check",
        name: "Receipts Root Validation",
        description: "Verify receipts trie root matches header",
        timing: "~10ms",
        canFail: true,
        failureReason: "Receipts root mismatch",
        icon: FileCode,
        code: `// Calculate receipts root
let receipts_root = calculate_receipts_root(&receipts);

if receipts_root != payload.receipts_root {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::ReceiptsRootMismatch {
            expected: payload.receipts_root,
            calculated: receipts_root,
        }
    );
}

// Verify logs bloom
if logs_bloom != payload.logs_bloom {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::LogsBloomMismatch
    );
}`
      }
    ]
  },
  {
    id: "consensus-validation",
    name: "Consensus Rules Validation",
    description: "Validate consensus-specific rules and finality",
    criticalityLevel: "high",
    timeComplexity: "O(1)",
    failureMode: "INVALID",
    checks: [
      {
        id: "randao-check",
        name: "RANDAO Mix Validation",
        description: "Verify RANDAO value for randomness",
        timing: "<1ms",
        canFail: true,
        failureReason: "Invalid RANDAO",
        icon: Shield,
        code: `// Verify RANDAO mix (post-merge)
if payload.prev_randao == B256::ZERO {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::InvalidRandao
    );
}`
      },
      {
        id: "finality-check",
        name: "Finality Checkpoint",
        description: "Check against finalized checkpoint",
        timing: "<1ms",
        canFail: true,
        failureReason: "Conflicts with finalized chain",
        icon: Lock,
        code: `// Check if payload conflicts with finalized chain
let finalized_block = self.blockchain.finalized_block();
if !self.blockchain.is_ancestor(finalized_block, parent) {
    return PayloadStatus::invalid_with_err(
        PayloadValidationError::ConflictsWithFinalized
    );
}`
      },
      {
        id: "mev-validation",
        name: "MEV Bundle Validation",
        description: "Validate MEV bundles if present",
        timing: "~5ms",
        canFail: false,
        icon: Zap,
        code: `// Validate MEV bundles (if builder block)
if let Some(bundles) = payload.mev_bundles {
    for bundle in bundles {
        // Verify bundle signatures
        if !verify_bundle_signature(&bundle) {
            return PayloadStatus::invalid_with_err(
                PayloadValidationError::InvalidMEVBundle
            );
        }
        
        // Check bundle ordering constraints
        if !validate_bundle_ordering(&bundle, &transactions) {
            return PayloadStatus::invalid_with_err(
                PayloadValidationError::BundleOrderingViolation
            );
        }
    }
}`
      }
    ]
  }
]

// Validation error types
const errorTypes = [
  {
    code: "INVALID_BLOCK_HASH",
    description: "Block hash doesn't match computed hash",
    severity: "critical",
    recovery: "Request block again"
  },
  {
    code: "INVALID_TERMINAL_BLOCK",
    description: "Invalid merge transition block",
    severity: "critical",
    recovery: "Resync from earlier block"
  },
  {
    code: "SYNCING",
    description: "Node is still syncing to chain tip",
    severity: "medium",
    recovery: "Wait for sync to complete"
  },
  {
    code: "ACCEPTED",
    description: "Block accepted but not fully validated",
    severity: "low",
    recovery: "Continue with optimistic sync"
  },
  {
    code: "INVALID",
    description: "Generic invalid status",
    severity: "high",
    recovery: "Reject block and slash proposer"
  }
]

// Performance benchmarks
const performanceBenchmarks = [
  { operation: "Initial Checks", p50: "1ms", p99: "3ms", critical: false },
  { operation: "Structural Validation", p50: "5ms", p99: "15ms", critical: false },
  { operation: "Blob Validation", p50: "50ms", p99: "150ms", critical: true },
  { operation: "Transaction Validation", p50: "30ms", p99: "100ms", critical: true },
  { operation: "EVM Execution", p50: "150ms", p99: "400ms", critical: true },
  { operation: "State Root Calculation", p50: "200ms", p99: "500ms", critical: true },
  { operation: "Total Validation", p50: "350ms", p99: "800ms", critical: true },
]

export default function PayloadValidationPage() {
  const [activePhase, setActivePhase] = useState<string | null>(null)
  const [activeCheck, setActiveCheck] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1)
  const [currentCheckIndex, setCurrentCheckIndex] = useState(-1)
  const [showCode, setShowCode] = useState(true)
  const [viewMode, setViewMode] = useState<"flow" | "errors" | "performance">("flow")
  const [validationResult, setValidationResult] = useState<"pending" | "valid" | "invalid" | "syncing">("pending")

  // Animation control
  useEffect(() => {
    if (!isPlaying) return

    const phase = validationPhases[currentPhaseIndex]
    if (!phase) {
      // Validation complete
      setIsPlaying(false)
      setValidationResult("valid")
      return
    }

    setActivePhase(phase.id)
    
    // Animate through checks
    if (currentCheckIndex < phase.checks.length) {
      const check = phase.checks[currentCheckIndex]
      setActiveCheck(check.id)
      
      // Simulate validation time based on check timing
      const duration = parseInt(check.timing) || 100
      const timeout = setTimeout(() => {
        // Randomly fail some checks for demo
        if (check.canFail && Math.random() < 0.1) {
          setValidationResult("invalid")
          setIsPlaying(false)
          return
        }
        setCurrentCheckIndex(prev => prev + 1)
      }, duration * 10) // Scale for visibility
      
      return () => clearTimeout(timeout)
    } else {
      // Move to next phase
      setCurrentCheckIndex(0)
      setCurrentPhaseIndex(prev => prev + 1)
    }
  }, [isPlaying, currentPhaseIndex, currentCheckIndex])

  const startValidation = () => {
    resetValidation()
    setIsPlaying(true)
    setCurrentPhaseIndex(0)
    setCurrentCheckIndex(0)
    setValidationResult("pending")
  }

  const resetValidation = () => {
    setIsPlaying(false)
    setActivePhase(null)
    setActiveCheck(null)
    setCurrentPhaseIndex(-1)
    setCurrentCheckIndex(-1)
    setValidationResult("pending")
  }

  const getCriticalityColor = (level: string) => {
    switch (level) {
      case "critical": return "from-red-500 to-red-600"
      case "high": return "from-orange-500 to-orange-600"
      case "medium": return "from-yellow-500 to-yellow-600"
      case "low": return "from-green-500 to-green-600"
      default: return "from-zinc-500 to-zinc-600"
    }
  }

  const getResultColor = () => {
    switch (validationResult) {
      case "valid": return "text-green-400"
      case "invalid": return "text-red-400"
      case "syncing": return "text-yellow-400"
      default: return "text-zinc-400"
    }
  }

  return (
    <PageContainer>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Payload Validation Deep Dive</h1>
            <p className="text-zinc-400 mt-1">Complete validation pipeline for execution payloads</p>
          </div>
        </div>

        {/* Important Context */}
        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-1">Critical for Consensus</h3>
              <p className="text-zinc-300 text-sm">
                Payload validation must complete within the 4-second block production window. 
                Validators need the result by the 8-second mark to attest. Any delay impacts 
                network consensus and can lead to missed attestations or blocks.
              </p>
            </div>
          </div>
        </div>

        {/* Related Topics */}
        <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <h3 className="text-purple-400 font-semibold mb-3">See Also</h3>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/chapters/block-lifecycle"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-white"
            >
              <Package className="w-4 h-4" />
              <span>Block Lifecycle Overview</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </Link>
            <Link 
              href="/chapters/engine-api"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-white"
            >
              <Cpu className="w-4 h-4" />
              <span>Engine API Interface</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </Link>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2 mt-6">
          {["flow", "errors", "performance"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as "flow" | "errors" | "performance")}
              className={cn(
                "px-4 py-2 rounded-lg transition-all capitalize",
                viewMode === mode
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={isPlaying ? () => setIsPlaying(false) : startValidation}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Start Validation"}
          </button>
          <button
            onClick={resetValidation}
            className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium flex items-center gap-2 hover:bg-zinc-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-all"
          >
            {showCode ? "Hide" : "Show"} Code
          </button>
        </div>

        {/* Validation Result */}
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">Result:</span>
          <span className={cn("font-mono font-bold text-lg", getResultColor())}>
            {validationResult.toUpperCase()}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "flow" && (
          <motion.div
            key="flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Validation Flow */}
            {validationPhases.map((phase, phaseIndex) => {
              const isActive = activePhase === phase.id
              const isPast = currentPhaseIndex > phaseIndex

              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: phaseIndex * 0.1 }}
                  className={cn(
                    "relative rounded-xl border transition-all duration-500",
                    isActive 
                      ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                      : isPast
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-zinc-800 bg-zinc-900/50"
                  )}
                >
                  {/* Phase Header */}
                  <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-3 py-1 rounded-lg bg-gradient-to-r text-white text-xs font-semibold",
                          getCriticalityColor(phase.criticalityLevel)
                        )}>
                          {phase.criticalityLevel.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{phase.name}</h3>
                          <p className="text-zinc-400 text-sm mt-1">{phase.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-xs">Complexity</p>
                        <p className="text-zinc-300 font-mono">{phase.timeComplexity}</p>
                        {phase.gasImpact && (
                          <>
                            <p className="text-zinc-500 text-xs mt-1">Gas Impact</p>
                            <p className="text-zinc-300 font-mono text-sm">{phase.gasImpact}</p>
                          </>
                        )}
                      </div>
                    </div>
                    {phase.failureMode && (
                      <div className="mt-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">
                          Failure Mode: <span className="font-mono">{phase.failureMode}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Phase Checks */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {phase.checks.map((check, checkIndex) => {
                        const Icon = check.icon
                        const isCheckActive = isActive && activeCheck === check.id
                        const isCheckPast = isPast || (isActive && currentCheckIndex > checkIndex)

                        return (
                          <motion.div
                            key={check.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: checkIndex * 0.05 }}
                            className={cn(
                              "relative pl-8",
                              checkIndex < phase.checks.length - 1 && "pb-4 border-l-2 border-zinc-800 ml-3"
                            )}
                          >
                            {/* Check Indicator */}
                            <div className={cn(
                              "absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                              isCheckActive 
                                ? "border-purple-500 bg-purple-500 scale-125"
                                : isCheckPast
                                ? "border-green-500 bg-green-500"
                                : "border-zinc-600 bg-zinc-800"
                            )}>
                              {isCheckPast ? (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              ) : isCheckActive ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <Activity className="w-3 h-3 text-white" />
                                </motion.div>
                              ) : null}
                            </div>

                            {/* Check Content */}
                            <div className={cn(
                              "ml-4 rounded-lg transition-all duration-500",
                              isCheckActive
                                ? "bg-purple-500/20 border border-purple-500/50 p-4"
                                : "bg-zinc-800/30 p-4"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Icon className={cn(
                                    "w-5 h-5",
                                    isCheckActive ? "text-purple-400" : "text-zinc-400"
                                  )} />
                                  <h4 className={cn(
                                    "font-semibold transition-colors",
                                    isCheckActive ? "text-purple-400" : "text-white"
                                  )}>
                                    {check.name}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-zinc-500 font-mono">{check.timing}</span>
                                  {check.canFail && (
                                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                                      Can Fail
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-zinc-400 mb-2">{check.description}</p>
                              
                              {check.failureReason && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-yellow-400">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Failure: {check.failureReason}</span>
                                </div>
                              )}

                              {/* Code Sample */}
                              {showCode && check.code && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3"
                                >
                                  <pre className="p-3 rounded bg-zinc-900 border border-zinc-800 overflow-x-auto">
                                    <code className="text-xs text-zinc-300 font-mono">
                                      {check.code}
                                    </code>
                                  </pre>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {viewMode === "errors" && (
          <motion.div
            key="errors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Error Types */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Payload Status Codes</h3>
              <div className="space-y-4">
                {errorTypes.map((error) => (
                  <div key={error.code} className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/50">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      error.severity === "critical" ? "bg-red-500" :
                      error.severity === "high" ? "bg-orange-500" :
                      error.severity === "medium" ? "bg-yellow-500" :
                      "bg-green-500"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <code className="text-purple-400 font-mono font-semibold">{error.code}</code>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs",
                          error.severity === "critical" ? "bg-red-500/20 text-red-400" :
                          error.severity === "high" ? "bg-orange-500/20 text-orange-400" :
                          error.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-green-500/20 text-green-400"
                        )}>
                          {error.severity}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm mb-2">{error.description}</p>
                      <p className="text-zinc-500 text-xs">
                        <span className="text-zinc-400">Recovery:</span> {error.recovery}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Failure Scenarios */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Common Failure Scenarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-red-400 font-medium mb-2">State Root Mismatch</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    Most common validation failure. Occurs when computed state root doesn't match header.
                  </p>
                  <p className="text-zinc-500 text-xs">
                    <strong>Causes:</strong> Missing transactions, incorrect execution, state corruption
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-orange-400 font-medium mb-2">Invalid Timestamp</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    Block timestamp is not greater than parent or too far in future.
                  </p>
                  <p className="text-zinc-500 text-xs">
                    <strong>Causes:</strong> Clock skew, malicious proposer, network delays
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-yellow-400 font-medium mb-2">Gas Limit Violation</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    Gas limit change exceeds 1/1024 elasticity bound.
                  </p>
                  <p className="text-zinc-500 text-xs">
                    <strong>Causes:</strong> Invalid gas limit calculation, consensus bug
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-purple-400 font-medium mb-2">KZG Proof Failure</h4>
                  <p className="text-zinc-400 text-sm mb-2">
                    Blob transaction KZG commitment verification fails.
                  </p>
                  <p className="text-zinc-500 text-xs">
                    <strong>Causes:</strong> Invalid blob data, wrong commitment, network corruption
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "performance" && (
          <motion.div
            key="performance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Performance Benchmarks */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Benchmarks</h3>
              <div className="space-y-3">
                {performanceBenchmarks.map((benchmark) => (
                  <div key={benchmark.operation} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      {benchmark.critical && (
                        <Zap className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className={cn(
                        "font-medium",
                        benchmark.critical ? "text-yellow-400" : "text-white"
                      )}>
                        {benchmark.operation}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-zinc-500 text-xs">P50</p>
                        <p className="text-green-400 font-mono">{benchmark.p50}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-xs">P99</p>
                        <p className="text-orange-400 font-mono">{benchmark.p99}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Strategies */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Optimization Strategies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-blue-400 font-medium mb-2">Parallel Transaction Execution</h4>
                  <p className="text-zinc-400 text-sm">
                    Execute independent transactions concurrently using REVM's parallel mode. 
                    Can reduce execution time by 40-60% for large blocks.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-green-400 font-medium mb-2">Incremental State Root</h4>
                  <p className="text-zinc-400 text-sm">
                    Calculate state root incrementally during execution instead of after. 
                    Overlaps computation with I/O for 20-30% improvement.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-purple-400 font-medium mb-2">Optimistic Validation</h4>
                  <p className="text-zinc-400 text-sm">
                    Start executing before full validation for trusted sources. 
                    Roll back if validation fails. Reduces perceived latency.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-zinc-800/50">
                  <h4 className="text-orange-400 font-medium mb-2">State Prefetching</h4>
                  <p className="text-zinc-400 text-sm">
                    Analyze transactions and prefetch required state in parallel. 
                    Reduces database read latency by up to 50%.
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Path */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Critical Path Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">State Root Calculation</p>
                    <p className="text-zinc-500 text-xs">~200ms - Primary bottleneck, hard to parallelize</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">Transaction Execution</p>
                    <p className="text-zinc-500 text-xs">~150ms - Can be parallelized for independent txs</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">Blob Validation</p>
                    <p className="text-zinc-500 text-xs">~50ms per blob - KZG proof verification</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  )
}