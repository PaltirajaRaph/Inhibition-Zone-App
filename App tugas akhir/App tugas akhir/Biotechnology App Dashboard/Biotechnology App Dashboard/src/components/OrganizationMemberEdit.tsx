import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface OrganizationMemberEditProps {
	onBack: () => void;
	memberName: string;
	onSaveMemberName: (newName: string) => void;
	onDeleteMember?: () => void;
	startInAddMode?: boolean;
}

export default function OrganizationMemberEdit({
	onBack,
	memberName,
	onSaveMemberName,
	onDeleteMember,
	startInAddMode = false,
}: OrganizationMemberEditProps) {
	const [isEditing, setIsEditing] = useState(startInAddMode);
	const [draftName, setDraftName] = useState(startInAddMode ? '' : memberName);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const trimmedDraftName = draftName.trim();
	const displayName = memberName.trim().length > 0 ? memberName : '(organization member)';
	const pageTitle = startInAddMode ? 'Add Organization Member' : 'Manage Organization Member';
	const pageSubtitle = startInAddMode
		? 'Add a new member to your organization profile so access is managed clearly.'
		: 'Update member names or remove members while keeping account data organized.';
	const cardLabel = startInAddMode ? 'New Member Name' : 'Current Member Name';
	const primaryActionLabel = startInAddMode ? 'Add Member' : 'Save Changes';

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
						<p className="bio-admin-kicker">Organization Members</p>
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
							placeholder="(organization member)"
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
								onSaveMemberName(trimmedDraftName);
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
								setDraftName(memberName);
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
								setDraftName(memberName);
								setIsConfirmOpen(false);
								setIsEditing(true);
							}}
						>
							Edit Member Name
						</Button>

						{onDeleteMember && (
							<Button
								variant="outline"
								className="bio-org-profile-delete-trigger"
								onClick={() => setIsConfirmOpen(true)}
							>
								Delete Member
							</Button>
						)}
					</div>
				)}

				{!isEditing && isConfirmOpen && onDeleteMember && (
					<Card className="bio-org-profile-danger-card">
						<p className="bio-org-profile-danger-text">
							Deleting this member will permanently remove their account. Are you sure?
						</p>
						<div className="bio-org-profile-danger-actions">
							<Button variant="outline" className="bio-org-profile-cancel" onClick={() => setIsConfirmOpen(false)}>
								Cancel
							</Button>
							<Button variant="destructive" className="bio-org-profile-delete-confirm" onClick={onDeleteMember}>
								Delete
							</Button>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
