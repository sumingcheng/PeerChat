import React, { useState } from 'react';
import useChatStore from '@/store/useChatStore';

const ChatInput: React.FC = () => {
  const sendMessage = useChatStore(state => state.sendMessage);
  const [message, setMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && sendMessage) {
      sendMessage(message);
      setMessage('');
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
          placeholder="输入消息..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          发送
        </button>
      </div>
    </form>
  );
};

export default ChatInput; 