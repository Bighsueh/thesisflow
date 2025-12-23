import { pdfjs } from 'react-pdf';

// 配置 PDF.js worker
// react-pdf 7.6.0 使用 pdfjs-dist 3.11.174
// 使用 CDN worker，确保协议正确（使用 https）
const setupPDFWorker = () => {
  if (typeof window === 'undefined') return;
  
  // 获取实际的 pdfjs 版本，如果获取不到则使用 react-pdf 7.6.0 对应的版本
  const version = pdfjs.version || '3.11.174';
  
  // 正确的 CDN worker 路径
  const correctWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
  
  // 检查当前 worker 路径是否正确，如果不正确则强制设置
  const currentWorkerSrc = pdfjs.GlobalWorkerOptions.workerSrc || '';
  if (!currentWorkerSrc.includes('cdnjs.cloudflare.com') && !currentWorkerSrc.includes('unpkg.com')) {
    // 如果当前路径不是 CDN 路径，强制设置
    pdfjs.GlobalWorkerOptions.workerSrc = correctWorkerSrc;
  } else if (currentWorkerSrc !== correctWorkerSrc) {
    // 如果路径不匹配，更新为正确的路径
    pdfjs.GlobalWorkerOptions.workerSrc = correctWorkerSrc;
  }
};

// 立即执行配置
setupPDFWorker();

// 在 DOM 加载完成后再次检查（防止其他代码覆盖）
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPDFWorker);
  } else {
    // DOM 已经加载完成，延迟一点再检查
    setTimeout(setupPDFWorker, 100);
  }
}

// 导出配置函数，供需要的地方使用
export const configurePDFWorker = setupPDFWorker;

// 错误处理：抑制 worker 终止相关的警告和错误
if (typeof window !== 'undefined') {
  // 只在第一次加载时设置，避免重复设置
  if (!(window as any).__pdfWorkerErrorHandlerInstalled) {
    (window as any).__pdfWorkerErrorHandlerInstalled = true;

    // 捕获未处理的 Promise rejection（worker 终止错误）
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason?.message || reason?.toString() || '';
      
      // 只处理 PDF worker 相关的终止错误
      if (
        typeof message === 'string' &&
        (message.includes('Worker was terminated') ||
         message.includes('Worker task was terminated'))
      ) {
        // 阻止这些错误显示在控制台，它们不影响功能
        event.preventDefault();
        return;
      }
    }, { passive: true });

    // 过滤控制台警告（仅针对 PDF worker 相关）
    const originalConsoleWarn = console.warn;
    console.warn = function(...args: any[]) {
      const message = args[0]?.toString() || '';
      // 只过滤 PDF worker 终止相关的警告
      if (
        typeof message === 'string' &&
        message.includes('getTextContent') &&
        message.includes('Worker task was terminated')
      ) {
        // 静默忽略这些警告，它们不影响功能
        return;
      }
      // 过滤 worker 设置失败的警告，但记录实际使用的路径
      if (
        typeof message === 'string' &&
        message.includes('Setting up fake worker failed')
      ) {
        // 如果 worker 设置失败，尝试重新配置
        setupPDFWorker();
        console.warn('PDF worker 配置已重新设置，当前路径:', pdfjs.GlobalWorkerOptions.workerSrc);
        return;
      }
      // 其他警告正常显示
      originalConsoleWarn.apply(console, args);
    };
  }
}

