import { User } from './User';

// OOP CONCEPT: Inheritance — Customer extends User and inherits userId, name, address, and getters
export class Customer extends User {
  constructor(id: number, name: string, address: string) {
    super(id, name, address);
  }

  // OOP CONCEPT: Polymorphism — Overrides User.displayDetails() with customer-specific formatting
  public override displayDetails(): string {
    return `Customer: ${this.getName()} (ID: ${this.getUserId()}) · Delivery Address: ${this.getAddress()}`;
  }
}
