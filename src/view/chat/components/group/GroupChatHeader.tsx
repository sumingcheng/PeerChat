import { chatEvents } from '@/store/useChatStore'
import useChatStore from '@/store/useChatStore'
import { GroupChat } from '@/types/chat'
import {
  Action as AlertDialogAction, Cancel as AlertDialogCancel,
  Content as AlertDialogContent,
  Description as AlertDialogDescription,
  Overlay as AlertDialogOverlay,
  Portal as AlertDialogPortal,
  Root as AlertDialogRoot,
  Title as AlertDialogTitle,
  Trigger as AlertDialogTrigger
} from '@radix-ui/react-alert-dialog'
import { Content, Description, Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Avatar from '../common/Avatar'

const overlayShow = 'animate-[overlay-show_150ms_cubic-bezier(0.16,1,0.3,1)]';
const contentShow = 'animate-[content-show_150ms_cubic-bezier(0.16,1,0.3,1)]';

const GroupChatHeader: React.FC = () => {
  const currentChat = useChatStore(state => state.currentChat);
  const copyShareLink = useChatStore(state => state.copyShareLink);
  const leaveCurrentChat = useChatStore(state => state.leaveCurrentChat);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  
  useEffect(() => {
    const handleLinkCopied = () => {
      toast.success('邀请链接已复制');
      setDialogOpen(false);
    };
    
    chatEvents.on('linkCopied', handleLinkCopied);
    
    return () => {
      chatEvents.off('linkCopied', handleLinkCopied);
    };
  }, []);
  
  if (!currentChat || !currentChat.isGroup) return null;
  
  const groupChat = currentChat as GroupChat;
  
  const handleCopyLink = () => {
    copyShareLink?.();
  };
  
  const handleLeaveChat = () => {
    leaveCurrentChat?.();
    setLeaveDialogOpen(false);
  };
  
  return (
    <div className="p-4 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center">
        <Avatar alt={groupChat.name} size="md" />
        <div className="ml-3">
          <h2 className="font-medium">{groupChat.name}</h2>
          <p className="text-xs text-gray-500">{groupChat.users.length} 位成员</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Trigger asChild>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
                />
              </svg>
            </button>
          </Trigger>
          <Portal>
            <Overlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
            <Content className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
              w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none ${contentShow}`}>
              <Title className="text-xl font-semibold mb-4">分享群聊</Title>
              <Description className="text-gray-500 mb-4">
                复制下面的链接，邀请好友加入群聊：
              </Description>
              <div className="flex mb-6">
                <input 
                  type="text" 
                  value={groupChat.shareLink || ''} 
                  readOnly 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                >
                  复制
                </button>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  关闭
                </button>
              </div>
            </Content>
          </Portal>
        </Root>
        
        <AlertDialogRoot open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <AlertDialogTrigger asChild>
            <button 
              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
            </button>
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay className={`fixed inset-0 bg-black/30 ${overlayShow}`} />
            <AlertDialogContent className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] 
              w-[90vw] max-w-[450px] rounded-lg bg-white p-6 shadow-xl focus:outline-none ${contentShow}`}>
              <AlertDialogTitle className="text-xl font-semibold mb-2">
                离开群聊
              </AlertDialogTitle>
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