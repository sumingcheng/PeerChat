import { GroupChatService } from '@/services/groupChatService'
import { MessageService } from '@/services/messageService'
import { PeerService } from '@/services/peerService'
import { Chat, GroupChat, Message } from '@/types/chat'
import { EventEmitter } from '@/utils/eventEmitter'
import Peer from 'peerjs'
import { create } from 'zustand'

// 事件总线，用于跨组件通信
export const chatEvents = new EventEmitter()

// 定义聊天状态接口
interface ChatState {
  // 基础状态
  currentChat: Chat | null
  chats: Chat[]
  messages: Message[]
  loading: boolean
  isConnecting: boolean

  // 用户信息
  userId: string
  userName: string | null

  // PeerJS 相关
  peer: Peer | null
  connections: Record<string, any>
  isPeerInitialized: boolean
  pendingRoomId: string | null
  
  // 网络模式
  isLocalNetwork: boolean
  localIpAddress: string | null

  // 操作方法
  setCurrentChat: (chat: Chat | null) => void
  setUserName: (name: string) => void
  createGroupChat: () => void
  joinGroupChat: (roomId: string) => void
  sendMessage: (content: string) => void
  leaveCurrentChat: () => void
  copyShareLink: () => void
  setPendingRoomId: (roomId: string | null) => void
  toggleNetworkMode: () => boolean
}

// 创建 Zustand store
const useChatStore = create<ChatState>((set, get) => {
  // 初始化服务
  const peerService = new PeerService(set, get, chatEvents)
  const messageService = new MessageService(set, get, chatEvents)
  const groupChatService = new GroupChatService(set, get, chatEvents, peerService, messageService)
  
  // 将服务实例暴露给全局，方便在组件中直接调用
  if (typeof window !== 'undefined') {
    (window as any).peerService = peerService;
    (window as any).messageService = messageService;
    (window as any).groupChatService = groupChatService;
  }
  
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
    connections: {},
    isPeerInitialized: false,
    pendingRoomId: null,
    isLocalNetwork: true, // 默认使用局域网模式
    localIpAddress: null,

    // 设置待加入的群聊ID
    setPendingRoomId: (roomId) => {
      set({ pendingRoomId: roomId })
    },

    // 设置当前聊天
    setCurrentChat: (chat) => {
      set({ currentChat: chat })

      // 如果切换了聊天，更新消息列表
      if (chat) {
        // 如果是群聊，获取群聊的消息
        if (chat.isGroup) {
          const groupChat = chat as GroupChat
          set({ messages: groupChat.messages || [] })
        } else {
          // 普通聊天，暂时清空消息
          set({ messages: [] })
        }
      } else {
        set({ messages: [] })
      }
    },

    // 设置用户名
    setUserName: (name) => {
      set({ userName: name })
      // 保存到本地存储
      localStorage.setItem('userName', name)
      // 初始化 PeerJS
      peerService.initializePeer(name)
    },

    // 创建群聊
    createGroupChat: () => {
      groupChatService.createGroupChat()
    },

    // 加入群聊
    joinGroupChat: (roomId) => {
      groupChatService.joinGroupChat(roomId)
    },

    // 发送消息
    sendMessage: (content) => {
      messageService.sendMessage(content)
    },

    // 复制分享链接
    copyShareLink: () => {
      const { currentChat } = get()
      if (!currentChat || !currentChat.isGroup) return

      const groupChat = currentChat as GroupChat
      if (groupChat.shareLink) {
        navigator.clipboard.writeText(groupChat.shareLink)
          .then(() => {
            chatEvents.emit('linkCopied')
          })
          .catch(err => {
            console.error('复制链接失败:', err)
            chatEvents.emit('error', '复制链接失败')
          })
      }
    },

    // 离开当前聊天
    leaveCurrentChat: () => {
      groupChatService.leaveCurrentChat()
    },
    
    // 切换网络模式
    toggleNetworkMode: () => {
      return groupChatService.toggleNetworkMode();
    }
  }
})

// 初始化 - 从本地存储加载用户名
if (typeof window !== 'undefined') {
  const savedUserName = localStorage.getItem('userName')
  if (savedUserName) {
    setTimeout(() => {
      useChatStore.getState().setUserName(savedUserName)
    }, 0)
  }
}

export default useChatStore 