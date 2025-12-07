import { GroupChat } from '@/types/chat';

export class BaseEventEmitter<TEventMap> {
  private events: Map<string, Set<Function>> = new Map();

  on<K extends keyof TEventMap & string>(event: K, callback: (data: TEventMap[K]) => void): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
    return this;
  }

  off<K extends keyof TEventMap & string>(event: K, callback: (data: TEventMap[K]) => void): this {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
    return this;
  }

  emit<K extends keyof TEventMap & string>(
    event: K,
    ...args: TEventMap[K] extends void ? [] : [TEventMap[K]]
  ): this {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(args[0]));
    }
    return this;
  }

  removeAllListeners<K extends keyof TEventMap & string>(event?: K): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  listenerCount<K extends keyof TEventMap & string>(event: K): number {
    return this.events.get(event)?.size ?? 0;
  }
}

export interface ChatEventMap {
  error: string;
  groupCreated: { isLocalNetwork?: boolean; groupId: string };
  joinedGroup: GroupChat;
  leftGroup: void;
  connecting: string;
  peerInitialized: { id: string; isLocalNetwork?: boolean };
  networkModeChanged: { isLocalNetwork: boolean };
  linkCopied: void;
}

export class EventEmitter extends BaseEventEmitter<ChatEventMap> {}
