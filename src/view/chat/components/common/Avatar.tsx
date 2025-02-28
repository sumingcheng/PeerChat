import * as RadixAvatar from '@radix-ui/react-avatar'
import React from 'react'
import { AvatarProps } from '@/types/chat'

const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  } as const;

  return (
    <RadixAvatar.Root className={`relative inline-flex ${sizeClasses[size]} ${className}`}>
      <RadixAvatar.Image
        src={src || '/default-avatar.png'}
        alt={alt}
        className="w-full h-full rounded-full object-cover"
      />
      <RadixAvatar.Fallback
        className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500"
        delayMs={600}
      >
        {alt.slice(0, 2).toUpperCase()}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
};

export default Avatar; 