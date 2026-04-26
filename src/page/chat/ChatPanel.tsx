import { useChatEvents } from '@/hooks/useChatEvents';
import useChatStore from '@/store/useChatStore';
import { GroupChat } from '@/types/chat';
import { cleanRoomId } from '@/utils/roomUtils';
import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import GroupChatHeader from '../group/GroupChatHeader';
import GroupUserList from '../group/GroupUserList';
import ChatInput from '../input/ChatInput';
import MessageList from './MessageList';

const ChatPanel: React.FC = () => {
  const { t } = useTranslation();
  const currentChat = useChatStore((state) => state.currentChat);
  const createGroupChat = useChatStore((state) => state.createGroupChat);
  const userName = useChatStore((state) => state.userName);
  const setUserName = useChatStore((state) => state.setUserName);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const joinGroupChat = useChatStore((state) => state.joinGroupChat);
  const pendingRoomId = useChatStore((state) => state.pendingRoomId);
  const isPeerInitialized = useChatStore((state) => state.isPeerInitialized);
  const chats = useChatStore((state) => state.chats);
  const setCurrentChat = useChatStore((state) => state.setCurrentChat);
  const toggleNetworkMode = useChatStore((state) => state.toggleNetworkMode);

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocalNetwork] = useState<boolean | null>(null);
  const [networkModeDialogOpen, setNetworkModeDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const errorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userName) { setNameDialogOpen(true); }
  }, [userName]);

  useEffect(() => {
    if (userName && pendingRoomId && isPeerInitialized) {
      toast.loading(t('toast.connectingToGroup'), { id: 'connecting', duration: 20000 });
      joinGroupChat?.(pendingRoomId);
    }
  }, [userName, pendingRoomId, joinGroupChat, isPeerInitialized]);

  useEffect(() => {
    return () => { if (errorTimeoutRef.current) { clearTimeout(errorTimeoutRef.current); } };
  }, []);

  useChatEvents({
    error: (message) => {
      setErrorMessage(message);
      setIsJoining(false);
      if (message.includes('Could not connect to peer')) {
        const peerId = message.match(/Could not connect to peer (\w+)/)?.[1];
        toast.error(
          <div>
            <div>{t('toast.connectionFailed')}</div>
            {peerId && <div className="text-xs mt-1 text-gray-500">{t('toast.peerId', { id: peerId })}</div>}
            <div className="text-xs mt-1 text-gray-500">{t('toast.connectionFailedReason')}</div>
          </div>,
          { duration: 5000 }
        );
        toast.dismiss('connecting');
      } else {
        toast.error(message);
      }
      if (errorTimeoutRef.current) { clearTimeout(errorTimeoutRef.current); }
      errorTimeoutRef.current = window.setTimeout(() => { setErrorMessage(null); errorTimeoutRef.current = null; }, 5000);
    },
    groupCreated: () => { toast.success(t('toast.groupCreated')); },
    joinedGroup: (groupChat) => {
      toast.dismiss('connecting');
      setJoinDialogOpen(false);
      setRoomIdInput('');
      setIsJoining(false);
      if (groupChat) {
        toast.success(<div><div>{t('toast.joinedGroup')}</div><div className="text-xs mt-1 text-gray-500">{t('toast.groupName', { name: groupChat.name })}</div></div>);
      } else {
        toast.success(t('toast.joinedGroup'));
      }
    },
    leftGroup: () => { toast(t('toast.leftGroup'), { icon: '🔔' }); },
    connecting: (peerId) => { toast.loading(t('toast.connectingToPeer', { id: peerId }), { id: 'connecting' }); },
    peerInitialized: (data) => {
      toast.success(<div><div>{t('toast.connected')}</div><div className="text-xs mt-1 text-gray-500">{t('toast.yourPeerId', { id: data.id.substring(0, 8) })}</div></div>, { duration: 3000 });
    },
    networkModeChanged: (data) => {
      const mode = data.isLocalNetwork ? t('network.lan') : t('network.internet');
      toast.success(t('toast.switchedMode', { mode }));
    }
  });

  const handleCreateGroupChat = useCallback(() => {
    if (!userName) { setNameDialogOpen(true); return; }
    createGroupChat?.();
  }, [createGroupChat, userName]);

  const handleSetUserName = () => {
    if (tempUserName.trim()) { setUserName?.(tempUserName); setNameDialogOpen(false); }
    else { toast.error(t('toast.invalidUsername')); }
  };

  const handleToggleNetworkMode = () => { toggleNetworkMode(); setNetworkModeDialogOpen(false); };

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
    } catch { toast.error(t('toast.invalidLink')); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isJoining) { handleJoinGroupChat(); }
  };

  const dialogOverlay = "fixed inset-0 bg-black/30 animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]";
  const dialogContent = "fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-[420px] rounded-xl bg-white shadow-xl border border-gray-200 p-6 focus:outline-none animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]";
  const btnCancel = "px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors";
  const btnPrimary = "px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium";
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm transition-colors";

  if (!currentChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('chat.startNewConversation')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('chat.startNewConversationSub')}</p>
            {userName && (
              <p className="text-sm mt-3 text-gray-500">
                {t('chat.currentUser', { name: userName })}
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span>{errorMessage}</span>
                  {errorMessage.includes('Could not connect to peer') && (
                    <div className="mt-1 text-xs text-red-500"><p>{t('toast.errorTip')}</p><p>{t('toast.errorAdvice')}</p></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isConnecting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('chat.connectingWait')}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center pt-1">
            <button
              onClick={handleCreateGroupChat}
              disabled={isConnecting}
              className={`px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-2 font-medium
                ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('chat.createGroup')}</span>
            </button>
            <button
              onClick={() => setJoinDialogOpen(true)}
              disabled={isConnecting}
              className={`px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm transition-colors flex items-center space-x-2 font-medium
                ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{t('chat.joinGroup')}</span>
            </button>
          </div>
        </div>

        {/* 用户名对话框 */}
        <Root open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
          <Portal>
            <Overlay className={dialogOverlay} />
            <Content className={dialogContent} onEscapeKeyDown={(e) => { if (!userName) { e.preventDefault(); } }} onPointerDownOutside={(e) => { if (!userName) { e.preventDefault(); } }}>
              <Title className="text-lg font-semibold text-gray-900">{userName ? t('dialog.changeUsername') : t('dialog.setUsername')}</Title>
              <Description className="text-gray-500 mt-1 mb-5 text-sm">{userName ? t('dialog.changeUsernameDesc') : t('dialog.setUsernameDesc')}</Description>
              <input type="text" value={tempUserName} onChange={(e) => setTempUserName(e.target.value)} placeholder={t('dialog.usernamePlaceholder')} className={`${inputClass} mb-5`} autoFocus />
              <div className="flex justify-end space-x-2">
                {userName && <button onClick={() => setNameDialogOpen(false)} className={btnCancel}>{t('dialog.cancel')}</button>}
                <button onClick={handleSetUserName} className={btnPrimary}>{t('dialog.confirm')}</button>
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
                <input type="text" value={roomIdInput} onChange={(e) => setRoomIdInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t('dialog.joinGroupPlaceholder')} className={`${inputClass} mb-2`} autoFocus disabled={isJoining} />
                <div className="flex justify-between items-center">
                  <button onClick={processUrlInput} disabled={isJoining || !roomIdInput.trim()} className={`text-sm text-blue-600 hover:text-blue-700 font-medium ${isJoining || !roomIdInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>{t('dialog.extractFromLink')}</button>
                  <span className="text-xs text-gray-400">{t('dialog.joinExample')}</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setJoinDialogOpen(false)} className={btnCancel} disabled={isJoining}>{t('dialog.cancel')}</button>
                <button onClick={handleJoinGroupChat} disabled={isJoining || !roomIdInput.trim()} className={`${btnPrimary} flex items-center ${isJoining || !roomIdInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isJoining ? (<><svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('dialog.joining')}</>) : t('dialog.join')}
                </button>
              </div>
            </Content>
          </Portal>
        </Root>

        {/* 网络模式对话框 */}
        <Root open={networkModeDialogOpen} onOpenChange={setNetworkModeDialogOpen}>
          <Portal>
            <Overlay className={dialogOverlay} />
            <Content className={dialogContent}>
              <Title className="text-lg font-semibold text-gray-900">{t('network.switchMode')}</Title>
              <Description className="text-gray-500 mt-1 mb-5 text-sm">{t('network.currentMode', { mode: isLocalNetwork ? t('network.lan') : t('network.internet') })}</Description>
              <div className="mb-6 space-y-2">
                <p className="text-sm text-gray-600"><strong>{t('network.lanModeLabel')}</strong> {t('network.lanModeDesc')}</p>
                <p className="text-sm text-gray-600"><strong>{t('network.internetModeLabel')}</strong> {t('network.internetModeDesc')}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setNetworkModeDialogOpen(false)} className={btnCancel}>{t('dialog.cancel')}</button>
                <button onClick={handleToggleNetworkMode} className={btnPrimary}>{t('network.switchTo', { mode: isLocalNetwork ? t('network.internet') : t('network.lan') })}</button>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>
    );
  }

  const isGroupChat = currentChat.isGroup;

  return (
    <div className="h-full flex flex-col">
      {errorMessage && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span>{errorMessage}</span>
              {errorMessage.includes('Could not connect to peer') && (
                <div className="mt-1 text-xs text-red-500"><p>{t('toast.errorTip')}</p><p>{t('toast.errorAdvice')}</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {isConnecting && (
        <div className="mx-4 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{t('chat.connectingWait')}</span>
          </div>
        </div>
      )}

      {isGroupChat ? (
        <>
          <GroupChatHeader />
          <div className="flex flex-1 overflow-hidden">
            <div className="hidden md:block w-60 bg-gray-50 border-r border-gray-100 overflow-y-auto">
              <GroupUserList />
            </div>
            <div className="flex-1 flex flex-col">
              <MessageList />
              <ChatInput />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="px-4 py-3 flex items-center border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
              {currentChat.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="ml-3 text-sm font-medium text-gray-900">{currentChat.name}</h2>
          </div>
          <MessageList />
          <ChatInput />
        </>
      )}

      <Root open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <Portal>
          <Overlay className={dialogOverlay} />
          <Content className={dialogContent} onEscapeKeyDown={(e) => { if (!userName) { e.preventDefault(); } }} onPointerDownOutside={(e) => { if (!userName) { e.preventDefault(); } }}>
            <Title className="text-lg font-semibold text-gray-900">{userName ? t('dialog.changeUsername') : t('dialog.setUsername')}</Title>
            <Description className="text-gray-500 mt-1 mb-5 text-sm">{userName ? t('dialog.changeUsernameDesc') : t('dialog.setUsernameDesc')}</Description>
            <input type="text" value={tempUserName} onChange={(e) => setTempUserName(e.target.value)} placeholder={t('dialog.usernamePlaceholder')} className={`${inputClass} mb-5`} autoFocus />
            <div className="flex justify-end space-x-2">
              {userName && <button onClick={() => setNameDialogOpen(false)} className={btnCancel}>{t('dialog.cancel')}</button>}
              <button onClick={handleSetUserName} className={btnPrimary}>{t('dialog.confirm')}</button>
            </div>
          </Content>
        </Portal>
      </Root>

      <Root open={networkModeDialogOpen} onOpenChange={setNetworkModeDialogOpen}>
        <Portal>
          <Overlay className={dialogOverlay} />
          <Content className={dialogContent}>
            <Title className="text-lg font-semibold text-gray-900">{t('network.switchMode')}</Title>
            <Description className="text-gray-500 mt-1 mb-5 text-sm">{t('network.currentMode', { mode: isLocalNetwork ? t('network.lan') : t('network.internet') })}</Description>
            <div className="mb-6 space-y-2">
              <p className="text-sm text-gray-600"><strong>{t('network.lanModeLabel')}</strong> {t('network.lanModeDesc')}</p>
              <p className="text-sm text-gray-600"><strong>{t('network.internetModeLabel')}</strong> {t('network.internetModeDesc')}</p>
              <p className="text-sm text-red-500"><strong>{t('network.switchWarning')}</strong></p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setNetworkModeDialogOpen(false)} className={btnCancel}>{t('dialog.cancel')}</button>
              <button onClick={handleToggleNetworkMode} className={btnPrimary}>{t('network.switchTo', { mode: isLocalNetwork ? t('network.internet') : t('network.lan') })}</button>
            </div>
          </Content>
        </Portal>
      </Root>
    </div>
  );
};

export default ChatPanel;
