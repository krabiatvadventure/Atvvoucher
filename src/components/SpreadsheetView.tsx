/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Voucher, UserAccount, SystemOptions } from '../types';
import { Search, Calendar, ChevronDown, Download, FileSpreadsheet, Eye, Edit2, Trash2, ShieldAlert, CheckCircle, AlertTriangle, Compass, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';
import { cleanClonedDocForHtml2Canvas, cleanOriginalStylesAndRun } from '../lib/html2canvasHelper';
import VoucherCard from './VoucherCard';

interface SpreadsheetViewProps {
  vouchers: Voucher[];
  options: SystemOptions;
  currentUser: UserAccount;
  onEditVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (id: string) => void;
  onSelectVoucher: (voucher: Voucher) => void;
  onAddVoucherClick?: () => void;
}

export default function SpreadsheetView({
  vouchers,
  options,
  currentUser,
  onEditVoucher,
  onDeleteVoucher,
  onSelectVoucher,
  onAddVoucherClick
}: SpreadsheetViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [startDate, setStartDate] = useState(() => {
    // Default to start of current month
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    // Default to end of current month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
  });

  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const summaryTableRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const [downloadingVoucher, setDownloadingVoucher] = useState<Voucher | null>(null);
  const [pngDownloadingId, setPngDownloadingId] = useState<string | null>(null);
  const downloadContainerRef = useRef<HTMLDivElement>(null);

  const handleDownloadRowPNG = async (voucher: Voucher) => {
    if (pngDownloadingId) return;
    setPngDownloadingId(voucher.id);
    setDownloadingVoucher(voucher);

    try {
      // Small delay to let the offscreen VoucherCard mount and render
      await new Promise((resolve) => setTimeout(resolve, 350));
      const element = document.getElementById(`voucher-document-${voucher.id}`);
      if (element) {
        const canvas = await cleanOriginalStylesAndRun(() => html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            cleanClonedDocForHtml2Canvas(clonedDoc);
          }
        }));
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Voucher_${voucher.id}_${voucher.customerName.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        console.error('Voucher DOM element not found');
      }
    } catch (err) {
      console.error('Failed to generate PNG:', err);
    } finally {
      setDownloadingVoucher(null);
      setPngDownloadingId(null);
    }
  };

  // Filtered Vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      // 1. Date filter
      const serviceDate = v.serviceDate;
      const matchesStart = startDate ? serviceDate >= startDate : true;
      const matchesEnd = endDate ? serviceDate <= endDate : true;

      // 2. Text search: Customer name, Voucher ID
      const searchLower = searchTerm.toLowerCase();
      const matchesText = !searchTerm ? true : (
        v.customerName.toLowerCase().includes(searchLower) ||
        v.id.toLowerCase().includes(searchLower)
      );

      // 3. Agent filter
      const matchesAgent = agentFilter === 'ALL' ? true : v.agentName === agentFilter;

      // 4. Payment filter
      const matchesPayment = paymentFilter === 'ALL' ? true : v.paymentStatus === paymentFilter;

      return matchesStart && matchesEnd && matchesText && matchesAgent && matchesPayment;
    });
  }, [vouchers, searchTerm, startDate, endDate, agentFilter, paymentFilter]);

  // Calculations for Summary
  const totals = useMemo(() => {
    let paidAmt = 0;
    let unpaidAmt = 0;
    let depositAmt = 0;
    let totalDriver = 0;
    let totalPassenger = 0;

    filteredVouchers.forEach((v) => {
      totalDriver += v.driverCount;
      totalPassenger += v.passengerCount;

      if (v.paymentStatus === 'Paid') {
        paidAmt += v.totalPrice;
      } else if (v.paymentStatus === 'Deposit') {
        depositAmt += v.totalPrice; // Full value represented as booking price
      } else if (v.paymentStatus === 'Collect') {
        paidAmt += (v.collectedAmount || 0);
        unpaidAmt += (v.totalPrice - (v.collectedAmount || 0));
      } else {
        unpaidAmt += v.totalPrice;
      }
    });

    const overallTotal = paidAmt + depositAmt + unpaidAmt;

    return {
      count: filteredVouchers.length,
      paid: paidAmt,
      deposit: depositAmt,
      unpaid: unpaidAmt,
      overall: overallTotal,
      drivers: totalDriver,
      passengers: totalPassenger
    };
  }, [filteredVouchers]);

  const handleExportSummaryPNG = async () => {
    if (!summaryTableRef.current) return;
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await cleanOriginalStylesAndRun(() => html2canvas(summaryTableRef.current!, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          cleanClonedDocForHtml2Canvas(clonedDoc);
        }
      }));
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Voucher_Summary_${startDate}_to_${endDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export summary PNG:', err);
    } finally {
      setExporting(false);
    }
  };

  const canModify = currentUser.permissions.canEditVoucher || currentUser.role === 'admin';
  const canDelete = currentUser.permissions.canDeleteVoucher || currentUser.role === 'admin';

  return (
    <div className="space-y-6" id="spreadsheet-view-container">
      {/* Search and Date filters Box */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
            ตัวกรองและปฏิทินค้นหา (Search Filters & Calendars)
          </h3>
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
            พบ {filteredVouchers.length} วอเชอร์
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Custom Date Range */}
          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> ตั้งแต่วันที่ (Start Date)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                id="search-start-date"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> ถึงวันที่ (End Date)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                id="search-end-date"
              />
            </div>
          </div>

          {/* Search Term */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              ค้นหาชื่อ/รหัสวอเชอร์ (Search Info)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ชื่อลูกค้า, รหัส..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                id="search-text-field"
              />
            </div>
          </div>

          {/* Agent Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              เลือกตามเอเยนต์ (Select Agent)
            </label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              id="search-agent-filter"
            >
              <option value="ALL">เอเยนต์ทั้งหมด / All Agents</option>
              {options.agents.map((agent, idx) => (
                <option key={idx} value={agent}>{agent}</option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              สถานะการชำระเงิน (Payment)
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              id="search-payment-filter"
            >
              <option value="ALL">ทั้งหมด / All Statuses</option>
              <option value="Paid">ชำระเงินแล้ว / Paid 🟢</option>
              <option value="Deposit">มัดจำบางส่วน / Deposit 🟡</option>
              <option value="Collect">เก็บเงินจากลูกค้า / Collect Cash 🔵</option>
              <option value="Unpaid">ยังไม่ชำระ / Unpaid 🔴</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Area targeting for PNG output */}
      <div ref={summaryTableRef} className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-black text-slate-950 font-display flex items-center gap-1.5">
              <Compass className="w-4.5 h-4.5 text-emerald-600" />
              ตารางสรุปวอเชอร์ & รายได้ตามช่วงเวลา / Voucher & Income Range Summary
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              สรุปสถิติตัวเลขตามวันที่เลือก: <span className="font-semibold text-slate-700">{startDate || 'ทั้งหมด'}</span> ถึง <span className="font-semibold text-slate-700">{endDate || 'ทั้งหมด'}</span>
            </p>
          </div>
          <button
            onClick={handleExportSummaryPNG}
            disabled={exporting}
            className="no-print inline-flex self-start sm:self-center items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow"
            id="btn-export-summary-png"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'กำลังบันทึก...' : 'บันทึกตารางสรุปเป็น PNG'}
          </button>
        </div>

        {/* Dynamic Grid Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <span className="text-[10px] text-slate-500 block font-medium">จำนวนวอเชอร์ (Bookings)</span>
            <span className="text-lg font-black text-emerald-800 font-mono">{totals.count} ใบ</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
            <span className="text-[10px] text-slate-500 block font-medium">รวมคนขับ / ซ้อน (Pax)</span>
            <span className="text-sm font-bold text-slate-700 font-mono">
              ขับ {totals.drivers} / ซ้อน {totals.passengers}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
            <span className="text-[10px] text-emerald-600 block font-bold">รับชำระแล้ว (Paid Amount)</span>
            <span className="text-base font-black text-emerald-700 font-mono">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(totals.paid)}
            </span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <span className="text-[10px] text-amber-700 block font-bold">มัดจำบางส่วน (Deposit)</span>
            <span className="text-base font-black text-amber-700 font-mono">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(totals.deposit)}
            </span>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
            <span className="text-[10px] text-rose-700 block font-bold">ค้างชำระ (Unpaid Amount)</span>
            <span className="text-base font-black text-rose-700 font-mono">
              {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(totals.unpaid)}
            </span>
          </div>
        </div>

        {/* Small range summary table inside the PNG target */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs text-left text-slate-700 font-sans">
            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-2 border-r border-slate-200">สถานะชำระเงิน / Payment Status</th>
                <th className="p-2 text-center border-r border-slate-200">จำนวนวอเชอร์</th>
                <th className="p-2 text-right">ยอดเงินรวมมูลค่ากิจกรรม (Value)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2 font-medium border-r border-slate-200 text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> ชำระครบถ้วน (Paid)
                </td>
                <td className="p-2 text-center border-r border-slate-200 font-mono">
                  {filteredVouchers.filter(x => x.paymentStatus === 'Paid').length}
                </td>
                <td className="p-2 text-right font-mono text-slate-900 font-semibold">
                  {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totals.paid)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium border-r border-slate-200 text-amber-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> มัดจำ (Deposit Paid)
                </td>
                <td className="p-2 text-center border-r border-slate-200 font-mono">
                  {filteredVouchers.filter(x => x.paymentStatus === 'Deposit').length}
                </td>
                <td className="p-2 text-right font-mono text-slate-900 font-semibold">
                  {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totals.deposit)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium border-r border-slate-200 text-indigo-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> เก็บเงินจากลูกค้า (Collect Cash)
                </td>
                <td className="p-2 text-center border-r border-slate-200 font-mono">
                  {filteredVouchers.filter(x => x.paymentStatus === 'Collect').length}
                </td>
                <td className="p-2 text-right font-mono text-slate-900 font-semibold">
                  {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
                    filteredVouchers.filter(x => x.paymentStatus === 'Collect').reduce((sum, x) => sum + x.totalPrice, 0)
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium border-r border-slate-200 text-rose-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> ค้างชำระ (Unpaid)
                </td>
                <td className="p-2 text-center border-r border-slate-200 font-mono">
                  {filteredVouchers.filter(x => x.paymentStatus === 'Unpaid').length}
                </td>
                <td className="p-2 text-right font-mono text-slate-900 font-semibold">
                  {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totals.unpaid)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold border-t border-slate-300">
                <td className="p-2 border-r border-slate-200 text-slate-900">รวมทั้งหมด (Grand Total)</td>
                <td className="p-2 text-center border-r border-slate-200 font-mono">{totals.count}</td>
                <td className="p-2 text-right font-mono text-emerald-800 text-sm">
                  {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totals.overall)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Sheets Inspired Spreadsheet View */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-white shadow-2xl shadow-teal-900/10 overflow-hidden">
        {/* Spreadsheet Header bar */}
        <div className="bg-white/45 border-b border-white/20 px-4 py-2.5 flex justify-between items-center text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded font-bold uppercase tracking-wider text-[10px]">
              Sheets View
            </span>
            <span className="font-semibold text-slate-700">KRABI_ATV_VOUCHERS.xlsx</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden md:inline">
              * คลิกที่ปุ่มเพื่อเรียกดูแก้ไข และพิมพ์วอเชอร์ลูกค้า
            </span>
            {onAddVoucherClick && (
              <button
                onClick={onAddVoucherClick}
                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all shadow cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                id="sheets-header-add-voucher-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                ออกวอเชอร์ใหม่ (Add Voucher)
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Table Sheet */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead className="bg-slate-100 text-slate-600 select-none">
              <tr className="divide-x divide-slate-200 border-b border-slate-200">
                <th className="p-2 w-8 text-center bg-slate-200/50">#</th>
                <th className="p-2">รหัสวอเชอร์ / ID</th>
                <th className="p-2">วันที่ใช้บริการ</th>
                <th className="p-2">เวลารับ</th>
                <th className="p-2">ชื่อลูกค้า / Customer</th>
                <th className="p-2">โปรแกรมทัวร์ / Tour</th>
                <th className="p-2">เอเยนต์ / Agent</th>
                <th className="p-2">ขับ/ซ้อน</th>
                <th className="p-2 text-right">ยอดเงินรวม</th>
                <th className="p-2 text-center">สถานะ</th>
                <th className="p-2">รถรับ</th>
                <th className="p-2">รถส่ง</th>
                <th className="p-2">จุดรับ</th>
                <th className="p-2 text-center no-print min-w-[240px]">เครื่องมือ / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center p-8 text-slate-400 font-medium">
                    ไม่พบข้อมูลวอเชอร์ที่ระบุในเวลานี้ (No vouchers found matching selection)
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v, index) => (
                  <tr 
                    key={v.id} 
                    className="divide-x divide-slate-150 hover:bg-slate-50/80 transition-all font-sans text-slate-700 border-b border-slate-200 align-middle"
                  >
                    <td className="p-2 text-center bg-slate-50 font-mono font-medium text-slate-400">
                      {index + 1}
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-900 bg-slate-50/50">
                      <div>{v.id}</div>
                      {v.externalVoucherNo && (
                        <div className="text-[9px] text-indigo-600 font-semibold mt-0.5" title="หมายเลข Voucher นอก">
                          Ext: {v.externalVoucherNo}
                        </div>
                      )}
                    </td>
                    <td className="p-2 font-mono whitespace-nowrap">
                      {v.serviceDate}
                    </td>
                    <td className="p-2 font-mono text-center text-emerald-700 font-bold">
                      {v.pickupTime}
                    </td>
                    <td className="p-2 font-semibold text-slate-850">
                      {v.customerName}
                    </td>
                    <td className="p-2 font-medium text-slate-800 max-w-[180px] truncate" title={v.tourProgram}>
                      {v.tourProgram}
                    </td>
                    <td className="p-2 text-slate-600 font-medium">
                      {v.agentName}
                    </td>
                    <td className="p-2 font-mono text-center text-slate-500">
                      {v.driverCount} / {v.passengerCount}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-800">
                      {v.totalPrice.toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.paymentStatus === 'Deposit'
                          ? 'bg-amber-100 text-amber-800'
                          : v.paymentStatus === 'Collect'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {v.paymentStatus === 'Collect' ? 'Collect 🔵' : v.paymentStatus}
                      </span>
                    </td>
                    {/* Vehicles are included in spreadsheet view but hidden in customer voucher layout */}
                    <td className="p-2 text-slate-500 font-medium max-w-[120px] truncate" title={v.pickupCar}>
                      {v.pickupCar}
                    </td>
                    <td className="p-2 text-slate-500 font-medium max-w-[120px] truncate" title={v.dropoffCar}>
                      {v.dropoffCar}
                    </td>
                    <td className="p-2 text-slate-500 max-w-[150px] truncate" title={v.pickupPoint}>
                      {v.pickupPoint}
                    </td>
                    <td className="p-2 text-center no-print whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectVoucher(v)}
                          title="ดูและพิมพ์วอเชอร์"
                          className="px-2 py-1 text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Eye className="w-3 h-3" />
                          ดู
                        </button>

                        <button
                          onClick={() => handleDownloadRowPNG(v)}
                          disabled={pngDownloadingId !== null}
                          title={pngDownloadingId === v.id ? "กำลังบันทึกรูปภาพ..." : "บันทึกรูปภาพวอเชอร์ (Save PNG Image)"}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 border shadow-sm cursor-pointer ${
                            pngDownloadingId === v.id
                              ? 'text-emerald-700 bg-emerald-100 border-emerald-300 animate-pulse'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <Download className="w-3 h-3" />
                          รูป
                        </button>

                        <button
                          onClick={() => {
                            if (canModify) {
                              onEditVoucher(v);
                            } else {
                              alert('คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลวอเชอร์ (You do not have permission to edit vouchers)');
                            }
                          }}
                          disabled={!canModify}
                          title={canModify ? "แก้ไขวอเชอร์" : "ไม่มีสิทธิ์แก้ไข"}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border shadow-sm transition-all flex items-center gap-1 ${
                            canModify 
                              ? 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer' 
                              : 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <Edit2 className="w-3 h-3" />
                          แก้ไข
                        </button>

                        <button
                          onClick={() => {
                            if (canDelete) {
                              if (window.confirm(`ยืนยันการลบวอเชอร์ ${v.id} ของคุณ ${v.customerName}?`)) {
                                onDeleteVoucher(v.id);
                              }
                            } else {
                              alert('คุณไม่มีสิทธิ์ในการลบข้อมูลวอเชอร์ (You do not have permission to delete vouchers)');
                            }
                          }}
                          disabled={!canDelete}
                          title={canDelete ? "ลบวอเชอร์" : "ไม่มีสิทธิ์ลบ"}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border shadow-sm transition-all flex items-center gap-1 ${
                            canDelete 
                              ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 cursor-pointer' 
                              : 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden container for offscreen PNG generation */}
      {downloadingVoucher && (
        <div 
          ref={downloadContainerRef}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '700px' }}
        >
          <VoucherCard voucher={downloadingVoucher} />
        </div>
      )}
    </div>
  );
}
