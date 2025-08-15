import { motion } from "framer-motion"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ValidationStep } from "@/lib/types"

interface ValidationPipelineProps {
  steps: ValidationStep[]
  currentStep: number
}

export default function ValidationPipeline({ steps, currentStep }: ValidationPipelineProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "p-3 rounded-lg border transition-all",
            step.status === "active" 
              ? "bg-zinc-900 border-[var(--eth-purple)] shadow-lg shadow-[var(--eth-purple)]/20"
              : step.status === "success"
              ? "bg-zinc-950/50 border-green-900"
              : "bg-zinc-950/50 border-zinc-800"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {step.status === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : step.status === "active" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <AlertCircle className="w-5 h-5 text-[var(--eth-purple)]" />
                </motion.div>
              ) : step.status === "error" ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-zinc-700" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-medium",
                  step.status === "active" ? "text-white" : "text-zinc-400"
                )}>
                  {step.name}
                </h3>
                <span className="text-xs font-mono text-zinc-600">
                  {step.duration}ms
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}