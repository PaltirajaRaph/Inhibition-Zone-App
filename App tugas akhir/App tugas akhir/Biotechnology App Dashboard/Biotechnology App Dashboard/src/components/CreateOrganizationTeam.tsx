import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CreateOrganizationTeamProps {
	onBack: () => void;
	onConfirm: (teams: string[]) => void;
	initialTeams?: string[];
}

export default function CreateOrganizationTeam({
	onBack,
	onConfirm,
	initialTeams,
}: CreateOrganizationTeamProps) {
	const [teams, setTeams] = useState<string[]>(
		initialTeams && initialTeams.length > 0 ? initialTeams : [''],
	);

	const normalizeTeamName = (value: string) => value.trim().toLowerCase();

	const nameCounts = teams.reduce<Record<string, number>>((acc, name) => {
		const key = normalizeTeamName(name);
		if (!key) return acc;
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});

	const isDuplicateAtIndex = (index: number) => {
		const key = normalizeTeamName(teams[index] ?? '');
		if (!key) return false;
		return (nameCounts[key] ?? 0) > 1;
	};

	const hasDuplicates = teams.some((_, index) => isDuplicateAtIndex(index));
	const hasEmptyTeamName = teams.some((name) => name.trim().length === 0);

	const addTeam = () => {
		setTeams((prev) => [...prev, '']);
	};

	const removeTeam = (index: number) => {
		setTeams((prev) => {
			if (prev.length <= 1) return prev;
			return prev.filter((_, i) => i !== index);
		});
	};

	const updateTeam = (index: number, value: string) => {
		setTeams((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
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
						<p className="bio-auth-step">Step 3 of 4</p>
						<h2 className="bio-auth-title">Define Team Structure</h2>
					</div>
				</div>

				<p className="bio-auth-subtitle">
					Tambahkan unit kerja atau tim laboratorium yang akan menjadi bagian organisasi.
				</p>

				<div className="bio-auth-list">
					{teams.map((teamName, index) => (
						<div key={index} className="bio-auth-list-item">
							<label className="bio-auth-label">Team name {index + 1}</label>
							<Input
								placeholder="Contoh: Microbiology Lab"
								value={teamName}
								onChange={(e) => updateTeam(index, e.target.value)}
								className="bio-auth-input"
							/>
							{teams.length > 1 && (
								<Button
									variant="destructive"
									className="bio-auth-remove"
									onClick={() => removeTeam(index)}
									type="button"
								>
									Remove Team
								</Button>
							)}
							{isDuplicateAtIndex(index) && (
								<p className="bio-auth-info">
									Name must be different from others
								</p>
							)}
						</div>
					))}
				</div>

				<div className="bio-auth-actions bio-auth-actions-inline">
					<Button className="bio-auth-secondary" onClick={addTeam}>
						Add Team
					</Button>
					<Button
						className="bio-auth-primary"
						onClick={() => onConfirm(teams.map((t) => t.trim()))}
						disabled={hasDuplicates || hasEmptyTeamName}
					>
						Lanjutkan
					</Button>
				</div>
			</div>
		</div>
	);
}

