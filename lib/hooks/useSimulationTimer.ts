import { useState, useRef, useCallback, useEffect } from 'react'

export interface TimerState {
  currentTime: number
  duration: number
  isPlaying: boolean
  isPaused: boolean
  isCompleted: boolean
  progress: number
  speed: number
}

export interface TimerControls {
  play: () => void
  pause: () => void
  stop: () => void
  reset: () => void
  seekTo: (time: number) => void
  setSpeed: (speed: number) => void
  setDuration: (duration: number) => void
}

export interface UseSimulationTimerOptions {
  duration?: number
  initialSpeed?: number
  autoPlay?: boolean
  loop?: boolean
  onTick?: (currentTime: number, progress: number) => void
  onPlay?: () => void
  onPause?: () => void
  onStop?: () => void
  onComplete?: () => void
  onReset?: () => void
  onSpeedChange?: (speed: number) => void
}

export function useSimulationTimer(options: UseSimulationTimerOptions = {}) {
  const {
    duration: initialDuration = 10000, // 10 seconds default
    initialSpeed = 1,
    autoPlay = false,
    loop = false,
    onTick,
    onPlay,
    onPause,
    onStop,
    onComplete,
    onReset,
    onSpeedChange
  } = options

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(initialDuration)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeedState] = useState(initialSpeed)
  
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)

  const isCompleted = currentTime >= duration
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const updateTime = useCallback(() => {
    if (!isPlaying || isPaused) return

    const now = performance.now()
    const elapsed = (now - startTimeRef.current) * speed
    const newTime = pausedTimeRef.current + elapsed

    if (newTime >= duration) {
      setCurrentTime(duration)
      setIsPlaying(false)
      setIsPaused(false)
      onComplete?.()
      
      if (loop) {
        // Reset and continue
        setCurrentTime(0)
        pausedTimeRef.current = 0
        startTimeRef.current = now
        setIsPlaying(true)
        onTick?.(0, 0)
      }
    } else {
      setCurrentTime(newTime)
      onTick?.(newTime, (newTime / duration) * 100)
      animationFrameRef.current = requestAnimationFrame(updateTime)
    }
  }, [isPlaying, isPaused, speed, duration, onComplete, onTick, loop])

  useEffect(() => {
    if (isPlaying && !isPaused) {
      startTimeRef.current = performance.now()
      updateTime()
    } else {
      cleanup()
    }

    return cleanup
  }, [isPlaying, isPaused, updateTime, cleanup])

  useEffect(() => {
    // Reset if duration changes
    if (currentTime > duration) {
      setCurrentTime(duration)
    }
  }, [duration, currentTime])

  const play = useCallback(() => {
    if (isCompleted && !loop) {
      // Reset if completed
      setCurrentTime(0)
      pausedTimeRef.current = 0
    }
    
    setIsPlaying(true)
    setIsPaused(false)
    onPlay?.()
  }, [isCompleted, loop, onPlay])

  const pause = useCallback(() => {
    pausedTimeRef.current = currentTime
    setIsPlaying(false)
    setIsPaused(true)
    onPause?.()
  }, [currentTime, onPause])

  const stop = useCallback(() => {
    cleanup()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentTime(0)
    pausedTimeRef.current = 0
    onStop?.()
  }, [cleanup, onStop])

  const reset = useCallback(() => {
    cleanup()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentTime(0)
    pausedTimeRef.current = 0
    onReset?.()
  }, [cleanup, onReset])

  const seekTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(duration, time))
    setCurrentTime(clampedTime)
    pausedTimeRef.current = clampedTime
    
    if (isPlaying) {
      startTimeRef.current = performance.now()
    }
    
    onTick?.(clampedTime, (clampedTime / duration) * 100)
  }, [duration, isPlaying, onTick])

  const setSpeed = useCallback((newSpeed: number) => {
    const clampedSpeed = Math.max(0.1, Math.min(5, newSpeed))
    
    if (isPlaying && !isPaused) {
      // Adjust timing when changing speed during playback
      pausedTimeRef.current = currentTime
      startTimeRef.current = performance.now()
    }
    
    setSpeedState(clampedSpeed)
    onSpeedChange?.(clampedSpeed)
  }, [isPlaying, isPaused, currentTime, onSpeedChange])

  const setDurationValue = useCallback((newDuration: number) => {
    setDuration(Math.max(100, newDuration)) // Minimum 100ms
  }, [])

  const state: TimerState = {
    currentTime,
    duration,
    isPlaying,
    isPaused,
    isCompleted,
    progress,
    speed
  }

  const controls: TimerControls = {
    play,
    pause,
    stop,
    reset,
    seekTo,
    setSpeed,
    setDuration: setDurationValue
  }

  return {
    state,
    controls,
    cleanup
  }
}