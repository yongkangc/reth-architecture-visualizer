import { useState, useRef, useCallback } from 'react'

export interface ScenarioStep<T = any> {
  id: string
  component: T
  action: string
  duration: number
  highlight?: T[]
  data?: any
}

export interface Scenario<T = any> {
  id: string
  name: string
  description: string
  steps: ScenarioStep<T>[]
  color?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface ScenarioState<T = any> {
  currentScenario: string | null
  currentStep: number
  isRunning: boolean
  progress: number
  activeComponent: T | null
  highlightedComponents: T[]
}

export interface ScenarioControls<T = any> {
  runScenario: (scenarioId: string) => void
  stopScenario: () => void
  pauseScenario: () => void
  resumeScenario: () => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
}

export interface UseScenarioOptions<T = any> {
  scenarios: Scenario<T>[]
  onStepChange?: (step: ScenarioStep<T>, stepIndex: number) => void
  onScenarioComplete?: (scenario: Scenario<T>) => void
  onScenarioStart?: (scenario: Scenario<T>) => void
  onScenarioStop?: () => void
  autoHighlight?: boolean
}

export function useScenario<T = any>(options: UseScenarioOptions<T>) {
  const {
    scenarios,
    onStepChange,
    onScenarioComplete,
    onScenarioStart,
    onScenarioStop,
    autoHighlight = true
  } = options

  const [currentScenario, setCurrentScenario] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeComponent, setActiveComponent] = useState<T | null>(null)
  const [highlightedComponents, setHighlightedComponents] = useState<T[]>([])

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const getCurrentScenario = useCallback(() => {
    return scenarios.find(s => s.id === currentScenario)
  }, [scenarios, currentScenario])

  const getCurrentStep = useCallback(() => {
    const scenario = getCurrentScenario()
    if (!scenario || currentStep >= scenario.steps.length) return null
    return scenario.steps[currentStep]
  }, [getCurrentScenario, currentStep])

  const updateComponentStates = useCallback((step: ScenarioStep<T>) => {
    if (autoHighlight) {
      setActiveComponent(step.component)
      setHighlightedComponents(step.highlight || [])
    }
    onStepChange?.(step, currentStep)
  }, [autoHighlight, onStepChange, currentStep])

  const executeStep = useCallback((stepIndex: number) => {
    const scenario = getCurrentScenario()
    if (!scenario || stepIndex >= scenario.steps.length) {
      // Scenario complete
      setIsRunning(false)
      setActiveComponent(null)
      setHighlightedComponents([])
      onScenarioComplete?.(scenario!)
      return
    }

    const step = scenario.steps[stepIndex]
    setCurrentStep(stepIndex)
    updateComponentStates(step)

    if (!isPaused) {
      timeoutRef.current = setTimeout(() => {
        executeStep(stepIndex + 1)
      }, step.duration)
    }
  }, [getCurrentScenario, updateComponentStates, isPaused, onScenarioComplete])

  const runScenario = useCallback((scenarioId: string) => {
    cleanup()
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    setCurrentScenario(scenarioId)
    setCurrentStep(0)
    setIsRunning(true)
    setIsPaused(false)
    onScenarioStart?.(scenario)
    executeStep(0)
  }, [scenarios, cleanup, onScenarioStart, executeStep])

  const stopScenario = useCallback(() => {
    cleanup()
    setCurrentScenario(null)
    setCurrentStep(0)
    setIsRunning(false)
    setIsPaused(false)
    setActiveComponent(null)
    setHighlightedComponents([])
    onScenarioStop?.()
  }, [cleanup, onScenarioStop])

  const pauseScenario = useCallback(() => {
    cleanup()
    setIsPaused(true)
  }, [cleanup])

  const resumeScenario = useCallback(() => {
    if (!isPaused || !currentScenario) return
    setIsPaused(false)
    executeStep(currentStep + 1)
  }, [isPaused, currentScenario, currentStep, executeStep])

  const goToStep = useCallback((stepIndex: number) => {
    const scenario = getCurrentScenario()
    if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) return

    cleanup()
    setCurrentStep(stepIndex)
    const step = scenario.steps[stepIndex]
    updateComponentStates(step)
  }, [getCurrentScenario, cleanup, updateComponentStates])

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1)
  }, [goToStep, currentStep])

  const previousStep = useCallback(() => {
    goToStep(currentStep - 1)
  }, [goToStep, currentStep])

  const progress = getCurrentScenario() 
    ? (currentStep / Math.max(1, getCurrentScenario()!.steps.length)) * 100
    : 0

  const state: ScenarioState<T> = {
    currentScenario,
    currentStep,
    isRunning,
    progress,
    activeComponent,
    highlightedComponents
  }

  const controls: ScenarioControls<T> = {
    runScenario,
    stopScenario,
    pauseScenario,
    resumeScenario,
    nextStep,
    previousStep,
    goToStep
  }

  return {
    state,
    controls,
    currentStepData: getCurrentStep(),
    scenario: getCurrentScenario(),
    cleanup
  }
}