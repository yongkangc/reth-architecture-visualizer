import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { MetricCardData } from "@/lib/types"

interface MetricCardProps extends MetricCardData {
  className?: string
  animate?: boolean
}

export default function MetricCard({ 
  label, 
  value, 
  unit = "", 
  color = "text-white",
  icon: Icon,
  className = "",
  animate = true
}: MetricCardProps) {
  const content = (
    <div className={cn("bg-zinc-800/50 rounded-lg p-4", className)}>
      {Icon && (
        <Icon className={cn("w-5 h-5 mb-2", color)} />
      )}
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", color)}>
        {value}{unit}
      </p>
    </div>
  )

  if (!animate) return content

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  )
}