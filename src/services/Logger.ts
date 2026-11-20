export type LogLevel = 'INFO' | 'WARNING';

export interface LogRecord {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

const LOG_STORAGE_KEY = 'food_ordering_system_logs';

// OOP CONCEPT: Logging & Collections — Stores timestamped INFO/WARNING records and persists to localStorage
export class Logger {
  private logs: LogRecord[] = [];
  private onLogsChanged?: (logs: LogRecord[]) => void;
  private onRecordCreated?: (record: LogRecord) => void;

  constructor(onLogsChanged?: (logs: LogRecord[]) => void) {
    this.onLogsChanged = onLogsChanged;
    this.loadFromStorage();
  }

  public setOnLogsChanged(callback: (logs: LogRecord[]) => void): void {
    this.onLogsChanged = callback;
  }

  public setOnRecordCreated(callback?: (record: LogRecord) => void): void {
    this.onRecordCreated = callback;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.logs = parsed;
        }
      }
    } catch {
      this.logs = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }

  private appendRecord(level: LogLevel, message: string): void {
    const record: LogRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    this.logs = [record, ...this.logs];
    this.saveToStorage();

    if (this.onLogsChanged) {
      this.onLogsChanged([...this.logs]);
    }
    if (this.onRecordCreated) {
      this.onRecordCreated(record);
    }
  }

  public info(message: string): void {
    this.appendRecord('INFO', message);
  }

  public warning(message: string): void {
    this.appendRecord('WARNING', message);
  }

  public getLogs(): LogRecord[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.saveToStorage();
    if (this.onLogsChanged) {
      this.onLogsChanged([]);
    }
  }

  // OOP CONCEPT: File handling with String — Formats all log records into downloadable log text
  public formatLogFileContent(): string {
    if (this.logs.length === 0) {
      return 'No logs recorded yet.\n';
    }
    return [...this.logs]
      .reverse()
      .map((entry) => `[${entry.timestamp}] ${entry.level}: ${entry.message}`)
      .join('\n');
  }

  public downloadLogFile(fileName: string = 'food_order.log'): void {
    const content = this.formatLogFileContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
