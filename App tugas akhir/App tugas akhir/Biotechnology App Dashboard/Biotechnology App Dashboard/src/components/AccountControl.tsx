import { ArrowLeft, ArrowUpAZ, Eye, EyeOff, KeyRound, RefreshCw, Trash2, User, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface ManagedAdminAccount {
  id: string;
  username: string;
  organizationName: string;
  lastLogin?: string | null;
}

export interface ManagedMemberAccount {
  id: string;
  username: string;
  organizationName: string;
  teamName: string;
  lastLogin?: string | null;
}

export interface ManagedOrganizationTeamOption {
  id: string;
  name: string;
}

export interface ManagedOrganizationOption {
  id: string;
  name: string;
  teams: ManagedOrganizationTeamOption[];
}

interface AccountControlProps {
  onBack: () => void;
  onCreateOrganization: () => void;
  onLogin: (username: string, password: string) => Promise<string | null>;
  onLoadAccounts: (token: string) => Promise<{ admins: ManagedAdminAccount[]; members: ManagedMemberAccount[]; organizations: ManagedOrganizationOption[] } | null>;
  onCreateAccount: (
    token: string,
    payload: {
      type: 'admin' | 'member';
      organizationId: string;
      teamId?: string;
      username: string;
      password: string;
    },
  ) => Promise<boolean>;
  onUpdateOrganization: (token: string, organizationId: string, newName: string) => Promise<boolean>;
  onDeleteOrganization: (token: string, organizationId: string) => Promise<boolean>;
  onUpdateTeam: (token: string, teamId: string, newName: string) => Promise<boolean>;
  onDeleteTeam: (token: string, teamId: string) => Promise<boolean>;
  onDeleteAccount: (token: string, type: 'admin' | 'member', accountId: string) => Promise<boolean>;
  onUpdatePassword: (token: string, type: 'admin' | 'member', accountId: string, newPassword: string) => Promise<boolean>;
  onUpdateControlCredentials: (
    token: string,
    currentPassword: string,
    newUsername: string,
    newPassword: string,
  ) => Promise<{ token: string; username: string } | null>;
}

interface PasswordEditorState {
  type: 'admin' | 'member';
  accountId: string;
  username: string;
  organizationName: string;
  teamName?: string;
}

const formatLastLogin = (value?: string | null) => {
  if (!value) return '-';
  return value.replace('T', ' ').replace('.000Z', '');
};

const getControlInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return 'C';
  return trimmed
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const CONTROL_SESSION_STORAGE_KEY = 'biotech.account-control.session.v1';

interface PersistedControlSession {
  token: string;
  username: string;
  signedInAt: string;
}

const readPersistedControlSession = (): PersistedControlSession | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(CONTROL_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedControlSession>;
    const token = String(parsed.token || '').trim();
    const username = String(parsed.username || '').trim();
    const signedInAt = String(parsed.signedInAt || '').trim();

    if (!token || !username || !signedInAt) {
      window.sessionStorage.removeItem(CONTROL_SESSION_STORAGE_KEY);
      return null;
    }

    return { token, username, signedInAt };
  } catch (error) {
    console.error('Failed to parse control session:', error);
    window.sessionStorage.removeItem(CONTROL_SESSION_STORAGE_KEY);
    return null;
  }
};

const persistControlSession = (payload: PersistedControlSession) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CONTROL_SESSION_STORAGE_KEY, JSON.stringify(payload));
};

const clearPersistedControlSession = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CONTROL_SESSION_STORAGE_KEY);
};

