import Peer from 'peerjs'
import { nanoid } from 'nanoid'
import { EventEmitter } from '@/utils/eventEmitter'
import { Chat, GroupChat, Message, User } from '@/types/chat'
import { cleanRoomId } from '@/utils/roomUtils'

// 定义状态更新函数类型
type SetFunction = (partial: Partial<any> | ((state: any) => Partial<any>)) => void
type GetFunction = () => any

export class PeerService {
  private isLocalNetwork: boolean = false;

  constructor(
    private set: SetFunction,
    private get: GetFunction,
    private chatEvents: EventEmitter
  ) {
    // 检测是否在局域网环境
    this.detectLocalNetwork()
  }

  // 检测是否在局域网环境
  private async detectLocalNetwork() {
    try {
      // 尝试获取本地IP地址
      const RTCPeerConnection = window.RTCPeerConnection ||
        (window as any).webkitRTCPeerConnection ||
        (window as any).mozRTCPeerConnection

      if (!RTCPeerConnection) {
        console.log('当前浏览器不支持RTCPeerConnection，无法检测局域网')
        return
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      pc.createDataChannel('')

      // 创建offer并设置本地描述
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 监听ICE候选者
      pc.onicecandidate = (ice) => {
        if (!ice.candidate) return

        // 检查是否有本地IP地址
        const localIpRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
        const localIpMatch = localIpRegex.exec(ice.candidate.candidate)

        if (localIpMatch) {
          const localIp = localIpMatch[1]

          // 检查是否是局域网IP
          if (
            localIp.startsWith('10.') ||
            localIp.startsWith('192.168.') ||
            localIp.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
          ) {
            console.log('检测到局域网环境，本地IP:', localIp)
            this.isLocalNetwork = true

            // 存储本地IP地址
            this.set({ localIpAddress: localIp })
          }
        }

        // 关闭连接
        pc.close()
      }
    } catch (error) {
      console.error('检测局域网环境失败:', error)
    }
  }

  // 初始化PeerJS
  initializePeer(userName: string) {
    const state = this.get()
    if (state.peer) {
      state.peer.destroy()
    }

    console.log('正在初始化 PeerJS...')
    this.set({ isPeerInitialized: false })

    // 创建新的 peer 连接配置
    const peerConfig: any = {
      debug: 3,
      // 可选：使用自定义PeerJS服务器
      // host: 'localhost',
      // port: 9000,
      // path: '/',
      // secure: false, // 本地服务器通常不是https

      // 使用公共服务器时的配置
      secure: true,
      // 增加连接超时时间
      pingInterval: 5000,
      // 增加重试次数
      retries: 5,
      config: {
        iceServers: [
          // 添加中国的STUN服务器
          { urls: 'stun:stun.miwifi.com:3478' },
          { urls: 'stun:stun.qq.com:3478' },
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          // 添加免费的TURN服务器
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
          // 添加更多TURN服务器选项
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
        // 增加ICE收集超时时间
        iceCandidatePoolSize: 10
      }
    }

    // 暂时禁用局域网模式，因为需要专门的PeerJS服务器
    // 在实际部署时，可以配置自己的PeerJS服务器来支持局域网模式
    this.isLocalNetwork = false

    // 创建新的 peer 连接
    // 使用固定ID格式，避免UUID格式问题
    const peerId = `user_${nanoid(10)}`
    console.log(`使用生成的PeerID: ${peerId}`)

    const newPeer = new Peer(peerId, peerConfig)

    // 添加更多调试事件监听
    newPeer.on('connection', (conn) => {
      console.log('收到新连接请求:', conn.peer)

      // 立即设置连接事件处理
      conn.on('open', () => {
        console.log(`与 ${conn.peer} 的连接已打开`)
      })

      conn.on('error', (err) => {
        console.error(`与 ${conn.peer} 的连接发生错误:`, err)
      })
    })

    newPeer.on('open', (id) => {
      console.log('已连接到 PeerJS 服务器，我的 ID 是:', id)
      this.set({
        userId: id,
        peer: newPeer,
        isPeerInitialized: true,
        isLocalNetwork: this.isLocalNetwork
      })

      // 发送初始化成功事件
      this.chatEvents.emit('peerInitialized', {
        id,
        isLocalNetwork: this.isLocalNetwork
      })

      // 设置连接监听
      this.setupPeerListeners(newPeer)

      // 检查是否有待加入的群聊
      const pendingRoomId = this.get().pendingRoomId
      if (pendingRoomId) {
        console.log('PeerJS初始化完成，处理待加入的群聊:', pendingRoomId)
        setTimeout(() => {
          this.get().joinGroupChat(pendingRoomId)
          this.set({ pendingRoomId: null })
        }, 500)
      }
    })

    // 处理连接错误，可能需要降级到非局域网模式
    newPeer.on('error', (err) => {
      console.error('PeerJS 初始化错误:', err)

      // 如果是局域网模式且连接失败，尝试切换到互联网模式
      if (this.isLocalNetwork && err.type === 'network') {
        console.log('局域网连接失败，尝试切换到互联网模式')
        this.isLocalNetwork = false

        // 重新初始化
        setTimeout(() => {
          this.initializePeer(userName)
        }, 1000)
      } else {
        this.chatEvents.emit('error', `连接错误: ${err.message || '未知错误'}`)
      }
    })
  }

  // 设置 Peer 监听器
  setupPeerListeners(peer: Peer) {
    // 处理新连接
    peer.on('connection', (conn) => {
      const peerId = conn.peer
      console.log('收到新连接:', peerId)

      // 等待连接打开
      conn.on('open', () => {
        console.log(`与 ${peerId} 的连接已打开`)

        // 保存连接
        this.set((state: any) => ({
          connections: { ...state.connections, [peerId]: conn }
        }))

        // 处理数据
        conn.on('data', (data: any) => {
          console.log(`收到来自 ${peerId} 的数据:`, data)
          this.handleReceivedData(data, peerId)
        })
      })

      // 处理连接关闭
      conn.on('close', () => {
        console.log('连接已关闭:', peerId)

        // 从连接列表中移除
        this.set((state: any) => {
          const newConnections = { ...state.connections }
          delete newConnections[peerId]
          return { connections: newConnections }
        })

        // 处理用户离开逻辑
        this.handleUserLeft(peerId)
      })

      // 处理连接错误
      conn.on('error', (err) => {
        console.error(`与 ${peerId} 的连接发生错误:`, err)
      })
    })

    // 处理错误
    peer.on('error', (err) => {
      console.error('PeerJS 错误:', err)
      this.chatEvents.emit('error', `连接错误: ${err.message || '未知错误'}`)
    })

    // 处理断开连接
    peer.on('disconnected', () => {
      console.log('与 PeerJS 服务器断开连接')

      // 尝试重新连接
      peer.reconnect()
    })
  }

  // 处理接收到的数据
  handleReceivedData(data: any, peerId: string) {
    // 使用策略模式处理不同类型的消息
    const handlers: Record<string, (data: any, peerId: string) => void> = {
      'MESSAGE': this.handleMessageData.bind(this),
      'NEW_USER': this.handleNewUserData.bind(this),
      'USER_JOINED': this.handleUserJoinedData.bind(this),
      'ROOM_STATE': this.handleRoomStateData.bind(this),
      'USER_LEFT': this.handleUserLeftData.bind(this),
      'KEEP_ALIVE': this.handleKeepAliveData.bind(this)
    }

    const handler = handlers[data.type]
    if (handler) {
      handler(data.data, peerId)
    } else {
      console.warn(`未知的数据类型: ${data.type}`)
    }
  }

  // 处理消息数据
  handleMessageData(data: any, peerId: string) {
    const { currentChat } = this.get()

    // 添加消息
    const newMessage: Message = {
      ...data,
      id: data.id || nanoid()
    }

    this.set((state: any) => ({ messages: [...state.messages, newMessage] }))

    // 更新当前聊天的最后消息
    if (currentChat && currentChat.id === data.roomId) {
      const updatedChat = {
        ...currentChat,
        lastMessage: newMessage.content,
        lastMessageTime: newMessage.timestamp
      }

      this.set({ currentChat: updatedChat })

      // 更新聊天列表
      this.set((state: any) => ({
        chats: state.chats.map((chat: Chat) =>
          chat.id === currentChat.id ? updatedChat : chat
        )
      }))
    }
  }

  // 处理新用户数据
  handleNewUserData(data: User, peerId: string) {
    const { currentChat, connections } = this.get()
    console.log(`处理新用户加入: ${data.name} (${data.id}), 连接ID: ${peerId}`)

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat
      console.log(`当前群聊: ${groupChat.name}, 是否是主持人: ${groupChat.isHost}`)

      // 更新用户列表
      const updatedUsers = [...(groupChat.users || []), data]
      const updatedParticipants = [...(groupChat.participants || []), data]

      // 如果是主持人，广播新用户信息给所有其他用户
      if (groupChat.isHost) {
        console.log(`作为主持人，广播新用户信息给其他 ${Object.keys(connections).length} 个用户`)
        Object.entries(connections).forEach(([connPeerId, conn]: [string, any]) => {
          if (connPeerId !== peerId) {
            console.log(`向用户 ${connPeerId} 发送新用户加入通知`)
            conn.send({
              type: 'USER_JOINED',
              data: data
            })
          }
        })

        // 发送当前用户列表和消息历史给新用户
        const { messages } = this.get()
        console.log(`向新用户发送房间状态，包含 ${updatedUsers.length} 个用户和 ${messages.length} 条消息`)

        if (connections[peerId]) {
          connections[peerId].send({
            type: 'ROOM_STATE',
            data: {
              users: updatedUsers,
              messages: messages
            }
          })
        } else {
          console.error(`无法找到与用户 ${peerId} 的连接`)
        }
      }

      // 更新当前聊天
      const updatedChat = {
        ...groupChat,
        users: updatedUsers,
        participants: updatedParticipants
      }

      this.set({ currentChat: updatedChat })

      // 更新聊天列表
      this.set((state: any) => ({
        chats: state.chats.map((chat: Chat) =>
          chat.id === currentChat.id ? updatedChat : chat
        )
      }))

      // 添加系统消息
      const systemMessage: Message = {
        id: nanoid(),
        sender: 'system',
        senderName: 'System',
        content: `${data.name} 加入了群聊`,
        timestamp: new Date().toISOString()
      }

      this.set((state: any) => ({ messages: [...state.messages, systemMessage] }))
    } else {
      console.error('当前没有活动的群聊，无法处理新用户加入')
    }
  }

  // 处理用户加入广播
  handleUserJoinedData(data: User, peerId: string) {
    const { currentChat } = this.get()

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat

      // 检查用户是否已存在
      if (!groupChat.users.some((u: User) => u.id === data.id)) {
        // 更新用户列表
        const updatedUsers = [...groupChat.users, data]

        // 更新当前聊天
        const updatedChat = {
          ...groupChat,
          users: updatedUsers
        }

        this.set({ currentChat: updatedChat })

        // 更新聊天列表
        this.set((state: any) => ({
          chats: state.chats.map((chat: Chat) =>
            chat.id === currentChat.id ? updatedChat : chat
          )
        }))

        // 添加系统消息
        const systemMessage: Message = {
          id: nanoid(),
          sender: 'system',
          senderName: 'System',
          content: `${data.name} 加入了群聊`,
          timestamp: new Date().toISOString()
        }

        this.set((state: any) => ({ messages: [...state.messages, systemMessage] }))
      }
    }
  }

