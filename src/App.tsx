import React from 'react';
import { Toaster } from 'react-hot-toast';
import ChatLayout from './view/chat/components/layout/ChatLayout';
import ChatPanel from './view/chat/components/chat/ChatPanel';

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <ChatLayout>
        <ChatPanel />
      </ChatLayout>
    </>
  );
};

export default App;
