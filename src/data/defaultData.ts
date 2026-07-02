/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserAccount, Voucher, Expense, SystemOptions } from '../types';

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'u-1',
    username: 'admin',
    role: 'admin',
    permissions: {
      canDeleteVoucher: true,
      canEditVoucher: true,
      canAddStaff: true,
      canManageOptions: true
    },
    password: 'admin',
    createdAt: '2026-06-01T00:00:00.000Z'
  },
  {
    id: 'u-2',
    username: 'manager_lek',
    role: 'manager',
    permissions: {
      canDeleteVoucher: true,
      canEditVoucher: true,
      canAddStaff: true,
      canManageOptions: true
    },
    password: '1234',
    createdAt: '2026-06-15T00:00:00.000Z'
  },
  {
    id: 'u-3',
    username: 'staff_noom',
    role: 'staff',
    permissions: {
      canDeleteVoucher: false,
      canEditVoucher: false,
      canAddStaff: false,
      canManageOptions: false
    },
    password: '5678',
    createdAt: '2026-06-20T00:00:00.000Z'
  }
];

export const DEFAULT_OPTIONS: SystemOptions = {
  tourPrograms: [
    'ATV Krabi Adventure 30 Mins',
    'ATV Krabi Adventure 1 Hour',
    'ATV Krabi Adventure 1.5 Hours',
    'ATV Krabi Adventure 2 Hours',
    'ATV 1 Hour + Elephant Trekking',
    'ATV 1 Hour + Kayaking',
    'ATV 1 Hour + Tiger Cave Temple'
  ],
  agents: [
    'Walk-In',
    'Krabi Tour Center',
    'Ao Nang Travel Agency',
    'Best Krabi Tours Co.',
    'Phuket Adventure Ltd.',
    'Happy Green Travel',
    'Local Hotel Counter'
  ],
  pickupCars: [
    'Toyota Hilux Revo White #1',
    'Toyota Hilux Revo White #2',
    'Toyota Commuter VIP Van #3',
    'Toyota Commuter Standard Van #4',
    'ATV Shuttle Songthaew #5',
    'Local Taxi Cooperative'
  ],
  dropoffCars: [
    'Toyota Hilux Revo White #1',
    'Toyota Hilux Revo White #2',
    'Toyota Commuter VIP Van #3',
    'Toyota Commuter Standard Van #4',
    'ATV Shuttle Songthaew #5',
    'Local Taxi Cooperative'
  ],
  expenseCategories: [
    'ATV Maintenance & Tires',
    'Fuel / Gasoline',
    'Staff Wages / Commission',
    'Driver Fees',
    'Drinking Water & Snacks',
    'Office Supplies / Utilities',
    'Marketing / Agent Commission',
    'Insurance Policies'
  ]
};

export const DEFAULT_VOUCHERS: Voucher[] = [
  {
    id: 'V-20260625-001',
    customerName: 'Michael Chang',
    customerPhone: '+66 81-234-5678',
    customerEmail: 'michael.c@gmail.com',
    serviceDate: '2026-06-28',
    pickupTime: '09:00',
    tourProgram: 'ATV Krabi Adventure 1 Hour',
    agentName: 'Ao Nang Travel Agency',
    pickupCar: 'Toyota Hilux Revo White #1',
    dropoffCar: 'Toyota Hilux Revo White #1',
    pickupPoint: 'Ao Nang Cliff Beach Resort (Lobby)',
    dropoffPoint: 'Ao Nang Cliff Beach Resort',
    driverCount: 2,
    driverPrice: 1200,
    passengerCount: 1,
    passengerPrice: 800,
    totalPrice: 3200,
    paymentStatus: 'Paid',
    notes: 'No spicy breakfast. Customer needs XL size helmets.',
    sendEmail: true,
    language: 'EN',
    createdBy: 'staff_noom',
    createdAt: '2026-06-25T09:30:00.000Z'
  },
  {
    id: 'V-20260628-001',
    customerName: 'สมชาย รักไทย',
    customerPhone: '089-765-4321',
    customerEmail: 'somchai.t@hotmail.com',
    serviceDate: '2026-06-29',
    pickupTime: '13:30',
    tourProgram: 'ATV Krabi Adventure 1.5 Hours',
    agentName: 'Walk-In',
    pickupCar: 'Toyota Commuter VIP Van #3',
    dropoffCar: 'Toyota Commuter VIP Van #3',
    pickupPoint: 'โรงแรมเซนทาราแกรนด์ อ่าวนาง (จุดนัดพบหน้าท่าเรือ)',
    dropoffPoint: 'โรงแรมเซนทาราแกรนด์ อ่าวนาง',
    driverCount: 1,
    driverPrice: 1800,
    passengerCount: 1,
    passengerPrice: 1000,
    totalPrice: 2800,
    paymentStatus: 'Deposit',
    notes: 'มัดจำแล้ว 1,000 บาท หน้าเคาน์เตอร์ จ่ายสดอีก 1,800 หน้างงาน',
    sendEmail: false,
    language: 'TH',
    createdBy: 'admin',
    createdAt: '2026-06-28T14:15:00.000Z'
  },
  {
    id: 'V-20260629-001',
    customerName: 'Emily & John Watson',
    customerPhone: '+44 7700 900077',
    customerEmail: 'john.watson@gmail.com',
    serviceDate: '2026-06-29',
    pickupTime: '10:30',
    tourProgram: 'ATV 1 Hour + Kayaking',
    agentName: 'Best Krabi Tours Co.',
    pickupCar: 'ATV Shuttle Songthaew #5',
    dropoffCar: 'Toyota Commuter Standard Van #4',
    pickupPoint: 'Krabi Heritage Hotel (Ao Nang)',
    dropoffPoint: 'Klong Root Kayaking Center',
    driverCount: 2,
    driverPrice: 2200,
    passengerCount: 0,
    passengerPrice: 0,
    totalPrice: 4400,
    paymentStatus: 'Paid',
    notes: 'Pick up on time, tour guide speaks english.',
    sendEmail: true,
    language: 'EN',
    createdBy: 'manager_lek',
    createdAt: '2026-06-29T08:00:00.000Z'
  }
];

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'E-001',
    date: '2026-06-25',
    category: 'Fuel / Gasoline',
    amount: 1500,
    description: 'เติมน้ำมันเบนซิน 95 รถ ATV 6 คัน',
    createdBy: 'staff_noom',
    createdAt: '2026-06-25T11:00:00.000Z'
  },
  {
    id: 'E-002',
    date: '2026-06-28',
    category: 'ATV Maintenance & Tires',
    amount: 3200,
    description: 'เปลี่ยนยางหลัง ATV 2 เส้น รถเบอร์ 05 และ 12',
    createdBy: 'admin',
    createdAt: '2026-06-28T16:45:00.000Z'
  },
  {
    id: 'E-003',
    date: '2026-06-29',
    category: 'Drinking Water & Snacks',
    amount: 450,
    description: 'ซื้อน้ำดื่มสิงห์ 5 แพ็ค สำหรับลูกค้าทัวร์บ่าย',
    createdBy: 'manager_lek',
    createdAt: '2026-06-29T10:15:00.000Z'
  }
];
