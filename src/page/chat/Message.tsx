import useChatStore from '@/store/useChatStore.ts';
import { GroupChat, Message as MessageType } from '@/types/chat.ts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../common/Avatar.tsx';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { t } = useTranslation();
  const userId = useChatStore((state) => state.userId);
  const currentChat = useChatStore((state) => state.currentChat);
  const isOwn = message.sender === userId;

  const isHost =
    message.isHost ||
    (currentChat &&
      currentChat.isGroup &&
      ((currentChat as GroupChat).roomId === message.sender ||
        (message.roomId && message.sender === message.roomId)));

  if (message.sender === 'system') {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
          {message.content}
        </div>
      </div>
    );
  }

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const messageStatus = message.status || (isOwn ? 'sent' : undefined);

  const getStatusIndicator = () => {
    if (!isOwn) { return null; }
    switch (messageStatus) {
      case 'sending':
        return (
          <span className="ml-2 flex items-center text-gray-400">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('message.sending')}
          </span>
        );
      case 'sent':
        return <span className="ml-2 text-gray-400">{t('message.sent')}</span>;
      case 'delivered':
        return <span className="ml-2 text-blue-500">{t('message.delivered')}</span>;
      case 'read':
        return <span className="ml-2 text-green-500">{t('message.read')}</span>;
      case 'error':
        return (
          <span className="ml-2 text-red-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('message.failed')}
          </span>
        );
      default:
        return <span className="ml-2 text-gray-400">{t('message.sent')}</span>;
    }
  };

  const getBubbleStyle = () => {
    if (isOwn) {
      if (messageStatus === 'error') {
        return 'bg-red-50 text-red-700 border border-red-200';
      }
      return 'bg-blue-600 text-white';
    }
    return 'bg-gray-100 text-gray-900';
  };

  return (
    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <Avatar alt={message.senderName || t('message.user')} size="sm" className={isOwn ? 'ml-3' : 'mr-3'} />
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && message.senderName && (
          <div className="text-xs font-medium mb-1 text-gray-500">
            {message.senderName}
            {isHost && <span className="ml-1 text-green-600 font-semibold">{t('message.host')}</span>}
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2 text-sm break-words ${getBubbleStyle()}`}>
          {message.content}
        </div>
        <div className="mt-1 text-xs text-gray-400 flex items-center">
          <span>{formattedTime}</span>
          {getStatusIndicator()}
        </div>
      </div>
    </div>
  );
};

export default Message;
