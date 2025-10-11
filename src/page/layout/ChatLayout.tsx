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

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 移动端选择聊天后自动关闭侧边栏
  useEffect(() => {
    if (isMobile && currentChat) {
      setIsSidebarOpen(false);
    }
  }, [currentChat, isMobile]);

  // 移动端点击遮罩关闭侧边栏
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* 全局加载指示器 */}
      {isConnecting && (
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 overflow-hidden z-50">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      )}

      {/* 移动端遮罩层 */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={handleOverlayClick} />
      )}

      {/* 侧边栏 */}
      <div
        className={`
        ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-200 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-80 bg-white border-r border-gray-200'
        }
      `}
      >
        <Sidebar />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 移动端顶部工具栏 */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 md:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {currentChat && (
              <div className="flex items-center flex-1 ml-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                  {currentChat.name.charAt(0).toUpperCase()}
                </div>
                <h1 className="ml-3 font-medium text-gray-900 truncate">{currentChat.name}</h1>
              </div>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default ChatLayout;
