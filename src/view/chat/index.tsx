import { ChatProvider } from '@/context/ChatContext';
import ChatLayout from './components/layout/ChatLayout';
import ChatPanel from './components/chat/ChatPanel';

const ChatPage = () => {
  return (
    <ChatProvider>
      <ChatLayout>
        <ChatPanel />
      </ChatLayout>
    </ChatProvider>
  );
};

export default ChatPage;
