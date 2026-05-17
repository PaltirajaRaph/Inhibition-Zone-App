import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface OrganizationNameEditProps {
	organizationName: string;
	onBack: () => void;
	onSaveOrganizationName: (newName: string) => void;
	onDeleteOrganization: () => void;
}

export default function OrganizationNameEdit({
	organizationName,
	onBack,
	onSaveOrganizationName,
	onDeleteOrganization,
}: OrganizationNameEditProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [draftName, setDraftName] = useState(organizationName);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isDeleteNoteAccepted, setIsDeleteNoteAccepted] = useState(false);

	const trimmedDraftName = draftName.trim();
	const displayName = organizationName.trim().length > 0 ? organizationName : '(organization name)';

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
						<p className="bio-admin-kicker">Organization Profile</p>
						<h1 className="bio-admin-title bio-org-profile-title">Manage Organization Name</h1>
						<p className="bio-admin-subtitle">
							Rename organization is recommended. Delete is optional and should be used carefully.
						</p>
					</div>
				</div>

				<div className="bio-admin-section bio-org-profile-name-card">
					<p className="bio-org-profile-label">Current Organization Name</p>
					{isEditing ? (
						<Input
							value={draftName}
							onChange={(e) => setDraftName(e.target.value)}
							placeholder="(organization name)"
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
								onSaveOrganizationName(trimmedDraftName);
								setIsConfirmOpen(false);
								setIsDeleteNoteAccepted(false);
								setIsEditing(false);
							}}
							disabled={trimmedDraftName.length === 0}
						>
							Save Changes
						</Button>
						<Button
							variant="outline"
							className="bio-org-profile-cancel"
							onClick={() => {
								setDraftName(organizationName);
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
								setDraftName(organizationName);
								setIsConfirmOpen(false);
								setIsDeleteNoteAccepted(false);
								setIsEditing(true);
							}}
						>
							Edit Organization Name
						</Button>
						<Button
							variant="outline"
							className="bio-org-profile-delete-trigger"
							onClick={() => {
								setIsDeleteNoteAccepted(false);
								setIsConfirmOpen(true);
							}}
						>
							Delete Organization (Alternative)
						</Button>
					</div>
				)}

				{!isEditing && !isConfirmOpen && (
					<Card className="bio-org-profile-danger-card">
						<p className="bio-org-profile-danger-text">
							Note: Recommended action is Edit Organization Name. Delete is only for cases where organization data is no longer needed.
						</p>
					</Card>
				)}

				{!isEditing && isConfirmOpen && (
					<Card className="bio-org-profile-danger-card">
						<p className="bio-org-profile-danger-text">Before deleting, please read this note:</p>
						<p className="bio-org-profile-danger-text">
							1) Rename is the safer option if you only want to update organization identity.
						</p>
						<p className="bio-org-profile-danger-text">
							2) Delete will remove organization profile data from this app flow.
						</p>
						<label className="bio-org-profile-danger-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<input
								type="checkbox"
								checked={isDeleteNoteAccepted}
								onChange={(e) => setIsDeleteNoteAccepted(e.target.checked)}
							/>
							I have read the note and I understand this action.
						</label>
						<div className="bio-org-profile-danger-actions">
							<Button
								variant="outline"
								className="bio-org-profile-cancel"
								onClick={() => {
									setIsDeleteNoteAccepted(false);
									setIsConfirmOpen(false);
								}}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								className="bio-org-profile-delete-confirm"
								onClick={onDeleteOrganization}
								disabled={!isDeleteNoteAccepted}
							>
								Delete
							</Button>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
