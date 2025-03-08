import { create } from 'zustand';
import { nanoid } from 'nanoid';
import Peer from 'peerjs';
import { Chat, GroupChat, Message, User } from '@/types/chat';

// 事件总线，用于跨组件通信
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

// 定义聊天状态接口
interface ChatState {
  // 基础状态
  currentChat: Chat | null;
  chats: Chat[];
  messages: Message[];
  loading: boolean;
  isConnecting: boolean;
  
  // 用户信息
  userId: string;
  userName: string | null;
  
  // PeerJS 相关
  peer: Peer | null;
  connections: Record<string, any>;
  
  // 操作方法
  setCurrentChat: (chat: Chat | null) => void;
  setUserName: (name: string) => void;
  createGroupChat: () => void;
  joinGroupChat: (roomId: string) => void;
  sendMessage: (content: string) => void;
  leaveCurrentChat: () => void;
  copyShareLink: () => void;
}

// 创建 Zustand store
const useChatStore = create<ChatState>((set, get) => ({
  // 初始状态
  currentChat: null,
  chats: [],
  messages: [],
  loading: false,
  isConnecting: false,
  userId: '',
  userName: null,
  peer: null,
  connections: {},
  
  // 设置当前聊天
  setCurrentChat: (chat) => {
    set({ currentChat: chat });
    
    // 如果切换了聊天，更新消息列表
    if (chat) {
      // 如果是群聊，获取群聊的消息
      if (chat.isGroup) {
        const groupChat = chat as GroupChat;
        set({ messages: groupChat.messages || [] });
      } else {
        // 普通聊天，暂时清空消息
        set({ messages: [] });
      }
    } else {
      set({ messages: [] });
    }
  },
  
  // 设置用户名
  setUserName: (name) => {
    set({ userName: name });
    
    // 保存到本地存储
    localStorage.setItem('userName', name);
    
    // 初始化 PeerJS
    const state = get();
    if (state.peer) {
      state.peer.destroy();
    }
    
    console.log('正在初始化 PeerJS...');
    
    // 创建新的 peer 连接
    const newPeer = new Peer(undefined as unknown as string, {
      debug: 3,
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
      set({ userId: id, peer: newPeer });
      
      // 设置连接监听
      setupPeerListeners(newPeer, get, set);
    });
  },
  
  // 创建群聊
  createGroupChat: () => {
    const { peer, userName } = get();
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
    
    if (groupChat.messages) {
      groupChat.messages.push(systemMessage);
    }
    
    // 更新聊天列表和当前聊天
    const { chats } = get();
    set({ 
      chats: [groupChat, ...chats],
      currentChat: groupChat,
      messages: groupChat.messages || []
    });
    
    // 发送创建群聊事件
    chatEvents.emit('groupCreated');
  },
  
  // 加入群聊
  joinGroupChat: async (roomId) => {
    const { peer, userName, chats } = get();
    if (!peer || !userName) return;
    
    set({ isConnecting: true });
    
    try {
      // 清理 roomId
      const cleanedRoomId = cleanRoomId(roomId);
      
      console.log(`尝试加入群聊: ${cleanedRoomId}`);
      
      // 检查是否已经加入了该群聊
      const existingChat = chats.find(chat => 
        chat.isGroup && (chat as GroupChat).roomId === cleanedRoomId
      );
      
      if (existingChat) {
        set({ currentChat: existingChat, isConnecting: false });
        return;
      }
      
      // 连接到房主
      const conn = peer.connect(cleanedRoomId, {
        reliable: true,
        serialization: 'json'
      });
      
      if (!conn) {
        throw new Error('无法创建连接');
      }
      
      // 设置连接超时
      const connectionTimeout = setTimeout(() => {
        conn.close();
        chatEvents.emit('error', '连接超时，请检查群聊ID是否正确');
        set({ isConnecting: false });
      }, 10000);
      
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
        const { chats } = get();
        const existingChatIndex = chats.findIndex(c => c.id === cleanedRoomId);
        
        if (existingChatIndex >= 0) {
          // 如果存在，替换它
          const newChats = [...chats];
          newChats[existingChatIndex] = newGroupChat;
          set({ chats: newChats, currentChat: newGroupChat });
        } else {
          // 否则添加新的
          set({ chats: [newGroupChat, ...chats], currentChat: newGroupChat });
        }
        
        // 向房主发送自己的信息
        conn.send({
          type: 'NEW_USER',
          data: { id: peer.id, name: userName }
        });
        
        // 发送加入消息
        chatEvents.emit('joinedGroup');
        set({ isConnecting: false });
        
        // 添加系统消息
        const systemMessage: Message = {
          id: nanoid(),
          sender: 'system',
          senderName: 'System',
          content: '您已加入群聊',
          timestamp: new Date().toISOString()
        };
        
        set(state => ({ 
          messages: [...state.messages, systemMessage]
        }));
        
        // 设置连接数据处理
        conn.on('data', (data: any) => {
          handleReceivedData(data, cleanedRoomId, get, set);
        });
      });
      
      conn.on('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error('连接错误:', err);
        
        // 提供更详细的错误信息
        let errorMessage = '连接失败';
        if (err.type === 'peer-unavailable') {
          errorMessage = '无法连接到指定的群聊，可能群聊已不存在或暂时不可用';
        } else {
          errorMessage = `连接错误: ${err.message || '无法连接到群聊'}`;
        }
        
        chatEvents.emit('error', errorMessage);
        set({ isConnecting: false });
      });
      
      conn.on('close', () => {
        console.log('与房主的连接已关闭');
        
        // 添加系统消息
        const systemMessage: Message = {
          id: nanoid(),
          sender: 'system',
          senderName: 'System',
          content: '与群聊的连接已断开',
          timestamp: new Date().toISOString()
        };
        
        set(state => ({ 
          messages: [...state.messages, systemMessage]
        }));
      });
      
    } catch (error: any) {
      console.error('加入群聊错误:', error);
      chatEvents.emit('error', `加入群聊失败: ${error.message || '未知错误'}`);
      set({ isConnecting: false });
    }
  },
  
  // 发送消息
  sendMessage: (content) => {
    const { currentChat, userId, userName, messages } = get();
    if (!content.trim() || !currentChat) return;
    
    const newMessage: Message = {
      id: nanoid(),
      sender: userId,
      senderName: userName || undefined,
      content: content,
      timestamp: new Date().toISOString()
    };
    
    // 添加到自己的消息列表
    set({ messages: [...messages, newMessage] });
    
    // 更新当前聊天的最后消息
    const updatedChat = {
      ...currentChat,
      lastMessage: content,
      lastMessageTime: newMessage.timestamp
    };
    
    set({ currentChat: updatedChat });
    
    // 更新聊天列表
    set(state => ({
      chats: state.chats.map(chat => 
        chat.id === currentChat.id ? updatedChat : chat
      )
    }));
    
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
  },
  
  // 复制分享链接
  copyShareLink: () => {
    const { currentChat } = get();
    if (!currentChat || !currentChat.isGroup) return;
    
    const groupChat = currentChat as GroupChat;
    if (groupChat.shareLink) {
      navigator.clipboard.writeText(groupChat.shareLink)
        .then(() => {
          chatEvents.emit('linkCopied');
        })
        .catch(err => {
          console.error('复制链接失败:', err);
          chatEvents.emit('error', '复制链接失败');
        });
    }
  },
  
  // 离开当前聊天
  leaveCurrentChat: () => {
    const { currentChat, userId, peer } = get();
    if (!currentChat || !currentChat.isGroup || !peer) return;
    
    // 获取所有连接
    const { connections } = get();
    
    // 通知其他用户
    Object.values(connections).forEach(conn => {
      conn.send({
        type: 'USER_LEFT',
        data: {
          id: userId
        }
      });
    });
    
    // 断开所有连接
    peer.destroy();
    
    // 从聊天列表中移除
    set(state => ({
      chats: state.chats.filter(chat => chat.id !== currentChat.id),
      currentChat: null,
      messages: [],
      peer: null,
      connections: {}
    }));
    
    // 发送离开事件
    chatEvents.emit('leftGroup');
    
    // 重新初始化 PeerJS
    const { userName } = get();
    if (userName) {
      setTimeout(() => {
        get().setUserName(userName);
      }, 1000);
    }
  }
}));

