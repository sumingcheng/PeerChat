import React, { useState } from 'react';
import useChatStore from '@/store/useChatStore';
import toast from 'react-hot-toast';

const ChatInput: React.FC = () => {
  const sendMessage = useChatStore(state => state.sendMessage);
  const isConnecting = useChatStore(state => state.isConnecting);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && sendMessage && !isConnecting) {
      setIsSending(true);
      try {
        await sendMessage(message);
        setMessage('');
      } catch (error) {
        console.error('发送消息失败:', error);
        toast.error('发送消息失败，请重试');
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <form 
      onSubmit={handleSendMessage}
      className="p-4 bg-white border-t border-gray-200"
    >
      <div className="flex items-center">
        <input
          type="text"
          placeholder={isConnecting ? "正在连接中..." : "输入消息..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isConnecting || isSending}
        />
        <button
          type="submit"
          disabled={isConnecting || isSending || !message.trim()}
          className={`px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[80px] flex items-center justify-center
            ${(isConnecting || isSending || !message.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSending ? (
            <>
              <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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