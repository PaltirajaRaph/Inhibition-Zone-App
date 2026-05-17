import { ArrowLeft, Book, ChevronRight, Info, ShieldCheck, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface SettingsProps {
	onBack: () => void;
	onViewAntibiotics?: () => void;
	onLogout?: () => void;
}

export default function SettingsPage({ onBack, onViewAntibiotics, onLogout }: SettingsProps) {
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

					<div className="bio-member-section">
						<h2 className="bio-member-section-title">Data Management</h2>
						<Card className="bio-settings-actions-card">
							<Button variant="outline" className="bio-settings-action bio-settings-action-neutral">
								<ShieldCheck className="w-4 h-4 mr-2" />
								Security Preferences
							</Button>
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
