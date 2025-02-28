import { useChat } from '@/hooks/useChat'
import { Root as SeparatorRoot } from '@radix-ui/react-separator'
import { Close, Provider, Title, Root as ToastRoot, Viewport } from '@radix-ui/react-toast'
import React, { useCallback, useState } from 'react'
import Avatar from '../common/Avatar'
import ChatInput from '../input/ChatInput'
import MessageList from './MessageList'

const ChatPanel: React.FC = () => {
  const { currentChat } = useChat();
  const [open, setOpen] = useState(false);

  const handleCopyInviteLink = useCallback(() => {
    const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${Date.now()}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setOpen(true);
    });
  }, []);

  if (!currentChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 p-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-700">开始一个新的对话</h2>
          <p className="text-gray-500">邀请好友加入聊天，开始实时对话</p>
        </div>
        <button
          onClick={handleCopyInviteLink}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
            transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" 
            />
          </svg>
          <span>复制邀请链接</span>
        </button>

        <Provider swipeDirection="right">
          <ToastRoot
            className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-4 border border-gray-200"
            open={open}
            onOpenChange={setOpen}
            duration={3000}
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <Title className="text-gray-900 font-medium">
                邀请链接已复制
              </Title>
            </div>
            <Close className="rounded-full p-1 hover:bg-gray-100">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Close>
          </ToastRoot>
          <Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-auto max-w-[420px] m-0 list-none z-50" />
        </Provider>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center">
        <Avatar src={currentChat.avatar} alt={currentChat.name} size="sm" />
        <h2 className="ml-3 font-medium">{currentChat.name}</h2>
      </div>
      <SeparatorRoot className="h-[1px] bg-gray-100" />
      <MessageList />
      <SeparatorRoot className="h-[1px] bg-gray-100" />
      <ChatInput />
    </div>
  );
};

export default ChatPanel; 