export default function AccountControl({
  onBack,
  onCreateOrganization,
  onLogin,
  onLoadAccounts,
  onCreateAccount,
  onUpdateOrganization,
  onDeleteOrganization,
  onUpdateTeam,
  onDeleteTeam,
  onDeleteAccount,
  onUpdatePassword,
  onUpdateControlCredentials,
}: AccountControlProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isControlPasswordVisible, setIsControlPasswordVisible] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [controlProfile, setControlProfile] = useState<{ username: string; signedInAt: string } | null>(null);
  const [admins, setAdmins] = useState<ManagedAdminAccount[]>([]);
  const [members, setMembers] = useState<ManagedMemberAccount[]>([]);
  const [organizations, setOrganizations] = useState<ManagedOrganizationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isOrgTeamManagerOpen, setIsOrgTeamManagerOpen] = useState(false);
  const [isAccountListOpen, setIsAccountListOpen] = useState(false);
  const [createType, setCreateType] = useState<'admin' | 'member'>('admin');
  const [createOrganizationId, setCreateOrganizationId] = useState('');
  const [createTeamId, setCreateTeamId] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirmPassword, setCreateConfirmPassword] = useState('');
  const [isControlCredentialsOpen, setIsControlCredentialsOpen] = useState(false);
  const [controlCurrentPassword, setControlCurrentPassword] = useState('');
  const [controlNewUsername, setControlNewUsername] = useState('');
  const [controlNewPassword, setControlNewPassword] = useState('');
  const [controlConfirmPassword, setControlConfirmPassword] = useState('');
  const [isPasswordPickerOpen, setIsPasswordPickerOpen] = useState(false);
  const [passwordEditor, setPasswordEditor] = useState<PasswordEditorState | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountGroupBy, setAccountGroupBy] = useState<'organization' | 'team'>('organization');
  const lastBackPressAtRef = useRef(0);
  const tokenRef = useRef<string | null>(null);
  const isCreateAccountOpenRef = useRef(false);
  const isOrgTeamManagerOpenRef = useRef(false);
  const isAccountListOpenRef = useRef(false);
  const isControlCredentialsOpenRef = useRef(false);
  const isPasswordPickerOpenRef = useRef(false);
  const passwordEditorRef = useRef<PasswordEditorState | null>(null);
  const onBackRef = useRef(onBack);

  const isLoginReady = username.trim().length > 0 && password.trim().length > 0;

  const filteredAdmins = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visibleItems = !q
      ? [...admins]
      : admins.filter((item) =>
      `${item.username} ${item.organizationName}`.toLowerCase().includes(q),
    );

    visibleItems.sort((a, b) => {
      const compare = a.username.localeCompare(b.username, 'id', { sensitivity: 'base' });
      return sortOrder === 'az' ? compare : -compare;
    });

    return visibleItems;
  }, [admins, search, sortOrder]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visibleItems = !q
      ? [...members]
      : members.filter((item) =>
      `${item.username} ${item.organizationName} ${item.teamName}`.toLowerCase().includes(q),
    );

    visibleItems.sort((a, b) => {
      const compare = a.username.localeCompare(b.username, 'id', { sensitivity: 'base' });
      return sortOrder === 'az' ? compare : -compare;
    });

    return visibleItems;
  }, [members, search, sortOrder]);

  const groupedAdminsByOrganization = useMemo(() => {
    const groups = new Map<string, ManagedAdminAccount[]>();
    filteredAdmins.forEach((item) => {
      const key = item.organizationName || '-';
      const bucket = groups.get(key) || [];
      bucket.push(item);
      groups.set(key, bucket);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'id', { sensitivity: 'base' }));
  }, [filteredAdmins]);

  const groupedMembersByOrganization = useMemo(() => {
    const groups = new Map<string, ManagedMemberAccount[]>();
    filteredMembers.forEach((item) => {
      const key = item.organizationName || '-';
      const bucket = groups.get(key) || [];
      bucket.push(item);
      groups.set(key, bucket);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'id', { sensitivity: 'base' }));
  }, [filteredMembers]);

  const groupedMembersByTeam = useMemo(() => {
    const groups = new Map<string, { label: string; items: ManagedMemberAccount[] }>();
    filteredMembers.forEach((item) => {
      const org = item.organizationName || '-';
      const team = item.teamName || '-';
      const key = `${org}|||${team}`;
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
        return;
      }

      groups.set(key, {
        label: `${org} - ${team}`,
        items: [item],
      });
    });

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, 'id', { sensitivity: 'base' }));
  }, [filteredMembers]);

  const selectedOrganization = useMemo(
    () => organizations.find((item) => item.id === createOrganizationId) ?? null,
    [organizations, createOrganizationId],
  );

  const selectedOrganizationTeams = selectedOrganization?.teams ?? [];
  const canCreateAccount =
    createUsername.trim().length >= 3
    && createPassword.trim().length >= 6
    && createConfirmPassword.trim().length >= 6
    && createPassword === createConfirmPassword
    && createOrganizationId.trim().length > 0
    && (createType === 'admin' || createTeamId.trim().length > 0);

  const loadAccounts = async (activeToken: string) => {
    const payload = await onLoadAccounts(activeToken);
    if (!payload) return;
    setAdmins(payload.admins);
    setMembers(payload.members);
    setOrganizations(payload.organizations);
  };

  useEffect(() => {
    const restored = readPersistedControlSession();
    if (!restored) return;

    setToken(restored.token);
    setControlProfile({
      username: restored.username,
      signedInAt: restored.signedInAt,
    });
    setControlNewUsername(restored.username);
    void loadAccounts(restored.token);
  }, []);

  const handleLogin = async () => {
    if (!isLoginReady) return;

    setIsLoading(true);
    const nextToken = await onLogin(username.trim(), password);
    if (nextToken) {
      const signedInAt = new Date().toISOString();

      setToken(nextToken);
      setControlProfile({
        username: username.trim(),
        signedInAt,
      });
      setControlNewUsername(username.trim());
      persistControlSession({
        token: nextToken,
        username: username.trim(),
        signedInAt,
      });
      await loadAccounts(nextToken);
    }
    setIsLoading(false);
  };

  const openControlCredentialsEditor = () => {
    setIsControlCredentialsOpen(true);
    setControlCurrentPassword('');
    setControlNewUsername(controlProfile?.username || username.trim());
    setControlNewPassword('');
    setControlConfirmPassword('');
  };

  const closeControlCredentialsEditor = () => {
    setIsControlCredentialsOpen(false);
    setControlCurrentPassword('');
    setControlNewUsername(controlProfile?.username || username.trim());
    setControlNewPassword('');
    setControlConfirmPassword('');
  };

  const handleDelete = async (type: 'admin' | 'member', accountId: string, accountName: string) => {
    if (!token) return;

    const shouldDelete = window.confirm(`Hapus akun ${accountName}?`);
    if (!shouldDelete) return;

    setIsLoading(true);
    const success = await onDeleteAccount(token, type, accountId);
    if (success) {
      if (type === 'admin') {
        setAdmins((prev) => prev.filter((item) => item.id !== accountId));
      } else {
        setMembers((prev) => prev.filter((item) => item.id !== accountId));
      }
      toast.success('Akun berhasil dihapus');
    }
    setIsLoading(false);
  };

  const handleReload = async () => {
    if (!token) return;
    setIsLoading(true);
    await loadAccounts(token);
    setIsLoading(false);
  };

  const openCreateAccount = () => {
    setIsCreateAccountOpen(true);
    setCreateType('admin');
    setCreateOrganizationId('');
    setCreateTeamId('');
    setCreateUsername('');
    setCreatePassword('');
    setCreateConfirmPassword('');
  };

  const closeCreateAccount = () => {
    setIsCreateAccountOpen(false);
    setCreateType('admin');
    setCreateOrganizationId('');
    setCreateTeamId('');
    setCreateUsername('');
    setCreatePassword('');
    setCreateConfirmPassword('');
  };

  const handleCreateAccount = async () => {
    if (!token) return;

    if (createUsername.trim().length < 3) {
      toast.error('Username terlalu pendek', { description: 'Minimal 3 karakter.' });
      return;
    }

    if (createPassword.trim().length < 6) {
      toast.error('Password terlalu pendek', { description: 'Minimal 6 karakter.' });
      return;
    }

    if (createPassword !== createConfirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    if (!createOrganizationId) {
      toast.error('Pilih organisasi terlebih dahulu');
      return;
    }

    if (createType === 'member' && !createTeamId) {
      toast.error('Pilih team untuk member');
      return;
    }

    setIsLoading(true);
    const success = await onCreateAccount(token, {
      type: createType,
      organizationId: createOrganizationId,
      teamId: createType === 'member' ? createTeamId : undefined,
      username: createUsername.trim(),
      password: createPassword,
    });

    if (success) {
      toast.success('Akun berhasil ditambahkan');
      await loadAccounts(token);
      closeCreateAccount();
    }

    setIsLoading(false);
  };

  const openOrgTeamManager = () => {
    setIsOrgTeamManagerOpen(true);
  };

  const closeOrgTeamManager = () => {
    setIsOrgTeamManagerOpen(false);
  };

  const openAccountListPage = () => {
    setIsAccountListOpen(true);
  };

  const closeAccountListPage = () => {
    setIsAccountListOpen(false);
  };

  const handleRenameOrganization = async (organizationId: string, currentName: string) => {
    if (!token) return;

    const nextName = window.prompt('Masukkan nama organization baru', currentName);
    if (!nextName) return;

    const trimmed = nextName.trim();
    if (!trimmed) {
      toast.error('Nama organization tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    const success = await onUpdateOrganization(token, organizationId, trimmed);
    if (success) {
      toast.success('Organization berhasil diubah');
      await loadAccounts(token);
    }
    setIsLoading(false);
  };

  const handleDeleteOrganization = async (organizationId: string, organizationName: string) => {
    if (!token) return;

    const shouldDelete = window.confirm(
      `Hapus organization ${organizationName}? Semua team, admin, dan member terkait akan ikut terhapus.`,
    );
    if (!shouldDelete) return;

    setIsLoading(true);
    const success = await onDeleteOrganization(token, organizationId);
    if (success) {
      toast.success('Organization berhasil dihapus');
      await loadAccounts(token);
    }
    setIsLoading(false);
  };

  const handleRenameTeam = async (teamId: string, currentName: string) => {
    if (!token) return;

    const nextName = window.prompt('Masukkan nama team baru', currentName);
    if (!nextName) return;

    const trimmed = nextName.trim();
    if (!trimmed) {
      toast.error('Nama team tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    const success = await onUpdateTeam(token, teamId, trimmed);
    if (success) {
      toast.success('Team berhasil diubah');
      await loadAccounts(token);
    }
    setIsLoading(false);
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!token) return;

    const shouldDelete = window.confirm(
      `Hapus team ${teamName}? Member dalam team ini juga akan terhapus.`,
    );
    if (!shouldDelete) return;

    setIsLoading(true);
    const success = await onDeleteTeam(token, teamId);
    if (success) {
      toast.success('Team berhasil dihapus');
      await loadAccounts(token);
    }
    setIsLoading(false);
  };

  const openPasswordEditor = (payload: PasswordEditorState) => {
    setIsPasswordPickerOpen(false);
    setPasswordEditor(payload);
    setNewPassword('');
    setConfirmPassword('');
  };

  const closePasswordEditor = () => {
    setPasswordEditor(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleControlLogout = () => {
    const shouldLogout = window.confirm('Logout dari Account Control?');
    if (!shouldLogout) return;

    clearPersistedControlSession();
    setToken(null);
    setControlProfile(null);
    setIsCreateAccountOpen(false);
    setIsOrgTeamManagerOpen(false);
    setIsAccountListOpen(false);
    setIsControlCredentialsOpen(false);
    setControlCurrentPassword('');
    setControlNewUsername('');
    setControlNewPassword('');
    setControlConfirmPassword('');
    setIsPasswordPickerOpen(false);
    setPasswordEditor(null);
    setNewPassword('');
    setConfirmPassword('');

    onBackRef.current();
  };

  const handleDashboardBackPress = () => {
    toast.info('Gunakan Logout Control', {
      description: 'Untuk keluar dari Account Control, tekan icon profile lalu logout.',
    });
  };

  const handleUpdatePassword = async () => {
    if (!token || !passwordEditor) return;

    const nextPassword = newPassword.trim();
    if (nextPassword.length < 6) {
      toast.error('Password terlalu pendek', { description: 'Minimal 6 karakter.' });
      return;
    }

    if (nextPassword !== confirmPassword.trim()) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);
    const success = await onUpdatePassword(token, passwordEditor.type, passwordEditor.accountId, nextPassword);
    setIsLoading(false);

    if (!success) return;

    toast.success('Password berhasil diperbarui');
    closePasswordEditor();
  };

  const handleUpdateControlCredentials = async () => {
    if (!token) return;

    const currentPassword = controlCurrentPassword;
    const nextUsername = controlNewUsername.trim();
    const nextPassword = controlNewPassword.trim();
    const nextConfirmPassword = controlConfirmPassword.trim();

    if (!currentPassword) {
      toast.error('Current password wajib diisi');
      return;
    }

    if (nextUsername.length < 3) {
      toast.error('Username terlalu pendek', { description: 'Minimal 3 karakter.' });
      return;
    }

    if (nextPassword.length < 6) {
      toast.error('Password terlalu pendek', { description: 'Minimal 6 karakter.' });
      return;
    }

    if (nextPassword !== nextConfirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);
    const updated = await onUpdateControlCredentials(token, currentPassword, nextUsername, nextPassword);
    setIsLoading(false);

    if (!updated) return;

    setToken(updated.token);
    setUsername(updated.username);
    const nextProfile = {
      username: updated.username,
      signedInAt: controlProfile?.signedInAt || new Date().toISOString(),
    };
    setControlProfile(nextProfile);
    persistControlSession({
      token: updated.token,
      username: nextProfile.username,
      signedInAt: nextProfile.signedInAt,
    });

    toast.success('Control account berhasil diperbarui');
    closeControlCredentialsEditor();
  };

  useEffect(() => {
    if (createType === 'admin') {
      setCreateTeamId('');
      return;
    }

    if (!selectedOrganization) {
      setCreateTeamId('');
      return;
    }

    const teamExists = selectedOrganization.teams.some((team) => team.id === createTeamId);
    if (!teamExists) {
      setCreateTeamId('');
    }
  }, [createType, selectedOrganization, createTeamId]);

  useEffect(() => {
    tokenRef.current = token;
    isCreateAccountOpenRef.current = isCreateAccountOpen;
    isOrgTeamManagerOpenRef.current = isOrgTeamManagerOpen;
    isAccountListOpenRef.current = isAccountListOpen;
    isControlCredentialsOpenRef.current = isControlCredentialsOpen;
    isPasswordPickerOpenRef.current = isPasswordPickerOpen;
    passwordEditorRef.current = passwordEditor;
    onBackRef.current = onBack;
  }, [token, isCreateAccountOpen, isOrgTeamManagerOpen, isAccountListOpen, isControlCredentialsOpen, isPasswordPickerOpen, passwordEditor, onBack]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let disposed = false;
    let listener: { remove: () => Promise<void> } | null = null;

    const registerListener = async () => {
      try {
        const registeredListener = await CapacitorApp.addListener('backButton', () => {
          if (!tokenRef.current) {
            onBackRef.current();
            return;
          }

          if (isCreateAccountOpenRef.current) {
            closeCreateAccount();
            return;
          }

          if (isOrgTeamManagerOpenRef.current) {
            closeOrgTeamManager();
            return;
          }

          if (isAccountListOpenRef.current) {
            closeAccountListPage();
            return;
          }

          if (isControlCredentialsOpenRef.current) {
            setIsControlCredentialsOpen(false);
            setControlCurrentPassword('');
            setControlNewPassword('');
            setControlConfirmPassword('');
            return;
          }

          if (passwordEditorRef.current) {
            setPasswordEditor(null);
            setNewPassword('');
            setConfirmPassword('');
            return;
          }

          if (isPasswordPickerOpenRef.current) {
            setIsPasswordPickerOpen(false);
            return;
          }

          const now = Date.now();
          if (now - lastBackPressAtRef.current < 1800) {
            if (window.confirm('Apakah Anda ingin keluar dari aplikasi?')) {
              void CapacitorApp.exitApp();
            }
            lastBackPressAtRef.current = 0;
            return;
          }

          lastBackPressAtRef.current = now;
          toast.info('Tekan kembali lagi untuk keluar', {
            description: 'Tekan tombol kembali sekali lagi untuk menutup aplikasi.',
          });
        });

        if (disposed) {
          void registeredListener.remove();
          return;
        }

        listener = registeredListener;
      } catch (error) {
        console.error('Failed to register account control back button listener:', error);
      }
    };

    void registerListener();

    return () => {
      disposed = true;
      if (listener) {
        void listener.remove();
      }
    };
  }, []);

  if (!token) {
    return (
      <div className="bio-login-shell bio-auth-shell">
        <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
        <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

        <div className="bio-auth-panel">
          <div className="bio-auth-header">
            <Button variant="ghost" onClick={onBack} className="bio-auth-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="bio-auth-step">Account Control</p>
              <h2 className="bio-auth-title">Control Login</h2>
            </div>
          </div>

          <p className="bio-auth-subtitle">
            Login untuk mengelola dan menghapus akun admin/member yang sudah tidak dipakai.
          </p>

          <div className="bio-auth-form">
            <label className="bio-auth-label">Control Username</label>
            <Input
              placeholder="Masukkan control username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bio-auth-input"
              disabled={isLoading}
            />

            <label className="bio-auth-label">Control Password</label>
            <div style={{ position: 'relative' }}>
              <Input
                type={isControlPasswordVisible ? 'text' : 'password'}
                placeholder="Masukkan control password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bio-auth-input"
                style={{ paddingRight: '2.75rem' }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setIsControlPasswordVisible((prev) => !prev)}
                className="text-slate-500 hover:text-slate-700 disabled:opacity-50"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  height: '1.5rem',
                  width: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={isControlPasswordVisible ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {isControlPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="bio-auth-actions">
              <Button className="bio-auth-primary" onClick={handleLogin} disabled={!isLoginReady || isLoading}>
                {isLoading ? 'Memproses...' : 'Masuk Control'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (passwordEditor) {
    return (
      <div className="bio-admin-shell bio-org-profile-shell bio-safe-screen" style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y' }}>
        <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
        <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

        <div className="bio-admin-panel bio-org-profile-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 'min(92dvh, 48rem)' }}>
          <div className="bio-org-profile-header">
            <Button
              variant="ghost"
              size="icon"
              className="bio-member-settings-btn bio-org-profile-back"
              onClick={closePasswordEditor}
              aria-label="Back to account control list"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <p className="bio-admin-kicker">Account Control</p>
              <h1 className="bio-admin-title bio-org-profile-title">Edit Password</h1>
              <p className="bio-admin-subtitle">Ubah password akun {passwordEditor.type} pada halaman ini.</p>
            </div>
          </div>

          <div className="bio-admin-section rounded-xl border border-slate-200 bg-white p-4">
            <p className="bio-org-profile-label">Account Target</p>
            <p className="text-sm font-semibold text-slate-900">{passwordEditor.username}</p>
            <p className="text-sm text-slate-600">Role: {passwordEditor.type === 'admin' ? 'Admin' : 'Member'}</p>
            <p className="text-sm text-slate-600">Organization: {passwordEditor.organizationName}</p>
            {passwordEditor.type === 'member' && (
              <p className="text-sm text-slate-600">Team: {passwordEditor.teamName || '-'}</p>
            )}
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">New Password</p>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Confirm New Password</p>
            <Input
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-org-profile-actions" style={{ paddingBottom: 'max(1.35rem, calc(env(safe-area-inset-bottom, 0px) + 1.45rem))' }}>
            <Button variant="outline" className="bio-org-profile-cancel" onClick={closePasswordEditor} disabled={isLoading}>
              Cancel
            </Button>
            <Button className="bio-org-profile-confirm" onClick={handleUpdatePassword} disabled={isLoading || newPassword.trim().length === 0 || confirmPassword.trim().length === 0}>
              Save Password
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isCreateAccountOpen) {
    return (
      <div className="bio-admin-shell bio-org-profile-shell bio-safe-screen" style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y' }}>
        <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
        <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

        <div className="bio-admin-panel bio-org-profile-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 'min(92dvh, 48rem)' }}>
          <div className="bio-org-profile-header">
            <Button
              variant="ghost"
              size="icon"
              className="bio-member-settings-btn bio-org-profile-back"
              onClick={closeCreateAccount}
              aria-label="Back to account control dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <p className="bio-admin-kicker">Account Control</p>
              <h1 className="bio-admin-title bio-org-profile-title">Add Organization Account</h1>
              <p className="bio-admin-subtitle">Tambah admin/member baru untuk organisasi yang sudah ada.</p>
            </div>
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Account Type</p>
            <Select
              value={createType}
              onValueChange={(value: 'admin' | 'member') => setCreateType(value)}
            >
              <SelectTrigger className="bio-org-profile-input">
                <SelectValue placeholder="Pilih tipe akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Organization</p>
            <Select
              value={createOrganizationId}
              onValueChange={(value: string) => setCreateOrganizationId(value)}
            >
              <SelectTrigger className="bio-org-profile-input">
                <SelectValue placeholder={organizations.length > 0 ? 'Pilih organisasi' : 'Belum ada organisasi aktif'} />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {createType === 'member' && (
            <div className="bio-admin-section">
              <p className="bio-org-profile-label">Team</p>
              <Select
                value={createTeamId}
                onValueChange={(value: string) => setCreateTeamId(value)}
                disabled={!createOrganizationId || selectedOrganizationTeams.length === 0}
              >
                <SelectTrigger className="bio-org-profile-input">
                  <SelectValue placeholder={selectedOrganizationTeams.length > 0 ? 'Pilih team' : 'Tidak ada team tersedia'} />
                </SelectTrigger>
                <SelectContent>
                  {selectedOrganizationTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Username</p>
            <Input
              placeholder="Minimal 3 karakter"
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Password</p>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Confirm Password</p>
            <Input
              type="password"
              placeholder="Ulangi password"
              value={createConfirmPassword}
              onChange={(e) => setCreateConfirmPassword(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-admin-section rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-600">
              Catatan: Satu organisasi bisa memiliki lebih dari satu admin dan lebih dari satu member.
            </p>
          </div>

          <div className="bio-org-profile-actions" style={{ paddingBottom: 'max(1.35rem, calc(env(safe-area-inset-bottom, 0px) + 1.45rem))' }}>
            <Button variant="outline" className="bio-org-profile-cancel" onClick={closeCreateAccount} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              className="bio-org-profile-confirm"
              onClick={handleCreateAccount}
              disabled={isLoading || organizations.length === 0 || !canCreateAccount}
            >
              Save Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isOrgTeamManagerOpen) {
    return (
      <div className="bio-admin-shell bio-org-profile-shell bio-safe-screen" style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y' }}>
        <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
        <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

        <div className="bio-admin-panel bio-org-profile-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 'min(92dvh, 48rem)' }}>
          <div className="bio-org-profile-header">
            <Button
              variant="ghost"
              size="icon"
              className="bio-member-settings-btn bio-org-profile-back"
              onClick={closeOrgTeamManager}
              aria-label="Back to account control dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <p className="bio-admin-kicker">Account Control</p>
              <h1 className="bio-admin-title bio-org-profile-title">Manage Organization & Team</h1>
              <p className="bio-admin-subtitle">Rename atau delete organization dan team dari halaman ini.</p>
            </div>
          </div>

          <div className="bio-admin-section">
            <Button variant="outline" onClick={handleReload} disabled={isLoading} className="w-full bg-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Organization Data
            </Button>
          </div>

          <div className="bio-admin-section space-y-3">
            {organizations.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Belum ada organization aktif.</p>
              </div>
            )}

            {organizations.map((organization) => (
              <div key={organization.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-slate-900">{organization.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {organization.teams.length} team
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">ID: {organization.id}</p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                      variant="outline"
                      className="h-10 flex-1 px-4 sm:flex-none"
                      onClick={() => handleRenameOrganization(organization.id, organization.name)}
                      disabled={isLoading}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-10 flex-1 px-4 sm:flex-none"
                      onClick={() => handleDeleteOrganization(organization.id, organization.name)}
                      disabled={isLoading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Teams</p>
                  {organization.teams.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm text-slate-500">Belum ada team pada organization ini.</p>
                    </div>
                  )}
                  {organization.teams.map((team) => (
                    <div key={team.id} className="min-h-[5.25rem] rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{team.name}</p>
                          <p className="text-xs text-slate-500">ID: {team.id}</p>
                        </div>
                        <div className="flex w-full gap-2 self-start sm:w-auto sm:self-auto">
                          <Button
                            variant="outline"
                            className="h-9 flex-1 px-4 sm:flex-none"
                            onClick={() => handleRenameTeam(team.id, team.name)}
                            disabled={isLoading}
                          >
                            Rename
                          </Button>
                          <Button
                            variant="destructive"
                            className="h-9 flex-1 px-4 sm:flex-none"
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                            disabled={isLoading}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Ringkasan</p>
              <p className="mt-1 text-xs text-slate-600">
                Total organization: {organizations.length} | Total team: {organizations.reduce((acc, item) => acc + item.teams.length, 0)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Tips: gunakan Rename untuk perubahan minor. Gunakan Delete hanya jika data memang tidak diperlukan lagi.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAccountListOpen) {
    return (
      <div className="bio-admin-shell bio-org-profile-shell bio-safe-screen" style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y' }}>
        <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
        <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

        <div className="bio-admin-panel bio-org-profile-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 'min(92dvh, 48rem)' }}>
          <div className="bio-org-profile-header">
            <Button
              variant="ghost"
              size="icon"
              className="bio-member-settings-btn bio-org-profile-back"
              onClick={closeAccountListPage}
              aria-label="Back to account control dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <p className="bio-admin-kicker">Account Control</p>
              <h1 className="bio-admin-title bio-org-profile-title">Account Lists</h1>
              <p className="bio-admin-subtitle">Daftar akun admin/member dengan mode pengelompokan organisasi atau team.</p>
            </div>
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Search Account</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Cari username, organisasi, atau team"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bio-org-profile-input"
                disabled={isLoading}
              />
              <Button variant="outline" onClick={handleReload} disabled={isLoading} className="sm:w-auto">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSortOrder((prev) => (prev === 'az' ? 'za' : 'az'))}
                disabled={isLoading}
                className="sm:w-auto"
              >
                <ArrowUpAZ className="w-4 h-4 mr-1" />
                {sortOrder === 'az' ? 'A-Z' : 'Z-A'}
              </Button>
            </div>
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Group By</p>
            <Select
              value={accountGroupBy}
              onValueChange={(value: 'organization' | 'team') => setAccountGroupBy(value)}
            >
              <SelectTrigger className="bio-org-profile-input">
                <SelectValue placeholder="Pilih metode pengelompokan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bio-admin-section">
            <Button
              className="w-full"
              onClick={() => setIsPasswordPickerOpen(true)}
              disabled={isLoading}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Edit Password Account
            </Button>
          </div>

          <div className="bio-admin-section">
            <div className="flex items-center justify-between">
              <p className="bio-org-profile-label mb-0">Admin Accounts</p>
              <p className="text-xs font-medium text-slate-500">{filteredAdmins.length} akun</p>
            </div>
            <div className="space-y-3 max-h-[34dvh] overflow-y-auto pr-1">
              {groupedAdminsByOrganization.length === 0 && (
                <p className="text-sm text-slate-500">Tidak ada akun admin aktif.</p>
              )}
              {groupedAdminsByOrganization.map(([organizationName, adminItems]) => (
                  <div key={organizationName} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">{organizationName}</p>
                    <div className="space-y-3">
                    {adminItems.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                              <p className="text-base font-semibold text-slate-900">{item.username}</p>
                              <p className="text-sm text-slate-500">Last login: {formatLastLogin(item.lastLogin)}</p>
                          </div>
                          <Button
                            variant="destructive"
                              className="h-10 px-4 self-start sm:self-auto"
                            onClick={() => handleDelete('admin', item.id, item.username)}
                            disabled={isLoading}
                          >
                              <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bio-admin-section">
            <div className="flex items-center justify-between">
              <p className="bio-org-profile-label mb-0">Member Accounts</p>
              <p className="text-xs font-medium text-slate-500">{filteredMembers.length} akun</p>
            </div>
            <div className="space-y-3 max-h-[42dvh] overflow-y-auto pr-1">
              {accountGroupBy === 'organization' && groupedMembersByOrganization.length === 0 && (
                <p className="text-sm text-slate-500">Tidak ada akun member aktif.</p>
              )}
              {accountGroupBy === 'team' && groupedMembersByTeam.length === 0 && (
                <p className="text-sm text-slate-500">Tidak ada akun member aktif.</p>
              )}

              {accountGroupBy === 'organization' && groupedMembersByOrganization.map(([groupLabel, memberItems]) => (
                  <div key={groupLabel} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">{groupLabel}</p>
                    <div className="space-y-3">
                    {memberItems.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                              <p className="text-base font-semibold text-slate-900">{item.username}</p>
                              <p className="text-sm text-slate-600">Team: {item.teamName}</p>
                              <p className="text-sm text-slate-500">Last login: {formatLastLogin(item.lastLogin)}</p>
                          </div>
                          <Button
                            variant="destructive"
                              className="h-10 px-4 self-start sm:self-auto"
                            onClick={() => handleDelete('member', item.id, item.username)}
                            disabled={isLoading}
                          >
                              <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {accountGroupBy === 'team' && groupedMembersByTeam.map((group) => (
                  <div key={group.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">{group.label}</p>
                    <div className="space-y-3">
                    {group.items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                              <p className="text-base font-semibold text-slate-900">{item.username}</p>
                              <p className="text-sm text-slate-500">Last login: {formatLastLogin(item.lastLogin)}</p>
                          </div>
                          <Button
                            variant="destructive"
                              className="h-10 px-4 self-start sm:self-auto"
                            onClick={() => handleDelete('member', item.id, item.username)}
                            disabled={isLoading}
                          >
                              <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isControlCredentialsOpen) {
    return (
      <div className="bio-admin-shell bio-org-profile-shell bio-safe-screen" style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y' }}>
        <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
        <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

        <div className="bio-admin-panel bio-org-profile-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 'min(92dvh, 48rem)' }}>
          <div className="bio-org-profile-header">
            <Button
              variant="ghost"
              size="icon"
              className="bio-member-settings-btn bio-org-profile-back"
              onClick={closeControlCredentialsEditor}
              aria-label="Back to account control dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <p className="bio-admin-kicker">Account Control</p>
              <h1 className="bio-admin-title bio-org-profile-title">Edit Control Account</h1>
              <p className="bio-admin-subtitle">Ubah username dan password untuk akun control.</p>
            </div>
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Current Password</p>
            <Input
              type="password"
              placeholder="Masukkan password control saat ini"
              value={controlCurrentPassword}
              onChange={(e) => setControlCurrentPassword(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">New Username</p>
            <Input
              placeholder="Masukkan username control baru"
              value={controlNewUsername}
              onChange={(e) => setControlNewUsername(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">New Password</p>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={controlNewPassword}
              onChange={(e) => setControlNewPassword(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Confirm New Password</p>
            <Input
              type="password"
              placeholder="Ulangi password baru"
              value={controlConfirmPassword}
              onChange={(e) => setControlConfirmPassword(e.target.value)}
              className="bio-org-profile-input"
              disabled={isLoading}
            />
          </div>

          <div className="bio-org-profile-actions" style={{ paddingBottom: 'max(1.35rem, calc(env(safe-area-inset-bottom, 0px) + 1.45rem))' }}>
            <Button variant="outline" className="bio-org-profile-cancel" onClick={closeControlCredentialsEditor} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              className="bio-org-profile-confirm"
              onClick={handleUpdateControlCredentials}
              disabled={
                isLoading
                || controlCurrentPassword.trim().length === 0
                || controlNewUsername.trim().length === 0
                || controlNewPassword.trim().length === 0
                || controlConfirmPassword.trim().length === 0
              }
            >
              Save Control Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isPasswordPickerOpen) {
    return (
      <div className="bio-admin-shell bio-org-profile-shell bio-safe-screen" style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y' }}>
        <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
        <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

        <div className="bio-admin-panel bio-org-profile-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 'min(92dvh, 48rem)' }}>
          <div className="bio-org-profile-header">
            <Button
              variant="ghost"
              size="icon"
              className="bio-member-settings-btn bio-org-profile-back"
              onClick={() => setIsPasswordPickerOpen(false)}
              aria-label="Back to account control"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
              <p className="bio-admin-kicker">Account Control</p>
              <h1 className="bio-admin-title bio-org-profile-title">Choose Account Password</h1>
              <p className="bio-admin-subtitle">Cari akun admin/member yang ingin diubah password-nya.</p>
            </div>
          </div>

          <div className="bio-admin-section">
            <p className="bio-org-profile-label">Search Account</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Cari username atau organisasi"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bio-org-profile-input"
                disabled={isLoading}
              />
              <Button variant="outline" onClick={handleReload} disabled={isLoading} className="sm:w-auto">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSortOrder((prev) => (prev === 'az' ? 'za' : 'az'))}
                disabled={isLoading}
                className="sm:w-auto"
              >
                <ArrowUpAZ className="w-4 h-4 mr-1" />
                {sortOrder === 'az' ? 'A-Z' : 'Z-A'}
              </Button>
            </div>
          </div>

          <div className="bio-admin-section">
            <div className="flex items-center justify-between">
              <p className="bio-org-profile-label mb-0">Admin Accounts</p>
              <p className="text-xs font-medium text-slate-500">{filteredAdmins.length} akun</p>
            </div>
            <div className="space-y-3 max-h-[34dvh] overflow-y-auto pr-1">
              {filteredAdmins.length === 0 && <p className="text-sm text-slate-500">Tidak ada akun admin aktif.</p>}
              {filteredAdmins.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.username}</p>
                      <p className="text-sm text-slate-600">{item.organizationName}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openPasswordEditor({
                          type: 'admin',
                          accountId: item.id,
                          username: item.username,
                          organizationName: item.organizationName,
                        })
                      }
                      disabled={isLoading}
                    >
                      <KeyRound className="w-4 h-4 mr-1" />
                      Pilih
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bio-admin-section">
            <div className="flex items-center justify-between">
              <p className="bio-org-profile-label mb-0">Member Accounts</p>
              <p className="text-xs font-medium text-slate-500">{filteredMembers.length} akun</p>
            </div>
            <div className="space-y-3 max-h-[40dvh] overflow-y-auto pr-1">
              {filteredMembers.length === 0 && <p className="text-sm text-slate-500">Tidak ada akun member aktif.</p>}
              {filteredMembers.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.username}</p>
                      <p className="text-sm text-slate-600">{item.organizationName} - {item.teamName}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openPasswordEditor({
                          type: 'member',
                          accountId: item.id,
                          username: item.username,
                          organizationName: item.organizationName,
                          teamName: item.teamName,
                        })
                      }
                      disabled={isLoading}
                    >
                      <KeyRound className="w-4 h-4 mr-1" />
                      Pilih
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bio-admin-shell bio-org-profile-shell bio-safe-screen" style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y' }}>
      <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
      <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

      <div className="bio-admin-panel bio-org-profile-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 'min(92dvh, 48rem)' }}>
        <div className="bio-org-profile-header">
          <Button
            variant="ghost"
            size="icon"
            className="bio-member-settings-btn bio-org-profile-back"
            onClick={handleDashboardBackPress}
            aria-label="Back disabled in account control dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div>
            <p className="bio-admin-kicker">Account Control</p>
            <h1 className="bio-admin-title bio-org-profile-title">Delete Unused Accounts</h1>
            <p className="bio-admin-subtitle">Kelola akun admin dan member yang tidak dipakai lagi.</p>
          </div>
        </div>

        <div className="bio-admin-section">
          <p className="bio-org-profile-label">Control Profile</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="h-12 w-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#000000' }}
                onClick={handleControlLogout}
                title="Logout Control"
                aria-label="Logout control"
              >
                <User className="w-7 h-7" style={{ color: '#ffffff', strokeWidth: 2.4 }} />
              </button>
              <div>
                <p className="text-base font-semibold text-slate-900">{controlProfile?.username || 'Control User'}</p>
                <p className="text-sm text-slate-600">Role: Account Controller</p>
                <p className="text-xs text-slate-500">
                  Initial: {getControlInitials(controlProfile?.username || 'Control User')} | Login at: {formatLastLogin(controlProfile?.signedInAt)}
                </p>
                <p className="text-xs text-slate-500">Tap icon profile untuk logout.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bio-admin-section">
          <p className="bio-org-profile-label">Quick Actions</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="h-12 w-full justify-start border-0 px-4 text-[15px] font-semibold shadow-sm"
                style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                onClick={openControlCredentialsEditor}
                disabled={isLoading}
              >
                <User className="w-5 h-5 mr-2" />
                Edit Control Account
              </Button>

              <Button
                variant="outline"
                className="h-12 w-full justify-start border-0 px-4 text-[15px] font-semibold shadow-sm"
                style={{ backgroundColor: '#e0f2fe', color: '#0c4a6e' }}
                onClick={onCreateOrganization}
                disabled={isLoading}
              >
                Create Organization
              </Button>

              <Button
                variant="outline"
                className="h-12 w-full justify-start border-0 px-4 text-[15px] font-semibold shadow-sm"
                style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                onClick={openCreateAccount}
                disabled={isLoading}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add Admin/Member
              </Button>

              <Button
                variant="outline"
                className="h-12 w-full justify-start border-0 px-4 text-[15px] font-semibold shadow-sm"
                style={{ backgroundColor: '#ffe4e6', color: '#9f1239' }}
                onClick={openOrgTeamManager}
                disabled={isLoading}
              >
                Manage Organization & Team
              </Button>

              <Button
                variant="outline"
                className="h-12 w-full justify-start border-0 px-4 text-[15px] font-semibold shadow-sm sm:col-span-2"
                style={{ backgroundColor: '#e9d5ff', color: '#6b21a8' }}
                onClick={openAccountListPage}
                disabled={isLoading}
              >
                <KeyRound className="w-5 h-5 mr-2" />
                Account Lists
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
