import useChatStore from '@/store/useChatStore.ts';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ChatInput: React.FC = () => {
  const { t } = useTranslation();
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const currentChat = useChatStore((state) => state.currentChat);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !isConnecting && !isSending) { inputRef.current.focus(); }
  }, [isConnecting, isSending]);

  useEffect(() => {
    if (inputRef.current && currentChat) { setTimeout(() => { inputRef.current?.focus(); }, 100); }
  }, [currentChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && sendMessage && !isConnecting) {
      setIsSending(true);
      try { sendMessage(message); setMessage(''); }
      catch (error) { console.error('Failed to send:', error); toast.error(t('chat.sendFailed')); }
      finally { setIsSending(false); setTimeout(() => { inputRef.current?.focus(); }, 0); }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isConnecting && !isSending) { handleSendMessage(e as unknown as React.FormEvent); }
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder={isConnecting ? t('chat.connectingPlaceholder') : t('chat.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
          disabled={isConnecting || isSending}
          autoFocus
        />
        <button
          type="submit"
          disabled={isConnecting || isSending || !message.trim()}
          className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors min-w-[64px]
            flex items-center justify-center
            ${isConnecting || isSending || !message.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          {isSending ? (
            <>
              <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('chat.sending')}
            </>
          ) : (
            t('chat.send')
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
