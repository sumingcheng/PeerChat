import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  children,
  className = '',
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Content
      className={`z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg ${className}`}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow className="fill-gray-800" />
    </TooltipPrimitive.Content>
  );
}
