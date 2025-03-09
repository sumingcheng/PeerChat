import { chatEvents } from '@/store/useChatStore'
import useChatStore from '@/store/useChatStore'
import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog'
import { Root as SeparatorRoot } from '@radix-ui/react-separator'
import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import GroupChatHeader from '../group/GroupChatHeader'
import GroupUserList from '../group/GroupUserList'
import ChatInput from '../input/ChatInput'
import MessageList from './MessageList'
import { GroupChat } from '@/types/chat'

// 动画常量
const overlayShow = 'animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]';
const contentShow = 'animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]';

const ChatPanel: React.FC = () => {
  const currentChat = useChatStore(state => state.currentChat);
  const createGroupChat = useChatStore(state => state.createGroupChat);
  const userName = useChatStore(state => state.userName);
  const setUserName = useChatStore(state => state.setUserName);
  const isConnecting = useChatStore(state => state.isConnecting);
  const joinGroupChat = useChatStore(state => state.joinGroupChat);
  const pendingRoomId = useChatStore(state => state.pendingRoomId);
  const isPeerInitialized = useChatStore(state => state.isPeerInitialized);
  
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocalNetwork, setIsLocalNetwork] = useState<boolean | null>(null);
  const [networkModeDialogOpen, setNetworkModeDialogOpen] = useState(false);

  // 首次加载时检查是否已设置用户名
  useEffect(() => {
    // 如果用户名未设置，自动打开设置用户名对话框
    if (!userName) {
      setNameDialogOpen(true);
    }
  }, [userName]);
  
  // 当用户名设置后，如果有待处理的roomId，则加入群聊
  useEffect(() => {
    if (userName && pendingRoomId && isPeerInitialized) {
      console.log('用户名已设置，PeerJS已初始化，加入群聊:', pendingRoomId);
      
      // 显示正在连接的提示
      toast.loading(`正在连接到群聊...`, { 
        id: 'connecting',
        duration: 20000 // 设置较长的持续时间，避免自动消失
      });
      
      // 加入群聊
      joinGroupChat?.(pendingRoomId);
    }
  }, [userName, pendingRoomId, joinGroupChat, isPeerInitialized]);

  // 监听事件
  useEffect(() => {
    const handleError = (message: string) => {
      setErrorMessage(message);
      
      // 检查是否是连接错误
      if (message.includes('Could not connect to peer')) {
        // 提取对等节点ID
        const peerId = message.match(/Could not connect to peer (\w+)/)?.[1];
        
        toast.error(
          <div>
            <div>连接失败: 无法连接到对等节点</div>
            {peerId && <div className="text-xs mt-1">节点ID: {peerId}</div>}
            <div className="text-xs mt-1">
              可能原因: 网络问题、防火墙限制或节点不存在
            </div>
          </div>, 
          { duration: 5000 }
        );
        
        // 清除连接中状态
        toast.dismiss('connecting');
      } else {
        toast.error(message);
      }
      
      // 5秒后清除错误消息
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    };
    
    const handleGroupCreated = (data?: { isLocalNetwork?: boolean }) => {
      toast.success('群聊创建成功');
    };
    
    const handleJoinedGroup = (groupChat?: GroupChat) => {
      toast.dismiss('connecting'); // 清除连接中的提示
      
      if (groupChat) {
        toast.success(
          <div>
            <div>成功加入群聊</div>
            <div className="text-xs mt-1">群聊名称: {groupChat.name}</div>
          </div>
        );
      } else {
        toast.success('成功加入群聊');
      }
    };
    
    const handleLeftGroup = () => {
      toast('已离开群聊', { icon: '🔔' });
    };
    
    const handleConnecting = (peerId: string) => {
      toast.loading(`正在连接到节点 ${peerId}...`, { id: 'connecting' });
    };
    
    const handlePeerInitialized = (data: { id: string, isLocalNetwork?: boolean }) => {
      toast.success(
        <div className="w-30">
          <div>连接成功！</div>
          <div className="text-xs mt-1 ">您的节点ID: {data.id.substring(0, 8)}...</div>
        </div>,
        { duration: 3000 }
      );
    };
    
    const handleNetworkModeChanged = (data: { isLocalNetwork: boolean }) => {
      const mode = data.isLocalNetwork ? '局域网' : '互联网';
      toast.success(`已切换到${mode}模式`);
    };
    
    // 使用新的 EventEmitter 类的方法
    chatEvents.on('error', handleError);
    chatEvents.on('groupCreated', handleGroupCreated);
    chatEvents.on('joinedGroup', handleJoinedGroup);
    chatEvents.on('leftGroup', handleLeftGroup);
    chatEvents.on('connecting', handleConnecting);
    chatEvents.on('peerInitialized', handlePeerInitialized);
    chatEvents.on('networkModeChanged', handleNetworkModeChanged);
    
    return () => {
      // 移除事件监听
      chatEvents.off('error', handleError);
      chatEvents.off('groupCreated', handleGroupCreated);
      chatEvents.off('joinedGroup', handleJoinedGroup);
      chatEvents.off('leftGroup', handleLeftGroup);
      chatEvents.off('connecting', handleConnecting);
      chatEvents.off('peerInitialized', handlePeerInitialized);
      chatEvents.off('networkModeChanged', handleNetworkModeChanged);
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
      // 用户名设置后，如果有待处理的roomId，会在useEffect中自动处理
    } else {
      toast.error('请输入有效的用户名');
    }
  };
  
  const handleToggleNetworkMode = () => {
    // 获取GroupChatService实例
    const groupChatService = (window as any).groupChatService;
    if (groupChatService && typeof groupChatService.toggleNetworkMode === 'function') {
      const newMode = groupChatService.toggleNetworkMode();
      setIsLocalNetwork(newMode);
      setNetworkModeDialogOpen(false);
    } else {
      // 如果无法直接访问服务实例，可以通过事件系统发送切换请求
      chatEvents.emit('requestToggleNetworkMode');
      setNetworkModeDialogOpen(false);
    }
  };

  if (!currentChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 p-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-700">开始一个新的对话</h2>
          <p className="text-gray-500">创建一个群聊，邀请好友加入实时对话</p>
          {userName && (
            <p className="text-sm text-blue-500 font-bold">当前用户: {userName}</p>
          )}
          
          {/* 暂时隐藏网络模式切换功能 */}
          {/* {isLocalNetwork !== null && (
            <p className="text-xs text-gray-500">
              当前网络模式: {isLocalNetwork ? '局域网' : '互联网'}
              <button 
                onClick={() => setNetworkModeDialogOpen(true)}
                className="ml-2 text-blue-500 underline"
              >
                切换
              </button>
            </p>
          )} */}
          
          {/* 显示错误消息 */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <div>
                  <span>{errorMessage}</span>
                  {errorMessage.includes('Could not connect to peer') && (
                    <div className="mt-1 text-xs">
                      <p>可能原因: 网络问题、防火墙限制或节点不存在</p>
                      <p>建议: 尝试刷新页面或使用不同的网络连接</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 显示连接状态 */}
          {isConnecting && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-600 text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>正在连接中，请稍候...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleCreateGroupChat}
            disabled={isConnecting}
            className={`px-6 py-3 bg-blue-500 text-white rounded-lg 
              transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl
              ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            <span>创建群聊</span>
          </button>
          
          {userName && (
            <button
              onClick={() => setNameDialogOpen(true)}
              disabled={isConnecting}
              className={`px-6 py-3 bg-gray-100 text-gray-700 rounded-lg 
                transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl
                ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <span>修改用户名</span>
            </button>
          )}
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
                  : '在开始使用前，请先设置您的用户名：'}
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
        
        {/* 网络模式切换对话框 - 暂时保留但不显示 */}
        <Root open={networkModeDialogOpen} onOpenChange={setNetworkModeDialogOpen}>
          <Portal>
            <Overlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
            <Content 
              className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
                w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none
                ${contentShow}`}
            >
              <Title className="text-xl font-semibold mb-4">
                切换网络模式
              </Title>
              <Description className="text-gray-500 mb-4">
                当前模式: {isLocalNetwork ? '局域网' : '互联网'}
              </Description>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>局域网模式:</strong> 适用于同一网络下的设备通信，速度更快，但仅限于局域网内使用。
                </p>
                <p className="text-sm text-gray-600">
                  <strong>互联网模式:</strong> 适用于不同网络下的设备通信，可以跨网络使用，但速度可能较慢。
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setNetworkModeDialogOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleToggleNetworkMode}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  切换到{isLocalNetwork ? '互联网' : '局域网'}模式
                </button>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    );
  }

  // 判断是否为群聊
  const isGroupChat = currentChat.isGroup;

  return (
    <div className="h-full flex flex-col">
      {/* 显示错误消息 */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-600 text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div>
              <span>{errorMessage}</span>
              {errorMessage.includes('Could not connect to peer') && (
                <div className="mt-1 text-xs">
                  <p>可能原因: 网络问题、防火墙限制或节点不存在</p>
                  <p>建议: 尝试刷新页面或使用不同的网络连接</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 显示连接状态 */}
      {isConnecting && (
        <div className="p-3 bg-blue-50 border-b border-blue-200 text-blue-600 text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>正在连接中，请稍候...</span>
          </div>
        </div>
      )}
      
      {/* 暂时隐藏网络模式显示 */}
      {/* {(currentChat as GroupChat).isLocalNetwork !== undefined && (
        <div className={`p-2 text-xs text-center ${(currentChat as GroupChat).isLocalNetwork ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
          当前使用{(currentChat as GroupChat).isLocalNetwork ? '局域网' : '互联网'}模式连接
          <button 
            onClick={() => setNetworkModeDialogOpen(true)}
            className="ml-2 underline"
          >
            切换
          </button>
        </div>
      )} */}
      
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
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {currentChat.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="ml-3 font-medium">{currentChat.name}</h2>
          </div>
          <SeparatorRoot className="h-[1px] bg-gray-100" />
          <MessageList />
          <SeparatorRoot className="h-[1px] bg-gray-100" />
          <ChatInput />
        </>
      )}
      
      {/* 用户名输入对话框 - 在聊天界面中也可能需要 */}
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
                : '在开始使用前，请先设置您的用户名：'}
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
      
      {/* 网络模式切换对话框 - 暂时保留但不显示 */}
      <Root open={networkModeDialogOpen} onOpenChange={setNetworkModeDialogOpen}>
        <Portal>
          <Overlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
          <Content 
            className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
              w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none
              ${contentShow}`}
          >
            <Title className="text-xl font-semibold mb-4">
              切换网络模式
            </Title>
            <Description className="text-gray-500 mb-4">
              当前模式: {isLocalNetwork ? '局域网' : '互联网'}
            </Description>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                <strong>局域网模式:</strong> 适用于同一网络下的设备通信，速度更快，但仅限于局域网内使用。
              </p>
              <p className="text-sm text-gray-600">
                <strong>互联网模式:</strong> 适用于不同网络下的设备通信，可以跨网络使用，但速度可能较慢。
              </p>
              <p className="text-sm text-red-500 mt-2">
                <strong>注意:</strong> 切换网络模式会断开当前连接，需要重新加入群聊。
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setNetworkModeDialogOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleToggleNetworkMode}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                切换到{isLocalNetwork ? '互联网' : '局域网'}模式
              </button>
            </div>
          </Content>
        </Portal>
      </Root>
    </div>
  );
};

export default ChatPanel; 