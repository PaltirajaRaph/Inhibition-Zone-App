import { useMemo, useState } from 'react';
import {
	ArrowLeft,
	Search,
	Filter,
	ChevronRight,
	X,
	ChevronDown,
	ChevronUp,
	FlaskConical,
	Microscope,
	Calendar,
	Hash,
	Plus,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import type { AnalysisData } from '../App';
import {
	compareAnalysesBySampleOrder,
	getAnalysisGroupKey,
} from '../utils/sampleGrouping';
import { compactReportId } from '../utils/analysisId';

interface HistoryProps {
	analyses: AnalysisData[];
	onViewReport: (analysis: AnalysisData) => void;
	onBack: () => void;
	onStartAnalysis?: () => void;
}

type SirToken = 'RENTAN' | 'INTERMEDIAT' | 'RESISTEN';

const SIR_TOKENS: { value: SirToken; label: string; chip: string }[] = [
	{ value: 'RENTAN', label: 'Susceptible', chip: 'bio-history-chip-s' },
	{ value: 'INTERMEDIAT', label: 'Intermediate', chip: 'bio-history-chip-i' },
	{ value: 'RESISTEN', label: 'Resistant', chip: 'bio-history-chip-r' },
];

const getAntibioticName = (analysis: AnalysisData) =>
	(analysis.antibiotic || analysis.antibioticA || '').trim();

const getDisplayDate = (analysis: AnalysisData) =>
	analysis.actionDate || analysis.date;

const formatDateLabel = (dateString: string) => {
	if (!dateString) return '—';
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return dateString;
	return date.toLocaleDateString('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
};

const toISODate = (dateString: string) => {
	if (!dateString) return '';
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return '';
	return date.toISOString().slice(0, 10);
};

interface ReportGroup {
	key: string;
	first: AnalysisData;
	items: AnalysisData[];
	reportDisplayId: string;
	reportName: string;
	sampleId: string;
	tags: string[];
	notes: string;
	bacteriaNames: string[];
	antibioticNames: string[];
	earliestDate: string;
	latestDate: string;
	sirCounts: Record<SirToken, number>;
	totalTests: number;
}

const summarizeGroup = (key: string, items: AnalysisData[]): ReportGroup => {
	const sorted = items.slice().sort(compareAnalysesBySampleOrder);
	const first = sorted[0];
	const bacteriaNames = Array.from(
		new Set(sorted.map((a) => (a.bacteriaName || '').trim()).filter(Boolean)),
	);
	const antibioticNames = Array.from(
		new Set(sorted.map(getAntibioticName).filter(Boolean)),
	);
	const sirCounts: Record<SirToken, number> = { RENTAN: 0, INTERMEDIAT: 0, RESISTEN: 0 };
	for (const item of sorted) {
		const candidates = [item.result, item.secondaryResult];
		for (const c of candidates) {
			if (c === 'RENTAN' || c === 'INTERMEDIAT' || c === 'RESISTEN') {
				sirCounts[c]++;
			}
		}
	}
	const dates = sorted
		.map(getDisplayDate)
		.filter(Boolean)
		.map((d) => new Date(d).getTime())
		.filter((t) => !Number.isNaN(t));
	const earliest = dates.length ? new Date(Math.min(...dates)).toISOString() : '';
	const latest = dates.length ? new Date(Math.max(...dates)).toISOString() : '';
	const tags = Array.from(
		new Set(
			sorted
				.flatMap((a) => a.tags || [])
				.map((t) => t.trim())
				.filter(Boolean),
		),
	);
	const notes = sorted.map((a) => a.notes || '').find((n) => n.trim().length > 0) || '';

	return {
		key,
		first,
		items: sorted,
		reportDisplayId: first.reportDisplayId || first.id,
		reportName: (first.reportName || '').trim(),
		sampleId: (first.sampleId || '').trim(),
		tags,
		notes,
		bacteriaNames,
		antibioticNames,
		earliestDate: earliest || getDisplayDate(first),
		latestDate: latest || getDisplayDate(first),
		sirCounts,
		totalTests: sorted.length,
	};
};

export default function History({
	analyses,
	onViewReport,
	onBack,
	onStartAnalysis,
}: HistoryProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [sirFilters, setSirFilters] = useState<Set<SirToken>>(new Set());
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'tests-desc'>('date-desc');
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	const groups: ReportGroup[] = useMemo(() => {
		const buckets = new Map<string, AnalysisData[]>();
		for (const analysis of analyses) {
			const key = getAnalysisGroupKey(analysis);
			buckets.set(key, [...(buckets.get(key) || []), analysis]);
		}
		return Array.from(buckets.entries()).map(([key, items]) => summarizeGroup(key, items));
	}, [analyses]);

	const searchLower = searchQuery.trim().toLowerCase();

	const filteredGroups = useMemo(() => {
		const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
		const toTime = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null;

		const out = groups.filter((group) => {
			if (searchLower) {
				const haystack = [
					group.reportName,
					group.reportDisplayId,
					compactReportId(group.reportDisplayId),
					group.sampleId,
					group.notes,
					group.tags.join(' '),
					group.bacteriaNames.join(' '),
					group.antibioticNames.join(' '),
					group.items.map((a) => a.id).join(' '),
				]
					.join(' ')
					.toLowerCase();
				if (!haystack.includes(searchLower)) return false;
			}
			if (sirFilters.size > 0) {
				const present = (Object.keys(group.sirCounts) as SirToken[]).filter(
					(token) => group.sirCounts[token] > 0,
				);
				const hasMatch = present.some((token) => sirFilters.has(token));
				if (!hasMatch) return false;
			}
			if (fromTime !== null || toTime !== null) {
				const groupTime = new Date(group.latestDate || group.earliestDate).getTime();
				if (Number.isNaN(groupTime)) return false;
				if (fromTime !== null && groupTime < fromTime) return false;
				if (toTime !== null && groupTime > toTime) return false;
			}
			return true;
		});

		const collator = new Intl.Collator('id-ID', { sensitivity: 'base' });
		switch (sortBy) {
			case 'date-asc':
				return out.sort(
					(a, b) =>
						new Date(a.latestDate).getTime() - new Date(b.latestDate).getTime(),
				);
			case 'name-asc':
				return out.sort((a, b) =>
					collator.compare(a.reportName || 'Untitled report', b.reportName || 'Untitled report'),
				);
			case 'tests-desc':
				return out.sort((a, b) => b.totalTests - a.totalTests);
			case 'date-desc':
			default:
				return out.sort(
					(a, b) =>
						new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime(),
				);
		}
	}, [groups, searchLower, sirFilters, dateFrom, dateTo, sortBy]);

	const activeFilterCount =
		(sirFilters.size > 0 ? 1 : 0) +
		(dateFrom ? 1 : 0) +
		(dateTo ? 1 : 0) +
		(sortBy !== 'date-desc' ? 1 : 0);

	const totalReports = groups.length;
	const totalTests = groups.reduce((sum, g) => sum + g.totalTests, 0);

	const toggleSir = (token: SirToken) => {
		setSirFilters((prev) => {
			const next = new Set(prev);
			if (next.has(token)) next.delete(token);
			else next.add(token);
			return next;
		});
	};

	const resetFilters = () => {
		setSearchQuery('');
		setSirFilters(new Set());
		setDateFrom('');
		setDateTo('');
		setSortBy('date-desc');
	};

	const hasAnyFilter = Boolean(
		searchQuery || sirFilters.size > 0 || dateFrom || dateTo || sortBy !== 'date-desc',
	);

	return (
		<div className="bio-member-shell">
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div className="bio-member-panel bio-history-panel">
				<div className="bio-history-header">
					<div className="bio-history-topbar">
						<Button
							variant="ghost"
							size="icon"
							onClick={onBack}
							className="bio-member-settings-btn"
						>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<div>
							<p className="bio-member-kicker">Report History</p>
							<h1 className="bio-history-title">Riwayat Laporan</h1>
							<p className="bio-history-subtitle">
								{totalReports} laporan • {totalTests} uji antibiotik tersimpan
							</p>
						</div>
					</div>

					<div className="relative">
						<Search className="bio-history-search-icon" />
						<Input
							type="text"
							placeholder="Cari nama laporan, ID, sample ID, bakteri, antibiotik, tag…"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="bio-history-search-input pl-10"
						/>
					</div>

					<Button
						variant="outline"
						className="bio-history-filter-toggle"
						onClick={() => setIsFilterOpen(!isFilterOpen)}
					>
						<div className="flex items-center gap-2">
							<Filter className="w-4 h-4" />
							<span>Filter dan sortir</span>
						</div>
						<div className="flex items-center gap-2">
							{activeFilterCount > 0 && (
								<Badge variant="secondary">{activeFilterCount}</Badge>
							)}
							{isFilterOpen ? (
								<ChevronUp className="w-4 h-4" />
							) : (
								<ChevronDown className="w-4 h-4" />
							)}
						</div>
					</Button>

					{isFilterOpen && (
						<Card className="bio-history-filter-card">
							<div className="bio-history-filter-grid">
								<div>
									<label className="bio-history-field-label">Dari tanggal</label>
									<Input
										type="date"
										value={dateFrom}
										onChange={(e) => setDateFrom(e.target.value)}
										className="h-9"
									/>
								</div>
								<div>
									<label className="bio-history-field-label">Sampai tanggal</label>
									<Input
										type="date"
										value={dateTo}
										onChange={(e) => setDateTo(e.target.value)}
										className="h-9"
									/>
								</div>
								<div className="sm:col-span-2">
									<label className="bio-history-field-label">SIR</label>
									<div className="flex flex-wrap gap-2">
										{SIR_TOKENS.map((token) => {
											const active = sirFilters.has(token.value);
											return (
												<button
													key={token.value}
													type="button"
													onClick={() => toggleSir(token.value)}
													className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
														active
															? 'border-teal-500 bg-teal-500 text-white shadow'
															: 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'
													}`}
												>
													{token.label}
												</button>
											);
										})}
									</div>
								</div>
								<div className="sm:col-span-2">
									<label className="bio-history-field-label">Urutkan</label>
									<div className="flex flex-wrap gap-2">
										{(
											[
												{ value: 'date-desc', label: 'Terbaru' },
												{ value: 'date-asc', label: 'Terlama' },
												{ value: 'name-asc', label: 'Nama A–Z' },
												{ value: 'tests-desc', label: 'Uji terbanyak' },
											] as const
										).map((option) => {
											const active = sortBy === option.value;
											return (
												<button
													key={option.value}
													type="button"
													onClick={() => setSortBy(option.value)}
													className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
														active
															? 'border-cyan-500 bg-cyan-500 text-white shadow'
															: 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700'
													}`}
												>
													{option.label}
												</button>
											);
										})}
									</div>
								</div>
							</div>

							{hasAnyFilter && (
								<Button
									variant="outline"
									size="sm"
									className="bio-history-reset-btn"
									onClick={resetFilters}
								>
									<X className="w-4 h-4 mr-2" />
									Reset filter
								</Button>
							)}
						</Card>
					)}
				</div>

				<div className="bio-history-content">
					<div className="bio-history-result-row">
						<p className="bio-history-result-text">
							Menampilkan {filteredGroups.length} dari {totalReports} laporan
						</p>
					</div>

					<div className="bio-member-history-list bio-history-list">
						{filteredGroups.length === 0 ? (
							<Card className="bio-member-empty bio-history-empty">
								<div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow">
									<Microscope className="h-6 w-6" />
								</div>
								<p className="bio-member-empty-title">
									{totalReports === 0
										? 'Belum ada laporan'
										: 'Tidak ada laporan yang cocok dengan filter'}
								</p>
								<p className="bio-member-empty-subtitle">
									{totalReports === 0
										? 'Mulai analisis pertama untuk membuat laporan baru.'
										: 'Coba ubah kata kunci atau atur ulang filter.'}
								</p>
								<div className="mt-3 flex flex-wrap items-center justify-center gap-2">
									{hasAnyFilter && (
										<Button
											variant="outline"
											size="sm"
											onClick={resetFilters}
										>
											<X className="w-4 h-4 mr-2" />
											Reset filter
										</Button>
									)}
									{onStartAnalysis && (
										<Button
											size="sm"
											className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow hover:from-teal-600 hover:to-cyan-600"
											onClick={onStartAnalysis}
										>
											<Plus className="w-4 h-4 mr-2" />
											Buat laporan baru
										</Button>
									)}
								</div>
							</Card>
						) : (
							filteredGroups.map((group) => {
								const compactId = compactReportId(group.reportDisplayId);
								const displayName = group.reportName || 'Untitled report';
								const sirChips = SIR_TOKENS.filter(
									(t) => group.sirCounts[t.value] > 0,
								);
								const primaryBacteria = group.bacteriaNames[0] || '';
								const extraBacteria = group.bacteriaNames.length > 1
									? ` +${group.bacteriaNames.length - 1}`
									: '';
								return (
									<Card
										key={group.key}
										className="bio-member-history-card bio-history-item-card bio-member-history-card-clickable bio-history-item-clickable"
										onClick={() => onViewReport(group.first)}
									>
										<div className="bio-history-card-body">
											<div className="bio-history-card-head">
												<h3 className="bio-history-card-title">{displayName}</h3>
												<ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
											</div>

											<div className="bio-history-card-meta">
												<span className="bio-history-card-meta-item">
													<Calendar className="h-3 w-3" />
													{formatDateLabel(group.latestDate)}
												</span>
												<span className="bio-history-card-meta-item">
													<Hash className="h-3 w-3" />
													{compactId}
												</span>
												{group.sampleId && (
													<span className="bio-history-card-meta-item">
														<FlaskConical className="h-3 w-3" />
														{group.sampleId}
													</span>
												)}
											</div>

											{primaryBacteria && (
												<p className="bio-history-card-bacteria">
													<Microscope className="h-3.5 w-3.5" />
													<span className="bio-history-card-bacteria-name">{primaryBacteria}</span>
													{extraBacteria && (
														<span className="bio-history-card-bacteria-extra">{extraBacteria}</span>
													)}
												</p>
											)}

											<div className="bio-history-card-footer">
												<span className="bio-history-card-count">
													{group.totalTests} uji antibiotik
												</span>
												<div className="bio-history-card-sir">
													{sirChips.length === 0 ? (
														<span className="bio-history-card-sir-empty">Belum ada hasil SIR</span>
													) : (
														sirChips.map((t) => (
															<span
																key={t.value}
																className={`bio-history-chip ${t.chip}`}
																title={`${t.label}: ${group.sirCounts[t.value]}`}
															>
																{t.label.charAt(0)} {group.sirCounts[t.value]}
															</span>
														))
													)}
												</div>
											</div>
										</div>
									</Card>
								);
							})
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// keep imports from being optimized away in dev for the date utility
void toISODate;
