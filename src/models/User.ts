import { InvalidInputError } from './Errors';

// OOP CONCEPT: Encapsulation — Private fields are protected and accessed only through public getters
export class User {
  private userId: number;
  private name: string;
  private address: string;

  constructor(userId: number, name: string, address: string) {
    // OOP CONCEPT: Exception handling — Validate invariants inside constructor
    if (!Number.isFinite(userId) || userId <= 0 || !Number.isInteger(userId)) {
      throw new InvalidInputError('User ID must be a valid positive number.');
    }
    if (!name || name.trim().length === 0) {
      throw new InvalidInputError('Name cannot be empty.');
    }
    if (!address || address.trim().length === 0) {
      throw new InvalidInputError('Address cannot be empty.');
    }

    this.userId = userId;
    this.name = name.trim();
    this.address = address.trim();
  }

  // OOP CONCEPT: Encapsulation — Read-only public getters
  public getUserId(): number {
    return this.userId;
  }

  public getName(): string {
    return this.name;
  }

  public getAddress(): string {
    return this.address;
  }

  // OOP CONCEPT: Polymorphism — Base method intended to be overridden by subclasses
  public displayDetails(): string {
    return `User ID: ${this.userId} | Name: ${this.name} | Address: ${this.address}`;
  }
}
