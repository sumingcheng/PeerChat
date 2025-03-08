import { useChat } from '@/context/ChatContext'
import { GroupChat } from '@/types/chat'
import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const overlayShow = 'animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]';
const contentShow = 'animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]';

const Sidebar: React.FC = () => {
  const { chats, currentChat, setCurrentChat, createGroupChat, userName, setUserName, joinGroupChat, isConnecting } = useChat();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [urlInputDialogOpen, setUrlInputDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  // 当有roomIdToJoin但没有userName时，打开用户名设置对话框
  useEffect(() => {
    if (roomIdToJoin && !userName) {
      setNameDialogOpen(true);
    }
  }, [roomIdToJoin, userName]);
  
  // 清理 roomId 的辅助函数
  const cleanRoomId = (id: string): string => {
    // 移除所有空格
    let cleanedId = id.trim();
    
    // 如果是URL，尝试提取roomId参数
    if (cleanedId.startsWith('http')) {
      try {
        const url = new URL(cleanedId);
        const roomIdParam = url.searchParams.get('roomId');
        if (roomIdParam) {
          cleanedId = roomIdParam.trim();
        }
      } catch (error) {
        // URL解析失败，继续使用原始输入
      }
    }
    
    // 移除可能导致连接问题的字符，如重复的 ID 部分 (hwW6wz-hwW6wz)
    if (cleanedId.includes('-')) {
      const parts = cleanedId.split('-');
      // 如果破折号两边的部分相同，只返回一部分
      if (parts[0] === parts[1]) {
        cleanedId = parts[0];
      }
    }
    
    // 移除任何非字母数字字符（保留破折号和下划线）
    cleanedId = cleanedId.replace(/[^\w\-]/g, '');
    
    return cleanedId;
  };
  
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
        const cleanedId = cleanRoomId(roomIdToJoin);
        joinGroupChat?.(cleanedId);
        setRoomIdToJoin('');
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
      try {
        // 清理输入的roomId
        const cleanedId = cleanRoomId(roomIdToJoin);
        
        if (!cleanedId) {
          showToast('无效的群聊ID或链接');
          return;
        }
        
        // 显示正在连接的提示
        toast.loading('正在连接群聊...', { id: 'connecting' });
        
        // 调用加入群聊的函数
        joinGroupChat?.(cleanedId);
        
        // 关闭对话框并清空输入
        setJoinDialogOpen(false);
        setRoomIdToJoin('');
        
        // 3秒后如果没有成功事件，显示可能的连接问题
        setTimeout(() => {
          // 检查是否已经加入了该群聊
          const joined = chats.some(chat => chat.id === cleanedId);
          if (!joined) {
            toast.dismiss('connecting');
            toast('连接可能需要更长时间，请稍候...', {
              icon: '⏳',
              duration: 5000
            });
          }
        }, 3000);
      } catch (error) {
        showToast('连接失败，请检查ID是否正确');
        console.error('Join group error:', error);
      }
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
      // 直接使用cleanRoomId函数处理URL
      const cleanedId = cleanRoomId(urlInput);
      
      if (cleanedId) {
        setRoomIdToJoin(cleanedId); // 保存清理后的roomId
        setUrlInputDialogOpen(false);
        
        if (!userName) {
          setNameDialogOpen(true);
        } else {
          // 显示正在连接的提示
          toast.loading('正在连接群聊...', { id: 'connecting' });
          
          // 调用加入群聊的函数
          joinGroupChat?.(cleanedId);
          
          // 3秒后如果没有成功事件，显示可能的连接问题
          setTimeout(() => {
            // 检查是否已经加入了该群聊
            const joined = chats.some(chat => chat.id === cleanedId);
            if (!joined) {
              toast.dismiss('connecting');
              toast('连接可能需要更长时间，请稍候...', {
                icon: '⏳',
                duration: 5000
              });
            }
          }, 3000);
        }
      } else {
        showToast('无效的邀请链接，未找到roomId参数');
      }
    } catch (error) {
      showToast('处理链接时出错');
      console.error('Process URL error:', error);
    }
  };
  
  const showToast = (message: string) => {
    toast.error(message);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <input
          type="text"
          placeholder="搜索聊天..."
          className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none"
        />
        {userName && (
          <div className="ml-2 text-sm text-gray-500 flex items-center">
            <span className="mr-1">用户:</span>
            <span className="font-medium text-blue-500">{userName}</span>
            <button 
              onClick={() => {
                setTempUserName(userName);
                setNameDialogOpen(true);
              }}
              className="ml-1 p-1 text-gray-400 hover:text-gray-600"
              title="修改用户名"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                />
              </svg>
            </button>
          </div>
        )}
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
                          {/* 显示群聊ID，方便调试 */}
                          <span className="ml-1 text-xs text-gray-400">
                            ID: {chat.id.substring(0, 6)}
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
          disabled={isConnecting}
          className={`flex-1 py-2 bg-blue-500 text-white rounded-md 
            flex items-center justify-center
            ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
        >
          {isConnecting ? (
            <>
              <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建群聊
            </>
          )}
        </button>
        
        <button
          onClick={() => setJoinDialogOpen(true)}
          disabled={isConnecting}
          className={`flex-1 py-2 bg-gray-100 text-gray-700 rounded-md 
            flex items-center justify-center
            ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
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
              {userName 
                ? '请输入您的新用户名：' 
                : '在创建或加入群聊前，请先设置您的用户名：'}
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
            <Description className="text-gray-500 mb-4">
              请输入群聊ID或粘贴邀请链接：
            </Description>
            <input
              type="text"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              placeholder="群聊ID或邀请链接"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {/* 添加提示信息 */}
            {roomIdToJoin.includes('-') && (
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-xs">
                <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                检测到ID包含破折号，这可能导致连接问题。系统将尝试自动修复。
              </div>
            )}
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
                  disabled={isConnecting}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-md 
                    ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                >
                  {isConnecting ? (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      连接中...
                    </span>
                  ) : '加入'}
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
              autoFocus
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
                disabled={isConnecting}
                className={`px-4 py-2 bg-blue-500 text-white rounded-md 
                  ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
              >
                确定
              </button>
            </div>
          </Content>
        </Portal>
      </Root>
    </div>
  );
};

export default Sidebar; 