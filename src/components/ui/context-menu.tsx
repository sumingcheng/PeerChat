import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'

export const ContextMenu = ContextMenuPrimitive.Root
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger
export const ContextMenuContent = ContextMenuPrimitive.Content
export const ContextMenuItem = ContextMenuPrimitive.Item
export const ContextMenuSeparator = ContextMenuPrimitive.Separator

export function ContextMenuRoot({
  children,
  content
}: {
  children: React.ReactNode
  content: React.ReactNode
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[160px] overflow-hidden rounded-md border bg-white p-1 shadow-md">
        {content}
      </ContextMenuContent>
    </ContextMenu>
  )
} 