import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	Beaker,
	CalendarRange,
	FileText,
	FlaskConical,
	Microscope,
	Plus,
	RefreshCcw,
	Ruler,
	ShieldCheck,
	Sparkles,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from 'recharts';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from './ui/chart';
import type { AnalysisData, ResistanceResult } from '../App';
import { getAnalysisGroupKey } from '../utils/sampleGrouping';

export type AnalyticsTrendUnit = 'day' | 'week' | 'month' | 'year';

export interface AnalyticsData {
	overview: {
		totalAnalyses: number;
		completed: number;
		pending: number;
		processing: number;
		failed: number;
		completionRate: number;
	};
	results: {
		resistant: number;
		susceptible: number;
		intermediate: number;
		indeterminate: number;
	};
	bacteriaDistribution: Array<{ name: string; count: number }>;
	trend: {
		unit: AnalyticsTrendUnit;
		window: number;
		points: Array<{ label: string; count: number }>;
	};
}

interface AnalyticsDashboardProps {
	variant: 'admin' | 'member';
	title: string;
	subtitle: string;
	autoRefreshSeconds: number;
	trendUnit: AnalyticsTrendUnit;
	data: AnalyticsData | null;
	analyses?: AnalysisData[];
	isLoading: boolean;
	lastUpdatedLabel?: string | null;
	errorMessage?: string | null;
	onBack: () => void;
	onRefresh: () => void;
	onChangeTrend: (value: AnalyticsTrendUnit) => void;
	onStartAnalysis?: () => void;
}

type RangeKey = 'day' | 'week' | 'month' | '6month' | 'year' | 'custom';

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; short: string }> = [
	{ key: 'day', label: 'Daily', short: '24 jam' },
	{ key: 'week', label: 'Weekly', short: '7 hari' },
	{ key: 'month', label: 'Monthly', short: '30 hari' },
	{ key: '6month', label: '6 Months', short: '6 bulan' },
	{ key: 'year', label: 'Yearly', short: '12 bulan' },
	{ key: 'custom', label: 'Custom', short: 'pilih tanggal' },
];

const RANGE_TO_UNIT: Record<RangeKey, AnalyticsTrendUnit> = {
	day: 'day',
	week: 'day',
	month: 'day',
	'6month': 'month',
	year: 'month',
	custom: 'month',
};

type SirCode = 'S' | 'I' | 'R';

type DiskEntry = {
	antibiotic: string;
	sir: SirCode | null;
	diameter?: number;
	bacteria: string;
};

const PALETTE = {
	teal: '#14b8a6',
	cyan: '#0ea5b7',
	deep: '#0f5d6e',
	emerald: '#10b981',
	amber: '#f59e0b',
	rose: '#ef4444',
};

const sirCode = (value?: ResistanceResult | string | null): SirCode | null => {
	switch (value) {
		case 'RENTAN':
			return 'S';
		case 'INTERMEDIAT':
			return 'I';
		case 'RESISTEN':
			return 'R';
		default:
			return null;
	}
};

const formatPercent = (value: number) => {
	if (!Number.isFinite(value)) return '0%';
	return `${Math.round(value)}%`;
};

const formatNumber = (value: number) => {
	if (!Number.isFinite(value)) return '0';
	return new Intl.NumberFormat('id-ID').format(value);
};

const toIsoDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const parseAnalysisDate = (item: AnalysisData): Date | null => {
	const value = item.actionDate || item.date;
	if (!value) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
};

const collectDiskEntries = (analyses: AnalysisData[]): DiskEntry[] => {
	const entries: DiskEntry[] = [];
	for (const item of analyses) {
		const bacteria = (item.bacteriaName || '').trim();
		const primary = (item.antibiotic || item.antibioticA || '').trim();
		if (primary) {
			entries.push({
				antibiotic: primary,
				sir: sirCode(item.result),
				diameter: typeof item.diameter === 'number' ? item.diameter : undefined,
				bacteria,
			});
		}
		const secondary = (item.antibioticB || '').trim();
		if (secondary && secondary.toLowerCase() !== primary.toLowerCase()) {
			entries.push({
				antibiotic: secondary,
				sir: sirCode(item.secondaryResult),
				diameter: undefined,
				bacteria,
			});
		}
	}
	return entries;
};

type TrendBucket = 'day' | 'week' | 'month' | 'year';

const computeRangeWindow = (
	range: RangeKey,
	customStart: string,
	customEnd: string,
): { start: Date; end: Date; bucket: TrendBucket } => {
	const now = new Date();
	const end = new Date(now);
	end.setHours(23, 59, 59, 999);
	const start = new Date(now);
	switch (range) {
		case 'day':
			start.setHours(0, 0, 0, 0);
			return { start, end, bucket: 'day' };
		case 'week':
			start.setDate(start.getDate() - 6);
			start.setHours(0, 0, 0, 0);
			return { start, end, bucket: 'day' };
		case 'month':
			start.setDate(start.getDate() - 29);
			start.setHours(0, 0, 0, 0);
			return { start, end, bucket: 'day' };
		case '6month':
			start.setMonth(start.getMonth() - 5);
			start.setDate(1);
			start.setHours(0, 0, 0, 0);
			return { start, end, bucket: 'month' };
		case 'year':
			start.setMonth(start.getMonth() - 11);
			start.setDate(1);
			start.setHours(0, 0, 0, 0);
			return { start, end, bucket: 'month' };
		case 'custom': {
			const parsedStart = customStart ? new Date(customStart) : null;
			const parsedEnd = customEnd ? new Date(customEnd) : null;
			const validStart =
				parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart : start;
			const validEnd =
				parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? parsedEnd : end;
			validStart.setHours(0, 0, 0, 0);
			validEnd.setHours(23, 59, 59, 999);
			const spanDays = Math.max(
				1,
				Math.round((validEnd.getTime() - validStart.getTime()) / (1000 * 60 * 60 * 24)),
			);
			let bucket: TrendBucket = 'day';
			if (spanDays > 730) bucket = 'year';
			else if (spanDays > 120) bucket = 'month';
			else if (spanDays > 45) bucket = 'week';
			return { start: validStart, end: validEnd, bucket };
		}
	}
};

