import type { AnalysisData } from '../App';

export const getSampleDisplayLabel = (index: number) => {
	return `Sample ${Math.max(1, Math.floor(index) + 1)}`;
};

export const getAnalysisGroupKey = (analysis: AnalysisData) => {
	if (analysis.reportGroupId) return `report:${analysis.reportGroupId}`;

	const imageKey = analysis.processedImage || analysis.originalImage || '';
	if (!imageKey) return `analysis:${analysis.id}`;
	return `image:${imageKey}`;
};

export const getMeasurementSortIndex = (analysis: AnalysisData) => {
	const value = analysis.measurements?.[0]?.index;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export const getNumericIdParts = (id: string) => {
	const matches = String(id || '').match(/\d+/g);
	return matches ? matches.map((item) => Number(item)).filter(Number.isFinite) : [];
};

export const compareAnalysesBySampleOrder = (left: AnalysisData, right: AnalysisData) => {
	const leftMeasurementIndex = getMeasurementSortIndex(left);
	const rightMeasurementIndex = getMeasurementSortIndex(right);
	if (leftMeasurementIndex !== null && rightMeasurementIndex !== null && leftMeasurementIndex !== rightMeasurementIndex) {
		return leftMeasurementIndex - rightMeasurementIndex;
	}

	const leftParts = getNumericIdParts(left.id);
	const rightParts = getNumericIdParts(right.id);
	const maxLength = Math.max(leftParts.length, rightParts.length);
	for (let index = 0; index < maxLength; index += 1) {
		const leftPart = leftParts[index] ?? -1;
		const rightPart = rightParts[index] ?? -1;
		if (leftPart !== rightPart) return leftPart - rightPart;
	}

	return String(left.id).localeCompare(String(right.id));
};