import { PaymentMethod } from './PaymentMethod';

// OOP CONCEPT: Interface & Polymorphism — CashPayment implements PaymentMethod with cash-on-delivery behavior
export class CashPayment implements PaymentMethod {
  private amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }

  public getAmount(): number {
    return this.amount;
  }

  public getMethodName(): string {
    return 'Cash on Delivery';
  }

  // OOP CONCEPT: Polymorphism — Concrete implementation of PaymentMethod.processPayment()
  public processPayment(): string {
    return `Cash on Delivery Confirmed: Rs. ${this.amount.toFixed(2)}`;
  }
}
