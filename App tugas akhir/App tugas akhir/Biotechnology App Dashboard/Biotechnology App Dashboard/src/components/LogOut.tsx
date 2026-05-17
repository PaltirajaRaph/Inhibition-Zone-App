import { LogOut as LogOutIcon, ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface LogOutProps {
	onCancel: () => void;
	onLogOut: () => void;
}

export default function LogOut({ onCancel, onLogOut }: LogOutProps) {
	return (
		<div className="bio-member-shell">
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div className="bio-member-panel bio-logout-panel">
				<p className="bio-member-kicker">Session Protection</p>
				<h1 className="bio-logout-title">Konfirmasi Log Out</h1>
				<p className="bio-logout-subtitle">
					Anda akan keluar dari akun saat ini. Pastikan data penting sudah tersimpan.
				</p>

				<Card className="bio-logout-card">
					<div className="bio-logout-icon-wrap">
						<ShieldAlert className="w-6 h-6" />
					</div>
					<div>
						<p className="bio-logout-card-title">Keluar dari workspace?</p>
						<p className="bio-logout-card-desc">
							Tekan tombol log out untuk mengakhiri sesi login Anda dengan aman.
						</p>
					</div>
				</Card>

				<div className="bio-logout-actions">
					<Button variant="outline" className="bio-auth-secondary" onClick={onCancel}>
						Batal
					</Button>
					<Button variant="destructive" className="bio-logout-danger" onClick={onLogOut}>
						<LogOutIcon className="w-4 h-4 mr-2" />
						Log Out
					</Button>
				</div>
			</div>
		</div>
	);
}

