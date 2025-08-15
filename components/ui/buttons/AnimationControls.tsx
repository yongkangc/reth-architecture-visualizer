import React from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, RotateCcw, SkipForward, SkipBack } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AnimationControlsProps {
  isPlaying: boolean
  isPaused?: boolean
  speed?: number
  canPlay?: boolean
  canPause?: boolean
  canStop?: boolean
  canReset?: boolean
  canStep?: boolean
  showSpeed?: boolean
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  onReset?: () => void
  onStepForward?: () => void
  onStepBackward?: () => void
  onSpeedChange?: (speed: number) => void
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
}

const speedOptions = [0.25, 0.5, 1, 1.5, 2, 3]

export function AnimationControls({
  isPlaying,
  isPaused = false,
  speed = 1,
  canPlay = true,
  canPause = true,
  canStop = true,
  canReset = true,
  canStep = false,
  showSpeed = true,
  onPlay,
  onPause,
  onStop,
  onReset,
  onStepForward,
  onStepBackward,
  onSpeedChange,
  className,
  variant = 'default'
}: AnimationControlsProps) {
  
  const buttonBaseClasses = cn(
    'flex items-center justify-center transition-all duration-200',
    'border border-zinc-700 hover:border-zinc-600',
    'bg-zinc-800/50 hover:bg-zinc-700/50',
    'text-zinc-300 hover:text-white',
    variant === 'compact' && 'w-8 h-8 rounded-lg',
    variant === 'default' && 'w-10 h-10 rounded-xl',
    variant === 'minimal' && 'w-6 h-6 rounded-md'
  )

  const iconSize = variant === 'compact' ? 'w-3 h-3' : variant === 'minimal' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <div className={cn(
      'flex items-center gap-2',
      variant === 'compact' && 'gap-1',
      className
    )}>
      {/* Step Backward */}
      {canStep && (
        <motion.button
          className={cn(buttonBaseClasses, !onStepBackward && 'opacity-50 cursor-not-allowed')}
          onClick={onStepBackward}
          disabled={!onStepBackward}
          whileHover={{ scale: onStepBackward ? 1.05 : 1 }}
          whileTap={{ scale: onStepBackward ? 0.95 : 1 }}
          title="Step backward"
        >
          <SkipBack className={iconSize} />
        </motion.button>
      )}

      {/* Play/Pause */}
      {canPlay && (
        <motion.button
          className={cn(
            buttonBaseClasses,
            isPlaying ? 'bg-[#627eea]/20 border-[#627eea]' : '',
            (!onPlay && !onPause) && 'opacity-50 cursor-not-allowed'
          )}
          onClick={isPlaying ? onPause : onPlay}
          disabled={!onPlay && !onPause}
          whileHover={{ scale: (onPlay || onPause) ? 1.05 : 1 }}
          whileTap={{ scale: (onPlay || onPause) ? 0.95 : 1 }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className={iconSize} />
          ) : (
            <Play className={cn(iconSize, 'ml-0.5')} />
          )}
        </motion.button>
      )}

      {/* Stop */}
      {canStop && (
        <motion.button
          className={cn(buttonBaseClasses, !onStop && 'opacity-50 cursor-not-allowed')}
          onClick={onStop}
          disabled={!onStop}
          whileHover={{ scale: onStop ? 1.05 : 1 }}
          whileTap={{ scale: onStop ? 0.95 : 1 }}
          title="Stop"
        >
          <Square className={iconSize} />
        </motion.button>
      )}

      {/* Reset */}
      {canReset && (
        <motion.button
          className={cn(buttonBaseClasses, !onReset && 'opacity-50 cursor-not-allowed')}
          onClick={onReset}
          disabled={!onReset}
          whileHover={{ scale: onReset ? 1.05 : 1 }}
          whileTap={{ scale: onReset ? 0.95 : 1 }}
          title="Reset"
        >
          <RotateCcw className={iconSize} />
        </motion.button>
      )}

      {/* Step Forward */}
      {canStep && (
        <motion.button
          className={cn(buttonBaseClasses, !onStepForward && 'opacity-50 cursor-not-allowed')}
          onClick={onStepForward}
          disabled={!onStepForward}
          whileHover={{ scale: onStepForward ? 1.05 : 1 }}
          whileTap={{ scale: onStepForward ? 0.95 : 1 }}
          title="Step forward"
        >
          <SkipForward className={iconSize} />
        </motion.button>
      )}

      {/* Speed Control */}
      {showSpeed && onSpeedChange && variant !== 'minimal' && (
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-zinc-500">Speed:</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className={cn(
              'bg-zinc-800 border border-zinc-700 rounded text-xs',
              'text-zinc-300 focus:border-zinc-600 focus:outline-none',
              variant === 'compact' ? 'px-1 py-0.5' : 'px-2 py-1'
            )}
          >
            {speedOptions.map(s => (
              <option key={s} value={s}>
                {s === 1 ? 'Normal' : `${s}x`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// Preset variants
export function CompactAnimationControls(props: Omit<AnimationControlsProps, 'variant'>) {
  return <AnimationControls {...props} variant="compact" />
}

export function MinimalAnimationControls(props: Omit<AnimationControlsProps, 'variant' | 'showSpeed'>) {
  return <AnimationControls {...props} variant="minimal" showSpeed={false} />
}

export function PlayPauseButton({
  isPlaying,
  onPlay,
  onPause,
  className,
  size = 'default'
}: {
  isPlaying: boolean
  onPlay?: () => void
  onPause?: () => void
  className?: string
  size?: 'sm' | 'default' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <motion.button
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'border border-zinc-700 hover:border-zinc-600',
        'bg-zinc-800/50 hover:bg-zinc-700/50',
        'text-zinc-300 hover:text-white',
        isPlaying && 'bg-[#627eea]/20 border-[#627eea]',
        sizeClasses[size],
        className
      )}
      onClick={isPlaying ? onPause : onPlay}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isPlaying ? (
        <Pause className={iconSizes[size]} />
      ) : (
        <Play className={cn(iconSizes[size], 'ml-0.5')} />
      )}
    </motion.button>
  )
}