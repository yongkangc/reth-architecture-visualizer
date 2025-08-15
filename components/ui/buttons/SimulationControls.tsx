import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimulationControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onStep?: () => void
  speed?: number
  onSpeedChange?: (speed: number) => void
  disabled?: boolean
  className?: string
}

export default function SimulationControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onStep,
  speed = 1,
  onSpeedChange,
  disabled = false,
  className = ""
}: SimulationControlsProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--eth-purple)] to-[var(--eth-pink)] rounded-lg font-medium hover:shadow-lg hover:shadow-[var(--eth-purple)]/25 transition-all disabled:opacity-50"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isPlaying ? "Pause" : "Start"}
      </button>
      
      {onStep && (
        <button
          onClick={onStep}
          disabled={disabled || isPlaying}
          className="px-4 py-2 bg-zinc-800 rounded-lg font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      )}
      
      <button
        onClick={onReset}
        className="px-4 py-2 bg-zinc-800 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      
      {onSpeedChange && (
        <>
          <div className="flex-1" />
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
          >
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1x Speed</option>
            <option value={2}>2x Speed</option>
            <option value={4}>4x Speed</option>
          </select>
        </>
      )}
    </div>
  )
}