import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Key, Trash2, Edit2, CheckCircle2,
  AlertTriangle, RefreshCw, X, Check, Lock, UserCheck, ShieldAlert
} from 'lucide-react';
import { UserAccount, AdminUser } from '../../types.ts';

interface UsersManagementSectionProps {
  token: string;
  currentUser: AdminUser;
  onStatusMessage: (text: string, type?: 'success' | 'error') => void;
}

export const UsersManagementSection: React.FC<UsersManagementSectionProps> = ({
  token,
  currentUser,
  onStatusMessage,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for adding/editing user
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<UserAccount | null>(null);
  const [showResetModal, setShowResetModal] = useState<UserAccount | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<UserAccount | null>(null);

  // Add form fields
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'coordinador' | 'academico' | 'prensa'>('coordinador');

  // Edit form fields
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'coordinador' | 'academico' | 'prensa'>('coordinador');

  // Reset password field
  const [resetNewPassword, setResetNewPassword] = useState('');

  const authFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        onStatusMessage(data.error || 'Error al cargar lista de usuarios', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message || 'Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newDisplayName.trim() || !newPassword.trim()) {
      onStatusMessage('Por favor completa todos los campos del usuario.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      onStatusMessage('La contraseña debe tener mínimo 6 caracteres.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          display_name: newDisplayName.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onStatusMessage('Usuario creado exitosamente.');
        setShowAddModal(false);
        setNewUsername('');
        setNewDisplayName('');
        setNewPassword('');
        setNewRole('coordinador');
        await loadUsers();
      } else {
        onStatusMessage(data.error || 'Error al crear usuario', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${showEditModal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          display_name: editDisplayName.trim(),
          role: editRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onStatusMessage('Datos de usuario actualizados correctamente.');
        setShowEditModal(null);
        await loadUsers();
      } else {
        onStatusMessage(data.error || 'Error al actualizar usuario', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;
    if (!resetNewPassword || resetNewPassword.length < 6) {
      onStatusMessage('La contraseña debe tener mínimo 6 caracteres.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${showResetModal.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: resetNewPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onStatusMessage(`Contraseña de ${showResetModal.username} restablecida con éxito.`);
        setShowResetModal(null);
        setResetNewPassword('');
      } else {
        onStatusMessage(data.error || 'Error al restablecer contraseña', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteCandidate) return;
    if (deleteCandidate.id === currentUser.id) {
      onStatusMessage('No puedes eliminar tu propia cuenta en sesión.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${deleteCandidate.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onStatusMessage('Usuario eliminado correctamente.');
        setDeleteCandidate(null);
        await loadUsers();
      } else {
        onStatusMessage(data.error || 'Error al eliminar usuario', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
      case 'superadmin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Administrador</span>
          </span>
        );
      case 'coordinador':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
            Coordinación
          </span>
        );
      case 'academico':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
            Académico
          </span>
        );
      case 'prensa':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
            Prensa & Medios
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <span>Gestión de Usuarios y Perfiles de Acceso</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {users.length} {users.length === 1 ? 'Usuario' : 'Usuarios'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Administra las cuentas del equipo organizador de BIMUN, roles de seguridad y contraseñas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            title="Recargar usuarios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm shadow-amber-600/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Usuario / Nombre</th>
                <th className="py-3 px-4 font-bold">Rol de Acceso</th>
                <th className="py-3 px-4 font-bold">Fecha de Alta</th>
                <th className="py-3 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {u.display_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{u.display_name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Tu sesión
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditModal(u);
                            setEditDisplayName(u.display_name);
                            setEditRole(u.role as any);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-700 transition-colors"
                          title="Editar rol y nombre"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowResetModal(u);
                            setResetNewPassword('');
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 transition-colors"
                          title="Restablecer contraseña"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(u)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-rose-400 border border-slate-700 hover:border-rose-800/60 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE USER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-display text-base font-bold text-white">Nuevo Usuario del Sistema</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ej. Juan Pérez (Secretario Académico)"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre de Usuario (Login)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ej. juan.perez"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Contraseña Inicial
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Rol y Permisos
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="admin">Administrador (Acceso Total + Usuarios + Base de Datos + SMTP)</option>
                  <option value="coordinador">Coordinador (Inscripciones, Delegaciones, Comisiones)</option>
                  <option value="academico">Académico (Comisiones, Documentos y Cronograma)</option>
                  <option value="prensa">Prensa & Comunicaciones (Noticias y Galería)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-display text-base font-bold text-white">Editar Usuario @{showEditModal.username}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre para Mostrar
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Rol de Acceso
                </label>
                <select
                  value={editRole}
                  disabled={showEditModal.id === currentUser.id}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="admin">Administrador</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="academico">Académico</option>
                  <option value="prensa">Prensa & Comunicaciones</option>
                </select>
                {showEditModal.id === currentUser.id && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    No puedes alterar tu propio rol de administrador en sesión.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Actualizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-display text-base font-bold text-white">
                  Restablecer Contraseña
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Asigna una nueva clave para el usuario <strong className="text-white">@{showResetModal.username}</strong> ({showResetModal.display_name}):
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar Cambio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl max-w-sm w-full border border-rose-800/80 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-display text-base font-bold text-white">¿Eliminar Usuario?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la cuenta de <strong className="text-white">@{deleteCandidate.username}</strong> ({deleteCandidate.display_name})? Esta acción no se puede deshacer.
            </p>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
