import { Mail, Shield, LogOut, Camera } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">帳號設定</h1>

      <GlassCard className="p-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-violet-200 to-indigo-200 border-4 border-white shadow-lg flex items-center justify-center text-violet-600 text-4xl font-bold overflow-hidden">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">{user?.name || '使用者'}</h2>
              <p className="text-gray-500">{user?.role === 'teacher' ? '教師' : '學生'}</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="姓名" defaultValue={user?.name || ''} disabled />
              <Input
                label="角色"
                defaultValue={user?.role === 'teacher' ? '教師' : '學生'}
                icon={<Shield size={16} />}
                disabled
              />
            </div>
            <Input
              label="電子郵件"
              defaultValue={user?.email || ''}
              icon={<Mail size={16} />}
              disabled
            />

            <div className="pt-4 flex gap-4">
              <Button disabled>儲存變更</Button>
              <Button variant="ghost" disabled>
                取消
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">登出</h3>
          <p className="text-gray-500 text-sm">安全地從此裝置登出您的帳號</p>
        </div>
        <Button variant="danger" leftIcon={<LogOut size={16} />} onClick={handleLogout}>
          登出
        </Button>
      </GlassCard>
    </div>
  );
}
