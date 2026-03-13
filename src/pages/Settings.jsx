import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { AlertCircle, Settings as SettingsIcon, Users, Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Star, Download } from "lucide-react";

export default function Settings({ user }) {
  const [activeTab, setActiveTab] = useState('users');
  const [userTypeTab, setUserTypeTab] = useState('admins');
  const [adminSubTab, setAdminSubTab] = useState('supreme');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [selectedAudits, setSelectedAudits] = useState([]);
  const [auditLimit, setAuditLimit] = useState(50);
  const [auditPage, setAuditPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPassword, setShowPassword] = useState({});

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'isf',
    isf_name: '',
    cisf_name: '',
    scsc_name: '',
    has_atestate_role: false,
    has_dre_role: false
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'users') {
        loadUsers();
      } else if (activeTab === 'audit') {
        loadAuditLogs();
      }
    }
  }, [user, activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllUsers();
      
      // Sort users: bogdan.petru first, dan.barbut second, georgiana.ghimes third, then daniel.bulearca, then florin.hritcu, then other admins, then by role
      const sortedUsers = data.sort((a, b) => {
        // Bogdan Petru is always first
        if (a.email === 'bogdan.petru@sigurantaferoviara.ro') return -1;
        if (b.email === 'bogdan.petru@sigurantaferoviara.ro') return 1;
        
        // Dan Barbut is second
        if (a.email === 'dan.barbut@sigurantaferoviara.ro') return -1;
        if (b.email === 'dan.barbut@sigurantaferoviara.ro') return 1;
        
        // Georgiana is third
        if (a.email === 'georgiana.ghimes@sigurantaferoviara.ro') return -1;
        if (b.email === 'georgiana.ghimes@sigurantaferoviara.ro') return 1;
        
        // Daniel is fourth
        if (a.email === 'daniel.bulearca@sigurantaferoviara.ro') return -1;
        if (b.email === 'daniel.bulearca@sigurantaferoviara.ro') return 1;
        
        // Florin is fifth
        if (a.email === 'florin.hritcu@sigurantaferoviara.ro') return -1;
        if (b.email === 'florin.hritcu@sigurantaferoviara.ro') return 1;
        
        // Then other admins
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        
        // Then by role
        const roleOrder = { admin: 0, cisf: 1, isf: 2, scsc: 3 };
        return roleOrder[a.role] - roleOrder[b.role];
      });
      
      setUsers(sortedUsers);
    } catch (error) {
      showNotification('error', 'Eroare la încărcarea utilizatorilor');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const offset = (auditPage - 1) * auditLimit;
      const data = await apiClient.getAuditLogs({ limit: auditLimit, offset });
      setAuditLogs(data.logs);
      setAuditTotal(data.total);
      setSelectedAudits([]);
    } catch (error) {
      showNotification('error', 'Eroare la încărcarea jurnalului de audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [auditLimit, auditPage]);

  const handleDeleteSelectedAudits = async () => {
    if (!confirm(`Sigur doriți să ștergeți ${selectedAudits.length} înregistrări selectate?`)) return;
    
    try {
      await apiClient.deleteAudits(selectedAudits);
      showNotification('success', `${selectedAudits.length} înregistrări șterse`);
      loadAuditLogs();
    } catch (error) {
      showNotification('error', 'Eroare la ștergerea înregistrărilor');
    }
  };

  const toggleAuditSelection = (id) => {
    setSelectedAudits(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllAudits = () => {
    if (selectedAudits.length === auditLogs.length) {
      setSelectedAudits([]);
    } else {
      setSelectedAudits(auditLogs.map(log => log.id));
    }
  };

  const formatAuditDetails = (log) => {
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      
      switch (log.action_type) {
        case 'CREATE_LIST':
        case 'CREATE_LISTA':
          return details.numar_lista ? `Nr. Comisie: ${details.numar_lista}` : '-';
        
        case 'CREATE_ATESTAT':
          return details.numar_atestat_format || details.numar_atestat 
            ? `Nr. Atestat: ${details.numar_atestat_format || details.numar_atestat}` 
            : '-';
        
        case 'CREATE_USER':
          return details.email ? `User: ${details.email}` : '-';
        
        case 'UPDATE_USER':
          return details.updated_email ? `User: ${details.updated_email}` : '-';
        
        case 'UPDATE_LIST_STATUS':
          return details.numar_lista && details.new_status 
            ? `${details.numar_lista}, Status: ${details.new_status}` 
            : '-';
        
        case 'UPDATE_ATESTAT_STATUS':
          return details.numar_atestat_format && details.new_status 
            ? `${details.numar_atestat_format}, Status: ${details.new_status}` 
            : '-';
        
        case 'UPDATE_STATUS':
          // Legacy support for old UPDATE_STATUS entries
          if (log.entity_type === 'liste_tiparire') {
            return details.numar_lista && details.new_status 
              ? `${details.numar_lista}, Status: ${details.new_status}` 
              : '-';
          } else if (log.entity_type === 'atestate') {
            return details.numar_atestat_format && details.new_status 
              ? `${details.numar_atestat_format}, Status: ${details.new_status}` 
              : '-';
          }
          return '-';
        
        case 'DELETE_LIST':
        case 'DELETE_LISTA':
          return details.numar_lista ? `Nr. Comisie: ${details.numar_lista}` : '-';
        
        case 'DELETE_ATESTAT':
          return details.numar_atestat_format || details.numar_atestat 
            ? `Nr. Atestat: ${details.numar_atestat_format || details.numar_atestat}` 
            : '-';
        
        case 'DELETE_USER':
          return details.deleted_email ? `User: ${details.deleted_email}` : '-';
        
        case 'LOGIN':
        case 'LOGOUT':
          return '-';
        
        default:
          return '-';
      }
    } catch (error) {
      console.error('Error formatting audit details:', error);
      return '-';
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await apiClient.createUser(newUser);
      showNotification('success', 'Utilizator adăugat cu succes!');
      setNewUser({ email: '', password: '', role: 'isf', isf_name: '', cisf_name: '', scsc_name: '', has_atestate_role: false, has_dre_role: false });
      setShowAddForm(false);
      loadUsers();
    } catch (error) {
      showNotification('error', error.message || 'Eroare la adăugarea utilizatorului');
    }
  };

  const handleUpdateUser = async (id) => {
    try {
      const updateData = {
        email: editingUser.email,
        role: editingUser.role,
        isf_name: editingUser.isf_name,
        cisf_name: editingUser.cisf_name,
        scsc_name: editingUser.scsc_name,
        has_atestate_role: editingUser.has_atestate_role,
        has_dre_role: editingUser.has_dre_role
      };
      if (editingUser.password) {
        updateData.password = editingUser.password;
      }
      await apiClient.updateUser(id, updateData);
      showNotification('success', 'Utilizator actualizat cu succes!');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      showNotification('error', error.message || 'Eroare la actualizarea utilizatorului');
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (!confirm(`Sigur doriți să ștergeți utilizatorul ${email}?`)) return;
    try {
      await apiClient.deleteUser(id);
      showNotification('success', 'Utilizator șters cu succes!');
      loadUsers();
    } catch (error) {
      showNotification('error', error.message || 'Eroare la ștergerea utilizatorului');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">Acces neautorizat. Doar administratorii pot accesa setările.</p>
        </div>
      </div>
    );
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    cisf: 'bg-blue-100 text-blue-800',
    isf: 'bg-amber-100 text-amber-800',
    scsc: 'bg-green-100 text-green-800'
  };

  const roleLabels = {
    admin: 'Administrator',
    cisf: 'CISF',
    isf: 'ISF',
    scsc: 'SCSC'
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Setări & Administrare</h1>
        </div>
        <p className="text-gray-500 text-sm">Gestionare utilizatori și configurare sistem</p>
      </div>

      {notification && (
        <div className={`mb-6 flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Utilizatori
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Jurnal Audit
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Add User Form */}
          {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Adaugă Utilizator Nou</h2>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Parolă *</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rol *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="isf">ISF</option>
                <option value="cisf">CISF</option>
                <option value="scsc">SCSC</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            {(newUser.role === 'isf' || newUser.role === 'cisf' || newUser.role === 'scsc') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nume ISF/CISF/SCSC *</label>
                <input
                  type="text"
                  value={newUser.role === 'isf' ? newUser.isf_name : newUser.role === 'cisf' ? newUser.cisf_name : newUser.scsc_name}
                  onChange={(e) => {
                    if (newUser.role === 'isf') {
                      setNewUser({ ...newUser, isf_name: e.target.value, cisf_name: '', scsc_name: '' });
                    } else if (newUser.role === 'cisf') {
                      setNewUser({ ...newUser, cisf_name: e.target.value, isf_name: '', scsc_name: '' });
                    } else if (newUser.role === 'scsc') {
                      setNewUser({ ...newUser, scsc_name: e.target.value, isf_name: '', cisf_name: '' });
                    }
                  }}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`ex: ${newUser.role === 'isf' ? 'ISF București' : newUser.role === 'cisf' ? 'CISF București' : 'SCSC București'}`}
                />
              </div>
            )}
            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUser.has_atestate_role}
                  onChange={(e) => setNewUser({ ...newUser, has_atestate_role: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">Are și rol de Atestate</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUser.has_dre_role}
                  onChange={(e) => setNewUser({ ...newUser, has_dre_role: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">Are și rol de DRE</span>
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adaugă Utilizator
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Utilizatori ({users.length})</h2>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Adaugă Utilizator
            </button>
          )}
        </div>

        {/* User Type Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setUserTypeTab('admins')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                userTypeTab === 'admins'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Administratori ({users.filter(u => u.role === 'admin').length})
            </button>
            <button
              onClick={() => setUserTypeTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                userTypeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Utilizatori ({users.filter(u => u.role !== 'admin').length})
            </button>
          </nav>
        </div>

        {/* Admin Sub-Tabs */}
        {userTypeTab === 'admins' && (
          <>
            <div className="border-b border-gray-100 px-6 bg-gray-50">
              <nav className="-mb-px flex space-x-6">
                <button
                  onClick={() => setAdminSubTab('supreme')}
                  className={`py-3 px-1 border-b-2 font-medium text-xs transition-colors flex items-center gap-1.5 ${
                    adminSubTab === 'supreme'
                      ? 'border-yellow-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${adminSubTab === 'supreme' ? 'text-yellow-500 fill-yellow-500' : 'fill-current'}`} />
                  Administratori Supremi ({users.filter(u => 
                    u.role === 'admin' && 
                    (u.email === 'bogdan.petru@sigurantaferoviara.ro' || 
                     u.email === 'dan.barbut@sigurantaferoviara.ro' || 
                     u.email === 'georgiana.ghimes@sigurantaferoviara.ro')
                  ).length})
                </button>
                <button
                  onClick={() => setAdminSubTab('regular')}
                  className={`py-3 px-1 border-b-2 font-medium text-xs transition-colors ${
                    adminSubTab === 'regular'
                      ? 'border-purple-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Administratori ({users.filter(u => 
                    u.role === 'admin' && 
                    u.email !== 'bogdan.petru@sigurantaferoviara.ro' && 
                    u.email !== 'dan.barbut@sigurantaferoviara.ro' && 
                    u.email !== 'georgiana.ghimes@sigurantaferoviara.ro'
                  ).length})
                </button>
              </nav>
            </div>
            
            {/* Admin Description */}
            <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              {adminSubTab === 'supreme' ? (
                <p className="text-xs text-gray-600">
                  Administratorii supremi au acces complet la întregul sistem, inclusiv gestionarea tuturor utilizatorilor și setărilor.
                </p>
              ) : (
                <p className="text-xs text-gray-600">
                  Administratorii au acces la zonele care le sunt atribuite (Liste, Atestate, DRE).
                </p>
              )}
            </div>
          </>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ISF / CISF / SCSC</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Atestate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">DRE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parolă</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Creat La</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users
                  .filter(u => {
                    if (userTypeTab === 'admins') {
                      if (u.role !== 'admin') return false;
                      const isSupreme = u.email === 'bogdan.petru@sigurantaferoviara.ro' || 
                                       u.email === 'dan.barbut@sigurantaferoviara.ro' || 
                                       u.email === 'georgiana.ghimes@sigurantaferoviara.ro';
                      return adminSubTab === 'supreme' ? isSupreme : !isSupreme;
                    }
                    return u.role !== 'admin';
                  })
                  .map((u) => {
                  const isEditing = editingUser?.id === u.id;
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{u.email}</span>
                            {u.email === 'georgiana.ghimes@sigurantaferoviara.ro' ? (
                              <Star className="w-4 h-4 text-cyan-500 fill-cyan-500" title="Administrator Suprem & Developer" />
                            ) : (u.email === 'bogdan.petru@sigurantaferoviara.ro' || 
                                  u.email === 'dan.barbut@sigurantaferoviara.ro') && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" title="Administrator Suprem" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="isf">ISF</option>
                            <option value="cisf">CISF</option>
                            <option value="scsc">SCSC</option>
                            <option value="admin">Administrator</option>
                          </select>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColors[u.role]}`}>
                              {roleLabels[u.role]}
                            </span>
                            {u.email === 'georgiana.ghimes@sigurantaferoviara.ro' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                                DEV
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing && editingUser.role === 'isf' ? (
                          <input
                            type="text"
                            value={editingUser.isf_name || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, isf_name: e.target.value })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-full"
                          />
                        ) : isEditing && editingUser.role === 'cisf' ? (
                          <input
                            type="text"
                            value={editingUser.cisf_name || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, cisf_name: e.target.value })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-full"
                          />
                        ) : isEditing && editingUser.role === 'scsc' ? (
                          <input
                            type="text"
                            value={editingUser.scsc_name || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, scsc_name: e.target.value })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-full"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{u.isf_name || u.cisf_name || u.scsc_name || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editingUser.has_atestate_role || false}
                            onChange={(e) => setEditingUser({ ...editingUser, has_atestate_role: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm">
                            {u.has_atestate_role ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">Da</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editingUser.has_dre_role || false}
                            onChange={(e) => setEditingUser({ ...editingUser, has_dre_role: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-sm">
                            {u.has_dre_role ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Da</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="password"
                            value={editingUser.password || ''}
                            onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                            placeholder="Lasă gol pentru a păstra parola"
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-full"
                          />
                        ) : (
                          <span className="text-sm text-gray-400">••••••••</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateUser(u.id)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                              title="Salvează"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
                              title="Anulează"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {/* Only super admins can edit admins, everyone can edit non-admins */}
                            {((user.email === 'bogdan.petru@sigurantaferoviara.ro' || 
                               user.email === 'dan.barbut@sigurantaferoviara.ro' || 
                               user.email === 'georgiana.ghimes@sigurantaferoviara.ro') || 
                              u.role !== 'admin') && (
                              <button
                                onClick={() => setEditingUser({ ...u, password: '', isf_name: u.isf_name || '', cisf_name: u.cisf_name || '', scsc_name: u.scsc_name || '', has_atestate_role: u.has_atestate_role || false, has_dre_role: u.has_dre_role || false })}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                title="Editează"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {/* Only super admins can delete admins, and no one can delete themselves */}
                            {u.id !== user.id && (
                              (user.email === 'bogdan.petru@sigurantaferoviara.ro' || 
                               user.email === 'dan.barbut@sigurantaferoviara.ro' || 
                               user.email === 'georgiana.ghimes@sigurantaferoviara.ro') ? (
                                // Super admins can delete anyone except themselves
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                  title="Șterge"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : u.role !== 'admin' ? (
                                // Other admins can only delete non-admin users
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                  title="Șterge"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : null
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      ) : (
        /* Audit Log Tab */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Jurnal Audit ({auditTotal})</h2>
              <p className="text-xs text-gray-400 mt-0.5">Toate acțiunile importante din aplicație</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedAudits.length > 0 && (
                <button
                  onClick={handleDeleteSelectedAudits}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Șterge ({selectedAudits.length}) Audituri
                </button>
              )}
              <button
                onClick={() => {
                  const headers = ["Data & Ora", "Utilizator", "Acțiune", "Entitate", "Detalii"];
                  const rows = auditLogs.map((log) => [
                    new Date(log.created_at).toLocaleString('ro-RO', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }),
                    log.user_email,
                    log.action_type,
                    log.entity_type,
                    formatAuditDetails(log)
                  ]);
                  const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
                  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-semibold">Vizualizează:</label>
              <select
                value={auditLimit}
                onChange={(e) => {
                  setAuditLimit(parseInt(e.target.value));
                  setAuditPage(1);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 intrări</option>
                <option value={50}>50 intrări</option>
                <option value={100}>100 intrări</option>
                <option value={500}>500 intrări</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                disabled={auditPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-600">
                Pagina {auditPage} din {Math.ceil(auditTotal / auditLimit)}
              </span>
              <button
                onClick={() => setAuditPage(p => p + 1)}
                disabled={auditPage >= Math.ceil(auditTotal / auditLimit)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Următor
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedAudits.length === auditLogs.length && auditLogs.length > 0}
                        onChange={toggleAllAudits}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data & Ora</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Utilizator</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acțiune</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entitate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Detalii</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                        Nu există înregistrări în jurnalul de audit.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedAudits.includes(log.id)}
                            onChange={() => toggleAuditSelection(log.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString('ro-RO', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{log.user_email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.entity_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatAuditDetails(log)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
