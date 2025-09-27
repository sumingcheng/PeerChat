import { Chat, GroupChat } from '@/types/chat'
import { EventEmitter } from '@/utils/eventEmitter'
import { cleanRoomId } from '@/utils/roomUtils'
import { ChatState, SetStateFunction, GetStateFunction } from '@/types/store'
import { MessageService } from './messageService'
import { PeerService } from './peerService'

export class GroupChatService {
  private keepAliveInterval: number | null = null

  constructor(
    private set: SetStateFunction<ChatState>,
    private get: GetStateFunction<ChatState>,
    private chatEvents: EventEmitter,
    private peerService: PeerService,
    private messageService: MessageService
  ) { }

  // 创建群聊
  createGroupChat() {
    const { peer, userName } = this.get()
    if (!peer || !userName) return

    // 使用与PeerJS ID相同的格式，确保一致性
    // 注意：这里不再使用nanoid，而是直接使用peer.id作为roomId
    // 这样可以确保ID格式一致，避免连接问题
    const groupId = peer.id
    console.log(`创建群聊，使用当前PeerJS ID作为roomId: ${groupId}`)

    // 获取连接信息
    const connectionInfo = this.peerService.getConnectionInfo()
    const isLocalNetwork = connectionInfo.isLocalNetwork
    const localIpAddress = connectionInfo.localIpAddress

    // 创建一个新的群聊
    const groupChat: GroupChat = {
      id: peer.id, // 保持id为peer.id，用于标识聊天
      name: `${userName}的群聊`,
      isGroup: true,
      users: [{ id: peer.id, name: userName }],
      connections: [],
      messages: [],
      roomId: groupId, // 使用peer.id作为roomId
      isHost: true,
      shareLink: `${window.location.origin}${window.location.pathname}?roomId=${groupId}`,
      // 添加局域网相关信息
      isLocalNetwork: isLocalNetwork,
      localIpAddress: localIpAddress || undefined
    }

    // 添加系统消息
    const systemMessage = this.messageService.addSystemMessage(`群聊已创建，分享链接邀请好友加入吧！\n群聊ID: ${groupId}\n\n请确保在群聊保持活跃状态，否则连接可能会过期。`)

    if (groupChat.messages) {
      groupChat.messages.push(systemMessage)
    }

    // 更新聊天列表和当前聊天
    const { chats } = this.get()
    this.set({
      chats: [groupChat, ...chats],
      currentChat: groupChat,
      messages: groupChat.messages || []
    })

    // 发送创建群聊事件
    this.chatEvents.emit('groupCreated', { isLocalNetwork, groupId })

    // 添加保持连接活跃的定时器
    this.setupKeepAliveTimer()
  }

  // 设置保持连接活跃的定时器
  private setupKeepAliveTimer() {
    // 每60秒发送一次心跳，防止PeerJS连接过期
    const keepAliveInterval = setInterval(() => {
      const { peer, currentChat } = this.get()
      if (!peer || !currentChat || !currentChat.isGroup) {
        clearInterval(keepAliveInterval)
        return
      }

      // 如果是群主，向所有连接发送心跳
      if (currentChat.isGroup && (currentChat as GroupChat).isHost) {
        const { connections } = this.get()
        if (Object.keys(connections).length > 0) {
          console.log(`发送心跳到 ${Object.keys(connections).length} 个连接`)
          Object.values(connections).forEach((conn: any) => {
            try {
              conn.send({
                type: 'KEEP_ALIVE',
                data: { timestamp: new Date().toISOString() }
              })
            } catch (err) {
              console.error('发送心跳失败:', err)
            }
          })
        }
      }
    }, 60000) // 每分钟一次

      // 保存定时器ID，以便在离开群聊时清除
    this.keepAliveInterval = keepAliveInterval
  }

