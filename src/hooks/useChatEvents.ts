import { chatEvents } from '@/store/useChatStore';
import { ChatEventMap } from '@/utils/eventEmitter';
import { useEffect, useRef } from 'react';

type EventHandler<K extends keyof ChatEventMap> = (data: ChatEventMap[K]) => void;

export function useChatEvent<K extends keyof ChatEventMap>(
  event: K,
  handler: EventHandler<K>,
  deps: React.DependencyList = []
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    const stableHandler = ((data: ChatEventMap[K]) => {
      handlerRef.current(data);
    }) as EventHandler<K>;

    chatEvents.on(event, stableHandler);

    return () => {
      chatEvents.off(event, stableHandler);
    };
  }, [event]);
}

export function useChatEvents(
  handlers: Partial<{ [K in keyof ChatEventMap]: EventHandler<K> }>,
  deps: React.DependencyList = []
): void {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers, ...deps]);

  useEffect(() => {
    const stableHandlers = new Map<string, (data: unknown) => void>();

    (Object.keys(handlers) as Array<keyof ChatEventMap>).forEach((event) => {
      const stableHandler = (data: unknown) => {
        const handler = handlersRef.current[event];
        if (handler) {
          (handler as (data: unknown) => void)(data);
        }
      };
      stableHandlers.set(event, stableHandler);
      chatEvents.on(event, stableHandler as (data: ChatEventMap[typeof event]) => void);
    });

    return () => {
      stableHandlers.forEach((handler, event) => {
        chatEvents.off(
          event as keyof ChatEventMap & string,
          handler as (data: ChatEventMap[keyof ChatEventMap]) => void
        );
      });
    };
  }, []);
}
