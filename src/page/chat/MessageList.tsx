import useChatStore from '@/store/useChatStore.ts';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Message from './Message.tsx';

const MessageList: React.FC = () => {
  const { t } = useTranslation();
  const messages = useChatStore((state) => state.messages);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) { return; }
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShouldScrollToBottom(scrollHeight - scrollTop - clientHeight < 20);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const hasNewMessages = messages.length > prevMessagesLength;
    setPrevMessagesLength(messages.length);
    if ((shouldScrollToBottom && hasNewMessages) || messages.length <= 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldScrollToBottom, prevMessagesLength]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  return (
    <div className="flex-1 p-4 overflow-y-auto" ref={containerRef}>
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          {isConnecting ? (
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-3 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-500">{t('messageList.connectingWait')}</p>
              <p className="text-xs mt-1 text-gray-400">{t('messageList.connectingSub')}</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">{t('messageList.noMessages')}</p>
              <p className="text-xs mt-1 text-gray-400">{t('messageList.noMessagesSub')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;
