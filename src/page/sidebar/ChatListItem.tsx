import { ChatListItemProps } from '@/types/chat.ts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../common/Avatar.tsx';
import Badge from '../common/Badge.tsx';

const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isActive,
  onClick,
  unreadCount,
  isConnecting = false
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center p-2.5 cursor-pointer rounded-lg transition-colors
        ${isActive
          ? 'bg-blue-50 text-blue-700'
          : 'hover:bg-gray-50 text-gray-700'
        }`}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar alt={chat.name} size="md" />
        {unreadCount && unreadCount > 0 && <Badge count={unreadCount} />}
        {isConnecting && isActive && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white">
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
            {chat.name}
            {isConnecting && isActive && (
              <span className="ml-1 text-xs text-blue-500 font-normal">{t('chatListItem.connecting')}</span>
            )}
          </h3>
          {chat.lastMessageTime && (
            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
              {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {chat.lastMessage && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{chat.lastMessage}</p>
        )}
      </div>
    </div>
  );
};

export default ChatListItem;
