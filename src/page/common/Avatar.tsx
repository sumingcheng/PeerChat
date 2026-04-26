import { AvatarProps } from '@/types/chat.ts';
import React from 'react';

const BG_COLORS = [
  'bg-gray-900',
  'bg-gray-700',
  'bg-gray-600',
  'bg-gray-800',
  'bg-gray-500',
  'bg-gray-700'
];

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  isHost = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  } as const;

  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img src={src} alt={alt} className={`${sizeClass} rounded-full object-cover ${className}`} />
    );
  }

  const charCode = alt ? alt.charCodeAt(0) : 0;
  const bgIndex = charCode % BG_COLORS.length;
  const bgColor = isHost ? 'bg-green-600' : BG_COLORS[bgIndex];

  return (
    <div className={`${sizeClass} rounded-full ${bgColor} flex items-center justify-center text-white font-medium ${className}`}>
      {alt.charAt(0).toUpperCase()}
    </div>
  );
};

export default Avatar;
