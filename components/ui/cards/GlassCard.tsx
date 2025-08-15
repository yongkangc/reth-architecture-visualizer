import React from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface GlassCardProps extends Omit<MotionProps, 'children'> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'compact' | 'large'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  backdrop?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shadow?: boolean
  gradient?: boolean
  onClick?: () => void
  animate?: boolean // For backward compatibility
  delay?: number    // For backward compatibility
}

const variantStyles = {
  default: '',
  compact: 'text-sm',
  large: 'text-base'
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
}

const roundedStyles = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  '2xl': 'rounded-[2rem]'
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  padding = 'lg',
  border = true,
  backdrop = true,
  rounded = '2xl',
  shadow = false,
  gradient = false,
  onClick,
  animate = true,
  delay = 0,
  ...motionProps
}: GlassCardProps) {
  const Component = onClick ? motion.button : motion.div

  const cardContent = (
    <div
      className={cn(
        // Base styles
        'relative',
        
        // Backdrop and background
        backdrop && 'bg-zinc-900/90 backdrop-blur-sm',
        !backdrop && 'bg-zinc-900',
        
        // Border
        border && 'border border-zinc-800',
        
        // Padding
        paddingStyles[padding],
        
        // Rounded corners
        roundedStyles[rounded],
        
        // Shadow
        shadow && 'shadow-lg shadow-black/20',
        
        // Gradient overlay
        gradient && 'bg-gradient-to-br from-zinc-800/50 to-zinc-900/80',
        
        // Variant styles
        variantStyles[variant],
        
        // Interactive styles
        onClick && [
          'cursor-pointer transition-all duration-200',
          'hover:bg-zinc-800/90 hover:border-zinc-700',
          'active:scale-[0.98]'
        ],
        
        className
      )}
    >
      {children}
    </div>
  )

  if (!animate) {
    return onClick ? (
      <button onClick={onClick} className="block w-full">
        {cardContent}
      </button>
    ) : cardContent
  }

  return (
    <Component
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  )
}

// Default export for backward compatibility
export default GlassCard

// Preset variants for common use cases
export function InfoCard({ children, ...props }: Omit<GlassCardProps, 'variant'>) {
  return (
    <GlassCard variant="default" padding="lg" shadow {...props}>
      {children}
    </GlassCard>
  )
}

export function CompactCard({ children, ...props }: Omit<GlassCardProps, 'variant' | 'padding'>) {
  return (
    <GlassCard variant="compact" padding="sm" {...props}>
      {children}
    </GlassCard>
  )
}

export function ActionCard({ children, onClick, ...props }: Omit<GlassCardProps, 'variant'>) {
  return (
    <GlassCard 
      variant="default" 
      onClick={onClick} 
      shadow 
      className="hover:shadow-xl hover:shadow-black/30 transition-all duration-300"
      {...props}
    >
      {children}
    </GlassCard>
  )
}