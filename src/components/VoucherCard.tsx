/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Voucher } from '../types';
import { Download, Mail, Phone, Calendar, Clock, MapPin, User, Compass, CheckCircle2, AlertCircle, FileText, Globe, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { cleanClonedDocForHtml2Canvas, cleanOriginalStylesAndRun } from '../lib/html2canvasHelper';

interface VoucherCardProps {
  voucher: Voucher;
  onSendEmail?: (voucher: Voucher) => void;
  onClose?: () => void;
  autoDownload?: boolean;
}

export default function VoucherCard({ voucher, onSendEmail, onClose, autoDownload }: VoucherCardProps) {
  const voucherRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const lang = voucher.language;

  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPNG();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, voucher.id]);

  // Bilingual translation map
  const t = {
    title: lang === 'TH' ? 'วอเชอร์ยืนยันการใช้บริการ' : 'TOUR CONFIRMATION VOUCHER',
    subTitle: lang === 'TH' ? 'กระบี่ เอทีวี แอดเวนเจอร์' : 'KRABI ATV ADVENTURE',
    voucherNo: lang === 'TH' ? 'รหัสวอเชอร์' : 'Voucher No',
    customerName: lang === 'TH' ? 'ชื่อลูกค้า' : 'Customer Name',
    phone: lang === 'TH' ? 'เบอร์โทรศัพท์' : 'Phone Number',
    email: lang === 'TH' ? 'อีเมล' : 'Email Address',
    date: lang === 'TH' ? 'วันที่ใช้บริการ' : 'Service Date',
    time: lang === 'TH' ? 'เวลารับ' : 'Pickup Time',
    program: lang === 'TH' ? 'โปรแกรมทัวร์' : 'Tour Program',
    agent: lang === 'TH' ? 'ตัวแทนจำหน่าย / เอเยนต์' : 'Agent / Walk-In',
    pickup: lang === 'TH' ? 'จุดรับ' : 'Pickup Point',
    dropoff: lang === 'TH' ? 'จุดส่ง' : 'Dropoff Point',
    driver: lang === 'TH' ? 'จำนวนคนขับ' : 'Driver(s) count',
    passenger: lang === 'TH' ? 'จำนวนคนซ้อน' : 'Passenger(s) count',
    price: lang === 'TH' ? 'ราคา/คน' : 'Price/Pax',
    total: lang === 'TH' ? 'ยอดรวมทั้งหมด' : 'Total Price',
    status: lang === 'TH' ? 'สถานะการชำระเงิน' : 'Payment Status',
    paid: lang === 'TH' ? 'ชำระเงินแล้ว' : 'Paid',
    unpaid: lang === 'TH' ? 'ยังไม่ได้ชำระเงิน' : 'Unpaid',
    deposit: lang === 'TH' ? 'มัดจำแล้ว' : 'Deposit Paid',
    collect: lang === 'TH' ? 'เก็บเงินจากลูกค้า' : 'Collect Cash on Pickup',
    notes: lang === 'TH' ? 'หมายเหตุ / สถานที่นัดพบ' : 'Notes / Meeting Point',
    footer1: lang === 'TH' ? 'กรุณาแสดงวอเชอร์นี้แก่พนักงานขับรถเมื่อมารับท่าน' : 'Please present this voucher to the driver upon pickup.',
    footer2: lang === 'TH' ? 'ขอบคุณที่ใช้บริการ Krabi ATV Adventure' : 'Thank you for choosing Krabi ATV Adventure!',
    contactInfo: lang === 'TH' ? 'ติดต่อเรา: +66 75-123456 | อีเมล: info@krabiatvadventure.com' : 'Contact Us: +66 75-123456 | Email: info@krabiatvadventure.com'
  };

  const handleDownloadPNG = async () => {
    if (!voucherRef.current) return;
    setDownloading(true);
    try {
      // Small delay to ensure render is fully settled
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await cleanOriginalStylesAndRun(() => html2canvas(voucherRef.current!, {
        scale: 2, // Increase resolution
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
    } catch (err) {
      console.error('Failed to generate PNG:', err);
    } finally {
      setDownloading(false);
    }
  };

  const triggerSendEmail = () => {
    if (onSendEmail) {
      onSendEmail(voucher);
    }
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  // Helper to format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Control Buttons (no-print) */}
      <div className="no-print flex flex-wrap gap-2 justify-end items-center bg-slate-50 p-3 rounded-2xl border border-slate-150">
        <button
          onClick={handleDownloadPNG}
          disabled={downloading}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          id={`btn-download-png-${voucher.id}`}
        >
          <Download className="w-4 h-4" />
          {downloading ? 'กำลังสร้างรูปภาพ PNG...' : '💾 บันทึกรูปภาพวอเชอร์ (Save PNG Image)'}
        </button>

        {voucher.sendEmail && (
          <button
            onClick={triggerSendEmail}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isSent 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
            }`}
            id={`btn-send-email-${voucher.id}`}
          >
            <Mail className="w-4 h-4" />
            {isSent ? 'ส่งอีเมลเรียบร้อย! (Sent!)' : 'ส่ง Voucher ทาง Email (Send Email)'}
          </button>
        )}

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all border border-slate-300 shadow-sm cursor-pointer"
          id={`btn-print-${voucher.id}`}
        >
          <FileText className="w-4 h-4" />
          พิมพ์เอกสาร (Print PDF)
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            id={`btn-close-vcard-${voucher.id}`}
          >
            <X className="w-4 h-4" />
            ปิดหน้าต่าง (Close)
          </button>
        )}
      </div>

      {/* Voucher Canvas Container */}
      <div className="bg-slate-100 p-4 sm:p-6 rounded-xl border border-slate-200 shadow-inner flex justify-center overflow-auto">
        <div 
          ref={voucherRef}
          className="w-full max-w-2xl bg-white text-slate-800 p-6 sm:p-8 rounded-lg shadow-md border-t-8 border-emerald-600 relative overflow-hidden flex flex-col justify-between"
          style={{ width: '650px', minHeight: '800px', fontFamily: '"Sarabun", "Inter", sans-serif' }}
          id={`voucher-document-${voucher.id}`}
        >
          {/* Subtle Watermark logo */}
          <div className="absolute right-[-40px] top-[40px] text-slate-100/50 -rotate-12 pointer-events-none select-none">
            <Compass className="w-96 h-96" />
          </div>

          <div>
            {/* Header section */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                  <Compass className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 leading-tight">
                    {t.subTitle}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                    TOUR VOUCHER & BOOKING CONFIRMATION
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100 mb-1">
                  {t.title}
                </span>
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{t.voucherNo}: </span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                    {voucher.id}
                  </span>
                </div>
                {voucher.externalVoucherNo && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-slate-600">Voucher นอก: </span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      {voucher.externalVoucherNo}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Contact Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl mb-5 relative z-10 border border-slate-100">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {lang === 'TH' ? 'ข้อมูลลูกค้า' : 'CUSTOMER DETAILS'}
                </div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  {voucher.customerName}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {voucher.customerPhone}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {voucher.customerEmail}
                </div>
              </div>

              <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-4">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {lang === 'TH' ? 'ผู้ประสานงาน / ตัวแทน' : 'RESERVATION AGENT'}
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {voucher.agentName}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {lang === 'TH' ? 'สร้างโดย' : 'Issued by'}: <span className="font-medium text-slate-700">{voucher.createdBy}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'TH' ? 'วันที่ออกเอกสาร' : 'Issued date'}: {new Date(voucher.createdAt).toLocaleString(lang === 'TH' ? 'th-TH' : 'en-US', { timeZone: 'Asia/Bangkok' })}
                </div>
              </div>
            </div>

            {/* Service Schedule Details */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-5 mb-5 relative z-10">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block">{t.date}</span>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>
                    {new Date(voucher.serviceDate).toLocaleDateString(lang === 'TH' ? 'th-TH' : 'en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block">{t.time}</span>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{voucher.pickupTime} {lang === 'TH' ? 'น.' : 'HRS'}</span>
                </div>
              </div>
            </div>

            {/* Tour Program */}
            <div className="mb-5 relative z-10">
              <span className="text-[11px] text-slate-500 block mb-1">{t.program}</span>
              <div className="p-3 bg-emerald-50/50 border border-emerald-100/80 rounded-xl">
                <span className="text-base font-bold text-emerald-900">
                  {voucher.tourProgram}
                </span>
              </div>
            </div>

            {/* Transportation Details (Excluding Pickup/Dropoff car name as requested!) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-slate-150 py-4 mb-5 relative z-10">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" /> {t.pickup}
                </span>
                <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[44px]">
                  {voucher.pickupPoint}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" /> {t.dropoff}
                </span>
                <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[44px]">
                  {voucher.dropoffPoint}
                </p>
              </div>
            </div>

            {/* Participant Breakdown & Prices */}
            <div className="mb-5 relative z-10">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-medium">
                    <th className="pb-2">{lang === 'TH' ? 'ประเภท' : 'Category'}</th>
                    <th className="pb-2 text-center">{lang === 'TH' ? 'จำนวน (คน)' : 'Qty (Pax)'}</th>
                    <th className="pb-2 text-right">{t.price}</th>
                    <th className="pb-2 text-right">{lang === 'TH' ? 'รวม' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {voucher.driverCount > 0 && (
                    <tr className="text-slate-700">
                      <td className="py-2.5 font-semibold">
                        {lang === 'TH' ? 'คนขับ ATV' : 'ATV Driver'}
                      </td>
                      <td className="py-2.5 text-center font-mono font-medium">{voucher.driverCount}</td>
                      <td className="py-2.5 text-right font-mono">{formatMoney(voucher.driverPrice)}</td>
                      <td className="py-2.5 text-right font-mono font-semibold">
                        {formatMoney(voucher.driverCount * voucher.driverPrice)}
                      </td>
                    </tr>
                  )}
                  {voucher.passengerCount > 0 && (
                    <tr className="text-slate-700">
                      <td className="py-2.5 font-semibold">
                        {lang === 'TH' ? 'คนซ้อนท้าย' : 'ATV Passenger'}
                      </td>
                      <td className="py-2.5 text-center font-mono font-medium">{voucher.passengerCount}</td>
                      <td className="py-2.5 text-right font-mono">{formatMoney(voucher.passengerPrice)}</td>
                      <td className="py-2.5 text-right font-mono font-semibold">
                        {formatMoney(voucher.passengerCount * voucher.passengerPrice)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Price Total & Payment Status */}
            <div className="bg-slate-50 p-4 rounded-xl grid grid-cols-2 gap-4 items-center relative z-10 border border-slate-100 mb-6">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">{t.status}</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                  voucher.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : voucher.paymentStatus === 'Deposit'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : voucher.paymentStatus === 'Collect'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {voucher.paymentStatus === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {voucher.paymentStatus === 'Deposit' && <AlertCircle className="w-3.5 h-3.5" />}
                  {voucher.paymentStatus === 'Collect' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  {voucher.paymentStatus === 'Unpaid' && <AlertCircle className="w-3.5 h-3.5" />}
                  {voucher.paymentStatus === 'Paid'
                    ? t.paid
                    : voucher.paymentStatus === 'Deposit'
                    ? t.deposit
                    : voucher.paymentStatus === 'Collect'
                    ? t.collect
                    : t.unpaid}
                </span>

                {voucher.paymentStatus === 'Collect' && (
                  <div className="text-[10px] text-indigo-800 mt-1.5 font-semibold space-y-0.5">
                    <div>{lang === 'TH' ? 'เก็บแล้ว' : 'Collected'}: <span className="font-mono text-slate-950">{formatMoney(voucher.collectedAmount || 0)}</span></div>
                    <div className="text-rose-600 font-bold">{lang === 'TH' ? 'ค้างจ่าย' : 'Bal Due'}: <span className="font-mono">{formatMoney(voucher.totalPrice - (voucher.collectedAmount || 0))}</span></div>
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">{t.total}</span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  {formatMoney(voucher.totalPrice)}
                </span>
              </div>
            </div>

            {/* Notes / Meeting Point */}
            {voucher.notes && (
              <div className="mb-6 p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-xs relative z-10">
                <span className="font-bold text-amber-800 block mb-1">{t.notes}</span>
                <p className="text-slate-700 whitespace-pre-line">{voucher.notes}</p>
              </div>
            )}
          </div>

          {/* Footer of Voucher */}
          <div className="border-t border-slate-200 pt-4 mt-auto text-center space-y-1 relative z-10">
            <p className="text-xs text-slate-600 font-medium">{t.footer1}</p>
            <p className="text-xs text-emerald-600 font-bold">{t.footer2}</p>
            <p className="text-[9px] text-slate-400 mt-2 font-mono">{t.contactInfo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
