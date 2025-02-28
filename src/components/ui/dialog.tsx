import * as DialogPrimitive from '@radix-ui/react-dialog'
import { FiX } from 'react-icons/fi'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({
  children,
  className = '',
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md ${className}`}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">
    <DialogPrimitive.Title className="text-xl font-bold">
      {children}
    </DialogPrimitive.Title>
  </div>
) 