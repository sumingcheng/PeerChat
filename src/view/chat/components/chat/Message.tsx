import useChatStore from '@/store/useChatStore'
import { Message as MessageType } from '@/types/chat'
import React from 'react'
import Avatar from '../common/Avatar'

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const userId = useChatStore(state => state.userId);
  const isOwn = message.sender === userId;
  
  // 系统消息特殊处理
  if (message.sender === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
          {message.content}
        </div>
      </div>
    );
  }

  // 格式化时间
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <Avatar 
        alt={message.senderName || '用户'} 
        size="sm"
        className={isOwn ? 'ml-3' : 'mr-3'}
      />
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && message.senderName && (
          <div className="text-xs font-medium mb-1 text-gray-500">
            {message.senderName}
          </div>
        )}
        <div
          className={`rounded-lg p-3 break-words ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {message.content}
        </div>
        <div className="mt-1 text-xs text-gray-500 flex items-center">
          <span>{formattedTime}</span>
          {isOwn && (
            <span className="ml-2">
              已发送
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message; 