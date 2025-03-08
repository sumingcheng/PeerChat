import React, { useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import { Message } from '@/types/chat';

const MessageItem: React.FC<{ message: Message; isOwnMessage: boolean }> = ({ message, isOwnMessage }) => {
  const { currentChat } = useChat();
  
  // 系统消息
  if (message.sender === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
          {message.content}
        </div>
      </div>
    );
  }
  
  // 查找发送者信息
  const senderName = message.senderName || 
    (currentChat?.participants?.find(p => p.id === message.sender)?.name || '未知用户');
  
  // 格式化时间
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwnMessage && (
        <div className="mr-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {senderName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      
      <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg px-3 py-2`}>
        {!isOwnMessage && (
          <div className="text-xs font-medium mb-1 text-gray-500">
            {senderName}
          </div>
        )}
        <div className="break-words">{message.content}</div>
        <div className="text-xs text-right mt-1 opacity-75">
          {formattedTime}
        </div>
      </div>
      
      {isOwnMessage && (
        <div className="ml-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            我
          </div>
        </div>
      )}
    </div>
  );
};

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
            <MessageItem 
              key={message.id} 
              message={message} 
              isOwnMessage={message.sender === userId} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList; 