const formatBucketLabel = (date: Date, bucket: TrendBucket) => {
	if (bucket === 'year') return date.getFullYear().toString();
	if (bucket === 'month')
		return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
	if (bucket === 'week')
		return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
	return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

const bucketKey = (date: Date, bucket: TrendBucket) => {
	if (bucket === 'year') return `${date.getFullYear()}`;
	if (bucket === 'month') return `${date.getFullYear()}-${date.getMonth() + 1}`;
	if (bucket === 'week') {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		const day = d.getDay();
		const offset = day === 0 ? -6 : 1 - day;
		d.setDate(d.getDate() + offset);
		return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
	}
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

export default function AnalyticsDashboard({
	variant,
	title,
	subtitle,
	autoRefreshSeconds,
	trendUnit: _trendUnit,
	data,
	analyses,
	isLoading,
	lastUpdatedLabel,
	errorMessage,
	onBack,
	onRefresh,
	onChangeTrend,
	onStartAnalysis,
}: AnalyticsDashboardProps) {
	void _trendUnit;
	const shellClass = variant === 'admin' ? 'bio-admin-shell' : 'bio-member-shell';
	const panelClass = `${variant === 'admin' ? 'bio-admin-panel' : 'bio-member-panel'} bio-analytics-panel bio-aa-panel`;

	const [rangeKey, setRangeKey] = useState<RangeKey>('month');
	const today = toIsoDateOnly(new Date());
	const fourWeeksAgo = useMemo(() => {
		const d = new Date();
		d.setDate(d.getDate() - 27);
		return toIsoDateOnly(d);
	}, []);
	const [customStart, setCustomStart] = useState<string>(fourWeeksAgo);
	const [customEnd, setCustomEnd] = useState<string>(today);

	useEffect(() => {
		const unit = RANGE_TO_UNIT[rangeKey];
		onChangeTrend(unit);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rangeKey]);

	const rangeWindow = useMemo(
		() => computeRangeWindow(rangeKey, customStart, customEnd),
		[rangeKey, customStart, customEnd],
	);

	const filteredAnalyses = useMemo(() => {
		if (!analyses || analyses.length === 0) return [] as AnalysisData[];
		const startMs = rangeWindow.start.getTime();
		const endMs = rangeWindow.end.getTime();
		return analyses.filter((item) => {
			const parsed = parseAnalysisDate(item);
			if (!parsed) return false;
			const ms = parsed.getTime();
			return ms >= startMs && ms <= endMs;
		});
	}, [analyses, rangeWindow]);

	const diskEntries = useMemo(() => collectDiskEntries(filteredAnalyses), [filteredAnalyses]);

	const sirTotals = useMemo(() => {
		let S = 0;
		let I = 0;
		let R = 0;
		for (const entry of diskEntries) {
			if (entry.sir === 'S') S++;
			else if (entry.sir === 'I') I++;
			else if (entry.sir === 'R') R++;
		}
		return { S, I, R, total: S + I + R };
	}, [diskEntries]);

	const petriDishCount = useMemo(() => {
		const groups = new Set<string>();
		for (const item of filteredAnalyses) {
			groups.add(getAnalysisGroupKey(item));
		}
		return groups.size;
	}, [filteredAnalyses]);

	const aiAccuracy = useMemo(() => {
		let sum = 0;
		let count = 0;
		for (const item of filteredAnalyses) {
			const measurements = item.measurements || [];
			for (const m of measurements) {
				if (typeof m.diskConfidence === 'number' && Number.isFinite(m.diskConfidence)) {
					sum += m.diskConfidence;
					count++;
				}
				if (typeof m.zoneConfidence === 'number' && Number.isFinite(m.zoneConfidence)) {
					sum += m.zoneConfidence;
					count++;
				}
			}
		}
		if (count === 0) return null;
		const avg = sum / count;
		return avg <= 1 ? avg * 100 : avg;
	}, [filteredAnalyses]);

	const susceptibilityRate = sirTotals.total > 0 ? (sirTotals.S / sirTotals.total) * 100 : 0;
	const resistanceRate = sirTotals.total > 0 ? (sirTotals.R / sirTotals.total) * 100 : 0;

	const antibioticStats = useMemo(() => {
		const map = new Map<
			string,
			{ antibiotic: string; total: number; S: number; I: number; R: number; diameters: number[] }
		>();
		for (const entry of diskEntries) {
			const key = entry.antibiotic.trim();
			if (!key) continue;
			const existing =
				map.get(key) || { antibiotic: key, total: 0, S: 0, I: 0, R: 0, diameters: [] as number[] };
			existing.total += 1;
			if (entry.sir) existing[entry.sir] += 1;
			if (typeof entry.diameter === 'number' && Number.isFinite(entry.diameter)) {
				existing.diameters.push(entry.diameter);
			}
			map.set(key, existing);
		}
		return Array.from(map.values()).map((row) => {
			const rowSir = row.S + row.I + row.R;
			const resistantPct = rowSir > 0 ? (row.R / rowSir) * 100 : 0;
			const susceptiblePct = rowSir > 0 ? (row.S / rowSir) * 100 : 0;
			return { ...row, sirTotal: rowSir, resistantPct, susceptiblePct };
		});
	}, [diskEntries]);

	const bacteriaStats = useMemo(() => {
		const map = new Map<string, number>();
		for (const item of filteredAnalyses) {
			const name = (item.bacteriaName || '').trim();
			if (!name) continue;
			map.set(name, (map.get(name) || 0) + 1);
		}
		return Array.from(map.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);
	}, [filteredAnalyses]);

	const bacteriaChartData = bacteriaStats.slice(0, 8);
	const mostDetectedBacteria = bacteriaStats[0] ?? null;

	const totalReports = useMemo(() => {
		const reportKeys = new Set<string>();
		for (const item of filteredAnalyses) {
			if (item.reportGroupId) reportKeys.add(`g:${item.reportGroupId}`);
			else reportKeys.add(getAnalysisGroupKey(item));
		}
		return reportKeys.size;
	}, [filteredAnalyses]);

	const totalBacteriaIdentified = useMemo(() => {
		const set = new Set<string>();
		for (const item of filteredAnalyses) {
			const name = (item.bacteriaName || '').trim();
			if (name) set.add(name.toLowerCase());
		}
		return set.size;
	}, [filteredAnalyses]);

	// Bacteria-level SIR + resistance rate (need at least 3 typed disks to rank)
	const bacteriaSirStats = useMemo(() => {
		const map = new Map<string, { name: string; S: number; I: number; R: number; total: number }>();
		for (const entry of diskEntries) {
			const name = entry.bacteria || '';
			if (!name || !entry.sir) continue;
			const row = map.get(name) || { name, S: 0, I: 0, R: 0, total: 0 };
			row[entry.sir] += 1;
			row.total += 1;
			map.set(name, row);
		}
		return Array.from(map.values()).map((row) => ({
			...row,
			resistantPct: row.total > 0 ? (row.R / row.total) * 100 : 0,
			susceptiblePct: row.total > 0 ? (row.S / row.total) * 100 : 0,
		}));
	}, [diskEntries]);

	const mostResistantBacteria = useMemo(() => {
		const eligible = bacteriaSirStats.filter((row) => row.total >= 3);
		if (eligible.length === 0) return null;
		return [...eligible].sort((a, b) => b.resistantPct - a.resistantPct)[0];
	}, [bacteriaSirStats]);

	const topResistantBacteriaChart = useMemo(
		() =>
			[...bacteriaSirStats]
				.filter((row) => row.total >= 3)
				.sort((a, b) => b.resistantPct - a.resistantPct)
				.slice(0, 5)
				.map((row) => ({
					name: row.name,
					value: Math.round(row.resistantPct),
					tested: row.total,
				})),
		[bacteriaSirStats],
	);

	// Bacteria × Antibiotic resistance-rate matrix
	const bacteriaAbxMatrix = useMemo(() => {
		const map = new Map<string, { S: number; I: number; R: number; total: number }>();
		const bacteriaSet = new Set<string>();
		const abxSet = new Set<string>();
		for (const entry of diskEntries) {
			const b = (entry.bacteria || '').trim();
			const a = (entry.antibiotic || '').trim();
			if (!b || !a || !entry.sir) continue;
			bacteriaSet.add(b);
			abxSet.add(a);
			const key = `${b}|${a}`;
			const row = map.get(key) || { S: 0, I: 0, R: 0, total: 0 };
			row[entry.sir] += 1;
			row.total += 1;
			map.set(key, row);
		}
		const bacteriaList = Array.from(bacteriaSet).sort();
		const abxList = Array.from(abxSet).sort();
		let topPair: {
			bacteria: string;
			antibiotic: string;
			resistantPct: number;
			tested: number;
		} | null = null;
		for (const [key, row] of map.entries()) {
			if (row.total < 2) continue;
			const pct = (row.R / row.total) * 100;
			if (!topPair || pct > topPair.resistantPct) {
				const [bacteria, antibiotic] = key.split('|');
				topPair = { bacteria, antibiotic, resistantPct: pct, tested: row.total };
			}
		}
		return { map, bacteriaList, abxList, topPair };
	}, [diskEntries]);

	const antibioticUsageData = useMemo(
		() =>
			[...antibioticStats]
				.sort((a, b) => b.total - a.total)
				.slice(0, 8)
				.map((row) => ({ name: row.antibiotic, count: row.total })),
		[antibioticStats],
	);

	const antibioticSirData = useMemo(
		() =>
			[...antibioticStats]
				.filter((row) => row.sirTotal > 0)
				.sort((a, b) => b.sirTotal - a.sirTotal)
				.slice(0, 6)
				.map((row) => ({
					name: row.antibiotic,
					Rentan: row.S,
					Intermediat: row.I,
					Resisten: row.R,
				})),
		[antibioticStats],
	);

	const resistanceRankingData = useMemo(
		() =>
			[...antibioticStats]
				.filter((row) => row.sirTotal >= 3)
				.sort((a, b) => b.resistantPct - a.resistantPct)
				.slice(0, 6)
				.map((row) => ({
					name: row.antibiotic,
					value: Math.round(row.resistantPct),
					tested: row.sirTotal,
				})),
		[antibioticStats],
	);

	const mostResistantAntibiotic = useMemo(() => {
		const eligible = antibioticStats.filter((row) => row.sirTotal >= 3);
		if (eligible.length === 0) return null;
		return [...eligible].sort((a, b) => b.resistantPct - a.resistantPct)[0];
	}, [antibioticStats]);

	const mostEffectiveAntibiotic = useMemo(() => {
		const eligible = antibioticStats.filter((row) => row.sirTotal >= 3);
		if (eligible.length === 0) return null;
		return [...eligible].sort((a, b) => b.susceptiblePct - a.susceptiblePct)[0];
	}, [antibioticStats]);

	const diameterSummary = useMemo(() => {
		const diameters = diskEntries
			.map((entry) => entry.diameter)
			.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
		if (diameters.length === 0) return null;
		const sum = diameters.reduce((acc, value) => acc + value, 0);
		const avg = sum / diameters.length;
		const min = Math.min(...diameters);
		const max = Math.max(...diameters);
		return { avg, min, max, count: diameters.length };
	}, [diskEntries]);

	const trendData = useMemo(() => {
		const buckets = new Map<string, { label: string; count: number; sortKey: number }>();
		const cursor = new Date(rangeWindow.start);
		cursor.setHours(0, 0, 0, 0);

		const advance = (date: Date) => {
			if (rangeWindow.bucket === 'year') date.setFullYear(date.getFullYear() + 1);
			else if (rangeWindow.bucket === 'month') date.setMonth(date.getMonth() + 1);
			else if (rangeWindow.bucket === 'week') date.setDate(date.getDate() + 7);
			else date.setDate(date.getDate() + 1);
		};

		while (cursor.getTime() <= rangeWindow.end.getTime()) {
			const key = bucketKey(cursor, rangeWindow.bucket);
			if (!buckets.has(key)) {
				buckets.set(key, {
					label: formatBucketLabel(cursor, rangeWindow.bucket),
					count: 0,
					sortKey: cursor.getTime(),
				});
			}
			advance(cursor);
			if (buckets.size > 200) break;
		}

		for (const item of filteredAnalyses) {
			const parsed = parseAnalysisDate(item);
			if (!parsed) continue;
			const key = bucketKey(parsed, rangeWindow.bucket);
			const bucket =
				buckets.get(key) || {
					label: formatBucketLabel(parsed, rangeWindow.bucket),
					count: 0,
					sortKey: parsed.getTime(),
				};
			bucket.count += 1;
			buckets.set(key, bucket);
		}

		return Array.from(buckets.values()).sort((a, b) => a.sortKey - b.sortKey);
	}, [filteredAnalyses, rangeWindow]);

	const resistanceChartData = useMemo(
		() => [
			{ name: 'Rentan', value: sirTotals.S, fill: PALETTE.emerald },
			{ name: 'Intermediat', value: sirTotals.I, fill: PALETTE.amber },
			{ name: 'Resisten', value: sirTotals.R, fill: PALETTE.rose },
		],
		[sirTotals],
	);

	const totalAnalysesGlobal = data?.overview.totalAnalyses ?? 0;
	const completionRate = data?.overview.completionRate ?? 0;
	void totalAnalysesGlobal;
	void completionRate;
	const hasResistanceData = sirTotals.total > 0;
	const hasTrend = trendData.some((point) => point.count > 0);

	const rangeSummary = useMemo(() => {
		const start = rangeWindow.start.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
		const end = rangeWindow.end.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
		return `${start} — ${end}`;
	}, [rangeWindow]);

	const bucketLabel =
		rangeWindow.bucket === 'day'
			? 'harian'
			: rangeWindow.bucket === 'week'
				? 'mingguan'
				: rangeWindow.bucket === 'month'
					? 'bulanan'
					: 'tahunan';

	return (
		<div className={shellClass}>
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div className={panelClass}>
				{/* Header */}
				<div className="bio-aa-header">
					<div className="bio-aa-header-left">
						<div className="bio-aa-brand-badge">
							<Microscope className="h-3.5 w-3.5" />
							<span>Resistance Insights</span>
						</div>
						<h1 className="bio-aa-title">Antibiogram Analytics</h1>
						<p className="bio-aa-subtitle">
							{subtitle || title || 'Pantauan resistensi antibiotik berbasis AI'}
						</p>
					</div>
					<div className="bio-aa-header-actions">
						<Button
							variant="ghost"
							size="icon"
							onClick={onBack}
							className="bio-member-settings-btn"
							aria-label="Kembali"
						>
							<ArrowLeft className="w-5 h-5" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onRefresh}
							disabled={isLoading}
							className="bio-member-settings-btn"
						>
							<RefreshCcw className="w-4 h-4 mr-2" />
							Refresh
						</Button>
					</div>
				</div>

				<div className="bio-aa-statusbar">
					<div className="flex items-center gap-1.5">
						<Activity className="w-3.5 h-3.5" />
						<span>Auto refresh {autoRefreshSeconds}s</span>
					</div>
					{lastUpdatedLabel && <span>· Updated {lastUpdatedLabel}</span>}
					{isLoading && <span className="text-teal-700">· Memuat data…</span>}
				</div>

				{/* Time range filter */}
				<Card className="bio-aa-filter-card">
					<div className="bio-aa-filter-head">
						<div className="flex items-center gap-2 text-slate-700">
							<CalendarRange className="h-4 w-4" />
							<span className="text-sm font-semibold">Rentang Waktu</span>
						</div>
						<span className="bio-aa-range-pill">{rangeSummary}</span>
					</div>
					<div className="bio-aa-range-tabs" role="tablist">
						{RANGE_OPTIONS.map((option) => {
							const active = option.key === rangeKey;
							return (
								<button
									key={option.key}
									type="button"
									role="tab"
									aria-selected={active}
									onClick={() => setRangeKey(option.key)}
									className={`bio-aa-range-tab${active ? ' is-active' : ''}`}
								>
									<span className="bio-aa-range-tab-label">{option.label}</span>
									<span className="bio-aa-range-tab-sub">{option.short}</span>
								</button>
							);
						})}
					</div>
					{rangeKey === 'custom' && (
						<div className="bio-aa-custom-row">
							<label className="bio-aa-date-field">
								<span>Mulai</span>
								<input
									type="date"
									value={customStart}
									max={customEnd || undefined}
									onChange={(event) => setCustomStart(event.target.value)}
								/>
							</label>
							<label className="bio-aa-date-field">
								<span>Selesai</span>
								<input
									type="date"
									value={customEnd}
									min={customStart || undefined}
									max={today}
									onChange={(event) => setCustomEnd(event.target.value)}
								/>
							</label>
						</div>
					)}
				</Card>

				{errorMessage && (
					<Card className="border border-red-200 bg-red-50/70 p-3 text-sm text-red-700">
						{errorMessage}
					</Card>
				)}

				{filteredAnalyses.length === 0 ? (
					<Card className="bio-aa-section-card bio-aa-empty-state">
						<div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow">
							<Microscope className="h-7 w-7" />
						</div>
						<h2 className="bio-aa-section-title text-center">
							{(!analyses || analyses.length === 0)
								? 'Belum ada laporan tersimpan'
								: 'Tidak ada laporan pada rentang waktu ini'}
						</h2>
						<p className="bio-aa-section-sub text-center max-w-md mx-auto">
							{(!analyses || analyses.length === 0)
								? 'Mulai analisis pertama untuk membangun statistik resistensi antibiotik.'
								: 'Ubah rentang waktu atau buat laporan baru untuk melihat insight di sini.'}
						</p>
						<div className="mt-3 flex flex-wrap items-center justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setRangeKey('year')}
							>
								<X className="w-4 h-4 mr-2" />
								Reset rentang
							</Button>
							{onStartAnalysis && (
								<button
									type="button"
									className="bio-aa-empty-cta"
									onClick={onStartAnalysis}
								>
									<Plus className="w-4 h-4" />
									Buat laporan baru
								</button>
							)}
						</div>
					</Card>
				) : (
				<>
				{/* Hero KPI tiles — clinically meaningful counts */}
				<div className="bio-aa-kpi-grid">
					<Card className="bio-aa-kpi bio-aa-kpi-teal">
						<div className="bio-aa-kpi-icon"><FileText className="h-4 w-4" /></div>
						<div className="bio-aa-kpi-body">
							<p className="bio-aa-kpi-label">Total Laporan</p>
							<p className="bio-aa-kpi-value">{formatNumber(totalReports)}</p>
							<p className="bio-aa-kpi-foot">laporan tersimpan pada rentang ini</p>
						</div>
					</Card>
					<Card className="bio-aa-kpi bio-aa-kpi-cyan">
						<div className="bio-aa-kpi-icon"><Beaker className="h-4 w-4" /></div>
						<div className="bio-aa-kpi-body">
							<p className="bio-aa-kpi-label">Petri Dish Dianalisis</p>
							<p className="bio-aa-kpi-value">{formatNumber(petriDishCount)}</p>
							<p className="bio-aa-kpi-foot">cawan unik diuji</p>
						</div>
					</Card>
					<Card className="bio-aa-kpi bio-aa-kpi-emerald">
						<div className="bio-aa-kpi-icon"><Microscope className="h-4 w-4" /></div>
						<div className="bio-aa-kpi-body">
							<p className="bio-aa-kpi-label">Bakteri Teridentifikasi</p>
							<p className="bio-aa-kpi-value">{formatNumber(totalBacteriaIdentified)}</p>
							<p className="bio-aa-kpi-foot">spesies unik terdeteksi</p>
						</div>
					</Card>
					<Card className="bio-aa-kpi bio-aa-kpi-violet">
						<div className="bio-aa-kpi-icon"><FlaskConical className="h-4 w-4" /></div>
						<div className="bio-aa-kpi-body">
							<p className="bio-aa-kpi-label">Uji Antibiotik</p>
							<p className="bio-aa-kpi-value">{formatNumber(sirTotals.total)}</p>
							<p className="bio-aa-kpi-foot">total cakram dengan hasil SIR</p>
						</div>
					</Card>
				</div>

				{/* Secondary KPI: rates + AI accuracy */}
				<div className="bio-aa-kpi-grid">
					<Card className="bio-aa-kpi bio-aa-kpi-emerald">
						<div className="bio-aa-kpi-icon"><ShieldCheck className="h-4 w-4" /></div>
						<div className="bio-aa-kpi-body">
							<p className="bio-aa-kpi-label">Tingkat Sensitivitas (S)</p>
							<p className="bio-aa-kpi-value">{formatPercent(susceptibilityRate)}</p>
							<p className="bio-aa-kpi-foot">
								{sirTotals.S} dari {sirTotals.total} uji menunjukkan sensitif
							</p>
						</div>
					</Card>
					<Card className="bio-aa-kpi bio-aa-kpi-rose">
						<div className="bio-aa-kpi-icon"><AlertTriangle className="h-4 w-4" /></div>
						<div className="bio-aa-kpi-body">
							<p className="bio-aa-kpi-label">Tingkat Resistensi (R)</p>
							<p className="bio-aa-kpi-value">{formatPercent(resistanceRate)}</p>
							<p className="bio-aa-kpi-foot">
								{sirTotals.R} dari {sirTotals.total} uji menunjukkan resisten
							</p>
						</div>
					</Card>
					<Card className="bio-aa-kpi bio-aa-kpi-slate">
						<div className="bio-aa-kpi-icon"><Sparkles className="h-4 w-4" /></div>
						<div className="bio-aa-kpi-body">
							<p className="bio-aa-kpi-label">Akurasi Deteksi AI</p>
							<p className="bio-aa-kpi-value">
								{aiAccuracy === null ? '—' : `${aiAccuracy.toFixed(1)}%`}
							</p>
							<p className="bio-aa-kpi-foot">
								rata-rata confidence YOLO cakram &amp; zona
							</p>
						</div>
					</Card>
				</div>

				{/* Clinical insights — most resistant bacteria, antibiotic, pair, effective abx */}
				<div className="grid gap-2 sm:grid-cols-2">
					{mostResistantBacteria && (
						<div className="bio-aa-insight-card">
							<span className="label">Bakteri dengan tingkat resistensi tertinggi</span>
							<span className="value">{mostResistantBacteria.name}</span>
							<span className="sub">
								{formatPercent(mostResistantBacteria.resistantPct)} resisten dari{' '}
								{mostResistantBacteria.total} uji
							</span>
						</div>
					)}
					{mostResistantAntibiotic && (
						<div className="bio-aa-insight-card">
							<span className="label">Antibiotik dengan tingkat resistensi tertinggi</span>
							<span className="value">{mostResistantAntibiotic.antibiotic}</span>
							<span className="sub">
								{formatPercent(mostResistantAntibiotic.resistantPct)} resisten dari{' '}
								{mostResistantAntibiotic.sirTotal} uji
							</span>
						</div>
					)}
					{bacteriaAbxMatrix.topPair && (
						<div className="bio-aa-insight-card">
							<span className="label">Pasangan paling rentan resistensi</span>
							<span className="value">
								{bacteriaAbxMatrix.topPair.bacteria} × {bacteriaAbxMatrix.topPair.antibiotic}
							</span>
							<span className="sub">
								{formatPercent(bacteriaAbxMatrix.topPair.resistantPct)} R dari{' '}
								{bacteriaAbxMatrix.topPair.tested} uji
							</span>
						</div>
					)}
					{mostEffectiveAntibiotic && (
						<div className="bio-aa-insight-card">
							<span className="label">Antibiotik paling efektif</span>
							<span className="value">{mostEffectiveAntibiotic.antibiotic}</span>
							<span className="sub">
								{formatPercent(mostEffectiveAntibiotic.susceptiblePct)} sensitif dari{' '}
								{mostEffectiveAntibiotic.sirTotal} uji
							</span>
						</div>
					)}
					{mostDetectedBacteria && (
						<div className="bio-aa-insight-card">
							<span className="label">Bakteri paling sering terdeteksi</span>
							<span className="value">{mostDetectedBacteria.name}</span>
							<span className="sub">
								{formatNumber(mostDetectedBacteria.count)} sampel
							</span>
						</div>
					)}
				</div>

				{/* Resistance vs Susceptible */}
				<Card className="bio-aa-section-card">
					<div className="bio-aa-section-head">
						<h2 className="bio-aa-section-title">Resistance vs Susceptible</h2>
						<span className="bio-aa-section-sub">Distribusi seluruh hasil SIR</span>
					</div>
					{!hasResistanceData ? (
						<p className="bio-aa-empty">Belum ada data hasil resistensi.</p>
					) : (
						<div className="bio-aa-pie-row">
							<ChartContainer
								config={{
									Rentan: { label: 'Rentan', color: PALETTE.emerald },
									Intermediat: { label: 'Intermediat', color: PALETTE.amber },
									Resisten: { label: 'Resisten', color: PALETTE.rose },
								}}
								className="h-60 w-full"
							>
								<PieChart>
									<ChartTooltip content={<ChartTooltipContent hideLabel />} />
									<Pie
										data={resistanceChartData}
										dataKey="value"
										nameKey="name"
										innerRadius={55}
										outerRadius={88}
										paddingAngle={2}
										strokeWidth={2}
									>
										{resistanceChartData.map((entry) => (
											<Cell key={entry.name} fill={entry.fill} />
										))}
									</Pie>
								</PieChart>
							</ChartContainer>
							<div className="bio-aa-legend">
								<div className="bio-aa-legend-row">
									<span className="bio-aa-legend-dot" style={{ background: PALETTE.emerald }} />
									<span>Rentan</span>
									<span className="bio-aa-legend-value">{sirTotals.S}</span>
								</div>
								<div className="bio-aa-legend-row">
									<span className="bio-aa-legend-dot" style={{ background: PALETTE.amber }} />
									<span>Intermediat</span>
									<span className="bio-aa-legend-value">{sirTotals.I}</span>
								</div>
								<div className="bio-aa-legend-row">
									<span className="bio-aa-legend-dot" style={{ background: PALETTE.rose }} />
									<span>Resisten</span>
									<span className="bio-aa-legend-value">{sirTotals.R}</span>
								</div>
								<p className="bio-aa-legend-foot">Total {sirTotals.total} cakram terklasifikasi</p>
							</div>
						</div>
					)}
				</Card>

				{/* Detection trend */}
				<Card className="bio-aa-section-card">
					<div className="bio-aa-section-head">
						<h2 className="bio-aa-section-title">Tren Deteksi</h2>
						<span className="bio-aa-section-sub">Granularitas {bucketLabel}</span>
					</div>
					{!hasTrend ? (
						<p className="bio-aa-empty">Belum ada deteksi pada rentang ini.</p>
					) : (
						<ChartContainer
							config={{ count: { label: 'Deteksi', color: PALETTE.teal } }}
							className="h-60 w-full"
						>
							<LineChart data={trendData} margin={{ left: 8, right: 12 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
								<XAxis
									dataKey="label"
									tickLine={false}
									axisLine={false}
									interval="preserveStartEnd"
									tick={{ fontSize: 11, fill: '#64748b' }}
								/>
								<YAxis
									allowDecimals={false}
									width={32}
									tick={{ fontSize: 11, fill: '#64748b' }}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Line
									type="monotone"
									dataKey="count"
									stroke="var(--color-count)"
									strokeWidth={2.5}
									dot={{ r: 3, strokeWidth: 0 }}
									activeDot={{ r: 5 }}
								/>
							</LineChart>
						</ChartContainer>
					)}
				</Card>

				{/* Bacteria distribution */}
				<Card className="bio-aa-section-card">
					<div className="bio-aa-section-head">
						<h2 className="bio-aa-section-title">Distribusi Bakteri</h2>
						<span className="bio-aa-section-sub">Top {bacteriaChartData.length} spesies</span>
					</div>
					{bacteriaChartData.length === 0 ? (
						<p className="bio-aa-empty">Belum ada data bakteri.</p>
					) : (
						<ChartContainer
							config={{ bacteria: { label: 'Jumlah', color: PALETTE.cyan } }}
							className="h-72 w-full"
						>
							<BarChart data={bacteriaChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
								<CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
								<XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
								<YAxis
									dataKey="name"
									type="category"
									width={120}
									tick={{ fontSize: 11, fill: '#334155' }}
								/>
								<ChartTooltip content={<ChartTooltipContent nameKey="bacteria" />} />
								<Bar dataKey="count" fill="var(--color-bacteria)" radius={[6, 6, 6, 6]} />
							</BarChart>
						</ChartContainer>
					)}
				</Card>

				{/* Antibiotic usage */}
				<Card className="bio-aa-section-card">
					<div className="bio-aa-section-head">
						<h2 className="bio-aa-section-title">Penggunaan Antibiotik</h2>
						<span className="bio-aa-section-sub">Antibiotik paling sering diuji</span>
					</div>
					{antibioticUsageData.length === 0 ? (
						<p className="bio-aa-empty">Belum ada data penggunaan antibiotik.</p>
					) : (
						<ChartContainer
							config={{ usage: { label: 'Jumlah uji', color: PALETTE.deep } }}
							className="h-72 w-full"
						>
							<BarChart data={antibioticUsageData} layout="vertical" margin={{ left: 8, right: 16 }}>
								<CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
								<XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
								<YAxis
									dataKey="name"
									type="category"
									width={120}
									tick={{ fontSize: 11, fill: '#334155' }}
								/>
								<ChartTooltip content={<ChartTooltipContent nameKey="usage" />} />
								<Bar dataKey="count" fill="var(--color-usage)" radius={[6, 6, 6, 6]} />
							</BarChart>
						</ChartContainer>
					)}
				</Card>

				{/* SIR per antibiotic */}
				<Card className="bio-aa-section-card">
					<div className="bio-aa-section-head">
						<h2 className="bio-aa-section-title">Distribusi SIR per Antibiotik</h2>
						<span className="bio-aa-section-sub">Rentan · Intermediat · Resisten</span>
					</div>
					{antibioticSirData.length === 0 ? (
						<p className="bio-aa-empty">Belum ada data SIR per antibiotik.</p>
					) : (
						<ChartContainer
							config={{
								Rentan: { label: 'Rentan', color: PALETTE.emerald },
								Intermediat: { label: 'Intermediat', color: PALETTE.amber },
								Resisten: { label: 'Resisten', color: PALETTE.rose },
							}}
							className="h-72 w-full"
						>
							<BarChart data={antibioticSirData} layout="vertical" margin={{ left: 8, right: 16 }}>
								<CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
								<XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
								<YAxis
									dataKey="name"
									type="category"
									width={120}
									tick={{ fontSize: 11, fill: '#334155' }}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Legend wrapperStyle={{ fontSize: 11 }} />
								<Bar dataKey="Rentan" stackId="sir" fill="var(--color-Rentan)" radius={[6, 0, 0, 6]} />
								<Bar dataKey="Intermediat" stackId="sir" fill="var(--color-Intermediat)" />
								<Bar dataKey="Resisten" stackId="sir" fill="var(--color-Resisten)" radius={[0, 6, 6, 0]} />
							</BarChart>
						</ChartContainer>
					)}
				</Card>

				{/* Resistance ranking */}
				<Card className="bio-aa-section-card">
					<div className="bio-aa-section-head">
						<h2 className="bio-aa-section-title">Peringkat Resistensi</h2>
						<span className="bio-aa-section-sub">Min. 3 uji per antibiotik</span>
					</div>
					{resistanceRankingData.length === 0 ? (
						<p className="bio-aa-empty">Butuh minimal 3 uji per antibiotik untuk peringkat ini.</p>
					) : (
						<div className="grid gap-2">
							{resistanceRankingData.map((row) => (
								<div key={row.name} className="bio-aa-ranking-row">
									<div className="flex items-baseline justify-between gap-3">
										<p className="bio-aa-ranking-name">{row.name}</p>
										<p className="bio-aa-ranking-value">{row.value}%</p>
									</div>
									<div className="bio-aa-progress">
										<div
											className="bio-aa-progress-fill"
											style={{ width: `${Math.min(100, row.value)}%` }}
										/>
									</div>
									<p className="bio-aa-ranking-foot">Berdasarkan {row.tested} hasil SIR</p>
								</div>
							))}
						</div>
					)}
				</Card>

				{diameterSummary && (
					<Card className="bio-aa-section-card bio-aa-diameter-card">
						<div className="flex items-center gap-2 text-slate-600">
							<Ruler className="h-4 w-4" />
							<span className="text-xs font-semibold tracking-wide uppercase">Diameter Zona Hambat</span>
						</div>
						<p className="bio-aa-diameter-value">{diameterSummary.avg.toFixed(1)} mm</p>
						<p className="text-xs text-slate-500">
							Rata-rata dari {diameterSummary.count} cakram — rentang {diameterSummary.min.toFixed(1)}–{diameterSummary.max.toFixed(1)} mm
						</p>
					</Card>
				)}

				{/* Top resistant bacteria (resistance rate) */}
				<Card className="bio-aa-section-card">
					<div className="bio-aa-section-head">
						<h2 className="bio-aa-section-title">Top Bakteri Berdasarkan Resistensi</h2>
						<span className="bio-aa-section-sub">% resisten · min. 3 uji bertipe</span>
					</div>
					{topResistantBacteriaChart.length === 0 ? (
						<p className="bio-aa-empty">Belum ada bakteri dengan minimal 3 uji bertipe SIR.</p>
					) : (
						<ChartContainer
							config={{ value: { label: 'Resistensi %', color: PALETTE.rose } }}
							className="h-60 w-full"
						>
							<BarChart data={topResistantBacteriaChart} layout="vertical" margin={{ left: 8, right: 16 }}>
								<CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
								<XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
								<YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#334155' }} />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 6, 6]} />
							</BarChart>
						</ChartContainer>
					)}
				</Card>

				{/* Bacteria × Antibiotic resistance heatmap */}
				<Card className="bio-aa-section-card">
					<div className="bio-aa-section-head">
						<h2 className="bio-aa-section-title">Matriks Bakteri × Antibiotik</h2>
						<span className="bio-aa-section-sub">Warna sel = tingkat resistensi (%)</span>
					</div>
					{bacteriaAbxMatrix.bacteriaList.length === 0 || bacteriaAbxMatrix.abxList.length === 0 ? (
						<p className="bio-aa-empty">Belum ada data untuk menampilkan matriks.</p>
					) : (
						<div
							className="bio-aa-heat-grid"
							style={{ ['--abx-cols' as any]: bacteriaAbxMatrix.abxList.length }}
						>
							<div className="bio-aa-heat-row bio-aa-heat-row-head">
								<div className="bio-aa-heat-axis">Bakteri \\ Antibiotik</div>
								{bacteriaAbxMatrix.abxList.map((abx) => (
									<div key={abx} className="bio-aa-heat-axis bio-aa-heat-axis-col">
										{abx}
									</div>
								))}
							</div>
							{bacteriaAbxMatrix.bacteriaList.map((bacteria) => (
								<div key={bacteria} className="bio-aa-heat-row">
									<div className="bio-aa-heat-axis">{bacteria}</div>
									{bacteriaAbxMatrix.abxList.map((abx) => {
										const cell = bacteriaAbxMatrix.map.get(`${bacteria}|${abx}`);
										if (!cell || cell.total === 0) {
											return (
												<div key={abx} className="bio-aa-heat-cell bio-aa-heat-cell-empty">
													—
												</div>
											);
										}
										const pct = (cell.R / cell.total) * 100;
										const intensity = Math.min(1, pct / 100);
										// blend slate→amber→rose
										let bg = '#ecfdf5';
										let color = '#047857';
										if (pct >= 66) { bg = '#fecaca'; color = '#7f1d1d'; }
										else if (pct >= 33) { bg = '#fde68a'; color = '#78350f'; }
										else if (pct > 0) { bg = '#d1fae5'; color = '#065f46'; }
										void intensity;
										return (
											<div
												key={abx}
												className="bio-aa-heat-cell"
												style={{ background: bg, color, borderColor: 'transparent' }}
												title={`${bacteria} × ${abx}: ${Math.round(pct)}% R dari ${cell.total} uji`}
											>
												{Math.round(pct)}%
											</div>
										);
									})}
								</div>
							))}
						</div>
					)}
				</Card>
				</>
				)}
			</div>
		</div>
	);
}
