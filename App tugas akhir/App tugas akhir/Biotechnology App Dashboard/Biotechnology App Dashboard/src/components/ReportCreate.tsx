import { ArrowLeft, Camera, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnalysisData, AnalysisMeasurement, ResistanceResult } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { antibioticsData } from './AntibioticsReference';
import { compactReportId } from '../utils/analysisId';
import { inferSirResult, sirAntibioticOptions } from '../utils/sirBreakpoints';

const parseTagsInput = (value: string): string[] => {
	const seen = new Set<string>();
	const output: string[] = [];
	for (const raw of value.split(',')) {
		const trimmed = raw.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		output.push(trimmed);
	}
	return output;
};

const antibioticOptions = Array.from(
	new Map([...antibioticsData.map((a) => a.name), ...sirAntibioticOptions]
		.map((name) => [name.toLowerCase(), name])).values(),
).sort((first, second) => first.localeCompare(second));

const RESULT_OPTIONS: Array<{ value: ResistanceResult; label: string }> = [
	{ value: 'RESISTEN', label: 'Resistant' },
	{ value: 'INTERMEDIAT', label: 'Intermediate' },
	{ value: 'RENTAN', label: 'Susceptible' },
];

const todayIsoDate = () => new Date().toISOString().split('T')[0];

const formatDiameter = (value?: number) => {
	if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
	return `${value.toFixed(2)} mm`;
};

const getResultInfo = (result?: ResistanceResult | '') => {
	switch (result) {
		case 'RENTAN':
			return { label: 'Susceptible', shortLabel: 'S', toneClass: 'is-s' };
		case 'INTERMEDIAT':
			return { label: 'Intermediate', shortLabel: 'I', toneClass: 'is-i' };
		case 'RESISTEN':
			return { label: 'Resistant', shortLabel: 'R', toneClass: 'is-r' };
		default:
			return { label: 'Pending', shortLabel: '-', toneClass: 'is-pending' };
	}
};

const getAntibioticTitle = (antibiotic?: string) => {
	const value = antibiotic?.trim();
	if (value) return value;
	return 'Select antibiotic';
};

const getSampleLabel = (index: number) => {
	return `Sample ${Math.max(1, Math.floor(index) + 1)}`;
};

const getMeasurementSampleLabel = (measurement: AnalysisMeasurement, fallbackIndex: number) => {
	const numericIndex = Number(measurement?.index);
	if (Number.isFinite(numericIndex) && numericIndex > 0) {
		return getSampleLabel(numericIndex - 1);
	}

	return getSampleLabel(fallbackIndex);
};

interface ReportCreateProps {
	analysis: AnalysisData;
	relatedAnalyses?: AnalysisData[];
	availableBacteriaOptions?: string[];
	initialSampleId?: string;
	onBack: () => void;
	onConfirm: (updatedAnalysis: AnalysisData | AnalysisData[]) => void;
	onRetake?: () => void;
}

type ReportRowDraft = {
	id: string;
	analysisId?: string;
	label: string;
	diameter?: number;
	bacteriaName: string;
	specimenType: string;
	antibiotic: string;
	actionDate: string;
	result: ResistanceResult | '';
	resultSource?: 'auto' | 'manual';
};

const withInferredResult = (row: ReportRowDraft): ReportRowDraft => {
	if (row.resultSource === 'manual') return row;
	const inferredResult = inferSirResult({
		bacteriaName: row.bacteriaName,
		antibiotic: row.antibiotic,
		diameterMm: row.diameter,
	});
	return {
		...row,
		result: inferredResult,
		resultSource: inferredResult ? 'auto' : undefined,
	};
};

const createRowWithResult = (row: Omit<ReportRowDraft, 'result' | 'resultSource'>, existingResult?: ResistanceResult | ''): ReportRowDraft => {
	if (existingResult) {
		return { ...row, result: existingResult, resultSource: 'manual' };
	}
	return withInferredResult({ ...row, result: '' });
};

