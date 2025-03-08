import React from 'react';
import useChatStore from '@/store/useChatStore';
import { GroupChat } from '@/types/chat';
import Avatar from '../common/Avatar';

const GroupUserList: React.FC = () => {
  const currentChat = useChatStore(state => state.currentChat);
  const userId = useChatStore(state => state.userId);
  const isConnecting = useChatStore(state => state.isConnecting);
  
  if (!currentChat || !currentChat.isGroup) return null;
  
  const groupChat = currentChat as GroupChat;
  const { users } = groupChat;
  
  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center justify-between">
        <span>群聊成员 ({users.length}/8)</span>
        {isConnecting && (
          <span className="text-blue-500 text-xs flex items-center">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            同步中
          </span>
        )}
      </h3>
      
      {users.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          {isConnecting ? (
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>正在加载成员列表...</p>
            </div>
          ) : (
            <p>暂无成员</p>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default GroupUserList; 