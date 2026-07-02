/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Shield, Lock, User, CheckCircle2, ChevronRight, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export default function LoginScreen({ users, onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemoLogins, setShowDemoLogins] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน (Please enter username and password)');
      return;
    }

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (foundUser) {
      setError('');
      onLoginSuccess(foundUser);
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (Invalid username or password)');
    }
  };

  const selectDemoUser = (user: UserAccount) => {
    setUsername(user.username);
    setPassword(user.password || '');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-emerald-400 to-sky-500 flex items-center justify-center p-4 relative overflow-hidden" id="login-container">
      {/* Background organic circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-200/20 rounded-full blur-[120px]" />
 
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex p-3 bg-white/20 text-white rounded-2xl mb-3 border border-white/30"
          >
            <Compass className="w-10 h-10 animate-spin-slow" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white">
            KRABI ATV ADVENTURE
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Voucher & Financial Management Workspace
          </p>
        </div>
 
        {/* Login Box */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/25 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/40 shadow-teal-950/10"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-300" />
              ลงชื่อเข้าใช้งาน / System Sign-In
            </h2>
            <p className="text-xs text-white/90 mt-1 font-medium">
              กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินหรือพนักงานเพื่อจัดการวอเชอร์
            </p>
          </div>
 
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                ชื่อผู้ใช้งาน / Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/70">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-350 focus:border-transparent transition-all"
                  placeholder="เช่น admin, staff_noom"
                  id="login-username"
                />
              </div>
            </div>
 
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                รหัสผ่าน / Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/70">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-350 focus:border-transparent transition-all"
                  placeholder="รหัสผ่านเข้าสู่ระบบ"
                  id="login-password"
                />
              </div>
            </div>
 
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                {error}
              </div>
            )}
 
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
              id="login-submit"
            >
              เข้าสู่ระบบ / Log In
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
 
          {/* Quick Accounts list for local workspace convenience */}
          {showDemoLogins && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <span className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                บัญชีทดสอบในระบบ (Demo Accounts)
              </span>
              <div className="grid grid-cols-1 gap-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectDemoUser(u)}
                    type="button"
                    className={`text-left p-2 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                      username === u.username
                        ? 'bg-white/35 border-white text-white shadow-lg shadow-black/5'
                        : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <Shield className={`w-3 h-3 ${u.role === 'admin' ? 'text-amber-300' : u.role === 'manager' ? 'text-sky-300' : 'text-white/85'}`} />
                        <span>{u.username}</span>
                        <span className="px-1.5 py-0.2 bg-black/25 text-[9px] font-bold rounded uppercase">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/95 mt-0.5 font-medium">
                        Pass: <span className="font-mono font-bold text-white">{u.password}</span>
                      </div>
                    </div>
                    {username === u.username && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
 
        {/* Footer info */}
        <p className="text-center text-white/90 text-[11px] mt-6 font-medium">
          ระบบสำรองที่นั่งและวอเชอร์จำหน่ายทัวร์ © 2026 KRABI ATV ADVENTURE. All rights reserved.
        </p>
      </div>
    </div>
  );
}
