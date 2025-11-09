import { EventEmitter } from "events";

class StatusBus {
  private ee = new EventEmitter();
  private last = new Map<string, any>();
  emit(orderId: string, payload: any) {
    this.last.set(orderId, payload);
    this.ee.emit(orderId, payload);
  }
  subscribe(orderId: string, cb: (p: any) => void) {
    const last = this.last.get(orderId);
    if (last) setTimeout(() => cb(last), 0);
    const handler = (p: any) => cb(p);
    this.ee.on(orderId, handler);
    return () => this.ee.off(orderId, handler);
  }
}
export const statusBus = new StatusBus();
