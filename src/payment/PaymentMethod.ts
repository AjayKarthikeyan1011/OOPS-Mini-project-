// OOP CONCEPT: Interface — Defines the contract that all concrete payment strategies must implement
export interface PaymentMethod {
  processPayment(): string;
  getMethodName(): string;
  getAmount(): number;
}
