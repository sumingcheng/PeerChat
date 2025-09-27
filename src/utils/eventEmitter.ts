// 创建一个简单的事件发射器类，替代Node.js的EventEmitter
export class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }

  off(event: string, callback: Function) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
    return this;
  }

  emit(event: string, data?: any) {
    if (!this.events[event]) return this;
    this.events[event].forEach((callback) => {
      callback(data);
    });
    return this;
  }
}
