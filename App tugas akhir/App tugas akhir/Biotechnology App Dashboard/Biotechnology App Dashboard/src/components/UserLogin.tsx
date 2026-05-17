import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface UserLoginProps {
	onBack: () => void;
	onConfirm: () => void;
	onLogin: (username: string, password: string) => Promise<boolean>;
}

export default function UserLogin({ onBack, onConfirm, onLogin }: UserLoginProps) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const isValid = username.trim().length > 0 && password.trim().length > 0;

	const handleSubmit = async () => {
		if (!isValid) return;

		setIsLoading(true);
		setError('');

		const success = await onLogin(username.trim(), password);

		if (success) {
			onConfirm();
		} else {
			setError('Username atau password salah, atau akun tidak terdaftar');
		}

		setIsLoading(false);
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
						<p className="bio-auth-step">Member Access</p>
						<h2 className="bio-auth-title">User Login</h2>
					</div>
				</div>

				<p className="bio-auth-subtitle">
					Masuk untuk mengakses dashboard analisis, riwayat pengujian, dan laporan laboratorium.
				</p>

				<div className="bio-auth-form">
					<label className="bio-auth-label">Username</label>
					<Input
						placeholder="Masukkan username"
						value={username}
						onChange={(e) => {
							setUsername(e.target.value);
							setError('');
						}}
						className="bio-auth-input"
						disabled={isLoading}
					/>

					<label className="bio-auth-label">Password</label>
					<div style={{ position: 'relative' }}>
						<Input
							type={isPasswordVisible ? 'text' : 'password'}
							placeholder="Masukkan password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setError('');
							}}
							className="bio-auth-input"
							style={{ paddingRight: '2.75rem' }}
							disabled={isLoading}
						/>
						<button
							type="button"
							onClick={() => setIsPasswordVisible((prev) => !prev)}
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
							aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
							disabled={isLoading}
						>
							{isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>

					{error && <p className="text-sm text-red-600">{error}</p>}

					<div className="bio-auth-actions">
						<Button
							className="bio-auth-primary"
							onClick={handleSubmit}
							disabled={!isValid || isLoading}
						>
							{isLoading ? 'Memproses...' : 'Masuk'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
