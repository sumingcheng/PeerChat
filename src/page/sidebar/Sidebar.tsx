import useChatStore, { chatEvents } from '@/store/useChatStore.ts';
import { Chat, GroupChat } from '@/types/chat.ts';
import { cleanRoomId } from '@/utils/roomUtils.ts';
import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog';
import {
  Provider as TooltipProvider,
  Root as TooltipRoot,
  Trigger as TooltipTrigger,
  Content as TooltipContent
} from '@radix-ui/react-tooltip';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ChatListItem from './ChatListItem.tsx';

// 动画常量
const overlayShow = 'animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]';
const contentShow = 'animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]';

const Sidebar: React.FC = () => {
  const chats = useChatStore((state) => state.chats);
  const currentChat = useChatStore((state) => state.currentChat);
  const setCurrentChat = useChatStore((state) => state.setCurrentChat);
  const createGroupChat = useChatStore((state) => state.createGroupChat);
  const joinGroupChat = useChatStore((state) => state.joinGroupChat);
  const userName = useChatStore((state) => state.userName);
  const setUserName = useChatStore((state) => state.setUserName);
  const isConnecting = useChatStore((state) => state.isConnecting);

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // 首次加载时检查是否已设置用户名
  useEffect(() => {
    if (userName) {
      setTempUserName(userName);
    }
  }, [userName]);

  // 监听事件
  useEffect(() => {
    const handleJoinedGroup = () => {
      setJoinDialogOpen(false);
      setRoomIdInput('');
      setIsJoining(false);
    };

    const handleError = () => {
      setIsJoining(false);
    };

    // 使用新的 EventEmitter 类的方法
    chatEvents.on('joinedGroup', handleJoinedGroup);
    chatEvents.on('error', handleError);

    return () => {
      chatEvents.off('joinedGroup', handleJoinedGroup);
      chatEvents.off('error', handleError);
    };
  }, []);

  const handleCreateGroupChat = () => {
    if (!userName) {
      setNameDialogOpen(true);
      return;
    }
    createGroupChat?.();
  };

  const handleSetUserName = () => {
    if (tempUserName.trim()) {
      setUserName?.(tempUserName);
      setNameDialogOpen(false);
    } else {
      toast.error('请输入有效的用户名');
    }
  };

  const handleSelectChat = (chat: Chat) => {
    if (isConnecting) return; // 连接中不允许切换聊天
    setCurrentChat?.(chat);
  };

  const handleJoinGroupChat = () => {
    if (!roomIdInput.trim()) {
      toast.error('请输入有效的群聊ID或链接');
      return;
    }

    if (!userName) {
      setNameDialogOpen(true);
      return;
    }

    setIsJoining(true);

    // 显示正在连接的提示
    toast.loading(`正在连接到群聊...`, {
      id: 'connecting',
      duration: 20000 // 设置较长的持续时间，避免自动消失
    });

    // 使用工具函数清理输入
    const cleanedRoomId = cleanRoomId(roomIdInput);

    // 检查是否已经加入了该群聊
    const existingChat = chats.find(
      (chat) => chat.isGroup && (chat as GroupChat).roomId === cleanedRoomId
    );

    if (existingChat) {
      toast.dismiss('connecting');
      toast.success('已经加入过该群聊，直接切换');
      setCurrentChat?.(existingChat);
      setJoinDialogOpen(false);
      setRoomIdInput('');
      setIsJoining(false);
      return;
    }

    // 加入群聊
    joinGroupChat?.(cleanedRoomId);
  };

  const handleJoinFromUrl = () => {
    processUrlInput();
  };

  const processUrlInput = () => {
    try {
      // 检查是否是URL
      if (roomIdInput.startsWith('http')) {
        const url = new URL(roomIdInput);
        const roomIdParam = url.searchParams.get('roomId');

        if (roomIdParam) {
          // 更新输入框显示提取出的roomId
          setRoomIdInput(roomIdParam);
          toast.success('已从链接中提取群聊ID');
        } else {
          toast.error('无法从链接中提取群聊ID');
        }
      } else {
        // 如果不是URL，尝试直接作为roomId处理
        handleJoinGroupChat();
      }
    } catch (error) {
      console.error('处理URL时出错:', error);
      toast.error('无效的链接格式');
    }
  };

  // 处理回车键提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isJoining) {
      handleJoinGroupChat();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">聊天</h1>
        <a
          href="https://github.com/sumingcheng/PeerChat"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:opacity-80"
          title="GitHub 仓库"
        >
          <img
            src="https://img.shields.io/github/stars/sumingcheng/PeerChat?logo=github"
            alt="GitHub Stars"
            className="h-5"
          />
        </a>
        <TooltipProvider>
          <div className="flex space-x-2">
            <TooltipRoot>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCreateGroupChat}
                  disabled={isConnecting}
                  className={`p-2 text-gray-500 hover:bg-gray-100 rounded-full
                    ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm animate-fadeIn z-50"
                sideOffset={5}
              >
                创建群聊
              </TooltipContent>
            </TooltipRoot>

            <TooltipRoot>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setJoinDialogOpen(true)}
                  disabled={isConnecting}
                  className={`p-2 text-gray-500 hover:bg-gray-100 rounded-full
                    ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent
                className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm animate-fadeIn z-50"
                sideOffset={5}
              >
                加入群聊
              </TooltipContent>
            </TooltipRoot>
          </div>
        </TooltipProvider>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>暂无聊天</p>
            <p className="text-sm mt-1">创建或加入一个群聊开始对话</p>
          </div>
        ) : (
          <div>
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={currentChat?.id === chat.id}
                onClick={() => handleSelectChat(chat)}
                isConnecting={isConnecting && currentChat?.id === chat.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* 用户信息 */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setNameDialogOpen(true)}
          disabled={isConnecting}
          className={`w-full flex items-center text-left transition-colors duration-200 rounded-lg p-2 -m-2
            ${isConnecting ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="ml-3 flex-1">
            <p className="font-medium">{userName || '未设置用户名'}</p>
            <p className="text-xs text-gray-500">
              {isConnecting ? (
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  连接中...
                </span>
              ) : (
                '点击修改用户名'
              )}
            </p>
          </div>
          {!isConnecting && (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* 用户名输入对话框 */}
      <Root open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <Portal>
          <Overlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
          <Content
            className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
              w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none
              ${contentShow}`}
            onEscapeKeyDown={(e) => {
              // 如果是首次设置用户名（没有用户名），阻止关闭
              if (!userName) {
                e.preventDefault();
              }
            }}
            onPointerDownOutside={(e) => {
              // 如果是首次设置用户名（没有用户名），阻止关闭
              if (!userName) {
                e.preventDefault();
              }
            }}
          >
            <Title className="text-xl font-semibold mb-4">
              {userName ? '修改用户名' : '设置您的用户名'}
            </Title>
            <Description className="text-gray-500 mb-4">
              {userName ? '请输入您的新用户名：' : '在开始使用前，请先设置您的用户名：'}
            </Description>
            <input
              type="text"
              value={tempUserName}
              onChange={(e) => setTempUserName(e.target.value)}
              placeholder="请输入您的用户名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              {userName && (
                <button
                  onClick={() => setNameDialogOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
              )}
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

      {/* 加入群聊对话框 */}
      <Root open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <Portal>
          <Overlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
          <Content
            className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
              w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none
              ${contentShow}`}
          >
            <Title className="text-xl font-semibold mb-4">加入群聊</Title>
            <Description className="text-gray-500 mb-4">请输入群聊ID或邀请链接：</Description>
            <div className="mb-4">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入群聊ID或粘贴邀请链接"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                disabled={isJoining}
              />
              <div className="flex justify-between">
                <button
                  onClick={handleJoinFromUrl}
                  disabled={isJoining || !roomIdInput.trim()}
                  className={`text-sm text-blue-500 hover:text-blue-600
                    ${isJoining || !roomIdInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  从链接提取ID
                </button>
                <div className="text-xs text-gray-500">
                  例如: abc123 或 https://example.com?roomId=abc123
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setJoinDialogOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                disabled={isJoining}
              >
                取消
              </button>
              <button
                onClick={handleJoinGroupChat}
                disabled={isJoining || !roomIdInput.trim()}
                className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center
                  ${isJoining || !roomIdInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isJoining ? (
                  <>
                    <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    加入中
                  </>
                ) : (
                  '加入'
                )}
              </button>
            </div>
          </Content>
        </Portal>
      </Root>
    </div>
  );
};

export default Sidebar;
