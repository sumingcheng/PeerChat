import { nanoid } from 'nanoid';
import { Chat, GroupChat, Message } from '@/types/chat';
import { ChatState, SetStateFunction, GetStateFunction } from '@/types/store';
import { ConnectionManager } from './connectionManager';

export class MessageService {
  constructor(
    private set: SetStateFunction<ChatState>,
    private get: GetStateFunction<ChatState>,
    private readonly connectionManager: ConnectionManager
  ) {}

  // 发送消息
  sendMessage(content: string) {
    const { currentChat, userId, userName, messages } = this.get();
    if (!content.trim() || !currentChat) return;

    // 获取roomId（如果是群聊）
    const roomId = currentChat.isGroup ? (currentChat as GroupChat).roomId : undefined;

    // 检查是否是主持人
    const isHost = currentChat.isGroup && (currentChat as GroupChat).isHost;

    const newMessage: Message = {
      id: nanoid(),
      sender: userId,
      senderName: userName || undefined,
      content: content,
      timestamp: new Date().toISOString(),
      status: 'sent',
      roomId: roomId, // 添加roomId信息
      isHost: isHost // 添加isHost标记
    } as Message;

    // 添加到自己的消息列表
    this.set({ messages: [...messages, newMessage] });

    // 更新当前聊天的最后消息
    const updatedChat = {
      ...currentChat,
      lastMessage: content,
      lastMessageTime: newMessage.timestamp
    };

    this.set({ currentChat: updatedChat });

    // 更新聊天列表
    this.set((state: ChatState) => ({
      chats: state.chats.map((chat: Chat) => (chat.id === currentChat.id ? updatedChat : chat))
    }));

    // 如果是群聊，广播消息给所有连接的用户
    if (currentChat.isGroup) {
      const groupChat = currentChat as GroupChat;

      if (groupChat.isHost) {
        // 如果是主持人，广播给所有连接的成员
        const sentCount = this.connectionManager.broadcast({
          type: 'MESSAGE',
          data: newMessage
        });

        if (sentCount === 0) {
          console.warn('没有活跃的连接，消息未发送');
        }
      } else {
        // 如果是成员，发送给主持人 - 这里需要知道主持人的 peerId
        // 通常主持人的 peerId 就是 roomId
        const success = this.connectionManager.sendData(groupChat.roomId, {
          type: 'MESSAGE',
          data: newMessage
        });

        if (!success) {
          console.error('发送消息给主持人失败');
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
    };

    this.set((state: ChatState) => ({
      messages: [...state.messages, systemMessage]
    }));

    return systemMessage;
  }
}
