import React, { useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import Message from './Message';

const MessageList: React.FC = () => {
  const { messages, userId } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-400">
          暂无消息，开始聊天吧
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList; 