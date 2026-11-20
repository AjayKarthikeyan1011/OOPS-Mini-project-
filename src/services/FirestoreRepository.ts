import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { ADMIN_EMAIL, db, handleFirestoreError, OperationType } from '../firebase/firebase';
import { Customer } from '../models/Customer';
import { FoodItem } from '../models/FoodItem';
import { Order } from '../models/Order';
import { Review } from '../models/Review';
import { CashPayment } from '../payment/CashPayment';
import { OnlinePayment } from '../payment/OnlinePayment';
import { EventManager } from '../events/EventManager';
import { LogLevel, LogRecord, Logger } from './Logger';

interface FirestoreOrderItem {
  foodId: number;
  name: string;
  price: number;
  emoji: string;
  category: string;
  description: string;
  quantity: number;
}

export interface PersistedOrderRecord {
  docId: string;
  order: Order;
  deliveryPerson?: string;
}

// OOP CONCEPT: Persistence Repository — Bridges OOP domain classes with Cloud Firestore
export class FirestoreRepository {
  public static isAdminUser(firebaseUser: FirebaseUser | null): boolean {
    return Boolean(
      firebaseUser &&
        firebaseUser.emailVerified &&
        firebaseUser.email?.toLowerCase() === ADMIN_EMAIL
    );
  }

