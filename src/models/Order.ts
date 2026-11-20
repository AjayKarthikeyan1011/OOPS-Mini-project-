import { Customer } from './Customer';
import { FoodItem } from './FoodItem';
import { EmptyOrderError, InvalidPaymentError } from './Errors';
import { PaymentMethod } from '../payment/PaymentMethod';
import { EventManager } from '../events/EventManager';
import { Logger } from '../services/Logger';

export interface CartEntry {
  food: FoodItem;
  quantity: number;
}

// OOP CONCEPT: Encapsulation & Polymorphism — Order manages private items/total and holds a PaymentMethod interface reference
export class Order {
  private orderId: number;
  private customer: Customer;

  // OOP CONCEPT: Collections (List/Array) — Stores all ordered FoodItem instances
  private items: FoodItem[] = [];

  // Encapsulation: total is strictly derived from addItem/removeItem (no setTotal setter)
  private total: number = 0;

  // OOP CONCEPT: Polymorphism — Reference typed as PaymentMethod interface
  private payment: PaymentMethod | null = null;
  private status: string = 'Pending';
  private placedAt: string;

  private eventManager: EventManager;
  private logger: Logger;

  constructor(
    orderId: number,
    customer: Customer,
    eventManager: EventManager,
    logger: Logger
  ) {
    this.orderId = orderId;
    this.customer = customer;
    this.eventManager = eventManager;
    this.logger = logger;
    this.placedAt = new Date().toLocaleString();
  }

  public addItem(food: FoodItem): void {
    this.items.push(food);
    this.total += food.getPrice();
    this.logger.info(`${food.getName()} added to Order #${this.orderId}.`);
  }

  public removeItem(foodId: number): boolean {
    const index = this.items.findIndex((item) => item.getFoodId() === foodId);
    if (index === -1) {
      return false;
    }
    const [removed] = this.items.splice(index, 1);
    this.total = Math.max(0, this.total - removed.getPrice());
    this.logger.info(`${removed.getName()} removed from Order #${this.orderId}.`);
    return true;
  }

  public removeAllOfItem(foodId: number): void {
    const remaining: FoodItem[] = [];
    let removedCount = 0;
    let removedName = '';

    for (const item of this.items) {
      if (item.getFoodId() === foodId) {
        removedCount++;
        removedName = item.getName();
        this.total = Math.max(0, this.total - item.getPrice());
      } else {
        remaining.push(item);
      }
    }

    if (removedCount > 0) {
      this.items = remaining;
      this.logger.info(`Removed all ${removedCount}x ${removedName} from Order #${this.orderId}.`);
    }
  }

  public getOrderId(): number {
    return this.orderId;
  }

  public getCustomer(): Customer {
    return this.customer;
  }

  public getCustomerName(): string {
    return this.customer.getName();
  }

  public getItems(): FoodItem[] {
    return [...this.items];
  }

  // OOP CONCEPT: Collections (Map) — Groups ordered items into a Map<foodId, CartEntry>
  public getItemSummaryMap(): Map<number, CartEntry> {
    const summaryMap = new Map<number, CartEntry>();
    for (const item of this.items) {
      const existing = summaryMap.get(item.getFoodId());
      if (existing) {
        existing.quantity += 1;
      } else {
        summaryMap.set(item.getFoodId(), { food: item, quantity: 1 });
      }
    }
    return summaryMap;
  }

  public getTotal(): number {
    return this.total;
  }

  public setPayment(payment: PaymentMethod): void {
    this.payment = payment;
  }

  public getPayment(): PaymentMethod | null {
    return this.payment;
  }

  public getPaymentName(): string {
    return this.payment ? this.payment.getMethodName() : 'Unpaid';
  }

  public getStatus(): string {
    return this.status;
  }

  public setStatus(status: string): void {
    this.status = status;
  }

  public getPlacedAt(): string {
    return this.placedAt;
  }

  public displayOrder(): string {
    const lines = [
      `Order ID: ${this.orderId}`,
      `Customer: ${this.customer.getName()}`,
      ...this.items.map((food) => `${food.getName()} - Rs. ${food.getPrice().toFixed(2)}`),
      `Total Amount: Rs. ${this.total.toFixed(2)}`,
    ];
    return lines.join('\n');
  }

  // OOP CONCEPT: Exception handling & Polymorphism — Validates state and invokes PaymentMethod.processPayment()
  public confirmOrder(): string {
    if (this.items.length === 0) {
      throw new EmptyOrderError('Cannot place an empty order. Add at least one item from the menu.');
    }
    if (this.payment === null) {
      throw new InvalidPaymentError('Payment method not selected. Choose Online Payment or Cash on Delivery.');
    }

    // Polymorphic dispatch: invokes OnlinePayment or CashPayment at runtime
    const paymentResult = this.payment.processPayment();

    this.status = 'Order Placed';
    this.placedAt = new Date().toLocaleString();
    this.logger.info(`Order #${this.orderId} placed successfully (${paymentResult}).`);
    this.eventManager.notifyListeners(this.orderId, 'Order Placed');

    return paymentResult;
  }

  /**
   * Reconstructs a confirmed Order instance from persisted Firestore data while keeping total encapsulated.
   */
  public static rehydrate(params: {
    orderId: number;
    customer: Customer;
    items: FoodItem[];
    payment: PaymentMethod;
    status: string;
    placedAt: string;
    eventManager: EventManager;
    logger: Logger;
  }): Order {
    const order = new Order(params.orderId, params.customer, params.eventManager, params.logger);
    for (const item of params.items) {
      order.items.push(item);
      order.total += item.getPrice();
    }
    order.payment = params.payment;
    order.status = params.status;
    order.placedAt = params.placedAt;
    return order;
  }
}
