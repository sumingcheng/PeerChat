import { BaseEventEmitter } from '@/utils/eventEmitter';
import { DataConnection } from 'peerjs';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error'
}

export interface ConnectionInfo {
  id: string;
  connection: DataConnection;
  state: ConnectionState;
  createdAt: number;
  lastActivity: number;
  retryCount: number;
  metadata?: unknown;
}

export interface ConnectionEventMap {
  'connection:added': { peerId: string; connectionInfo: ConnectionInfo };
  'connection:opened': { peerId: string };
  'connection:data': { peerId: string; data: unknown };
  'connection:closed': { peerId: string };
  'connection:error': { peerId: string; error: Error };
  'connection:state_changed': { peerId: string; state: ConnectionState };
  'connection:removed': { peerId: string };
}

export class ConnectionManager extends BaseEventEmitter<ConnectionEventMap> {
  private connections = new Map<string, ConnectionInfo>();

  // 获取所有连接
  getAllConnections(): Map<string, ConnectionInfo> {
    return new Map(this.connections);
  }

  // 获取特定连接
  getConnection(peerId: string): ConnectionInfo | undefined {
    return this.connections.get(peerId);
  }

  // 获取连接状态
  getConnectionState(peerId: string): ConnectionState {
    const conn = this.connections.get(peerId);
    return conn?.state || ConnectionState.DISCONNECTED;
  }

  // 注册新连接
  addConnection(peerId: string, connection: DataConnection, metadata?: any): void {
    const connectionInfo: ConnectionInfo = {
      id: peerId,
      connection,
      state: ConnectionState.CONNECTING,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      retryCount: 0,
      metadata
    };

    this.connections.set(peerId, connectionInfo);
    this.setupConnectionListeners(connectionInfo);

    this.emit('connection:added', { peerId, connectionInfo });
  }

  // 设置连接监听器
  private setupConnectionListeners(connInfo: ConnectionInfo): void {
    const { id: peerId, connection } = connInfo;

    connection.on('open', () => {
      this.updateConnectionState(peerId, ConnectionState.CONNECTED);
      this.emit('connection:opened', { peerId });
    });

    connection.on('data', (data) => {
      this.updateLastActivity(peerId);
      this.emit('connection:data', { peerId, data });
    });

    connection.on('close', () => {
      this.updateConnectionState(peerId, ConnectionState.DISCONNECTED);
      this.emit('connection:closed', { peerId });
    });

    connection.on('error', (error) => {
      this.updateConnectionState(peerId, ConnectionState.ERROR);
      this.emit('connection:error', { peerId, error });
    });
  }

  // 更新连接状态
  private updateConnectionState(peerId: string, state: ConnectionState): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.state = state;
      this.emit('connection:state_changed', { peerId, state });
    }
  }

  // 更新最后活动时间
  private updateLastActivity(peerId: string): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.lastActivity = Date.now();
    }
  }

  // 发送数据到指定连接
  sendData(peerId: string, data: any): boolean {
    const conn = this.connections.get(peerId);
    if (!conn || conn.state !== ConnectionState.CONNECTED) {
      return false;
    }

    try {
      conn.connection.send(data);
      this.updateLastActivity(peerId);
      return true;
    } catch (error) {
      console.error(`Failed to send data to ${peerId}:`, error);
      this.updateConnectionState(peerId, ConnectionState.ERROR);
      return false;
    }
  }

  // 广播数据到所有连接
  broadcast(data: any, excludePeerIds?: string[]): number {
    let sentCount = 0;
    const exclude = new Set(excludePeerIds || []);

    for (const [peerId, conn] of this.connections) {
      if (exclude.has(peerId) || conn.state !== ConnectionState.CONNECTED) {
        continue;
      }

      if (this.sendData(peerId, data)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  // 关闭特定连接
  closeConnection(peerId: string): void {
    const conn = this.connections.get(peerId);
    if (!conn) return;

    this.updateConnectionState(peerId, ConnectionState.DISCONNECTING);

    try {
      conn.connection.close();
    } catch (error) {
      console.error(`Error closing connection to ${peerId}:`, error);
    }

    this.connections.delete(peerId);
    this.emit('connection:removed', { peerId });
  }

  // 关闭所有连接
  closeAllConnections(): void {
    const peerIds = Array.from(this.connections.keys());
    for (const peerId of peerIds) {
      this.closeConnection(peerId);
    }
  }

  // 清理不活跃的连接
  cleanupInactiveConnections(timeoutMs: number = 300000): number {
    // 5分钟
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [peerId, conn] of this.connections) {
      if (now - conn.lastActivity > timeoutMs) {
        toRemove.push(peerId);
      }
    }

    for (const peerId of toRemove) {
      console.log(`Cleaning up inactive connection: ${peerId}`);
      this.closeConnection(peerId);
    }

    return toRemove.length;
  }

  // 获取连接统计
  getStats() {
    const stats = {
      total: this.connections.size,
      connected: 0,
      connecting: 0,
      disconnected: 0,
      error: 0
    };

    for (const conn of this.connections.values()) {
      switch (conn.state) {
        case ConnectionState.CONNECTED:
          stats.connected++;
          break;
        case ConnectionState.CONNECTING:
          stats.connecting++;
          break;
        case ConnectionState.DISCONNECTED:
          stats.disconnected++;
          break;
        case ConnectionState.ERROR:
          stats.error++;
          break;
      }
    }

    return stats;
  }

  destroy(): void {
    this.closeAllConnections();
    this.removeAllListeners();
  }
}
