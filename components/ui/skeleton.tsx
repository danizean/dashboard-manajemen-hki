// components/ui/skeleton.tsx
// IMPROVEMENT: Menggunakan animasi shimmer baru dari globals.css
import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-shimmer rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
