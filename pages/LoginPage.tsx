import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, user, hydrate } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'teacher' ? '/teacher' : '/student', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, name: name || email.split('@')[0], role });
      }
    } catch (e: any) {
      setError(e.message || '發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg p-8 border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-sm text-slate-500">ThesisFlow</div>
            <h1 className="text-2xl font-bold text-slate-800">{mode === 'login' ? '登入' : '註冊'}</h1>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '建立新帳號' : '已有帳號？登入'}
          </button>
        </div>

        {mode === 'register' && (
          <div className="form-control mb-3">
            <label className="label"><span className="label-text">姓名</span></label>
            <input className="input input-bordered" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}

        <div className="form-control mb-3">
          <label className="label"><span className="label-text">Email</span></label>
          <input className="input input-bordered" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div className="form-control mb-4">
          <label className="label"><span className="label-text">密碼</span></label>
          <input className="input input-bordered" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>

        {mode === 'register' && (
          <div className="form-control mb-4">
            <label className="label"><span className="label-text">角色</span></label>
            <select className="select select-bordered" value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="teacher">教師</option>
              <option value="student">學生</option>
            </select>
          </div>
        )}

        {error && <div className="alert alert-error text-sm mb-4">{error}</div>}

        <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? '處理中...' : mode === 'login' ? '登入' : '註冊並登入'}
        </button>
      </div>
    </div>
  );
}

