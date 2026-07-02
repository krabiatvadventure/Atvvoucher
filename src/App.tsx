/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, Voucher, Expense, SystemOptions, UserRole, UserPermissions } from './types';
import { DEFAULT_USERS, DEFAULT_OPTIONS, DEFAULT_VOUCHERS, DEFAULT_EXPENSES } from './data/defaultData';
import LoginScreen from './components/LoginScreen';
import VoucherForm from './components/VoucherForm';
import VoucherCard from './components/VoucherCard';
import SpreadsheetView from './components/SpreadsheetView';
import ExpenseTracker from './components/ExpenseTracker';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { Compass, Users, LogOut, FileText, TrendingUp, Compass as CompassIcon, ShieldAlert, CheckSquare, Plus, Settings2, BarChart2, Eye, ShieldCheck, Mail, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  // --- Firebase Persistent States ---
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [options, setOptions] = useState<SystemOptions>(DEFAULT_OPTIONS);

  const [usersLoaded, setUsersLoaded] = useState(false);
  const [vouchersLoaded, setVouchersLoaded] = useState(false);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('krabi_atv_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<string>('issue');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [shouldAutoDownload, setShouldAutoDownload] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  // For visual notification triggers
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state to Firebase Firestore
  useEffect(() => {
    // 1. Sync options
    const optionsRef = doc(db, 'options', 'system');
    const unsubOptions = onSnapshot(optionsRef, async (snap) => {
      if (snap.exists()) {
        setOptions(snap.data() as SystemOptions);
        setOptionsLoaded(true);
      } else {
        await setDoc(optionsRef, DEFAULT_OPTIONS);
      }
    }, (error) => {
      console.error("Error loading options:", error);
      setOptionsLoaded(true);
    });

    // 2. Sync users
    const usersCol = collection(db, 'users');
    const unsubUsers = onSnapshot(usersCol, async (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_USERS.forEach((user) => {
          batch.set(doc(db, 'users', user.id), user);
        });
        await batch.commit();
      } else {
        const list: UserAccount[] = [];
        snap.forEach((d) => list.push(d.data() as UserAccount));
        setUsers(list);
        setUsersLoaded(true);
      }
    }, (error) => {
      console.error("Error loading users:", error);
      setUsersLoaded(true);
    });

    // 3. Sync vouchers
    const vouchersCol = collection(db, 'vouchers');
    const unsubVouchers = onSnapshot(vouchersCol, async (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_VOUCHERS.forEach((v) => {
          batch.set(doc(db, 'vouchers', v.id), v);
        });
        await batch.commit();
      } else {
        const list: Voucher[] = [];
        snap.forEach((d) => list.push(d.data() as Voucher));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setVouchers(list);
        setVouchersLoaded(true);
      }
    }, (error) => {
      console.error("Error loading vouchers:", error);
      setVouchersLoaded(true);
    });

    // 4. Sync expenses
    const expensesCol = collection(db, 'expenses');
    const unsubExpenses = onSnapshot(expensesCol, async (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_EXPENSES.forEach((e) => {
          batch.set(doc(db, 'expenses', e.id), e);
        });
        await batch.commit();
      } else {
        const list: Expense[] = [];
        snap.forEach((d) => list.push(d.data() as Expense));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setExpenses(list);
        setExpensesLoaded(true);
      }
    }, (error) => {
      console.error("Error loading expenses:", error);
      setExpensesLoaded(true);
    });

    return () => {
      unsubOptions();
      unsubUsers();
      unsubVouchers();
      unsubExpenses();
    };
  }, []);

  // Sync currentUser session to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('krabi_atv_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('krabi_atv_current_user');
    }
  }, [currentUser]);

  // Toast notifier helper
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    // Determine default tab based on user roles
    setActiveTab('issue');
    showNotification(`ยินดีต้อนรับคุณ ${user.username} เข้าสู่ระบบ (Log in successful)`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedVoucher(null);
    setEditingVoucher(null);
  };

  // Auto incremental voucher ID generation
  const generateVoucherId = (dateString: string) => {
    // dateString format: YYYY-MM-DD -> extract YYYYMMDD
    const cleanDate = dateString.replace(/-/g, '');
    const prefix = `V-${cleanDate}-`;
    
    // Find highest running index for this specific date
    const dayVouchers = vouchers.filter((v) => v.serviceDate === dateString);
    let highestIdx = 0;
    dayVouchers.forEach((v) => {
      const parts = v.id.split('-');
      if (parts.length === 3) {
        const runningNum = parseInt(parts[2], 10);
        if (!isNaN(runningNum) && runningNum > highestIdx) {
          highestIdx = runningNum;
        }
      }
    });

    const nextIdxString = String(highestIdx + 1).padStart(3, '0');
    return `${prefix}${nextIdxString}`;
  };

  // CREATE / UPDATE VOUCHER handler
  const handleVoucherSubmit = async (voucherData: Omit<Voucher, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) return;

    try {
      if (editingVoucher) {
        // Edit existing in Firestore
        const ref = doc(db, 'vouchers', editingVoucher.id);
        await setDoc(ref, {
          ...editingVoucher,
          ...voucherData
        });
        setEditingVoucher(null);
        showNotification(`อัปเดตข้อมูลวอเชอร์ ${editingVoucher.id} สำเร็จ!`);
        
        // Auto toggle to search view to see update
        setActiveTab('search');
      } else {
        // Create new in Firestore
        const nextId = generateVoucherId(voucherData.serviceDate);
        const newVoucher: Voucher = {
          ...voucherData,
          id: nextId,
          createdBy: currentUser.username,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'vouchers', nextId), newVoucher);
        setShouldAutoDownload(true);
        setSelectedVoucher(newVoucher);
        showNotification(`สร้างวอเชอร์รหัส ${nextId} สำเร็จ!`);

        if (voucherData.sendEmail) {
          showNotification(`ส่งเมล Voucher ${nextId} ไปยัง ${voucherData.customerEmail} เรียบร้อยแล้ว!`);
        }
      }
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูลวอเชอร์ไปยัง Firebase');
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vouchers', id));
      if (selectedVoucher?.id === id) setSelectedVoucher(null);
      showNotification(`ลบวอเชอร์รหัส ${id} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการลบข้อมูลวอเชอร์จาก Firebase');
    }
  };

  // EXPENDITURE HANDLERS
  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdBy' | 'createdAt'>) => {
    if (!currentUser) return;
    try {
      const newId = `E-${Date.now().toString().slice(-4)}`;
      const newExp: Expense = {
        ...expenseData,
        id: newId,
        createdBy: currentUser.username,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'expenses', newId), newExp);
      showNotification(`บันทึกรายจ่ายหมวดหมู่ "${expenseData.category}" จำนวน ${expenseData.amount.toLocaleString()} บาทสำเร็จ!`);
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการเพิ่มรายการรายจ่ายไปยัง Firebase');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      showNotification('ลบรายการรายจ่ายสำเร็จ');
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการลบรายการรายจ่ายจาก Firebase');
    }
  };

  const handleAddCategory = async (newCat: string) => {
    if (options.expenseCategories.includes(newCat)) return;
    try {
      const updated = [...options.expenseCategories, newCat];
      await setDoc(doc(db, 'options', 'system'), {
        ...options,
        expenseCategories: updated
      });
      showNotification(`เพิ่มหมวดหมู่รายจ่าย "${newCat}" สำเร็จ`);
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่รายจ่ายไปยัง Firebase');
    }
  };

  // ADMIN - SETTINGS HANDLERS
  const handleAddUser = async (username: string, role: UserRole, password: string, permissions: UserPermissions) => {
    try {
      const newUser: UserAccount = {
        id: `u-${Date.now()}`,
        username,
        role,
        permissions,
        password,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', newUser.id), newUser);
      showNotification(`ลงทะเบียนผู้ใช้อัตโนมัติ: ${username} (ระดับ: ${role})`);
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้ใหม่ไปยัง Firebase');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      showNotification('ลบบัญชีผู้ใช้สำเร็จ');
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้จาก Firebase');
    }
  };

  const handleUpdateUser = async (updatedUser: UserAccount) => {
    try {
      await setDoc(doc(db, 'users', updatedUser.id), updatedUser);
      showNotification(`อัปเดตสิทธิ์ผู้ใช้ "${updatedUser.username}" สำเร็จ`);
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการอัปเดตบัญชีผู้ใช้ไปยัง Firebase');
    }
  };

  const handleUpdateOptions = async (newOptions: SystemOptions) => {
    try {
      await setDoc(doc(db, 'options', 'system'), newOptions);
      showNotification('อัปเดตตัวเลือกฟอร์มในระบบเรียบร้อย');
    } catch (err) {
      console.error(err);
      showNotification('เกิดข้อผิดพลาดในการอัปเดตตัวเลือกไปยัง Firebase');
    }
  };

  const triggerMockEmail = (v: Voucher) => {
    showNotification(`✉️ ทำการจัดส่งไฟล์วอเชอร์ไปที่อีเมลลูกค้า: ${v.customerEmail} เรียบร้อย!`);
  };

  const handleResetSystem = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่? ข้อมูลทั้งหมดในระบบคลาวด์ Firebase จะถูกเขียนทับด้วยข้อมูลดีฟอลต์')) {
      try {
        // Users
        const userSnaps = await getDocs(collection(db, 'users'));
        for (const d of userSnaps.docs) {
          await deleteDoc(doc(db, 'users', d.id));
        }
        for (const u of DEFAULT_USERS) {
          await setDoc(doc(db, 'users', u.id), u);
        }

        // Vouchers
        const voucherSnaps = await getDocs(collection(db, 'vouchers'));
        for (const d of voucherSnaps.docs) {
          await deleteDoc(doc(db, 'vouchers', d.id));
        }
        for (const v of DEFAULT_VOUCHERS) {
          await setDoc(doc(db, 'vouchers', v.id), v);
        }

        // Expenses
        const expenseSnaps = await getDocs(collection(db, 'expenses'));
        for (const d of expenseSnaps.docs) {
          await deleteDoc(doc(db, 'expenses', d.id));
        }
        for (const e of DEFAULT_EXPENSES) {
          await setDoc(doc(db, 'expenses', e.id), e);
        }

        // Options
        await setDoc(doc(db, 'options', 'system'), DEFAULT_OPTIONS);

        setCurrentUser(DEFAULT_USERS[0]); // Reset to admin log in
        setSelectedVoucher(null);
        setEditingVoucher(null);
        showNotification('รีเซ็ตระบบข้อมูลและบัญชีทั้งหมดบนคลาวด์ Firebase เรียบร้อยแล้ว!');
      } catch (err) {
        console.error(err);
        showNotification('เกิดข้อผิดพลาดในการรีเซ็ตระบบฐานข้อมูล Firebase');
      }
    }
  };

  const isSystemLoading = !usersLoaded || !vouchersLoaded || !expensesLoaded || !optionsLoaded;

  if (isSystemLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 via-emerald-400 to-sky-500 flex items-center justify-center p-4" id="firebase-loading">
        <div className="bg-white/25 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/40 text-center text-white space-y-4">
          <Compass className="w-12 h-12 mx-auto animate-spin" />
          <h2 className="text-xl font-bold font-display">กำลังดาวน์โหลดข้อมูลระบบจาก Firebase...</h2>
          <p className="text-xs text-white/90">กรุณารอสักครู่ ระบบกำลังเชื่อมต่อฐานข้อมูลคลาวด์</p>
        </div>
      </div>
    );
  }

  // If not logged in, force Login screen
  if (!currentUser) {
    return <LoginScreen users={users} onLoginSuccess={handleLogin} />;
  }

  // Permissions validation checkers
  const canAddStaff = currentUser.permissions.canAddStaff || currentUser.role === 'admin';
  const canManageOptions = currentUser.permissions.canManageOptions || currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-emerald-400 to-sky-500 flex flex-col font-sans text-slate-800" id="krabi-atv-root">
      
      {/* 1. TOP HEADER & NAVIGATION BAR (no-print) */}
      <header className="no-print bg-white/20 backdrop-blur-xl border-b border-white/30 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap gap-4 items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <CompassIcon className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black font-display tracking-tight text-white leading-tight">
                KRABI ATV ADVENTURE
              </h1>
              <span className="text-[9px] text-white/80 font-mono tracking-wider block">
                VOUCHER OPERATIONS SYSTEMS CO.
              </span>
            </div>
          </div>

          {/* User badge and Log out controls */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                คุณ: {currentUser.username}
              </div>
              <span className="text-[10px] text-white/90 uppercase tracking-widest bg-black/20 px-1.5 py-0.5 rounded font-semibold border border-white/20">
                สิทธิ์: {currentUser.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 bg-black/20 hover:bg-rose-600/40 text-white hover:text-white rounded-lg border border-white/20 transition-all cursor-pointer"
              title="ออกจากระบบ"
              id="header-logout-button"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB NAVIGATION CONTROL TABS (no-print) */}
      <nav className="no-print bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-[64px] sm:top-[68px] z-30 overflow-x-auto py-1.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 items-center">
          <button
            onClick={() => { setActiveTab('issue'); setEditingVoucher(null); setSelectedVoucher(null); }}
            className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap rounded-xl ${
              activeTab === 'issue'
                ? 'bg-white/35 text-white font-extrabold shadow-lg shadow-black/5 rounded-xl border border-white/25'
                : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            id="tab-issue-voucher"
          >
            <Plus className="w-4 h-4" />
            ออก Voucher
          </button>

          <button
            onClick={() => { setActiveTab('search'); setSelectedVoucher(null); }}
            className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap rounded-xl ${
              activeTab === 'search'
                ? 'bg-white/35 text-white font-extrabold shadow-lg shadow-black/5 rounded-xl border border-white/25'
                : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            id="tab-search-spreadsheet"
          >
            <Database className="w-4 h-4" />
            ค้นหา & จัดการ Voucher ในระบบ
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap rounded-xl ${
              activeTab === 'expenses'
                ? 'bg-white/35 text-white font-extrabold shadow-lg shadow-black/5 rounded-xl border border-white/25'
                : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            id="tab-expenses"
          >
            <TrendingUp className="w-4 h-4" />
            บันทึกรายจ่าย
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap rounded-xl ${
              activeTab === 'dashboard'
                ? 'bg-white/35 text-white font-extrabold shadow-lg shadow-black/5 rounded-xl border border-white/25'
                : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            id="tab-dashboard"
          >
            <BarChart2 className="w-4 h-4" />
            แดชบอร์ดสรุปรายรับ - รายจ่าย
          </button>

          {(canAddStaff || canManageOptions) && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap rounded-xl ${
                activeTab === 'admin'
                  ? 'bg-white/35 text-white font-extrabold shadow-lg shadow-black/5 rounded-xl border border-white/25'
                  : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'
              }`}
              id="tab-admin"
            >
              <Settings2 className="w-4 h-4" />
              จัดการตัวเลือกระบบ & พนักงาน
            </button>
          )}

          {/* Quick Demo reset button in header for safety checks */}
          <button
            onClick={handleResetSystem}
            className="px-3 py-1.5 text-[10px] text-white hover:text-rose-200 transition-all font-mono whitespace-nowrap ml-auto self-center bg-black/20 border border-white/20 rounded-lg hover:bg-black/30 cursor-pointer"
            title="ล้างข้อมูลเป็นค่าดีฟอลต์ทั้งหมด"
          >
            Reset DB
          </button>
        </div>
      </nav>

      {/* 3. MAIN APP LAYOUT CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        
        {/* Active Toast notifications overlay */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-20 right-4 z-50 bg-white/25 backdrop-blur-xl text-white border border-white/30 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 shadow-teal-950/10"
            >
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <p className="text-xs font-bold">{notification}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Voucher Modal (Active Voucher preview) */}
        {selectedVoucher && (
          <div 
            onClick={() => {
              setSelectedVoucher(null);
              setShouldAutoDownload(false);
            }}
            className="no-print bg-black/40 backdrop-blur-sm fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-white/50 max-w-3xl w-full shadow-teal-950/15 cursor-default"
            >
              <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">ดูวอเชอร์ลูกค้า / Customer Voucher Card</h4>
                  <p className="text-[11px] text-slate-500">รหัสยืนยันการจองสำรองที่นั่งในระบบ</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedVoucher(null);
                    setShouldAutoDownload(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                  id="btn-close-voucher-modal"
                >
                  ปิดหน้าต่าง (Close)
                </button>
              </div>

              {/* Print design */}
              <VoucherCard 
                voucher={selectedVoucher} 
                onSendEmail={triggerMockEmail} 
                onClose={() => {
                  setSelectedVoucher(null);
                  setShouldAutoDownload(false);
                }} 
                autoDownload={shouldAutoDownload}
              />
            </motion.div>
          </div>
        )}

        {/* Tab content routing switches */}
        <div className="space-y-6">
          {activeTab === 'issue' && (
            <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10">
              <VoucherForm
                options={options}
                currentUser={currentUser}
                onSubmit={handleVoucherSubmit}
                editingVoucher={editingVoucher}
                onCancel={editingVoucher ? () => setEditingVoucher(null) : undefined}
              />
            </div>
          )}

          {activeTab === 'search' && (
            <SpreadsheetView
              vouchers={vouchers}
              options={options}
              currentUser={currentUser}
              onEditVoucher={(v) => {
                setEditingVoucher(v);
                setActiveTab('issue');
              }}
              onDeleteVoucher={handleDeleteVoucher}
              onSelectVoucher={(v) => setSelectedVoucher(v)}
              onAddVoucherClick={() => {
                setEditingVoucher(null);
                setActiveTab('issue');
              }}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseTracker
              expenses={expenses}
              options={options}
              currentUser={currentUser}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onAddCategory={handleAddCategory}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              vouchers={vouchers}
              expenses={expenses}
              options={options}
            />
          )}

          {activeTab === 'admin' && (canAddStaff || canManageOptions) && (
            <AdminPanel
              users={users}
              options={options}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onUpdateOptions={handleUpdateOptions}
              onUpdateUser={handleUpdateUser}
            />
          )}
        </div>
      </main>

      {/* FOOTER (no-print) */}
      <footer className="no-print bg-white/20 backdrop-blur-md border-t border-white/20 py-4 text-center text-xs text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ระบบบริหารวอเชอร์จำหน่ายทัวร์ Krabi ATV Adventure & Copywriting Operator Workspace.</span>
          <span className="font-mono text-[10px] text-white/90">ระบบทำงานอย่างสมบูรณ์แบบบนคลาวด์ แบ็คอัพ Local Storage อัตโนมัติ</span>
        </div>
      </footer>
    </div>
  );
}
