import { useState } from 'react';
import { ArrowLeft, Banknote, CheckCircle2, CreditCard } from 'lucide-react';
import { Order } from '../models/Order';
import { OnlinePayment } from '../payment/OnlinePayment';
import { CashPayment } from '../payment/CashPayment';
import { PaymentMethod } from '../payment/PaymentMethod';
import { EmptyOrderError, InvalidPaymentError } from '../models/Errors';
import { Logger } from '../services/Logger';

interface CheckoutScreenProps {
  order: Order;
  logger: Logger;
  onBackToMenu: () => void;
  onOrderConfirmed: (confirmedOrder: Order, paymentMessage: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export function CheckoutScreen({
  order,
  logger,
  onBackToMenu,
  onOrderConfirmed,
  onShowToast,
}: CheckoutScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'cash' | null>(null);

  const summaryEntries = Array.from(order.getItemSummaryMap().values());

  // OOP CONCEPT: Polymorphism & Exception handling — Instantiates PaymentMethod and invokes order.confirmOrder()
  const handleConfirmOrder = () => {
    try {
      let payment: PaymentMethod | null = null;

      if (selectedMethod === 'online') {
        payment = new OnlinePayment(order.getTotal());
      } else if (selectedMethod === 'cash') {
        payment = new CashPayment(order.getTotal());
      }

      if (payment) {
        order.setPayment(payment);
      }

      // confirmOrder() throws EmptyOrderError or InvalidPaymentError if invalid
      const paymentResult = order.confirmOrder();

      onShowToast('success', 'Order Confirmed', paymentResult);
      onOrderConfirmed(order, paymentResult);
    } catch (error) {
      if (error instanceof EmptyOrderError || error instanceof InvalidPaymentError) {
        logger.warning(`Checkout error: ${error.message}`);
        onShowToast('error', error.name, error.message);
      } else if (error instanceof Error) {
        logger.warning(`Unexpected checkout error: ${error.message}`);
        onShowToast('error', 'Checkout Failed', error.message);
      }
    } finally {
      // Try/catch/finally execution completed
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Step 3 of 6 · Order Summary & Payment
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Checkout</h1>
        </div>
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Menu</span>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Order Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
            <span className="text-xs font-medium text-slate-500 font-mono tabular-nums">
              Order #{order.getOrderId()}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Delivering To</p>
            <p className="mt-1">{order.getCustomer().displayDetails()}</p>
          </div>

          {summaryEntries.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No items in this order. Return to the menu to add items, or click Confirm Order to
              test <code className="font-mono text-red-600">EmptyOrderError</code>.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="pb-3">Item</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Unit Price</th>
                    <th className="pb-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryEntries.map(({ food, quantity }) => (
                    <tr key={food.getFoodId()}>
                      <td className="py-3 font-medium text-slate-900">
                        <span className="mr-2" aria-hidden="true">
                          {food.getEmoji()}
                        </span>
                        {food.getName()}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-slate-600">
                        {quantity}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums text-slate-600">
                        Rs. {food.getPrice().toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        Rs. {(food.getPrice() * quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-base font-bold text-slate-900">Total Payable</span>
            <span className="text-2xl font-bold text-orange-600 font-mono tabular-nums">
              Rs. {order.getTotal().toFixed(2)}
            </span>
          </div>
        </section>

        {/* Payment Selection */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h2 className="text-lg font-bold text-slate-900">Payment Method</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Select a concrete <code className="font-mono">PaymentMethod</code> implementation.
            Confirming without a choice throws <code className="font-mono">InvalidPaymentError</code>.
          </p>

          <div className="mt-5 space-y-3" role="radiogroup" aria-label="Payment method">
            <button
              type="button"
              role="radio"
              aria-checked={selectedMethod === 'online'}
              onClick={() => setSelectedMethod('online')}
              className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors ${
                selectedMethod === 'online'
                  ? 'border-orange-600 bg-orange-50/70'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <CreditCard
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  selectedMethod === 'online' ? 'text-orange-600' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Online Payment</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Instant UPI, card, or net banking via <code className="font-mono">OnlinePayment</code>.
                </p>
              </div>
              {selectedMethod === 'online' && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedMethod === 'cash'}
              onClick={() => setSelectedMethod('cash')}
              className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors ${
                selectedMethod === 'cash'
                  ? 'border-orange-600 bg-orange-50/70'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <Banknote
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  selectedMethod === 'cash' ? 'text-orange-600' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Cash on Delivery</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Pay cash when your rider arrives via <code className="font-mono">CashPayment</code>.
                </p>
              </div>
              {selectedMethod === 'cash' && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-600" aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirmOrder}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-orange-700 hover:to-red-700 focus-visible:outline-2 focus-visible:outline-orange-600 whitespace-nowrap"
          >
            <span>Confirm Order</span>
          </button>
        </section>
      </div>
    </div>
  );
}
