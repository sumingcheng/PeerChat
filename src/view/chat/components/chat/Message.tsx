import { useChat } from '@/context/ChatContext'
import { Message as MessageType } from '@/types/chat'
import React from 'react'

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { userId } = useChat();
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

  return (
    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white ${isOwn ? 'ml-3' : 'mr-3'}`}>
        {message.senderName ? message.senderName.charAt(0).toUpperCase() : '?'}
      </div>
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg p-3 ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {message.content}
        </div>
        <div className="mt-1 text-xs text-gray-500 flex items-center">
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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