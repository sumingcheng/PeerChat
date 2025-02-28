import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const { setMessages } = useChat();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      content: message,
      time: new Date().toLocaleTimeString(),
      status: 'sending' as const,
      senderId: 'currentUser',
      sender: {
        name: '当前用户',
        avatar: '/default-avatar.png'
      }
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          placeholder="输入消息..."
          className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
        >
          发送
        </button>
      </div>
    </form>
  );
};

export default ChatInput; 