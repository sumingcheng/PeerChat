export interface Sender {
  name: string
  avatar: string
}

// 定义可能的消息状态类型
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error' | undefined;

export interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  senderName?: string
  status?: MessageStatus
  roomId?: string
  isHost?: boolean
}

export interface User {
  id: string
  name: string
  avatar?: string
  isLocalNetwork?: boolean
  localIpAddress?: string
}

export interface LastMessage {
  content: string
  time: string
}

export interface Chat {
  id: string
  name: string
  avatar?: string
  isGroup?: boolean
  participants?: User[]
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

export interface GroupChat extends Chat {
  isGroup: true
  roomId: string
  isHost: boolean
  shareLink?: string
  users: User[]
  connections?: import('peerjs').DataConnection[]
  messages?: Message[]
  participants?: User[]
  isLocalNetwork?: boolean
  localIpAddress?: string
}

export interface ChatContextType {
  currentChat: Chat | null
  setCurrentChat: (chat: Chat | null) => void
  chats: Chat[]
  setChats: (chats: Chat[]) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  
  // PeerJS群聊相关
  userId?: string
  userName?: string
  setUserName?: (name: string) => void
  createGroupChat?: () => void
  joinGroupChat?: (roomId: string) => void
  sendMessage?: (content: string) => void
  leaveCurrentChat?: () => void
  copyShareLink?: () => void
  isConnecting: boolean
}

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  src?: string
  alt: string
  size?: AvatarSize
  className?: string
}

export interface BadgeProps {
  count?: number
  className?: string
}

export interface ChatListItemProps {
  chat: Chat
  isActive?: boolean
  onClick: () => void
  unreadCount?: number
  isConnecting?: boolean
} 