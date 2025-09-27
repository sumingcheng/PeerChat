import { ConnectionManager } from '@/services/connectionManager';
import { GroupChatService } from '@/services/groupChatService';
import { MessageService } from '@/services/messageService';
import { PeerService } from '@/services/peerService';
import { GroupChat } from '@/types/chat';
import { ChatState } from '@/types/store';
import { EventEmitter } from '@/utils/eventEmitter';
import { create } from 'zustand';

// 事件总线，用于跨组件通信
export const chatEvents = new EventEmitter();

// 创建 Zustand store
const useChatStore = create<ChatState>((set, get) => {
  // 初始化服务
  const connectionManager = new ConnectionManager();
  const peerService = new PeerService(set, get, chatEvents, connectionManager);
  const messageService = new MessageService(set, get, connectionManager);
  const groupChatService = new GroupChatService(
    set,
    get,
    chatEvents,
    peerService,
    messageService,
    connectionManager
  );

  // 监听网络模式切换请求
  chatEvents.on('requestToggleNetworkMode', () => {
    get().toggleNetworkMode();
  });

  return {
    // 初始状态
    currentChat: null,
    chats: [],
    messages: [],
    loading: false,
    isConnecting: false,
    userId: '',
    userName: null,
    peer: null,
    connectionManager: connectionManager,
    isPeerInitialized: false,
    pendingRoomId: null,
    isLocalNetwork: true, // 默认使用局域网模式
    localIpAddress: null,

    // 设置待加入的群聊ID
    setPendingRoomId: (roomId) => {
      set({ pendingRoomId: roomId });
    },

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
      peerService.initializePeer(name);
    },

    // 创建群聊
    createGroupChat: () => {
      groupChatService.createGroupChat();
    },

    // 加入群聊
    joinGroupChat: (roomId) => {
      groupChatService.joinGroupChat(roomId);
    },

    // 发送消息
    sendMessage: (content) => {
      messageService.sendMessage(content);
    },

    // 复制分享链接
    copyShareLink: () => {
      const { currentChat } = get();
      if (!currentChat || !currentChat.isGroup) return;

      const groupChat = currentChat as GroupChat;
      if (groupChat.shareLink) {
        navigator.clipboard
          .writeText(groupChat.shareLink)
          .then(() => {
            chatEvents.emit('linkCopied');
          })
          .catch((err) => {
            console.error('复制链接失败:', err);
            chatEvents.emit('error', '复制链接失败');
          });
      }
    },

    // 离开当前聊天
    leaveCurrentChat: () => {
      groupChatService.leaveCurrentChat();
    },

    // 切换网络模式
    toggleNetworkMode: () => {
      return groupChatService.toggleNetworkMode();
    }
  };
});

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
