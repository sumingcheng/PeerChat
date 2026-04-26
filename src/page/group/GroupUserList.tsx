import useChatStore from '@/store/useChatStore.ts';
import { GroupChat } from '@/types/chat.ts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../common/Avatar.tsx';

const GroupUserList: React.FC = () => {
  const { t } = useTranslation();
  const currentChat = useChatStore((state) => state.currentChat);
  const userId = useChatStore((state) => state.userId);
  const isConnecting = useChatStore((state) => state.isConnecting);

  if (!currentChat || !currentChat.isGroup) { return null; }

  const groupChat = currentChat as GroupChat;
  const { users } = groupChat;

  return (
    <div className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>{t('group.chatMembers', { count: users.length })}</span>
        {isConnecting && (
          <span className="text-blue-600 flex items-center font-normal normal-case tracking-normal">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('group.syncing')}
          </span>
        )}
      </h3>

      {users.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          {isConnecting ? (
            <div className="flex flex-col items-center">
              <svg className="w-6 h-6 mb-2 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>{t('group.loadingMembers')}</p>
            </div>
          ) : (
            <p>{t('group.noMembers')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-0.5">
          {users.map((user) => (
            <div key={user.id} className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Avatar alt={user.name} size="sm" isHost={user.id === groupChat.roomId} />
              <span className="ml-2 text-sm text-gray-700">{user.name}</span>
              {user.id === userId && (
                <span className="ml-1 text-xs text-blue-600 font-medium">{t('group.me')}</span>
              )}
              {groupChat.isHost && user.id === groupChat.roomId && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium">{t('group.hostLabel')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupUserList;
