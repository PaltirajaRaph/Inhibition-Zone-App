import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';

export interface MemberData {
	username: string;
	password: string;
	team: string;
}

interface CreateOrganizationMemberProps {
	onBack: () => void;
	onConfirm: (members: MemberData[]) => void;
	teams: string[];
}

export default function CreateOrganizationMember({
	onBack,
	onConfirm,
	teams,
}: CreateOrganizationMemberProps) {
	const [members, setMembers] = useState<Array<{ name: string; password: string; team: string }>>([
		{ name: '', password: '', team: '' },
	]);

	const normalizeMemberName = (value: string) => value.trim().toLowerCase();

	const isPasswordValid = (password: string) => {
		const value = password;
		const hasUpper = /[A-Z]/.test(value);
		const hasLower = /[a-z]/.test(value);
		const hasNumber = /\d/.test(value);
		const hasSymbol = /[^A-Za-z0-9\s]/.test(value);
		return hasUpper && hasLower && hasNumber && hasSymbol;
	};

	const nameCounts = members.reduce<Record<string, number>>((acc, member) => {
		const key = normalizeMemberName(member.name);
		if (!key) return acc;
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});

	const isDuplicateNameAtIndex = (index: number) => {
		const key = normalizeMemberName(members[index]?.name ?? '');
		if (!key) return false;
		return (nameCounts[key] ?? 0) > 1;
	};

	const hasNameDuplicates = members.some((_, index) => isDuplicateNameAtIndex(index));
	const hasEmptyFields = members.some(
		(member) => member.name.trim().length === 0 || member.password.trim().length === 0,
	);
	const hasShortPassword = members.some(
		(member) => member.password.trim().length > 0 && member.password.trim().length < 8,
	);
	const hasInvalidPassword = members.some(
		(member) =>
			member.password.trim().length >= 8 &&
			member.password.trim().length > 0 &&
			!isPasswordValid(member.password),
	);

	const isShortPasswordAtIndex = (index: number) => {
		const value = members[index]?.password ?? '';
		const trimmed = value.trim();
		return trimmed.length > 0 && trimmed.length < 8;
	};

	const isInvalidPasswordAtIndex = (index: number) => {
		const value = members[index]?.password ?? '';
		const trimmed = value.trim();
		return trimmed.length >= 8 && !isPasswordValid(value);
	};

	const addMember = () => {
		setMembers((prev) => [...prev, { name: '', password: '', team: '' }]);
	};

	const removeMember = (index: number) => {
		setMembers((prev) => {
			if (prev.length <= 1) return prev;
			return prev.filter((_, i) => i !== index);
		});
	};

	const updateMemberName = (index: number, value: string) => {
		setMembers((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], name: value };
			return next;
		});
	};

	const updateMemberPassword = (index: number, value: string) => {
		setMembers((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], password: value };
			return next;
		});
	};

	const updateMemberTeam = (index: number, value: string) => {
		setMembers((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], team: value };
			return next;
		});
	};

	const hasEmptyTeamSelection = members.some((m) => m.team.trim().length === 0);
	const hasNoTeamsToChoose = teams.length === 0;

	const handleConfirm = () => {
		const memberData: MemberData[] = members.map((m) => ({
			username: m.name.trim(),
			password: m.password,
			team: m.team,
		}));
		onConfirm(memberData);
	};

	return (
		<div className="bio-login-shell bio-auth-shell">
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div className="bio-auth-panel bio-auth-panel-scroll">
				<div className="bio-auth-header">
					<Button variant="ghost" onClick={onBack} className="bio-auth-back-btn">
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<div>
						<p className="bio-auth-step">Step 4 of 4</p>
						<h2 className="bio-auth-title">Create Member Account</h2>
					</div>
				</div>

				<p className="bio-auth-subtitle">
					Tambahkan akun member organisasi dan pilih tim untuk akses dashboard member.
				</p>

				<div className="bio-auth-list">
					{members.map((member, index) => (
						<div key={index} className="bio-auth-list-item">
							<label className="bio-auth-label">Organization member {index + 1}</label>
							<Input
								placeholder="Masukkan username member"
								value={member.name}
								onChange={(e) => updateMemberName(index, e.target.value)}
								className="bio-auth-input"
							/>
							{isDuplicateNameAtIndex(index) && (
								<p className="bio-auth-info">Name must be different from others</p>
							)}

							<label className="bio-auth-label">Member login password</label>
							<Input
								type="password"
								placeholder="Masukkan password member"
								value={member.password}
								onChange={(e) => updateMemberPassword(index, e.target.value)}
								className="bio-auth-input"
							/>
							{isShortPasswordAtIndex(index) && (
								<p className="bio-auth-info">
									Requires minimum of 8 characters, uppercase, lowercase, number, and symbol
								</p>
							)}
							{!isShortPasswordAtIndex(index) && isInvalidPasswordAtIndex(index) && (
								<p className="bio-auth-info">
									Password must contain uppercase, lowercase, number, and symbol
								</p>
							)}

							<label className="bio-auth-label">Choose organization team</label>
							<Select
								value={member.team}
								onValueChange={(v: string) => updateMemberTeam(index, v)}
							>
								<SelectTrigger className="bio-auth-input bio-auth-select">
									<SelectValue placeholder="Choose team..." />
								</SelectTrigger>
								<SelectContent>
									{teams.map((team) => (
										<SelectItem key={team} value={team}>
											{team}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{members.length > 1 && (
															<Button
																variant="destructive"
																className="bio-auth-remove"
																onClick={() => removeMember(index)}
																type="button"
															>
																Remove Member
															</Button>
							)}
						</div>
					))}
											</div>

											<div className="bio-auth-actions bio-auth-actions-inline">
												<Button className="bio-auth-secondary" onClick={addMember}>
													Add Member
												</Button>
												<Button
													className="bio-auth-primary"
													onClick={handleConfirm}
													disabled={
														hasNameDuplicates ||
														hasEmptyFields ||
														hasNoTeamsToChoose ||
														hasEmptyTeamSelection ||
														hasShortPassword ||
														hasInvalidPassword
													}
												>
													Confirm
												</Button>
				</div>
			</div>
		</div>
	);
}

