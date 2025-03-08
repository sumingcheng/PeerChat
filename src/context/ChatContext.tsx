import { createContext, ReactNode, useContext, useState, useEffect } from 'react'
import { Chat, ChatContextType, Message, GroupChat, User } from '../types/chat'
import Peer from 'peerjs'
import { nanoid } from 'nanoid'
import { useNavigate, useLocation } from 'react-router-dom'

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
  
  // 初始化用户ID
  useEffect(() => {
    const newUserId = nanoid(8);
    setUserId(newUserId);
    
    // 检查URL中是否有邀请参数
    const queryParams = new URLSearchParams(location.search);
    const inviteRoomId = queryParams.get('roomId');
    
    if (inviteRoomId) {
      // 如果有邀请参数，自动加入群聊
      const chatExists = chats.some(chat => 
        chat.isGroup && (chat as GroupChat).roomId === inviteRoomId
      );
      
      if (!chatExists && userName) {
        joinGroupChat(inviteRoomId);
      }
    }
    
    return () => {
      // 组件卸载时断开连接
      if (peer) {
        peer.destroy();
      }
    };
  }, [location.search, userName]);
  
  // 创建群聊
  const createGroupChat = () => {
    if (!userName) {
      chatEvents.emit('error', '请先设置您的用户名');
      return;
    }
    
    const roomId = nanoid(6);
    const newPeer = new Peer(`${roomId}-${userId}`);
    
    setPeer(newPeer);
    
    newPeer.on('open', () => {
      console.log('PeerJS连接已打开，ID:', newPeer.id);
      
      // 创建群聊对象
      const groupChat: GroupChat = {
        id: nanoid(),
        name: `${userName}的群聊`,
        isGroup: true,
        roomId: roomId,
        isHost: true,
        shareLink: `${window.location.origin}${window.location.pathname}?roomId=${roomId}`,
        users: [{ id: userId, name: userName }],
        participants: [{ id: userId, name: userName }],
        lastMessage: '群聊已创建',
        lastMessageTime: Date.now()
      };
      
      // 添加到聊天列表
      setChats(prev => [...prev, groupChat]);
      
      // 设置为当前聊天
      setCurrentChat(groupChat);
      
      // 清空消息列表
      setMessages([]);
      
      // 设置连接监听
      setupPeerListeners(newPeer);
      
      // 发送成功事件
      chatEvents.emit('groupCreated', groupChat);
    });
    
    newPeer.on('error', (err) => {
      console.error('PeerJS错误:', err);
      chatEvents.emit('error', `连接错误: ${err.type}`);
    });
  };
  
  // 加入群聊
  const joinGroupChat = (roomId: string) => {
    if (!userName) {
      chatEvents.emit('error', '请先设置您的用户名');
      return;
    }
    
    const newPeer = new Peer(`${roomId}-${userId}`);
    
    setPeer(newPeer);
    
    newPeer.on('open', () => {
      console.log('PeerJS连接已打开，ID:', newPeer.id);
      
      // 尝试连接到房间主持人
      connectToHost(roomId, newPeer);
      
      // 设置连接监听
      setupPeerListeners(newPeer);
    });
    
    newPeer.on('error', (err) => {
      console.error('PeerJS错误:', err);
      chatEvents.emit('error', `连接错误: ${err.type}`);
    });
  };
  
  // 连接到房间主持人
  const connectToHost = (roomId: string, peer: Peer) => {
    const hostId = `${roomId}-${roomId}`;
    const conn = peer.connect(hostId);
    
    if (conn) {
      conn.on('open', () => {
        console.log('已连接到主持人');
        
        // 创建临时群聊对象
        const tempGroupChat: GroupChat = {
          id: nanoid(),
          name: '加入中的群聊',
          isGroup: true,
          roomId: roomId,
          isHost: false,
          shareLink: `${window.location.origin}${window.location.pathname}?roomId=${roomId}`,
          users: [{ id: userId, name: userName }],
          participants: [{ id: userId, name: userName }],
          lastMessage: '正在加入群聊...',
          lastMessageTime: Date.now()
        };
        
        // 添加到聊天列表
        setChats(prev => [...prev, tempGroupChat]);
        
        // 设置为当前聊天
        setCurrentChat(tempGroupChat);
        
        // 发送自己的信息给主持人
        conn.send({
          type: 'NEW_USER',
          data: {
            id: userId,
            name: userName
          }
        });
        
        handleNewConnection(conn);
      });
      
      conn.on('error', (err) => {
        console.error('连接主持人失败:', err);
        chatEvents.emit('error', '无法连接到群聊，请检查链接是否正确');
      });
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
        const newMessage: Message = data.data;
        setMessages(prev => [...prev, newMessage]);
        
        // 更新当前聊天的最后消息
        if (currentChat && currentChat.isGroup) {
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
            id: nanoid(),
            sender: 'system',
            content: `${newUser.name} 加入了群聊`,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, systemMessage]);
        }
      } else if (data.type === 'USER_JOINED') {
        // 添加新用户
        const newUser: User = data.data;
        
        if (currentChat && currentChat.isGroup) {
          const groupChat = currentChat as GroupChat;
          
          // 更新用户列表
          const updatedUsers = [...groupChat.users, newUser];
          const updatedParticipants = [...(groupChat.participants || []), newUser];
          
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
            id: nanoid(),
            sender: 'system',
            content: `${newUser.name} 加入了群聊`,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, systemMessage]);
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
              id: nanoid(),
              sender: 'system',
              content: `${leftUser.name} 已离开群聊`,
              timestamp: Date.now()
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
            id: nanoid(),
            sender: 'system',
            content: `${leftUser.name} 已离开群聊`,
            timestamp: Date.now()
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
    if (!content.trim() || !currentChat || !currentChat.isGroup) return;
    
    const newMessage: Message = {
      id: nanoid(),
      sender: userId,
      senderName: userName,
      content: content,
      timestamp: Date.now()
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
    
    // 广播消息给所有连接的用户
    broadcastToAllPeers({
      type: 'MESSAGE',
      data: newMessage
    });
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
    copyShareLink
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