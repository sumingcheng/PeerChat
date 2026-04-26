import { BadgeProps } from '@/types/chat.ts';
import React from 'react';

const Badge: React.FC<BadgeProps> = ({ count, className = '' }) => {
  if (!count) { return null; }

  return (
    <div
      className={`absolute -top-1 -right-1 bg-blue-600 text-white 
        rounded-full min-w-[18px] h-[18px] flex items-center justify-center 
        text-[10px] font-medium px-1 ring-2 ring-white ${className}`}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
};

export default Badge;
