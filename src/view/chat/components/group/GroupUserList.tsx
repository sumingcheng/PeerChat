import React from 'react';
import useChatStore from '@/store/useChatStore';
import { GroupChat } from '@/types/chat';
import Avatar from '../common/Avatar';

const GroupUserList: React.FC = () => {
  const currentChat = useChatStore(state => state.currentChat);
  const userId = useChatStore(state => state.userId);
  
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
            <Avatar alt={user.name} size="sm" />
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