// 辅助函数

// 清理 roomId
function cleanRoomId(id: string): string {
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
}

// 设置 Peer 监听器
function setupPeerListeners(peer: Peer, get: () => ChatState, set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void) {
  // 处理新连接
  peer.on('connection', (conn) => {
    const peerId = conn.peer;
    console.log('收到新连接:', peerId);
    
    // 保存连接
    set(state => ({
      connections: { ...state.connections, [peerId]: conn }
    }));
    
    // 处理数据
    conn.on('data', (data: any) => {
      console.log('收到数据:', data);
      handleReceivedData(data, peerId, get, set);
    });
    
    // 处理连接关闭
    conn.on('close', () => {
      console.log('连接已关闭:', peerId);
      
      // 从连接列表中移除
      set(state => {
        const newConnections = { ...state.connections };
        delete newConnections[peerId];
        return { connections: newConnections };
      });
      
      // 处理用户离开逻辑
      handleUserLeft(peerId, get, set);
    });
  });
  
  // 处理错误
  peer.on('error', (err) => {
    console.error('PeerJS 错误:', err);
    chatEvents.emit('error', `连接错误: ${err.message || '未知错误'}`);
  });
  
  // 处理断开连接
  peer.on('disconnected', () => {
    console.log('与 PeerJS 服务器断开连接');
    
    // 尝试重新连接
    peer.reconnect();
  });
}

