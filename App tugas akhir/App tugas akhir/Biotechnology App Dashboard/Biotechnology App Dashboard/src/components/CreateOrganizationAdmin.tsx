import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CreateOrganizationAdminProps {
	onBack: () => void;
	onConfirm: (adminData: { username: string; password: string }) => Promise<boolean>;
}

export default function CreateOrganizationAdmin({
	onBack,
	onConfirm,
}: CreateOrganizationAdminProps) {
	const [adminName, setAdminName] = useState('');
	const [adminPassword, setAdminPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isPasswordValid = (password: string) => {
		const value = password;
		const hasUpper = /[A-Z]/.test(value);
		const hasLower = /[a-z]/.test(value);
		const hasNumber = /\d/.test(value);
		const hasSymbol = /[^A-Za-z0-9\s]/.test(value);
		return hasUpper && hasLower && hasNumber && hasSymbol;
	};

	const hasEmptyFields = adminName.trim().length === 0 || adminPassword.trim().length === 0;
	const hasShortPassword = adminPassword.trim().length > 0 && adminPassword.trim().length < 8;
	const hasInvalidPassword =
		adminPassword.trim().length >= 8 && adminPassword.trim().length > 0 && !isPasswordValid(adminPassword);

	const handleConfirm = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		await onConfirm({
			username: adminName.trim(),
			password: adminPassword
		});
		setIsSubmitting(false);
	};

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
						<p className="bio-auth-step">Step 2 of 4</p>
						<h2 className="bio-auth-title">Create Admin Account</h2>
					</div>
				</div>

				<p className="bio-auth-subtitle">
					Buat akun administrator organisasi untuk mengelola nama organisasi, tim, dan member.
				</p>

				<div className="bio-auth-form">
					<label className="bio-auth-label">Admin Username</label>
					<Input
						placeholder="Masukkan username admin"
						value={adminName}
						onChange={(e) => setAdminName(e.target.value)}
						className="bio-auth-input"
					/>

					<label className="bio-auth-label">Admin Password</label>
					<Input
						type="password"
						placeholder="Masukkan password admin"
						value={adminPassword}
						onChange={(e) => setAdminPassword(e.target.value)}
						className="bio-auth-input"
					/>
					{hasShortPassword && (
						<p className="bio-auth-info">
							Minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol.
						</p>
					)}
					{!hasShortPassword && hasInvalidPassword && (
						<p className="bio-auth-info">
							Password harus mengandung huruf besar, huruf kecil, angka, dan simbol.
						</p>
					)}

					<div className="bio-auth-actions">
						<Button
							className="bio-auth-primary"
							onClick={handleConfirm}
							disabled={hasEmptyFields || hasShortPassword || hasInvalidPassword || isSubmitting}
						>
							{isSubmitting ? 'Memeriksa...' : 'Lanjutkan'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