  public static async saveCustomerProfile(
    firebaseUser: FirebaseUser,
    customer: Customer
  ): Promise<void> {
    const path = `customers/${firebaseUser.uid}`;
    const docRef = doc(db, 'customers', firebaseUser.uid);

    try {
      const existingSnap = await getDoc(docRef);
      const basePayload = {
        ownerUid: firebaseUser.uid,
        customerId: Math.max(1, Math.trunc(customer.getUserId())),
        name: customer.getName().trim().slice(0, 100),
        address: customer.getAddress().trim().slice(0, 300),
        email: (firebaseUser.email ?? '').slice(0, 160),
        updatedAt: serverTimestamp(),
      };

      if (existingSnap.exists()) {
        await updateDoc(docRef, basePayload);
      } else {
        await setDoc(docRef, {
          ...basePayload,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async loadCustomerProfile(firebaseUser: FirebaseUser): Promise<Customer | null> {
    const path = `customers/${firebaseUser.uid}`;
    try {
      const snap = await getDoc(doc(db, 'customers', firebaseUser.uid));
      if (!snap.exists()) {
        return null;
      }
      const data = snap.data();
      if (
        typeof data.customerId === 'number' &&
        typeof data.name === 'string' &&
        typeof data.address === 'string'
      ) {
        return new Customer(data.customerId, data.name, data.address);
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  public static async saveConfirmedOrder(
    firebaseUser: FirebaseUser,
    order: Order
  ): Promise<string> {
    const docId = `order_${order.getOrderId()}_${firebaseUser.uid.slice(0, 8)}`;
    const path = `orders/${docId}`;

    const summaryEntries = Array.from(order.getItemSummaryMap().values()).slice(0, 20);
    const itemsPayload: FirestoreOrderItem[] = summaryEntries.map(({ food, quantity }) => ({
      foodId: food.getFoodId(),
      name: food.getName().slice(0, 60),
      price: food.getPrice(),
      emoji: food.getEmoji().slice(0, 12),
      category: food.getCategory().slice(0, 40),
      description: food.getDescription().slice(0, 140),
      quantity,
    }));

    const payload = {
      orderId: Math.max(1, Math.trunc(order.getOrderId())),
      ownerUid: firebaseUser.uid,
      customerId: Math.max(1, Math.trunc(order.getCustomer().getUserId())),
      customerName: order.getCustomerName().trim().slice(0, 100),
      customerAddress: order.getCustomer().getAddress().trim().slice(0, 300),
      items: itemsPayload,
      total: Number(order.getTotal().toFixed(2)),
      paymentMethod: order.getPaymentName(),
      status: 'Order Placed',
      placedAt: order.getPlacedAt().slice(0, 60),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'orders', docId), payload);
      return docId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public static async updateOrderDeliveryStatus(
    docId: string,
    status: string,
    deliveryPerson: string
  ): Promise<void> {
    const path = `orders/${docId}`;
    try {
      await updateDoc(doc(db, 'orders', docId), {
        status: status.slice(0, 40),
        deliveryPerson: deliveryPerson.trim().slice(0, 100),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public static subscribeOrders(
    firebaseUser: FirebaseUser,
    eventManager: EventManager,
    logger: Logger,
    onData: (records: PersistedOrderRecord[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const path = 'orders';
    const isAdmin = FirestoreRepository.isAdminUser(firebaseUser);
    const ordersQuery = isAdmin
      ? query(collection(db, path))
      : query(collection(db, path), where('ownerUid', '==', firebaseUser.uid));

    return onSnapshot(
      ordersQuery,
      (snapshot) => {
        const parsed: { sortKey: number; record: PersistedOrderRecord }[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          try {
            const cust = new Customer(
              Number(data.customerId) || 1,
              String(data.customerName || 'Customer'),
              String(data.customerAddress || 'Address')
            );

            const rawItems: FirestoreOrderItem[] = Array.isArray(data.items) ? data.items : [];
            const expandedItems: FoodItem[] = [];
            for (const entry of rawItems) {
              const qty = Math.max(1, Number(entry.quantity) || 1);
              for (let i = 0; i < qty; i++) {
                expandedItems.push(
                  new FoodItem(
                    Number(entry.foodId) || 1,
                    String(entry.name || 'Item'),
                    Number(entry.price) || 0,
                    String(entry.emoji || '🍽️'),
                    String(entry.category || 'Menu'),
                    String(entry.description || '')
                  )
                );
              }
            }

            const totalAmount = Number(data.total) || 0;
            const payment =
              data.paymentMethod === 'Online Payment'
                ? new OnlinePayment(totalAmount)
                : new CashPayment(totalAmount);

            const rehydrated = Order.rehydrate({
              orderId: Number(data.orderId) || 1001,
              customer: cust,
              items: expandedItems,
              payment,
              status: String(data.status || 'Order Placed'),
              placedAt: String(data.placedAt || ''),
              eventManager,
              logger,
            });

            parsed.push({
              sortKey: Number(data.orderId) || 0,
              record: {
                docId: docSnap.id,
                order: rehydrated,
                deliveryPerson:
                  typeof data.deliveryPerson === 'string' ? data.deliveryPerson : undefined,
              },
            });
          } catch {
            // Skip malformed legacy document gracefully
          }
        });

        parsed.sort((a, b) => b.sortKey - a.sortKey);
        onData(parsed.map((item) => item.record));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );
  }

  public static async saveReview(firebaseUser: FirebaseUser, review: Review): Promise<void> {
    const docId = `rev_${Date.now()}_${firebaseUser.uid.slice(0, 6)}`;
    const path = `reviews/${docId}`;

    const payload = {
      ownerUid: firebaseUser.uid,
      customerName: review.getCustomerName().trim().slice(0, 100),
      rating: Math.min(5, Math.max(1, Math.trunc(review.getRating()))),
      comment: review.getComment().trim().slice(0, 500),
      createdAtDisplay: review.getCreatedAt().slice(0, 40),
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'reviews', docId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public static subscribeReviews(
    onData: (reviews: Review[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const path = 'reviews';
    const reviewsQuery = query(
      collection(db, path),
      where('rating', '>=', 1),
      where('rating', '<=', 5)
    );

    return onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const list: { ts: number; review: Review }[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          try {
            const rev = new Review(
              String(data.customerName || 'Customer'),
              String(data.comment || ''),
              Number(data.rating) || 5
            );
            const millis =
              data.createdAt && typeof data.createdAt.toMillis === 'function'
                ? data.createdAt.toMillis()
                : 0;
            list.push({ ts: millis, review: rev });
          } catch {
            // Skip invalid document
          }
        });
        list.sort((a, b) => b.ts - a.ts);
        onData(list.map((entry) => entry.review));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );
  }

  public static async saveLogRecord(
    firebaseUser: FirebaseUser,
    level: LogLevel,
    message: string,
    clientTimestamp: string
  ): Promise<void> {
    const docId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const path = `logs/${docId}`;

    try {
      await setDoc(doc(db, 'logs', docId), {
        ownerUid: firebaseUser.uid,
        level,
        message: message.trim().slice(0, 500),
        clientTimestamp: clientTimestamp.slice(0, 40),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public static subscribeLogs(
    firebaseUser: FirebaseUser,
    onData: (logs: LogRecord[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const path = 'logs';
    const isAdmin = FirestoreRepository.isAdminUser(firebaseUser);
    const logsQuery = isAdmin
      ? query(collection(db, path))
      : query(collection(db, path), where('ownerUid', '==', firebaseUser.uid));

    return onSnapshot(
      logsQuery,
      (snapshot) => {
        const rows: LogRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          rows.push({
            id: docSnap.id,
            timestamp: String(data.clientTimestamp || ''),
            level: data.level === 'WARNING' ? 'WARNING' : 'INFO',
            message: String(data.message || ''),
          });
        });
        rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        onData(rows);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );
  }

  public static async clearUserLogs(logIds: string[]): Promise<void> {
    for (const id of logIds) {
      const path = `logs/${id}`;
      try {
        await deleteDoc(doc(db, 'logs', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  }
}
