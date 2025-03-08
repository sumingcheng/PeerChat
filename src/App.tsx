import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ChatLayout from './view/chat/components/layout/ChatLayout';
import ChatPanel from './view/chat/components/chat/ChatPanel';

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={
          <ChatLayout>
            <ChatPanel />
          </ChatLayout>
        } />
      </Routes>
    </Router>
  );
};

export default App;