// 处理接收到的数据
function handleReceivedData(data: any, peerId: string, get: () => ChatState, set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void) {
  const { currentChat } = get();
  
  if (data.type === 'MESSAGE') {
    // 添加消息
    const newMessage: Message = {
      ...data.data,
      id: data.data.id || nanoid()
    };
    
    set(state => ({ messages: [...state.messages, newMessage] }));
    
    // 更新当前聊天的最后消息
    if (currentChat && currentChat.id === data.data.roomId) {
      const updatedChat = {
        ...currentChat,
        lastMessage: newMessage.content,
        lastMessageTime: newMessage.timestamp
      };
      
      set({ currentChat: updatedChat });
      
      // 更新聊天列表
      set(state => ({
        chats: state.chats.map(chat => 
          chat.id === currentChat.id ? updatedChat : chat
        )
      }));
    }
  } else if (data.type === 'NEW_USER') {
    // 处理新用户加入
    handleNewUser(data.data, peerId, get, set);
  } else if (data.type === 'USER_JOINED') {
    // 处理用户加入广播
    handleUserJoined(data.data, get, set);
  } else if (data.type === 'ROOM_STATE') {
    // 处理房间状态
    handleRoomState(data.data, get, set);
  } else if (data.type === 'USER_LEFT') {
    // 处理用户离开
    handleUserLeft(data.data.id, get, set);
  }
}

