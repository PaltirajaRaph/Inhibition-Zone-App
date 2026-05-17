import { ArrowLeft, FilePenLine, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { AnalysisData } from '../App';
import { compactReportId } from '../utils/analysisId';
import { getSampleDisplayLabel } from '../utils/sampleGrouping';

const createMockProcessedImage = (diameter?: number) => {
	const canvas = document.createElement('canvas');
	canvas.width = 400;
	canvas.height = 400;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, 400, 400);
		ctx.fillStyle = '#ffe5e5';
		ctx.beginPath();
		ctx.arc(200, 200, 150, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#ffcccc';
		ctx.beginPath();
		ctx.arc(200, 200, 60, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#00ff00';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(200, 200, 60, 0, Math.PI * 2);
		ctx.stroke();
		ctx.strokeStyle = '#ff0000';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(140, 200);
		ctx.lineTo(260, 200);
		ctx.stroke();
		ctx.fillStyle = '#000000';
		ctx.font = 'bold 16px Arial';
		ctx.fillText(`${diameter || 0} mm`, 210, 195);

		return canvas.toDataURL('image/png');
	}
	return '';
};

const formatReportDate = (value?: string) => {
	if (!value) return '-';
	const parts = value.split('-');
	if (parts.length !== 3) return value;
	const [a, b, c] = parts;
	if (a.length === 4) return `${c}-${b}-${a}`;
	return value;
};

const getEnglishResultInfo = (result?: string) => {
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

const getAntibioticTitle = (antibiotic?: string, fallback?: string) => {
	const value = antibiotic?.trim();
	if (value) return value;
	return fallback?.trim() || 'Antibiotic pending';
};

const getTextValue = (value?: string | null) => String(value || '').trim();

const firstTextValue = (items: AnalysisData[], getValue: (item: AnalysisData) => string | undefined | null) => {
	for (const item of items) {
		const value = getTextValue(getValue(item));
		if (value) return value;
	}
	return '';
};

const uniqueTextValues = (items: AnalysisData[], getValues: (item: AnalysisData) => Array<string | undefined | null>) => {
	const seen = new Set<string>();
	const output: string[] = [];
	for (const item of items) {
		for (const raw of getValues(item)) {
			const value = getTextValue(raw);
			const key = value.toLowerCase();
			if (!value || seen.has(key)) continue;
			seen.add(key);
			output.push(value);
		}
	}
	return output;
};

interface ReportProps {
	analysis: AnalysisData;
	relatedAnalyses?: AnalysisData[];
	onBack: () => void;
	onGoDashboard: () => void;
	onEdit: () => void;
	onEditSample?: (analysis: AnalysisData) => void;
	onDelete: (id: string) => void;
}

export default function Report({ analysis, relatedAnalyses = [analysis], onBack, onGoDashboard, onEdit, onEditSample, onDelete }: ReportProps) {
	const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);
	const reportItems = useMemo(() => {
		const byId = new Map<string, AnalysisData>();
		const items = relatedAnalyses.length > 0 ? relatedAnalyses : [analysis];
		for (const item of items) {
			if (!item?.id) continue;
			byId.set(item.id, item);
		}
		if (analysis?.id && !byId.has(analysis.id)) {
			byId.set(analysis.id, analysis);
		}
		return Array.from(byId.values());
	}, [analysis, relatedAnalyses]);

	const handleDelete = () => {
		onDelete(analysis.id);
	};

	const sampleRows = useMemo(() => {
		const groupedAnalyses = reportItems.length > 0 ? reportItems : [analysis];

		if (groupedAnalyses.length > 1) {
			return groupedAnalyses.map((item, index) => ({
				id: item.id,
				analysis: item,
				label: item.measurements?.[0]?.label || getSampleDisplayLabel(index),
				bacteriaName: item.bacteriaName,
				specimenType: item.specimenType,
				antibiotic: item.antibiotic || item.antibioticA,
				diameter: item.diameter,
				result: item.result,
			}));
		}

		if (analysis.measurements && analysis.measurements.length > 1) {
			return analysis.measurements.map((measurement, index) => ({
				id: measurement.id,
				analysis,
				label: measurement.label || getSampleDisplayLabel(index),
				bacteriaName: analysis.bacteriaName,
				specimenType: analysis.specimenType,
				antibiotic: analysis.antibiotic || analysis.antibioticA,
				diameter: measurement.diameterMm,
				result: analysis.result,
			}));
		}

		return [{
			id: analysis.id,
			analysis,
			label: analysis.measurements?.[0]?.label || 'Sample 1',
			bacteriaName: analysis.bacteriaName,
			specimenType: analysis.specimenType,
			antibiotic: analysis.antibiotic || analysis.antibioticA,
			diameter: analysis.diameter,
			result: analysis.result,
		}];
	}, [analysis, reportItems]);

	const reportDisplayId = compactReportId(
		firstTextValue(reportItems, (item) => item.reportDisplayId) || reportItems[0]?.id || analysis.id,
	);
	const reportName = firstTextValue(reportItems, (item) => item.reportName) || 'Untitled report';
	const reportSampleId = firstTextValue(reportItems, (item) => item.sampleId);
	const reportTags = uniqueTextValues(reportItems, (item) => item.tags || []);
	const reportNotes = firstTextValue(reportItems, (item) => item.notes);
	const reportTechnician = firstTextValue(reportItems, (item) => item.technician);
	const reportActionDate = firstTextValue(reportItems, (item) => item.actionDate) || analysis.actionDate || analysis.date;
	const reportCreatedDate = firstTextValue(reportItems, (item) => item.date) || analysis.date;
	const originalImageUrl = firstTextValue(reportItems, (item) => item.originalImage);
	const reportProcessedImage = firstTextValue(reportItems, (item) => item.processedImage);
	const primaryDiameter = sampleRows.find((row) => typeof row.diameter === 'number')?.diameter ?? analysis.diameter;

	const formatDiameter = (value?: number) => {
		return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(2)} mm` : '###';
	};

	const handleDownloadCsv = () => {
		const rows = [
			['sample', 'id', 'bacteriaName', 'specimenType', 'date', 'actionDate', 'status', 'diameter', 'antibiotic', 'result', 'notes', 'technician'],
			...sampleRows.map((row) => [
				row.label,
				row.id,
				row.bacteriaName || '',
				row.specimenType || '',
				reportCreatedDate || '',
				reportActionDate || '',
				analysis.status || '',
				String(row.diameter ?? ''),
				row.antibiotic || '',
				row.result || '',
				reportNotes || '',
				reportTechnician || '',
			]),
		];
		const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `report-${reportDisplayId}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	const processedImageUrl = useMemo(
		() => reportProcessedImage || createMockProcessedImage(primaryDiameter),
		[reportProcessedImage, primaryDiameter],
	);

	return (
		<div
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
						<h1 className="bio-admin-title bio-org-profile-title">Report Detail</h1>
						<p className="bio-admin-subtitle">Hasil analisis untuk sample yang telah diproses.</p>
					</div>
				</div>

				<div className="bio-admin-section">
					<p className="bio-org-profile-label">Report Info</p>
					<p className="text-slate-700 text-sm font-semibold">Report Name: {reportName}</p>
					<p className="text-slate-700 text-sm font-semibold">Report ID: {reportDisplayId}</p>
					<p className="text-slate-700 text-sm">Sample ID: {reportSampleId || '-'}</p>
					<p className="text-slate-700 text-sm">Action date: {formatReportDate(reportActionDate)}</p>
					<p className="text-slate-700 text-sm">Report created: {formatReportDate(reportCreatedDate)}</p>
					<p className="text-slate-700 text-sm">Organization Member: {reportTechnician || '-'}</p>
					<p className="text-slate-700 text-sm">Tags: {reportTags.length > 0 ? reportTags.join(', ') : '-'}</p>
					<p className="text-slate-700 text-sm">Notes: {reportNotes || '-'}</p>
				</div>

				<div className="bio-admin-section">
					<p className="bio-org-profile-label">Image Comparison</p>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<p className="text-slate-600 text-xs mb-2">Original Photo</p>
							<button
								type="button"
								className="bio-report-image-button aspect-square bg-gray-100 rounded-lg overflow-hidden border border-slate-200/70"
								onClick={() => originalImageUrl && setPreviewImage({ src: originalImageUrl, label: 'Original Photo' })}
								disabled={!originalImageUrl}
							>
								{originalImageUrl ? (
									<ImageWithFallback
										src={originalImageUrl}
										alt="Original"
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400">
										No Image
									</div>
								)}
							</button>
						</div>

						<div>
							<p className="text-slate-600 text-xs mb-2">Detection Result</p>
							<button
								type="button"
								className="bio-report-image-button aspect-square bg-gray-100 rounded-lg overflow-hidden border border-slate-200/70"
								onClick={() => processedImageUrl && setPreviewImage({ src: processedImageUrl, label: 'Detection Result' })}
								disabled={!processedImageUrl}
							>
								<ImageWithFallback
									src={processedImageUrl}
									alt="Processed"
									className="w-full h-full object-cover"
								/>
							</button>
						</div>
					</div>
				</div>

				<div className="bio-admin-section">
					<p className="bio-org-profile-label">Detail</p>
					<div className="bio-report-sample-list">
						{sampleRows.map((sample) => {
							const resultInfo = getEnglishResultInfo(sample.result);
							return (
								<button
									type="button"
									key={sample.id}
									className="bio-report-sample-card bio-report-sample-card-editable"
									onClick={() => onEditSample?.(sample.analysis)}
								>
									<div className="bio-report-sample-head">
										<div className="bio-report-sample-copy">
											<p className="bio-report-sample-title">{getAntibioticTitle(sample.antibiotic)}</p>
											<p className="bio-report-sample-subtitle">{sample.bacteriaName?.trim() || 'Bacteria pending'}</p>
										</div>
										<span className={`bio-report-result-pill ${resultInfo.toneClass}`}>{resultInfo.label}</span>
									</div>
									<div className="bio-report-sample-metrics">
										<p className="bio-report-sample-metric"><span>Inhibition Zone</span>{formatDiameter(sample.diameter)}</p>
										<p className="bio-report-sample-metric"><span>SIR</span>{resultInfo.label}</p>
									</div>
								</button>
							);
						})}
					</div>
				</div>

				<div
					className="bio-org-profile-actions"
					style={{ paddingBottom: 'max(1.35rem, calc(env(safe-area-inset-bottom, 0px) + 1.45rem))' }}
				>
					<Button variant="outline" className="w-full" onClick={onGoDashboard}>
						Go to Dashboard
					</Button>
					<Button variant="secondary" className="w-full" onClick={onEdit}>
						<FilePenLine className="h-4 w-4" />
						Edit
					</Button>
					<Button variant="outline" className="w-full" onClick={handleDownloadCsv}>
						Download as CSV/Excel
					</Button>
					<Button variant="destructive" className="w-full" onClick={handleDelete}>
						Delete
					</Button>
				</div>
			</div>

			{previewImage && (
				<div className="bio-report-image-viewer" role="dialog" aria-modal="true" aria-label={previewImage.label}>
					<div className="bio-report-image-viewer-header">
						<p>{previewImage.label}</p>
						<button type="button" onClick={() => setPreviewImage(null)} aria-label="Close image viewer">
							<X className="h-5 w-5" />
						</button>
					</div>
					<ImageWithFallback src={previewImage.src} alt={previewImage.label} className="bio-report-image-viewer-img" />
				</div>
			)}
		</div>
	);
}
