'use client';

import React, { useState } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { User, Shield, KeyRound, Plus, Trash2 } from 'lucide-react';

export default function UserManagement() {
  const { registeredUsers, createAccount } = useVeltrixStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'bdr' | 'admin'>('bdr');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !name) return;
    createAccount(username, password, name, role);
    setUsername('');
    setPassword('');
    setName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">User Management</h2>
          <p className="text-xs text-slate-500">Create and manage BDR agents and System Administrators.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Create User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-300 rounded shadow-sm p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-4 border-b pb-2">Add New User</h3>
            
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 crm-input py-1.5 text-xs"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 crm-input py-1.5 text-xs font-mono"
                  placeholder="e.g. jdoe123"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <KeyRound className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 crm-input py-1.5 text-xs font-mono"
                    placeholder="Strong password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'bdr' | 'admin')}
                  className="w-full px-3 crm-input py-1.5 text-xs cursor-pointer"
                >
                  <option value="bdr">BDR Agent</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2 mt-2 crm-btn-primary text-xs flex justify-center items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* User List Table */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider w-10">Status</th>
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Name</th>
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Username</th>
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Role</th>
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {registeredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Active"></span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{u.username}</td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase text-[9px]">
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase text-[9px]">
                          <User className="w-2.5 h-2.5" /> BDR
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-gray-400 hover:text-red-600 transition-colors" title="Delete (Disabled for Demo)">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {registeredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No users registered in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