const createInitialRows = (analysis: AnalysisData, sourceAnalyses: AnalysisData[]): ReportRowDraft[] => {
	const sharedBacteria = analysis.bacteriaName?.trim() || sourceAnalyses
		.map((item) => item.bacteriaName?.trim() || '')
		.find((value) => value.length > 0) || '';
	const sharedActionDate = analysis.actionDate || sourceAnalyses
		.map((item) => item.actionDate || item.date || '')
		.find((value) => value.length > 0) || analysis.date || todayIsoDate();
	const baseSpecimen = analysis.specimenType?.trim() || '';
	const baseAntibiotic = (analysis.antibioticA || analysis.antibiotic || '').trim();
	const baseResult = analysis.result || '';

	if (sourceAnalyses.length > 1) {
		return sourceAnalyses.map((item, index) => {
			const measurement = item.measurements?.[0];
			return createRowWithResult({
				id: `analysis-${item.id || index + 1}-${index + 1}`,
				analysisId: item.id,
				label: measurement ? getMeasurementSampleLabel(measurement, index) : getSampleLabel(index),
				diameter: item.diameter ?? measurement?.diameterMm,
				bacteriaName: sharedBacteria,
				specimenType: item.specimenType?.trim() || '',
				antibiotic: (item.antibioticA || item.antibiotic || '').trim(),
				actionDate: sharedActionDate,
			}, item.result || measurement?.result || '');
		});
	}

	if (analysis.measurements && analysis.measurements.length > 0) {
		return analysis.measurements.map((measurement, index) => createRowWithResult({
			id: `measurement-${measurement.id || index + 1}-${index + 1}`,
			analysisId: index === 0 ? analysis.id : undefined,
			label: getMeasurementSampleLabel(measurement, index),
			diameter: measurement.diameterMm,
			bacteriaName: sharedBacteria,
			specimenType: baseSpecimen,
			antibiotic: baseAntibiotic,
			actionDate: sharedActionDate,
		}, measurement.result || baseResult));
	}

	return [
		createRowWithResult({
			id: `analysis-${analysis.id || 'draft'}-1`,
			analysisId: analysis.id,
			label: 'Sample 1',
			diameter: analysis.diameter,
			bacteriaName: sharedBacteria,
			specimenType: baseSpecimen,
			antibiotic: baseAntibiotic,
			actionDate: sharedActionDate,
		}, baseResult),
	];
};

const dedupeOptions = (values: string[]) => Array.from(
	new Map(
		values
			.map((value) => value.trim())
			.filter(Boolean)
			.map((value) => [value.toLowerCase(), value]),
	).values(),
).sort((first, second) => first.localeCompare(second));

interface SearchableComboboxProps {
	value: string;
	options: string[];
	placeholder: string;
	emptyLabel: string;
	onSelect: (value: string) => void;
	allowCustomValue?: boolean;
}

