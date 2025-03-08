import { Toaster } from 'react-hot-toast';
import ChatLayout from './components/layout/ChatLayout';
import ChatPanel from './components/chat/ChatPanel';
import useChatStore, { cleanRoomId } from '@/store/useChatStore';
import { useEffect } from 'react';
import { GroupChat } from '@/types/chat';

const ChatPage = () => {
  const isConnecting = useChatStore(state => state.isConnecting);
  const joinGroupChat = useChatStore(state => state.joinGroupChat);
  const userName = useChatStore(state => state.userName);
  const chats = useChatStore(state => state.chats);
  const setPendingRoomId = useChatStore(state => state.setPendingRoomId);
  const isPeerInitialized = useChatStore(state => state.isPeerInitialized);
  
  // 检查URL中是否包含roomId参数
  useEffect(() => {
    const checkUrlForRoomId = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        
        if (roomId) {
          console.log('index.tsx: 检测到URL中的roomId参数:', roomId);
          const cleanedRoomId = cleanRoomId(roomId);
          
          // 检查是否已经加入了该群聊
          const existingChat = chats.find(chat => 
            chat.isGroup && (chat as GroupChat).roomId === cleanedRoomId
          );
          
          if (existingChat) {
            console.log('已经加入过该群聊，直接切换');
            useChatStore.getState().setCurrentChat(existingChat);
          } else {
            console.log('设置待加入的群聊ID');
            // 设置待加入的群聊ID，ChatPanel组件会处理加入逻辑
            setPendingRoomId(cleanedRoomId);
          }
          
          // 清除URL参数，避免刷新页面时重复加入
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (error) {
        console.error('解析URL参数时出错:', error);
      }
    };
    
    // 页面加载后检查URL
    checkUrlForRoomId();
  }, [chats, setPendingRoomId]);
  
  return (
    <>
      <ChatLayout>
        <ChatPanel />
      </ChatLayout>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            maxWidth: '500px'
          },
          loading: {
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#FFFFFF',
            },
            style: {
              background: '#EFF6FF',
              color: '#1E40AF',
              borderColor: '#93C5FD',
              borderLeft: '4px solid #3B82F6',
            },
            duration: 30000,
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
            style: {
              background: '#ECFDF5',
              color: '#065F46',
              borderLeft: '4px solid #10B981',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
            style: {
              background: '#FEF2F2',
              color: '#B91C1C',
              borderLeft: '4px solid #EF4444',
            },
            duration: 5000,
          },
        }}
      />
      
      {isConnecting && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-100 z-50">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      )}
    </>
  );
};

export default ChatPage;
