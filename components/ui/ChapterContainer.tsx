import { cn } from "@/lib/utils"

interface ChapterContainerProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export default function ChapterContainer({ 
  children, 
  className,
  noPadding = false
}: ChapterContainerProps) {
  return (
    <div className={cn(
      "min-h-screen w-full",
      !noPadding && "p-4 sm:p-6 lg:p-8",
      className
    )}>
      {children}
    </div>
  )
}