  // 加入群聊
  async joinGroupChat(roomId: string) {
    const { peer, userName, chats, isPeerInitialized } = this.get()

    // 如果PeerJS未初始化，保存roomId并等待初始化完成
    if (!isPeerInitialized) {
      console.log('PeerJS未初始化，保存roomId并等待初始化完成:', roomId)
      this.set({ pendingRoomId: roomId })
      return
    }

    if (!peer || !userName) {
      console.error('无法加入群聊：PeerJS未初始化或用户名未设置')
      this.chatEvents.emit('error', '请先设置用户名')
      return
    }

    this.set({ isConnecting: true })
    console.log(`准备加入群聊，当前PeerJS ID: ${peer.id}, 目标群聊ID: ${roomId}`)

    try {
      // 使用工具函数清理 roomId
      const cleanedRoomId = cleanRoomId(roomId)
      console.log(`清理后的群聊ID: ${cleanedRoomId}`)

      // 检查是否已经加入了该群聊
      const existingChat = chats.find((chat: Chat) =>
        chat.isGroup && (chat as GroupChat).roomId === cleanedRoomId
      )

      if (existingChat) {
        console.log('已经加入过该群聊，直接切换')
        this.set({ currentChat: existingChat, isConnecting: false })
        // 发送事件通知已切换到现有群聊
        this.chatEvents.emit('joinedGroup', existingChat)
        return
      }

      // 获取连接信息
      const connectionInfo = this.peerService.getConnectionInfo()
      const isLocalNetwork = connectionInfo.isLocalNetwork

      console.log(`尝试连接到房主: ${cleanedRoomId}`)

      // 检查目标ID是否有效
      if (!cleanedRoomId || cleanedRoomId.length < 5) {
        throw new Error('无效的群聊ID')
      }

      // 连接到房主，添加更多连接选项
      const conn = peer.connect(cleanedRoomId, {
        reliable: true,
        serialization: 'json',
        metadata: {
          isLocalNetwork,
          localIpAddress: connectionInfo.localIpAddress || undefined,
          userName: userName,
          peerId: peer.id,
          timestamp: new Date().toISOString() // 添加时间戳
        }
      })

      if (!conn) {
        throw new Error('无法创建连接')
      }

      // 添加调试信息
      console.log(`创建连接对象:`, conn)

      // 设置连接超时，增加到30秒
      const connectionTimeout = setTimeout(() => {
        console.log('连接超时，尝试重新连接...')
        // 尝试重新连接一次
        this.retryConnection(cleanedRoomId, userName)
      }, 30000)

      // 添加错误处理
      conn.on('error', (err: any) => {
        clearTimeout(connectionTimeout)
        console.error('连接错误:', err)

        // 检查错误类型
        if (err.type === 'peer-unavailable') {
          this.messageService.addSystemMessage(`无法连接到群聊 ${cleanedRoomId}，该群聊可能已不存在或暂时不可用。`)
          this.chatEvents.emit('error', '无法连接到群聊，该群聊可能已不存在')
        } else {
          this.messageService.addSystemMessage(`连接错误: ${err.message || '未知错误'}`)
          this.chatEvents.emit('error', `连接错误: ${err.message || '未知错误'}`)
        }

        this.set({ isConnecting: false })
      })

      conn.on('open', () => {
        clearTimeout(connectionTimeout)
        console.log('已连接到房主，连接已打开')

        // 创建新的群聊对象
        const newGroupChat: GroupChat = {
          id: cleanedRoomId,
          name: `群聊 ${cleanedRoomId.substring(0, 6)}`,
          isGroup: true,
          users: [
            { id: peer.id, name: userName },
            { id: cleanedRoomId, name: '等待房主信息...' }
          ],
          connections: [conn],
          messages: [],
          roomId: cleanedRoomId,
          isHost: false,
          shareLink: `${window.location.origin}${window.location.pathname}?roomId=${cleanedRoomId}`,
          isLocalNetwork: isLocalNetwork,
          localIpAddress: connectionInfo.localIpAddress || undefined
        }

        console.log('创建新的群聊对象:', newGroupChat)

        // 更新聊天列表和当前聊天
        const { chats } = this.get()
        const existingChatIndex = chats.findIndex((c: Chat) => c.id === cleanedRoomId)

        if (existingChatIndex >= 0) {
          // 如果存在，替换它
          const newChats = [...chats]
          newChats[existingChatIndex] = newGroupChat
          this.set({ chats: newChats, currentChat: newGroupChat })
        } else {
          // 否则添加新的
          this.set({ chats: [newGroupChat, ...chats], currentChat: newGroupChat })
        }

        console.log('向房主发送自己的信息')
        // 向房主发送自己的信息，包含网络环境信息
        conn.send({
          type: 'NEW_USER',
          data: {
            id: peer.id,
            name: userName,
            isLocalNetwork: isLocalNetwork,
            localIpAddress: connectionInfo.localIpAddress || undefined
          }
        })

        // 发送加入消息
        this.chatEvents.emit('joinedGroup', newGroupChat)
        this.set({ isConnecting: false })

        // 添加系统消息
        this.messageService.addSystemMessage('您已加入群聊')

        // 设置连接数据处理
        conn.on('data', (data: any) => {
          console.log('收到房主数据:', data)
          this.peerService.handleReceivedData(data, cleanedRoomId)
        })

        // 设置保持连接活跃的定时器
        this.setupKeepAliveTimer()
      })

    } catch (error: any) {
      console.error('加入群聊错误:', error)
      this.chatEvents.emit('error', `加入群聊失败: ${error.message || '未知错误'}`)
      this.set({ isConnecting: false })
    }
  }

