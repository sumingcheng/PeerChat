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
        }}
      />
    </ChatProvider>
  );
};

export default ChatPage;
