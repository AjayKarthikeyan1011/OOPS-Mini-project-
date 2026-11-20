import { Download, FileText, Star } from 'lucide-react';
import { Order } from '../models/Order';
import { OrderFileManager } from '../services/OrderFileManager';
import { Logger } from '../services/Logger';

interface ReceiptScreenProps {
  order: Order | null;
  logger: Logger;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onGoToReview: () => void;
  onGoToMenu: () => void;
}

export function ReceiptScreen({
  order,
  logger,
  onShowToast,
  onGoToReview,
  onGoToMenu,
}: ReceiptScreenProps) {
  if (!order || order.getStatus() === 'Pending') {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-orange-600" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">No Receipt Generated Yet</h1>
        <p className="mt-2 text-sm text-slate-600">
          Confirm an order at checkout to generate and download your <code className="font-mono">order_receipt.txt</code>.
        </p>
        <button
          type="button"
          onClick={onGoToMenu}
          className="mt-6 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const rawReceipt = OrderFileManager.buildReceiptString(order);
  const parsedReceipt = OrderFileManager.parseReceipt(rawReceipt);

  const handleDownload = () => {
    OrderFileManager.downloadReceipt(order, 'order_receipt.txt');
    logger.info(`Downloaded order_receipt.txt for Order #${order.getOrderId()}.`);
    onShowToast('success', 'Receipt Downloaded', 'Saved as order_receipt.txt.');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
            Step 5 of 6 · File Handling With String
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Order Receipt</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-orange-700 hover:to-red-700 whitespace-nowrap"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Download order_receipt.txt</span>
          </button>
          <button
            type="button"
            onClick={onGoToReview}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Star className="h-4 w-4" aria-hidden="true" />
            <span>Write Review</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Parsed Receipt View (mirrors OrderFileManager.readReceipt using split/trim) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <h2 className="text-base font-bold text-slate-900">Formatted Receipt View</h2>
          <p className="mt-1 text-xs text-slate-500">
            Parsed line-by-line by <code className="font-mono">OrderFileManager.parseReceipt()</code>{' '}
            using <code className="font-mono">split()</code>, <code className="font-mono">trim()</code>,
            and <code className="font-mono">toUpperCase()</code>.
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="space-y-1 border-b border-dashed border-slate-300 pb-4 text-xs text-slate-700 font-mono">
              {parsedReceipt.headerLines
                .filter((line) => !line.startsWith('---') && !line.startsWith('==='))
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </div>

            <div className="mt-4 space-y-2.5">
              {parsedReceipt.itemRows.map((row, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{row.label}</span>
                  <span className="font-mono tabular-nums text-slate-900">Rs. {row.amount}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-4">
              <span className="text-base font-bold text-slate-900">TOTAL</span>
              <span className="text-lg font-bold text-orange-600 font-mono tabular-nums">
                Rs. {parsedReceipt.totalAmount}
              </span>
            </div>
          </div>
        </section>

        {/* Raw Text File Preview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <h2 className="text-base font-bold text-slate-900">Raw File Content (order_receipt.txt)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Exact string generated by <code className="font-mono">OrderFileManager.buildReceiptString()</code>.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-5 text-xs leading-relaxed text-slate-100 font-mono">
            {rawReceipt}
          </pre>
        </section>
      </div>
    </div>
  );
}
