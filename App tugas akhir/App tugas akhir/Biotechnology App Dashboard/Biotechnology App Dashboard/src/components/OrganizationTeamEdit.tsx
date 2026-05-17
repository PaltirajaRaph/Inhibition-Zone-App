import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface OrganizationTeamEditProps {
	onBack: () => void;
	teamName: string;
	onSaveTeamName: (newName: string) => void;
	onDeleteTeam?: () => void;
	startInAddMode?: boolean;
}

export default function OrganizationTeamEdit({
	onBack,
	teamName,
	onSaveTeamName,
	onDeleteTeam,
	startInAddMode = false,
}: OrganizationTeamEditProps) {
	const [isEditing, setIsEditing] = useState(startInAddMode);
	const [draftName, setDraftName] = useState(startInAddMode ? '' : teamName);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const trimmedDraftName = draftName.trim();
	const displayName = teamName.trim().length > 0 ? teamName : '(organization team)';
	const pageTitle = startInAddMode ? 'Add Organization Team' : 'Manage Organization Team';
	const pageSubtitle = startInAddMode
		? 'Create a new team so members can be grouped clearly in your organization.'
		: 'Rename or remove a team and keep your organization structure organized.';
	const cardLabel = startInAddMode ? 'New Team Name' : 'Current Team Name';
	const primaryActionLabel = startInAddMode ? 'Add Team' : 'Save Changes';

	return (
		<div className="bio-admin-shell bio-org-profile-shell bio-safe-screen">
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div className="bio-admin-panel bio-org-profile-panel">
				<div className="bio-org-profile-header">
					<Button
						variant="ghost"
						size="icon"
						onClick={onBack}
						className="bio-member-settings-btn bio-org-profile-back"
						aria-label="Back to admin dashboard"
					>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<div>
						<p className="bio-admin-kicker">Organization Teams</p>
						<h1 className="bio-admin-title bio-org-profile-title">{pageTitle}</h1>
						<p className="bio-admin-subtitle">{pageSubtitle}</p>
					</div>
				</div>

				<div className="bio-admin-section bio-org-profile-name-card">
					<p className="bio-org-profile-label">{cardLabel}</p>
					{isEditing ? (
						<Input
							value={draftName}
							onChange={(e) => setDraftName(e.target.value)}
							placeholder="(organization team)"
							className="create-organization-input bio-org-profile-input"
						/>
					) : (
						<p className="bio-org-profile-name">{displayName}</p>
					)}
				</div>

				{isEditing ? (
					<div className="bio-org-profile-actions">
						<Button
							className="bio-org-profile-confirm"
							onClick={() => {
								if (trimmedDraftName.length === 0) return;
								onSaveTeamName(trimmedDraftName);
								if (startInAddMode) {
									onBack();
									return;
								}
								setIsConfirmOpen(false);
								setIsEditing(false);
							}}
							disabled={trimmedDraftName.length === 0}
						>
							{primaryActionLabel}
						</Button>
						<Button
							variant="outline"
							className="bio-org-profile-cancel"
							onClick={() => {
								if (startInAddMode) {
									onBack();
									return;
								}
								setDraftName(teamName);
								setIsEditing(false);
							}}
						>
							Cancel
						</Button>
					</div>
				) : (
					<div className="bio-org-profile-actions">
						<Button
							variant="outline"
							className="bio-org-profile-edit"
							onClick={() => {
								setDraftName(teamName);
								setIsConfirmOpen(false);
								setIsEditing(true);
							}}
						>
							Edit Team Name
						</Button>

						{onDeleteTeam && (
							<Button
								variant="outline"
								className="bio-org-profile-delete-trigger"
								onClick={() => setIsConfirmOpen(true)}
							>
								Delete Team
							</Button>
						)}
					</div>
				)}

				{!isEditing && isConfirmOpen && onDeleteTeam && (
					<Card className="bio-org-profile-danger-card">
						<p className="bio-org-profile-danger-text">
							Deleting this team will remove all members linked to it. Are you sure?
						</p>
						<div className="bio-org-profile-danger-actions">
							<Button variant="outline" className="bio-org-profile-cancel" onClick={() => setIsConfirmOpen(false)}>
								Cancel
							</Button>
							<Button variant="destructive" className="bio-org-profile-delete-confirm" onClick={onDeleteTeam}>
								Delete
							</Button>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
