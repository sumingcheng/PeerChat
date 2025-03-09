import { nanoid } from 'nanoid'
import { EventEmitter } from '@/utils/eventEmitter'
import { Chat, GroupChat, Message } from '@/types/chat'

// 定义状态更新函数类型
type SetFunction = (partial: Partial<any> | ((state: any) => Partial<any>)) => void
type GetFunction = () => any

export class MessageService {
  constructor(
    private set: SetFunction,
    private get: GetFunction,
    private chatEvents: EventEmitter
  ) { }

  // 发送消息
  sendMessage(content: string) {
    const { currentChat, userId, userName, messages } = this.get()
    if (!content.trim() || !currentChat) return

    const newMessage: Message = {
      id: nanoid(),
      sender: userId,
      senderName: userName || undefined,
      content: content,
      timestamp: new Date().toISOString()
    }

    // 添加到自己的消息列表
    this.set({ messages: [...messages, newMessage] })

    // 更新当前聊天的最后消息
    const updatedChat = {
      ...currentChat,
      lastMessage: content,
      lastMessageTime: newMessage.timestamp
    }

    this.set({ currentChat: updatedChat })

    // 更新聊天列表
    this.set((state: any) => ({
      chats: state.chats.map((chat: Chat) =>
        chat.id === currentChat.id ? updatedChat : chat
      )
    }))

    // 如果是群聊，广播消息给所有连接的用户
    if (currentChat.isGroup) {
      const groupChat = currentChat as GroupChat
      groupChat.connections?.forEach(conn => {
        conn.send({
          type: 'MESSAGE',
          data: newMessage
        })
      })
    }
  }

  // 添加系统消息
  addSystemMessage(content: string): Message {
    const systemMessage: Message = {
      id: nanoid(),
      sender: 'system',
      senderName: 'System',
      content: content,
      timestamp: new Date().toISOString()
    }

    this.set((state: any) => ({
      messages: [...state.messages, systemMessage]
    }))

    return systemMessage
  }
} 