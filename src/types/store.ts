import Peer, { DataConnection } from 'peerjs';
import { Chat, Message, User } from './chat';

// 定义完整的聊天状态接口
export interface ChatState {
  // 基础状态
  currentChat: Chat | null;
  chats: Chat[];
  messages: Message[];
  loading: boolean;
  isConnecting: boolean;

  // 用户信息
  userId: string;
  userName: string | null;

  // PeerJS 相关
  peer: Peer | null;
  connections: Record<string, DataConnection>;
  isPeerInitialized: boolean;
  pendingRoomId: string | null;

  // 网络模式
  isLocalNetwork: boolean;
  localIpAddress: string | null;

  // 操作方法
  setCurrentChat: (chat: Chat | null) => void;
  setUserName: (name: string) => void;
  createGroupChat: () => void;
  joinGroupChat: (roomId: string) => void;
  sendMessage: (content: string) => void;
  leaveCurrentChat: () => void;
  copyShareLink: () => void;
  setPendingRoomId: (roomId: string | null) => void;
  toggleNetworkMode: () => boolean;
}

// 类型安全的状态更新函数
export type SetStateFunction<T = ChatState> = (
  partial: Partial<T> | ((state: T) => Partial<T>)
) => void;

export type GetStateFunction<T = ChatState> = () => T;

// PeerJS 消息类型定义
export interface PeerMessage<T = any> {
  type:
    | 'MESSAGE'
    | 'NEW_USER'
    | 'USER_JOINED'
    | 'ROOM_STATE'
    | 'USER_LEFT'
    | 'KEEP_ALIVE'
    | 'KEEP_ALIVE_ACK';
  data: T;
}

// 各种消息数据类型
export interface MessageData extends Message {}

export interface NewUserData {
  id: string;
  name: string;
  isLocalNetwork?: boolean;
  localIpAddress?: string;
}

export interface UserJoinedData extends NewUserData {}

export interface RoomStateData {
  users: User[];
  messages: Message[];
}

export interface UserLeftData {
  id: string;
}

export interface KeepAliveData {
  timestamp: string;
}
