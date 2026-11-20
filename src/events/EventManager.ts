import { OrderEventListener } from './OrderEventListener';

// OOP CONCEPT: Event handling & Collections — EventManager maintains a list of listeners and broadcasts events
export class EventManager {
  private listeners: OrderEventListener[] = [];

  public addListener(listener: OrderEventListener): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  public removeListener(listener: OrderEventListener): void {
    this.listeners = this.listeners.filter((existing) => existing !== listener);
  }

  public notifyListeners(orderId: number, status: string): void {
    for (const listener of this.listeners) {
      listener.onOrderStatusChanged(orderId, status);
    }
  }
}
