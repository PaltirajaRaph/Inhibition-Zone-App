import { Button } from './ui/button';

interface LoginProps {
	onLogin: () => void;
	onAdminLogin: () => void;
	onAccountControl: () => void;
}

export default function Login({ onLogin, onAdminLogin, onAccountControl }: LoginProps) {
	return (
		<div className="bio-login-shell">
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div className="bio-login-panel">
				<div className="bio-login-badge">Clinical Operations Platform</div>
				<h1 className="bio-login-title">Antibiotic Resistance Intelligence</h1>
				<p className="bio-login-subtitle">
					Secure workspace for laboratory teams, hospital units, and antimicrobial stewardship.
				</p>

				<div className="bio-login-actions">
					<Button
						onClick={onLogin}
						className="bio-login-button bio-login-button-member"
						size="lg"
					>
						Member Login
					</Button>

					<Button
						onClick={onAdminLogin}
						className="bio-login-button bio-login-button-admin"
						size="lg"
					>
						Admin Login
					</Button>

					<Button
						onClick={onAccountControl}
						className="bio-login-button bio-login-button-control"
						variant="outline"
						size="lg"
					>
						Account Control
					</Button>
				</div>
			</div>
		</div>
	);
}
