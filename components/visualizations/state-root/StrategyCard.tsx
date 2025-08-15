import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Strategy } from "@/lib/types"
import { STRATEGY_INFO } from "@/lib/constants"

interface StrategyCardProps {
  strategy: Strategy
  isActive: boolean
  hasActiveStrategy: boolean
}

export default function StrategyCard({ strategy, isActive, hasActiveStrategy }: StrategyCardProps) {
  const info = STRATEGY_INFO[strategy]
  const Icon = info.icon

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.02 : 1,
        opacity: !hasActiveStrategy || isActive ? 1 : 0.5
      }}
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        isActive 
          ? "border-[var(--eth-purple)] bg-[var(--eth-purple)]/10 shadow-lg shadow-[var(--eth-purple)]/20"
          : "border-zinc-700 bg-zinc-800/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
          info.color
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">{info.name}</h3>
          <p className="text-xs text-zinc-400 mb-2">{info.description}</p>
          
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-zinc-700"
            >
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-green-400 font-medium mb-1">Advantages</p>
                  {info.pros.map((pro, i) => (
                    <p key={i} className="text-zinc-400">• {pro}</p>
                  ))}
                </div>
                <div>
                  <p className="text-orange-400 font-medium mb-1">Trade-offs</p>
                  {info.cons.map((con, i) => (
                    <p key={i} className="text-zinc-400">• {con}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}