import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../authStore'
import { GlassCard } from '../components/ui/GlassCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { GradientBackground } from '../components/ui/GradientBackground'
import { Mail, Lock, User, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, user, hydrate } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('teacher')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (user) {
      navigate(user.role === 'teacher' ? '/teacher' : '/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({ email, password, name: name || email.split('@')[0], role })
      }
    } catch (e: any) {
      setError(e.message || '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 relative">
      <GradientBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  T
                </div>
                <span className="font-bold text-2xl text-gray-900 tracking-tight">
                  Theis<span className="text-violet-600">Flow</span>
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {mode === 'login' ? '歡迎回來' : '建立帳號'}
              </h1>
              <p className="text-gray-500">
                {mode === 'login' ? '登入以繼續您的研究旅程' : '開始使用 TheisFlow'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              {mode === 'register' && (
                <Input
                  label="姓名"
                  placeholder="請輸入您的姓名"
                  icon={<User size={16} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              <Input
                label="電子郵件"
                placeholder="example@email.com"
                type="email"
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="密碼"
                placeholder="請輸入密碼"
                type="password"
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                    角色
                  </label>
                  <select
                    className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 shadow-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
                  >
                    <option value="teacher">教師</option>
                    <option value="student">學生</option>
                  </select>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSubmit}
                isLoading={loading}
                disabled={loading}
                leftIcon={mode === 'login' ? undefined : <Sparkles size={18} />}
              >
                {loading ? '處理中...' : mode === 'login' ? '登入' : '註冊並登入'}
              </Button>
            </div>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setError('')
                }}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
              >
                {mode === 'login' ? '還沒有帳號？立即註冊' : '已有帳號？立即登入'}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
