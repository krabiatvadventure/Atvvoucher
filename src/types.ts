/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'staff' | 'manager';

export interface UserPermissions {
  canDeleteVoucher: boolean;
  canEditVoucher: boolean;
  canAddStaff: boolean;
  canManageOptions: boolean; // Add/edit Agent, Tour, Car lists
}

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  permissions: UserPermissions;
  password?: string; // Optional for security, but stored in mock database
  createdAt: string;
}

export interface Voucher {
  id: string; // Auto-generated e.g. K-20260629-001
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:MM
  tourProgram: string;
  agentName: string;
  pickupCar: string;
  dropoffCar: string;
  pickupPoint: string;
  dropoffPoint: string;
  driverCount: number;
  driverPrice: number;
  passengerCount: number;
  passengerPrice: number;
  totalPrice: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Deposit' | 'Collect';
  notes: string;
  sendEmail: boolean;
  language: 'TH' | 'EN';
  createdBy: string; // username of creator
  createdAt: string;
  collectedAmount?: number; // Amount collected from customer
  externalVoucherNo?: string; // External Voucher Number (Agent voucher no)
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface SystemOptions {
  tourPrograms: string[];
  agents: string[];
  pickupCars: string[];
  dropoffCars: string[];
  expenseCategories: string[];
}
