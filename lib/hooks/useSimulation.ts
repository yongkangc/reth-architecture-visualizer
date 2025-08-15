import { useState, useCallback, useRef } from "react"

interface UseSimulationOptions {
  onStep: () => void | Promise<void>
  interval?: number
  onComplete?: () => void
}

export function useSimulation({ onStep, interval = 1000, onComplete }: UseSimulationOptions) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    setIsPlaying(true)
    
    const runStep = async () => {
      await onStep()
      
      intervalRef.current = setTimeout(runStep, interval / speed)
    }
    
    runStep()
  }, [onStep, interval, speed])

  const pause = useCallback(() => {
    setIsPlaying(false)
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    pause()
    // Reset logic is handled by the component
  }, [pause])

  const step = useCallback(async () => {
    if (!isPlaying) {
      await onStep()
    }
  }, [isPlaying, onStep])

  return {
    isPlaying,
    speed,
    setSpeed,
    start,
    pause,
    reset,
    step
  }
}