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

    // 获取roomId（如果是群聊）
    const roomId = currentChat.isGroup ? (currentChat as GroupChat).roomId : undefined

    const newMessage: Message = {
      id: nanoid(),
      sender: userId,
      senderName: userName || undefined,
      content: content,
      timestamp: new Date().toISOString(),
      status: 'sent',
      roomId: roomId // 添加roomId信息
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
      
      if (groupChat.isHost) {
        // 如果是主持人，发送给所有连接的成员
        const { connections } = this.get()
        Object.values(connections).forEach((conn: any) => {
          try {
            conn.send({
              type: 'MESSAGE',
              data: newMessage
            })
          } catch (error) {
            console.error('发送消息失败:', error)
            // 可以在这里更新消息状态为错误
          }
        })
      } else {
        // 如果是成员，发送给主持人
        if (groupChat.connections && groupChat.connections.length > 0) {
          groupChat.connections.forEach((conn: any) => {
            try {
              conn.send({
                type: 'MESSAGE',
                data: newMessage
              })
            } catch (error) {
              console.error('发送消息失败:', error)
              // 可以在这里更新消息状态为错误
            }
          })
        }
      }
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