function SearchableCombobox({
	value,
	options,
	placeholder,
	emptyLabel,
	onSelect,
	allowCustomValue = true,
}: SearchableComboboxProps) {
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const normalizedOptions = useMemo(
		() => dedupeOptions(value ? [value, ...options] : options),
		[options, value],
	);

	const filteredOptions = useMemo(() => {
		const trimmedQuery = value.trim().toLowerCase();
		if (!trimmedQuery) return normalizedOptions;
		return normalizedOptions.filter((option) => option.toLowerCase().includes(trimmedQuery));
	}, [normalizedOptions, value]);

	const trimmedValue = value.trim();
	const hasExactMatch = normalizedOptions.some((option) => option.toLowerCase() === trimmedValue.toLowerCase());
	const isCustomValue = allowCustomValue && trimmedValue.length > 0 && !hasExactMatch;
	const shouldShowDropdown = isOpen && (filteredOptions.length > 0 || (!allowCustomValue && trimmedValue.length > 0));

	useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (!rootRef.current) return;
			if (rootRef.current.contains(event.target as Node)) return;
			setIsOpen(false);
		};

		document.addEventListener('pointerdown', handlePointerDown);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen || typeof window === 'undefined' || !window.visualViewport) return;

		const viewport = window.visualViewport;
		const keepFieldVisible = () => {
			requestAnimationFrame(() => {
				inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
			});
		};

		viewport.addEventListener('resize', keepFieldVisible);
		viewport.addEventListener('scroll', keepFieldVisible);
		return () => {
			viewport.removeEventListener('resize', keepFieldVisible);
			viewport.removeEventListener('scroll', keepFieldVisible);
		};
	}, [isOpen]);

	const handleFocus = () => {
		setIsOpen(true);
		requestAnimationFrame(() => {
			inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
		});
		window.setTimeout(() => {
			inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
		}, 260);
	};

	const handleSelect = (nextValue: string) => {
		onSelect(nextValue);
		setIsOpen(false);
		requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
	};

	return (
		<div ref={rootRef} className="bio-searchable-select">
			<Input
				ref={inputRef}
				value={value}
				onChange={(event) => {
					onSelect(event.target.value);
					setIsOpen(true);
				}}
				onFocus={handleFocus}
				placeholder={placeholder}
				autoComplete="off"
				className="bio-report-form-select h-10 w-full"
			/>
			{shouldShowDropdown && (
				<div className="bio-searchable-select-panel" role="listbox">
					{filteredOptions.length > 0 ? filteredOptions.map((option) => {
						const isSelected = option.toLowerCase() === trimmedValue.toLowerCase();
						return (
							<button
								key={option}
								type="button"
								className={`bio-searchable-select-option${isSelected ? ' is-active' : ''}`}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => handleSelect(option)}
							>
								{option}
							</button>
						);
					}) : (
						<div className="bio-searchable-select-empty">{emptyLabel}</div>
					)}
				</div>
			)}
			{isCustomValue && (
				<span className="bio-searchable-select-help text-[11px] font-medium text-slate-500">
					{filteredOptions.length > 0 ? 'Using custom value while showing closest matches.' : `${emptyLabel} Custom value will be used.`}
				</span>
			)}
		</div>
	);
}

