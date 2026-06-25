const CLSI_DIAMETER_DECIMALS = 0;

const roundToDecimals = (value: number, decimals: number) => {
	const factor = 10 ** Math.max(0, Math.floor(decimals));
	return Math.round(value * factor) / factor;
};

export const normalizeDiameterMm = (value: unknown): number | undefined => {
	if (value === null || value === undefined) return undefined;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return undefined;
	return roundToDecimals(parsed, CLSI_DIAMETER_DECIMALS);
};

export const formatDiameterMm = (
	value: unknown,
	options?: { placeholder?: string; withUnit?: boolean },
) => {
	const normalized = normalizeDiameterMm(value);
	if (typeof normalized !== 'number') return options?.placeholder ?? '-';

	const numberText = CLSI_DIAMETER_DECIMALS > 0
		? normalized.toFixed(CLSI_DIAMETER_DECIMALS)
		: String(Math.round(normalized));

	if (options?.withUnit === false) return numberText;
	return `${numberText} mm`;
};
