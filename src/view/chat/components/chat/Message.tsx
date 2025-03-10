import useChatStore from '@/store/useChatStore'
import { GroupChat, Message as MessageType } from '@/types/chat'
import React from 'react'
import Avatar from '../common/Avatar'

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const userId = useChatStore(state => state.userId);
  const currentChat = useChatStore(state => state.currentChat);
  const isOwn = message.sender === userId;
  
  // 检查发送者是否是主持人
  const isHost = message.isHost || // 1. 直接使用消息中的isHost字段
                 (currentChat && 
                  currentChat.isGroup && 
                  ((currentChat as GroupChat).roomId === message.sender || // 2. 通过roomId判断
                   (message.roomId && message.sender === message.roomId))); // 3. 通过消息自身的roomId判断
  
  // 检查当前用户是否是主持人
  const currentUserIsHost = currentChat && 
                           currentChat.isGroup && 
                           (currentChat as GroupChat).isHost;
  
  // 系统消息特殊处理
  if (message.sender === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
          {message.content}
        </div>
      </div>
    );
  }

  // 格式化时间
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // 获取消息状态（如果存在）
  const messageStatus = message.status || (isOwn ? 'sent' : undefined);
  
  // 消息状态
  const getStatusIndicator = () => {
    if (!isOwn) return null;
    
    switch (messageStatus) {
      case 'sending':
        return (
          <span className="ml-2 flex items-center text-gray-400">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            发送中
          </span>
        );
      case 'sent':
        return (
          <span className="ml-2 text-gray-400">
            已发送
          </span>
        );
      case 'delivered':
        return (
          <span className="ml-2 text-blue-500">
            已送达
          </span>
        );
      case 'read':
        return (
          <span className="ml-2 text-green-500">
            已读
          </span>
        );
      case 'error':
        return (
          <span className="ml-2 text-red-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            发送失败
          </span>
        );
      default:
        return (
          <span className="ml-2 text-gray-400">
            已发送
          </span>
        );
    }
  };

  // 调试信息
  console.log(`消息: ${message.content}, 发送者: ${message.sender}, roomId: ${message.roomId}, 是否主持人: ${isHost}`);

  return (
    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <Avatar 
        alt={message.senderName || '用户'} 
        size="sm"
        className={isOwn ? 'ml-3' : 'mr-3'}
      />
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && message.senderName && (
          <div className="text-xs font-medium mb-1 text-gray-500">
            {message.senderName}
            {isHost && <span className="ml-1 text-blue-500">（主持人）</span>}
          </div>
        )}
        <div
          className={`rounded-lg p-3 break-words ${
            isOwn
              ? messageStatus === 'error' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-500 text-white'
              : isHost
                ? 'bg-green-500 text-white' // 主持人消息使用绿色背景
                : currentUserIsHost
                  ? 'bg-blue-500 text-white' // 主持人视角下，成员消息使用蓝色背景
                  : 'bg-gray-100 text-gray-900' // 普通成员视角下，其他成员消息使用灰色背景
          }`}
        >
          {message.content}
        </div>
        <div className="mt-1 text-xs text-gray-500 flex items-center">
          <span>{formattedTime}</span>
          {getStatusIndicator()}
        </div>
      </div>
    </div>
  );
};

export default Message; 