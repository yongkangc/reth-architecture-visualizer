import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { PayloadStatus } from "@/lib/types"

interface StatusDisplayProps {
  status: PayloadStatus
  progress: number
}

export default function StatusDisplay({ status, progress }: StatusDisplayProps) {
  const getStatusColor = () => {
    switch (status) {
      case "idle": return "text-zinc-500"
      case "validating": return "text-yellow-500"
      case "executing": return "text-blue-500"
      case "computing": return "text-purple-500"
      case "success": return "text-green-500"
      case "invalid": return "text-red-500"
      default: return "text-zinc-500"
    }
  }

  return (
    <div className="mb-6 p-4 bg-black rounded-lg border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-500">Current Status</span>
        <span className={cn("font-mono text-sm uppercase", getStatusColor())}>
          {status}
        </span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--eth-purple)] to-[var(--eth-pink)]"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}