import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Scenario } from "@/lib/types"
import { STATE_ROOT_SCENARIOS } from "@/lib/constants"

interface ScenarioSelectorProps {
  selectedScenario: Scenario
  onSelect: (scenario: Scenario) => void
}

export default function ScenarioSelector({ selectedScenario, onSelect }: ScenarioSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-8"
    >
      <h2 className="text-lg font-semibold mb-4 text-zinc-300">Select Scenario</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATE_ROOT_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            className={cn(
              "p-4 rounded-xl border-2 transition-all card-hover",
              selectedScenario.id === scenario.id
                ? "border-[var(--eth-purple)] bg-[var(--eth-purple)]/10 shadow-lg shadow-[var(--eth-purple)]/20"
                : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
            )}
          >
            <h3 className="font-semibold text-white mb-1">{scenario.name}</h3>
            <p className="text-xs text-zinc-400 mb-2">{scenario.description}</p>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Size: {scenario.blockSize} txs</span>
              <span className={cn(
                "font-mono",
                scenario.cacheState === "hot" ? "text-green-400" : "text-orange-400"
              )}>
                {scenario.cacheState.toUpperCase()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )
}