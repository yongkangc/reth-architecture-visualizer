import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  isVisible: boolean
  isPersistent?: boolean
  title: string
  description?: string
  details?: string[]
  codeExample?: string
  metrics?: {
    label: string
    value: string
    color?: string
  }[]
  connections?: {
    direction: 'to' | 'from'
    target: string
    label: string
  }[]
  onClose?: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  maxWidth?: string
  showCloseButton?: boolean
}

const positionClasses = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
  left: 'right-full mr-2',
  right: 'left-full ml-2'
}

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-zinc-700',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-zinc-700',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-zinc-700',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-zinc-700'
}

export function ComponentTooltip({
  isVisible,
  isPersistent = false,
  title,
  description,
  details,
  codeExample,
  metrics,
  connections,
  onClose,
  position = 'top',
  className,
  maxWidth = 'w-80',
  showCloseButton = true
}: TooltipProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute z-50',
            positionClasses[position],
            maxWidth,
            className
          )}
        >
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-8',
              arrowClasses[position]
            )}
          />
          
          {/* Tooltip Content */}
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm mb-1">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-xs text-zinc-400">
                      {description}
                    </p>
                  )}
                </div>
                {isPersistent && showCloseButton && onClose && (
                  <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white transition-colors ml-2"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Details */}
            {details && details.length > 0 && (
              <div className="p-4 border-b border-zinc-700">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                  Details
                </h4>
                <div className="space-y-1">
                  {details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-zinc-300">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            {metrics && metrics.length > 0 && (
              <div className="p-4 border-b border-zinc-700">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                  Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {metrics.map((metric, index) => (
                    <div key={index} className="bg-zinc-900/50 rounded p-2">
                      <div className="text-xs text-zinc-500">{metric.label}</div>
                      <div className={cn(
                        "text-sm font-semibold",
                        metric.color || "text-zinc-300"
                      )}>
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Example */}
            {codeExample && (
              <div className="p-4 border-b border-zinc-700">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                  Code Example
                </h4>
                <div className="bg-black/50 rounded p-2 overflow-x-auto">
                  <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                    {codeExample}
                  </pre>
                </div>
              </div>
            )}

            {/* Connections */}
            {connections && connections.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">
                  Connections
                </h4>
                <div className="space-y-1">
                  {connections.map((connection, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <ArrowRight className={cn(
                        "w-3 h-3",
                        connection.direction === 'from' ? "text-blue-400 rotate-180" : "text-green-400"
                      )} />
                      <span className="text-zinc-400">
                        {connection.direction === 'from' ? 'From' : 'To'} {connection.target}:
                      </span>
                      <span className="text-zinc-300">{connection.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Simplified version for basic tooltips
export function SimpleTooltip({
  isVisible,
  content,
  position = 'top',
  className
}: {
  isVisible: boolean
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute z-50 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 whitespace-nowrap',
            positionClasses[position],
            className
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[position]
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for managing tooltip state
export function useTooltip() {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isPersistent, setIsPersistent] = React.useState(false)

  const show = React.useCallback(() => setIsVisible(true), [])
  const hide = React.useCallback(() => {
    if (!isPersistent) {
      setIsVisible(false)
    }
  }, [isPersistent])
  
  const toggle = React.useCallback(() => {
    setIsVisible(prev => !prev)
    setIsPersistent(prev => !prev)
  }, [])
  
  const close = React.useCallback(() => {
    setIsVisible(false)
    setIsPersistent(false)
  }, [])

  return {
    isVisible,
    isPersistent,
    show,
    hide,
    toggle,
    close
  }
}