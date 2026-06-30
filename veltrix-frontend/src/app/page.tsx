'use client';

import { useVeltrixStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Lock, User, KeyRound, AlertCircle } from 'lucide-react';

export default function SignIn() {
  const { user, signIn, loginError } = useVeltrixStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'bdr' | 'admin'>('bdr');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (user) {
      if (user.role === 'bdr') {
        router.push('/bdr');
      } else {
        router.push('/admin');
      }
    }
  }, [user, router, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center text-slate-500 text-xs font-semibold">
        Initializing CRM Portal...
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = signIn(username, password);
    if (success) {
      const userState = useVeltrixStore.getState().user;
      if (userState) {
        router.push(`/${userState.role}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="w-full max-w-sm">
        
        {/* CRM Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-10 h-10 rounded bg-blue-600 items-center justify-center text-white text-lg font-black mb-3 shadow">
            V
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Veltrix CRM</h1>
          <p className="text-xs text-slate-500 mt-1">Enterprise Lead Sourcing & Routing Console</p>
        </div>

        {/* Login Box (EspoCRM styled white card) */}
        <div className="bg-white border border-gray-300 rounded shadow-sm p-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 border-b border-gray-100 pb-3">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 crm-input"
                  placeholder="e.g. LMONA"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 crm-input"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            {/* Error Message Box */}
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="w-full py-2.5 crm-btn-primary">
              Sign In
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
