import { useChat } from '@/context/ChatContext'
import { Root as SeparatorRoot } from '@radix-ui/react-separator'
import { Close, Provider, Title, Root as ToastRoot, Viewport } from '@radix-ui/react-toast'
import React, { useCallback, useState, useEffect } from 'react'
import { Root, Trigger, Portal, Overlay, Content, Description } from '@radix-ui/react-dialog'
import Avatar from '../common/Avatar'
import ChatInput from '../input/ChatInput'
import MessageList from './MessageList'
import GroupChatHeader from '../group/GroupChatHeader'
import GroupUserList from '../group/GroupUserList'
import { GroupChat } from '@/types/chat'
import { chatEvents } from '@/context/ChatContext'

const overlayShow = 'animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]';
const contentShow = 'animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]';

const ChatPanel: React.FC = () => {
  const { currentChat, createGroupChat, userName, setUserName } = useChat();
  const [open, setOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState('');

  // 监听事件
  useEffect(() => {
    const handleError = (message: string) => {
      setToastMessage(message);
      setToastType('error');
      setOpen(true);
    };
    
    const handleGroupCreated = () => {
      setToastMessage('群聊创建成功');
      setToastType('success');
      setOpen(true);
    };
    
    const handleJoinedGroup = () => {
      setToastMessage('成功加入群聊');
      setToastType('success');
      setOpen(true);
    };
    
    const handleLeftGroup = () => {
      setToastMessage('已离开群聊');
      setToastType('info');
      setOpen(true);
    };
    
    chatEvents.on('error', handleError);
    chatEvents.on('groupCreated', handleGroupCreated);
    chatEvents.on('joinedGroup', handleJoinedGroup);
    chatEvents.on('leftGroup', handleLeftGroup);
    
    return () => {
      chatEvents.off('error', handleError);
      chatEvents.off('groupCreated', handleGroupCreated);
      chatEvents.off('joinedGroup', handleJoinedGroup);
      chatEvents.off('leftGroup', handleLeftGroup);
    };
  }, []);

  const handleCreateGroupChat = useCallback(() => {
    if (!userName) {
      setNameDialogOpen(true);
      return;
    }
    createGroupChat?.();
  }, [createGroupChat, userName]);

  const handleSetUserName = () => {
    if (tempUserName.trim()) {
      setUserName?.(tempUserName);
      setNameDialogOpen(false);
      createGroupChat?.();
    } else {
      setToastMessage('请输入有效的用户名');
      setToastType('error');
      setOpen(true);
    }
  };

  if (!currentChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 p-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-700">开始一个新的对话</h2>
          <p className="text-gray-500">创建一个群聊，邀请好友加入实时对话</p>
        </div>
        
        <button
          onClick={handleCreateGroupChat}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
            transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
          <span>创建群聊</span>
        </button>

        {/* 用户名输入对话框 */}
        <Root open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
          <Portal>
            <Overlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
            <Content 
              className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
                w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none
                ${contentShow}`}
            >
              <Title className="text-xl font-semibold mb-4">设置您的用户名</Title>
              <Description className="text-gray-500 mb-4">
                在创建群聊前，请先设置您的用户名：
              </Description>
              <input
                type="text"
                value={tempUserName}
                onChange={(e) => setTempUserName(e.target.value)}
                placeholder="请输入您的用户名"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setNameDialogOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleSetUserName}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  确定
                </button>
              </div>
            </Content>
          </Portal>
        </Root>

        <Provider swipeDirection="right">
          <ToastRoot
            className={`bg-white rounded-lg shadow-lg p-4 flex items-center gap-4 border ${
              toastType === 'success' ? 'border-green-200' : 
              toastType === 'error' ? 'border-red-200' : 'border-gray-200'
            }`}
            open={open}
            onOpenChange={setOpen}
            duration={3000}
          >
            <div className="flex items-center gap-3">
              {toastType === 'success' && (
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toastType === 'error' && (
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              )}
              {toastType === 'info' && (
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              )}
              <Title className="text-gray-900 font-medium">
                {toastMessage}
              </Title>
            </div>
            <Close className="rounded-full p-1 hover:bg-gray-100">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Close>
          </ToastRoot>
          <Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-auto max-w-[420px] m-0 list-none z-50" />
        </Provider>
      </div>
    );
  }

  // 判断是否为群聊
  const isGroupChat = currentChat.isGroup;

  return (
    <div className="h-full flex flex-col">
      {isGroupChat ? (
        // 群聊界面
        <>
          <GroupChatHeader />
          <div className="flex flex-1 overflow-hidden">
            <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
              <GroupUserList />
            </div>
            <div className="flex-1 flex flex-col">
              <MessageList />
              <SeparatorRoot className="h-[1px] bg-gray-100" />
              <ChatInput />
            </div>
          </div>
        </>
      ) : (
        // 普通聊天界面
        <>
          <div className="p-4 flex items-center border-b border-gray-200">
            <Avatar src={currentChat.avatar} alt={currentChat.name} size="sm" />
            <h2 className="ml-3 font-medium">{currentChat.name}</h2>
          </div>
          <SeparatorRoot className="h-[1px] bg-gray-100" />
          <MessageList />
          <SeparatorRoot className="h-[1px] bg-gray-100" />
          <ChatInput />
        </>
      )}
      
      <Provider swipeDirection="right">
        <ToastRoot
          className={`bg-white rounded-lg shadow-lg p-4 flex items-center gap-4 border ${
            toastType === 'success' ? 'border-green-200' : 
            toastType === 'error' ? 'border-red-200' : 'border-gray-200'
          }`}
          open={open}
          onOpenChange={setOpen}
          duration={3000}
        >
          <div className="flex items-center gap-3">
            {toastType === 'success' && (
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toastType === 'error' && (
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            )}
            {toastType === 'info' && (
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            )}
            <Title className="text-gray-900 font-medium">
              {toastMessage}
            </Title>
          </div>
          <Close className="rounded-full p-1 hover:bg-gray-100">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Close>
        </ToastRoot>
        <Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-auto max-w-[420px] m-0 list-none z-50" />
      </Provider>
    </div>
  );
};

export default ChatPanel; 