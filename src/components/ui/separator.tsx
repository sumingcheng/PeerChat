import * as SeparatorPrimitive from '@radix-ui/react-separator';

export function Separator({
  className = '',
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      className={`bg-gray-200 ${
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'
      } ${className}`}
      orientation={orientation}
      {...props}
    />
  );
}
