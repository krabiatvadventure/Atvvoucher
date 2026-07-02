/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, SystemOptions, UserRole, UserPermissions } from '../types';
import { Shield, UserPlus, Trash2, Key, Settings, Settings2, Sparkles, CheckSquare, Square, Compass, RefreshCw, Edit2 } from 'lucide-react';

interface AdminPanelProps {
  users: UserAccount[];
  options: SystemOptions;
  currentUser: UserAccount;
  onAddUser: (username: string, role: UserRole, password: string, permissions: UserPermissions) => void;
  onDeleteUser: (id: string) => void;
  onUpdateOptions: (newOptions: SystemOptions) => void;
  onUpdateUser: (user: UserAccount) => void;
}

export default function AdminPanel({
  users,
  options,
  currentUser,
  onAddUser,
  onDeleteUser,
  onUpdateOptions,
  onUpdateUser
}: AdminPanelProps) {
  // Edit mode state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Add Staff form states
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [newPassword, setNewPassword] = useState('');
  
  // Custom permissions
  const [permDelete, setPermDelete] = useState(false);
  const [permEdit, setPermEdit] = useState(false);
  const [permAddStaff, setPermAddStaff] = useState(false);
  const [permManageOptions, setPermManageOptions] = useState(false);

  // Manage Option inputs
  const [newTour, setNewTour] = useState('');
  const [newAgent, setNewAgent] = useState('');
  const [newPickupCar, setNewPickupCar] = useState('');
  const [newDropoffCar, setNewDropoffCar] = useState('');

  const [staffError, setStaffError] = useState('');

  // Handle Role preset defaults
  const handleRoleChange = (role: UserRole) => {
    setNewRole(role);
    if (role === 'admin') {
      setPermDelete(true);
      setPermEdit(true);
      setPermAddStaff(true);
      setPermManageOptions(true);
    } else if (role === 'manager') {
      setPermDelete(true);
      setPermEdit(true);
      setPermAddStaff(false);
      setPermManageOptions(true);
    } else {
      setPermDelete(false);
      setPermEdit(false);
      setPermAddStaff(false);
      setPermManageOptions(false);
    }
  };

  const handleStartEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewPassword(user.password || '');
    setNewRole(user.role);
    setPermDelete(user.permissions.canDeleteVoucher);
    setPermEdit(user.permissions.canEditVoucher);
    setPermAddStaff(user.permissions.canAddStaff);
    setPermManageOptions(user.permissions.canManageOptions);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewUsername('');
    setNewPassword('');
    handleRoleChange('staff');
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    if (!newUsername.trim()) {
      setStaffError('กรุณากรอกชื่อผู้ใช้ / Username required');
      return;
    }
    if (!newPassword) {
      setStaffError('กรุณากรอกรหัสผ่าน / Password required');
      return;
    }

    // Check duplicate
    const isDuplicate = users.some(
      (u) => 
        u.username.toLowerCase() === newUsername.trim().toLowerCase() && 
        (!editingUser || u.id !== editingUser.id)
    );
    if (isDuplicate) {
      setStaffError('ชื่อผู้ใช้นี้มีในระบบแล้ว (Username already exists)');
      return;
    }

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        username: newUsername.trim(),
        role: newRole,
        password: newPassword,
        permissions: {
          canDeleteVoucher: permDelete,
          canEditVoucher: permEdit,
          canAddStaff: permAddStaff,
          canManageOptions: permManageOptions
        }
      });
      setEditingUser(null);
    } else {
      onAddUser(newUsername.trim(), newRole, newPassword, {
        canDeleteVoucher: permDelete,
        canEditVoucher: permEdit,
        canAddStaff: permAddStaff,
        canManageOptions: permManageOptions
      });
    }

    // Reset Form
    setNewUsername('');
    setNewPassword('');
    handleRoleChange('staff');
  };

  // Option list updates helpers
  const handleAddTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTour.trim()) {
      const updated = [...options.tourPrograms, newTour.trim()];
      onUpdateOptions({ ...options, tourPrograms: updated });
      setNewTour('');
    }
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAgent.trim()) {
      const updated = [...options.agents, newAgent.trim()];
      onUpdateOptions({ ...options, agents: updated });
      setNewAgent('');
    }
  };

  const handleAddPickupCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPickupCar.trim()) {
      const updated = [...options.pickupCars, newPickupCar.trim()];
      onUpdateOptions({ ...options, pickupCars: updated });
      setNewPickupCar('');
    }
  };

  const handleAddDropoffCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDropoffCar.trim()) {
      const updated = [...options.dropoffCars, newDropoffCar.trim()];
      onUpdateOptions({ ...options, dropoffCars: updated });
      setNewDropoffCar('');
    }
  };

  const handleDeleteItem = (type: 'tour' | 'agent' | 'pickup' | 'dropoff', valToDelete: string) => {
    if (!window.confirm(`ยืนยันการลบตัวเลือก "${valToDelete}"?`)) return;

    let updatedOptions = { ...options };
    if (type === 'tour') {
      updatedOptions.tourPrograms = options.tourPrograms.filter(x => x !== valToDelete);
    } else if (type === 'agent') {
      updatedOptions.agents = options.agents.filter(x => x !== valToDelete);
    } else if (type === 'pickup') {
      updatedOptions.pickupCars = options.pickupCars.filter(x => x !== valToDelete);
    } else if (type === 'dropoff') {
      updatedOptions.dropoffCars = options.dropoffCars.filter(x => x !== valToDelete);
    }
    onUpdateOptions(updatedOptions);
  };

  const canAddStaff = currentUser.permissions.canAddStaff || currentUser.role === 'admin';
  const canManageOptions = currentUser.permissions.canManageOptions || currentUser.role === 'admin';

  return (
    <div className="space-y-6" id="admin-panel-tab">
      
      {/* SECTION 1: ADD STAFF & PERMISSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Staff form */}
        <div className="lg:col-span-1 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
              {editingUser ? 'แก้ไขบัญชีพนักงาน / Edit Staff' : 'เพิ่มพนักงาน & กำหนดสิทธิ์ / Add Staff & Roles'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {editingUser ? 'กำลังแก้ไขสิทธิ์ของพนักงานรายบุคคลในระบบ' : 'สร้างรหัสผ่านและติ๊กสิทธิ์พนักงานสำหรับการจัดการระบบวอเชอร์'}
            </p>
          </div>

          <form onSubmit={handleCreateStaff} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อผู้ใช้งาน / Username *
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="เช่น staff_somrak, lek_manager"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                disabled={!canAddStaff}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสผ่าน / Password *
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="พิมพ์รหัสเข้าใช้งานของพนักงาน"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                disabled={!canAddStaff}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                บทบาทพนักงาน / Role
              </label>
              <select
                value={newRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                disabled={!canAddStaff}
              >
                <option value="staff">พนักงานทั่วไป (Staff)</option>
                <option value="manager">ผู้จัดการ (Manager)</option>
                <option value="admin">แอดมินระบบ (Admin)</option>
              </select>
            </div>

            {/* Checkbox Permissions Selection */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2.5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                กำหนดสิทธิ์ทีละรายการ (Custom Privileges)
              </span>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-xs select-none ${canAddStaff ? 'cursor-pointer' : ''}`}>
                  <input
                    type="checkbox"
                    checked={permDelete}
                    onChange={(e) => setPermDelete(e.target.checked)}
                    disabled={!canAddStaff || newRole === 'admin'}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-700">สามารถลบวอเชอร์ในระบบ (Delete Voucher)</span>
                </label>

                <label className={`flex items-center gap-2 text-xs select-none ${canAddStaff ? 'cursor-pointer' : ''}`}>
                  <input
                    type="checkbox"
                    checked={permEdit}
                    onChange={(e) => setPermEdit(e.target.checked)}
                    disabled={!canAddStaff || newRole === 'admin'}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-700">สามารถแก้ไขวอเชอร์ลูกค้า (Edit Voucher)</span>
                </label>

                <label className={`flex items-center gap-2 text-xs select-none ${canAddStaff ? 'cursor-pointer' : ''}`}>
                  <input
                    type="checkbox"
                    checked={permAddStaff}
                    onChange={(e) => setPermAddStaff(e.target.checked)}
                    disabled={!canAddStaff || newRole === 'admin' || newRole === 'manager'}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-700">สามารถเพิ่ม/จัดการพนักงานในบริษัท (Add Staff)</span>
                </label>

                <label className={`flex items-center gap-2 text-xs select-none ${canAddStaff ? 'cursor-pointer' : ''}`}>
                  <input
                    type="checkbox"
                    checked={permManageOptions}
                    onChange={(e) => setPermManageOptions(e.target.checked)}
                    disabled={!canAddStaff || newRole === 'admin'}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-slate-700">จัดการตัวเลือกทัวร์/เอเยนต์/รถยนต์ (Manage Options)</span>
                </label>
              </div>
            </div>

            {staffError && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-600">
                {staffError}
              </div>
            )}

            <button
              type="submit"
              disabled={!canAddStaff}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center justify-center gap-1 disabled:opacity-50"
              id="btn-add-user"
            >
              <UserPlus className="w-4 h-4" />
              {editingUser ? 'บันทึกการแก้ไขพนักงาน' : 'เพิ่มพนักงานเข้าสู่ระบบ'}
            </button>

            {editingUser && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 mt-1"
              >
                ยกเลิกการแก้ไข / Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Existing Accounts List */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-4">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4.5 h-4.5 text-emerald-600" />
                บัญชีผู้ใช้ในระบบทั้งหมด / Registered Users
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                รายชื่อพนักงาน แอดมิน และผู้จัดการพร้อมสรุปสิทธิ์อนุญาตเข้าถึง
              </p>
            </div>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
              {users.length} บัญชี
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left text-slate-600 font-sans">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="p-2 w-8 text-center bg-slate-200/50">#</th>
                  <th className="p-2">ชื่อผู้ใช้ (Username)</th>
                  <th className="p-2">ระดับ / Role</th>
                  <th className="p-2">รหัสผ่าน / Pass</th>
                  <th className="p-2">แก้ไขวอเชอร์</th>
                  <th className="p-2">ลบวอเชอร์</th>
                  <th className="p-2">เพิ่มพนักงาน</th>
                  <th className="p-2">จัดการตัวเลือก</th>
                  <th className="p-2 text-center w-20">เครื่องมือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {users.map((u, index) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-2 text-center bg-slate-50 text-slate-400 font-mono font-bold">{index + 1}</td>
                    <td className="p-2 font-bold text-slate-900">{u.username}</td>
                    <td className="p-2">
                      <span className={`inline-flex px-2 py-0.2 text-[10px] font-bold rounded uppercase ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-800'
                          : u.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-slate-500">{u.password || '******'}</td>
                    <td className="p-2 font-bold text-center">
                      <span className={u.permissions.canEditVoucher ? 'text-emerald-600' : 'text-slate-300'}>
                        {u.permissions.canEditVoucher ? 'Yes ✓' : 'No ✗'}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-center">
                      <span className={u.permissions.canDeleteVoucher ? 'text-emerald-600' : 'text-slate-300'}>
                        {u.permissions.canDeleteVoucher ? 'Yes ✓' : 'No ✗'}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-center">
                      <span className={u.permissions.canAddStaff ? 'text-emerald-600' : 'text-slate-300'}>
                        {u.permissions.canAddStaff ? 'Yes ✓' : 'No ✗'}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-center">
                      <span className={u.permissions.canManageOptions ? 'text-emerald-600' : 'text-slate-300'}>
                        {u.permissions.canManageOptions ? 'Yes ✓' : 'No ✗'}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEditUser(u)}
                          disabled={!canAddStaff}
                          className={`p-1 rounded transition-all ${
                            canAddStaff 
                              ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer' 
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                          title="แก้ไขสิทธิ์และรหัสพนักงาน"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {canAddStaff && u.id !== currentUser.id && (
                          <button
                            onClick={() => {
                              if (window.confirm(`ยืนยันการลบบัญชีผู้ใช้ "${u.username}"?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title="ลบบัญชีผู้ใช้งาน"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: MANAGE SYSTEM OPTIONS (ทัวร์, เอเยนต์, รถรับ, รถส่ง) */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl shadow-teal-900/10 space-y-5">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-4.5 h-4.5 text-emerald-600" />
            การตั้งค่าและแก้ไขตัวเลือกระบบในฟอร์ม / Configure Selectable Form Options
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            แก้ไข เพิ่ม ลบ รายชื่อโปรแกรมทัวร์ พันธมิตรเอเยนต์ และชื่อรถรับ-ส่งในบริษัทของคุณ
          </p>
        </div>

        {/* 4 Lists Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* TOUR PROGRAMS COLUMN */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-800">1. โปรแกรมทัวร์ (Tour Programs)</span>
            
            <form onSubmit={handleAddTour} className="flex gap-1">
              <input
                type="text"
                placeholder="เพิ่มชื่อทัวร์ใหม่"
                value={newTour}
                onChange={(e) => setNewTour(e.target.value)}
                disabled={!canManageOptions}
                className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <button 
                type="submit" 
                disabled={!canManageOptions}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                +
              </button>
            </form>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {options.tourPrograms.map((p, idx) => (
                <div key={idx} className="bg-white px-2 py-1.5 border border-slate-150 rounded text-xs flex justify-between items-center group">
                  <span className="font-medium text-slate-700 truncate mr-2" title={p}>{p}</span>
                  {canManageOptions && options.tourPrograms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('tour', p)}
                      className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AGENTS COLUMN */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-800">2. ชื่อเอเยนต์ / วอคอิน</span>
            
            <form onSubmit={handleAddAgent} className="flex gap-1">
              <input
                type="text"
                placeholder="เพิ่มเอเยนต์ใหม่"
                value={newAgent}
                onChange={(e) => setNewAgent(e.target.value)}
                disabled={!canManageOptions}
                className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <button 
                type="submit" 
                disabled={!canManageOptions}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                +
              </button>
            </form>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {options.agents.map((a, idx) => (
                <div key={idx} className="bg-white px-2 py-1.5 border border-slate-150 rounded text-xs flex justify-between items-center group">
                  <span className="font-medium text-slate-700 truncate mr-2" title={a}>{a}</span>
                  {canManageOptions && options.agents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('agent', a)}
                      className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PICKUP CARS COLUMN */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-800">3. ชื่อรถรับ (Pickup Cars)</span>
            
            <form onSubmit={handleAddPickupCar} className="flex gap-1">
              <input
                type="text"
                placeholder="เพิ่มรถรับใหม่"
                value={newPickupCar}
                onChange={(e) => setNewPickupCar(e.target.value)}
                disabled={!canManageOptions}
                className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <button 
                type="submit" 
                disabled={!canManageOptions}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                +
              </button>
            </form>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {options.pickupCars.map((car, idx) => (
                <div key={idx} className="bg-white px-2 py-1.5 border border-slate-150 rounded text-xs flex justify-between items-center group">
                  <span className="font-medium text-slate-700 truncate mr-2" title={car}>{car}</span>
                  {canManageOptions && options.pickupCars.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('pickup', car)}
                      className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DROPOFF CARS COLUMN */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold text-slate-800">4. ชื่อรถส่ง (Dropoff Cars)</span>
            
            <form onSubmit={handleAddDropoffCar} className="flex gap-1">
              <input
                type="text"
                placeholder="เพิ่มรถส่งใหม่"
                value={newDropoffCar}
                onChange={(e) => setNewDropoffCar(e.target.value)}
                disabled={!canManageOptions}
                className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <button 
                type="submit" 
                disabled={!canManageOptions}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                +
              </button>
            </form>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {options.dropoffCars.map((car, idx) => (
                <div key={idx} className="bg-white px-2 py-1.5 border border-slate-150 rounded text-xs flex justify-between items-center group">
                  <span className="font-medium text-slate-700 truncate mr-2" title={car}>{car}</span>
                  {canManageOptions && options.dropoffCars.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem('dropoff', car)}
                      className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
