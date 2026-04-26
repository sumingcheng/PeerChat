import i18n from '@/i18n';
import { Chat, GroupChat } from '@/types/chat';
import { ChatState, GetStateFunction, SetStateFunction } from '@/types/store';
import { EventEmitter } from '@/utils/eventEmitter';
import { cleanRoomId } from '@/utils/roomUtils';
import { DataConnection } from 'peerjs';
import { ConnectionManager } from './connectionManager';
import { MessageService } from './messageService';
import { PeerService } from './peerService';

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

interface JoinGroupParams {
  roomId: string;
  peerId: string;
  userName: string;
  isLocalNetwork: boolean;
  localIpAddress?: string;
}

export class GroupChatService {
  private keepAliveInterval: number | null = null;

  constructor(
    private set: SetStateFunction<ChatState>,
    private get: GetStateFunction<ChatState>,
    private chatEvents: EventEmitter,
    private peerService: PeerService,
    private messageService: MessageService,
    private connectionManager: ConnectionManager
  ) {}

  private createJoinedGroupChat(params: JoinGroupParams): GroupChat {
    const { roomId, peerId, userName, isLocalNetwork, localIpAddress } = params;
    return {
      id: roomId,
      name: t('system.groupIdName', { id: roomId.substring(0, 6) }),
      isGroup: true,
      users: [
        { id: peerId, name: userName },
        { id: roomId, name: t('system.waitingHost') }
      ],
      messages: [],
      roomId: roomId,
      isHost: false,
      shareLink: `${window.location.origin}${window.location.pathname}?roomId=${roomId}`,
      isLocalNetwork,
      localIpAddress
    };
  }

  private updateChatsWithGroup(groupChat: GroupChat): void {
    const { chats } = this.get();
    const existingIndex = chats.findIndex((c: Chat) => c.id === groupChat.id);

    if (existingIndex >= 0) {
      const newChats = [...chats];
      newChats[existingIndex] = groupChat;
      this.set({ chats: newChats, currentChat: groupChat });
    } else {
      this.set({ chats: [groupChat, ...chats], currentChat: groupChat });
    }
  }

  private finishJoinGroup(
    conn: DataConnection,
    groupChat: GroupChat,
    params: JoinGroupParams
  ): void {
    const { peerId, userName, isLocalNetwork, localIpAddress } = params;

    conn.send({
      type: 'NEW_USER',
      data: { id: peerId, name: userName, isLocalNetwork, localIpAddress }
    });

    this.chatEvents.emit('joinedGroup', groupChat);
    this.set({ isConnecting: false });
    this.messageService.addSystemMessage(t('system.youJoined'));
    this.setupKeepAliveTimer();
  }

  createGroupChat() {
    const { peer, userName } = this.get();
    if (!peer || !userName) return;

    const groupId = peer.id;
    console.log(`Creating group with PeerJS ID as roomId: ${groupId}`);

    const connectionInfo = this.peerService.getConnectionInfo();
    const isLocalNetwork = connectionInfo.isLocalNetwork;
    const localIpAddress = connectionInfo.localIpAddress;

    const groupChat: GroupChat = {
      id: peer.id,
      name: t('system.groupName', { name: userName }),
      isGroup: true,
      users: [{ id: peer.id, name: userName }],
      messages: [],
      roomId: groupId,
      isHost: true,
      shareLink: `${window.location.origin}${window.location.pathname}?roomId=${groupId}`,
      isLocalNetwork: isLocalNetwork,
      localIpAddress: localIpAddress || undefined
    };

    const systemMessage = this.messageService.addSystemMessage(
      t('system.groupCreated', { id: groupId })
    );

    if (groupChat.messages) {
      groupChat.messages.push(systemMessage);
    }

    const { chats } = this.get();
    this.set({
      chats: [groupChat, ...chats],
      currentChat: groupChat,
      messages: groupChat.messages || []
    });

    this.chatEvents.emit('groupCreated', { isLocalNetwork, groupId });
    this.setupKeepAliveTimer();
  }

