import {
	ChevronRight,
	Settings,
	ShieldCheck,
	Building2,
	Users,
	BarChart3,
} from 'lucide-react';
import { Button } from './ui/button';

const normalizeList = (items: string[]) =>
	items.map((t) => t.trim()).filter((t) => t.length > 0);

interface AdminDashboardProps {
	adminUsername: string;
	organizationName: string;
	organizationTeamNames: string[];
	organizationMemberNames: string[];
	onEditOrganizationName: () => void;
	onEditOrganizationTeamItem: (index: number) => void;
	onEditOrganizationMemberItem: (index: number) => void;
	onAddOrganizationTeam: () => void;
	onAddOrganizationMember: () => void;
	onViewSettings: () => void;
	onViewAnalytics: () => void;
	onLogout: () => void;
}

export default function AdminDashboard({
	adminUsername,
	organizationName,
	organizationTeamNames,
	organizationMemberNames,
	onEditOrganizationName,
	onEditOrganizationTeamItem,
	onEditOrganizationMemberItem,
	onAddOrganizationTeam,
	onAddOrganizationMember,
	onViewSettings,
	onViewAnalytics,
}: AdminDashboardProps) {
	const organizationNameText = organizationName.trim().length > 0 ? organizationName : '(organization name)';
	const adminNameText = adminUsername.trim().length > 0 ? adminUsername : 'Admin';
	const cleanedTeamNames = normalizeList(organizationTeamNames);
	const cleanedMemberNames = normalizeList(organizationMemberNames);
	const totalTeams = cleanedTeamNames.length;
	const totalMembers = cleanedMemberNames.length;
	const adminInitials = adminNameText
		.split(/\s+/)
		.filter((part) => part.length > 0)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join('');

	return (
		<div className="bio-admin-shell">
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div className="bio-admin-panel">
				<div className="bio-admin-header">
					<div className="bio-admin-header-top">
						<div>
							<p className="bio-admin-kicker">Administrator Workspace</p>
							<h1 className="bio-admin-title">Antibiotic Resistance Intelligence</h1>
							<p className="bio-admin-subtitle">
								Manage organization structure, members, and core system access in one secure panel.
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={onViewSettings}
							className="bio-member-settings-btn bio-admin-settings-btn"
						>
							<Settings className="w-5 h-5" />
						</Button>
					</div>

					<div className="bio-admin-profile" aria-label="Admin profile">
						<div className="bio-admin-profile-avatar">{adminInitials || 'A'}</div>
						<div>
							<p className="bio-admin-profile-name">{adminNameText}</p>
							<p className="bio-admin-profile-role">Organization Administrator</p>
						</div>
					</div>

					<div className="bio-admin-stats" aria-hidden="true">
						<div className="bio-admin-stat-card">
							<Building2 className="w-4 h-4" />
							<span>{organizationNameText}</span>
						</div>
						<div className="bio-admin-stat-card">
							<Users className="w-4 h-4" />
							<span>{totalTeams} team</span>
						</div>
						<div className="bio-admin-stat-card">
							<ShieldCheck className="w-4 h-4" />
							<span>{totalMembers} member</span>
						</div>
					</div>
				</div>

				<div className="bio-admin-section">
					<h2 className="bio-admin-section-title">Organization Profile</h2>
					<Button
						variant="outline"
						size="lg"
						className="bio-admin-item-button"
						onClick={onEditOrganizationName}
					>
						<span className="truncate">{organizationNameText}</span>
						<ChevronRight className="w-5 h-5 text-slate-500" />
					</Button>
				</div>

				<div className="bio-admin-section">
					<h2 className="bio-admin-section-title">Realtime Analytics</h2>
					<Button
						variant="outline"
						size="lg"
						className="bio-admin-item-button"
						onClick={onViewAnalytics}
					>
						<span className="flex items-center gap-2 truncate">
							<BarChart3 className="w-4 h-4" />
							Open Analytics Dashboard
						</span>
						<ChevronRight className="w-5 h-5 text-slate-500" />
					</Button>
				</div>

				<div className="bio-admin-section">
					<h2 className="bio-admin-section-title">Organization Teams</h2>
					{cleanedTeamNames.map((team, index) => (
						<Button
							key={`${team}-${index}`}
							variant="outline"
							size="lg"
							className="bio-admin-item-button"
							onClick={() => onEditOrganizationTeamItem(index)}
						>
							<span className="truncate">{team}</span>
							<ChevronRight className="w-5 h-5 text-slate-500" />
						</Button>
					))}
					<Button variant="outline" className="bio-admin-add" onClick={onAddOrganizationTeam}>
						Add Team
					</Button>
				</div>

				<div className="bio-admin-section">
					<h2 className="bio-admin-section-title">Organization Members</h2>
					{cleanedMemberNames.map((member, index) => (
						<Button
							key={`${member}-${index}`}
							variant="outline"
							size="lg"
							className="bio-admin-item-button"
							onClick={() => onEditOrganizationMemberItem(index)}
						>
							<span className="truncate">{member}</span>
							<ChevronRight className="w-5 h-5 text-slate-500" />
						</Button>
					))}
					<Button variant="outline" className="bio-admin-add" onClick={onAddOrganizationMember}>
						Add Member
					</Button>
				</div>
			</div>
		</div>
	);
}
