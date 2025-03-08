import React from 'react';
import { useChat } from '@/context/ChatContext';
import { GroupChat } from '@/types/chat';

const GroupUserList: React.FC = () => {
  const { currentChat, userId } = useChat();
  
  if (!currentChat || !currentChat.isGroup) return null;
  
  const groupChat = currentChat as GroupChat;
  const { users } = groupChat;
  
  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">
        群聊成员 ({users.length}/8)
      </h3>
      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="ml-2 text-sm">
              {user.name} {user.id === userId && '(我)'}
            </span>
            {groupChat.isHost && user.id === groupChat.roomId && (
              <span className="ml-1 text-xs text-blue-500">(主持人)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupUserList; 