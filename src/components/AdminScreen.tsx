import { useState } from 'react';
import { Download, Eye, ShieldCheck, Trash2 } from 'lucide-react';
import { Admin } from '../models/Admin';
import { Order } from '../models/Order';
import { LogRecord, Logger } from '../services/Logger';

interface AdminScreenProps {
  admin: Admin;
  orderHistory: Order[];
  logs: LogRecord[];
  logger: Logger;
  onInspectOrderReceipt: (order: Order) => void;
  onClearLogs: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export function AdminScreen({
  admin,
  orderHistory,
  logs,
  logger,
  onInspectOrderReceipt,
  onClearLogs,
  onShowToast,
}: AdminScreenProps) {
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARNING'>('ALL');

  const filteredLogs =
    logFilter === 'ALL' ? logs : logs.filter((entry) => entry.level === logFilter);

  const totalRevenue = orderHistory.reduce((acc, ord) => acc + ord.getTotal(), 0);

  const handleDownloadLogs = () => {
    logger.downloadLogFile('food_order.log');
    onShowToast('success', 'Log File Downloaded', 'Saved system logs as food_order.log.');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Admin Header */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-600">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>System Administration</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Admin Console</h1>
          <p className="mt-1 text-sm text-slate-600">
            {admin.displayDetails()} <span aria-hidden="true">·</span> {admin.manageSystem()}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0">
          <div>
            <p className="text-xs text-slate-500">Total Orders</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 font-mono tabular-nums">
              {orderHistory.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Revenue</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 font-mono tabular-nums">
              Rs. {totalRevenue.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Log Records</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 font-mono tabular-nums">
              {logs.length}
            </p>
          </div>
        </div>
      </section>

      {/* Order History Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Order History</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              In-memory <code className="font-mono">Order[]</code> collection maintained across the
              session.
            </p>
          </div>
        </div>

        {orderHistory.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No confirmed orders yet. Place an order from the Menu and Checkout screens.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 pr-4">Order ID</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Items</th>
                  <th className="py-3 pr-4 text-right">Total</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderHistory.map((ord) => {
                  const itemLabels = Array.from(ord.getItemSummaryMap().values())
                    .map(({ food, quantity }) => `${food.getName()} ×${quantity}`)
                    .join(', ');

                  return (
                    <tr key={ord.getOrderId()} className="hover:bg-slate-50/70">
                      <td className="py-3.5 pr-4 font-mono tabular-nums font-semibold text-slate-900">
                        #{ord.getOrderId()}
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-slate-900">{ord.getCustomerName()}</p>
                        <p className="text-xs text-slate-500">
                          ID {ord.getCustomer().getUserId()}
                        </p>
                      </td>
                      <td className="max-w-xs py-3.5 pr-4 text-xs text-slate-700">{itemLabels}</td>
                      <td className="py-3.5 pr-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        Rs. {ord.getTotal().toFixed(2)}
                      </td>
                      <td className="py-3.5 pr-4 text-xs font-medium text-slate-700">
                        {ord.getPaymentName()}
                      </td>
                      <td className="py-3.5 pr-4 text-xs font-semibold text-slate-800">
                        {ord.getStatus()}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onInspectOrderReceipt(ord)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Log Viewer */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">System Log Viewer</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Timestamped <code className="font-mono">INFO</code> and{' '}
              <code className="font-mono">WARNING</code> records persisted to{' '}
              <code className="font-mono">localStorage</code> via <code className="font-mono">Logger</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['ALL', 'INFO', 'WARNING'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLogFilter(level)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                    logFilter === level
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDownloadLogs}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download food_order.log</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClearLogs();
                onShowToast('info', 'Logs Cleared', 'Cleared stored logs from localStorage.');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No log records matching filter.
          </div>
        ) : (
          <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs">
            <ul className="space-y-1.5">
              {filteredLogs.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline gap-2 leading-relaxed">
                  <span className="text-slate-400 tabular-nums">[{entry.timestamp}]</span>
                  <span
                    className={`font-semibold ${
                      entry.level === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {entry.level}
                  </span>
                  <span className="text-slate-100">{entry.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
