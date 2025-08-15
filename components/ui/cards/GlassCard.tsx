import { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ANIMATION_VARIANTS } from "@/lib/constants"

interface GlassCardProps {
  children: ReactNode
  className?: string
  animate?: boolean
  delay?: number
}

export default function GlassCard({ 
  children, 
  className = "", 
  animate = true,
  delay = 0 
}: GlassCardProps) {
  const content = (
    <div className={cn("glass rounded-2xl p-6", className)}>
      {children}
    </div>
  )

  if (!animate) return content

  return (
    <motion.div
      initial={ANIMATION_VARIANTS.fadeIn.initial}
      animate={ANIMATION_VARIANTS.fadeIn.animate}
      transition={{ ...ANIMATION_VARIANTS.fadeIn.transition, delay }}
    >
      {content}
    </motion.div>
  )
}