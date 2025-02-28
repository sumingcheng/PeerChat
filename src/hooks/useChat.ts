import { useCallback } from 'react'
import { useChat as useChatContext } from '../context/ChatContext'
import { Chat, ChatContextType, Message } from '../types/chat'


export const useChat = () => {
  const context = useChatContext() as ChatContextType
  const { setMessages, setChats, currentChat } = context

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !currentChat) return

      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        time: new Date().toLocaleTimeString(),
        status: 'sending',
        senderId: 'currentUser',
        sender: {
          name: '当前用户',
          avatar: '/default-avatar.png'
        }
      }

      setMessages((prev: Message[]) => [...prev, newMessage])

      // 这里可以添加实际的消息发送逻辑
      // 例如：WebSocket 发送消息
      // socket.emit('send_message', newMessage);

      // 更新最后一条消息
      setChats((prev: Chat[]) =>
        prev.map((chat: Chat) =>
          chat.id === currentChat.id
            ? {
              ...chat,
              lastMessage: {
                content: content,
                time: new Date().toLocaleTimeString()
              }
            }
            : chat
        )
      )
    },
    [currentChat, setMessages, setChats]
  )

  return {
    ...context,
    sendMessage
  }
}

export default useChat 