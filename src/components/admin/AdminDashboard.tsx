import React, { useState, useEffect } from 'react';
import {
  Shield, Globe, Settings, Users, BookOpen, FileText, Calendar,
  Image, Newspaper, UserCheck, Key, Database, LogOut, Plus, Trash2,
  Edit2, Copy, Check, X, RefreshCw, Download, AlertCircle, Eye, EyeOff,
  Sparkles, RotateCcw, Mail, Lock, Images, Tag, SlidersHorizontal,
  CheckSquare, Square, Clock
} from 'lucide-react';
import { ImageUploadField } from '../common/ImageUploadField.tsx';
import { VideoUploadField } from '../common/VideoUploadField.tsx';
import { DatabaseSettingsSection } from './DatabaseSettingsSection.tsx';
import { SmtpSettingsSection } from './SmtpSettingsSection.tsx';
import { UsersManagementSection } from './UsersManagementSection.tsx';
import { AboutCardItem } from './AboutCardItem.tsx';
import { AboutEditModal } from './AboutEditModal.tsx';
import { GalleryBatchUploadModal } from './GalleryBatchUploadModal.tsx';
import { GalleryCategoryManagerModal } from './GalleryCategoryManagerModal.tsx';
import { ConfirmDeleteModal } from './ConfirmDeleteModal.tsx';
import { EditionsAndBackupsSection } from './EditionsAndBackupsSection.tsx';
import {
  BIMUNSettings, Committee, Country, Delegation, ScheduleItem,
  DocumentItem, GalleryItem, TeamMember, NewsItem, Registration,
  AboutSection, AdminUser
} from '../../types.ts';

