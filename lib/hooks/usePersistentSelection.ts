import { useState, useCallback } from 'react'

export interface SelectionState<T = any> {
  activeItem: T | null
  persistentItem: T | null
  hoveredItem: T | null
  isItemPersistent: (item: T) => boolean
  isItemActive: (item: T) => boolean
  isItemHovered: (item: T) => boolean
}

export interface SelectionControls<T = any> {
  selectItem: (item: T) => void
  clearSelection: () => void
  togglePersistent: (item: T) => void
  setHovered: (item: T | null) => void
  handleItemClick: (item: T) => void
  handleItemHover: (item: T) => void
  handleItemLeave: () => void
}

export interface UsePersistentSelectionOptions<T = any> {
  allowHover?: boolean
  autoSelectOnHover?: boolean
  onSelectionChange?: (item: T | null) => void
  onPersistentChange?: (item: T | null) => void
  onHoverChange?: (item: T | null) => void
  isEqual?: (a: T, b: T) => boolean
}

export function usePersistentSelection<T = any>(
  options: UsePersistentSelectionOptions<T> = {}
) {
  const {
    allowHover = true,
    autoSelectOnHover = true,
    onSelectionChange,
    onPersistentChange,
    onHoverChange,
    isEqual = (a: T, b: T) => a === b
  } = options

  const [activeItem, setActiveItem] = useState<T | null>(null)
  const [persistentItem, setPersistentItem] = useState<T | null>(null)
  const [hoveredItem, setHoveredItem] = useState<T | null>(null)

  const isItemPersistent = useCallback((item: T) => {
    return persistentItem !== null && isEqual(persistentItem, item)
  }, [persistentItem, isEqual])

  const isItemActive = useCallback((item: T) => {
    return (activeItem !== null && isEqual(activeItem, item)) || 
           (persistentItem !== null && isEqual(persistentItem, item))
  }, [activeItem, persistentItem, isEqual])

  const isItemHovered = useCallback((item: T) => {
    return hoveredItem !== null && isEqual(hoveredItem, item)
  }, [hoveredItem, isEqual])

  const selectItem = useCallback((item: T | null) => {
    setActiveItem(item)
    onSelectionChange?.(item)
  }, [onSelectionChange])

  const clearSelection = useCallback(() => {
    setActiveItem(null)
    setPersistentItem(null)
    setHoveredItem(null)
    onSelectionChange?.(null)
    onPersistentChange?.(null)
    onHoverChange?.(null)
  }, [onSelectionChange, onPersistentChange, onHoverChange])

  const togglePersistent = useCallback((item: T) => {
    if (isItemPersistent(item)) {
      setPersistentItem(null)
      setActiveItem(null)
      onPersistentChange?.(null)
      onSelectionChange?.(null)
    } else {
      setPersistentItem(item)
      setActiveItem(item)
      onPersistentChange?.(item)
      onSelectionChange?.(item)
    }
  }, [isItemPersistent, onPersistentChange, onSelectionChange])

  const setHovered = useCallback((item: T | null) => {
    if (!allowHover) return
    setHoveredItem(item)
    onHoverChange?.(item)
    
    if (autoSelectOnHover && !persistentItem) {
      selectItem(item)
    }
  }, [allowHover, autoSelectOnHover, persistentItem, selectItem, onHoverChange])

  const handleItemClick = useCallback((item: T) => {
    togglePersistent(item)
  }, [togglePersistent])

  const handleItemHover = useCallback((item: T) => {
    if (!persistentItem) {
      setHovered(item)
    }
  }, [persistentItem, setHovered])

  const handleItemLeave = useCallback(() => {
    if (!persistentItem) {
      setHovered(null)
    }
  }, [persistentItem, setHovered])

  const state: SelectionState<T> = {
    activeItem,
    persistentItem,
    hoveredItem,
    isItemPersistent,
    isItemActive,
    isItemHovered
  }

  const controls: SelectionControls<T> = {
    selectItem,
    clearSelection,
    togglePersistent,
    setHovered,
    handleItemClick,
    handleItemHover,
    handleItemLeave
  }

  return {
    state,
    controls
  }
}