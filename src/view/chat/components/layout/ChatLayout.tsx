import React from 'react';
import Sidebar from '../sidebar/Sidebar';

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-80 bg-white border-r border-gray-200">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default ChatLayout; 