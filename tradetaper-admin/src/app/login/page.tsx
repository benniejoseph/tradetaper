'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Store token in cookie (30 day expiry)
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `admin_token=${data.access_token}; expires=${expires}; path=/; SameSite=Strict`;
      localStorage.setItem('admin_token', data.access_token);

      toast.success('Welcome back!');
      router.push(from);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card p-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
             style={{ background: 'var(--gradient-brand)' }}>
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gradient">TradeTaper</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Admin Portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tradetaper.com"
              required
              className="admin-input pl-10"
              autoComplete="email"
              id="admin-email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="admin-input pl-10 pr-10"
              autoComplete="current-password"
              id="admin-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: 'var(--accent-danger-subtle)', color: 'var(--accent-danger)' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="admin-btn-primary w-full justify-center py-3 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating…
            </>
          ) : (
            'Sign In to Admin'
          )}
        </button>
      </form>

      <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        Access restricted to authorized TradeTaper administrators
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'var(--bg-base)' }}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #10B981, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{ backgroundImage: 'linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Wrap useSearchParams consumer in Suspense to avoid prerender errors */}
        <Suspense fallback={
          <div className="admin-card p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--accent-primary)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
