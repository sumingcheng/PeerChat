import { GroupChat } from '@/types/chat';

export class BaseEventEmitter<
  TEventMap extends { [key: string]: unknown } = { [key: string]: unknown }
> {
  private events: Map<string, Set<Function>> = new Map();

  on<K extends keyof TEventMap>(event: K, callback: (data: TEventMap[K]) => void): this {
    const key = event as string;
    if (!this.events.has(key)) {
      this.events.set(key, new Set());
    }
    this.events.get(key)!.add(callback);
    return this;
  }

  off<K extends keyof TEventMap>(event: K, callback: (data: TEventMap[K]) => void): this {
    const callbacks = this.events.get(event as string);
    if (callbacks) {
      callbacks.delete(callback);
    }
    return this;
  }

  emit<K extends keyof TEventMap>(
    event: K,
    ...args: TEventMap[K] extends void ? [] : [TEventMap[K]]
  ): this {
    const callbacks = this.events.get(event as string);
    if (callbacks) {
      callbacks.forEach((callback) => callback(args[0]));
    }
    return this;
  }

  removeAllListeners(event?: keyof TEventMap): this {
    if (event) {
      this.events.delete(event as string);
    } else {
      this.events.clear();
    }
    return this;
  }

  listenerCount(event: keyof TEventMap): number {
    return this.events.get(event as string)?.size ?? 0;
  }
}

export type ChatEventMap = {
  error: string;
  groupCreated: { isLocalNetwork?: boolean; groupId: string };
  joinedGroup: GroupChat;
  leftGroup: void;
  connecting: string;
  peerInitialized: { id: string; isLocalNetwork?: boolean };
  networkModeChanged: { isLocalNetwork: boolean };
  linkCopied: void;
  [key: string]: unknown;
};

export class EventEmitter extends BaseEventEmitter<ChatEventMap> {}
