/**
 * 統一的日誌工具
 *
 * 在開發環境中輸出日誌，在生產環境中抑制一般日誌
 * warn 和 error 在所有環境中都會輸出
 */

const isDev = import.meta.env.DEV;

/**
 * 日誌級別
 */
export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

/**
 * 日誌工具介面
 */
interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

/**
 * 創建帶前綴的日誌工具
 * @param prefix 日誌前綴（如模組名稱）
 */
export function createLogger(prefix?: string): Logger {
  const formatArgs = (args: unknown[]): unknown[] => {
    if (prefix) {
      return [`[${prefix}]`, ...args];
    }
    return args;
  };

  return {
    // 一般日誌 - 僅在開發環境輸出
    log: (...args: unknown[]) => {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log(...formatArgs(args));
      }
    },

    // 資訊日誌 - 僅在開發環境輸出
    info: (...args: unknown[]) => {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.info(...formatArgs(args));
      }
    },

    // 警告日誌 - 所有環境都輸出
    warn: (...args: unknown[]) => {
      console.warn(...formatArgs(args));
    },

    // 錯誤日誌 - 所有環境都輸出
    error: (...args: unknown[]) => {
      console.error(...formatArgs(args));
    },

    // 調試日誌 - 僅在開發環境輸出
    debug: (...args: unknown[]) => {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.debug(...formatArgs(args));
      }
    },

    // 分組開始 - 僅在開發環境輸出
    group: (label: string) => {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.group(prefix ? `[${prefix}] ${label}` : label);
      }
    },

    // 分組結束 - 僅在開發環境輸出
    groupEnd: () => {
      if (isDev) {
        // eslint-disable-next-line no-console
        console.groupEnd();
      }
    },
  };
}

// 預設的日誌工具實例
export const logger = createLogger();

// 特定模組的日誌工具
export const authLogger = createLogger('Auth');
export const storeLogger = createLogger('Store');
export const pdfLogger = createLogger('PDF');
export const tourLogger = createLogger('Tour');
export const deviceLogger = createLogger('Device');
export const dashboardLogger = createLogger('Dashboard');
export const chatLogger = createLogger('Chat');
export const evidenceLogger = createLogger('Evidence');
