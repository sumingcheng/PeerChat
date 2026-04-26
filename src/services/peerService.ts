import i18n from '@/i18n';
import { Chat, GroupChat, Message, User } from '@/types/chat';
import { ChatState, GetStateFunction, PeerMessage, SetStateFunction } from '@/types/store';
import { EventEmitter } from '@/utils/eventEmitter';
import { cleanRoomId } from '@/utils/roomUtils';
import { nanoid } from 'nanoid';
import Peer from 'peerjs';
import { ConnectionManager } from './connectionManager';

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

export class PeerService {
  private isLocalNetwork: boolean = false;
  private boundHandlers: {
    onData: (data: { peerId: string; data: unknown }) => void;
    onClosed: (data: { peerId: string }) => void;
    onError: (data: { peerId: string; error: Error }) => void;
  };

  constructor(
    private set: SetStateFunction<ChatState>,
    private get: GetStateFunction<ChatState>,
    private chatEvents: EventEmitter,
    private connectionManager: ConnectionManager
  ) {
    this.boundHandlers = {
      onData: this.handleConnectionData.bind(this),
      onClosed: this.handleConnectionClosed.bind(this),
      onError: this.handleConnectionError.bind(this)
    };

    this.detectLocalNetwork();
    this.setupConnectionManagerListeners();
  }

  private handleConnectionData({ peerId, data }: { peerId: string; data: unknown }): void {
    console.log(`Received data from ${peerId}:`, data);
    this.handleReceivedData(data as PeerMessage, peerId);
  }

  private handleConnectionClosed({ peerId }: { peerId: string }): void {
    console.log('Connection closed:', peerId);

    const { currentChat } = this.get();
    if (currentChat?.isGroup) {
      const groupChat = currentChat as GroupChat;
      if (peerId === groupChat.roomId && !groupChat.isHost) {
        this.chatEvents.emit('error', t('system.disconnected'));
      }
    }

    this.handleUserLeft(peerId);
  }

  private handleConnectionError({ peerId, error }: { peerId: string; error: Error }): void {
    console.error(`Connection error with ${peerId}:`, error);
  }

  private setupConnectionManagerListeners(): void {
    this.connectionManager.on('connection:data', this.boundHandlers.onData);
    this.connectionManager.on('connection:closed', this.boundHandlers.onClosed);
    this.connectionManager.on('connection:error', this.boundHandlers.onError);
  }

  destroy(): void {
    this.connectionManager.off('connection:data', this.boundHandlers.onData);
    this.connectionManager.off('connection:closed', this.boundHandlers.onClosed);
    this.connectionManager.off('connection:error', this.boundHandlers.onError);
  }

  private async detectLocalNetwork() {
    try {
      const RTCPeerConnection =
        window.RTCPeerConnection ||
        (window as any).webkitRTCPeerConnection ||
        (window as any).mozRTCPeerConnection;

      if (!RTCPeerConnection) {
        console.log('RTCPeerConnection not supported');
        return;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.createDataChannel('');

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      pc.onicecandidate = (ice) => {
        if (!ice.candidate) return;

        const localIpRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const localIpMatch = localIpRegex.exec(ice.candidate.candidate);

        if (localIpMatch) {
          const localIp = localIpMatch[1];

          if (
            localIp.startsWith('10.') ||
            localIp.startsWith('192.168.') ||
            localIp.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
          ) {
            console.log('LAN detected, local IP:', localIp);
            this.isLocalNetwork = true;
            this.set({ localIpAddress: localIp });
          }
        }

        pc.close();
      };
    } catch (error) {
      console.error('LAN detection failed:', error);
    }
  }

  initializePeer(userName: string) {
    const state = this.get();
    if (state.peer) {
      state.peer.destroy();
    }

    console.log('Initializing PeerJS...');
    this.set({ isPeerInitialized: false });

    const peerConfig: any = {
      debug: 3,
      secure: true,
      pingInterval: 5000,
      retries: 5,
      config: {
        iceServers: [
          { urls: 'stun:stun.miwifi.com:3478' },
          { urls: 'stun:stun.qq.com:3478' },
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:relay.metered.ca:80',
            username: 'e7d69958d8c3e9b91f0d',
            credential: 'Yzf0TTJbS/9/YKJZ'
          },
          {
            urls: 'turn:relay.metered.ca:443',
            username: 'e7d69958d8c3e9b91f0d',
            credential: 'Yzf0TTJbS/9/YKJZ'
          },
          {
            urls: 'turn:relay.metered.ca:443?transport=tcp',
            username: 'e7d69958d8c3e9b91f0d',
            credential: 'Yzf0TTJbS/9/YKJZ'
          }
        ],
        iceCandidatePoolSize: 10
      }
    };

    this.isLocalNetwork = false;

    const peerId = `user_${nanoid(10)}`;
    console.log(`Using PeerID: ${peerId}`);

    const newPeer = new Peer(peerId, peerConfig);

    newPeer.on('connection', (conn) => {
      console.log('New connection request:', conn.peer);

      conn.on('open', () => {
        console.log(`Connection opened with ${conn.peer}`);
      });

      conn.on('error', (err) => {
        console.error(`Connection error with ${conn.peer}:`, err);
      });
    });

    newPeer.on('open', (id) => {
      console.log('Connected to PeerJS server, my ID:', id);
      this.set({
        userId: id,
        peer: newPeer,
        isPeerInitialized: true,
        isLocalNetwork: this.isLocalNetwork
      });

      this.chatEvents.emit('peerInitialized', {
        id,
        isLocalNetwork: this.isLocalNetwork
      });

      this.setupPeerListeners(newPeer);

      const pendingRoomId = this.get().pendingRoomId;
      if (pendingRoomId) {
        console.log('PeerJS initialized, processing pending room:', pendingRoomId);
        setTimeout(() => {
          this.get().joinGroupChat(pendingRoomId);
          this.set({ pendingRoomId: null });
        }, 500);
      }
    });

    newPeer.on('error', (err) => {
      console.error('PeerJS initialization error:', err);

      if (this.isLocalNetwork && err.type === 'network') {
        console.log('LAN connection failed, switching to internet mode');
        this.isLocalNetwork = false;

        setTimeout(() => {
          this.initializePeer(userName);
        }, 1000);
      } else {
        this.chatEvents.emit('error', t('system.connectionError', { message: err.message || t('system.unknownError') }));
      }
    });
  }

