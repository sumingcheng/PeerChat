import React from 'react';
import { Toaster } from 'react-hot-toast';
import ChatLayout from '@/page/layout/ChatLayout';
import ChatPanel from '@/page/chat/ChatPanel';

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-center" />
      <ChatLayout>
        <ChatPanel />
      </ChatLayout>
    </>
  );
};

export default App;
