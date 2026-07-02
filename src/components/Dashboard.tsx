/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Voucher, Expense, SystemOptions } from '../types';
import { Calendar, Search, TrendingUp, TrendingDown, DollarSign, Users, Award, ShieldCheck, Printer, Compass, FileText, BarChart, Truck, ChevronRight } from 'lucide-react';

interface DashboardProps {
  vouchers: Voucher[];
  expenses: Expense[];
  options: SystemOptions;
}

export default function Dashboard({ vouchers, expenses, options }: DashboardProps) {
  // Calendar Filter
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
  });

  // Advanced Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState('ALL');
  const [filterPickupCar, setFilterPickupCar] = useState('ALL');
  const [filterDropoffCar, setFilterDropoffCar] = useState('ALL');

  const reportRef = useRef<HTMLDivElement>(null);

  // Filtered Vouchers and Expenses
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchStart = startDate ? v.serviceDate >= startDate : true;
      const matchEnd = endDate ? v.serviceDate <= endDate : true;

      // Search terms: Customer Name, Voucher ID
      const qLower = searchQuery.toLowerCase();
      const matchQuery = !searchQuery ? true : (
        v.customerName.toLowerCase().includes(qLower) ||
        v.id.toLowerCase().includes(qLower)
      );

      const matchAgent = filterAgent === 'ALL' ? true : v.agentName === filterAgent;
      const matchPickup = filterPickupCar === 'ALL' ? true : v.pickupCar === filterPickupCar;
      const matchDropoff = filterDropoffCar === 'ALL' ? true : v.dropoffCar === filterDropoffCar;

      return matchStart && matchEnd && matchQuery && matchAgent && matchPickup && matchDropoff;
    });
  }, [vouchers, startDate, endDate, searchQuery, filterAgent, filterPickupCar, filterDropoffCar]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchStart = startDate ? e.date >= startDate : true;
      const matchEnd = endDate ? e.date <= endDate : true;
      return matchStart && matchEnd;
    });
  }, [expenses, startDate, endDate]);

  // Calculations for KPI Cards
  const stats = useMemo(() => {
    let salesTotal = 0;
    let driversCount = 0;
    let passengersCount = 0;
    let paidBookings = 0;
    let unpaidBookings = 0;
    let depositBookings = 0;
    let collectBookings = 0;

    filteredVouchers.forEach((v) => {
      salesTotal += v.totalPrice;
      driversCount += v.driverCount;
      passengersCount += v.passengerCount;
      if (v.paymentStatus === 'Paid') paidBookings++;
      else if (v.paymentStatus === 'Deposit') depositBookings++;
      else if (v.paymentStatus === 'Collect') collectBookings++;
      else unpaidBookings++;
    });

    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = salesTotal - expensesTotal;

    return {
      salesTotal,
      expensesTotal,
      netProfit,
      driversCount,
      passengersCount,
      paidBookings,
      depositBookings,
      collectBookings,
      unpaidBookings,
      totalBookings: filteredVouchers.length
    };
  }, [filteredVouchers, filteredExpenses]);

  // VEHICLE FREQUENCY SUMMARY (สรุป ยอดรวม จำนวนครั้ง รถรับ รถส่ง)
  const vehicleStats = useMemo(() => {
    const pickupCountMap: { [car: string]: number } = {};
    const dropoffCountMap: { [car: string]: number } = {};

    // Seed maps with existing options
    options.pickupCars.forEach((c) => { pickupCountMap[c] = 0; });
    options.dropoffCars.forEach((c) => { dropoffCountMap[c] = 0; });

    filteredVouchers.forEach((v) => {
      if (v.pickupCar) {
        pickupCountMap[v.pickupCar] = (pickupCountMap[v.pickupCar] || 0) + 1;
      }
      if (v.dropoffCar) {
        dropoffCountMap[v.dropoffCar] = (dropoffCountMap[v.dropoffCar] || 0) + 1;
      }
    });

    const pickupList = Object.entries(pickupCountMap)
      .map(([car, count]) => ({ car, count }))
      .sort((a, b) => b.count - a.count);

    const dropoffList = Object.entries(dropoffCountMap)
      .map(([car, count]) => ({ car, count }))
      .sort((a, b) => b.count - a.count);

    return { pickupList, dropoffList };
  }, [filteredVouchers, options]);

  const handlePrintPDF = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      
      {/* 1. Header and Date Filter Control Bar */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart className="w-5 h-5 text-emerald-600 animate-pulse" />
              กระดานวิเคราะห์ข้อมูลยอดขายและค่าใช้จ่าย / BI Dashboard
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ค้นหาข้อมูลสถิติ เจาะลึกจำนวนการวิ่งงานของรถสับเปลี่ยนรับ-ส่ง
            </p>
          </div>

          {/* Quick PDF Trigger */}
          <button
            onClick={handlePrintPDF}
            className="no-print inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow"
            id="btn-print-dashboard-pdf"
          >
            <Printer className="w-4 h-4" />
            พิมพ์สรุปรายงานเป็น PDF / Save PDF
          </button>
        </div>

        {/* Search Parameter Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">เริ่มวันที่ (Start Date)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs"
              id="dash-start-date"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">ถึงวันที่ (End Date)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs"
              id="dash-end-date"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">คำค้นหาหลัก (Search Keyword)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="รหัส, ชื่อลูกค้า..."
              className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs"
              id="dash-search-query"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">กรองตามเอเยนต์ (Agent)</label>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
              id="dash-filter-agent"
            >
              <option value="ALL">เอเยนต์ทั้งหมด / All</option>
              {options.agents.map((agent, idx) => (
                <option key={idx} value={agent}>{agent}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">กรองชื่อรถรับ</label>
            <select
              value={filterPickupCar}
              onChange={(e) => setFilterPickupCar(e.target.value)}
              className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs"
              id="dash-filter-pickup"
            >
              <option value="ALL">รถรับทั้งหมด / All</option>
              {options.pickupCars.map((car, idx) => (
                <option key={idx} value={car}>{car}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">กรองชื่อรถส่ง</label>
            <select
              value={filterDropoffCar}
              onChange={(e) => setFilterDropoffCar(e.target.value)}
              className="w-full px-2.5 py-1.2 bg-white border border-slate-300 rounded-lg text-xs"
              id="dash-filter-dropoff"
            >
              <option value="ALL">รถส่งทั้งหมด / All</option>
              {options.dropoffCars.map((car, idx) => (
                <option key={idx} value={car}>{car}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Area with explicit printable styles */}
      <div ref={reportRef} className="space-y-6" id="dashboard-printable-report">
        
        {/* Print-Only Custom Header (Shown on PDF export/print only) */}
        <div className="print-only hidden p-4 border-b-2 border-slate-900 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold font-display text-slate-900">รายงานสรุปผลประกอบการ KRABI ATV ADVENTURE</h1>
              <p className="text-xs text-slate-500">
                ข้อมูลสรุปประจำงวด: {startDate} ถึง {endDate}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">Krabi ATV Adventure Tour Operator</p>
              <p className="text-slate-500">อีเมลรายงาน: info@krabiatvadventure.com</p>
            </div>
          </div>
        </div>

        {/* 2. Key Performance Indicators grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white shadow-xl shadow-teal-900/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ยอดจองทั้งหมด (Bookings)</span>
              <span className="text-2xl font-black text-slate-850 font-mono">{stats.totalBookings} รายการ</span>
              <span className="text-[10px] text-slate-500 block">
                {stats.paidBookings} จ่ายแล้ว | {stats.depositBookings} มัดจำ | {stats.collectBookings} เก็บหน้างาน
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white shadow-xl shadow-teal-900/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">รายรับรวม (Gross Revenue)</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">{formatCurrency(stats.salesTotal)}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">ขับ {stats.driversCount} คน / ซ้อน {stats.passengersCount} คน</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white shadow-xl shadow-teal-900/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">รายจ่ายรวม (Expenses)</span>
              <span className="text-2xl font-black text-rose-500 font-mono">{formatCurrency(stats.expensesTotal)}</span>
              <span className="text-[10px] text-rose-600 block">อ้างอิงงบรายจ่ายตามวันที่เลือก</span>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white shadow-xl shadow-teal-900/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">กำไรสุทธิ (Net Profit)</span>
              <span className={`text-2xl font-black font-mono ${stats.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatCurrency(stats.netProfit)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                อัตรากำไร: {stats.salesTotal > 0 ? ((stats.netProfit / stats.salesTotal) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className={`p-3 rounded-xl ${stats.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 3. Vehicles Frequency Summary (ชื่อรถรับ ชื่อรถส่ง ให้สรุป รวม จำนวน ชื่อรถรับ ชื่อรถส่ง กี่ครั้ง) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Pickup Vehicle Frequency table */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4.5 h-4.5 text-emerald-600" />
                สรุปความถี่รถรับส่งของ "รถรับ" / Pickup Car Frequencies
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                สรุปจำนวนครั้งที่ใช้จัดส่งคนขับรถรับลูกค้าในงวดที่เลือก
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-150">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="p-2 w-12 text-center bg-slate-200/50">ลำดับ</th>
                    <th className="p-2 border-r border-slate-200">ชื่อรถรับ (Pickup Car Name)</th>
                    <th className="p-2 text-center w-24">ความถี่ (ครั้ง)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {vehicleStats.pickupList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center p-4 text-slate-400">ไม่มีข้อมูลชื่อรถรับในฐานข้อมูล</td>
                    </tr>
                  ) : (
                    vehicleStats.pickupList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center bg-slate-50 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-850 border-r border-slate-200">{item.car}</td>
                        <td className="p-2 text-center font-mono font-black text-emerald-700 text-sm bg-emerald-50/20">{item.count} ครั้ง</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dropoff Vehicle Frequency table */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4.5 h-4.5 text-emerald-600" />
                สรุปความถี่รถรับส่งของ "รถส่ง" / Dropoff Car Frequencies
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                สรุปจำนวนครั้งที่ใช้จัดส่งคนขับรถส่งลูกค้ากลับในงวดที่เลือก
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-150">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="p-2 w-12 text-center bg-slate-200/50">ลำดับ</th>
                    <th className="p-2 border-r border-slate-200">ชื่อรถส่ง (Dropoff Car Name)</th>
                    <th className="p-2 text-center w-24">ความถี่ (ครั้ง)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {vehicleStats.dropoffList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center p-4 text-slate-400">ไม่มีข้อมูลชื่อรถส่งในฐานข้อมูล</td>
                    </tr>
                  ) : (
                    vehicleStats.dropoffList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center bg-slate-50 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-850 border-r border-slate-200">{item.car}</td>
                        <td className="p-2 text-center font-mono font-black text-emerald-700 text-sm bg-emerald-50/20">{item.count} ครั้ง</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Voucher & Sales records listing in selected range */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-emerald-600" />
              รายงานทะเบียนรายรับวอเชอร์ / Vouchers Revenue Statement
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              รายการขายวอเชอร์ทั้งหมดตามเงื่อนไขตัวกรองในงวดปัจจุบัน
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="p-2 w-8 text-center bg-slate-200/50">#</th>
                  <th className="p-2 border-r border-slate-200">รหัสวอเชอร์ / ID</th>
                  <th className="p-2 border-r border-slate-200">วันที่บริการ</th>
                  <th className="p-2 border-r border-slate-200">ชื่อลูกค้า / Customer</th>
                  <th className="p-2 border-r border-slate-200">ทัวร์ / Program</th>
                  <th className="p-2 border-r border-slate-200 text-center">ขับ / ซ้อน</th>
                  <th className="p-2 border-r border-slate-200">เอเยนต์</th>
                  <th className="p-2 border-r border-slate-200">รถรับ / รถส่ง</th>
                  <th className="p-2 text-right border-r border-slate-200">ยอดเงินรวม</th>
                  <th className="p-2 text-center">สถานะจ่ายเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400">ไม่พบรายการสำรองวอเชอร์จำหน่ายในหมวดหมู่นี้</td>
                  </tr>
                ) : (
                  filteredVouchers.map((v, idx) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center bg-slate-50 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-200">{v.id}</td>
                      <td className="p-2 font-mono border-r border-slate-200">{v.serviceDate}</td>
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-200">{v.customerName}</td>
                      <td className="p-2 font-medium text-slate-700 border-r border-slate-200 max-w-[150px] truncate" title={v.tourProgram}>
                        {v.tourProgram}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-500 border-r border-slate-200">{v.driverCount} / {v.passengerCount}</td>
                      <td className="p-2 text-slate-600 border-r border-slate-200">{v.agentName}</td>
                      <td className="p-2 text-slate-500 border-r border-slate-200 max-w-[160px] truncate">
                        <span className="text-xs text-slate-700">รับ: {v.pickupCar}</span> <br/>
                        <span className="text-[10px] text-slate-400">ส่ง: {v.dropoffCar}</span>
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                        {v.totalPrice.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          v.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.paymentStatus === 'Deposit'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {v.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Expense logs registry in selected range */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4.5 h-4.5 text-rose-500" />
              รายงานทะเบียนงบรายจ่าย / Expenditures Statement
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              รายการใช้จ่ายของบริษัทที่บันทึกตามช่วงเวลาปัจจุบัน
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="p-2 w-8 text-center bg-slate-200/50">#</th>
                  <th className="p-2 border-r border-slate-200">วันที่บันทึก / Date</th>
                  <th className="p-2 border-r border-slate-200">หมวดหมู่ / Category</th>
                  <th className="p-2 border-r border-slate-200">รายละเอียดจ่ายเงิน / Details</th>
                  <th className="p-2 text-right border-r border-slate-200">ยอดจ่ายเงิน (THB)</th>
                  <th className="p-2 text-center">ผู้รายงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">ไม่พบรายการรายจ่ายที่สอดคล้อง</td>
                  </tr>
                ) : (
                  filteredExpenses.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center bg-slate-50 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-mono border-r border-slate-200">{e.date}</td>
                      <td className="p-2 font-semibold text-slate-800 border-r border-slate-200">{e.category}</td>
                      <td className="p-2 text-slate-500 border-r border-slate-200 max-w-[200px] truncate">{e.description || '-'}</td>
                      <td className="p-2 text-right font-mono font-bold text-rose-600 border-r border-slate-200">
                        {e.amount.toLocaleString()}
                      </td>
                      <td className="p-2 text-center text-[10px] font-semibold text-slate-500">{e.createdBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
