import React from 'react';
import Sidebar from '../sidebar/Sidebar.tsx';
import useChatStore from '@/store/useChatStore.ts';

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const isConnecting = useChatStore((state) => state.isConnecting);

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* 全局加载指示器 */}
      {isConnecting && (
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 overflow-hidden z-50">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      )}

      <div className="w-80 bg-white border-r border-gray-200">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
};

export default ChatLayout;
