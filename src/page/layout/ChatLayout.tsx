import useChatStore from '@/store/useChatStore.ts';
import React, { useEffect, useState } from 'react';
import Sidebar from '../sidebar/Sidebar.tsx';

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const isConnecting = useChatStore((state) => state.isConnecting);
  const currentChat = useChatStore((state) => state.currentChat);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isMobile && currentChat) {
      setIsSidebarOpen(false);
    }
  }, [currentChat, isMobile]);

  return (
    <div className="flex h-full p-3 gap-3 relative">
      {isConnecting && (
        <div className="absolute top-0 left-0 w-full h-0.5 z-50 overflow-hidden">
          <div className="h-full w-full bg-blue-600 animate-loading-bar"></div>
        </div>
      )}

      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`
        ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-out ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-80 flex-shrink-0'
        }
      `}
      >
        <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {isMobile && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 mb-3 flex items-center justify-between p-4 md:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {currentChat && (
              <div className="flex items-center flex-1 ml-4">
                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
                  {currentChat.name.charAt(0).toUpperCase()}
                </div>
                <h1 className="ml-3 font-medium text-gray-900 truncate">{currentChat.name}</h1>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
