import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { Sparkles, Brain, Zap, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

export function LandingPage() {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // 從 public 資料夾載入本地 JSON 檔案
    fetch('/animations/Businessman flies up with rocket.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('載入動畫失敗:', err));
  }, []);

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-12">
          {/* Left Side - Text Content */}
          <div className="text-center lg:text-left space-y-8">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.5,
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 shadow-lg shadow-violet-500/10 text-sm font-medium text-violet-700 mb-4"
            >
              <Sparkles size={16} />
              <span>AI 驅動的研究助手</span>
            </motion.div>

            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.2,
              }}
              className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-tight"
            >
              加速您的 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600">
                文獻探討
              </span>
            </motion.h1>

            <motion.p
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.4,
              }}
              className="text-xl text-gray-600 leading-relaxed"
            >
              ThesisFlow 協助研究者和學生運用 AI 的力量，組織、分析與綜合學術文獻。
            </motion.p>

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.6,
              }}
              className="flex items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <Link to="/login">
                <Button size="lg" leftIcon={<Zap size={18} />}>
                  開始研究
                </Button>
              </Link>
              <Button variant="secondary" size="lg">
                查看示範
              </Button>
            </motion.div>
          </div>

          {/* Right Side - Lottie Animation */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.8,
              delay: 0.3,
            }}
            className="flex items-center justify-center"
          >
            <div className="w-full max-w-lg mx-auto">
              {animationData ? (
                <Lottie
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  className="w-full h-auto"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-gray-400">
                  <div className="text-sm">載入動畫中...</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="p-8 space-y-4" hoverEffect>
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 mb-4">
            <Brain size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">AI 分析</h3>
          <p className="text-gray-600 leading-relaxed">
            自動從您的 PDF 文獻庫中提取關鍵見解、研究方法與發現。
          </p>
        </GlassCard>

        <GlassCard className="p-8 space-y-4" hoverEffect>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <Users size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">協作群組</h3>
          <p className="text-gray-600 leading-relaxed">
            與學生和指導老師協作。即時分享文獻集合與註解。
          </p>
        </GlassCard>

        <GlassCard className="p-8 space-y-4" hoverEffect>
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">智能綜合</h3>
          <p className="text-gray-600 leading-relaxed">
            根據您選擇的論文，即時生成文獻矩陣與探討草稿。
          </p>
        </GlassCard>
      </section>

      {/* Stats Section */}
      <GlassCard className="p-12 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="text-4xl font-bold text-violet-600 mb-2">10k+</div>
            <div className="text-gray-600 font-medium">已分析論文</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2">500+</div>
            <div className="text-gray-600 font-medium">研究群組</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-gray-600 font-medium">用戶滿意度</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
