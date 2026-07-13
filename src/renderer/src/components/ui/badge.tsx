import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@renderer/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-xs font-medium font-mono-label', {
  variants: {
    variant: {
      neutral: 'bg-surface-2 border border-border text-text-muted',
      success: 'bg-success/15 text-success border border-success/30',
      warning: 'bg-warning/15 text-warning border border-warning/30',
      danger: 'bg-danger/15 text-danger border border-danger/30',
      primary: 'bg-primary/15 text-primary border border-primary/30'
    }
  },
  defaultVariants: { variant: 'neutral' }
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
