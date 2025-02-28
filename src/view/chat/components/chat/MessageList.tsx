import { useChat } from '@/context/ChatContext'
import { Root, Scrollbar, Thumb, Viewport } from '@radix-ui/react-scroll-area'
import { useEffect, useRef } from 'react'
import Message from './Message'

const MessageList = () => {
  const { messages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Root className="flex-1 h-full">
      <Viewport ref={scrollRef} className="h-full w-full">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </div>
      </Viewport>
      <Scrollbar
        className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200"
        orientation="vertical"
      >
        <Thumb className="flex-1 bg-gray-300 rounded-full relative" />
      </Scrollbar>
    </Root>
  );
};

export default MessageList; 