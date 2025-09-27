import React from 'react';
import { Theme } from '@radix-ui/themes';
import { BadgeProps } from '@/types/chat.ts';

const Badge: React.FC<BadgeProps> = ({ count, className = '' }) => {
  if (!count) return null;

  return (
    <Theme>
      <div
        className={`absolute -top-1 -right-1 bg-red-500 text-white 
          rounded-full min-w-[20px] h-5 flex items-center justify-center 
          text-xs px-1.5 ${className}`}
        style={{
          boxShadow: '0 0 0 2px white',
          transform: 'scale(0.9)'
        }}
      >
        {count > 99 ? '99+' : count}
      </div>
    </Theme>
  );
};

export default Badge;
