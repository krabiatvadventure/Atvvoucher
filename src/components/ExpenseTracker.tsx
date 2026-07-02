/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Expense, SystemOptions, UserAccount } from '../types';
import { Plus, Trash2, Calendar, FileText, IndianRupee, CreditCard, Tag, Download, Sparkles, Filter, Compass, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { cleanClonedDocForHtml2Canvas, cleanOriginalStylesAndRun } from '../lib/html2canvasHelper';

interface ExpenseTrackerProps {
  expenses: Expense[];
  options: SystemOptions;
  currentUser: UserAccount;
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'createdBy' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
  onAddCategory?: (category: string) => void;
}

export default function ExpenseTracker({
  expenses,
  options,
  currentUser,
  onAddExpense,
  onDeleteExpense,
  onAddCategory
}: ExpenseTrackerProps) {
  // Input Form States
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState(options.expenseCategories[0] || '');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDesc, setExpenseDesc] = useState('');
  
  // Custom category addition modal state
  const [newCatName, setNewCatName] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
  });
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const expenseTableRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchStart = startDate ? e.date >= startDate : true;
      const matchEnd = endDate ? e.date <= endDate : true;
      const matchCategory = categoryFilter === 'ALL' ? true : e.category === categoryFilter;
      return matchStart && matchEnd && matchCategory;
    });
  }, [expenses, startDate, endDate, categoryFilter]);

  // Aggregate Category breakdown for selected range
  const categorySummary = useMemo(() => {
    const map: { [cat: string]: number } = {};
    // Pre-populate with all known categories to ensure they show up in summary if needed
    options.expenseCategories.forEach((cat) => {
      map[cat] = 0;
    });

    let total = 0;
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
      total += e.amount;
    });

    return {
      total,
      breakdown: Object.entries(map)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
    };
  }, [filteredExpenses, options]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || expenseAmount <= 0) {
      setErrorMsg('กรุณากรอกจำนวนเงินรายจ่ายที่ถูกต้อง (Please enter a valid amount)');
      return;
    }
    if (!expenseCategory) {
      setErrorMsg('กรุณาเลือกหรือเพิ่มหมวดหมู่รายจ่ายก่อน (Please select or add a category)');
      return;
    }

    onAddExpense({
      date: expenseDate,
      category: expenseCategory,
      amount: Number(expenseAmount),
      description: expenseDesc.trim()
    });

    // Reset Form
    setExpenseAmount('');
    setExpenseDesc('');
    setErrorMsg('');
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim() && onAddCategory) {
      onAddCategory(newCatName.trim());
      setExpenseCategory(newCatName.trim());
      setNewCatName('');
      setShowCatModal(false);
    }
  };

  const handleExportPNG = async () => {
    if (!expenseTableRef.current) return;
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await cleanOriginalStylesAndRun(() => html2canvas(expenseTableRef.current!, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          cleanClonedDocForHtml2Canvas(clonedDoc);
        }
      }));
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Expense_Summary_${startDate}_to_${endDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setExporting(false);
    }
  };

  const canDeleteExpense = currentUser.permissions.canDeleteVoucher || currentUser.role === 'admin';
  const canManageCategory = currentUser.permissions.canManageOptions || currentUser.role === 'admin';

  return (
    <div className="space-y-6" id="expense-tracker-tab">
      
      {/* 2 Column Layout: Form & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Add Expense Form */}
        <div className="lg:col-span-1 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              เพิ่มรายการรายจ่าย / Record Expenditure
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              บันทึกต้นทุนเชื้อเพลิง ซ่อมบำรุง หรือค่าจ้างรายวัน
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันที่จ่าย / Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-sans"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  หมวดหมู่ / Category
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (canManageCategory) {
                      setShowCatModal(true);
                    } else {
                      alert('คุณไม่มีสิทธิ์แก้ไขตัวเลือกระบบ (You do not have permission to manage categories)');
                    }
                  }}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold"
                  id="btn-add-category-dialog"
                >
                  + เพิ่มหมวดหมู่ใหม่
                </button>
              </div>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-medium"
                required
              >
                {options.expenseCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนเงิน (บาท) / Amount (THB)
              </label>
              <input
                type="number"
                min="1"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="เช่น 1500"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รายละเอียดเพิ่มเติม / Description
              </label>
              <textarea
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="เช่น เติมน้ำมัน ATV 4 คัน, จ้างคนขับเรือนำเที่ยว..."
                rows={2}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-600">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1"
              id="btn-submit-expense"
            >
              <Plus className="w-4 h-4" />
              บันทึกรายจ่าย
            </button>
          </form>
        </div>

        {/* Right Col: Filters and Summary Display */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Ranges filters */}
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">เริ่มวันที่</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">ถึงวันที่</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">เลือกหมวดหมู่สรุป</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="ALL">ทั้งหมด / All Categories</option>
                {options.expenseCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Aggregate report container to export as PNG */}
          <div ref={expenseTableRef} className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-950 font-display flex items-center gap-1.5">
                  <Compass className="w-4.5 h-4.5 text-emerald-600" />
                  สรุปผลวิเคราะห์งบรายจ่าย / Expense Summary Table
                </h4>
                <p className="text-[11px] text-slate-500">
                  ระยะเวลา: <span className="font-semibold text-slate-700">{startDate || 'ทั้งหมด'}</span> ถึง <span className="font-semibold text-slate-700">{endDate || 'ทั้งหมด'}</span>
                </p>
              </div>
              <button
                onClick={handleExportPNG}
                disabled={exporting}
                className="no-print inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow"
                id="btn-export-expenses-png"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? 'กำลังบันทึก...' : 'บันทึกตารางรายจ่ายเป็น PNG'}
              </button>
            </div>

            {/* Total expense box */}
            <div className="p-4 bg-rose-50 border border-rose-100/80 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-rose-800 font-bold block">ยอดจ่ายรวมในระบบ (Total Expenses)</span>
                <span className="text-[11px] text-slate-500">รวมจากรายการที่ผ่านการตรวจสอบตัวกรองแล้ว</span>
              </div>
              <span className="text-2xl font-black text-rose-600 font-mono">
                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(categorySummary.total)}
              </span>
            </div>

            {/* Categorized Breakdown list */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                สัดส่วนการใช้จ่ายแบ่งตามหมวดหมู่ (Category Breakdown)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categorySummary.breakdown.map((item, idx) => {
                  const percent = categorySummary.total > 0 ? (item.amount / categorySummary.total) * 100 : 0;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-800">{item.category}</span>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(item.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 self-end">{percent.toFixed(1)}% ของรายจ่ายทั้งหมด</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed logs table */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                บันทึกประวัติการใช้จ่ายรายรายการ (Expenditure History Logs)
              </h5>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="p-2 w-8 text-center bg-slate-200/50">#</th>
                      <th className="p-2 border-r border-slate-200">วันที่ / Date</th>
                      <th className="p-2 border-r border-slate-200">หมวดหมู่ / Category</th>
                      <th className="p-2 border-r border-slate-200">รายละเอียด</th>
                      <th className="p-2 text-right border-r border-slate-200">ยอดเงิน</th>
                      <th className="p-2 text-center">ผู้บันทึก</th>
                      <th className="p-2 text-center no-print w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-6 text-slate-400 font-medium">
                          ไม่พบประวัติการรายจ่ายในช่วงเวลานี้ (No expenses found)
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp, idx) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50 align-middle">
                          <td className="p-2 text-center bg-slate-50 text-slate-400 font-mono font-bold">{idx + 1}</td>
                          <td className="p-2 font-mono whitespace-nowrap border-r border-slate-200">{exp.date}</td>
                          <td className="p-2 font-semibold text-slate-800 border-r border-slate-200">{exp.category}</td>
                          <td className="p-2 text-slate-500 border-r border-slate-200 max-w-[150px] truncate" title={exp.description}>
                            {exp.description || '-'}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-rose-600 border-r border-slate-200">
                            {exp.amount.toLocaleString()}
                          </td>
                          <td className="p-2 text-center text-[10px] font-semibold text-slate-500">{exp.createdBy}</td>
                          <td className="p-2 text-center no-print">
                            <button
                              onClick={() => {
                                if (canDeleteExpense) {
                                  if (window.confirm(`คุณแน่ใจว่าต้องการลบรายการจ่ายนี้จำนวน ${exp.amount.toLocaleString()} บาท?`)) {
                                    onDeleteExpense(exp.id);
                                  }
                                } else {
                                  alert('คุณไม่มีสิทธิ์ในการลบรายการจ่าย (You do not have permission to delete expenses)');
                                }
                              }}
                              disabled={!canDeleteExpense}
                              title={canDeleteExpense ? "ลบรายการจ่าย" : "ไม่มีสิทธิ์"}
                              className={`p-1 rounded ${
                                canDeleteExpense 
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                  : 'text-slate-200 cursor-not-allowed'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom Category modal overlay */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 max-w-sm w-full">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Compass className="w-5 h-5 text-emerald-600" />
              เพิ่มหมวดหมู่รายจ่ายใหม่ / Add Category
            </h4>
            <form onSubmit={handleAddNewCategory} className="space-y-3">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="เช่น ค่าแรงไกด์, ซื้ออุปกรณ์เสริม..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                required
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  ยกเลิก / Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  บันทึก / Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
