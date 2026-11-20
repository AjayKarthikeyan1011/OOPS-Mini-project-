// OOP CONCEPT: Interface & Event handling — Listener contract for order status updates
export interface OrderEventListener {
  onOrderStatusChanged(orderId: number, status: string): void;
}
