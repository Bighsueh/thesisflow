/**
 * 標記類型引導教學
 *
 * 當使用者首次選取文字時，顯示引導說明各按鈕用途
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Star, MessageCircle, BookOpen, Bookmark, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

const ONBOARDING_KEY = 'thesisflow_mark_type_onboarding_completed';

interface MarkTypeOnboardingProps {
  onComplete: () => void;
}

const onboardingSteps = [
  {
    type: 'confused',
    icon: HelpCircle,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: '不懂',
    subtitle: '讓 AI 解釋',
    description: '遇到看不懂的字詞或句子？點這個，AI 會引導你一步步理解，而不是直接給答案。',
  },
  {
    type: 'important',
    icon: Star,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: '重點',
    subtitle: '做筆記',
    description: '覺得這段很重要？標記起來並寫下你的理解，幫助你整理思緒。',
  },
  {
    type: 'question',
    icon: MessageCircle,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: '與 AI 討論',
    subtitle: '聊聊這段',
    description: '對這段有想法或疑問？和 AI 深入討論，探索更多可能性。',
  },
  {
    type: 'reference',
    icon: BookOpen,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: '看 Reference',
    subtitle: '找相關文獻',
    description: '想知道這段引用了哪些文獻？讓 AI 幫你找相關資料。',
  },
  {
    type: 'bookmark',
    icon: Bookmark,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    title: '書籤',
    subtitle: '稍後再看',
    description: '先標記起來，之後再回來看。',
  },
];

export const MarkTypeOnboarding: React.FC<MarkTypeOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 關閉按鈕 */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            {/* 標題 */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">如何使用標記工具</h2>
              <p className="text-sm text-slate-500">選取文字後，選擇合適的標記類型</p>
            </div>

            {/* 步驟內容 */}
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex flex-col items-center text-center mb-6"
            >
              <div
                className={`w-16 h-16 rounded-2xl ${step.iconBg} flex items-center justify-center mb-4`}
              >
                <Icon size={32} className={step.iconColor} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{step.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{step.subtitle}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
            </motion.div>

            {/* 進度指示器 */}
            <div className="flex justify-center gap-1.5 mb-6">
              {onboardingSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep ? 'bg-violet-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* 按鈕區 */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                跳過教學
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                {currentStep < onboardingSteps.length - 1 ? (
                  <>
                    下一個 <ChevronRight size={16} />
                  </>
                ) : (
                  '開始使用'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 檢查是否需要顯示引導教學
export const shouldShowOnboarding = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_KEY) !== 'true';
};

// 重置引導教學狀態（用於測試）
export const resetOnboarding = (): void => {
  localStorage.removeItem(ONBOARDING_KEY);
};
