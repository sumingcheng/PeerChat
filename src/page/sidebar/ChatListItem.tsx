import { ChatListItemProps } from '@/types/chat.ts'
import { Root as SeparatorRoot } from '@radix-ui/react-separator'
import React from 'react'
import Avatar from '../common/Avatar.tsx'
import Badge from '../common/Badge.tsx'

const ChatListItem: React.FC<ChatListItemProps> = ({ 
  chat, 
  isActive, 
  onClick, 
  unreadCount,
  isConnecting = false 
}) => {
  return (
    <>
      <div
        className={`flex items-center p-4 cursor-pointer transition-colors
          ${isActive ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
        onClick={onClick}
      >
        <div className="relative">
          <Avatar alt={chat.name} size="md" />
          {unreadCount && unreadCount > 0 && <Badge count={unreadCount} />}
          
          {/* 连接中状态指示器 */}
          {isConnecting && isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
            </div>
          )}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {chat.name}
              {isConnecting && isActive && (
                <span className="ml-1 text-xs text-blue-500">(连接中...)</span>
              )}
            </h3>
            {chat.lastMessageTime && (
              <span className="text-xs text-gray-500">
                {new Date(chat.lastMessageTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
          {chat.lastMessage && (
            <p className="text-sm text-gray-500 truncate">
              {chat.lastMessage}
            </p>
          )}
        </div>
      </div>
      <SeparatorRoot className="h-[1px] bg-gray-100" />
    </>
  );
};

export default ChatListItem; 