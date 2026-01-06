import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import {
  spotlightVariants,
  pulseAnimation,
  pulseTransition,
  liquidSpring,
} from '../../config/animations';
import { getDeviceConfig } from '../../utils/deviceCapabilities';

interface TourSpotlightProps {
  targetRect: DOMRect;
  shape?: 'rect' | 'circle';
  pulse?: boolean;
  padding?: number;
}

export function TourSpotlight({
  targetRect,
  shape = 'rect',
  pulse = true,
  padding = 16, // 增加從 8 到 16，避免覆蓋文字
}: TourSpotlightProps) {
  // 獲取設備效能配置（用於響應式視覺效果）
  const { visualConfig } = useMemo(() => getDeviceConfig(), []);

  const left = targetRect.left - padding;
  const top = targetRect.top - padding;
  const width = targetRect.width + padding * 2;
  const height = targetRect.height + padding * 2;
  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;
  const radius = Math.max(width, height) / 2 + padding;

  // 根據脈動是否啟用，決定是否應用動畫
  const shouldPulse = pulse && visualConfig.pulseEnabled;

  return (
    <motion.div
      variants={spotlightVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[9998] pointer-events-none"
    >
      {/* 半透明遮罩（使用 SVG mask + 高斯模糊濾鏡） */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          {/* 高斯模糊濾鏡 - 柔和羽化邊緣 (根據設備性能調整) */}
          <filter
            id="spotlight-blur"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={visualConfig.spotlightBlur}
              edgeMode="duplicate"
            />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 1 1" />
            </feComponentTransfer>
          </filter>

          {/* Spotlight Mask */}
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {shape === 'rect' && (
              <motion.rect
                x={left}
                y={top}
                width={width}
                height={height}
                rx="16"
                ry="16"
                fill="black"
                filter="url(#spotlight-blur)"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={liquidSpring}
              />
            )}
            {shape === 'circle' && (
              <motion.circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="black"
                filter="url(#spotlight-blur)"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={liquidSpring}
              />
            )}
          </mask>
        </defs>

        {/* 毛玻璃遮罩層 (根據設備性能調整模糊和飽和度) */}
        <foreignObject x="0" y="0" width="100%" height="100%">
          <div
            className="w-full h-full"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${visualConfig.maskOpacity})`,
              WebkitBackdropFilter: `blur(${visualConfig.backdropBlur}px) saturate(${visualConfig.backdropSaturate})`,
              backdropFilter: `blur(${visualConfig.backdropBlur}px) saturate(${visualConfig.backdropSaturate})`,
              willChange: 'filter, backdrop-filter',
              transform: 'translateZ(0)', // 啟用硬體加速
              mask: 'url(#spotlight-mask)',
              WebkitMask: 'url(#spotlight-mask)',
            }}
          />
        </foreignObject>
      </svg>

      {/* 高亮邊框 + 脈動效果 (根據設備性能調整動畫) */}
      <motion.div
        className="absolute border-4 border-violet-500 shadow-lg shadow-violet-500/50 will-change-transform"
        style={{
          left,
          top,
          width,
          height,
          borderRadius: shape === 'circle' ? '50%' : '16px',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...(shouldPulse ? { boxShadow: pulseAnimation.boxShadow } : {}),
        }}
        transition={
          shouldPulse
            ? {
                opacity: { duration: 0.3 },
                scale: liquidSpring,
                boxShadow: pulseTransition,
              }
            : liquidSpring
        }
      />
    </motion.div>
  );
}
