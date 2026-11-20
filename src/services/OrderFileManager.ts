import { Order } from '../models/Order';

export interface ParsedReceipt {
  headerLines: string[];
  itemRows: { label: string; amount: string }[];
  totalAmount: string;
}

// OOP CONCEPT: File handling with String — Builds, formats, parses, and exports receipt text files
export class OrderFileManager {
  /**
   * Builds a receipt string using template literals, String.toUpperCase(), and CSV-style item lines
   * matching the Java OrderFileManager.saveReceipt() format.
   */
  public static buildReceiptString(order: Order): string {
    const header = [
      `===== FOOD PARADISE RECEIPT =====`,
      `ORDER ID: ${order.getOrderId()}`,
      `CUSTOMER: ${order.getCustomerName().toUpperCase()}`,
      `ADDRESS: ${order.getCustomer().getAddress().toUpperCase()}`,
      `PAYMENT: ${order.getPaymentName().toUpperCase()}`,
      `DATE: ${order.getPlacedAt()}`,
      `---------------------------------`,
    ];

    const summaryMap = order.getItemSummaryMap();
    const itemLines: string[] = [];

    summaryMap.forEach(({ food, quantity }) => {
      const lineTotal = food.getPrice() * quantity;
      itemLines.push(`${food.getName()} x${quantity},${lineTotal.toFixed(2)}`);
    });

    const footer = [
      `---------------------------------`,
      `TOTAL,${order.getTotal().toFixed(2)}`,
    ];

    return [...header, ...itemLines, ...footer].join('\n');
  }

  /**
   * Parses the raw receipt text back using String.split() and String.trim(),
   * mirroring Java's OrderFileManager.readReceipt().
   */
  public static parseReceipt(rawText: string): ParsedReceipt {
    const lines = rawText.split('\n');
    const headerLines: string[] = [];
    const itemRows: { label: string; amount: string }[] = [];
    let totalAmount = '0.00';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      const isHeaderLine =
        line.startsWith('=====') ||
        line.startsWith('-----') ||
        line.startsWith('ORDER ID:') ||
        line.startsWith('CUSTOMER:') ||
        line.startsWith('ADDRESS:') ||
        line.startsWith('PAYMENT:') ||
        line.startsWith('DATE:');

      if (!isHeaderLine && line.includes(',')) {
        const parts = line.split(',');
        const label = parts[0]?.trim() ?? '';
        const amount = parts[1]?.trim() ?? '0.00';

        if (label.toUpperCase() === 'TOTAL') {
          totalAmount = amount;
        } else {
          itemRows.push({ label, amount });
        }
      } else {
        headerLines.push(line);
      }
    }

    return { headerLines, itemRows, totalAmount };
  }

  /**
   * Generates the receipt string and triggers a browser download as order_receipt.txt.
   */
  public static downloadReceipt(order: Order, fileName: string = 'order_receipt.txt'): string {
    const receiptText = OrderFileManager.buildReceiptString(order);
    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return receiptText;
  }
}
