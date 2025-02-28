import React from 'react';
import { ChatListItemProps } from '@/types/chat';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { Root as SeparatorRoot } from '@radix-ui/react-separator';

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, isActive, onClick }) => {
  return (
    <>
      <div
        className={`flex items-center p-4 cursor-pointer transition-colors
          ${isActive ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
        onClick={onClick}
      >
        <div className="relative">
          <Avatar src={chat.avatar} alt={chat.name} size="md" />
          <Badge count={chat.unreadCount} />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {chat.name}
            </h3>
            {chat.lastMessage && (
              <span className="text-xs text-gray-500">
                {chat.lastMessage.time}
              </span>
            )}
          </div>
          {chat.lastMessage && (
            <p className="text-sm text-gray-500 truncate">
              {chat.lastMessage.content}
            </p>
          )}
        </div>
      </div>
      <SeparatorRoot className="h-[1px] bg-gray-100" />
    </>
  );
};

export default ChatListItem; 