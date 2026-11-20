import { OrderEventListener } from './OrderEventListener';

export interface NotificationMessage {
  id: string;
  orderId: number;
  status: string;
  timestamp: string;
  message: string;
}

// OOP CONCEPT: Event handling & Interface — CustomerNotification implements OrderEventListener and pushes alerts to UI
export class CustomerNotification implements OrderEventListener {
  private notifications: NotificationMessage[] = [];
  private onNotifyCallback?: (messages: NotificationMessage[]) => void;

  constructor(onNotifyCallback?: (messages: NotificationMessage[]) => void) {
    this.onNotifyCallback = onNotifyCallback;
  }

  public setOnNotifyCallback(callback: (messages: NotificationMessage[]) => void): void {
    this.onNotifyCallback = callback;
  }

  public onOrderStatusChanged(orderId: number, status: string): void {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const entry: NotificationMessage = {
      id: `${orderId}-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId,
      status,
      timestamp,
      message: `Order #${orderId} status updated to "${status}".`,
    };

    this.notifications = [entry, ...this.notifications];

    if (this.onNotifyCallback) {
      this.onNotifyCallback([...this.notifications]);
    }
  }

  public getNotifications(): NotificationMessage[] {
    return [...this.notifications];
  }

  public clearNotifications(): void {
    this.notifications = [];
    if (this.onNotifyCallback) {
      this.onNotifyCallback([]);
    }
  }
}
