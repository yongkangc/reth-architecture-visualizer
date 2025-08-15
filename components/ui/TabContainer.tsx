import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Tab<T = string> {
  id: T
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  disabled?: boolean
  closeable?: boolean
}

export interface TabContainerProps<T = string> {
  tabs: Tab<T>[]
  activeTab: T | null
  persistentTab?: T | null
  onTabChange: (tabId: T) => void
  onTabClose?: (tabId: T) => void
  onTabTogglePersistent?: (tabId: T) => void
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  showCloseButtons?: boolean
  allowPersistent?: boolean
  className?: string
  tabClassName?: string
  children?: React.ReactNode
}

const variantStyles = {
  default: {
    container: 'border-b border-zinc-800',
    tab: 'px-4 py-2 border-b-2 border-transparent',
    activeTab: 'border-[#627eea] text-[#627eea]',
    hoverTab: 'border-zinc-600 text-zinc-300'
  },
  pills: {
    container: 'bg-zinc-900/50 rounded-lg p-1',
    tab: 'px-3 py-1.5 rounded-md',
    activeTab: 'bg-[#627eea] text-white',
    hoverTab: 'bg-zinc-700/50 text-zinc-300'
  },
  underline: {
    container: '',
    tab: 'px-3 py-2 relative',
    activeTab: 'text-[#627eea] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#627eea]',
    hoverTab: 'text-zinc-300'
  }
}

const sizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
}

export function TabContainer<T extends string | number>({
  tabs,
  activeTab,
  persistentTab,
  onTabChange,
  onTabClose,
  onTabTogglePersistent,
  variant = 'default',
  size = 'md',
  showCloseButtons = false,
  allowPersistent = false,
  className,
  tabClassName,
  children
}: TabContainerProps<T>) {
  const styles = variantStyles[variant]

  const handleTabClick = (tabId: T) => {
    if (allowPersistent && onTabTogglePersistent) {
      onTabTogglePersistent(tabId)
    } else {
      onTabChange(tabId)
    }
  }

  const isTabActive = (tabId: T) => {
    return activeTab === tabId || persistentTab === tabId
  }

  const isTabPersistent = (tabId: T) => {
    return persistentTab === tabId
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className={cn('flex items-center', styles.container)}>
        <div className="flex items-center gap-1 flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = isTabActive(tab.id)
            const isPersistent = isTabPersistent(tab.id)
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'relative flex items-center gap-2 font-medium transition-all duration-200',
                  'text-zinc-400 hover:text-zinc-300',
                  styles.tab,
                  isActive && styles.activeTab,
                  !isActive && styles.hoverTab,
                  isPersistent && 'ring-1 ring-[#627eea]/30',
                  tab.disabled && 'opacity-50 cursor-not-allowed',
                  sizeStyles[size],
                  tabClassName
                )}
                whileHover={!tab.disabled ? { scale: 1.02 } : undefined}
                whileTap={!tab.disabled ? { scale: 0.98 } : undefined}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{tab.label}</span>
                
                {/* Badge */}
                {tab.badge && (
                  <span className="px-1.5 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded-full">
                    {tab.badge}
                  </span>
                )}
                
                {/* Persistent indicator */}
                {isPersistent && (
                  <div className="w-1.5 h-1.5 bg-[#627eea] rounded-full" />
                )}
                
                {/* Close button */}
                {(showCloseButtons || isPersistent) && (tab.closeable !== false) && onTabClose && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTabClose(tab.id)
                    }}
                    className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// Simple tabs without persistence
export function SimpleTabs<T extends string | number>({
  tabs,
  activeTab,
  onTabChange,
  className,
  ...props
}: Omit<TabContainerProps<T>, 'persistentTab' | 'onTabTogglePersistent' | 'allowPersistent'>) {
  return (
    <TabContainer
      {...props}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      allowPersistent={false}
      className={className}
    />
  )
}

// Pills variant
export function PillTabs<T extends string | number>(
  props: Omit<TabContainerProps<T>, 'variant'>
) {
  return <TabContainer {...props} variant="pills" />
}

// Underline variant
export function UnderlineTabs<T extends string | number>(
  props: Omit<TabContainerProps<T>, 'variant'>
) {
  return <TabContainer {...props} variant="underline" />
}

// Hook for managing tab state
export function useTabs<T extends string | number>(
  initialTab?: T,
  allowPersistent = false
) {
  const [activeTab, setActiveTab] = React.useState<T | null>(initialTab || null)
  const [persistentTab, setPersistentTab] = React.useState<T | null>(null)

  const handleTabChange = React.useCallback((tabId: T) => {
    setActiveTab(tabId)
  }, [])

  const handleTabClose = React.useCallback((tabId: T) => {
    if (persistentTab === tabId) {
      setPersistentTab(null)
    }
    if (activeTab === tabId) {
      setActiveTab(null)
    }
  }, [activeTab, persistentTab])

  const handleTabTogglePersistent = React.useCallback((tabId: T) => {
    if (!allowPersistent) {
      setActiveTab(tabId)
      return
    }

    if (persistentTab === tabId) {
      // Close persistent tab
      setPersistentTab(null)
      setActiveTab(null)
    } else {
      // Make tab persistent
      setPersistentTab(tabId)
      setActiveTab(tabId)
    }
  }, [persistentTab, allowPersistent])

  const clearTabs = React.useCallback(() => {
    setActiveTab(null)
    setPersistentTab(null)
  }, [])

  return {
    activeTab,
    persistentTab,
    handleTabChange,
    handleTabClose,
    handleTabTogglePersistent,
    clearTabs,
    setActiveTab,
    setPersistentTab
  }
}