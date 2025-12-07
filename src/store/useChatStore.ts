import { ConnectionManager } from '@/services/connectionManager';
import { GroupChatService } from '@/services/groupChatService';
import { MessageService } from '@/services/messageService';
import { PeerService } from '@/services/peerService';
import { GroupChat } from '@/types/chat';
import { ChatState, GetStateFunction, SetStateFunction } from '@/types/store';
import { EventEmitter } from '@/utils/eventEmitter';
import { create } from 'zustand';

export const chatEvents = new EventEmitter();

interface Services {
  connectionManager: ConnectionManager;
  peerService: PeerService;
  messageService: MessageService;
  groupChatService: GroupChatService;
}

let services: Services | null = null;
let isInitialized = false;

function getServices(set: SetStateFunction<ChatState>, get: GetStateFunction<ChatState>): Services {
  if (!services) {
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

    services = {
      connectionManager,
      peerService,
      messageService,
      groupChatService
    };
  }
  return services;
}

const useChatStore = create<ChatState>((set, get) => {
  const lazyServices = () => getServices(set, get);

  return {
    currentChat: null,
    chats: [],
    messages: [],
    loading: false,
    isConnecting: false,
    userId: '',
    userName: null,
    peer: null,
    connectionManager: null as unknown as ConnectionManager,
    isPeerInitialized: false,
    pendingRoomId: null,
    isLocalNetwork: true,
    localIpAddress: null,

    setPendingRoomId: (roomId) => {
      set({ pendingRoomId: roomId });
    },

    setCurrentChat: (chat) => {
      set({ currentChat: chat });

      if (chat) {
        if (chat.isGroup) {
          const groupChat = chat as GroupChat;
          set({ messages: groupChat.messages || [] });
        } else {
          set({ messages: [] });
        }
      } else {
        set({ messages: [] });
      }
    },

    setUserName: (name) => {
      set({ userName: name });
      localStorage.setItem('userName', name);
      const { connectionManager, peerService } = lazyServices();
      set({ connectionManager });
      peerService.initializePeer(name);
    },

    createGroupChat: () => {
      lazyServices().groupChatService.createGroupChat();
    },

    joinGroupChat: (roomId) => {
      lazyServices().groupChatService.joinGroupChat(roomId);
    },

    sendMessage: (content) => {
      lazyServices().messageService.sendMessage(content);
    },

    copyShareLink: () => {
      const { currentChat } = get();
      if (!currentChat || !currentChat.isGroup) {
        return;
      }

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

    leaveCurrentChat: () => {
      lazyServices().groupChatService.leaveCurrentChat();
    },

    toggleNetworkMode: () => {
      return lazyServices().groupChatService.toggleNetworkMode();
    }
  };
});

function initializeFromStorage(): void {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }
  isInitialized = true;

  const savedUserName = localStorage.getItem('userName');
  if (savedUserName) {
    queueMicrotask(() => {
      useChatStore.getState().setUserName(savedUserName);
    });
  }
}

initializeFromStorage();

export default useChatStore;
