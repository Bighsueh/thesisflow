import React from 'react'
import { Link } from 'react-router-dom'
import { Workflow, Users, LogOut, Home } from 'lucide-react'
import { useAuthStore } from '../../authStore'
import { Button } from '../ui/Button'
import { motion } from 'framer-motion'

interface TeacherSidebarProps {
  activeSection: 'flows' | 'accounts' | 'groups'
  onSectionChange: (section: 'flows' | 'accounts' | 'groups') => void
}

export function TeacherSidebar({
  activeSection,
  onSectionChange,
}: TeacherSidebarProps) {
  const { user, logout } = useAuthStore()

  const navItems = [
    {
      id: 'flows' as const,
      label: '教學流程管理',
      icon: <Workflow size={20} />,
    },
    {
      id: 'accounts' as const,
      label: '學生帳號管理',
      icon: <Users size={20} />,
    },
    {
      id: 'groups' as const,
      label: '學生群組管理',
      icon: <Users size={20} />,
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-2xl border-r border-white/80 shadow-lg z-40 flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-violet-500/30 transition-all">
            T
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-violet-600 transition-colors">
            Thesis<span className="text-violet-600">Flow</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative
                ${
                  isActive
                    ? 'text-violet-700 bg-violet-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="teacher-nav-pill"
                  className="absolute inset-0 bg-violet-100/50 rounded-xl -z-10"
                  transition={{
                    type: 'spring',
                    bounce: 0.2,
                    duration: 0.6,
                  }}
                />
              )}
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="px-2">
          <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
          <div className="text-xs text-gray-500">{user?.email}</div>
        </div>
        <div className="flex flex-col gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full justify-start" leftIcon={<Home size={16} />}>
              返回首頁
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            leftIcon={<LogOut size={16} />}
            onClick={logout}
          >
            登出
          </Button>
        </div>
      </div>
    </aside>
  )
}



