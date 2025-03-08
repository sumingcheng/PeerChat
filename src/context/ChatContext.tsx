import { createContext, ReactNode, useContext, useState, useEffect } from 'react'
import { Chat, ChatContextType, Message, GroupChat, User } from '../types/chat'
import Peer from 'peerjs'
import { nanoid } from 'nanoid'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

interface ChatProviderProps {
  children: ReactNode;
}

// 创建一个事件总线，用于跨组件通信
export const chatEvents = {
  listeners: {} as Record<string, Function[]>,
  
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  },
  
  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  // PeerJS群聊相关状态
  const [peer, setPeer] = useState<Peer | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  
  // 初始化用户ID
  useEffect(() => {
    if (!userName) return;
    
    // 清理旧的 peer 连接
    if (peer) {
      peer.destroy();
    }
    
    console.log('正在初始化 PeerJS...');
    
    // 创建新的 peer 连接，添加更多的 STUN/TURN 服务器以提高连接成功率
    const newPeer = new Peer(undefined, {
      debug: 3, // 增加调试级别
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });
    
    newPeer.on('open', (id) => {
      console.log('已连接到 PeerJS 服务器，我的 ID 是:', id);
      setUserId(id);
      setPeer(newPeer);
      
      // 设置连接监听
      setupPeerListeners(newPeer);
      
      // 检查URL中是否有邀请参数
      const queryParams = new URLSearchParams(location.search);
      const inviteRoomId = queryParams.get('roomId');
      
      if (inviteRoomId) {
        // 如果有邀请参数，自动加入群聊
        const chatExists = chats.some(chat => 
          chat.isGroup && (chat as GroupChat).roomId === inviteRoomId
        );
        
        if (!chatExists) {
          // 清理 roomId 并加入
          const cleanedId = cleanRoomId(inviteRoomId);
          joinGroupChat(cleanedId);
        }
      }
    });
    
    newPeer.on('error', (err) => {
      console.error('PeerJS 错误:', err);
      
      // 根据错误类型提供不同的错误消息
      let errorMessage = '连接错误';
      
      if (err.type === 'peer-unavailable') {
        const peerId = err.message.match(/Could not connect to peer (.+)/)?.[1];
        if (peerId && peerId.includes('-')) {
          // 如果错误中包含带破折号的 ID，尝试使用清理后的 ID 重新连接
          const cleanedId = cleanRoomId(peerId);
          if (cleanedId !== peerId) {
            console.log(`检测到可能的 ID 格式问题，尝试使用清理后的 ID 重新连接: ${cleanedId}`);
            setTimeout(() => {
              joinGroupChat(cleanedId);
            }, 1000);
            return;
          }
        }
        errorMessage = '无法连接到指定的群聊，可能群聊已不存在或暂时不可用';
      } else if (err.type === 'network' || err.type === 'server-error') {
        errorMessage = '网络连接问题，请检查您的网络连接并稍后重试';
      } else if (err.type === 'browser-incompatible') {
        errorMessage = '您的浏览器可能不支持WebRTC，请尝试使用Chrome、Firefox或Edge的最新版本';
      } else if (err.type === 'disconnected') {
        errorMessage = '与PeerJS服务器的连接已断开，正在尝试重新连接...';
      } else if (err.type === 'invalid-id') {
        errorMessage = '无效的群聊ID格式';
      } else if (err.type === 'unavailable-id') {
        errorMessage = '此ID已被使用，请尝试使用其他ID';
      } else {
        errorMessage = `连接错误: ${err.message || '未知错误'}`;
      }
      
      chatEvents.emit('error', errorMessage);
    });
    
    return () => {
      if (newPeer) {
        console.log('清理 PeerJS 连接...');
        newPeer.destroy();
      }
    };
  }, [location.search, userName]);
  
  // 优化 cleanRoomId 函数
  const cleanRoomId = (id: string): string => {
    // 移除可能导致连接问题的字符，如重复的 ID 部分 (hwW6wz-hwW6wz)
    if (id.includes('-')) {
      const parts = id.split('-');
      // 如果破折号两边的部分相同，只返回一部分
      if (parts[0] === parts[1]) {
        console.log(`检测到重复ID格式: ${id} -> ${parts[0]}`);
        return parts[0];
      }
      // 如果是其他格式的破折号，可能是 PeerJS 内部使用的格式，尝试使用第一部分
      console.log(`检测到带破折号的ID: ${id} -> ${parts[0]}`);
      return parts[0];
    }
    return id;
  };
  
  // 创建群聊
  const createGroupChat = () => {
    if (!peer || !userName) return;
    
    // 创建一个新的群聊
    const groupChat: GroupChat = {
      id: peer.id,
      name: `${userName}的群聊`,
      isGroup: true,
      users: [{ id: peer.id, name: userName }],
      connections: [],
      messages: [],
      roomId: peer.id,
      isHost: true,
      shareLink: `${window.location.origin}${window.location.pathname}?roomId=${peer.id}`
    };
    
    // 添加系统消息
    const systemMessage: Message = {
      id: nanoid(),
      sender: 'system',
      senderName: 'System',
      content: '群聊已创建，分享链接邀请好友加入吧！',
      timestamp: new Date().toISOString(),
    };
    
    groupChat.messages.push(systemMessage);
    
    // 更新聊天列表和当前聊天
    setChats(prev => [groupChat, ...prev]);
    setCurrentChat(groupChat);
    
    // 发送创建群聊事件
    chatEvents.emit('groupCreated');
  };
  
  // 加入群聊
  const joinGroupChat = async (roomId: string) => {
    if (!peer || !userName) return;
    
    try {
      setIsConnecting(true);
      
      // 检查是否已经在这个群聊中
      if (currentChat?.id === roomId) {
        chatEvents.emit('error', '您已经在此群聊中');
        setIsConnecting(false);
        return;
      }
      
      // 清理 roomId
      const cleanedRoomId = cleanRoomId(roomId);
      if (cleanedRoomId !== roomId) {
        console.log(`已清理 roomId: ${roomId} -> ${cleanedRoomId}`);
      }
      
      // 尝试连接到房主
      console.log(`尝试连接到房主: ${cleanedRoomId}`);
      
      // 添加连接超时处理
      const connectionTimeout = setTimeout(() => {
        chatEvents.emit('error', '连接超时，请检查群聊ID是否正确或稍后再试');
        setIsConnecting(false);
      }, 15000); // 15秒超时
      
      // 使用更可靠的连接选项
      const conn = peer.connect(cleanedRoomId, {
        metadata: {
          userName,
          userId: peer.id,
        },
        reliable: true,
        serialization: 'json', // 确保使用 JSON 序列化
        debug: 3 // 增加调试级别
      });
      
      if (!conn) {
        clearTimeout(connectionTimeout);
        throw new Error('无法创建连接');
      }
      
      // 添加更多的连接事件监听
      conn.on('open', () => {
        clearTimeout(connectionTimeout);
        console.log('已连接到房主');
        
        // 创建新的群聊对象
        const newGroupChat: GroupChat = {
          id: cleanedRoomId,
          name: `群聊 ${cleanedRoomId.substring(0, 6)}`,
          isGroup: true,
          users: [
            { id: peer.id, name: userName },
            { id: cleanedRoomId, name: '等待房主信息...' }
          ],
          connections: [conn],
          messages: [],
          roomId: cleanedRoomId,
          isHost: false,
          shareLink: `${window.location.origin}${window.location.pathname}?roomId=${cleanedRoomId}`
        };
        
        // 更新聊天列表和当前聊天
        setChats(prev => {
          // 检查是否已存在相同ID的聊天
          const existingChatIndex = prev.findIndex(c => c.id === cleanedRoomId);
          if (existingChatIndex >= 0) {
            // 如果存在，替换它
            const newChats = [...prev];
            newChats[existingChatIndex] = newGroupChat;
            return newChats;
          }
          // 否则添加新的
          return [newGroupChat, ...prev];
        });
        setCurrentChat(newGroupChat);
        
        // 向房主发送自己的信息
        conn.send({
          type: 'NEW_USER',
          data: { id: peer.id, name: userName }
        });
        
        // 发送加入消息
        chatEvents.emit('joinedGroup');
        setIsConnecting(false);
        
        // 添加系统消息
        const systemMessage: Message = {
          id: nanoid(),
          sender: 'system',
          senderName: 'System',
          content: '您已加入群聊',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, systemMessage]);
      });
      
      conn.on('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error('连接错误:', err);
        
        // 提供更详细的错误信息
        let errorMessage = '连接失败';
        if (err.type === 'peer-unavailable') {
          errorMessage = '无法连接到指定的群聊，可能群聊已不存在或暂时不可用';
          
          // 如果是 ID 格式问题，尝试使用另一种格式重试
          if (roomId.includes('-') && !cleanedRoomId.includes('-')) {
            console.log('尝试使用清理后的 ID 重新连接...');
            setTimeout(() => {
              joinGroupChat(cleanedRoomId);
            }, 1000);
            return;
          }
        } else {
          errorMessage = `连接错误: ${err.message || '无法连接到群聊'}`;
        }
        
        chatEvents.emit('error', errorMessage);
        setIsConnecting(false);
      });
      
      conn.on('close', () => {
        console.log('与房主的连接已关闭');
        // 可以在这里处理重连逻辑或通知用户
        
        // 添加系统消息
        const systemMessage: Message = {
          id: nanoid(),
          sender: 'system',
          senderName: 'System',
          content: '与群聊的连接已断开',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, systemMessage]);
      });
      
      // 处理接收到的数据
      conn.on('data', (data: any) => {
        handleReceivedData(data, cleanedRoomId);
      });
      
    } catch (error: any) {
      console.error('加入群聊错误:', error);
      chatEvents.emit('error', `加入群聊失败: ${error.message || '未知错误'}`);
      setIsConnecting(false);
    }
  };
  
  // 设置Peer连接监听
  const setupPeerListeners = (peer: Peer) => {
    peer.on('connection', (conn) => {
      handleNewConnection(conn);
    });
  };
  
  // 处理新连接
  const handleNewConnection = (conn: any) => {
    const peerId = conn.peer;
    
    // 保存连接
    setConnections(prev => ({
      ...prev,
      [peerId]: conn
    }));
    
    // 接收消息
    conn.on('data', (data: any) => {
      console.log('收到数据:', data);
      
      if (data.type === 'MESSAGE') {
        // 添加消息
        const newMessage: Message = {
          ...data.data,
          id: data.data.id || nanoid() // 确保消息有 ID，如果没有则使用 nanoid 生成
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // 更新当前聊天的最后消息
        if (currentChat && currentChat.id === data.data.roomId) {
          const updatedChat = {
            ...currentChat,
            lastMessage: newMessage.content,
            lastMessageTime: newMessage.timestamp
          };
          setCurrentChat(updatedChat);
          
          // 更新聊天列表
          setChats(prev => 
            prev.map(chat => 
              chat.id === currentChat.id ? updatedChat : chat
            )
          );
        }
      } else if (data.type === 'NEW_USER') {
        // 添加新用户
        const newUser: User = data.data;
        
        if (currentChat && currentChat.isGroup) {
          const groupChat = currentChat as GroupChat;
          
          // 更新用户列表
          const updatedUsers = [...groupChat.users, newUser];
          const updatedParticipants = [...(groupChat.participants || []), newUser];
          
          // 如果是主持人，广播新用户信息给所有其他用户
          if (groupChat.isHost) {
            broadcastToAllPeers({
              type: 'USER_JOINED',
              data: newUser
            }, peerId);
            
            // 发送当前用户列表和消息历史给新用户
            conn.send({
              type: 'ROOM_STATE',
              data: {
                users: updatedUsers,
                messages: messages
              }
            });
          }
          
          // 更新当前聊天
          const updatedChat: GroupChat = {
            ...groupChat,
            users: updatedUsers,
            participants: updatedParticipants
          };
          
          setCurrentChat(updatedChat);
          
          // 更新聊天列表
          setChats(prev => 
            prev.map(chat => 
              chat.id === currentChat.id ? updatedChat : chat
            )
          );
          
          // 添加系统消息
          const systemMessage: Message = {
            id: nanoid(), // 使用 nanoid 替代 uuid
            sender: 'system',
            senderName: 'System',
            content: `${newUser.name} 加入了群聊`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, systemMessage]);
        }
      } else if (data.type === 'USER_JOINED') {
        // 添加新用户
        const newUser: User = data.data;
        
        if (currentChat && currentChat.isGroup) {
          const groupChat = currentChat as GroupChat;
          
          // 检查用户是否已存在
          if (!groupChat.users.some(u => u.id === newUser.id)) {
            // 更新用户列表
            const updatedUsers = [...groupChat.users, newUser];
            
            // 更新当前聊天
            const updatedChat: GroupChat = {
              ...groupChat,
              users: updatedUsers
            };
            
            setCurrentChat(updatedChat);
            
            // 更新聊天列表
            setChats(prev => 
              prev.map(chat => 
                chat.id === currentChat.id ? updatedChat : chat
              )
            );
            
            // 添加系统消息
            const systemMessage: Message = {
              id: nanoid(), // 使用 nanoid 替代 uuid
              sender: 'system',
              senderName: 'System',
              content: `${newUser.name} 加入了群聊`,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, systemMessage]);
          }
        }
      } else if (data.type === 'ROOM_STATE') {
        // 设置房间状态
        const { users, messages: roomMessages } = data.data;
        
        if (currentChat && currentChat.isGroup) {
          const groupChat = currentChat as GroupChat;
          
          // 更新当前聊天
          const updatedChat: GroupChat = {
            ...groupChat,
            name: `${users.find(u => u.id === groupChat.roomId)?.name || '未知用户'}的群聊`,
            users: users,
            participants: users
          };
          
          setCurrentChat(updatedChat);
          
          // 更新聊天列表
          setChats(prev => 
            prev.map(chat => 
              chat.id === currentChat.id ? updatedChat : chat
            )
          );
          
          // 设置消息
          setMessages(roomMessages);
          
          // 发送加入成功事件
          chatEvents.emit('joinedGroup', updatedChat);
        }
      } else if (data.type === 'USER_LEFT') {
        // 移除用户
        const leftUserId = data.data.id;
        
        if (currentChat && currentChat.isGroup) {
          const groupChat = currentChat as GroupChat;
          
          // 更新用户列表
          const updatedUsers = groupChat.users.filter(user => user.id !== leftUserId);
          const updatedParticipants = (groupChat.participants || []).filter(user => user.id !== leftUserId);
          
          // 更新当前聊天
          const updatedChat: GroupChat = {
            ...groupChat,
            users: updatedUsers,
            participants: updatedParticipants
          };
          
          setCurrentChat(updatedChat);
          
          // 更新聊天列表
          setChats(prev => 
            prev.map(chat => 
              chat.id === currentChat.id ? updatedChat : chat
            )
          );
          
          // 添加系统消息
          const leftUser = groupChat.users.find(user => user.id === leftUserId);
          if (leftUser) {
            const systemMessage: Message = {
              id: nanoid(), // 使用 nanoid 替代 uuid
              sender: 'system',
              content: `${leftUser.name} 已离开群聊`,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, systemMessage]);
          }
        }
      }
    });
    
    // 处理连接关闭
    conn.on('close', () => {
      console.log('连接已关闭:', peerId);
      
      // 从连接列表中移除
      setConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[peerId];
        return newConnections;
      });
      
      // 从用户列表中移除
      const connectionUserId = peerId.split('-')[1];
      
      if (currentChat && currentChat.isGroup) {
        const groupChat = currentChat as GroupChat;
        
        // 查找离开的用户
        const leftUser = groupChat.users.find(user => user.id === connectionUserId);
        
        // 更新用户列表
        const updatedUsers = groupChat.users.filter(user => user.id !== connectionUserId);
        const updatedParticipants = (groupChat.participants || []).filter(user => user.id !== connectionUserId);
        
        // 更新当前聊天
        const updatedChat: GroupChat = {
          ...groupChat,
          users: updatedUsers,
          participants: updatedParticipants
        };
        
        setCurrentChat(updatedChat);
        
        // 更新聊天列表
        setChats(prev => 
          prev.map(chat => 
            chat.id === currentChat.id ? updatedChat : chat
          )
        );
        
        // 添加系统消息
        if (leftUser) {
          const systemMessage: Message = {
            id: nanoid(), // 使用 nanoid 替代 uuid
            sender: 'system',
            content: `${leftUser.name} 已离开群聊`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, systemMessage]);
        }
      }
    });
  };
  
  // 发送消息给所有连接的用户
  const broadcastToAllPeers = (data: any, excludePeerId?: string) => {
    Object.entries(connections).forEach(([peerId, conn]) => {
      if (peerId !== excludePeerId) {
        (conn as any).send(data);
      }
    });
  };
  
  // 发送消息
  const sendMessage = (content: string) => {
    if (!content.trim() || !currentChat) return;
    
    const newMessage: Message = {
      id: nanoid(), // 使用 nanoid 替代 uuid
      sender: userId,
      senderName: userName,
      content: content,
      timestamp: new Date().toISOString()
    };
    
    // 添加到自己的消息列表
    setMessages(prev => [...prev, newMessage]);
    
    // 更新当前聊天的最后消息
    const updatedChat = {
      ...currentChat,
      lastMessage: content,
      lastMessageTime: newMessage.timestamp
    };
    
    setCurrentChat(updatedChat);
    
    // 更新聊天列表
    setChats(prev => 
      prev.map(chat => 
        chat.id === currentChat.id ? updatedChat : chat
      )
    );
    
    // 如果是群聊，广播消息给所有连接的用户
    if (currentChat.isGroup) {
      const groupChat = currentChat as GroupChat;
      groupChat.connections?.forEach(conn => {
        conn.send({
          type: 'MESSAGE',
          data: newMessage
        });
      });
    }
  };
  
  // 复制分享链接
  const copyShareLink = () => {
    if (!currentChat || !currentChat.isGroup) return;
    
    const groupChat = currentChat as GroupChat;
    navigator.clipboard.writeText(groupChat.shareLink)
      .then(() => {
        chatEvents.emit('linkCopied');
      })
      .catch(err => {
        console.error('复制链接失败:', err);
        chatEvents.emit('error', '复制链接失败');
      });
  };
  
  // 离开当前聊天
  const leaveCurrentChat = () => {
    if (!currentChat || !currentChat.isGroup || !peer) return;
    
    // 通知其他用户
    broadcastToAllPeers({
      type: 'USER_LEFT',
      data: {
        id: userId
      }
    });
    
    // 断开所有连接
    peer.destroy();
    setPeer(null);
    
    // 从聊天列表中移除
    setChats(prev => prev.filter(chat => chat.id !== currentChat.id));
    
    // 清空当前聊天
    setCurrentChat(null);
    
    // 清空消息
    setMessages([]);
    
    // 发送离开事件
    chatEvents.emit('leftGroup');
  };
  
  // 添加一个重试连接的函数
  const retryConnection = (roomId: string, retryCount = 0, maxRetries = 3) => {
    if (retryCount >= maxRetries) {
      chatEvents.emit('error', '多次尝试连接失败，请稍后再试');
      return;
    }
    
    setTimeout(() => {
      console.log(`尝试重新连接 (${retryCount + 1}/${maxRetries})...`);
      joinGroupChat(roomId);
    }, 2000 * (retryCount + 1)); // 递增的重试延迟
  };
  
  const value: ChatContextType = {
    currentChat,
    setCurrentChat,
    chats,
    setChats,
    messages,
    setMessages,
    loading,
    setLoading,
    
    // PeerJS群聊相关
    userId,
    userName,
    setUserName,
    createGroupChat,
    joinGroupChat,
    sendMessage,
    leaveCurrentChat,
    copyShareLink,
    isConnecting
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext; 