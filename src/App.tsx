import React from 'react';
import { Toaster } from 'react-hot-toast';
import ChatLayout from '@/page/layout/ChatLayout';
import ChatPanel from '@/page/chat/ChatPanel';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!bg-white !shadow-lg !rounded-lg !text-sm !border !border-gray-100',
          duration: 3000
        }}
      />
      <ChatLayout>
        <ChatPanel />
      </ChatLayout>
    </div>
  );
};

export default App;
