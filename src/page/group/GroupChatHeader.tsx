import useChatStore, { chatEvents } from '@/store/useChatStore.ts';
import { GroupChat } from '@/types/chat.ts';
import {
  Action as AlertDialogAction,
  Cancel as AlertDialogCancel,
  Content as AlertDialogContent,
  Description as AlertDialogDescription,
  Overlay as AlertDialogOverlay,
  Portal as AlertDialogPortal,
  Root as AlertDialogRoot,
  Title as AlertDialogTitle,
  Trigger as AlertDialogTrigger
} from '@radix-ui/react-alert-dialog';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Avatar from '../common/Avatar.tsx';

// 动画常量
const overlayShow = 'animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]';
const contentShow = 'animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]';

const GroupChatHeader: React.FC = () => {
  const currentChat = useChatStore((state) => state.currentChat);
  const copyShareLink = useChatStore((state) => state.copyShareLink);
  const leaveCurrentChat = useChatStore((state) => state.leaveCurrentChat);
  const isConnecting = useChatStore((state) => state.isConnecting);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const handleLinkCopied = () => {
      setIsCopying(false);
      toast.success('邀请链接已复制');
    };

    chatEvents.on('linkCopied', handleLinkCopied);

    return () => {
      chatEvents.off('linkCopied', handleLinkCopied);
    };
  }, []);

  if (!currentChat || !currentChat.isGroup) return null;

  const groupChat = currentChat as GroupChat;

  const handleCopyLink = () => {
    if (!groupChat.shareLink) {
      toast.error('无法获取分享链接');
      return;
    }

    setIsCopying(true);

    try {
      copyShareLink?.();

      // 如果3秒后还没收到linkCopied事件，显示可能的错误
      const timeoutId = setTimeout(() => {
        setIsCopying(false);
        console.log('复制链接失败，请手动复制');
      }, 3000);

      // 在组件卸载时清除定时器
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('复制链接失败:', error);
      setIsCopying(false);
    }
  };

  const handleLeaveChat = () => {
    leaveCurrentChat?.();
    setLeaveDialogOpen(false);
  };

  return (
    <div className="p-4 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center">
        <Avatar alt={groupChat.name} size="md" isHost={groupChat.isHost} />
        <div className="ml-3">
          <h2 className="font-medium">{groupChat.name}</h2>
          <p className="text-xs text-gray-500">
            {groupChat.users.length} 位成员
            {isConnecting && (
              <span className="ml-2 inline-flex items-center text-blue-500">
                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                连接中
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
          disabled={isConnecting || isCopying}
          onClick={handleCopyLink}
          title="复制邀请链接"
        >
          {isCopying ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          )}
        </button>

        <AlertDialogRoot open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
              disabled={isConnecting}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
            <AlertDialogContent
              className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
              w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none ${contentShow}`}
            >
              <AlertDialogTitle className="text-xl font-semibold mb-2">离开群聊</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 mb-6">
                确定要离开当前群聊吗？离开后将无法接收新消息，除非重新加入。
              </AlertDialogDescription>
              <div className="flex justify-end space-x-2">
                <AlertDialogCancel className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                  取消
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeaveChat}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  离开
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialogRoot>
      </div>
    </div>
  );
};

export default GroupChatHeader;
