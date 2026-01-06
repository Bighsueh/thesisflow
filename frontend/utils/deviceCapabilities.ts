/**
 * Device Performance Detection Utility
 * 根據設備硬體能力判斷效能等級，調整導覽動畫視覺效果
 */

export type PerformanceLevel = 'high' | 'medium' | 'low';

export interface VisualConfig {
  spotlightBlur: number; // SVG mask 高斯模糊標準差
  backdropBlur: number; // backdrop-filter 模糊半徑 (px)
  backdropSaturate: number; // 飽和度倍數
  maskOpacity: number; // 遮罩不透明度 (0-1)
  pulseEnabled: boolean; // 是否啟用脈動動畫
  pulseDuration: number; // 脈動動畫週期 (秒)
}

/**
 * 檢測設備效能等級
 *
 * 檢測項目：
 * - backdrop-filter CSS 支援 (必要條件，不支援則降級為 low)
 * - 設備記憶體 (deviceMemory API)
 * - 處理器核心數 (hardwareConcurrency API)
 * - 是否為行動設備
 *
 * @returns 效能等級：'high' | 'medium' | 'low'
 */
export function getDevicePerformance(): PerformanceLevel {
  // 檢查 backdrop-filter 支援 (毛玻璃效果的關鍵)
  const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');

  if (!supportsBackdropFilter) {
    // 不支援毛玻璃效果，降級為低性能模式
    if (import.meta.env.DEV) {
      console.log('[DeviceCapabilities] backdrop-filter not supported → low');
    }
    return 'low';
  }

  // 取得設備記憶體 (API 可能不可用，預設為 4GB)
  const deviceMemory = (navigator as any).deviceMemory || 4;

  // 取得處理器核心數 (API 可能不可用，預設為 4)
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  // 檢測是否為行動設備
  const isMobile = /iPhone|iPad|Android|Windows Phone|webOS/i.test(navigator.userAgent);

  // 效能判定邏輯
  if (isMobile || deviceMemory < 4) {
    // 行動設備或低記憶體 → 降級為 low/medium
    if (deviceMemory < 3) {
      return 'low';
    }
    return 'medium';
  }

  if (deviceMemory >= 8 && hardwareConcurrency >= 8) {
    // 高端設備 (8GB+ 記憶體 + 8核+ CPU)
    return 'high';
  }

  // 中階設備
  return 'medium';
}

/**
 * 獲取視覺配置
 *
 * 根據效能等級返回相應的動畫和視覺參數：
 * - high: 完整視覺效果，包含複雜動畫和模糊
 * - medium: 平衡效果，適度模糊和較簡化動畫
 * - low: 最小化效果，降低模糊和禁用複雜動畫
 *
 * @param performance 效能等級
 * @returns 視覺配置對象
 */
export function getVisualConfig(performance: PerformanceLevel): VisualConfig {
  const configs: Record<PerformanceLevel, VisualConfig> = {
    high: {
      spotlightBlur: 25, // SVG mask 高斯模糊，營造柔和光暈
      backdropBlur: 6, // 背景毛玻璃效果（降低，使外部更清晰）
      backdropSaturate: 1.1, // 飽和度適度
      maskOpacity: 0.45, // 45% 半透明黑色遮罩（更透亮）
      pulseEnabled: true, // 啟用脈動效果，吸引眼球
      pulseDuration: 1.8, // 1.8 秒呼吸節奏
    },
    medium: {
      spotlightBlur: 22, // 稍微降低模糊強度
      backdropBlur: 5, // 適度毛玻璃效果（降低）
      backdropSaturate: 1.05, // 飽和度適度
      maskOpacity: 0.42, // 42% 不透明度（更透亮）
      pulseEnabled: true, // 仍然啟用脈動
      pulseDuration: 1.5, // 稍微加快節奏
    },
    low: {
      spotlightBlur: 18, // 輕微模糊
      backdropBlur: 4, // 最小毛玻璃效果（降低）
      backdropSaturate: 1.0, // 無飽和度增幅
      maskOpacity: 0.4, // 40% 遮罩（更透亮）
      pulseEnabled: false, // 禁用脈動以減少 GPU 負擔
      pulseDuration: 1.5, // (未使用)
    },
  };

  const config = configs[performance];

  if (import.meta.env.DEV) {
    console.log(`[DeviceCapabilities] Performance: ${performance}`, config);
  }

  return config;
}

/**
 * 一次性初始化函數：檢測設備並返回完整配置
 *
 * 使用場景：在 TourSpotlight 或 TourOverlay 組件初始化時調用
 *
 * @returns 包含效能等級和視覺配置的對象
 */
export function getDeviceConfig() {
  const performance = getDevicePerformance();
  const visualConfig = getVisualConfig(performance);

  return {
    performance,
    visualConfig,
  };
}
