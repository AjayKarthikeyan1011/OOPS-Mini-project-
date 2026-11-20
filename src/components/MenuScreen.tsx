import { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { FoodItem } from '../models/FoodItem';
import { Order } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { EmptyOrderError } from '../models/Errors';
import { Logger } from '../services/Logger';

interface MenuScreenProps {
  restaurant: Restaurant;
  order: Order;
  cartVersion: number;
  logger: Logger;
  onCartMutated: () => void;
  onProceedToCheckout: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export function MenuScreen({
  restaurant,
  order,
  logger,
  onCartMutated,
  onProceedToCheckout,
  onShowToast,
}: MenuScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const menuItems = restaurant.getMenu();

  const categories = ['All', ...Array.from(new Set(menuItems.map((item) => item.getCategory())))];
  const filteredMenu =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.getCategory() === selectedCategory);

  const summaryMap = order.getItemSummaryMap();
  const cartEntries = Array.from(summaryMap.values());
  const totalCount = order.getItems().length;

  const handleAddItem = (food: FoodItem) => {
    order.addItem(food);
    onCartMutated();
    onShowToast('success', 'Added to Cart', `${food.getName()} (Rs. ${food.getPrice().toFixed(2)}) added.`);
  };

  const handleRemoveOne = (food: FoodItem) => {
    order.removeItem(food.getFoodId());
    onCartMutated();
  };

  const handleRemoveAll = (food: FoodItem) => {
    order.removeAllOfItem(food.getFoodId());
    onCartMutated();
    onShowToast('info', 'Removed Item', `Removed ${food.getName()} from your order.`);
  };

  // OOP CONCEPT: Exception handling — Throws EmptyOrderError if user tries to checkout an empty cart
  const handleCheckoutClick = () => {
    try {
      if (order.getItems().length === 0 || order.getTotal() <= 0) {
        throw new EmptyOrderError('Your cart is empty. Please add at least one food item before checkout.');
      }
      onProceedToCheckout();
    } catch (error) {
      if (error instanceof EmptyOrderError) {
        logger.warning(error.message);
        onShowToast('error', error.name, error.message);
      }
    } finally {
      // Completed checkout gate validation
    }
  };

  return (
    <div className="space-y-8">
      {/* Restaurant Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Step 2 of 6 · Restaurant Menu
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {restaurant.getRestaurantName()}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{restaurant.displayDetails()}</p>
        </div>

        {/* Category Filter Segmented Controls */}
        <div
          role="tablist"
          aria-label="Filter menu by category"
          className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Menu Grid (left) + Live Cart (right) */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Menu Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
          {filteredMenu.map((food) => {
            const existingEntry = summaryMap.get(food.getFoodId());
            const qtyInCart = existingEntry ? existingEntry.quantity : 0;

            return (
              <article
                key={food.getFoodId()}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 via-amber-50/60 to-red-50">
                    <span className="text-6xl select-none" role="img" aria-label={food.getName()}>
                      {food.getEmoji()}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {food.getCategory()} <span aria-hidden="true">·</span> Item #{food.getFoodId()}
                    </span>
                    {qtyInCart > 0 && (
                      <span className="font-semibold text-orange-600 tabular-nums">
                        {qtyInCart} in cart
                      </span>
                    )}
                  </div>

                  <h2 className="mt-1.5 text-lg font-bold text-slate-900">{food.getName()}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {food.getDescription()}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                    Rs. {food.getPrice().toFixed(2)}
                  </span>

                  {qtyInCart === 0 ? (
                    <button
                      type="button"
                      onClick={() => handleAddItem(food)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-orange-600 whitespace-nowrap shrink-0"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Add</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveOne(food)}
                        aria-label={`Remove one ${food.getName()}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-bold text-slate-900 font-mono tabular-nums">
                        {qtyInCart}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddItem(food)}
                        aria-label={`Add one more ${food.getName()}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white transition-colors hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Live Cart Sidebar */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-orange-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
            </div>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {totalCount} {totalCount === 1 ? 'item' : 'items'} · Order #{order.getOrderId()}
            </span>
          </div>

          {cartEntries.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-slate-600">Your cart is currently empty.</p>
              <p className="mt-1 text-xs text-slate-400">
                Select items from the menu to add them to your Order.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cartEntries.map(({ food, quantity }) => (
                <li key={food.getFoodId()} className="flex items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{food.getEmoji()}</span>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {food.getName()}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                      Rs. {food.getPrice().toFixed(2)} × {quantity} = Rs.{' '}
                      {(food.getPrice() * quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveOne(food)}
                      aria-label={`Decrease ${food.getName()}`}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem(food)}
                      aria-label={`Increase ${food.getName()}`}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAll(food)}
                      aria-label={`Remove ${food.getName()}`}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-mono font-medium text-emerald-700">Free</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Total Amount</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                Rs. {order.getTotal().toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckoutClick}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-orange-700 hover:to-red-700 focus-visible:outline-2 focus-visible:outline-orange-600 whitespace-nowrap"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