  private setupKeepAliveTimer() {
    const keepAliveInterval = setInterval(() => {
      const { peer, currentChat } = this.get();
      if (!peer || !currentChat || !currentChat.isGroup) {
        clearInterval(keepAliveInterval);
        return;
      }

      if (currentChat.isGroup && (currentChat as GroupChat).isHost) {
        const connStats = this.connectionManager.getStats();
        if (connStats.connected > 0) {
          console.log(`Sending heartbeat to ${connStats.connected} connections`);
          const sentCount = this.connectionManager.broadcast({
            type: 'KEEP_ALIVE',
            data: { timestamp: new Date().toISOString() }
          });

          if (sentCount === 0) {
            console.warn('Heartbeat failed, no active connections');
          }
        }
      }
    }, 60000);

    this.keepAliveInterval = keepAliveInterval;
  }

  async joinGroupChat(roomId: string) {
    const { peer, userName, chats, isPeerInitialized } = this.get();

    if (!isPeerInitialized) {
      console.log('PeerJS not initialized, saving roomId:', roomId);
      this.set({ pendingRoomId: roomId });
      return;
    }

    if (!peer || !userName) {
      console.error('Cannot join: PeerJS not initialized or username not set');
      this.chatEvents.emit('error', t('system.setUserFirst'));
      return;
    }

    this.set({ isConnecting: true });
    console.log(`Joining group, PeerJS ID: ${peer.id}, target: ${roomId}`);

    try {
      const cleanedRoomId = cleanRoomId(roomId);
      console.log(`Cleaned room ID: ${cleanedRoomId}`);

      const existingChat = chats.find(
        (chat: Chat) => chat.isGroup && (chat as GroupChat).roomId === cleanedRoomId
      );

      if (existingChat) {
        console.log('Already joined, switching');
        this.set({ currentChat: existingChat, isConnecting: false });
        this.chatEvents.emit('joinedGroup', existingChat as GroupChat);
        return;
      }

      const connectionInfo = this.peerService.getConnectionInfo();
      const isLocalNetwork = connectionInfo.isLocalNetwork;

      console.log(`Connecting to host: ${cleanedRoomId}`);

      if (!cleanedRoomId || cleanedRoomId.length < 5) {
        throw new Error(t('system.invalidGroupId'));
      }

      const conn = peer.connect(cleanedRoomId, {
        reliable: true,
        serialization: 'json',
        metadata: {
          isLocalNetwork,
          localIpAddress: connectionInfo.localIpAddress || undefined,
          userName: userName,
          peerId: peer.id,
          timestamp: new Date().toISOString()
        }
      });

      if (!conn) {
        throw new Error(t('system.cannotConnect'));
      }

      console.log('Connection object created:', conn);

      const connectionTimeout = setTimeout(() => {
        console.log('Connection timeout, retrying...');
        this.retryConnection(cleanedRoomId, userName);
      }, 30000);

      conn.on('error', (err: any) => {
        clearTimeout(connectionTimeout);
        console.error('Connection error:', err);

        if (err.type === 'peer-unavailable') {
          this.messageService.addSystemMessage(
            t('system.cannotConnectGroup')
          );
          this.chatEvents.emit('error', t('system.cannotConnectGroup'));
        } else {
          this.messageService.addSystemMessage(t('system.connectionError', { message: err.message || t('system.unknownError') }));
          this.chatEvents.emit('error', t('system.connectionError', { message: err.message || t('system.unknownError') }));
        }

        this.set({ isConnecting: false });
      });

      conn.on('open', () => {
        clearTimeout(connectionTimeout);
        console.log('Connected to host');

        this.connectionManager.addConnection(cleanedRoomId, conn);

        const joinParams: JoinGroupParams = {
          roomId: cleanedRoomId,
          peerId: peer.id,
          userName,
          isLocalNetwork,
          localIpAddress: connectionInfo.localIpAddress || undefined
        };

        const newGroupChat = this.createJoinedGroupChat(joinParams);
        console.log('New group chat object:', newGroupChat);

        this.updateChatsWithGroup(newGroupChat);
        this.finishJoinGroup(conn, newGroupChat, joinParams);
      });
    } catch (error: any) {
      console.error('Join group error:', error);
      this.chatEvents.emit('error', t('system.joinFailed', { message: error.message || t('system.unknownError') }));
      this.set({ isConnecting: false });
    }
  }