  // 处理房间状态
  handleRoomStateData(data: { users: User[], messages: Message[] }, peerId: string) {
    const { currentChat } = this.get()

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat

      // 查找房主用户
      const hostUser = data.users.find((u: User) => u.id === groupChat.roomId)
      const hostName = hostUser?.name || '未知用户'

      // 更新当前聊天
      const updatedChat = {
        ...groupChat,
        name: `${hostName}的群聊`,
        users: data.users,
        participants: data.users
      }

      this.set({
        currentChat: updatedChat,
        messages: data.messages
      })

      // 更新聊天列表
      this.set((state: any) => ({
        chats: state.chats.map((chat: Chat) =>
          chat.id === currentChat.id ? updatedChat : chat
        )
      }))

      // 添加系统消息，表明已成功加入并同步了群聊信息
      const systemMessage: Message = {
        id: nanoid(),
        sender: 'system',
        senderName: 'System',
        content: `已同步群聊信息，当前共有 ${data.users.length} 位成员`,
        timestamp: new Date().toISOString()
      }

      // 避免重复添加系统消息
      if (!data.messages.some((msg: Message) =>
        msg.sender === 'system' &&
        msg.content.includes('已同步群聊信息')
      )) {
        this.set((state: any) => ({
          messages: [...state.messages, systemMessage]
        }))
      }

      // 发送加入成功事件
      this.chatEvents.emit('joinedGroup', updatedChat)
    }
  }

  // 处理用户离开数据
  handleUserLeftData(data: { id: string }, peerId: string) {
    this.handleUserLeft(data.id)
  }

  // 处理用户离开
  handleUserLeft(leftUserId: string) {
    const { currentChat } = this.get()

    if (currentChat && currentChat.isGroup) {
      const groupChat = currentChat as GroupChat

      // 查找离开的用户
      const leftUser = groupChat.users.find((user: User) => user.id === leftUserId)

      // 更新用户列表
      const updatedUsers = groupChat.users.filter((user: User) => user.id !== leftUserId)
      const updatedParticipants = (groupChat.participants || []).filter((user: User) => user.id !== leftUserId)

      // 更新当前聊天
      const updatedChat = {
        ...groupChat,
        users: updatedUsers,
        participants: updatedParticipants
      }

      this.set({ currentChat: updatedChat })

      // 更新聊天列表
      this.set((state: any) => ({
        chats: state.chats.map((chat: Chat) =>
          chat.id === currentChat.id ? updatedChat : chat
        )
      }))

      // 添加系统消息
      if (leftUser) {
        const systemMessage: Message = {
          id: nanoid(),
          sender: 'system',
          content: `${leftUser.name} 已离开群聊`,
          timestamp: new Date().toISOString()
        }

        this.set((state: any) => ({ messages: [...state.messages, systemMessage] }))
      }
    }
  }

  // 处理心跳数据
  handleKeepAliveData(data: any, peerId: string) {
    console.log(`收到来自 ${peerId} 的心跳`, data)

    // 如果有连接，回复心跳确认
    const { connections } = this.get()
    if (connections[peerId]) {
      connections[peerId].send({
        type: 'KEEP_ALIVE_ACK',
        data: { timestamp: new Date().toISOString() }
      })
    }
  }

  // 使用工具函数清理 roomId
  cleanRoomId(id: string): string {
    return cleanRoomId(id)
  }

  // 获取连接状态信息
  getConnectionInfo() {
    return {
      isLocalNetwork: this.isLocalNetwork,
      localIpAddress: this.get().localIpAddress,
      isPeerInitialized: this.get().isPeerInitialized,
      userId: this.get().userId
    }
  }
} 