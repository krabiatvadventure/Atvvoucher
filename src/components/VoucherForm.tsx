/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Voucher, SystemOptions, UserAccount } from '../types';
import { Plus, Save, Calendar, Clock, User, Phone, Mail, MapPin, Check, Compass, AlertCircle, RefreshCw } from 'lucide-react';

interface VoucherFormProps {
  options: SystemOptions;
  currentUser: UserAccount;
  onSubmit: (voucherData: Omit<Voucher, 'id' | 'createdAt' | 'createdBy'>) => void;
  editingVoucher?: Voucher | null;
  onCancel?: () => void;
}

export default function VoucherForm({ options, currentUser, onSubmit, editingVoucher, onCancel }: VoucherFormProps) {
  // Input fields state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [tourProgram, setTourProgram] = useState('');
  const [agentName, setAgentName] = useState('');
  const [pickupCar, setPickupCar] = useState('');
  const [dropoffCar, setDropoffCar] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [dropoffPoint, setDropoffPoint] = useState('');
  const [driverCount, setDriverCount] = useState<number | ''>(1);
  const [driverPrice, setDriverPrice] = useState<number | ''>(0); // Default price to 0 as requested
  const [passengerCount, setPassengerCount] = useState<number | ''>(0);
  const [passengerPrice, setPassengerPrice] = useState<number | ''>(0); // Default price to 0 as requested
  const [paymentStatus, setPaymentStatus] = useState<Voucher['paymentStatus']>('Unpaid');
  const [collectedAmount, setCollectedAmount] = useState<number | ''>(0); // Collect amount input
  const [externalVoucherNo, setExternalVoucherNo] = useState(''); // External Voucher Number input
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [language, setLanguage] = useState<Voucher['language']>('TH');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load editing state
  useEffect(() => {
    if (editingVoucher) {
      setCustomerName(editingVoucher.customerName);
      setCustomerPhone(editingVoucher.customerPhone);
      setCustomerEmail(editingVoucher.customerEmail);
      setServiceDate(editingVoucher.serviceDate);
      setPickupTime(editingVoucher.pickupTime);
      setTourProgram(editingVoucher.tourProgram);
      setAgentName(editingVoucher.agentName);
      setPickupCar(editingVoucher.pickupCar || '');
      setDropoffCar(editingVoucher.dropoffCar || '');
      setPickupPoint(editingVoucher.pickupPoint);
      setDropoffPoint(editingVoucher.dropoffPoint);
      setDriverCount(editingVoucher.driverCount);
      setDriverPrice(editingVoucher.driverPrice);
      setPassengerCount(editingVoucher.passengerCount);
      setPassengerPrice(editingVoucher.passengerPrice);
      setPaymentStatus(editingVoucher.paymentStatus);
      setCollectedAmount(editingVoucher.collectedAmount ?? 0);
      setExternalVoucherNo(editingVoucher.externalVoucherNo || '');
      setNotes(editingVoucher.notes);
      setSendEmail(editingVoucher.sendEmail);
      setLanguage(editingVoucher.language);
    } else {
      // Set defaults for fresh voucher
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setServiceDate(new Date().toISOString().split('T')[0]);
      setPickupTime('09:00');
      setTourProgram(options.tourPrograms[0] || '');
      setAgentName(options.agents[0] || 'Walk-In');
      setPickupCar('');
      setDropoffCar('');
      setPickupPoint('');
      setDropoffPoint('');
      setDriverCount(1);
      setDriverPrice(0); // Default to 0
      setPassengerCount(0);
      setPassengerPrice(0); // Default to 0
      setPaymentStatus('Unpaid');
      setCollectedAmount(0);
      setExternalVoucherNo('');
      setNotes('');
      setSendEmail(true);
      setLanguage('TH');
    }
    setErrors({});
  }, [editingVoucher, options]);

  // Handle tour price pre-fills
  const handleTourChange = (prog: string) => {
    setTourProgram(prog);
    // Simple logic: pre-populate price based on tour keywords to help user
    if (prog.includes('30 Mins')) {
      setDriverPrice(800);
      setPassengerPrice(500);
    } else if (prog.includes('1 Hour') && prog.includes('Kayaking')) {
      setDriverPrice(2200);
      setPassengerPrice(1400);
    } else if (prog.includes('1.5 Hours')) {
      setDriverPrice(1800);
      setPassengerPrice(1000);
    } else if (prog.includes('2 Hours')) {
      setDriverPrice(2200);
      setPassengerPrice(1200);
    } else {
      setDriverPrice(1200);
      setPassengerPrice(800);
    }
  };

  const numDriverCount = Number(driverCount) || 0;
  const numDriverPrice = Number(driverPrice) || 0;
  const numPassengerCount = Number(passengerCount) || 0;
  const numPassengerPrice = Number(passengerPrice) || 0;
  const numCollectedAmount = Number(collectedAmount) || 0;

  const totalPrice = (numDriverCount * numDriverPrice) + (numPassengerCount * numPassengerPrice);

  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!customerName.trim()) tempErrors.customerName = 'จำเป็นต้องกรอกชื่อลูกค้า (Customer name is required)';
    if (!serviceDate) tempErrors.serviceDate = 'จำเป็นต้องระบุวันที่ใช้บริการ (Service date is required)';
    if (!pickupTime) tempErrors.pickupTime = 'จำเป็นต้องระบุเวลารับ (Pickup time is required)';
    // pickupCar and dropoffCar are now OPTIONAL - removed validation!
    if (!customerPhone.trim()) tempErrors.customerPhone = 'จำเป็นต้องระบุเบอร์โทรลูกค้า (Phone number is required)';
    if (!customerEmail.trim()) {
      tempErrors.customerEmail = 'จำเป็นต้องระบุอีเมลลูกค้า (Email is required)';
    } else if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      tempErrors.customerEmail = 'รูปแบบอีเมลไม่ถูกต้อง (Invalid email format)';
    }
    if (!pickupPoint.trim()) tempErrors.pickupPoint = 'จำเป็นต้องระบุจุดรับ (Pickup point is required)';
    if (!dropoffPoint.trim()) tempErrors.dropoffPoint = 'จำเป็นต้องระบุจุดส่ง (Dropoff point is required)';
    
    // Convert to numbers safely for range checks
    if (numDriverCount < 0) tempErrors.driverCount = 'จำนวนคนขับไม่สามารถติดลบได้ (Driver count cannot be negative)';
    if (numDriverPrice < 0) tempErrors.driverPrice = 'ราคาคนขับไม่สามารถติดลบได้ (Driver price cannot be negative)';
    if (numPassengerCount < 0) tempErrors.passengerCount = 'จำนวนคนซ้อนไม่สามารถติดลบได้ (Passenger count cannot be negative)';
    if (numPassengerPrice < 0) tempErrors.passengerPrice = 'ราคาคนซ้อนไม่สามารถติดลบได้ (Passenger price cannot be negative)';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        serviceDate,
        pickupTime,
        tourProgram,
        agentName,
        pickupCar,
        dropoffCar,
        pickupPoint: pickupPoint.trim(),
        dropoffPoint: dropoffPoint.trim(),
        driverCount: numDriverCount,
        driverPrice: numDriverPrice,
        passengerCount: numPassengerCount,
        passengerPrice: numPassengerPrice,
        totalPrice,
        paymentStatus,
        collectedAmount: paymentStatus === 'Collect' ? numCollectedAmount : 0,
        externalVoucherNo: externalVoucherNo.trim(),
        notes: notes.trim(),
        sendEmail,
        language
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="voucher-input-form">
      {/* Form header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            {editingVoucher ? 'แก้ไขวอเชอร์ / Edit Voucher' : 'ออกวอเชอร์จำหน่ายทัวร์ / Issue Tour Voucher'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {editingVoucher ? `กำลังอัปเดตรหัสวอเชอร์: ${editingVoucher.id}` : 'กรอกข้อมูลการจองให้ครบถ้วนเพื่อจัดทำตั๋ววอเชอร์'}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-all"
            id="form-cancel-button"
          >
            ยกเลิก / Cancel
          </button>
        )}
      </div>

      {/* Main Grid: split customer info and logistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Customer and Program details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            ข้อมูลลูกค้าและทัวร์ (Customer & Program Details)
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อลูกค้า / Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="ชื่อ-นามสกุล ภาษาไทย หรือ ภาษาอังกฤษ"
              className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                errors.customerName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
              }`}
              id="field-customer-name"
            />
            {errors.customerName && <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.customerName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เบอร์โทรลูกค้า / Customer Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="เช่น 089-1234567"
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.customerPhone ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                  id="field-customer-phone"
                />
              </div>
              {errors.customerPhone && <p className="text-[11px] text-rose-500 mt-1">{errors.customerPhone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                อีเมลลูกค้า / Customer Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="เช่น customer@email.com"
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.customerEmail ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                  id="field-customer-email"
                />
              </div>
              {errors.customerEmail && <p className="text-[11px] text-rose-500 mt-1">{errors.customerEmail}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                โปรแกรมทัวร์ / Tour Program <span className="text-rose-500">*</span>
              </label>
              <select
                value={tourProgram}
                onChange={(e) => handleTourChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                id="field-tour-program"
              >
                {options.tourPrograms.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เอเยนต์ / Agent หรือ วอคอิน <span className="text-rose-500">*</span>
              </label>
              <select
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                id="field-agent-name"
              >
                {options.agents.map((a, idx) => (
                  <option key={idx} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเลข Voucher นอก / External Voucher No.
            </label>
            <input
              type="text"
              value={externalVoucherNo}
              onChange={(e) => setExternalVoucherNo(e.target.value)}
              placeholder="ระบุรหัสวอเชอร์ของเอเยนต์ (ถ้ามี)"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
              id="field-external-voucher-no"
            />
          </div>

          {/* Quantities & Prices section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              จำนวนผู้ร่วมกิจกรรม & ราคา (Activity Quantities & Rates)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 font-semibold">จำนวนคนขับ (Driver Count) *</label>
                <input
                  type="number"
                  min="0"
                  value={driverCount}
                  onChange={(e) => setDriverCount(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  id="field-driver-count"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 font-semibold">ราคาคนขับ (Driver Rate) *</label>
                <input
                  type="number"
                  min="0"
                  value={driverPrice === 0 ? '' : driverPrice}
                  onChange={(e) => setDriverPrice(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  id="field-driver-price"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500">จำนวนคนซ้อน (Passenger Count)</label>
                <input
                  type="number"
                  min="0"
                  value={passengerCount === 0 ? '' : passengerCount}
                  onChange={(e) => setPassengerCount(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  id="field-passenger-count"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500">ราคาคนซ้อน (Passenger Rate)</label>
                <input
                  type="number"
                  min="0"
                  value={passengerPrice === 0 ? '' : passengerPrice}
                  onChange={(e) => setPassengerPrice(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  id="field-passenger-price"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">ราคารวมทั้งหมด (Calculated Total):</span>
              <span className="text-base font-black text-emerald-700 font-mono">
                {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Logistics, cars, points, and configurations */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            การเดินทางและเวลา (Logistics & Transports)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันที่ใช้บริการ / Service Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.serviceDate ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                  id="field-service-date"
                />
              </div>
              {errors.serviceDate && <p className="text-[11px] text-rose-500 mt-1">{errors.serviceDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เวลารับลูกค้า / Pickup Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Clock className="w-4 h-4" />
                </span>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.pickupTime ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                  id="field-pickup-time"
                />
              </div>
              {errors.pickupTime && <p className="text-[11px] text-rose-500 mt-1">{errors.pickupTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>ชื่อรถรับ / Pickup Car</span>
                <span className="text-[10px] text-amber-600 font-normal">(ซ่อนใน Voucher ลูกค้า)</span>
              </label>
              <select
                value={pickupCar}
                onChange={(e) => setPickupCar(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                id="field-pickup-car"
              >
                <option value="">-- เลือกชื่อรถรับ / Select Pickup Car --</option>
                {options.pickupCars.map((car, idx) => (
                  <option key={idx} value={car}>{car}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>ชื่อรถส่ง / Dropoff Car</span>
                <span className="text-[10px] text-amber-600 font-normal">(ซ่อนใน Voucher ลูกค้า)</span>
              </label>
              <select
                value={dropoffCar}
                onChange={(e) => setDropoffCar(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
                id="field-dropoff-car"
              >
                <option value="">-- เลือกชื่อรถส่ง / Select Dropoff Car --</option>
                {options.dropoffCars.map((car, idx) => (
                  <option key={idx} value={car}>{car}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จุดรับลูกค้า / Pickup Point <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  placeholder="เช่น โรงแรม ดุสิตธานี อ่าวนาง"
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.pickupPoint ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                  id="field-pickup-point"
                />
              </div>
              {errors.pickupPoint && <p className="text-[11px] text-rose-500 mt-1">{errors.pickupPoint}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จุดส่งลูกค้า / Dropoff Point <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={dropoffPoint}
                  onChange={(e) => setDropoffPoint(e.target.value)}
                  placeholder="เช่น โรงแรม ดุสิตธานี อ่าวนาง หรือ จุดอื่น"
                  className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.dropoffPoint ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300'
                  }`}
                  id="field-dropoff-point"
                />
              </div>
              {errors.dropoffPoint && <p className="text-[11px] text-rose-500 mt-1">{errors.dropoffPoint}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สถานะการชำระเงิน / Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as Voucher['paymentStatus'])}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800"
                id="field-payment-status"
              >
                <option value="Unpaid">ยังไม่จ่าย / Unpaid 🔴</option>
                <option value="Deposit">มัดจำบางส่วน / Deposit 🟡</option>
                <option value="Paid">จ่ายเต็มจำนวน / Paid 🟢</option>
                <option value="Collect">เก็บเงินจากลูกค้า / Collect Cash 🔵</option>
              </select>

              {paymentStatus === 'Collect' && (
                <div className="mt-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100 space-y-2">
                  <label className="block text-[11px] font-bold text-indigo-950">
                    จำนวนเงินที่เก็บจากลูกค้า / Collected Amount <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={collectedAmount === 0 ? '' : collectedAmount}
                    onChange={(e) => setCollectedAmount(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                    placeholder="ระบุจำนวนเงินที่เก็บจากลูกค้า"
                    id="field-collected-amount"
                    required
                  />
                  <div className="flex justify-between text-[10px] text-indigo-900 font-semibold pt-1 border-t border-indigo-100">
                    <span>ยอดเต็ม: {totalPrice.toLocaleString()} บ.</span>
                    <span className="text-rose-600 font-bold">
                      ค้างจ่าย: {(totalPrice - numCollectedAmount).toLocaleString()} บ.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ภาษาที่แสดงใน Voucher / Voucher Language
              </label>
              <div className="flex gap-2 h-[38px] items-center">
                <button
                  type="button"
                  onClick={() => setLanguage('TH')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    language === 'TH'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  ภาษาไทย (TH)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('EN')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    language === 'EN'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  English (EN)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุ / สถานที่นัดพบ (Notes / Meeting Point)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ข้อความหมายเหตุเพิ่มเติม สถานที่นัดพบ อาหารที่แพ้ หรือข้อมูลขับขี่อื่น ๆ"
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              id="field-notes"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="send-email-checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="send-email-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
              ส่ง Voucher ไปยังอีเมลของลูกค้าอัตโนมัติ (Send Voucher to customer email automatically)
            </label>
          </div>
        </div>
      </div>

      {/* Form Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all"
          >
            ยกเลิก / Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-md flex items-center gap-2"
          id="btn-save-voucher"
        >
          <Save className="w-4 h-4" />
          {editingVoucher ? 'อัปเดตวอเชอร์ / Update Voucher' : 'สร้างและบันทึกวอเชอร์ / Issue & Save Voucher'}
        </button>
      </div>
    </form>
  );
}
