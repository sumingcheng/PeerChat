import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext'
import ChatListItem from './ChatListItem'
import { Root, Trigger, Portal, Overlay, Content, Title, Description } from '@radix-ui/react-dialog';
import { GroupChat } from '@/types/chat';
import toast, { Toaster } from 'react-hot-toast';

const overlayShow = 'animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]';
const contentShow = 'animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]';

const Sidebar: React.FC = () => {
  const { chats, currentChat, setCurrentChat, createGroupChat, userName, setUserName, joinGroupChat } = useChat();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [urlInputDialogOpen, setUrlInputDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
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
      
      // 如果有待加入的房间ID，则加入
      if (roomIdToJoin) {
        joinGroupChat?.(roomIdToJoin);
        setRoomIdToJoin('');
      } else {
        createGroupChat?.();
      }
    } else {
      showToast('请输入有效的用户名');
    }
  };
  
  const handleJoinGroupChat = () => {
    if (!userName) {
      setNameDialogOpen(true);
      return;
    }
    
    if (roomIdToJoin.trim()) {
      joinGroupChat?.(roomIdToJoin);
      setJoinDialogOpen(false);
      setRoomIdToJoin('');
    } else {
      showToast('请输入有效的群聊ID或链接');
    }
  };
  
  // 从URL中提取roomId
  const handleJoinFromUrl = () => {
    setUrlInputDialogOpen(true);
  };
  
  const processUrlInput = () => {
    if (!urlInput) {
      setUrlInputDialogOpen(false);
      return;
    }
    
    try {
      const urlObj = new URL(urlInput);
      const roomId = urlObj.searchParams.get('roomId');
      
      if (roomId) {
        setRoomIdToJoin(roomId);
        setUrlInputDialogOpen(false);
        
        if (!userName) {
          setNameDialogOpen(true);
        } else {
          joinGroupChat?.(roomId);
        }
      } else {
        showToast('无效的邀请链接');
      }
    } catch (error) {
      showToast('无效的URL格式');
    }
  };
  
  const showToast = (message: string) => {
    toast.error(message, {
      position: 'top-center',
      duration: 3000,
      style: {
        borderRadius: '10px',
        background: '#fff',
        color: '#333',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
        padding: '16px',
        maxWidth: '500px'
      },
    });
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="搜索聊天..."
          className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            最近聊天
          </h2>
          
          {chats.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              暂无聊天记录
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map(chat => {
                const isActive = currentChat?.id === chat.id;
                const isGroup = chat.isGroup;
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => setCurrentChat(chat)}
                    className={`p-2 rounded-md cursor-pointer flex items-center ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white">
                      {isGroup ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                          />
                        </svg>
                      ) : (
                        chat.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{chat.name}</p>
                        {chat.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {new Date(chat.lastMessageTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage}
                        </p>
                      )}
                      
                      {isGroup && (
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                            群聊 · {(chat as GroupChat).users.length}人
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 flex space-x-2">
        <button
          onClick={handleCreateGroupChat}
          className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建群聊
        </button>
        
        <button
          onClick={() => setJoinDialogOpen(true)}
          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
            />
          </svg>
          加入群聊
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
          >
            <Title className="text-xl font-semibold mb-4">设置您的用户名</Title>
            <Description className="text-gray-500 mb-4">
              在创建或加入群聊前，请先设置您的用户名：
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
            <Description className="text-gray-500 mb-4">
              请输入群聊ID或粘贴邀请链接：
            </Description>
            <input
              type="text"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              placeholder="群聊ID或邀请链接"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-between">
              <button
                onClick={handleJoinFromUrl}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                从链接加入
              </button>
              <div className="space-x-2">
                <button
                  onClick={() => setJoinDialogOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleJoinGroupChat}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  加入
                </button>
              </div>
            </div>
          </Content>
        </Portal>
      </Root>
      
      {/* URL输入对话框 */}
      <Root open={urlInputDialogOpen} onOpenChange={setUrlInputDialogOpen}>
        <Portal>
          <Overlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
          <Content 
            className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
              w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none
              ${contentShow}`}
          >
            <Title className="text-xl font-semibold mb-4">输入邀请链接</Title>
            <Description className="text-gray-500 mb-4">
              请粘贴您收到的邀请链接：
            </Description>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/chat?roomId=123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setUrlInputDialogOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={processUrlInput}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                确定
              </button>
            </div>
          </Content>
        </Portal>
      </Root>
      
      {/* 使用react-hot-toast的Toaster组件 */}
      <Toaster position="top-center" />
    </div>
  );
};

export default Sidebar; 