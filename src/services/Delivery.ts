import { EventManager } from '../events/EventManager';
import { Logger } from './Logger';
import { InvalidInputError } from '../models/Errors';

export const DELIVERY_STAGES = [
  'Order Received',
  'Food Preparing',
  'Out for Delivery',
  'Delivered',
] as const;

export type DeliveryStage = (typeof DELIVERY_STAGES)[number];

// OOP CONCEPT: Threading (async simulation) — Simulates Java's Delivery Thread using async/await and Promise timers
export class Delivery {
  private deliveryId: number;
  private orderId: number;
  private deliveryPerson: string;
  private eventManager: EventManager;
  private logger: Logger;
  private isCancelled: boolean = false;

  constructor(
    deliveryId: number,
    orderId: number,
    deliveryPerson: string,
    eventManager: EventManager,
    logger: Logger
  ) {
    if (!deliveryPerson || deliveryPerson.trim().length === 0) {
      throw new InvalidInputError('Delivery person name cannot be empty.');
    }
    this.deliveryId = deliveryId;
    this.orderId = orderId;
    this.deliveryPerson = deliveryPerson.trim();
    this.eventManager = eventManager;
    this.logger = logger;
  }

  public getDeliveryId(): number {
    return this.deliveryId;
  }

  public getOrderId(): number {
    return this.orderId;
  }

  public getDeliveryPerson(): string {
    return this.deliveryPerson;
  }

  public cancel(): void {
    this.isCancelled = true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // OOP CONCEPT: Threading (async simulation), Event handling & Logging
  public async start(
    onStageChange?: (stage: DeliveryStage, index: number) => void,
    intervalMs: number = 3000
  ): Promise<void> {
    this.logger.info(
      `Delivery #${this.deliveryId} started for Order #${this.orderId} by ${this.deliveryPerson}.`
    );

    for (let i = 0; i < DELIVERY_STAGES.length; i++) {
      if (this.isCancelled) {
        this.logger.warning(`Delivery #${this.deliveryId} was interrupted.`);
        return;
      }

      await this.sleep(intervalMs);

      if (this.isCancelled) {
        this.logger.warning(`Delivery #${this.deliveryId} was interrupted.`);
        return;
      }

      const status = DELIVERY_STAGES[i];

      // Notify UI progress callback if provided
      if (onStageChange) {
        onStageChange(status, i);
      }

      // Broadcast via EventManager to all OrderEventListeners
      this.eventManager.notifyListeners(this.orderId, status);

      // Record in Logger
      this.logger.info(`Order #${this.orderId}: ${status} (Rider: ${this.deliveryPerson})`);
    }
  }
}
