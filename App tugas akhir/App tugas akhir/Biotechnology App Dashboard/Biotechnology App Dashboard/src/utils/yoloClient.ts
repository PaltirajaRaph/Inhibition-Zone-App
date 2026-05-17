import { Capacitor } from '@capacitor/core';

const DEFAULT_WEB_YOLO_BASE = 'http://localhost:9000';
const DEFAULT_ANDROID_YOLO_BASES = ['http://10.0.2.2:9000', 'http://10.0.3.2:9000'];
const REQUEST_TIMEOUT_MS = 20000;
const YOLO_BASE_KEY = 'biotech.yolo_api_base';
const YOLO_FALLBACKS_KEY = 'biotech.yolo_api_fallbacks';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const parseBases = (value?: string) => {
	if (!value) return [] as string[];
	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.map(trimTrailingSlash);
};

const readLocalOverride = (key: string) => {
	if (typeof window === 'undefined') return '';
	try {
		return localStorage.getItem(key) || '';
	} catch (error) {
		console.error('Failed to read localStorage:', error);
		return '';
	}
};

const unique = (items: string[]) => {
	const seen = new Set<string>();
	const output: string[] = [];
	for (const item of items) {
		const normalized = trimTrailingSlash(item);
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		output.push(normalized);
	}
	return output;
};

const getCandidates = () => {
	const localBase = readLocalOverride(YOLO_BASE_KEY).trim();
	const localFallbacks = parseBases(readLocalOverride(YOLO_FALLBACKS_KEY));
	const envPublicBase = (import.meta.env.VITE_PUBLIC_YOLO_API_BASE_URL as string | undefined)?.trim() || '';
	const envPublicFallbacks = parseBases(
		import.meta.env.VITE_PUBLIC_YOLO_API_BASE_URL_FALLBACKS as string | undefined,
	);
	const envAndroidBase = (import.meta.env.VITE_ANDROID_YOLO_API_BASE_URL as string | undefined)?.trim() || '';
	const envAndroidFallbacks = parseBases(
		import.meta.env.VITE_ANDROID_YOLO_API_BASE_URL_FALLBACKS as string | undefined,
	);

	const normalizedLocalBase = localBase ? trimTrailingSlash(localBase) : null;
	const normalizedPublicMain = envPublicBase ? trimTrailingSlash(envPublicBase) : null;
	const normalizedAndroidMain = envAndroidBase ? trimTrailingSlash(envAndroidBase) : null;

	if (Capacitor.getPlatform() === 'android') {
		return unique([
			...(normalizedLocalBase ? [normalizedLocalBase] : []),
			...localFallbacks,
			...(normalizedPublicMain ? [normalizedPublicMain] : []),
			...(normalizedAndroidMain ? [normalizedAndroidMain] : []),
			...envPublicFallbacks,
			...envAndroidFallbacks,
			...DEFAULT_ANDROID_YOLO_BASES,
		]);
	}

	return unique([
		...(normalizedLocalBase ? [normalizedLocalBase] : []),
		...localFallbacks,
		...(normalizedPublicMain ? [normalizedPublicMain] : []),
		...envPublicFallbacks,
		DEFAULT_WEB_YOLO_BASE,
	]);
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
	const controller = new AbortController();
	const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		window.clearTimeout(timeoutId);
	}
};

export interface YoloDetection {
	label: string;
	confidence: number;
	box: {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
		width: number;
		height: number;
		cx: number;
		cy: number;
	};
}

export interface YoloMeasurement {
	index: number;
	label: string;
	result?: string | null;
	diameterMm?: number | null;
	diskDiameterPx?: number | null;
	zoneDiameterPx?: number | null;
	scaleMmPerPx?: number | null;
	diskConfidence?: number | null;
	zoneConfidence?: number | null;
	diskBox?: YoloDetection['box'] | null;
	zoneBox?: YoloDetection['box'] | null;
}

export interface YoloAnalysisResponse {
	processedImage?: string | null;
	diameterMm?: number | null;
	diskDiameterPx?: number | null;
	zoneDiameterPx?: number | null;
	scaleMmPerPx?: number | null;
	zoneConfidence?: number | null;
	measurements?: YoloMeasurement[];
	detections?: YoloDetection[];
}

export interface YoloAnalyzeOptions {
	diskMm?: number;
	timeoutMs?: number;
}

export const analyzeImageViaYolo = async (
	imageSrcOrDataUrl: string,
	options?: YoloAnalyzeOptions,
): Promise<YoloAnalysisResponse> => {
	const candidates = getCandidates();
	if (candidates.length === 0) {
		throw new Error('YOLO API base URL is not configured');
	}

	const imageResponse = await fetch(imageSrcOrDataUrl);
	if (!imageResponse.ok) {
		throw new Error('Failed to read captured image');
	}

	const blob = await imageResponse.blob();
	const file = new File([blob], 'capture.jpg', { type: blob.type || 'image/jpeg' });

	let lastError: unknown = null;
	const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;

	for (const base of candidates) {
		try {
			const form = new FormData();
			form.append('file', file);
			if (options?.diskMm) {
				form.append('disk_mm', String(options.diskMm));
			}

			const res = await fetchWithTimeout(`${base}/yolo/analyze`, { method: 'POST', body: form }, timeoutMs);
			if (!res.ok) {
				lastError = new Error(`HTTP ${res.status} from ${base}`);
				continue;
			}

			const payload = await res.json();
			if (!payload?.success) {
				lastError = new Error(payload?.message || 'YOLO inference failed');
				continue;
			}

			return (payload?.data || {}) as YoloAnalysisResponse;
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError ?? new Error('YOLO request failed');
};
