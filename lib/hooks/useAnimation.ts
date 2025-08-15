import { useState, useRef, useCallback } from 'react'

export interface AnimationState {
  isAnimating: boolean
  isPlaying: boolean
  isPaused: boolean
  speed: number
}

export interface AnimationControls {
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  setSpeed: (speed: number) => void
}

export interface UseAnimationOptions {
  initialSpeed?: number
  autoStart?: boolean
  onStart?: () => void
  onStop?: () => void
  onPause?: () => void
  onResume?: () => void
  onReset?: () => void
}

export function useAnimation(options: UseAnimationOptions = {}) {
  const {
    initialSpeed = 1,
    autoStart = false,
    onStart,
    onStop,
    onPause,
    onResume,
    onReset
  } = options

  const [isAnimating, setIsAnimating] = useState(autoStart)
  const [isPlaying, setIsPlaying] = useState(autoStart)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(initialSpeed)
  
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setIsAnimating(true)
    setIsPlaying(true)
    setIsPaused(false)
    onStart?.()
  }, [onStart])

  const stop = useCallback(() => {
    cleanup()
    setIsAnimating(false)
    setIsPlaying(false)
    setIsPaused(false)
    onStop?.()
  }, [cleanup, onStop])

  const pause = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(true)
    onPause?.()
  }, [onPause])

  const resume = useCallback(() => {
    setIsPlaying(true)
    setIsPaused(false)
    onResume?.()
  }, [onResume])

  const reset = useCallback(() => {
    cleanup()
    setIsAnimating(false)
    setIsPlaying(false)
    setIsPaused(false)
    setSpeed(initialSpeed)
    onReset?.()
  }, [cleanup, initialSpeed, onReset])

  const updateSpeed = useCallback((newSpeed: number) => {
    setSpeed(Math.max(0.1, Math.min(3, newSpeed)))
  }, [])

  const state: AnimationState = {
    isAnimating,
    isPlaying,
    isPaused,
    speed
  }

  const controls: AnimationControls = {
    start,
    stop,
    pause,
    resume,
    reset,
    setSpeed: updateSpeed
  }

  return {
    state,
    controls,
    timeoutRef,
    animationRef,
    cleanup
  }
}