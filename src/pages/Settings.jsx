import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { AlertCircle, Settings as SettingsIcon, Users, Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Star } from "lucide-react";

export default function Settings({ user }) {
  const [users, setUsers] = useState([]);
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
    has_atestate_role: false
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllUsers();
      
      // Sort users: georgiana.ghimes first, then other admins, then by role
      const sortedUsers = data.sort((a, b) => {
        // Georgiana is always first
        if (a.email === 'georgiana.ghimes@sigurantaferoviara.ro') return -1;
        if (b.email === 'georgiana.ghimes@sigurantaferoviara.ro') return 1;
        
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

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await apiClient.createUser(newUser);
      showNotification('success', 'Utilizator adăugat cu succes!');
      setNewUser({ email: '', password: '', role: 'isf', isf_name: '', cisf_name: '', scsc_name: '', has_atestate_role: false });
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
        has_atestate_role: editingUser.has_atestate_role
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
        <h1 className="text-2xl font-bold text-gray-900">Setări & Administrare</h1>
        <p className="text-gray-500 mt-1 text-sm">Gestionare utilizatori și configurare sistem</p>
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
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUser.has_atestate_role}
                  onChange={(e) => setNewUser({ ...newUser, has_atestate_role: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">Are și rol de Atestate</span>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Creat La</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const isEditing = editingUser?.id === u.id;
                  return (
                    <tr key={u.id} className={`transition-colors ${
                      u.role === 'admin' ? 'bg-purple-50/30 hover:bg-purple-50/50' : 'hover:bg-gray-50/50'
                    }`}>
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
                            {u.email === 'georgiana.ghimes@sigurantaferoviara.ro' && (
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColors[u.role]}`}>
                            {roleLabels[u.role]}
                          </span>
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
                            {/* Only georgiana.ghimes can edit admins, everyone can edit non-admins */}
                            {(user.email === 'georgiana.ghimes@sigurantaferoviara.ro' || u.role !== 'admin') && (
                              <button
                                onClick={() => setEditingUser({ ...u, password: '', isf_name: u.isf_name || '', cisf_name: u.cisf_name || '', scsc_name: u.scsc_name || '', has_atestate_role: u.has_atestate_role || false })}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                title="Editează"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {/* Only georgiana.ghimes can delete admins, and no one can delete themselves */}
                            {u.id !== user.id && (
                              user.email === 'georgiana.ghimes@sigurantaferoviara.ro' ? (
                                // Georgiana can delete anyone except herself
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
    </div>
  );
}