interface AdminDashboardProps {
  token: string;
  user: AdminUser;
  onLogout: () => void;
  onReturnToPublic: () => void;
  onDataUpdated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  user,
  onLogout,
  onReturnToPublic,
  onDataUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'settings' | 'committees' | 'delegations' | 'registrations' | 'about' | 'schedule' | 'documents' | 'gallery' | 'team' | 'news' | 'users' | 'security' | 'editions'
  >('overview');

  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<BIMUNSettings | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [editingCommittee, setEditingCommittee] = useState<Partial<Committee> | null>(null);
  const [editingCountry, setEditingCountry] = useState<Partial<Country> | null>(null);
  const [editingDelegation, setEditingDelegation] = useState<Partial<Delegation> | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchCommitteeId, setBatchCommitteeId] = useState('');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [editingDoc, setEditingDoc] = useState<Partial<DocumentItem> | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Partial<ScheduleItem> | null>(null);
  const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);
  const [galleryCategories, setGalleryCategories] = useState<string[]>([
    'Debate', 'Protocolo', 'Negociación', 'Crisis', 'Premiación', 'Campus', 'Social', 'Inauguración', 'Clausura'
  ]);
  const [galleryCategoryCounts, setGalleryCategoryCounts] = useState<Record<string, number>>({});
  const [batchUploadModalOpen, setBatchUploadModalOpen] = useState(false);
  const [categoryManagerModalOpen, setCategoryManagerModalOpen] = useState(false);
  const [selectedGalleryCategoryFilter, setSelectedGalleryCategoryFilter] = useState<string>('all');
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const [isRestoringGallery, setIsRestoringGallery] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Partial<TeamMember> | null>(null);
  const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmClearModalOpen, setConfirmClearModalOpen] = useState(false);
  const [confirmReloadModalOpen, setConfirmReloadModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [securityAudit, setSecurityAudit] = useState<{ is_using_default_password: boolean; has_custom_jwt_secret: boolean } | null>(null);

  // About tab state
  const [editingAbout, setEditingAbout] = useState<Partial<AboutSection> | null>(null);
  const [savingAboutId, setSavingAboutId] = useState<string | null>(null);
  const [isSavingAboutModal, setIsSavingAboutModal] = useState(false);
  const [isRestoringAbout, setIsRestoringAbout] = useState(false);
  const [confirmResetAboutModalOpen, setConfirmResetAboutModalOpen] = useState(false);

  // Global delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    itemName?: string;
    description?: string;
    confirmButtonText?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Institutional content permissions: Admin, Superadmin, Coordinador, Academico
  const canEditAbout = user.role === 'admin' || user.role === 'superadmin' || user.role === 'coordinador' || user.role === 'academico';

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      onLogout();
      throw new Error('Sesión expirada');
    }
    return res;
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        settRes,
        comRes,
        cntRes,
        delRes,
        regRes,
        abtRes,
        schRes,
        docRes,
        galRes,
        galCatsRes,
        tmRes,
        nwRes,
      ] = await Promise.all([
        authFetch('/api/admin/stats'),
        authFetch('/api/admin/settings'),
        authFetch('/api/admin/committees'),
        authFetch('/api/admin/countries'),
        authFetch('/api/admin/delegations'),
        authFetch('/api/admin/registrations'),
        authFetch('/api/admin/about'),
        authFetch('/api/admin/schedule'),
        authFetch('/api/admin/documents'),
        authFetch('/api/admin/gallery'),
        authFetch('/api/admin/gallery/categories'),
        authFetch('/api/admin/team'),
        authFetch('/api/admin/news'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (settRes.ok) setSettings(await settRes.json());
      if (comRes.ok) setCommittees(await comRes.json());
      if (cntRes.ok) setCountries(await cntRes.json());
      if (delRes.ok) setDelegations(await delRes.json());
      if (regRes.ok) setRegistrations(await regRes.json());
      if (abtRes.ok) setAboutSections(await abtRes.json());
      if (schRes.ok) setSchedule(await schRes.json());
      if (docRes.ok) setDocuments(await docRes.json());
      if (galRes.ok) setGallery(await galRes.json());
      if (galCatsRes.ok) {
        const catData = await galCatsRes.json();
        if (catData && catData.categories) {
          setGalleryCategories(catData.categories);
          if (catData.categoryCounts) {
            setGalleryCategoryCounts(catData.categoryCounts);
          }
        }
      }
      if (tmRes.ok) setTeam(await tmRes.json());
      if (nwRes.ok) setNews(await nwRes.json());

      // Fetch security audit for current logged in user
      try {
        const auditRes = await authFetch('/api/auth/security-audit');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (auditData && auditData.audit) {
            setSecurityAudit(auditData.audit);
          }
        }
      } catch (e) {
        // silent audit error
      }
    } catch (err: any) {
      showStatus(err.message || 'Error al cargar datos administrativos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showStatus('Configuración general y secciones guardadas correctamente.');
        onDataUpdated();
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Toggle Section
  const toggleSection = (sectionKey: keyof BIMUNSettings['active_sections']) => {
    if (!settings) return;
    const updated = {
      ...settings,
      active_sections: {
        ...settings.active_sections,
        [sectionKey]: !settings.active_sections[sectionKey],
      },
    };
    setSettings(updated);
  };

  // Committee Actions
  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommittee) return;
    const isNew = !editingCommittee.id;
    const url = isNew ? '/api/admin/committees' : `/api/admin/committees/${editingCommittee.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(editingCommittee),
      });
      if (res.ok) {
        showStatus(`Comisión ${isNew ? 'creada' : 'actualizada'} exitosamente.`);
        setEditingCommittee(null);
        loadAllAdminData();
        onDataUpdated();
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleDuplicateCommittee = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/committees/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        showStatus('Comisión duplicada exitosamente.');
        loadAllAdminData();
        onDataUpdated();
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleDeleteCommittee = (id: string, name?: string) => {
    const committeeName = name || committees.find((c) => c.id === id)?.name || id;
    setDeleteConfirmation({
      isOpen: true,
      title: '¿Eliminar Comisión?',
      itemName: committeeName,
      description: 'Se eliminará esta comisión y se borrarán automáticamente todas las asignaciones y cupos de delegación asociados a ella.',
      onConfirm: async () => {
        setIsDeletingItem(true);
        try {
          const res = await authFetch(`/api/admin/committees/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setCommittees((prev) => prev.filter((c) => c.id !== id));
            showStatus('Comisión eliminada con éxito.');
            setDeleteConfirmation(null);
            await loadAllAdminData();
            onDataUpdated();
          } else {
            const data = await res.json().catch(() => ({}));
            showStatus(data.error || 'Error al eliminar la comisión', 'error');
          }
        } catch (err: any) {
          showStatus(err.message, 'error');
        } finally {
          setIsDeletingItem(false);
        }
      },
    });
  };

  // Country Actions
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;
    const isNew = !editingCountry.id;
    const url = isNew ? '/api/admin/countries' : `/api/admin/countries/${editingCountry.id}`;
    try {
      const res = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(editingCountry),
      });
      if (res.ok) {
        showStatus(`País ${isNew ? 'registrado' : 'actualizado'}.`);
        setEditingCountry(null);
        loadAllAdminData();
        onDataUpdated();
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleDeleteCountry = (id: string, name?: string) => {
    const countryName = name || countries.find((c) => c.id === id)?.name || id;
    setDeleteConfirmation({
      isOpen: true,
      title: '¿Eliminar País del Catálogo?',
      itemName: countryName,
      description: 'Esta acción removerá el país del catálogo de delegaciones. Si ya estaba asignado a algún cupo, podría afectar la visualización.',
      onConfirm: async () => {
        setIsDeletingItem(true);
        try {
          const res = await authFetch(`/api/admin/countries/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setCountries((prev) => prev.filter((c) => c.id !== id));
            showStatus('País eliminado del catálogo.');
            setDeleteConfirmation(null);
            await loadAllAdminData();
            onDataUpdated();
          } else {
            const data = await res.json().catch(() => ({}));
            showStatus(data.error || 'Error al eliminar el país', 'error');
          }
        } catch (err: any) {
          showStatus(err.message, 'error');
        } finally {
          setIsDeletingItem(false);
        }
      },
    });
  };

  // Delegation Actions
  const handleSaveDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelegation) return;
    const isNew = !editingDelegation.id;
    const url = isNew ? '/api/admin/delegations' : `/api/admin/delegations/${editingDelegation.id}`;
    try {
      const res = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(editingDelegation),
      });
      if (res.ok) {
        showStatus('Delegación guardada exitosamente.');
        setEditingDelegation(null);
        loadAllAdminData();
        onDataUpdated();
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleDeleteDelegation = (id: string, info?: string) => {
    setDeleteConfirmation({
      isOpen: true,
      title: '¿Eliminar Cupo de Delegación?',
      itemName: info || `Cupo de Delegación #${id}`,
      description: 'El cupo de delegación y su asignación actual serán removidos definitivamente.',
      onConfirm: async () => {
        setIsDeletingItem(true);
        try {
          const res = await authFetch(`/api/admin/delegations/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setDelegations((prev) => prev.filter((d) => d.id !== id));
            showStatus('Delegación eliminada.');
            setDeleteConfirmation(null);
            await loadAllAdminData();
            onDataUpdated();
          } else {
            const data = await res.json().catch(() => ({}));
            showStatus(data.error || 'Error al eliminar cupo de delegación', 'error');
          }
        } catch (err: any) {
          showStatus(err.message, 'error');
        } finally {
          setIsDeletingItem(false);
        }
      },
    });
  };

  const handleBatchGenerateSlots = async () => {
    if (!batchCommitteeId) {
      showStatus('Por favor selecciona una comisión', 'error');
      return;
    }
    try {
      const countryIds = countries.map((c) => c.id);
      const res = await authFetch('/api/admin/delegations/batch-slots', {
        method: 'POST',
        body: JSON.stringify({ committee_id: batchCommitteeId, country_ids: countryIds }),
      });
      const data = await res.json();
      if (res.ok) {
        showStatus(data.message || 'Cupos generados con éxito.');
        setBatchModalOpen(false);
        loadAllAdminData();
        onDataUpdated();
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Registration Actions
  const handleDeleteRegistration = (id: string, name?: string) => {
    setDeleteConfirmation({
      isOpen: true,
      title: '¿Eliminar Inscripción?',
      itemName: name || `Inscripción #${id}`,
      description: 'Esta postulación y todos sus datos asociados serán eliminados permanentemente del sistema.',
      onConfirm: async () => {
        setIsDeletingItem(true);
        try {
          const res = await authFetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setRegistrations((prev) => prev.filter((r) => r.id !== id));
            if (selectedReg?.id === id) setSelectedReg(null);
            showStatus('Inscripción eliminada.');
            setDeleteConfirmation(null);
            await loadAllAdminData();
            onDataUpdated();
          } else {
            showStatus('Error al eliminar inscripción', 'error');
          }
        } catch (err: any) {
          showStatus(err.message, 'error');
        } finally {
          setIsDeletingItem(false);
        }
      },
    });
  };

  const handleUpdateRegStatus = async (
    id: string,
    status: 'approved' | 'assigned' | 'rejected' | 'pending',
    assignedCommitteeId?: string,
    assignedCountryId?: string
  ) => {
    try {
      const res = await authFetch(`/api/admin/registrations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          assigned_committee_id: assignedCommitteeId || '',
          assigned_country_id: assignedCountryId || '',
        }),
      });
      if (res.ok) {
        showStatus(`Inscripción marcada como ${status}.`);
        loadAllAdminData();
        onDataUpdated();
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showStatus('Contraseña actualizada con éxito.');
        setCurrentPassword('');
        setNewPassword('');
        // Refresh security audit state
        try {
          const auditRes = await authFetch('/api/auth/security-audit');
          if (auditRes.ok) {
            const auditData = await auditRes.json();
            if (auditData && auditData.audit) {
              setSecurityAudit(auditData.audit);
            }
          }
        } catch {
          // ignore
        }
      } else {
        showStatus(data.error || 'Error al cambiar contraseña', 'error');
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Comprehensive Backup Export
  const handleExportBackup = async () => {
    try {
      showStatus('Generando respaldo integral de base de datos...');
      const res = await authFetch('/api/admin/backups/export');
      if (!res.ok) throw new Error('Error al generar respaldo en el servidor');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const editionTag = (settings?.edition || 'BIMUN').replace(/\s+/g, '_');
      a.download = `${editionTag}_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      showStatus('Respaldo integral de base de datos y multimedia descargado.', 'success');
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Clear Test Data (Admin Only)
  const handleClearTestData = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/system/clear-test-data', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showStatus('Datos de prueba eliminados exitosamente. Sistema listo y limpio.');
        setConfirmClearModalOpen(false);
        await loadAllAdminData();
        onDataUpdated();
      } else {
        showStatus(data.error || 'Error al limpiar datos de prueba', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reload Seed Demo Data (Admin Only)
  const handleLoadSeedData = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/system/load-seed-data', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showStatus('Datos de prueba oficiales de BIMUN cargados exitosamente.');
        setConfirmReloadModalOpen(false);
        await loadAllAdminData();
        onDataUpdated();
      } else {
        showStatus(data.error || 'Error al cargar datos de prueba', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Default Demo Gallery
  const handleResetDefaultGallery = async () => {
    setIsRestoringGallery(true);
    try {
      const res = await authFetch('/api/admin/gallery/reset-defaults', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        if (data.gallery) {
          setGallery(data.gallery);
        }
        if (data.categories) {
          setGalleryCategories(data.categories);
        }
        setSelectedGalleryCategoryFilter('all');
        setSelectedGalleryIds([]);
        showStatus('Galería y categorías de demostración restauradas exitosamente.');
        await loadAllAdminData();
        onDataUpdated();
      } else {
        showStatus(data.error || 'Error al restaurar fotografías de demostración', 'error');
      }
    } catch (err: any) {
      showStatus(err.message || 'Error de conexión', 'error');
    } finally {
      setIsRestoringGallery(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-white tracking-wide">
                BIMUN CMS
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Colegio Bilingüe
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Conectado como: <strong className="text-slate-200">{user.display_name}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onReturnToPublic}
            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Sitio Web Público</span>
          </button>

          {(user.role === 'admin' || user.role === 'superadmin') && (
            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700"
              title="Exportar respaldo JSON para migración o backup"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Backup DB</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Status toast */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50'
              : 'bg-rose-950 text-rose-200 border-rose-500/50'
          }`}
        >
          {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main CMS Container: Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-800/80 p-4 space-y-1 shrink-0 overflow-y-auto max-h-[calc(100vh-57px)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">
            Módulos del Sistema
          </div>

          {[
            { id: 'overview', label: 'Resumen y Métricas', icon: Shield },
            { id: 'settings', label: 'Evento y Secciones', icon: Settings },
            { id: 'committees', label: 'Comisiones', icon: BookOpen, badge: committees.length },
            { id: 'delegations', label: 'Países y Cupos', icon: Globe, badge: delegations.length },
            { id: 'registrations', label: 'Inscripciones', icon: UserCheck, badge: registrations.filter((r) => r.status === 'pending').length },
            { id: 'about', label: 'Nosotros / MUN', icon: FileText, badge: aboutSections.length },
            { id: 'schedule', label: 'Cronograma', icon: Calendar },
            { id: 'documents', label: 'Documentos', icon: FileText, badge: documents.length },
            { id: 'gallery', label: 'Galería de Fotos', icon: Image, badge: gallery.length },
            { id: 'team', label: 'Comité Organizador', icon: Users, badge: team.length },
            { id: 'news', label: 'Noticias y Avisos', icon: Newspaper, badge: news.length },
            ...(user.role === 'admin' || user.role === 'superadmin'
              ? [
                  { id: 'editions', label: 'Ciclo Anual & Respaldos', icon: Sparkles },
                  { id: 'users', label: 'Usuarios y Perfiles', icon: UserCheck },
                  { id: 'security', label: 'Seguridad & Servidores', icon: Database },
                ]
              : []),
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-blue-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-[calc(100vh-57px)] bg-slate-900">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Panel de Control BIMUN</h2>
                  <p className="text-xs text-slate-400">
                    Resumen general de comisiones, delegaciones asignadas e inscripciones escolares.
                  </p>
                </div>
                <button
                  onClick={loadAllAdminData}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 text-slate-200 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar Datos</span>
                </button>
              </div>

              {/* Production Security Alert (Shown if using default credentials or default secret in production) */}
              {securityAudit?.is_using_default_password && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <span>Aviso de Seguridad: Contraseña por Defecto Detectada</span>
                      </h4>
                      <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                        Tu cuenta de administrador está usando actualmente la clave inicial por defecto asignada durante la instalación. Al estar la plataforma en producción, te recomendamos cambiarla de inmediato por una clave personalizada para blindar el acceso.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 transition-colors shadow-sm"
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Comisiones</span>
                  <p className="text-3xl font-extrabold text-white font-display">{committees.length}</p>
                  <span className="text-[11px] text-slate-400">Activas en el modelo</span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Cupos Disponibles</span>
                  <p className="text-3xl font-extrabold text-white font-display">
                    {delegations.filter((d) => d.status === 'available').length}
                  </p>
                  <span className="text-[11px] text-slate-400">De {delegations.length} configurados</span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Inscripciones Pendientes</span>
                  <p className="text-3xl font-extrabold text-white font-display">
                    {registrations.filter((r) => r.status === 'pending').length}
                  </p>
                  <span className="text-[11px] text-slate-400">Por revisar y asignar</span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Países Soberanos</span>
                  <p className="text-3xl font-extrabold text-white font-display">{countries.length}</p>
                  <span className="text-[11px] text-slate-400">En catálogo oficial</span>
                </div>
              </div>

              {/* Recent Registrations Table */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-white">Últimas Inscripciones Recibidas</h3>
                  <button
                    onClick={() => setActiveTab('registrations')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Ver todas ({registrations.length})
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 uppercase text-[10px] text-slate-500 font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Participante</th>
                        <th className="py-2.5 px-3">Colegio</th>
                        <th className="py-2.5 px-3">Comisión Deseada</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {registrations.slice(0, 5).map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-medium text-white">{reg.full_name}</td>
                          <td className="py-2.5 px-3 text-slate-400">{reg.school}</td>
                          <td className="py-2.5 px-3 text-blue-300">{reg.committee_preference_1 || 'Cualquiera'}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                reg.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : reg.status === 'assigned'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {reg.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedReg(reg);
                                setActiveTab('registrations');
                              }}
                              className="text-[11px] text-blue-400 hover:underline font-semibold"
                            >
                              Revisar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Admin Test Data Banner */}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Puesta a Punto del Sistema
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        ¿Listo para iniciar inscripciones reales? Puedes vaciar los registros de prueba o recargarlos en cualquier momento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmClearModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpiar Datos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReloadModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cargar Demo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SETTINGS & MENU */}
          {activeTab === 'settings' && settings && (
            <div className="max-w-4xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="font-display text-2xl font-bold text-white">Configuración del Evento y Menú</h2>
                <p className="text-xs text-slate-400">
                  Modifica textos de la portada Hero, información de la institución y activa o desactiva secciones públicas.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Maintenance Mode configuration */}
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Modo Mantenimiento de la Plataforma
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Activa este interruptor para restringir el acceso del público general y mostrar un comunicado de mantenimiento temporal. El CMS seguirá siendo accesible.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border ${
                        settings.maintenance_mode
                          ? 'bg-rose-950/60 text-rose-300 border-rose-700/60 shadow-lg shadow-rose-950/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${settings.maintenance_mode ? 'bg-rose-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span>{settings.maintenance_mode ? 'Mantenimiento Activo' : 'Mantenimiento Desactivado'}</span>
                    </button>
                  </div>

                  {settings.maintenance_mode && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Mensaje Informativo de Mantenimiento para los Visitantes
                      </label>
                      <textarea
                        rows={3}
                        value={settings.maintenance_message || ''}
                        onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                        placeholder="Ej: Nuestra plataforma está experimentando una actualización de servidores para la XXVII edición de BIMUN. Estaremos de vuelta muy pronto. Gracias por tu paciencia."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-rose-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500">
                        Este mensaje se renderizará de forma destacada en la pantalla de mantenimiento que verán las delegaciones e invitados públicos.
                      </p>
                    </div>
                  )}
                </div>

                {/* Active sections toggle */}
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Control de Secciones del Menú Público (Activar / Desactivar)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {Object.entries(settings.active_sections || {}).map(([key, val]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => toggleSection(key as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all ${
                          val
                            ? 'bg-blue-950/60 text-blue-300 border-blue-700/60'
                            : 'bg-slate-900/50 text-slate-500 border-slate-800'
                        }`}
                      >
                        <span>{key}</span>
                        {val ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hero & General Info */}
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Información Principal del Hero
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Nombre del Modelo</label>
                      <input
                        type="text"
                        value={settings.bimun_name}
                        onChange={(e) => setSettings({ ...settings, bimun_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Edición</label>
                        <input
                          type="text"
                          value={settings.bimun_edition}
                          onChange={(e) => setSettings({ ...settings, bimun_edition: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Años de Tradición</label>
                        <input
                          type="number"
                          min="1"
                          value={settings.tradition_years || '27'}
                          onChange={(e) => setSettings({ ...settings, tradition_years: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs text-slate-400">Lema / Slogan</label>
                      <input
                        type="text"
                        value={settings.slogan}
                        onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    {/* Fechas Oficiales y Sesión Inaugural Card */}
                    <div className="sm:col-span-2 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                              Fechas Oficiales y Sesión Inaugural
                            </label>
                            <p className="text-[11px] text-slate-400">
                              Configura el calendario oficial y la hora exacta de apertura. El reloj del Hero se adaptará automáticamente.
                            </p>
                          </div>
                        </div>

                        {/* Live Countdown Badge Preview */}
                        {(() => {
                          const startDate = settings.start_date || (typeof settings.event_dates_iso === 'object' ? settings.event_dates_iso?.start : '') || '2026-10-23';
                          const timeStr = settings.inauguration_time || '08:30';
                          const [y, m, d] = startDate.split('-').map(Number);
                          const [hh, mm] = timeStr.split(':').map(Number);
                          const target = new Date(y, (m || 1) - 1, d || 1, hh || 8, mm || 30, 0);
                          const diff = target.getTime() - Date.now();
                          const isPast = diff <= 0;
                          
                          if (isPast) {
                            return (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs shrink-0">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span className="font-semibold">¡Evento en desarrollo!</span>
                              </div>
                            );
                          }
                          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          return (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-300 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span className="font-medium text-[11px]">Hero Inaugural:</span>
                              <span className="font-mono font-bold text-white text-[11px]">{days}d {hours}h restantes</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 3 Interactive Date & Time Pickers */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            Fecha de Inicio (Inauguración)
                          </label>
                          <input
                            type="date"
                            value={settings.start_date || (typeof settings.event_dates_iso === 'object' ? settings.event_dates_iso?.start : '') || '2026-10-23'}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              const currentEnd = settings.end_date || (typeof settings.event_dates_iso === 'object' ? settings.event_dates_iso?.end : '') || newStart;
                              setSettings({
                                ...settings,
                                start_date: newStart,
                                event_dates_iso: { start: newStart, end: currentEnd }
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-blue-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500">Primer día de la conferencia.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            Fecha de Cierre (Clausura)
                          </label>
                          <input
                            type="date"
                            value={settings.end_date || (typeof settings.event_dates_iso === 'object' ? settings.event_dates_iso?.end : '') || '2026-10-25'}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              const currentStart = settings.start_date || (typeof settings.event_dates_iso === 'object' ? settings.event_dates_iso?.start : '') || newEnd;
                              setSettings({
                                ...settings,
                                end_date: newEnd,
                                event_dates_iso: { start: currentStart, end: newEnd }
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-blue-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500">Día final y premiación.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Hora de Sesión Inaugural
                          </label>
                          <input
                            type="time"
                            value={settings.inauguration_time || '08:30'}
                            onChange={(e) => setSettings({ ...settings, inauguration_time: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-500 focus:outline-none"
                          />
                          <p className="text-[10px] text-slate-500">Hora del acto solemne (ej: 08:30 AM).</p>
                        </div>
                      </div>

                      {/* Display Text with Auto-Generate Helper */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300">
                            Texto Visible de Fechas (Público en Hero y Cabecera)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const s = settings.start_date || (typeof settings.event_dates_iso === 'object' ? settings.event_dates_iso?.start : '') || '2026-10-23';
                              const e = settings.end_date || (typeof settings.event_dates_iso === 'object' ? settings.event_dates_iso?.end : '') || '2026-10-25';
                              const [sY, sM, sD] = s.split('-').map(Number);
                              const [eY, eM, eD] = e.split('-').map(Number);
                              const months = [
                                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                              ];
                              let suggested = '';
                              if (s === e) {
                                suggested = `${sD} de ${months[(sM || 1) - 1]} de ${sY}`;
                              } else if (sY === eY && sM === eM) {
                                suggested = `${sD} al ${eD} de ${months[(sM || 1) - 1]} de ${sY}`;
                              } else if (sY === eY) {
                                suggested = `${sD} de ${months[(sM || 1) - 1]} al ${eD} de ${months[(eM || 1) - 1]} de ${sY}`;
                              } else {
                                suggested = `${sD} de ${months[(sM || 1) - 1]} de ${sY} al ${eD} de ${months[(eM || 1) - 1]} de ${eY}`;
                              }
                              setSettings({ ...settings, event_date_display: suggested });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Auto-generar texto sugerido
                          </button>
                        </div>
                        <input
                          type="text"
                          value={settings.event_date_display || ''}
                          onChange={(e) => setSettings({ ...settings, event_date_display: e.target.value })}
                          placeholder="Ej: 23 al 25 de Octubre de 2026"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-blue-500 focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Lugar / Sede</label>
                      <input
                        type="text"
                        value={settings.venue}
                        onChange={(e) => setSettings({ ...settings, venue: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Ciudad / Ubicación</label>
                      <input
                        type="text"
                        value={settings.venue_city}
                        onChange={(e) => setSettings({ ...settings, venue_city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                      {/* Official BIMUN Logo Setting with Live Navbar Preview */}
                    <div className="space-y-4 sm:col-span-2 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                            Logotipo Oficial de la Barra de Navegación y Cabecera
                          </label>
                          <p className="text-[11px] text-slate-400">
                            Sube la imagen oficial (PNG transparente, SVG o JPG) y ajusta su escala preservando sus proporciones.
                          </p>
                        </div>
                        {settings.logo_url && (
                          <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-semibold">Vista Previa</span>
                              <span className="text-[10px] text-blue-400 font-mono font-bold">
                                {Number(settings.logo_size) || 56}px
                              </span>
                            </div>
                            <div
                              style={{
                                width: `${Math.min(64, Math.max(36, Number(settings.logo_size) || 56))}px`,
                                height: `${Math.min(64, Math.max(36, Number(settings.logo_size) || 56))}px`,
                              }}
                              className="rounded-full aspect-square bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 p-0.5 shadow-md flex items-center justify-center transition-all duration-200 overflow-hidden"
                            >
                              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
                                <img
                                  src={settings.logo_url}
                                  alt="Preview"
                                  className="w-full h-full object-cover rounded-full"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Custom Size Controls */}
                      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                            <span>Tamaño del Logotipo en Cabecera</span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800">
                              {Number(settings.logo_size) || 56} px
                            </span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[
                              { label: 'Compacto (44px)', val: 44 },
                              { label: 'Normal (56px)', val: 56 },
                              { label: 'Grande (68px)', val: 68 },
                              { label: 'Extra Grande (84px)', val: 84 },
                            ].map((preset) => (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() => setSettings({ ...settings, logo_size: preset.val })}
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                  (Number(settings.logo_size) || 56) === preset.val
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                                }`}
                              >
                                {preset.label.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                          <span className="text-[10px] text-slate-500 font-mono">36px (Mín)</span>
                          <input
                            type="range"
                            min="36"
                            max="96"
                            step="2"
                            value={Number(settings.logo_size) || 56}
                            onChange={(e) => setSettings({ ...settings, logo_size: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                          <span className="text-[10px] text-slate-500 font-mono">96px (Máx)</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Desliza o haz clic en los botones para agrandar o achicar el logotipo. Conserva 100% sus proporciones ópticas sin deformarse.
                        </p>
                      </div>

                      <ImageUploadField
                        label="Cargar Imagen o Pegar Enlace del Logotipo"
                        value={settings.logo_url}
                        onChange={(val) => setSettings({ ...settings, logo_url: val })}
                        helperText="Recomendado: Imagen cuadrada o logo horizontal de hasta 800x800 px (PNG transparente preferido)"
                        aspectRatio="square"
                        maxDimensions={{ width: 800, height: 800 }}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <ImageUploadField
                        label="Imagen de Fondo de la Portada (Hero Banner)"
                        value={settings.hero_bg_image}
                        onChange={(val) => setSettings({ ...settings, hero_bg_image: val })}
                        helperText="Fotografía panorámica de apertura, sede o delegados en plenaria"
                        aspectRatio="banner"
                        maxDimensions={{ width: 1920, height: 1080 }}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <VideoUploadField
                        label="Video de Fondo de la Portada (Hero Video)"
                        value={settings.hero_video_url || ''}
                        onChange={(val) => setSettings({ ...settings, hero_video_url: val })}
                        helperText="Video corto en loop para el fondo (se reproduce en silencio automáticamente). Priorizando optimización, se sugiere un video ligero."
                        maxSizeMb={5}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs text-slate-400">Texto Secundario Hero</label>
                      <textarea
                        rows={2}
                        value={settings.hero_subtext}
                        onChange={(e) => setSettings({ ...settings, hero_subtext: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Settings */}
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Datos Institucionales y Contacto
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Dirección Física</label>
                      <input
                        type="text"
                        value={settings.contact_address || ''}
                        onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                        placeholder="Ej: Calle 16 # 19E-45"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Correo Contacto</label>
                      <input
                        type="email"
                        value={settings.contact_email}
                        onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Teléfono</label>
                      <input
                        type="text"
                        value={settings.contact_phone}
                        onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Instagram URL</label>
                      <input
                        type="text"
                        value={settings.instagram_url}
                        onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/30"
                  >
                    Guardar Cambios de Configuración
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: COMMITTEES */}
          {activeTab === 'committees' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Administración de Comisiones</h2>
                  <p className="text-xs text-slate-400">
                    Crea, edita, duplica, desactiva o elimina comisiones de debate y sus mesas directivas.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingCommittee({
                      code: '',
                      name: '',
                      abbreviation: '',
                      description: '',
                      language: 'Español',
                      topic_a: '',
                      topic_b: '',
                      topic_c: '',
                      president_name: '',
                      vicepresident_name: '',
                      status: 'active',
                      sort_order: committees.length + 1,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Comisión</span>
                </button>
              </div>

              {/* Committees List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {committees.map((com) => (
                  <div
                    key={com.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-300">
                            {com.abbreviation}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">{com.language}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            com.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {com.status}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-white leading-snug">{com.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{com.description}</p>
                      <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <strong className="text-amber-300">Topic A:</strong> {com.topic_a}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Pres: <strong className="text-slate-200">{com.president_name || 'Sin asignar'}</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDuplicateCommittee(com.id)}
                          title="Duplicar comisión"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCommittee(com)}
                          title="Editar"
                          className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCommittee(com.id, `${com.abbreviation} - ${com.name}`)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DELEGATIONS & COUNTRIES */}
          {activeTab === 'delegations' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Países y Cupos de Delegaciones</h2>
                  <p className="text-xs text-slate-400">
                    Administra la relación Comisión ↔ País/Delegación ↔ Delegado.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditingCountry({
                        name: '',
                        official_name: '',
                        code: '',
                        flag_emoji: '🏳️',
                        additional_info: '',
                        status: 'active',
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
                  >
                    + Nuevo País
                  </button>

                  <button
                    onClick={() => setBatchModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Generar Cupos en Lote
                  </button>

                  <button
                    onClick={() =>
                      setEditingDelegation({
                        committee_id: committees[0]?.id || '',
                        country_id: countries[0]?.id || '',
                        delegate_name: '',
                        delegate_school: '',
                        status: 'available',
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider"
                  >
                    + Asignar Delegación
                  </button>
                </div>
              </div>

              {/* Delegations Table */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 uppercase text-[10px] text-slate-400 font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">País</th>
                        <th className="py-3 px-4">Comisión</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Delegado Asignado</th>
                        <th className="py-3 px-4">Colegio</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {delegations.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-900/50">
                          <td className="py-3 px-4">
                            <span className="mr-2 text-base">{d.flag_emoji || '🏳️'}</span>
                            <span className="font-semibold text-white">{d.country_name}</span>{' '}
                            <span className="text-[10px] text-slate-500 font-mono">({d.country_code})</span>
                          </td>
                          <td className="py-3 px-4 text-blue-400 font-medium">{d.committee_abbr || d.committee_name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                d.status === 'assigned'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {d.status === 'assigned' ? 'Asignado' : 'Disponible'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-200">{d.delegate_name || '-'}</td>
                          <td className="py-3 px-4 text-slate-400">{d.delegate_school || '-'}</td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => setEditingDelegation(d)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDelegation(d.id, `${d.country_name} en ${d.committee_abbr || d.committee_name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-900 text-rose-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REGISTRATIONS */}
          {activeTab === 'registrations' && (
            <div className="space-y-6 max-w-6xl">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="font-display text-2xl font-bold text-white">Postulaciones e Inscripciones</h2>
                <p className="text-xs text-slate-400">
                  Revisa las inscripciones enviadas a través de la web y asígnales comisiones y países.
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 uppercase text-[10px] text-slate-400 font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Participante</th>
                        <th className="py-3 px-4">Contacto</th>
                        <th className="py-3 px-4">Colegio / Modalidad</th>
                        <th className="py-3 px-4">Preferencias</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {registrations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-900/50">
                          <td className="py-3 px-4">
                            <p className="font-bold text-white">{r.full_name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">{r.id}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p>{r.email}</p>
                            <span className="text-slate-500">{r.phone}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-200">{r.school}</p>
                            <span className="text-[10px] uppercase text-slate-500">{r.delegation_type} • {r.grade || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-4 space-y-0.5">
                            <p className="text-blue-300 font-medium">1. {r.committee_preference_1 || 'Sin preferir'}</p>
                            {r.country_preference_1 && (
                              <p className="text-amber-300/80 text-[11px]">País: {r.country_preference_1}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 space-y-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                r.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : r.status === 'assigned'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {r.status}
                            </span>
                            {r.payment_receipt && (
                              <span className="block text-[9px] font-semibold text-emerald-400">
                                📎 Comprobante adjunto
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedReg(r)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold"
                            >
                              Gestionar
                            </button>
                            <button
                              onClick={() => handleDeleteRegistration(r.id, `${r.full_name} (${r.school})`)}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-rose-400"
                              title="Eliminar inscripción"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ABOUT INSTITUTIONAL */}
          {activeTab === 'about' && (
            <div className="space-y-6 max-w-5xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl font-bold text-white">Contenido Institucional / Nosotros</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {aboutSections.length} {aboutSections.length === 1 ? 'sección' : 'secciones'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Gestiona los textos institucionales, metodología parlamentaria (THIMUN/ONU), objetivos formativos, historia y misión/visión del Modelo.
                  </p>
                </div>

                {canEditAbout && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmResetAboutModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                      title="Restablece los 6 textos oficiales redactados para el BIMUN"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      Restablecer Oficiales
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingAbout({
                          title: '',
                          subtitle: '',
                          section_key: '',
                          icon: 'Globe',
                          content: '',
                          sort_order: (aboutSections.length + 1) * 1,
                          is_active: 1,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm shadow-blue-600/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nueva Sección
                    </button>
                  </div>
                )}
              </div>

              {/* Roles & Permissions Explanation Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">Matriz de Acceso y Perfiles:</span>
                      {canEditAbout ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Acceso de Edición Habilitado ({user.role})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Solo Lectura ({user.role})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      • <strong className="text-slate-300">Admin y Superadmin:</strong> Control absoluto de edición, creación, publicación y restablecimiento de fábrica.<br />
                      • <strong className="text-slate-300">Coordinador:</strong> Redacción institucional, presentación del evento y coordinación general.<br />
                      • <strong className="text-slate-300">Académico:</strong> Rigor metodológico, protocolo de debate (THIMUN/ONU), competencias pedagógicas y objetivos.<br />
                      • <strong className="text-slate-300">Prensa:</strong> Perfil de solo lectura (su gestión está focalizada en Noticias, Galería y Boletines).
                    </p>
                  </div>
                </div>
              </div>

              {/* Empty State */}
              {aboutSections.length === 0 && (
                <div className="p-10 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="font-display text-base font-bold text-white">No hay secciones institucionales registradas</h3>
                    <p className="text-xs text-slate-400">
                      La tabla institucional se encuentra vacía. Puedes restaurar instantáneamente los 6 contenidos oficiales redactados para el BIMUN.
                    </p>
                  </div>
                  {canEditAbout && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsRestoringAbout(true);
                          try {
                            const res = await authFetch('/api/admin/about/reset-defaults', { method: 'POST' });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Error al restablecer');
                            if (data.sections) {
                              setAboutSections(data.sections);
                            }
                            showStatus('Secciones oficiales cargadas exitosamente');
                            await loadAllAdminData();
                            onDataUpdated();
                          } catch (err: any) {
                            showStatus(err.message, 'error');
                          } finally {
                            setIsRestoringAbout(false);
                          }
                        }}
                        disabled={isRestoringAbout}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRestoringAbout ? 'animate-spin' : ''}`} />
                        {isRestoringAbout ? 'Cargando...' : 'Cargar 6 Secciones Oficiales por Defecto'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingAbout({
                            title: '',
                            subtitle: '',
                            section_key: '',
                            icon: 'Globe',
                            content: '',
                            sort_order: 1,
                            is_active: 1,
                          })
                        }
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                      >
                        Crear Sección Manualmente
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Section Cards List */}
              <div className="space-y-4">
                {aboutSections.map((sec) => (
                  <AboutCardItem
                    key={sec.id}
                    section={sec}
                    canEdit={canEditAbout}
                    isSaving={savingAboutId === sec.id}
                    onSave={async (updated) => {
                      if (!sec.id) return;
                      setSavingAboutId(sec.id);
                      try {
                        const res = await authFetch(`/api/admin/about/${sec.id}`, {
                          method: 'PUT',
                          body: JSON.stringify(updated),
                        });
                        if (!res.ok) {
                          const data = await res.json();
                          throw new Error(data.error || 'Error al guardar');
                        }
                        showStatus(`Sección "${updated.title || sec.title}" guardada.`);
                        await loadAllAdminData();
                        onDataUpdated();
                      } catch (err: any) {
                        showStatus(err.message, 'error');
                      } finally {
                        setSavingAboutId(null);
                      }
                    }}
                    onEditModal={() => setEditingAbout({ ...sec })}
                    onDelete={() => {
                      setDeleteConfirmation({
                        isOpen: true,
                        title: '¿Eliminar Sección Institucional?',
                        itemName: sec.title,
                        description: `Se eliminará permanentemente la sección "${sec.title}" (${sec.section_key}) del portal de información.`,
                        onConfirm: async () => {
                          setIsDeletingItem(true);
                          try {
                            const res = await authFetch(`/api/admin/about/${sec.id}`, { method: 'DELETE' });
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}));
                              throw new Error(data.error || 'Error al eliminar');
                            }
                            setAboutSections((prev) => prev.filter((item) => item.id !== sec.id));
                            showStatus(`Sección "${sec.title}" eliminada.`);
                            setDeleteConfirmation(null);
                            await loadAllAdminData();
                            onDataUpdated();
                          } catch (err: any) {
                            showStatus(err.message, 'error');
                          } finally {
                            setIsDeletingItem(false);
                          }
                        },
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Cronograma Oficial</h2>
                  <p className="text-xs text-slate-400">Agrega o modifica los eventos de las jornadas.</p>
                </div>
                <button
                  onClick={() =>
                    setEditingSchedule({
                      day_label: 'Día 1 - Viernes 23 Oct',
                      date: '2026-10-23',
                      time_start: '08:00 AM',
                      time_end: '09:00 AM',
                      activity: '',
                      description: '',
                      location: 'Auditorio Principal',
                      audience: 'Todos los participantes',
                      sort_order: schedule.length + 1,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Evento</span>
                </button>
              </div>

              <div className="space-y-3">
                {schedule.map((sch) => (
                  <div key={sch.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400">{sch.time_start} - {sch.time_end}</span>
                        <span className="text-[10px] uppercase font-semibold text-slate-500">• {sch.day_label}</span>
                      </div>
                      <h4 className="font-display text-sm font-bold text-white">{sch.activity}</h4>
                      <p className="text-xs text-slate-400">{sch.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setDeleteConfirmation({
                            isOpen: true,
                            title: '¿Eliminar Evento del Cronograma?',
                            itemName: `${sch.day_label}: ${sch.activity} (${sch.time_start} - ${sch.time_end})`,
                            description: 'Este evento desaparecerá del cronograma oficial publicado para los asistentes.',
                            onConfirm: async () => {
                              setIsDeletingItem(true);
                              try {
                                const res = await authFetch(`/api/admin/schedule/${sch.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  setSchedule((prev) => prev.filter((s) => s.id !== sch.id));
                                  showStatus('Evento eliminado');
                                  setDeleteConfirmation(null);
                                  await loadAllAdminData();
                                  onDataUpdated();
                                } else {
                                  showStatus('Error al eliminar evento', 'error');
                                }
                              } catch (err: any) {
                                showStatus(err.message, 'error');
                              } finally {
                                setIsDeletingItem(false);
                              }
                            },
                          });
                        }}
                        className="p-1.5 rounded bg-rose-950/60 text-rose-300 hover:bg-rose-900"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Documentos y Guías</h2>
                  <p className="text-xs text-slate-400">Administra los manuales descargables en el portal.</p>
                </div>
                <button
                  onClick={() =>
                    setEditingDoc({
                      title: '',
                      category: 'Protocolo',
                      file_url: '#',
                      description: '',
                      file_size: '1.5 MB',
                      is_featured: 1,
                      sort_order: documents.length + 1,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Documento</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-400">{doc.category}</span>
                      <h4 className="font-display text-sm font-bold text-white">{doc.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{doc.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-mono">{doc.file_size}</span>
                      <button
                        onClick={() => {
                          setDeleteConfirmation({
                            isOpen: true,
                            title: '¿Eliminar Documento o Guía?',
                            itemName: `${doc.title} (${doc.category})`,
                            description: 'Los delegados ya no podrán visualizar ni descargar este documento desde el portal.',
                            onConfirm: async () => {
                              setIsDeletingItem(true);
                              try {
                                const res = await authFetch(`/api/admin/documents/${doc.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                                  showStatus('Documento eliminado');
                                  setDeleteConfirmation(null);
                                  await loadAllAdminData();
                                  onDataUpdated();
                                } else {
                                  showStatus('Error al eliminar documento', 'error');
                                }
                              } catch (err: any) {
                                showStatus(err.message, 'error');
                              } finally {
                                setIsDeletingItem(false);
                              }
                            },
                          });
                        }}
                        className="p-1 rounded text-rose-400 hover:bg-rose-950"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                    <span>Galería de Fotografías</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
                      {gallery.length} {gallery.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Agrega, clasifica por categorías personalizables y administra la cobertura audiovisual de BIMUN.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryManagerModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
                    title="Personalizar categorías de fotos"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gestionar Categorías</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchUploadModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                  >
                    <Images className="w-4 h-4" />
                    <span>Subir Varias Fotos</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRestoringGallery}
                    onClick={() => {
                      setDeleteConfirmation({
                        isOpen: true,
                        title: '¿Cargar Fotografías Oficiales de Demostración?',
                        itemName: '8 fotos y categorías oficiales BIMUN',
                        description: 'Esta acción añadirá las fotografías y temáticas oficiales de muestra a la galería.',
                        confirmButtonText: 'Cargar Fotos Demo',
                        onConfirm: async () => {
                          setDeleteConfirmation(null);
                          await handleResetDefaultGallery();
                        },
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm disabled:opacity-50"
                    title="Restablecer o cargar fotografías oficiales de demostración"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isRestoringGallery ? 'animate-spin' : ''}`} />
                    <span>{isRestoringGallery ? 'Cargando...' : 'Cargar Fotos Demo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingGallery({
                        title: '',
                        caption: '',
                        image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
                        category: galleryCategories[0] || 'Debate',
                        edition: settings?.edition_name || 'BIMUN XXVII',
                        sort_order: gallery.length + 1,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir Individual</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedGalleryCategoryFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    selectedGalleryCategoryFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  Todas ({gallery.length})
                </button>
                {galleryCategories.map((cat) => {
                  const count = gallery.filter((g) => g.category === cat).length;
                  const isActive = selectedGalleryCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedGalleryCategoryFilter(cat)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Batch Selection Toolbar */}
              {gallery.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const visiblePhotos = selectedGalleryCategoryFilter === 'all'
                          ? gallery
                          : gallery.filter((g) => g.category === selectedGalleryCategoryFilter);
                        const visibleIds = visiblePhotos.map((g) => g.id);
                        const allSelected = visibleIds.every((id) => selectedGalleryIds.includes(id));
                        if (allSelected) {
                          setSelectedGalleryIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
                        } else {
                          setSelectedGalleryIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
                        }
                      }}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-white"
                    >
                      {selectedGalleryIds.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Seleccionar visibles</span>
                    </button>

                    {selectedGalleryIds.length > 0 && (
                      <span className="text-blue-400 font-semibold">
                        ({selectedGalleryIds.length} seleccionadas)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedGalleryIds.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedGalleryIds([])}
                          className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          Deseleccionar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmation({
                              isOpen: true,
                              title: `¿Eliminar ${selectedGalleryIds.length} Fotografías?`,
                              itemName: `${selectedGalleryIds.length} fotos seleccionadas`,
                              description: 'Estas fotografías serán eliminadas definitivamente de la galería del portal BIMUN.',
                              onConfirm: async () => {
                                setIsDeletingItem(true);
                                try {
                                  const res = await authFetch('/api/admin/gallery/batch-delete', {
                                    method: 'POST',
                                    body: JSON.stringify({ ids: selectedGalleryIds }),
                                  });
                                  if (res.ok) {
                                    const deletedIds = [...selectedGalleryIds];
                                    setGallery((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
                                    setSelectedGalleryIds([]);
                                    showStatus(`${deletedIds.length} fotos eliminadas`);
                                    setDeleteConfirmation(null);
                                    await loadAllAdminData();
                                    onDataUpdated();
                                  } else {
                                    showStatus('Error al eliminar fotografías seleccionadas', 'error');
                                  }
                                } catch (err: any) {
                                  showStatus(err.message, 'error');
                                } finally {
                                  setIsDeletingItem(false);
                                }
                              },
                            });
                          }}
                          className="px-3 py-1 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600 hover:text-white font-bold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar ({selectedGalleryIds.length})</span>
                        </button>
                      </>
                    )}

                    {gallery.length === 0 && (
                      <button
                        type="button"
                        disabled={isRestoringGallery}
                        onClick={handleResetDefaultGallery}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isRestoringGallery ? 'animate-spin' : ''}`} />
                        <span>{isRestoringGallery ? 'Cargando...' : 'Restaurar Fotos de Ejemplo'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              {(() => {
                const filteredGallery = selectedGalleryCategoryFilter === 'all'
                  ? gallery
                  : gallery.filter((g) => g.category === selectedGalleryCategoryFilter);

                if (filteredGallery.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                        <Images className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">
                          {selectedGalleryCategoryFilter === 'all'
                            ? 'Aún no hay fotografías en la galería'
                            : `No hay fotos en la categoría "${selectedGalleryCategoryFilter}"`}
                        </p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Puedes subir múltiples fotos simultáneamente desde tu equipo o agregar enlaces directos.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setBatchUploadModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow"
                        >
                          <Images className="w-4 h-4" />
                          <span>Subir Fotos en Lote</span>
                        </button>
                        <button
                          type="button"
                          disabled={isRestoringGallery}
                          onClick={handleResetDefaultGallery}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isRestoringGallery ? 'animate-spin' : ''}`} />
                          <span>{isRestoringGallery ? 'Cargando...' : 'Cargar Fotografías de Demostración'}</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredGallery.map((g) => {
                      const isSelected = selectedGalleryIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          className={`relative rounded-xl overflow-hidden bg-slate-950 border transition-all flex flex-col justify-between group ${
                            isSelected ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg' : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2 z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  setSelectedGalleryIds((prev) => prev.filter((id) => id !== g.id));
                                } else {
                                  setSelectedGalleryIds((prev) => [...prev, g.id]);
                                }
                              }}
                              className={`p-1 rounded-md transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow'
                                  : 'bg-slate-900/80 text-slate-400 hover:text-white backdrop-blur-sm'
                              }`}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Action Buttons Top Right */}
                          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setEditingGallery(g)}
                              className="p-1.5 rounded-full bg-slate-900/90 text-slate-200 hover:text-white hover:bg-blue-600 transition-colors shadow"
                              title="Editar detalles de la foto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmation({
                                  isOpen: true,
                                  title: '¿Eliminar Fotografía?',
                                  itemName: g.title,
                                  description: `Esta foto de la categoría "${g.category}" será eliminada de la galería pública.`,
                                  onConfirm: async () => {
                                    setIsDeletingItem(true);
                                    try {
                                      const res = await authFetch(`/api/admin/gallery/${g.id}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        setGallery((prev) => prev.filter((item) => item.id !== g.id));
                                        showStatus('Foto eliminada');
                                        setDeleteConfirmation(null);
                                        await loadAllAdminData();
                                        onDataUpdated();
                                      } else {
                                        showStatus('Error al eliminar foto', 'error');
                                      }
                                    } catch (err: any) {
                                      showStatus(err.message, 'error');
                                    } finally {
                                      setIsDeletingItem(false);
                                    }
                                  },
                                });
                              }}
                              className="p-1.5 rounded-full bg-slate-900/90 text-rose-400 hover:bg-rose-900 transition-colors shadow"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Image Thumbnail */}
                          <div className="relative h-36 w-full bg-black overflow-hidden">
                            <img
                              src={g.image_url}
                              alt={g.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          </div>

                          {/* Details */}
                          <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-bold text-white truncate" title={g.title}>
                                {g.title}
                              </p>
                              {g.caption && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5" title={g.caption}>
                                  {g.caption}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-900">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium truncate max-w-[110px]">
                                {g.category}
                              </span>
                              <span className="text-slate-500 font-mono">{g.edition}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 10: TEAM */}
          {activeTab === 'team' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Comité Organizador</h2>
                  <p className="text-xs text-slate-400">Secretaría General, Dirección Académica y Staff.</p>
                </div>
                <button
                  onClick={() =>
                    setEditingTeam({
                      name: '',
                      role: '',
                      category: 'Secretaría',
                      photo_url: '',
                      bio: '',
                      email: '',
                      sort_order: team.length + 1,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Miembro</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {team.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={t.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                      <div>
                        <h4 className="font-display text-sm font-bold text-white">{t.name}</h4>
                        <span className="text-xs text-blue-400 font-medium">{t.role}</span>
                        <p className="text-[11px] text-slate-400">{t.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDeleteConfirmation({
                          isOpen: true,
                          title: '¿Eliminar Miembro del Comité?',
                          itemName: `${t.name} (${t.role} - ${t.category})`,
                          description: 'Este integrante ya no aparecerá listado en el equipo organizador del portal.',
                          onConfirm: async () => {
                            setIsDeletingItem(true);
                            try {
                              const res = await authFetch(`/api/admin/team/${t.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                setTeam((prev) => prev.filter((item) => item.id !== t.id));
                                showStatus('Miembro eliminado');
                                setDeleteConfirmation(null);
                                await loadAllAdminData();
                                onDataUpdated();
                              } else {
                                showStatus('Error al eliminar miembro', 'error');
                              }
                            } catch (err: any) {
                              showStatus(err.message, 'error');
                            } finally {
                              setIsDeletingItem(false);
                            }
                          },
                        });
                      }}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-950"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: NEWS */}
          {activeTab === 'news' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Noticias y Comunicados</h2>
                  <p className="text-xs text-slate-400">Publica avisos oficiales para participantes y colegios.</p>
                </div>
                <button
                  onClick={() =>
                    setEditingNews({
                      title: '',
                      excerpt: '',
                      content: '',
                      category: 'General',
                      publish_date: new Date().toISOString().split('T')[0],
                      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
                      is_published: 1,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Noticia</span>
                </button>
              </div>

              <div className="space-y-3">
                {news.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-400 uppercase">{item.category} • {item.publish_date}</span>
                      <h4 className="font-display text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.excerpt}</p>
                    </div>
                    <button
                      onClick={() => {
                        setDeleteConfirmation({
                          isOpen: true,
                          title: '¿Eliminar Noticia o Comunicado?',
                          itemName: item.title,
                          description: 'Esta noticia será removida de la sección de comunicados oficiales para participantes.',
                          onConfirm: async () => {
                            setIsDeletingItem(true);
                            try {
                              const res = await authFetch(`/api/admin/news/${item.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                setNews((prev) => prev.filter((n) => n.id !== item.id));
                                showStatus('Noticia eliminada');
                                setDeleteConfirmation(null);
                                await loadAllAdminData();
                                onDataUpdated();
                              } else {
                                showStatus('Error al eliminar noticia', 'error');
                              }
                            } catch (err: any) {
                              showStatus(err.message, 'error');
                            } finally {
                              setIsDeletingItem(false);
                            }
                          },
                        });
                      }}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-950"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 12: SECURITY & DATABASE (ADMIN ONLY) */}
          {activeTab === 'security' && !(user.role === 'admin' || user.role === 'superadmin') && (
            <div className="p-8 rounded-2xl bg-slate-950/80 border border-rose-900/50 text-center space-y-3 max-w-lg mx-auto my-12">
              <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-400 flex items-center justify-center mx-auto border border-rose-800">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Acceso Exclusivo de Administrador</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                El módulo de <strong>Seguridad y Backup</strong> (migración de base de datos, respaldos y servidores de correo) está restringido únicamente al perfil de Administrador del sistema.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Volver al Resumen
              </button>
            </div>
          )}

          {/* TAB 12: SECURITY & DATABASE (ADMIN ONLY) */}
          {activeTab === 'security' && (user.role === 'admin' || user.role === 'superadmin') && (
            <div className="space-y-6 max-w-3xl">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="font-display text-2xl font-bold text-white">Seguridad & Migración de Base de Datos</h2>
                <p className="text-xs text-slate-400">
                  Cambia tus credenciales de acceso administrativo y exporta respaldos completos.
                </p>
              </div>

              {/* Database Dynamic Configuration & Migration */}
              <DatabaseSettingsSection
                token={token}
                onStatusMessage={showStatus}
                onDataUpdated={() => {
                  loadAllAdminData();
                  onDataUpdated();
                }}
              />

              {/* SMTP / Google Workspace Mail Server Configuration (Admin only) */}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <SmtpSettingsSection
                  token={token}
                  onStatusMessage={showStatus}
                />
              )}

              {/* Password update form */}
              <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    <span>Seguridad y Contraseña de Administrador</span>
                  </h3>
                  {securityAudit?.is_using_default_password ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Requiere cambio (Contraseña por defecto)
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Contraseña personalizada protegida
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Contraseña Actual</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Nueva Contraseña (mínimo 8 caracteres)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres alfanuméricos"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Actualizar Contraseña
                </button>
              </form>

              {/* Database Export info */}
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  <span>Respaldo y Compatibilidad Relacional</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Los datos residen en una base de datos relacional SQLite (<code className="text-amber-300 font-mono">bimun_database.sqlite</code>) con integridad referencial (FOREIGN KEYS). Puedes descargar un volcado JSON estructurado para respaldos o para migrar inmediatamente a <strong>PostgreSQL</strong> o <strong>MySQL</strong> en cualquier momento sin perder registros.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleExportBackup}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Backup Completo (JSON)</span>
                  </button>
                </div>
              </div>

              {/* DEMO / TEST DATA MANAGEMENT - EXCLUSIVE FOR ADMIN / SUPERADMIN */}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Gestión de Datos de Prueba (Exclusivo Administrador)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Limpia todo el contenido de prueba para iniciar un evento real, o recarga los datos demostrativos oficiales de BIMUN en cualquier momento.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      Rol: {user.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Clear Test Data Card */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-rose-900/40 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-rose-400">
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Limpiar Datos de Prueba</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Borra inscripciones, comisiones, delegaciones, cronograma, noticias, fotos y documentos de prueba.
                        </p>
                        <p className="text-[10px] text-emerald-400 font-medium">
                          ✓ Conserva tu cuenta de acceso y la configuración institucional (logo, fechas, lema).
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setConfirmClearModalOpen(true)}
                        className="w-full px-4 py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/60 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Vaciar Datos de Prueba</span>
                      </button>
                    </div>

                    {/* Reload Seed Demo Data Card */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-blue-900/40 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-blue-400">
                          <RotateCcw className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Cargar Datos de Demostración</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Restaura el set completo de datos oficiales de BIMUN (comisiones de la ONU, 45 países, cronograma de 3 días, equipo y guías).
                        </p>
                        <p className="text-[10px] text-blue-300 font-medium">
                          ✓ Ideal para probar o capacitar al equipo en cualquier momento.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setConfirmReloadModalOpen(true)}
                        className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Recargar Demostración BIMUN</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 13: USERS & PROFILES MANAGEMENT (ADMIN ONLY) */}
          {activeTab === 'users' && (user.role === 'admin' || user.role === 'superadmin') && (
            <div className="space-y-6 max-w-5xl">
              <UsersManagementSection
                token={token}
                currentUser={user}
                onStatusMessage={showStatus}
              />
            </div>
          )}

          {/* TAB 14: ANNUAL EDITIONS & BACKUPS (ADMIN ONLY) */}
          {activeTab === 'editions' && (user.role === 'admin' || user.role === 'superadmin') && (
            <div className="space-y-6 max-w-5xl">
              <EditionsAndBackupsSection
                token={token}
                settings={settings}
                onStatusMessage={showStatus}
                onDataUpdated={() => {
                  loadAllAdminData();
                  onDataUpdated();
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* COMMITTEE EDIT MODAL */}
      {editingCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">
                {editingCommittee.id ? 'Editar Comisión' : 'Nueva Comisión'}
              </h3>
              <button onClick={() => setEditingCommittee(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommittee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Código Único (ej. UNSC, DISEC)</label>
                  <input
                    type="text"
                    required
                    value={editingCommittee.code || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Sigla (ej. CSNU, AG)</label>
                  <input
                    type="text"
                    required
                    value={editingCommittee.abbreviation || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, abbreviation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-400">Nombre Oficial Completo</label>
                  <input
                    type="text"
                    required
                    value={editingCommittee.name || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-400">Descripción</label>
                  <textarea
                    rows={2}
                    value={editingCommittee.description || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Idioma de la Comisión</label>
                  <select
                    value={editingCommittee.language || 'Español'}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="Español">Español</option>
                    <option value="English">English</option>
                    <option value="Bilingüe (ES/EN)">Bilingüe (ES/EN)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Estado</label>
                  <select
                    value={editingCommittee.status || 'active'}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-400">Tema Principal (Topic A) *</label>
                  <input
                    type="text"
                    required
                    value={editingCommittee.topic_a || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, topic_a: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-400">Segundo Tema (Topic B)</label>
                  <input
                    type="text"
                    value={editingCommittee.topic_b || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, topic_b: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-400">Tercer Tema (Topic C)</label>
                  <input
                    type="text"
                    value={editingCommittee.topic_c || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, topic_c: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <ImageUploadField
                    label="Imagen / Insignia de la Comisión"
                    value={editingCommittee.image_url || ''}
                    onChange={(val) => setEditingCommittee({ ...editingCommittee, image_url: val })}
                    helperText="Escudo del organismo, foto de la asamblea o ilustración"
                    aspectRatio="banner"
                    maxDimensions={{ width: 1200, height: 800 }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Nombre Presidente</label>
                  <input
                    type="text"
                    value={editingCommittee.president_name || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, president_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Nombre Vicepresidente</label>
                  <input
                    type="text"
                    value={editingCommittee.vicepresident_name || ''}
                    onChange={(e) => setEditingCommittee({ ...editingCommittee, vicepresident_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <ImageUploadField
                    label="Foto del Presidente"
                    value={editingCommittee.president_photo || ''}
                    onChange={(val) => setEditingCommittee({ ...editingCommittee, president_photo: val })}
                    helperText="Foto de perfil del presidente de mesa"
                    aspectRatio="square"
                    maxDimensions={{ width: 400, height: 400 }}
                  />
                </div>
                <div className="space-y-1">
                  <ImageUploadField
                    label="Foto del Vicepresidente"
                    value={editingCommittee.vicepresident_photo || ''}
                    onChange={(val) => setEditingCommittee({ ...editingCommittee, vicepresident_photo: val })}
                    helperText="Foto de perfil del vicepresidente"
                    aspectRatio="square"
                    maxDimensions={{ width: 400, height: 400 }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCommittee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Guardar Comisión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELEGATION EDIT MODAL */}
      {editingDelegation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">
                {editingDelegation.id ? 'Editar Cupo de Delegación' : 'Asignar Delegación'}
              </h3>
              <button onClick={() => setEditingDelegation(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDelegation} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Comisión</label>
                <select
                  value={editingDelegation.committee_id}
                  onChange={(e) => setEditingDelegation({ ...editingDelegation, committee_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {committees.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.abbreviation} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">País</label>
                <select
                  value={editingDelegation.country_id}
                  onChange={(e) => setEditingDelegation({ ...editingDelegation, country_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {countries.map((cnt) => (
                    <option key={cnt.id} value={cnt.id}>
                      {cnt.flag_emoji} {cnt.name} ({cnt.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Estado</label>
                <select
                  value={editingDelegation.status || 'available'}
                  onChange={(e) => setEditingDelegation({ ...editingDelegation, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="available">🟢 Cupo Libre (Disponible)</option>
                  <option value="assigned">🔵 Asignado a Delegado</option>
                  <option value="reserved">🟡 En Reserva</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nombre del Delegado</label>
                <input
                  type="text"
                  value={editingDelegation.delegate_name || ''}
                  onChange={(e) => setEditingDelegation({ ...editingDelegation, delegate_name: e.target.value })}
                  placeholder="Ej. Andrés Felipe Orozco"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Colegio / Institución</label>
                <input
                  type="text"
                  value={editingDelegation.delegate_school || ''}
                  onChange={(e) => setEditingDelegation({ ...editingDelegation, delegate_school: e.target.value })}
                  placeholder="Ej. Colegio Bilingüe de Valledupar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDelegation(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Guardar Delegación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUNTRY EDIT MODAL */}
      {editingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">
                {editingCountry.id ? 'Editar País / Estado Miembro' : 'Nuevo País / Estado Miembro'}
              </h3>
              <button onClick={() => setEditingCountry(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCountry} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nombre Común *</label>
                <input
                  type="text"
                  required
                  value={editingCountry.name || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name: e.target.value })}
                  placeholder="Ej. Francia, Colombia, Japón"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nombre Oficial</label>
                <input
                  type="text"
                  value={editingCountry.official_name || ''}
                  onChange={(e) => setEditingCountry({ ...editingCountry, official_name: e.target.value })}
                  placeholder="Ej. República Francesa"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Código ISO / Sigla *</label>
                  <input
                    type="text"
                    required
                    value={editingCountry.code || ''}
                    onChange={(e) => setEditingCountry({ ...editingCountry, code: e.target.value.toUpperCase() })}
                    placeholder="FRA"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Emoji Bandera</label>
                  <input
                    type="text"
                    value={editingCountry.flag_emoji || '🏳️'}
                    onChange={(e) => setEditingCountry({ ...editingCountry, flag_emoji: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <ImageUploadField
                  label="Bandera / Escudo Personalizado"
                  value={editingCountry.flag_url || ''}
                  onChange={(val) => setEditingCountry({ ...editingCountry, flag_url: val })}
                  helperText="Puedes cargar la bandera oficial en alta resolución desde tu equipo"
                  aspectRatio="square"
                  maxDimensions={{ width: 400, height: 400 }}
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCountry(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Guardar País
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH GENERATE SLOTS MODAL */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">Generar Cupos en Lote</h3>
              <button onClick={() => setBatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Crea automáticamente cupos disponibles en una comisión para todos los países del catálogo ({countries.length} países).
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Selecciona la Comisión</label>
              <select
                value={batchCommitteeId}
                onChange={(e) => setBatchCommitteeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="">Seleccione una comisión</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.abbreviation} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setBatchModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleBatchGenerateSlots}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                Generar Cupos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION DETAIL & ASSIGNMENT DRAWER */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">{selectedReg.full_name}</h3>
                <span className="text-xs text-blue-400">{selectedReg.school} • {selectedReg.grade}</span>
              </div>
              <button onClick={() => setSelectedReg(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Correo</span>
                <span className="text-white">{selectedReg.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Teléfono / WhatsApp</span>
                <span className="text-white">{selectedReg.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Preferencias Indicadas</span>
                <p className="text-blue-300">1. {selectedReg.committee_preference_1 || 'Ninguna'} (País: {selectedReg.country_preference_1 || 'N/A'})</p>
                {selectedReg.committee_preference_2 && (
                  <p className="text-slate-400">2. {selectedReg.committee_preference_2} (País: {selectedReg.country_preference_2 || 'N/A'})</p>
                )}
              </div>
              {selectedReg.experience && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Experiencia Previa</span>
                  <p className="text-slate-200">{selectedReg.experience}</p>
                </div>
              )}
              {selectedReg.payment_receipt && (
                <div className="p-3 rounded-xl bg-slate-950 border border-blue-900/40 col-span-2 space-y-2">
                  <span className="text-blue-400 block text-[10px] uppercase font-bold">Comprobante de Pago Adjuntado</span>
                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-black/40 max-h-48 flex items-center justify-center">
                    <img
                      src={selectedReg.payment_receipt}
                      alt="Comprobante de pago"
                      className="max-h-48 object-contain cursor-pointer hover:opacity-95"
                      onClick={() => window.open(selectedReg.payment_receipt, '_blank')}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block text-right">Clic para ampliar comprobante</span>
                </div>
              )}
            </div>

            {/* Assignment Section */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Asignación Oficial en el Modelo
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Comisión a Asignar</label>
                  <select
                    id="assign-committee-select"
                    defaultValue={selectedReg.assigned_committee_id || committees[0]?.id}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {committees.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.abbreviation} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">País a Asignar</label>
                  <select
                    id="assign-country-select"
                    defaultValue={selectedReg.assigned_country_id || countries[0]?.id}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {countries.map((cnt) => (
                      <option key={cnt.id} value={cnt.id}>
                        {cnt.flag_emoji} {cnt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleUpdateRegStatus(selectedReg.id, 'rejected');
                    setSelectedReg(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => {
                    handleDeleteRegistration(selectedReg.id, `${selectedReg.full_name} (${selectedReg.school})`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-900 text-rose-400 text-xs font-semibold flex items-center gap-1 border border-rose-800/40"
                  title="Eliminar inscripción definitivamente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleUpdateRegStatus(selectedReg.id, 'approved');
                    setSelectedReg(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  Solo Aprobar
                </button>
                <button
                  onClick={() => {
                    const comId = (document.getElementById('assign-committee-select') as HTMLSelectElement)?.value;
                    const cntId = (document.getElementById('assign-country-select') as HTMLSelectElement)?.value;
                    handleUpdateRegStatus(selectedReg.id, 'assigned', comId, cntId);
                    setSelectedReg(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Asignar y Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT EDIT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">
                {editingDoc.id ? 'Editar Documento' : 'Nuevo Documento'}
              </h3>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isNew = !editingDoc.id;
                const url = isNew ? '/api/admin/documents' : `/api/admin/documents/${editingDoc.id}`;
                await authFetch(url, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(editingDoc) });
                showStatus('Documento guardado');
                setEditingDoc(null);
                loadAllAdminData();
                onDataUpdated();
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Título del Documento</label>
                <input
                  type="text"
                  required
                  value={editingDoc.title || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Categoría</label>
                <select
                  value={editingDoc.category || 'Protocolo'}
                  onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="Protocolo">Protocolo</option>
                  <option value="Académico">Académico</option>
                  <option value="Plantillas">Plantillas</option>
                  <option value="Inscripción">Inscripción</option>
                  <option value="Normativa">Normativa</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Descripción Breve</label>
                <input
                  type="text"
                  value={editingDoc.description || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE EDIT MODAL */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">
                {editingSchedule.id ? 'Editar Evento' : 'Nuevo Evento del Cronograma'}
              </h3>
              <button onClick={() => setEditingSchedule(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isNew = !editingSchedule.id;
                const url = isNew ? '/api/admin/schedule' : `/api/admin/schedule/${editingSchedule.id}`;
                await authFetch(url, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(editingSchedule) });
                showStatus('Cronograma actualizado');
                setEditingSchedule(null);
                loadAllAdminData();
                onDataUpdated();
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Día / Etiqueta</label>
                <input
                  type="text"
                  required
                  value={editingSchedule.day_label || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, day_label: e.target.value })}
                  placeholder="Día 1 - Viernes 23 Oct"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Hora Inicio</label>
                  <input
                    type="text"
                    required
                    value={editingSchedule.time_start || ''}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, time_start: e.target.value })}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Hora Fin</label>
                  <input
                    type="text"
                    required
                    value={editingSchedule.time_end || ''}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, time_end: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Actividad</label>
                <input
                  type="text"
                  required
                  value={editingSchedule.activity || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, activity: e.target.value })}
                  placeholder="Ceremonia de Apertura"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Lugar en el Colegio</label>
                <input
                  type="text"
                  value={editingSchedule.location || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, location: e.target.value })}
                  placeholder="Auditorio Principal"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY PHOTO ADD / EDIT MODAL */}
      {editingGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">
                {editingGallery.id ? 'Editar Fotografía de Galería' : 'Nueva Fotografía de Galería'}
              </h3>
              <button onClick={() => setEditingGallery(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const method = editingGallery.id ? 'PUT' : 'POST';
                const url = editingGallery.id ? `/api/admin/gallery/${editingGallery.id}` : '/api/admin/gallery';
                const res = await authFetch(url, {
                  method,
                  body: JSON.stringify(editingGallery),
                });
                if (res.ok) {
                  showStatus(editingGallery.id ? 'Fotografía actualizada' : 'Fotografía agregada a la galería');
                  setEditingGallery(null);
                  loadAllAdminData();
                  onDataUpdated();
                } else {
                  showStatus('Error al guardar fotografía', 'error');
                }
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Título</label>
                <input
                  type="text"
                  required
                  value={editingGallery.title || ''}
                  onChange={(e) => setEditingGallery({ ...editingGallery, title: e.target.value })}
                  placeholder="Debate en Plenaria General"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <ImageUploadField
                  label="Fotografía de la Galería"
                  value={editingGallery.image_url || ''}
                  onChange={(val) => setEditingGallery({ ...editingGallery, image_url: val })}
                  helperText="Puedes subir fotos de debates, premiaciones o momentos de BIMUN"
                  aspectRatio="banner"
                  maxDimensions={{ width: 1600, height: 1200 }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400">Categoría</label>
                    <button
                      type="button"
                      onClick={() => setCategoryManagerModalOpen(true)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      + Nueva
                    </button>
                  </div>
                  <select
                    value={editingGallery.category || galleryCategories[0] || 'Debate'}
                    onChange={(e) => setEditingGallery({ ...editingGallery, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    {galleryCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Edición</label>
                  <input
                    type="text"
                    value={editingGallery.edition || 'BIMUN XXVII'}
                    onChange={(e) => setEditingGallery({ ...editingGallery, edition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Pie de foto / Descripción (opcional)</label>
                <textarea
                  rows={2}
                  value={editingGallery.caption || ''}
                  onChange={(e) => setEditingGallery({ ...editingGallery, caption: e.target.value })}
                  placeholder="Detalles sobre el comité, delegados o el momento capturado..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingGallery(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY BATCH UPLOAD MODAL */}
      <GalleryBatchUploadModal
        isOpen={batchUploadModalOpen}
        onClose={() => setBatchUploadModalOpen(false)}
        categories={galleryCategories}
        currentEdition={settings?.edition_name || 'BIMUN XXVII'}
        authFetch={authFetch}
        showStatus={showStatus}
        onUploadCompleted={() => {
          loadAllAdminData();
          onDataUpdated();
        }}
      />

      {/* GALLERY CATEGORY MANAGER MODAL */}
      <GalleryCategoryManagerModal
        isOpen={categoryManagerModalOpen}
        onClose={() => setCategoryManagerModalOpen(false)}
        categories={galleryCategories}
        categoryCounts={galleryCategoryCounts}
        onCategoriesUpdated={() => {
          loadAllAdminData();
          onDataUpdated();
        }}
        authFetch={authFetch}
        showStatus={showStatus}
      />

      {/* TEAM MEMBER MODAL */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">
                {editingTeam.id ? 'Editar Miembro' : 'Nuevo Miembro del Comité'}
              </h3>
              <button onClick={() => setEditingTeam(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await authFetch('/api/admin/team', { method: 'POST', body: JSON.stringify(editingTeam) });
                showStatus('Miembro agregado');
                setEditingTeam(null);
                loadAllAdminData();
                onDataUpdated();
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editingTeam.name || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  placeholder="Nombre y Apellidos"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Cargo Oficial</label>
                <input
                  type="text"
                  required
                  value={editingTeam.role || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, role: e.target.value })}
                  placeholder="Ej. Secretaria General"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <ImageUploadField
                  label="Fotografía del Integrante"
                  value={editingTeam.photo_url || ''}
                  onChange={(val) => setEditingTeam({ ...editingTeam, photo_url: val })}
                  helperText="Foto de perfil o retrato institucional"
                  aspectRatio="square"
                  maxDimensions={{ width: 600, height: 600 }}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEWS EDIT MODAL */}
      {editingNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-white">Publicar Noticia</h3>
              <button onClick={() => setEditingNews(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await authFetch('/api/admin/news', { method: 'POST', body: JSON.stringify(editingNews) });
                showStatus('Noticia publicada');
                setEditingNews(null);
                loadAllAdminData();
                onDataUpdated();
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Título</label>
                <input
                  type="text"
                  required
                  value={editingNews.title || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Extracto / Resumen</label>
                <input
                  type="text"
                  required
                  value={editingNews.excerpt || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, excerpt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <ImageUploadField
                  label="Imagen Destacada de la Noticia"
                  value={editingNews.image_url || ''}
                  onChange={(val) => setEditingNews({ ...editingNews, image_url: val })}
                  helperText="Fotografía o banner para la cabecera de la noticia"
                  aspectRatio="banner"
                  maxDimensions={{ width: 1200, height: 800 }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Contenido Completo</label>
                <textarea
                  rows={5}
                  required
                  value={editingNews.content || ''}
                  onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingNews(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Publicar Noticia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: CLEAR TEST DATA */}
      {confirmClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full border border-rose-800/80 p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-700/60 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-white">
                  ¿Limpiar todos los datos de prueba?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta acción dejará el sistema en blanco y preparado para inscripciones y comisiones reales.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                Elementos que se eliminarán:
              </span>
              <ul className="grid grid-cols-2 gap-1.5 text-slate-300 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Inscripciones de prueba</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Delegaciones y cupos</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Comisiones creadas</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Catálogo de países</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Cronograma y actividades</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Documentos y guías</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Galería fotográfica</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Noticias y comunicados</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-medium">
                ✓ Tu usuario administrador, clave y configuración institucional (nombre, escudo y lema) se mantendrán 100% seguros.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                title="Descargar una copia de seguridad antes de borrar"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Descargar Backup JSON</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmClearModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleClearTestData}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Limpiando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirmar Limpieza</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: LOAD SEED DEMO DATA */}
      {confirmReloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full border border-blue-800/80 p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-700/60 text-blue-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-white">
                  ¿Cargar datos oficiales de demostración BIMUN?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta acción insertará el paquete completo de prueba con las comisiones estándar de la ONU, 45 países con banderas, cronograma de los 3 días, equipo de secretaría y documentos académicos.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <p className="text-slate-300">
                Si ya tenías información creada, se reinicializará al contenido de muestra estándar del modelo.
              </p>
              <p className="text-[11px] text-emerald-400 font-medium">
                ✓ Tus credenciales y logotipo personalizado se mantendrán intactos.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmReloadModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleLoadSeedData}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-blue-600/30"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cargar Demostración</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ABOUT EDIT / CREATE MODAL */}
      <AboutEditModal
        section={editingAbout}
        isOpen={Boolean(editingAbout)}
        onClose={() => setEditingAbout(null)}
        isSaving={isSavingAboutModal}
        onSave={async (data) => {
          setIsSavingAboutModal(true);
          try {
            const isNew = !data.id;
            const url = isNew ? '/api/admin/about' : `/api/admin/about/${data.id}`;
            const res = await authFetch(url, {
              method: isNew ? 'POST' : 'PUT',
              body: JSON.stringify(data),
            });
            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || 'Error al guardar la sección.');
            }
            showStatus(isNew ? 'Sección institucional creada' : 'Sección institucional actualizada');
            await loadAllAdminData();
            onDataUpdated();
          } finally {
            setIsSavingAboutModal(false);
          }
        }}
      />

      {/* CONFIRM RESET ABOUT MODAL */}
      {confirmResetAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-white">
                  ¿Restablecer textos institucionales oficiales?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Esta acción restaurará los 6 textos originales del BIMUN (¿Qué es MUN?, Objetivos, Metodología THIMUN/ONU, Beneficios, Historia y Misión/Visión).
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isRestoringAbout}
                onClick={() => setConfirmResetAboutModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRestoringAbout}
                onClick={async () => {
                  setIsRestoringAbout(true);
                  try {
                    const res = await authFetch('/api/admin/about/reset-defaults', { method: 'POST' });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || 'Error al restablecer');
                    }
                    if (data.sections) {
                      setAboutSections(data.sections);
                    }
                    showStatus('Textos institucionales oficiales restablecidos exitosamente');
                    setConfirmResetAboutModalOpen(false);
                    await loadAllAdminData();
                    onDataUpdated();
                  } catch (err: any) {
                    showStatus(err.message, 'error');
                  } finally {
                    setIsRestoringAbout(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-amber-600/30"
              >
                {isRestoringAbout ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restableciendo...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <ConfirmDeleteModal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation(null)}
          onConfirm={deleteConfirmation.onConfirm}
          isDeleting={isDeletingItem}
          title={deleteConfirmation.title}
          itemName={deleteConfirmation.itemName}
          description={deleteConfirmation.description}
          confirmButtonText={deleteConfirmation.confirmButtonText}
        />
      )}
    </div>
  );
};