// 处理新用户加入
function handleNewUser(newUser: User, peerId: string, get: () => ChatState, set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void) {
  const { currentChat, connections } = get();
  
  if (currentChat && currentChat.isGroup) {
    const groupChat = currentChat as GroupChat;
    
    // 更新用户列表
    const updatedUsers = [...(groupChat.users || []), newUser];
    const updatedParticipants = [...(groupChat.participants || []), newUser];
    
    // 如果是主持人，广播新用户信息给所有其他用户
    if (groupChat.isHost) {
      Object.entries(connections).forEach(([connPeerId, conn]) => {
        if (connPeerId !== peerId) {
          conn.send({
            type: 'USER_JOINED',
            data: newUser
          });
        }
      });
      
      // 发送当前用户列表和消息历史给新用户
      const { messages } = get();
      connections[peerId].send({
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
    
    set({ currentChat: updatedChat });
    
    // 更新聊天列表
    set(state => ({
      chats: state.chats.map(chat => 
        chat.id === currentChat.id ? updatedChat : chat
      )
    }));
    
    // 添加系统消息
    const systemMessage: Message = {
      id: nanoid(),
      sender: 'system',
      senderName: 'System',
      content: `${newUser.name} 加入了群聊`,
      timestamp: new Date().toISOString()
    };
    
    set(state => ({ messages: [...state.messages, systemMessage] }));
  }
}

// 处理用户加入广播
function handleUserJoined(newUser: User, get: () => ChatState, set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void) {
  const { currentChat } = get();
  
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
      
      set({ currentChat: updatedChat });
      
      // 更新聊天列表
      set(state => ({
        chats: state.chats.map(chat => 
          chat.id === currentChat.id ? updatedChat : chat
        )
      }));
      
      // 添加系统消息
      const systemMessage: Message = {
        id: nanoid(),
        sender: 'system',
        senderName: 'System',
        content: `${newUser.name} 加入了群聊`,
        timestamp: new Date().toISOString()
      };
      
      set(state => ({ messages: [...state.messages, systemMessage] }));
    }
  }
}

// 处理房间状态
function handleRoomState(data: { users: User[], messages: Message[] }, get: () => ChatState, set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void) {
  const { currentChat } = get();
  
  if (currentChat && currentChat.isGroup) {
    const groupChat = currentChat as GroupChat;
    
    // 更新当前聊天
    const updatedChat: GroupChat = {
      ...groupChat,
      name: `${data.users.find(u => u.id === groupChat.roomId)?.name || '未知用户'}的群聊`,
      users: data.users,
      participants: data.users
    };
    
    set({ 
      currentChat: updatedChat,
      messages: data.messages
    });
    
    // 更新聊天列表
    set(state => ({
      chats: state.chats.map(chat => 
        chat.id === currentChat.id ? updatedChat : chat
      )
    }));
    
    // 发送加入成功事件
    chatEvents.emit('joinedGroup', updatedChat);
  }
}

// 处理用户离开
function handleUserLeft(leftUserId: string, get: () => ChatState, set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void) {
  const { currentChat } = get();
  
  if (currentChat && currentChat.isGroup) {
    const groupChat = currentChat as GroupChat;
    
    // 查找离开的用户
    const leftUser = groupChat.users.find(user => user.id === leftUserId);
    
    // 更新用户列表
    const updatedUsers = groupChat.users.filter(user => user.id !== leftUserId);
    const updatedParticipants = (groupChat.participants || []).filter(user => user.id !== leftUserId);
    
    // 更新当前聊天
    const updatedChat: GroupChat = {
      ...groupChat,
      users: updatedUsers,
      participants: updatedParticipants
    };
    
    set({ currentChat: updatedChat });
    
    // 更新聊天列表
    set(state => ({
      chats: state.chats.map(chat => 
        chat.id === currentChat.id ? updatedChat : chat
      )
    }));
    
    // 添加系统消息
    if (leftUser) {
      const systemMessage: Message = {
        id: nanoid(),
        sender: 'system',
        content: `${leftUser.name} 已离开群聊`,
        timestamp: new Date().toISOString()
      };
      
      set(state => ({ messages: [...state.messages, systemMessage] }));
    }
  }
}

// 初始化 - 从本地存储加载用户名
if (typeof window !== 'undefined') {
  const savedUserName = localStorage.getItem('userName');
  if (savedUserName) {
    setTimeout(() => {
      useChatStore.getState().setUserName(savedUserName);
    }, 0);
  }
}

export default useChatStore; 