import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        primary: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
        secondary: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        destructive: 'bg-red-100 text-red-600 hover:bg-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className = '', variant, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  )
} 