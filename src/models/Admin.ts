import { User } from './User';

// OOP CONCEPT: Inheritance — Admin extends User and inherits base properties and getters
export class Admin extends User {
  constructor(id: number, name: string, address: string) {
    super(id, name, address);
  }

  // OOP CONCEPT: Polymorphism — Overrides User.displayDetails() for administrator representation
  public override displayDetails(): string {
    return `Administrator: ${this.getName()} (Admin ID: ${this.getUserId()}) · Office: ${this.getAddress()}`;
  }

  public manageSystem(): string {
    return `Admin ${this.getName()} is actively managing order records and system logs.`;
  }
}