export default function ReportCreate({ analysis, relatedAnalyses, availableBacteriaOptions, initialSampleId, onBack, onConfirm, onRetake }: ReportCreateProps) {
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const sourceAnalyses = useMemo(
		() => (relatedAnalyses && relatedAnalyses.length > 0 ? relatedAnalyses : [analysis]),
		[analysis, relatedAnalyses],
	);
	const [rows, setRows] = useState<ReportRowDraft[]>(() => createInitialRows(analysis, sourceAnalyses));
	const initialReportName = (analysis.reportName || sourceAnalyses.find((item) => item.reportName)?.reportName || '').trim();
	const initialNotes = (analysis.notes || sourceAnalyses.find((item) => item.notes)?.notes || '').trim();
	const initialSampleIdValue = (analysis.sampleId || sourceAnalyses.find((item) => item.sampleId)?.sampleId || '').trim();
	const initialTags = (analysis.tags && analysis.tags.length > 0
		? analysis.tags
		: sourceAnalyses.find((item) => item.tags && item.tags.length > 0)?.tags) || [];
	const [reportName, setReportName] = useState(initialReportName);
	const [reportNotes, setReportNotes] = useState(initialNotes);
	const [reportSampleId, setReportSampleId] = useState(initialSampleIdValue);
	const [reportTagsInput, setReportTagsInput] = useState(initialTags.join(', '));
	const [reportNameTouched, setReportNameTouched] = useState(false);
	const reportTags = useMemo(() => parseTagsInput(reportTagsInput), [reportTagsInput]);
	const trimmedReportName = reportName.trim();
	const isReportNameValid = trimmedReportName.length > 0;
	const initialRowIndex = useMemo(() => {
		if (!initialSampleId) return 0;
		const foundIndex = rows.findIndex((row) => row.id === initialSampleId || row.analysisId === initialSampleId);
		return foundIndex >= 0 ? foundIndex : 0;
	}, [initialSampleId, rows]);
	const [activeRowIndex, setActiveRowIndex] = useState(initialRowIndex);
	const detectionImageUrl = analysis.processedImage || analysis.originalImage || '';
	const reportDisplayId = compactReportId(
		analysis.reportDisplayId || sourceAnalyses.find((item) => item.reportDisplayId)?.reportDisplayId || sourceAnalyses[0]?.id || analysis.id,
	);
	const activeRow = rows[Math.min(activeRowIndex, Math.max(rows.length - 1, 0))];
	const canGoPrevious = activeRowIndex > 0;
	const canGoNext = activeRowIndex < rows.length - 1;
	const antibioticSelectOptions = useMemo(() => {
		if (!activeRow?.antibiotic?.trim()) return antibioticOptions;
		const activeValue = activeRow.antibiotic.trim();
		const exists = antibioticOptions.some((option) => option.toLowerCase() === activeValue.toLowerCase());
		return exists ? antibioticOptions : [activeValue, ...antibioticOptions];
	}, [activeRow]);
	const bacteriaSelectOptions = useMemo(() => dedupeOptions([
		...(availableBacteriaOptions || []),
		...sourceAnalyses.map((item) => item.bacteriaName || ''),
	]), [availableBacteriaOptions, sourceAnalyses]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		requestAnimationFrame(() => {
			container.scrollTo({ top: 0, behavior: 'auto' });
		});
	}, [analysis.id, analysis.processedImage]);

	const updateBacteriaForAll = (value: string) => {
		setRows((currentRows) => currentRows.map((row) => withInferredResult({ ...row, bacteriaName: value })));
	};

	const updateActionDateForAll = (value: string) => {
		setRows((currentRows) => currentRows.map((row) => ({ ...row, actionDate: value })));
	};

	const updateActiveRow = <Key extends keyof ReportRowDraft>(
		key: Key,
		value: ReportRowDraft[Key],
	) => {
		setRows((currentRows) => currentRows.map((row, index) => (
			index === activeRowIndex
				? key === 'result'
					? { ...row, [key]: value, resultSource: 'manual' }
					: withInferredResult({ ...row, [key]: value })
				: row
		)));
	};

	const handleConfirm = () => {
		setReportNameTouched(true);
		if (!isReportNameValid) {
			return;
		}
		const reportGroupId = analysis.reportGroupId || sourceAnalyses.find((item) => item.reportGroupId)?.reportGroupId;
		const reportDisplayId = analysis.reportDisplayId || sourceAnalyses.find((item) => item.reportDisplayId)?.reportDisplayId || analysis.id;
		const trimmedSampleId = reportSampleId.trim();
		const trimmedNotes = reportNotes.trim();
		const tagsToSave = reportTags;
		const updatedAnalyses = rows.map((row, index) => {
			const sourceAnalysis = sourceAnalyses.find((item) => item.id === row.analysisId) || sourceAnalyses[index] || analysis;
			const sourceMeasurement = sourceAnalysis.measurements?.[0] || analysis.measurements?.[index];
			const updatedMeasurement = sourceMeasurement
				? {
					...sourceMeasurement,
					diameterMm: row.diameter ?? sourceMeasurement.diameterMm,
					result: row.result || undefined,
				}
				: undefined;
			const outputId = sourceAnalyses.length > 1 && row.analysisId
				? row.analysisId
				: index === 0
					? analysis.id
					: `${analysis.id}-${index + 1}`;
			return {
				...sourceAnalysis,
				id: outputId,
				reportGroupId,
				reportDisplayId,
				reportName: trimmedReportName,
				sampleId: trimmedSampleId || undefined,
				tags: tagsToSave.length > 0 ? tagsToSave : undefined,
				notes: trimmedNotes || undefined,
				status: 'Complete' as const,
				bacteriaName: row.bacteriaName.trim(),
				specimenType: row.specimenType.trim(),
				actionDate: row.actionDate,
				diameter: row.diameter,
				antibiotic: row.antibiotic.trim(),
				antibioticA: row.antibiotic.trim(),
				result: row.result || undefined,
				processedImage: analysis.processedImage || analysis.originalImage,
				originalImage: analysis.originalImage,
				measurements: updatedMeasurement ? [updatedMeasurement] : [],
			};
		});

		onConfirm(updatedAnalyses.length === 1 ? updatedAnalyses[0] : updatedAnalyses);
	};

	const activeResultInfo = getResultInfo(activeRow?.result);

	return (
		<div
			ref={scrollContainerRef}
			className="bio-admin-shell bio-org-profile-shell bio-safe-screen"
			style={{ overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y' }}
		>
			<div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
			<div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

			<div
				className="bio-admin-panel bio-org-profile-panel"
				style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minHeight: 'min(92dvh, 48rem)' }}
			>
				<div className="bio-org-profile-header">
					<Button
						variant="ghost"
						size="icon"
						className="bio-member-settings-btn bio-org-profile-back"
						onClick={onBack}
						aria-label="Back to dashboard"
					>
						<ArrowLeft className="w-5 h-5" />
					</Button>

					<div>
						<p className="bio-admin-kicker">Analysis Report</p>
						<h1 className="bio-admin-title bio-org-profile-title">Create Report</h1>
						<p className="bio-admin-subtitle">Lengkapi data analisis untuk Test #{reportDisplayId}.</p>
					</div>
				</div>

				<div className="bio-admin-section bio-org-profile-name-card">
					<div className="flex items-center justify-between gap-3">
						<p className="bio-org-profile-label">Report Details</p>
						<span className="text-[11px] font-medium text-slate-500">Auto ID: {reportDisplayId}</span>
					</div>
					<div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<label className="grid gap-1.5 sm:col-span-2">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Report Name <span className="text-rose-600">*</span>
							</span>
							<Input
								value={reportName}
								onChange={(event) => setReportName(event.target.value)}
								onBlur={() => setReportNameTouched(true)}
								placeholder="e.g. Ward 3 routine screen — 17 May 2026"
								className="h-10 w-full"
								aria-invalid={reportNameTouched && !isReportNameValid}
							/>
							{reportNameTouched && !isReportNameValid && (
								<span className="text-[11px] font-semibold text-rose-600">
									Report name is required so this report is searchable in History.
								</span>
							)}
						</label>

						<label className="grid gap-1.5">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Petri dish / Sample ID
							</span>
							<Input
								value={reportSampleId}
								onChange={(event) => setReportSampleId(event.target.value)}
								placeholder="e.g. PD-0017 (optional)"
								className="h-10 w-full"
							/>
						</label>

						<label className="grid gap-1.5">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Tags
							</span>
							<Input
								value={reportTagsInput}
								onChange={(event) => setReportTagsInput(event.target.value)}
								placeholder="comma-separated (e.g. ICU, urine, follow-up)"
								className="h-10 w-full"
							/>
							{reportTags.length > 0 && (
								<div className="mt-1 flex flex-wrap gap-1">
									{reportTags.map((tag) => (
										<span
											key={tag}
											className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-800"
										>
											{tag}
											<button
												type="button"
												onClick={() => setReportTagsInput(reportTags.filter((value) => value !== tag).join(', '))}
												className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-cyan-700 hover:bg-cyan-100"
												aria-label={`Remove tag ${tag}`}
											>
												<X className="h-2.5 w-2.5" />
											</button>
										</span>
									))}
								</div>
							)}
						</label>

						<label className="grid gap-1.5 sm:col-span-2">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Notes
							</span>
							<textarea
								value={reportNotes}
								onChange={(event) => setReportNotes(event.target.value)}
								placeholder="Clinical context, observations, or follow-up instructions (optional)"
								rows={2}
								className="bio-report-form-select w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm leading-relaxed focus:outline-none"
							/>
						</label>
					</div>
				</div>

				<div className="bio-admin-section bio-org-profile-name-card">
					<div className="flex items-center justify-between gap-3">
						<p className="bio-org-profile-label">Detection Result</p>
						<div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
							<CheckCircle2 className="h-3.5 w-3.5" />
							{rows.length} detected
						</div>
					</div>
					<div className="w-full h-[32dvh] min-h-[13rem] rounded-xl bg-gray-100 overflow-hidden border border-slate-200/70">
						{detectionImageUrl ? (
							<ImageWithFallback
								src={detectionImageUrl}
								alt="Detection result"
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-gray-400">
								No Image
							</div>
						)}
					</div>
					{onRetake && (
						<div className="mt-2 flex items-center justify-between gap-2">
							<p className="text-[11px] text-slate-500 leading-snug">
								Deteksi tidak akurat? Ambil ulang foto.
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onRetake}
								className="h-9 gap-1.5 rounded-full border-teal-200 bg-teal-50 px-3 text-teal-700 hover:bg-teal-100 hover:text-teal-800"
							>
								<Camera className="h-4 w-4" />
								Retake picture
							</Button>
						</div>
					)}
				</div>

				<div className="bio-admin-section">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="bio-org-profile-label">Detected Diameter List</p>
							<p className="text-slate-600 text-sm">
								Pilih kartu antibiotik atau gunakan panah untuk mengisi hasil tiap disk.
							</p>
						</div>
						<div className="bio-report-disk-counter">
							AB disk {activeRowIndex + 1} of {rows.length}
						</div>
					</div>

					<div className="bio-report-editor-card">
						<div className="flex items-center justify-between gap-3">
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-10 w-10 shrink-0 rounded-full"
								onClick={() => setActiveRowIndex((value) => Math.max(0, value - 1))}
								disabled={!canGoPrevious}
								aria-label="Previous AB disk"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>

							<div className="bio-report-editor-summary">
								<p className="bio-report-sample-title">{getAntibioticTitle(activeRow.antibiotic)}</p>
								<div className="bio-report-sample-metrics bio-report-sample-metrics-compact">
									<p className="bio-report-sample-metric"><span>Inhibition Zone</span>{formatDiameter(activeRow.diameter)}</p>
									<p className="bio-report-sample-metric"><span>SIR</span>{activeResultInfo.label}</p>
								</div>
							</div>

							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-10 w-10 shrink-0 rounded-full"
								onClick={() => setActiveRowIndex((value) => Math.min(rows.length - 1, value + 1))}
								disabled={!canGoNext}
								aria-label="Next AB disk"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>

						<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
							<label className="grid gap-1.5">
								<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bacteria</span>
								<SearchableCombobox
									value={activeRow.bacteriaName}
									options={bacteriaSelectOptions}
									placeholder="Select or search bacteria"
									emptyLabel="No bacteria found."
									onSelect={updateBacteriaForAll}
								/>
								<span className="text-[11px] font-medium text-slate-500">Applied to all detected samples on this petri dish.</span>
							</label>

							<label className="grid gap-1.5 sm:col-span-2">
								<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Antibiotic</span>
								<SearchableCombobox
									value={activeRow.antibiotic}
									options={antibioticSelectOptions}
									placeholder="Select or search antibiotic"
									emptyLabel="No antibiotic found."
									onSelect={(value) => updateActiveRow('antibiotic', value)}
								/>
							</label>

							<label className="grid gap-1.5">
								<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Result</span>
								<select
									value={activeRow.result}
									onChange={(event) => updateActiveRow('result', event.target.value as ResistanceResult | '')}
									className="bio-report-form-select h-10 w-full"
								>
									<option value="">Select</option>
									{RESULT_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</label>

							<label className="grid gap-1.5">
								<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action Date</span>
								<Input
									type="date"
									value={activeRow.actionDate}
									onChange={(event) => updateActionDateForAll(event.target.value)}
									className="h-10 w-full"
								/>
								<span className="text-[11px] font-medium text-slate-500">Applied to all AB disks from this petri dish.</span>
							</label>
						</div>

						<div className="bio-report-chooser-list">
							{rows.map((row, index) => {
								const rowResultInfo = getResultInfo(row.result);
								const isActive = index === activeRowIndex;
								return (
									<button
										type="button"
										key={row.id}
										onClick={() => setActiveRowIndex(index)}
										className={`bio-report-chooser-card ${isActive ? 'is-active' : ''}`}
										aria-label={`Go to ${getAntibioticTitle(row.antibiotic)}`}
									>
										<span className="bio-report-chooser-title">{getAntibioticTitle(row.antibiotic)}</span>
										<span className="bio-report-chooser-meta">AB disk {index + 1} of {rows.length} • {formatDiameter(row.diameter)} • {rowResultInfo.label}</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				<div
					className="bio-org-profile-actions"
					style={{ paddingBottom: 'max(1.35rem, calc(env(safe-area-inset-bottom, 0px) + 1.45rem))' }}
				>
					<Button
						variant="outline"
						className="bio-org-profile-cancel"
						onClick={onBack}
					>
						Kembali
					</Button>

					<Button
						className="bio-org-profile-confirm"
						onClick={handleConfirm}
						disabled={!isReportNameValid}
					>
						Confirm
					</Button>
				</div>
			</div>
		</div>
	);
}