  // 离开当前聊天
  leaveCurrentChat() {
    const { currentChat, userId, peer } = this.get()
    if (!currentChat || !currentChat.isGroup || !peer) return

    // 获取所有连接
    const { connections } = this.get()

    // 通知其他用户
    Object.values(connections).forEach((conn: any) => {
      try {
        conn.send({
          type: 'USER_LEFT',
          data: {
            id: userId
          }
        })
        // 关闭连接
        conn.close()
      } catch (err) {
        console.error('通知用户离开失败:', err)
      }
    })

    // 清除保持活跃的定时器
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }

    // 断开所有连接
    try {
      peer.destroy()
    } catch (err) {
      console.error('销毁Peer对象失败:', err)
    }

    // 从聊天列表中移除
    this.set((state: any) => ({
      chats: state.chats.filter((chat: Chat) => chat.id !== currentChat.id),
      currentChat: null,
      messages: [],
      peer: null,
      connections: {}
    }))

    // 发送离开事件
    this.chatEvents.emit('leftGroup')

    // 重新初始化 PeerJS
    const { userName } = this.get()
    if (userName) {
      setTimeout(() => {
        this.get().setUserName(userName)
      }, 1000)
    }
  }

  // 切换网络模式
  toggleNetworkMode() {
    const connectionInfo = this.peerService.getConnectionInfo()
    const currentMode = connectionInfo.isLocalNetwork

    // 重新初始化PeerJS，使用不同的网络模式
    const { userName } = this.get()
    if (userName) {
      // 先销毁当前连接
      const { peer } = this.get()
      if (peer) {
        peer.destroy()
      }

      // 设置新的网络模式
      this.set({
        isLocalNetwork: !currentMode,
        peer: null,
        isPeerInitialized: false
      })

      // 重新初始化
      setTimeout(() => {
        this.get().setUserName(userName)
      }, 500)

      // 发送网络模式变更事件
      this.chatEvents.emit('networkModeChanged', { isLocalNetwork: !currentMode })

      return !currentMode
    }

    return currentMode
  }

  // 重试连接方法
  private retryConnection(roomId: string, userName: string, retryCount: number = 0) {
    if (retryCount >= 2) {
      // 最多重试2次
      this.chatEvents.emit('error', '连接失败，请检查群聊ID是否正确或网络环境')
      this.set({ isConnecting: false })
      return
    }

    console.log(`尝试第${retryCount + 1}次重新连接到: ${roomId}`)

    const { peer } = this.get()
    if (!peer) {
      this.chatEvents.emit('error', 'PeerJS未初始化')
      this.set({ isConnecting: false })
      return
    }

    // 获取连接信息
    const connectionInfo = this.peerService.getConnectionInfo()

    // 使用不同的连接选项尝试重新连接
    const conn = peer.connect(roomId, {
      reliable: true,
      serialization: 'json',
      metadata: {
        userName: userName,
        retryAttempt: retryCount + 1
      }
    })

    if (!conn) {
      this.chatEvents.emit('error', '无法创建连接')
      this.set({ isConnecting: false })
      return
    }

    // 设置更短的超时时间用于重试
    const connectionTimeout = setTimeout(() => {
      conn.close()
      // 递归调用自身进行下一次重试
      this.retryConnection(roomId, userName, retryCount + 1)
    }, 15000)

    conn.on('open', () => {
      clearTimeout(connectionTimeout)
      console.log(`重试成功，已连接到房主: ${roomId}`)

      // 创建新的群聊对象并处理连接
      this.handleSuccessfulConnection(conn, roomId, userName, connectionInfo.isLocalNetwork)
    })

    conn.on('error', (err: any) => {
      clearTimeout(connectionTimeout)
      console.error(`重试连接错误(${retryCount + 1}/3):`, err)

      // 如果是最后一次重试，显示错误
      if (retryCount >= 1) {
        let errorMessage = '连接失败'
        if (err.type && err.type.toString() === 'peer-unavailable') {
          errorMessage = `无法连接到指定的群聊，可能群聊已不存在或暂时不可用`
        } else {
          errorMessage = `连接错误: ${err.message || '无法连接到群聊'}`
        }
        this.chatEvents.emit('error', errorMessage)
        this.set({ isConnecting: false })
      } else {
        // 否则继续重试
        setTimeout(() => {
          this.retryConnection(roomId, userName, retryCount + 1)
        }, 2000)
      }
    })
  }

  // 处理成功连接
  private handleSuccessfulConnection(conn: any, roomId: string, userName: string, isLocalNetwork: boolean) {
    const connectionInfo = this.peerService.getConnectionInfo()
    const { peer } = this.get()

    if (!peer) {
      console.error('Peer 不存在，无法处理连接')
      return
    }

    // 创建新的群聊对象
    const newGroupChat: GroupChat = {
      id: roomId,
      name: `群聊 ${roomId.substring(0, 6)}`,
      isGroup: true,
      users: [
        { id: peer.id, name: userName },
        { id: roomId, name: '等待房主信息...' }
      ],
      connections: [conn],
      messages: [],
      roomId: roomId,
      isHost: false,
      shareLink: `${window.location.origin}${window.location.pathname}?roomId=${roomId}`,
      isLocalNetwork: isLocalNetwork,
      localIpAddress: connectionInfo.localIpAddress || undefined
    }

    console.log('创建新的群聊对象:', newGroupChat)

    // 更新聊天列表和当前聊天
    const { chats } = this.get()
    const existingChatIndex = chats.findIndex((c: Chat) => c.id === roomId)

    if (existingChatIndex >= 0) {
      // 如果存在，替换它
      const newChats = [...chats]
      newChats[existingChatIndex] = newGroupChat
      this.set({ chats: newChats, currentChat: newGroupChat })
    } else {
      // 否则添加新的
      this.set({ chats: [newGroupChat, ...chats], currentChat: newGroupChat })
    }

    console.log('向房主发送自己的信息')
    // 向房主发送自己的信息，包含网络环境信息
    conn.send({
      type: 'NEW_USER',
      data: {
        id: peer.id,
        name: userName,
        isLocalNetwork: isLocalNetwork,
        localIpAddress: connectionInfo.localIpAddress || undefined
      }
    })

    // 发送加入消息
    this.chatEvents.emit('joinedGroup', newGroupChat)
    this.set({ isConnecting: false })

    // 添加系统消息
    this.messageService.addSystemMessage('您已加入群聊')

    // 设置连接数据处理
    conn.on('data', (data: any) => {
      console.log('收到房主数据:', data)
      this.peerService.handleReceivedData(data, roomId)
    })

    conn.on('close', () => {
      console.log('与房主的连接已关闭')
      this.messageService.addSystemMessage('与群聊的连接已断开')
      this.chatEvents.emit('connectionClosed')
    })
  }
} 