import { PaymentMethod } from './PaymentMethod';

// OOP CONCEPT: Interface & Polymorphism — OnlinePayment implements PaymentMethod with digital transaction behavior
export class OnlinePayment implements PaymentMethod {
  private amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }

  public getAmount(): number {
    return this.amount;
  }

  public getMethodName(): string {
    return 'Online Payment';
  }

  // OOP CONCEPT: Polymorphism — Concrete implementation of PaymentMethod.processPayment()
  public processPayment(): string {
    return `Online Payment Successful: Rs. ${this.amount.toFixed(2)}`;
  }
}
