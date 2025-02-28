import { Message as MessageType } from '@/types/chat'
import React from 'react'
import Avatar from '../common/Avatar'

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isOwn = message.senderId === 'currentUser'; // 这里需要根据实际认证系统修改

  return (
    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar
        src={message.sender.avatar}
        alt={message.sender.name}
        size="sm"
        className={isOwn ? 'ml-3' : 'mr-3'}
      />
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg p-3 ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {message.content}
        </div>
        <div className="mt-1 text-xs text-gray-500 flex items-center">
          <span>{message.time}</span>
          {isOwn && (
            <span className="ml-2">
              {message.status === 'sent' ? '已发送' : '发送中...'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message; 