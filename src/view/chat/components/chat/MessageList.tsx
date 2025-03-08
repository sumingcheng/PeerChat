import useChatStore from '@/store/useChatStore'
import React, { useEffect, useRef } from 'react'
import Message from './Message'

const MessageList: React.FC = () => {
  const messages = useChatStore(state => state.messages);
  const isConnecting = useChatStore(state => state.isConnecting);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-400">
          {isConnecting ? (
            <div className="flex flex-col items-center">
              <svg className="w-10 h-10 mb-3 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>正在连接中，请稍候...</p>
              <p className="text-xs mt-2 text-gray-500">连接可能需要一些时间，取决于网络状况</p>
            </div>
          ) : (
            <div className="text-center">
              <p>暂无消息，开始聊天吧</p>
              <p className="text-xs mt-2 text-gray-500">发送第一条消息，开始对话</p>
            </div>
          )}
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