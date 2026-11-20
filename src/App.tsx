import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Menu as MenuIcon, ShoppingBag, X } from 'lucide-react';
import { Admin } from './models/Admin';
import { Customer } from './models/Customer';
import { Order } from './models/Order';
import { Restaurant } from './models/Restaurant';
import { Review } from './models/Review';
import { InvalidInputError } from './models/Errors';
import { EventManager } from './events/EventManager';
import { CustomerNotification, NotificationMessage } from './events/CustomerNotification';
import { Delivery } from './services/Delivery';
import { LogRecord, Logger } from './services/Logger';
import { auth } from './firebase/firebase';
import { FirestoreRepository } from './services/FirestoreRepository';
import { ToastBanner, ToastItem } from './components/ToastBanner';
import { LoginScreen } from './components/LoginScreen';
import { MenuScreen } from './components/MenuScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { TrackingScreen } from './components/TrackingScreen';
import { ReceiptScreen } from './components/ReceiptScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { AdminScreen } from './components/AdminScreen';

type ScreenId =
  | 'login'
  | 'menu'
  | 'checkout'
  | 'tracking'
  | 'receipt'
  | 'review'
  | 'admin';

const ORDER_STEPS: { id: ScreenId; label: string; step: number }[] = [
  { id: 'login', label: 'Login', step: 1 },
  { id: 'menu', label: 'Menu', step: 2 },
  { id: 'checkout', label: 'Checkout', step: 3 },
  { id: 'tracking', label: 'Tracking', step: 4 },
  { id: 'receipt', label: 'Receipt', step: 5 },
  { id: 'review', label: 'Review', step: 6 },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [highlightLoginPrompt, setHighlightLoginPrompt] = useState(false);

  // Firebase Auth state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);
  const activeOrderDocIdRef = useRef<string | null>(null);

  // Core OOP singletons initialized once
  const loggerRef = useRef<Logger | null>(null);
  if (!loggerRef.current) {
    loggerRef.current = new Logger();
  }
  const logger = loggerRef.current;

  const eventManagerRef = useRef<EventManager | null>(null);
  const notificationListenerRef = useRef<CustomerNotification | null>(null);
  if (!eventManagerRef.current) {
    eventManagerRef.current = new EventManager();
    notificationListenerRef.current = new CustomerNotification();
    eventManagerRef.current.addListener(notificationListenerRef.current);
  }
  const eventManager = eventManagerRef.current;
  const notificationListener = notificationListenerRef.current!;

  const restaurantRef = useRef<Restaurant>(
    new Restaurant(101, 'Restaurant Owner', 'Madurai', 'Food Paradise')
  );
  const adminRef = useRef<Admin>(new Admin(999, 'System Admin', 'Main Office, Madurai'));

  // Reactive UI state synchronized from OOP classes & Firestore
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [nextOrderId, setNextOrderId] = useState<number>(1001);
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [cartVersion, setCartVersion] = useState<number>(0);

  const [notifications, setNotifications] = useState<NotificationMessage[]>(() =>
    notificationListener.getNotifications()
  );
  const [logs, setLogs] = useState<LogRecord[]>(() => logger.getLogs());
  const [reviews, setReviews] = useState<Review[]>([]);

  // Delivery thread simulation state
  const activeDeliveryRef = useRef<Delivery | null>(null);
  const [deliveryStageIndex, setDeliveryStageIndex] = useState<number>(-1);
  const [isDelivering, setIsDelivering] = useState<boolean>(false);
  const [deliveryPersonName, setDeliveryPersonName] = useState<string>('');

  // Friendly toast stack
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  // Wire Logger & CustomerNotification callbacks
  useEffect(() => {
    logger.setOnLogsChanged((updatedLogs) => {
      if (!firebaseUserRef.current) {
        setLogs(updatedLogs);
      }
    });

    logger.setOnRecordCreated((record) => {
      const currentUser = firebaseUserRef.current;
      if (currentUser && currentUser.emailVerified) {
        void FirestoreRepository.saveLogRecord(
          currentUser,
          record.level,
          record.message,
          record.timestamp
        ).catch((err) => {
          console.error('Failed to persist log to Firestore:', err);
        });
      }
    });

    notificationListener.setOnNotifyCallback((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return () => {
      if (activeDeliveryRef.current) {
        activeDeliveryRef.current.cancel();
      }
    };
  }, [logger, notificationListener]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      firebaseUserRef.current = user;
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setLogs(logger.getLogs());
      }
    });
    return () => unsubscribe();
  }, [logger]);

  // Attach Firestore real-time listeners only when auth is ready and user is authenticated
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      return;
    }

    let cancelled = false;

    void FirestoreRepository.loadCustomerProfile(firebaseUser)
      .then((savedCustomer) => {
        if (!cancelled && savedCustomer) {
          setCustomer((prev) => prev ?? savedCustomer);
          setDraftOrder((prev) => prev ?? new Order(nextOrderId, savedCustomer, eventManager, logger));
        }
      })
      .catch((err) => {
        console.error('Customer profile load error:', err);
      });

    const unsubOrders = FirestoreRepository.subscribeOrders(
      firebaseUser,
      eventManager,
      logger,
      (records) => {
        const orders = records.map((r) => r.order);
        setOrderHistory(orders);

        if (orders.length > 0) {
          const maxId = orders.reduce((max, o) => Math.max(max, o.getOrderId()), 1000);
          setNextOrderId((prev) => Math.max(prev, maxId + 1));
          setConfirmedOrder((prev) => prev ?? orders[0]);
        }
      },
      (err) => {
        showToast('error', 'Database Sync Error', err.message);
      }
    );

    const unsubReviews = FirestoreRepository.subscribeReviews(
      (fetchedReviews) => {
        setReviews(fetchedReviews);
      },
      (err) => {
        showToast('error', 'Reviews Sync Error', err.message);
      }
    );

    const unsubLogs = FirestoreRepository.subscribeLogs(
      firebaseUser,
      (fetchedLogs) => {
        setLogs(fetchedLogs);
      },
      (err) => {
        showToast('error', 'Logs Sync Error', err.message);
      }
    );

    return () => {
      cancelled = true;
      unsubOrders();
      unsubReviews();
      unsubLogs();
    };
  }, [authReady, firebaseUser, eventManager, logger]);

  const handleLoginSuccess = (loggedInCustomer: Customer) => {
    setCustomer(loggedInCustomer);

    const freshOrder = new Order(nextOrderId, loggedInCustomer, eventManager, logger);
    setDraftOrder(freshOrder);
    setCartVersion((v) => v + 1);
    setActiveScreen('menu');

    if (firebaseUser && firebaseUser.emailVerified) {
      void FirestoreRepository.saveCustomerProfile(firebaseUser, loggedInCustomer).catch((err) => {
        showToast('error', 'Profile Save Error', err instanceof Error ? err.message : String(err));
      });
    }
  };

  const handleOrderConfirmed = (completedOrder: Order) => {
    setConfirmedOrder(completedOrder);
    if (!firebaseUser) {
      setOrderHistory((prev) => [completedOrder, ...prev]);
    }

    if (activeDeliveryRef.current) {
      activeDeliveryRef.current.cancel();
    }
    setDeliveryStageIndex(-1);
    setIsDelivering(false);
    setDeliveryPersonName('');
    activeOrderDocIdRef.current = null;

    if (firebaseUser && firebaseUser.emailVerified) {
      void FirestoreRepository.saveConfirmedOrder(firebaseUser, completedOrder)
        .then((docId) => {
          activeOrderDocIdRef.current = docId;
        })
        .catch((err) => {
          showToast('error', 'Order Save Error', err instanceof Error ? err.message : String(err));
        });
    }

    const upcomingId = nextOrderId + 1;
    setNextOrderId(upcomingId);
    if (customer) {
      setDraftOrder(new Order(upcomingId, customer, eventManager, logger));
    }

    setActiveScreen('tracking');
  };

  // OOP CONCEPT: Threading (async simulation) & Exception handling — Runs Delivery.start() in try/catch/finally
  const handleStartDelivery = async (personName: string) => {
    if (!confirmedOrder) return;

    try {
      const delivery = new Delivery(
        500 + confirmedOrder.getOrderId(),
        confirmedOrder.getOrderId(),
        personName,
        eventManager,
        logger
      );

      activeDeliveryRef.current = delivery;
      setDeliveryPersonName(delivery.getDeliveryPerson());
      setIsDelivering(true);
      setDeliveryStageIndex(-1);

      showToast(
        'info',
        'Delivery Dispatched',
        `${delivery.getDeliveryPerson()} started delivery for Order #${confirmedOrder.getOrderId()}.`
      );

      await delivery.start((stage, idx) => {
        confirmedOrder.setStatus(stage);
        setDeliveryStageIndex(idx);
        setOrderHistory((prev) => [...prev]);

        if (firebaseUser && firebaseUser.emailVerified && activeOrderDocIdRef.current) {
          void FirestoreRepository.updateOrderDeliveryStatus(
            activeOrderDocIdRef.current,
            stage,
            delivery.getDeliveryPerson()
          ).catch((err) => {
            console.error('Delivery status sync failed:', err);
          });
        }
      }, 3000);

      showToast(
        'success',
        'Order Delivered',
        `Order #${confirmedOrder.getOrderId()} has been delivered.`
      );
    } catch (error) {
      if (error instanceof InvalidInputError) {
        logger.warning(`Delivery start failed: ${error.message}`);
        showToast('error', error.name, error.message);
      } else if (error instanceof Error) {
        logger.warning(`Delivery error: ${error.message}`);
        showToast('error', 'Delivery Error', error.message);
      }
    } finally {
      setIsDelivering(false);
    }
  };

  const handleAddReview = (rev: Review) => {
    if (firebaseUser && firebaseUser.emailVerified) {
      void FirestoreRepository.saveReview(firebaseUser, rev).catch((err) => {
        showToast('error', 'Review Save Error', err instanceof Error ? err.message : String(err));
      });
    } else {
      setReviews((prev) => [rev, ...prev]);
    }
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    if (firebaseUser && firebaseUser.emailVerified && logs.length > 0) {
      const ids = logs.map((entry) => entry.id);
      void FirestoreRepository.clearUserLogs(ids).catch((err) => {
        showToast('error', 'Log Clear Error', err instanceof Error ? err.message : String(err));
      });
    }
  };

  const handleNavigate = (screen: ScreenId) => {
    setMobileMenuOpen(false);
    if ((screen === 'menu' || screen === 'checkout') && !customer) {
      showToast('info', 'Customer Login Required', 'Please fill in your customer details first.');
      setActiveScreen('login');
      setHighlightLoginPrompt(true);
      setTimeout(() => setHighlightLoginPrompt(false), 1200);
      return;
    }
    setActiveScreen(screen);
  };

  const handleInspectOrderReceipt = (orderToInspect: Order) => {
    setConfirmedOrder(orderToInspect);
    setActiveScreen('receipt');
  };

  const cartItemCount = draftOrder ? draftOrder.getItems().length : 0;
  const isOrderFlowScreen = activeScreen !== 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate(customer ? 'menu' : 'login')}
            className="text-left text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-orange-600 whitespace-nowrap shrink-0 font-display"
          >
            Food Paradise
          </button>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => handleNavigate(customer ? 'menu' : 'login')}
              className={`rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isOrderFlowScreen
                  ? 'bg-orange-50 text-orange-700 font-semibold hover:bg-orange-100'
                  : 'hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              Order Flow
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('tracking')}
              className={`rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeScreen === 'tracking'
                  ? 'bg-orange-50 text-orange-700 font-semibold hover:bg-orange-100'
                  : 'hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              Live Tracking
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className={`rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeScreen === 'admin'
                  ? 'bg-orange-50 text-orange-700 font-semibold hover:bg-orange-100'
                  : 'hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              Admin
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate(customer ? 'menu' : 'login')}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-orange-600 whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span className="tabular-nums">Cart ({cartItemCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"
          >
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleNavigate(customer ? 'menu' : 'login')}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Order Flow
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('tracking')}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Live Tracking
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('admin')}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Admin Console
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Customer Ordering Workflow Stepper */}
        {isOrderFlowScreen && (
          <nav
            aria-label="Ordering steps"
            className="mb-8 flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2"
          >
            {ORDER_STEPS.map((s) => {
              const isActive = activeScreen === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleNavigate(s.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-orange-600 ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm hover:bg-orange-700'
                      : 'text-slate-700 hover:bg-orange-50 hover:text-orange-700 active:bg-orange-100'
                  }`}
                >
                  <span className="font-mono tabular-nums opacity-80">{s.step}.</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Active Screen */}
        {activeScreen === 'login' && (
          <LoginScreen
            currentCustomer={customer}
            firebaseUser={firebaseUser}
            authReady={authReady}
            highlightPrompt={highlightLoginPrompt}
            logger={logger}
            onLoginSuccess={handleLoginSuccess}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'menu' && draftOrder && (
          <MenuScreen
            restaurant={restaurantRef.current}
            order={draftOrder}
            cartVersion={cartVersion}
            logger={logger}
            onCartMutated={() => setCartVersion((v) => v + 1)}
            onProceedToCheckout={() => setActiveScreen('checkout')}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'checkout' && draftOrder && (
          <CheckoutScreen
            order={draftOrder}
            logger={logger}
            onBackToMenu={() => setActiveScreen('menu')}
            onOrderConfirmed={handleOrderConfirmed}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'tracking' && (
          <TrackingScreen
            order={confirmedOrder}
            deliveryStageIndex={deliveryStageIndex}
            isDelivering={isDelivering}
            deliveryPersonName={deliveryPersonName}
            notifications={notifications}
            onStartDelivery={handleStartDelivery}
            onGoToReceipt={() => setActiveScreen('receipt')}
            onGoToReview={() => setActiveScreen('review')}
            onGoToMenu={() => handleNavigate('menu')}
          />
        )}

        {activeScreen === 'receipt' && (
          <ReceiptScreen
            order={confirmedOrder}
            logger={logger}
            onShowToast={showToast}
            onGoToReview={() => setActiveScreen('review')}
            onGoToMenu={() => handleNavigate('menu')}
          />
        )}

        {activeScreen === 'review' && (
          <ReviewScreen
            customerName={customer ? customer.getName() : firebaseUser?.displayName || ''}
            reviews={reviews}
            logger={logger}
            onAddReview={handleAddReview}
            onShowToast={showToast}
          />
        )}

        {activeScreen === 'admin' && (
          <AdminScreen
            admin={adminRef.current}
            orderHistory={orderHistory}
            logs={logs}
            logger={logger}
            onInspectOrderReceipt={handleInspectOrderReceipt}
            onClearLogs={handleClearLogs}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>Online Food Ordering and Delivery System · Object-Oriented Programming Project</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className="transition-colors hover:text-orange-700"
            >
              Admin Console
            </button>
          </div>
        </div>
      </footer>

      {/* Friendly Try/Catch/Finally Error & Success Toast Stack */}
      <ToastBanner toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
