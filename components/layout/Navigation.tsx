import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Users,
  FileText,
  User,
  LogOut,
  Sparkles,
  Home,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../authStore'

export function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const isLanding = location.pathname === '/'
  const isLogin = location.pathname === '/login'
  
  // 登入頁面不顯示導航
  if (isLogin) {
    return null
  }

  const navItems = [
    {
      path: '/dashboard',
      label: '儀表板',
      icon: <LayoutGrid size={18} />,
    },
    {
      path: '/projects',
      label: '專案',
      icon: <Sparkles size={18} />,
    },
    {
      path: '/groups',
      label: '群組',
      icon: <Users size={18} />,
    },
    {
      path: '/literature',
      label: '文獻',
      icon: <FileText size={18} />,
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-lg shadow-violet-500/10 px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-violet-500/30 transition-all">
              T
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-violet-600 transition-colors">
              Thesis<span className="text-violet-600">Flow</span>
            </span>
          </Link>

          {/* Desktop Nav - 只顯示給已登入的學生 */}
          {user && user.role === 'student' && (
            <div className="hidden md:flex items-center gap-1">
              {/* 首頁連結 */}
              <Link to="/">
                <div
                  className={`
                    relative px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-200
                    ${location.pathname === '/' ? 'text-violet-700' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}
                  `}
                >
                  {location.pathname === '/' && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-violet-100/50 rounded-xl -z-10"
                      transition={{
                        type: 'spring',
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <Home size={18} />
                  <span>首頁</span>
                </div>
              </Link>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link key={item.path} to={item.path}>
                    <div
                      className={`
                      relative px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-200
                      ${isActive ? 'text-violet-700' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}
                    `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-violet-100/50 rounded-xl -z-10"
                          transition={{
                            type: 'spring',
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                      {item.icon}
                      {item.label}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    登入
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="sm">開始使用</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile">
                  <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                    <p className="text-xs text-gray-500">
                      {user.role === 'teacher' ? '教師' : '學生'}
                    </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-100 to-indigo-100 border border-white shadow-sm flex items-center justify-center text-violet-700">
                      <User size={18} />
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all"
                  title="登出"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

