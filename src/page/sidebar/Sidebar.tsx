import { useChatEvents } from '@/hooks/useChatEvents';
import useChatStore from '@/store/useChatStore';
import { Chat, GroupChat } from '@/types/chat';
import { cleanRoomId } from '@/utils/roomUtils';
import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog';
import {
  Content as TooltipContent,
  Provider as TooltipProvider,
  Root as TooltipRoot,
  Trigger as TooltipTrigger
} from '@radix-ui/react-tooltip';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ChatListItem from './ChatListItem';

const LANG_KEY = 'language';

const Sidebar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const chats = useChatStore((state) => state.chats);
  const currentChat = useChatStore((state) => state.currentChat);
  const setCurrentChat = useChatStore((state) => state.setCurrentChat);
  const createGroupChat = useChatStore((state) => state.createGroupChat);
  const joinGroupChat = useChatStore((state) => state.joinGroupChat);
  const userName = useChatStore((state) => state.userName);
  const setUserName = useChatStore((state) => state.setUserName);
  const isConnecting = useChatStore((state) => state.isConnecting);

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (userName) { setTempUserName(userName); }
  }, [userName]);

  useChatEvents({
    joinedGroup: () => { setJoinDialogOpen(false); setRoomIdInput(''); setIsJoining(false); },
    error: () => { setIsJoining(false); }
  });

  const handleCreateGroupChat = () => {
    if (!userName) { setNameDialogOpen(true); return; }
    createGroupChat?.();
  };

  const handleSetUserName = () => {
    if (tempUserName.trim()) { setUserName?.(tempUserName); setNameDialogOpen(false); }
    else { toast.error(t('toast.invalidUsername')); }
  };

  const handleSelectChat = (chat: Chat) => {
    if (isConnecting) { return; }
    setCurrentChat?.(chat);
  };

  const handleJoinGroupChat = () => {
    if (!roomIdInput.trim()) { toast.error(t('toast.invalidRoomId')); return; }
    if (!userName) { setNameDialogOpen(true); return; }
    setIsJoining(true);
    toast.loading(t('toast.connectingToGroup'), { id: 'connecting', duration: 20000 });
    const cleanedRoomId = cleanRoomId(roomIdInput);
    const existingChat = chats.find((chat) => chat.isGroup && (chat as GroupChat).roomId === cleanedRoomId);
    if (existingChat) {
      toast.dismiss('connecting');
      toast.success(t('toast.alreadyJoined'));
      setCurrentChat?.(existingChat);
      setJoinDialogOpen(false);
      setRoomIdInput('');
      setIsJoining(false);
      return;
    }
    joinGroupChat?.(cleanedRoomId);
  };

  const processUrlInput = () => {
    try {
      if (roomIdInput.startsWith('http')) {
        const url = new URL(roomIdInput);
        const roomIdParam = url.searchParams.get('roomId');
        if (roomIdParam) { setRoomIdInput(roomIdParam); toast.success(t('toast.extractedRoomId')); }
        else { toast.error(t('toast.extractFailed')); }
      } else {
        handleJoinGroupChat();
      }
    } catch (error) {
      console.error('Error processing URL:', error);
      toast.error(t('toast.invalidLink'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isJoining) { handleJoinGroupChat(); }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem(LANG_KEY, next);
  };

  /* ─── Dialog 共用样式 ─── */
  const dialogOverlay = "fixed inset-0 bg-black/30 animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]";
  const dialogContent = "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-[420px] rounded-xl bg-white shadow-xl border border-gray-200 p-6 focus:outline-none animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]";

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{t('sidebar.title')}</h1>
        <div className="flex items-center space-x-2">
          <a
            href="https://github.com/sumingcheng/PeerChat"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
            title={t('sidebar.githubRepo')}
          >
            <img
              src="https://img.shields.io/github/stars/sumingcheng/PeerChat?logo=github"
              alt={t('sidebar.githubStars')}
              className="h-5"
            />
          </a>
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {i18n.language === 'en' ? '中文' : 'EN'}
          </button>
          <TooltipProvider>
            <div className="flex space-x-0.5">
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCreateGroupChat}
                    disabled={isConnecting}
                    className={`p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors
                      ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg z-50" sideOffset={5}>
                  {t('sidebar.createGroup')}
                </TooltipContent>
              </TooltipRoot>

              <TooltipRoot>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setJoinDialogOpen(true)}
                    disabled={isConnecting}
                    className={`p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors
                      ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg z-50" sideOffset={5}>
                  {t('sidebar.joinGroup')}
                </TooltipContent>
              </TooltipRoot>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">{t('sidebar.noChats')}</p>
            <p className="text-xs mt-1 text-gray-400">{t('sidebar.noChatsSub')}</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={currentChat?.id === chat.id}
                onClick={() => handleSelectChat(chat)}
                isConnecting={isConnecting && currentChat?.id === chat.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* 用户卡片 */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => setNameDialogOpen(true)}
          disabled={isConnecting}
          className={`w-full flex items-center rounded-lg p-2.5 transition-colors
            ${isConnecting ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
        >
          <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="ml-3 flex-1 text-left">
            <p className="text-sm font-medium text-gray-900">{userName || t('sidebar.notSetUsername')}</p>
            <p className="text-xs text-gray-400">
              {isConnecting ? (
                <span className="flex items-center text-blue-600">
                  <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('sidebar.connecting')}
                </span>
              ) : (
                t('sidebar.clickToChangeUsername')
              )}
            </p>
          </div>
          {!isConnecting && (
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* 用户名对话框 */}
      <Root open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <Portal>
          <Overlay className={dialogOverlay} />
          <Content
            className={dialogContent}
            onEscapeKeyDown={(e) => { if (!userName) { e.preventDefault(); } }}
            onPointerDownOutside={(e) => { if (!userName) { e.preventDefault(); } }}
          >
            <Title className="text-lg font-semibold text-gray-900">
              {userName ? t('dialog.changeUsername') : t('dialog.setUsername')}
            </Title>
            <Description className="text-gray-500 mt-1 mb-5 text-sm">
              {userName ? t('dialog.changeUsernameDesc') : t('dialog.setUsernameDesc')}
            </Description>
            <input
              type="text"
              value={tempUserName}
              onChange={(e) => setTempUserName(e.target.value)}
              placeholder={t('dialog.usernamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-5 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm transition-colors"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              {userName && (
                <button onClick={() => setNameDialogOpen(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  {t('dialog.cancel')}
                </button>
              )}
              <button onClick={handleSetUserName} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                {t('dialog.confirm')}
              </button>
            </div>
          </Content>
        </Portal>
      </Root>

      {/* 加入群聊对话框 */}
      <Root open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <Portal>
          <Overlay className={dialogOverlay} />
          <Content className={dialogContent}>
            <Title className="text-lg font-semibold text-gray-900">{t('dialog.joinGroupTitle')}</Title>
            <Description className="text-gray-500 mt-1 mb-5 text-sm">{t('dialog.joinGroupDesc')}</Description>
            <div className="mb-5">
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('dialog.joinGroupPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm transition-colors"
                autoFocus
                disabled={isJoining}
              />
              <div className="flex justify-between items-center">
                <button
                  onClick={processUrlInput}
                  disabled={isJoining || !roomIdInput.trim()}
                  className={`text-sm text-blue-600 hover:text-blue-700 font-medium ${isJoining || !roomIdInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {t('dialog.extractFromLink')}
                </button>
                <span className="text-xs text-gray-400">{t('dialog.joinExample')}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setJoinDialogOpen(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={isJoining}>
                {t('dialog.cancel')}
              </button>
              <button
                onClick={handleJoinGroupChat}
                disabled={isJoining || !roomIdInput.trim()}
                className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center
                  ${isJoining || !roomIdInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isJoining ? (
                  <>
                    <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('dialog.joining')}
                  </>
                ) : (
                  t('dialog.join')
                )}
              </button>
            </div>
          </Content>
        </Portal>
      </Root>
    </div>
  );
};

export default Sidebar;
