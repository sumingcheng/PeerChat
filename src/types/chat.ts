export interface Sender {
  name: string
  avatar: string
}

export interface Message {
  id: string
  content: string
  time: string
  status: 'sending' | 'sent' | 'failed'
  senderId: string
  sender: Sender
}

export interface LastMessage {
  content: string
  time: string
}

export interface Chat {
  id: string
  name: string
  avatar?: string
  unreadCount?: number
  lastMessage?: LastMessage
}

export interface ChatContextType {
  currentChat: Chat | null
  setCurrentChat: React.Dispatch<React.SetStateAction<Chat | null>>
  chats: Chat[]
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
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
} 