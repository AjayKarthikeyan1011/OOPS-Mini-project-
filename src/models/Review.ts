import { InvalidInputError, InvalidRatingError } from './Errors';

// OOP CONCEPT: Encapsulation & Exception handling — Validates rating range (1 to 5) in constructor
export class Review {
  private customerName: string;
  private comment: string;
  private rating: number;
  private createdAt: string;

  constructor(customerName: string, comment: string, rating: number) {
    if (!customerName || customerName.trim().length === 0) {
      throw new InvalidInputError('Customer name is required to submit a review.');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new InvalidRatingError('Rating must be between 1 and 5.');
    }
    if (!comment || comment.trim().length === 0) {
      throw new InvalidInputError('Please enter a short review comment before submitting.');
    }

    this.customerName = customerName.trim();
    this.comment = comment.trim();
    this.rating = rating;
    this.createdAt = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  public getCustomerName(): string {
    return this.customerName;
  }

  public getComment(): string {
    return this.comment;
  }

  public getRating(): number {
    return this.rating;
  }

  public getCreatedAt(): string {
    return this.createdAt;
  }

  public displayReview(): string {
    return `Customer: ${this.customerName} | Rating: ${this.rating}/5 | Comment: ${this.comment}`;
  }
}