  leaveCurrentChat() {
    const { currentChat, userId, peer } = this.get();
    if (!currentChat || !currentChat.isGroup || !peer) return;

    const sentCount = this.connectionManager.broadcast({
      type: 'USER_LEFT',
      data: { id: userId }
    });

    console.log(`Notified ${sentCount} peers about leaving`);

    this.connectionManager.closeAllConnections();

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    try {
      peer.destroy();
    } catch (err) {
      console.error('Failed to destroy peer:', err);
    }

    this.set((state: any) => ({
      chats: state.chats.filter((chat: Chat) => chat.id !== currentChat.id),
      currentChat: null,
      messages: [],
      peer: null
    }));

    this.chatEvents.emit('leftGroup');

    const { userName } = this.get();
    if (userName) {
      setTimeout(() => {
        this.get().setUserName(userName);
      }, 1000);
    }
  }

  toggleNetworkMode() {
    const connectionInfo = this.peerService.getConnectionInfo();
    const currentMode = connectionInfo.isLocalNetwork;

    const { userName } = this.get();
    if (userName) {
      const { peer } = this.get();
      if (peer) {
        peer.destroy();
      }

      this.set({
        isLocalNetwork: !currentMode,
        peer: null,
        isPeerInitialized: false
      });

      setTimeout(() => {
        this.get().setUserName(userName);
      }, 500);

      this.chatEvents.emit('networkModeChanged', { isLocalNetwork: !currentMode });

      return !currentMode;
    }

    return currentMode;
  }

  private retryConnection(roomId: string, userName: string, retryCount: number = 0) {
    if (retryCount >= 2) {
      this.chatEvents.emit('error', t('system.retryFailed'));
      this.set({ isConnecting: false });
      return;
    }

    console.log(`Retry attempt ${retryCount + 1} for: ${roomId}`);

    const { peer } = this.get();
    if (!peer) {
      this.chatEvents.emit('error', t('system.peerNotInit'));
      this.set({ isConnecting: false });
      return;
    }

    const connectionInfo = this.peerService.getConnectionInfo();

    const conn = peer.connect(roomId, {
      reliable: true,
      serialization: 'json',
      metadata: {
        userName: userName,
        retryAttempt: retryCount + 1
      }
    });

    if (!conn) {
      this.chatEvents.emit('error', t('system.cannotConnect'));
      this.set({ isConnecting: false });
      return;
    }

    const connectionTimeout = setTimeout(() => {
      conn.close();
      this.retryConnection(roomId, userName, retryCount + 1);
    }, 15000);

    conn.on('open', () => {
      clearTimeout(connectionTimeout);
      console.log(`Retry succeeded, connected to: ${roomId}`);

      this.connectionManager.addConnection(roomId, conn);
      this.handleSuccessfulConnection(conn, roomId, userName, connectionInfo.isLocalNetwork);
    });

    conn.on('error', (err: any) => {
      clearTimeout(connectionTimeout);
      console.error(`Retry error (${retryCount + 1}/3):`, err);

      if (retryCount >= 1) {
        let errorMessage = t('system.retryFailed');
        if (err.type && err.type.toString() === 'peer-unavailable') {
          errorMessage = t('system.cannotConnectGroup');
        } else {
          errorMessage = t('system.connectionError', { message: err.message || t('system.unknownError') });
        }
        this.chatEvents.emit('error', errorMessage);
        this.set({ isConnecting: false });
      } else {
        setTimeout(() => {
          this.retryConnection(roomId, userName, retryCount + 1);
        }, 2000);
      }
    });
  }

  private handleSuccessfulConnection(
    conn: DataConnection,
    roomId: string,
    userName: string,
    isLocalNetwork: boolean
  ): void {
    const { peer } = this.get();
    if (!peer) {
      console.error('Peer not available');
      return;
    }

    const connectionInfo = this.peerService.getConnectionInfo();
    const joinParams: JoinGroupParams = {
      roomId,
      peerId: peer.id,
      userName,
      isLocalNetwork,
      localIpAddress: connectionInfo.localIpAddress || undefined
    };

    const newGroupChat = this.createJoinedGroupChat(joinParams);
    console.log('New group chat object:', newGroupChat);

    this.updateChatsWithGroup(newGroupChat);
    this.finishJoinGroup(conn, newGroupChat, joinParams);
  }
}
