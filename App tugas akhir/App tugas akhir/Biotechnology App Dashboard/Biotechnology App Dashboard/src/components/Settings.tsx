import { ArrowLeft, Book, ChevronRight, Info, Server, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

type Role = 'admin' | 'member';

const YOLO_BASE_KEY = 'biotech.yolo_api_base';
const YOLO_FALLBACKS_KEY = 'biotech.yolo_api_fallbacks';
const HOMOGRAPHY_BASE_KEY = 'biotech.homography_api_base';
const HOMOGRAPHY_FALLBACKS_KEY = 'biotech.homography_api_fallbacks';

const safeReadStorage = (key: string) => {
	if (typeof window === 'undefined') return '';
	try {
		return localStorage.getItem(key) || '';
	} catch (error) {
		console.error('Failed to read localStorage:', error);
		return '';
	}
};

const safeWriteStorage = (key: string, value: string) => {
	if (typeof window === 'undefined') return;
	try {
		if (value) {
			localStorage.setItem(key, value);
		} else {
			localStorage.removeItem(key);
		}
	} catch (error) {
		console.error('Failed to write localStorage:', error);
	}
};

const normalizeBaseList = (value: string) =>
	value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.join(', ');

interface SettingsProps {
	onBack: () => void;
	onViewAntibiotics?: () => void;
	onLogout?: () => void;
	currentRole?: Role | null;
	currentUsername?: string;
	onUpdateSelfAccount?: (
		role: Role,
		currentPassword: string,
		newUsername: string,
		newPassword?: string | null,
	) => Promise<{ username: string } | null>;
}

export function Settings({
	onBack,
	onViewAntibiotics,
	onLogout,
	currentRole,
	currentUsername,
	onUpdateSelfAccount,
}: SettingsProps) {
	const [isAccountEditorOpen, setIsAccountEditorOpen] = useState(false);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newUsername, setNewUsername] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [yoloBaseUrl, setYoloBaseUrl] = useState(() => safeReadStorage(YOLO_BASE_KEY));
	const [yoloFallbacks, setYoloFallbacks] = useState(() => safeReadStorage(YOLO_FALLBACKS_KEY));
	const [homographyBaseUrl, setHomographyBaseUrl] = useState(() => safeReadStorage(HOMOGRAPHY_BASE_KEY));
	const [homographyFallbacks, setHomographyFallbacks] = useState(() => safeReadStorage(HOMOGRAPHY_FALLBACKS_KEY));

	const effectiveRole = currentRole === 'admin' || currentRole === 'member' ? currentRole : null;
	const effectiveUsername = (currentUsername || '').trim();

	const openSelfAccountEditor = () => {
		if (!effectiveRole || !onUpdateSelfAccount) return;
		setIsAccountEditorOpen(true);
		setCurrentPassword('');
		setNewUsername(effectiveUsername);
		setNewPassword('');
		setConfirmPassword('');
	};

	const closeSelfAccountEditor = () => {
		setIsAccountEditorOpen(false);
		setCurrentPassword('');
		setNewPassword('');
		setConfirmPassword('');
	};

	const handleSaveSelfAccount = async () => {
		if (!effectiveRole || !onUpdateSelfAccount) return;

		const nextUsername = newUsername.trim();
		const nextPassword = newPassword.trim();
		const nextConfirmPassword = confirmPassword.trim();

		if (!currentPassword) {
			toast.error('Current password wajib diisi');
			return;
		}

		if (nextUsername.length < 3) {
			toast.error('Username terlalu pendek', { description: 'Minimal 3 karakter.' });
			return;
		}


		const wantsPasswordChange = nextPassword.length > 0 || nextConfirmPassword.length > 0;
		if (wantsPasswordChange) {
			if (nextPassword.length < 6) {
				toast.error('Password terlalu pendek', { description: 'Minimal 6 karakter.' });
				return;
			}

			if (nextPassword !== nextConfirmPassword) {
				toast.error('Konfirmasi password tidak cocok');
				return;
			}
		}

		setIsSaving(true);
		const updated = await onUpdateSelfAccount(
			effectiveRole,
			currentPassword,
			nextUsername,
			wantsPasswordChange ? nextPassword : null,
		);
		setIsSaving(false);

		if (!updated) return;

		toast.success('Akun berhasil diperbarui');
		setNewUsername(updated.username);
		closeSelfAccountEditor();
	};

	const handleSaveServerSettings = () => {
		const normalizedYoloBase = yoloBaseUrl.trim();
		const normalizedYoloFallbacks = normalizeBaseList(yoloFallbacks);
		const normalizedHomographyBase = homographyBaseUrl.trim();
		const normalizedHomographyFallbacks = normalizeBaseList(homographyFallbacks);

		safeWriteStorage(YOLO_BASE_KEY, normalizedYoloBase);
		safeWriteStorage(YOLO_FALLBACKS_KEY, normalizedYoloFallbacks);
		safeWriteStorage(HOMOGRAPHY_BASE_KEY, normalizedHomographyBase);
		safeWriteStorage(HOMOGRAPHY_FALLBACKS_KEY, normalizedHomographyFallbacks);

		setYoloBaseUrl(normalizedYoloBase);
		setYoloFallbacks(normalizedYoloFallbacks);
		setHomographyBaseUrl(normalizedHomographyBase);
		setHomographyFallbacks(normalizedHomographyFallbacks);
		toast.success('Server inference disimpan');
	};

	const handleResetServerSettings = () => {
		safeWriteStorage(YOLO_BASE_KEY, '');
		safeWriteStorage(YOLO_FALLBACKS_KEY, '');
		safeWriteStorage(HOMOGRAPHY_BASE_KEY, '');
		safeWriteStorage(HOMOGRAPHY_FALLBACKS_KEY, '');
		setYoloBaseUrl('');
		setYoloFallbacks('');
		setHomographyBaseUrl('');
		setHomographyFallbacks('');
		toast.success('Server inference direset');
	};

	return (
		<div className="bio-member-shell">
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div className="bio-member-panel bio-settings-panel">
				<div className="bio-settings-header">
					<div className="bio-settings-topbar">
						<Button variant="ghost" size="icon" onClick={onBack} className="bio-member-settings-btn">
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<div>
							<p className="bio-member-kicker">Workspace Settings</p>
							<h1 className="bio-settings-title">Settings</h1>
							<p className="bio-settings-subtitle">Application preferences and account controls</p>
						</div>
					</div>
				</div>

				<div className="bio-settings-content bio-settings-list">
					<div className="bio-member-section">
						<h2 className="bio-member-section-title">About</h2>
						<Card className="bio-settings-about-card">
							<div className="bio-settings-about-row">
								<div className="bio-settings-about-icon">
									<Info className="w-5 h-5" />
								</div>
								<div>
									<p className="bio-settings-about-title">Antibiotic Resistance App</p>
									<p className="bio-settings-about-version">Version 1.0.0</p>
									<p className="bio-settings-about-text">
										Antibiotic resistance analysis app using computer vision to automatically detect
										inhibition zones.
									</p>
								</div>
							</div>
						</Card>
					</div>

					{onViewAntibiotics && (
						<div className="bio-member-section">
							<h2 className="bio-member-section-title">Antibiotic Database</h2>
							<Card className="bio-settings-antibiotic-card" onClick={onViewAntibiotics}>
								<div className="bio-settings-antibiotic-row">
									<div className="bio-settings-antibiotic-icon">
										<Book className="w-6 h-6" />
									</div>
									<div>
										<p className="bio-settings-antibiotic-title">Open Antibiotic Database</p>
										<p className="bio-settings-antibiotic-desc">
											Reference data and CLSI standards for quick decision support.
										</p>
									</div>
									<ChevronRight className="w-5 h-5 text-slate-500" />
								</div>
							</Card>
						</div>
					)}

					{onUpdateSelfAccount && effectiveRole && (
						<div className="bio-member-section">
							<h2 className="bio-member-section-title">My Account</h2>
							<Card className="bio-settings-actions-card">
								<Button variant="outline" className="bio-settings-action bio-settings-action-primary" onClick={openSelfAccountEditor}>
									<User className="w-4 h-4 mr-2" />
									Edit My Username & Password
								</Button>

								{isAccountEditorOpen && (
									<div className="space-y-3 pt-2">
										<div>
											<p className="text-sm font-medium text-slate-700 mb-1">Current Password</p>
											<Input
												type="password"
												placeholder="Masukkan password saat ini"
												value={currentPassword}
												onChange={(e) => setCurrentPassword(e.target.value)}
												disabled={isSaving}
											/>
										</div>
										<div>
											<p className="text-sm font-medium text-slate-700 mb-1">New Username</p>
											<Input
												placeholder="Masukkan username baru"
												value={newUsername}
												onChange={(e) => setNewUsername(e.target.value)}
												disabled={isSaving}
											/>
										</div>
										<div>
											<p className="text-sm font-medium text-slate-700 mb-1">New Password</p>
											<Input
												type="password"
												placeholder="Minimal 6 karakter"
												value={newPassword}
												onChange={(e) => setNewPassword(e.target.value)}
												disabled={isSaving}
											/>
										</div>
										<div>
											<p className="text-sm font-medium text-slate-700 mb-1">Confirm New Password</p>
											<Input
												type="password"
												placeholder="Ulangi password baru"
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
												disabled={isSaving}
											/>
										</div>
										<div className="flex gap-2">
											<Button variant="outline" className="flex-1" onClick={closeSelfAccountEditor} disabled={isSaving}>
												Cancel
											</Button>
											<Button className="flex-1" onClick={handleSaveSelfAccount} disabled={isSaving}>
												Save Account
											</Button>
										</div>
									</div>
								)}
							</Card>
						</div>
					)}

					<div className="bio-member-section">
						<h2 className="bio-member-section-title">Inference Server (GPU)</h2>
						<Card className="bio-settings-actions-card">
							<div className="text-xs text-slate-500">
								Masukkan URL server GPU untuk YOLO (port 9000) dan Homography (port 8000).
							</div>
							<div>
								<p className="text-sm font-medium text-slate-700 mb-1">YOLO API Base URL</p>
								<Input
									placeholder="http://192.168.1.10:9000"
									value={yoloBaseUrl}
									onChange={(e) => setYoloBaseUrl(e.target.value)}
								/>
							</div>
							<div>
								<p className="text-sm font-medium text-slate-700 mb-1">YOLO Fallbacks (opsional)</p>
								<Input
									placeholder="http://192.168.1.11:9000, http://192.168.1.12:9000"
									value={yoloFallbacks}
									onChange={(e) => setYoloFallbacks(e.target.value)}
								/>
							</div>
							<div>
								<p className="text-sm font-medium text-slate-700 mb-1">Homography API Base URL</p>
								<Input
									placeholder="http://192.168.1.10:8000"
									value={homographyBaseUrl}
									onChange={(e) => setHomographyBaseUrl(e.target.value)}
								/>
							</div>
							<div>
								<p className="text-sm font-medium text-slate-700 mb-1">Homography Fallbacks (opsional)</p>
								<Input
									placeholder="http://192.168.1.11:8000, http://192.168.1.12:8000"
									value={homographyFallbacks}
									onChange={(e) => setHomographyFallbacks(e.target.value)}
								/>
							</div>
							<div className="flex gap-2">
								<Button variant="outline" className="flex-1" onClick={handleResetServerSettings}>
									Reset
								</Button>
								<Button className="flex-1" onClick={handleSaveServerSettings}>
									Simpan
								</Button>
							</div>
							<div className="text-xs text-slate-500 flex items-center gap-2">
								<Server className="h-4 w-4" />
								Pastikan server dapat diakses dari perangkat yang sama jaringan.
							</div>
						</Card>
					</div>

					<div className="bio-member-section">
						<h2 className="bio-member-section-title">Data Management</h2>
						<Card className="bio-settings-actions-card">
							<Button variant="outline" className="bio-settings-action bio-settings-action-primary">
								Backup Data to Cloud
							</Button>
							<Button variant="outline" className="bio-settings-action bio-settings-action-warn">
								Restore Data from Backup
							</Button>
							<Button
								variant="outline"
								className="bio-settings-action bio-settings-action-danger"
								onClick={() => {
									if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
										localStorage.clear();
										alert('Data deleted. Refresh the page to reset the app.');
									}
								}}
							>
								Delete All Data
							</Button>
							{onLogout && (
								<Button
									variant="outline"
									className="bio-settings-action bio-settings-action-danger"
									onClick={onLogout}
								>
									<User className="w-4 h-4 mr-2" />
									Log Out
								</Button>
							)}
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Settings;
