import type { Variants, Transition } from 'framer-motion';

// 彈性緩動配置（與現有系統一致）
export const spring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 15,
  mass: 1,
};

// 液態彈簧（電影級柔和過渡，用於 Tour Spotlight）
export const liquidSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 30,
  mass: 1,
};

// Custom cubic-bezier（平滑緩動）
export const easeOutQuart = [0.22, 1, 0.36, 1] as const;

// 標準淡入
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// 滑動上升
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOutQuart },
  },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
};

// 滑動下降
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOutQuart },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// 彈性縮放
export const scaleSpring: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring,
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// Stagger 容器（電影級動畫用）
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// Stagger 容器（快速版）
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// 電影級淡入上升（用於 Landing Page）
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: gentleSpring,
  },
};

// 電影級縮放進入
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
};

// 懸停效果（與 GlassCard 一致）
export const hoverLift = {
  scale: 1.02,
  y: -4,
  transition: { duration: 0.2 },
};

export const hoverGlow = {
  boxShadow: '0 20px 60px -10px rgba(139, 92, 246, 0.5)',
  scale: 1.05,
};

export const tapEffect = {
  scale: 0.98,
};

// Tour 相關動畫

// Spotlight 進入動畫
export const spotlightVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Tooltip 進入動畫（根據位置調整方向）
export const getTooltipVariants = (
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
): Variants => {
  const offsets = {
    top: { y: 10, x: 0 },
    bottom: { y: -10, x: 0 },
    left: { x: 10, y: 0 },
    right: { x: -10, y: 0 },
    center: { y: 20, x: 0 },
  };

  const offset = offsets[placement];

  return {
    hidden: {
      opacity: 0,
      scale: 0.9,
      ...offset,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        delay: 0.15,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.15 },
    },
  };
};

// 箭頭延遲出現
export const arrowVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.25, duration: 0.2 },
  },
  exit: { opacity: 0, scale: 0, transition: { duration: 0.1 } },
};

// 進度指示器動畫
export const progressDotVariants: Variants = {
  inactive: { scale: 1, backgroundColor: '#d1d5db' },
  active: { scale: 1.2, backgroundColor: '#a78bfa' },
  completed: { scale: 1, backgroundColor: '#7c3aed' },
};

// 數字翻轉動畫
export const numberFlipVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
};

// 控制按鈕動畫
export const controlsVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.2, ...smoothSpring },
  },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
};

/**
 * 脈動效果（高亮邊框）
 *
 * 升級版：實現呼吸般的內外發光效果
 * - 初始狀態：內發光 (紫色 0.7 不透明度)
 * - 過渡狀態：外發光和內發光混合
 * - 完成狀態：外發光 (紫色 0.3 不透明度，已淡出)
 *
 * 動畫週期：1.8 秒（緩慢呼吸節奏，避免過度吸引注意力）
 */
export const pulseAnimation = {
  boxShadow: [
    // 初始狀態：強內發光
    '0 0 0 0 rgba(139, 92, 246, 0.7), 0 0 20px 4px rgba(139, 92, 246, 0.5)',
    // 中間狀態：內發光逐漸減弱，外發光逐漸增強
    '0 0 0 10px rgba(139, 92, 246, 0.4), 0 0 25px 8px rgba(139, 92, 246, 0.35)',
    // 完成狀態：強外發光，內發光淡出
    '0 0 0 20px rgba(139, 92, 246, 0), 0 0 30px 8px rgba(139, 92, 246, 0.3)',
  ],
};

export const pulseTransition = {
  duration: 1.8, // 緩慢呼吸節奏（秒）
  repeat: Infinity,
  ease: [0.4, 0, 0.6, 1] as const, // 自定義緩動曲線：快進、緩出
};

// Modal 動畫
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
};
