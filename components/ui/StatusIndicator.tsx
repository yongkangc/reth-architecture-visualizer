import React from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Play, 
  Pause,
  Loader2,
  Zap,
  type LucideIcon 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusType = 
  | 'idle' 
  | 'pending' 
  | 'active' 
  | 'loading'
  | 'success' 
  | 'error' 
  | 'warning'
  | 'playing'
  | 'paused'

export interface StatusIndicatorProps {
  status: StatusType
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'detailed'
  icon?: LucideIcon
  customColor?: string
  animated?: boolean
  pulsing?: boolean
  showProgress?: boolean
  progress?: number
  className?: string
}

const statusConfig: Record<StatusType, {
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  label: string
}> = {
  idle: {
    icon: Clock,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/20',
    label: 'Idle'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Pending'
  },
  active: {
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Active'
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Loading'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Success'
  },
  error: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Error'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Warning'
  },
  playing: {
    icon: Play,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Playing'
  },
  paused: {
    icon: Pause,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Paused'
  }
}

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    badge: 'w-6 h-6'
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    badge: 'w-8 h-8'
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    badge: 'w-10 h-10'
  }
}

export function StatusIndicator({
  status,
  label,
  description,
  size = 'md',
  variant = 'default',
  icon: customIcon,
  customColor,
  animated = true,
  pulsing = false,
  showProgress = false,
  progress = 0,
  className
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const sizeClasses = sizeConfig[size]
  const Icon = customIcon || config.icon

  const isLoading = status === 'loading'
  const shouldPulse = pulsing || ['active', 'loading', 'playing'].includes(status)

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <motion.div
          className={cn(
            'rounded-full flex items-center justify-center',
            sizeClasses.badge,
            customColor || config.bgColor,
            customColor || config.borderColor,
            'border'
          )}
          animate={shouldPulse && animated ? {
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Icon 
            className={cn(
              sizeClasses.icon,
              customColor || config.color,
              isLoading && animated && 'animate-spin'
            )} 
          />
        </motion.div>
        {label && (
          <span className={cn('font-medium', customColor || config.color)}>
            {label}
          </span>
        )}
      </div>
    )
  }

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border',
        sizeClasses.container,
        customColor || config.bgColor,
        customColor || config.borderColor,
        className
      )}
      initial={animated ? { opacity: 0, scale: 0.9 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={shouldPulse && animated ? {
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Icon 
          className={cn(
            sizeClasses.icon,
            customColor || config.color,
            isLoading && animated && 'animate-spin'
          )} 
        />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className={cn('font-medium', customColor || config.color)}>
          {label || config.label}
        </div>
        {description && variant === 'detailed' && (
          <div className="text-xs text-zinc-400 truncate">
            {description}
          </div>
        )}
      </div>

      {showProgress && (
        <div className="flex items-center gap-1">
          <div className="w-12 h-1 bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', customColor || config.bgColor.replace('/10', '/50'))}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-zinc-400 min-w-[2rem] text-right">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </motion.div>
  )
}

// Preset variants
export function StatusBadge({ status, className, ...props }: Omit<StatusIndicatorProps, 'variant'>) {
  return (
    <StatusIndicator 
      {...props} 
      status={status}
      variant="minimal" 
      size="sm"
      className={className}
    />
  )
}

export function LoadingIndicator({ 
  label = "Loading...", 
  className,
  ...props 
}: Omit<StatusIndicatorProps, 'status'>) {
  return (
    <StatusIndicator 
      {...props}
      status="loading" 
      label={label}
      className={className}
    />
  )
}

export function ProgressIndicator({ 
  progress, 
  label,
  className,
  ...props 
}: Omit<StatusIndicatorProps, 'showProgress'>) {
  return (
    <StatusIndicator 
      {...props}
      status="active"
      label={label}
      progress={progress}
      showProgress
      className={className}
    />
  )
}