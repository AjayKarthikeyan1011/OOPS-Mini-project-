import React, { useState } from 'react';
import { Bell, Bike, CheckCircle2, ChefHat, FileText, PackageCheck, Play, Star, Truck } from 'lucide-react';
import { Order } from '../models/Order';
import { DELIVERY_STAGES } from '../services/Delivery';
import { NotificationMessage } from '../events/CustomerNotification';

interface TrackingScreenProps {
  order: Order | null;
  deliveryStageIndex: number;
  isDelivering: boolean;
  deliveryPersonName: string;
  notifications: NotificationMessage[];
  onStartDelivery: (deliveryPerson: string) => void;
  onGoToReceipt: () => void;
  onGoToReview: () => void;
  onGoToMenu: () => void;
}

const STAGE_ICONS = [PackageCheck, ChefHat, Truck, CheckCircle2];

export function TrackingScreen({
  order,
  deliveryStageIndex,
  isDelivering,
  deliveryPersonName,
  notifications,
  onStartDelivery,
  onGoToReceipt,
  onGoToReview,
  onGoToMenu,
}: TrackingScreenProps) {
  const [riderInput, setRiderInput] = useState<string>(deliveryPersonName || 'Karthik Raja');

  if (!order || order.getStatus() === 'Pending') {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Bike className="mx-auto h-10 w-10 text-orange-600" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">No Confirmed Order to Track</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add items from the menu and complete checkout first to launch the async delivery thread.
        </p>
        <button
          type="button"
          onClick={onGoToMenu}
          className="mt-6 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartDelivery(riderInput);
  };

  const progressPercent =
    deliveryStageIndex < 0
      ? 0
      : Math.round(((deliveryStageIndex + 1) / DELIVERY_STAGES.length) * 100);

  const isCompleted = deliveryStageIndex >= DELIVERY_STAGES.length - 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Step 4 of 6 · Async Delivery Thread & Event Notifications
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Live Order Tracking · #{order.getOrderId()}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGoToReceipt}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>View Receipt</span>
          </button>
          <button
            type="button"
            onClick={onGoToReview}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 whitespace-nowrap"
          >
            <Star className="h-4 w-4" aria-hidden="true" />
            <span>Leave Review</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Delivery Controls & 4-Stage Progress Bar */}
        <div className="space-y-6 lg:col-span-7">
          {/* Delivery Rider Form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-slate-900">Assign Delivery Rider</h2>
            <p className="mt-1 text-xs text-slate-500">
              Starts <code className="font-mono">Delivery.start()</code>, stepping through 4
              statuses every 3 seconds via <code className="font-mono">async/await</code>.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="delivery-person" className="sr-only">
                  Delivery Person Name
                </label>
                <input
                  id="delivery-person"
                  type="text"
                  disabled={isDelivering || isCompleted}
                  value={riderInput}
                  onChange={(e) => setRiderInput(e.target.value)}
                  placeholder="Enter delivery person's name"
                  className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={isDelivering || isCompleted}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-orange-700 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isCompleted
                    ? 'Delivery Completed'
                    : isDelivering
                      ? 'Delivery Running...'
                      : 'Start Delivery'}
                </span>
              </button>
            </form>
          </section>

          {/* 4-Stage Progress Bar */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Delivery Progress</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Current Status: <span className="font-semibold text-slate-900">{order.getStatus()}</span>
                  {deliveryPersonName && (
                    <>
                      {' '}
                      <span aria-hidden="true">·</span> Rider: {deliveryPersonName}
                    </>
                  )}
                </p>
              </div>
              <span className="text-sm font-bold text-orange-600 font-mono tabular-nums">
                {progressPercent}%
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 4 Stages */}
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {DELIVERY_STAGES.map((stage, idx) => {
                const Icon = STAGE_ICONS[idx];
                const isDone = idx <= deliveryStageIndex;
                const isCurrent = idx === deliveryStageIndex && isDelivering && !isCompleted;

                return (
                  <li
                    key={stage}
                    className={`flex items-center gap-3.5 rounded-xl border p-4 transition-colors ${
                      isDone
                        ? 'border-orange-200 bg-orange-50/60 text-slate-900'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isDone ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 font-mono tabular-nums">
                        Stage {idx + 1} of 4
                      </p>
                      <p className="truncate text-sm font-bold">
                        {stage}
                        {isCurrent ? ' (Active)' : isDone ? ' (Done)' : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        {/* Right: EventManager Notification Panel */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-900">Notification Panel</h2>
            </div>
            <span className="text-xs font-medium text-slate-500 font-mono tabular-nums">
              {notifications.length} events
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Populated by <code className="font-mono">CustomerNotification</code> implementing{' '}
            <code className="font-mono">OrderEventListener</code> via{' '}
            <code className="font-mono">EventManager.notifyListeners()</code>.
          </p>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No status events received yet.
            </div>
          ) : (
            <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
              {notifications.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-orange-700">
                      Order #{note.orderId} · {note.status}
                    </span>
                    <span className="font-mono tabular-nums">{note.timestamp}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800">{note.message}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
