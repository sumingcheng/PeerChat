import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

export function ScrollArea({
  children,
  className = '',
  ...props
}: ScrollAreaPrimitive.ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root className={`relative overflow-hidden ${className}`} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors hover:bg-gray-200"
        orientation="vertical"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-gray-300" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}
