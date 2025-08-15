import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export default function PageContainer({ 
  children, 
  className 
}: PageContainerProps) {
  return (
    <div className={cn(
      "min-h-screen w-full",
      "px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12",
      className
    )}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}