// OOP CONCEPT: Exception handling & Inheritance — Custom error classes extending built-in Error

/**
 * Thrown when user-supplied input fails validation (e.g. non-numeric ID or empty fields).
 */
export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when attempting to confirm or checkout an order that has no food items.
 */
export class EmptyOrderError extends Error {
  constructor(message: string = 'Cannot place an empty order. Please add at least one food item.') {
    super(message);
    this.name = 'EmptyOrderError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when confirming an order without a selected payment method or invalid payment state.
 */
export class InvalidPaymentError extends Error {
  constructor(message: string = 'Please select a valid payment method before confirming.') {
    super(message);
    this.name = 'InvalidPaymentError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when a review rating is outside the valid range of 1 to 5.
 */
export class InvalidRatingError extends Error {
  constructor(message: string = 'Rating must be a whole number between 1 and 5.') {
    super(message);
    this.name = 'InvalidRatingError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
