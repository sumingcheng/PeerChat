import { useChat } from '@/context/ChatContext'
import ChatListItem from './ChatListItem'

const Sidebar: React.FC = () => {
  const { chats, currentChat, setCurrentChat } = useChat();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="搜索聊天..."
          className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={currentChat?.id === chat.id}
            onClick={() => setCurrentChat(chat)}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 