import { ChatProvider } from '@/context/ChatContext';
import { Toaster } from 'react-hot-toast';
import ChatLayout from './components/layout/ChatLayout';
import ChatPanel from './components/chat/ChatPanel';

const ChatPage = () => {
  return (
    <ChatProvider>
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
            },
            duration: 10000,
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
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
    </ChatProvider>
  );
};

export default ChatPage;
