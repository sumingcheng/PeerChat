import React from 'react';
import { ChatListItemProps } from '@/types/chat';
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
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white">
            {chat.name.charAt(0).toUpperCase()}
          </div>
          {/* 未读消息标记，如果需要可以添加 */}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {chat.name}
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