  setupPeerListeners(peer: Peer) {
    peer.on('connection', (conn) => {
      const peerId = conn.peer;
      console.log('New connection:', peerId);
      this.connectionManager.addConnection(peerId, conn);
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      this.chatEvents.emit('error', t('system.connectionError', { message: err.message || t('system.unknownError') }));
    });

    peer.on('disconnected', () => {
      console.log('Disconnected from PeerJS server');
      peer.reconnect();
    });
  }

  handleReceivedData(data: PeerMessage, peerId: string) {
    const handlers: Record<string, (data: any, peerId: string) => void> = {
      MESSAGE: this.handleMessageData.bind(this),
      NEW_USER: this.handleNewUserData.bind(this),
      USER_JOINED: this.handleUserJoinedData.bind(this),
      ROOM_STATE: this.handleRoomStateData.bind(this),
      USER_LEFT: this.handleUserLeftData.bind(this),
      KEEP_ALIVE: this.handleKeepAliveData.bind(this)
    };

    const handler = handlers[data.type];
    if (handler) {
      handler(data.data, peerId);
    } else {
      console.warn(`Unknown data type: ${data.type}`);
    }
  }

  handleMessageData(data: any, peerId: string) {
    const { currentChat } = this.get();

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat;
      if (!data.roomId) {
        data.roomId = groupChat.roomId;
      }

      if (data.sender === groupChat.roomId) {
        data.isHost = true;
      }
    }

    const newMessage: Message = {
      ...data,
      id: data.id || nanoid()
    };

    this.set((state: ChatState) => ({ messages: [...state.messages, newMessage] }));

    if (currentChat && (currentChat.id === data.roomId || !data.roomId)) {
      const updatedChat = {
        ...currentChat,
        lastMessage: newMessage.content,
        lastMessageTime: newMessage.timestamp
      };

      this.set({ currentChat: updatedChat });

      this.set((state: ChatState) => ({
        chats: state.chats.map((chat: Chat) => (chat.id === currentChat.id ? updatedChat : chat))
      }));
    }

