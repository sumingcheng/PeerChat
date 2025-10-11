import useChatStore from '@/store/useChatStore.ts';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const ChatInput: React.FC = () => {
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const currentChat = useChatStore((state) => state.currentChat);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && !isConnecting && !isSending) {
      inputRef.current.focus();
    }
  }, [isConnecting, isSending]);

  // 当聊天切换时也重新聚焦
  useEffect(() => {
    if (inputRef.current && currentChat) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && sendMessage && !isConnecting) {
      setIsSending(true);
      try {
        // 使用 MessageService 发送消息
        sendMessage(message);
        setMessage('');
      } catch (error) {
        console.error('发送消息失败:', error);
        toast.error('发送消息失败，请重试');
      } finally {
        setIsSending(false);
        // 发送完成后重新聚焦输入框
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 0);
      }
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 如果按下Enter键且没有按下Shift键，发送消息
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isConnecting && !isSending) {
        handleSendMessage(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="p-3 md:p-4 bg-white border-t border-gray-200">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder={isConnecting ? '正在连接中...' : '输入消息...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 md:px-4 py-2 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          disabled={isConnecting || isSending}
          autoFocus
        />
        <button
          type="submit"
          disabled={isConnecting || isSending || !message.trim()}
          className={`px-3 md:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[70px] md:min-w-[80px] flex items-center justify-center text-sm md:text-base
            ${isConnecting || isSending || !message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSending ? (
            <>
              <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              发送中
            </>
          ) : (
            '发送'
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
