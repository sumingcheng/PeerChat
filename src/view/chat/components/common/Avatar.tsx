import React from 'react'
import { AvatarProps } from '@/types/chat'

const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  } as const;

  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  // 如果没有图片，显示首字母
  return (
    <div className={`${sizeClass} rounded-full bg-blue-500 flex items-center justify-center text-white ${className}`}>
      {alt.charAt(0).toUpperCase()}
    </div>
  );
};

export default Avatar; 