    if (currentChat && currentChat.isGroup && (currentChat as GroupChat).isHost) {
      this.connectionManager.broadcast(
        {
          type: 'MESSAGE',
          data: newMessage
        },
        [peerId]
      );
    }
  }

  handleNewUserData(data: User, peerId: string) {
    const { currentChat } = this.get();
    console.log(`Processing new user: ${data.name} (${data.id}), connection: ${peerId}`);

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat;
      console.log(`Current group: ${groupChat.name}, isHost: ${groupChat.isHost}`);

      const updatedUsers = [...(groupChat.users || []), data];
      const updatedParticipants = [...(groupChat.participants || []), data];

      if (groupChat.isHost) {
        const connStats = this.connectionManager.getStats();
        console.log(`As host, broadcasting new user to ${connStats.connected} peers`);

        this.connectionManager.broadcast(
          {
            type: 'USER_JOINED',
            data: data
          },
          [peerId]
        );

        const { messages } = this.get();
        console.log(`Sending room state: ${updatedUsers.length} users, ${messages.length} messages`);

        const success = this.connectionManager.sendData(peerId, {
          type: 'ROOM_STATE',
          data: {
            users: updatedUsers,
            messages: messages
          }
        });

        if (!success) {
          console.error(`Failed to send room state to ${peerId}`);
        }
      }

      const updatedChat = {
        ...groupChat,
        users: updatedUsers,
        participants: updatedParticipants
      };

      this.set({ currentChat: updatedChat });

      this.set((state: any) => ({
        chats: state.chats.map((chat: Chat) => (chat.id === currentChat.id ? updatedChat : chat))
      }));

      const systemMessage: Message = {
        id: nanoid(),
        sender: 'system',
        senderName: 'System',
        content: t('system.userJoined', { name: data.name }),
        timestamp: new Date().toISOString()
      };

      this.set((state: any) => ({ messages: [...state.messages, systemMessage] }));
    } else {
      console.error('No active group chat for new user');
    }
  }

  handleUserJoinedData(data: User, _peerId: string) {
    const { currentChat } = this.get();

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat;

      if (!groupChat.users.some((u: User) => u.id === data.id)) {
        const updatedUsers = [...groupChat.users, data];

        const updatedChat = {
          ...groupChat,
          users: updatedUsers
        };

        this.set({ currentChat: updatedChat });

        this.set((state: any) => ({
          chats: state.chats.map((chat: Chat) => (chat.id === currentChat.id ? updatedChat : chat))
        }));

        const systemMessage: Message = {
          id: nanoid(),
          sender: 'system',
          senderName: 'System',
          content: t('system.userJoined', { name: data.name }),
          timestamp: new Date().toISOString()
        };

        this.set((state: any) => ({ messages: [...state.messages, systemMessage] }));
      }
    }
  }

  handleRoomStateData(data: { users: User[]; messages: Message[] }, _peerId: string) {
    const { currentChat } = this.get();

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat;

      const hostUser = data.users.find((u: User) => u.id === groupChat.roomId);
      const hostName = hostUser?.name || t('system.unknownUser');

      const updatedChat = {
        ...groupChat,
        name: t('system.groupName', { name: hostName }),
        users: data.users,
        participants: data.users
      };

      this.set({
        currentChat: updatedChat,
        messages: data.messages
      });

      this.set((state: any) => ({
        chats: state.chats.map((chat: Chat) => (chat.id === currentChat.id ? updatedChat : chat))
      }));

      const syncContent = t('system.synced', { count: data.users.length });
      const systemMessage: Message = {
        id: nanoid(),
        sender: 'system',
        senderName: 'System',
        content: syncContent,
        timestamp: new Date().toISOString()
      };

      if (
        !data.messages.some(
          (msg: Message) => msg.sender === 'system' && msg.content.includes(syncContent.substring(0, 10))
        )
      ) {
        this.set((state: any) => ({
          messages: [...state.messages, systemMessage]
        }));
      }

      this.chatEvents.emit('joinedGroup', updatedChat);
    }
  }

  handleUserLeftData(data: { id: string }, _peerId: string) {
    this.handleUserLeft(data.id);
  }

  handleUserLeft(leftUserId: string) {
    const { currentChat } = this.get();

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat;

      const leftUser = groupChat.users.find((user: User) => user.id === leftUserId);

      const updatedUsers = groupChat.users.filter((user: User) => user.id !== leftUserId);
      const updatedParticipants = (groupChat.participants || []).filter(
        (user: User) => user.id !== leftUserId
      );

      const updatedChat = {
        ...groupChat,
        users: updatedUsers,
        participants: updatedParticipants
      };

      this.set({ currentChat: updatedChat });

      this.set((state: any) => ({
        chats: state.chats.map((chat: Chat) => (chat.id === currentChat.id ? updatedChat : chat))
      }));

      if (leftUser) {
        const systemMessage: Message = {
          id: nanoid(),
          sender: 'system',
          content: t('system.userLeft', { name: leftUser.name }),
          timestamp: new Date().toISOString()
        };

        this.set((state: any) => ({ messages: [...state.messages, systemMessage] }));
      }
    }
  }

  handleKeepAliveData(data: any, peerId: string) {
    console.log(`Heartbeat from ${peerId}`, data);

    const success = this.connectionManager.sendData(peerId, {
      type: 'KEEP_ALIVE_ACK',
      data: { timestamp: new Date().toISOString() }
    });

    if (!success) {
      console.warn(`Failed to send heartbeat ACK to ${peerId}`);
    }
  }

  cleanRoomId(id: string): string {
    return cleanRoomId(id);
  }

  getConnectionInfo() {
    return {
      isLocalNetwork: this.isLocalNetwork,
      localIpAddress: this.get().localIpAddress,
      isPeerInitialized: this.get().isPeerInitialized,
      userId: this.get().userId
    };
  }
}
