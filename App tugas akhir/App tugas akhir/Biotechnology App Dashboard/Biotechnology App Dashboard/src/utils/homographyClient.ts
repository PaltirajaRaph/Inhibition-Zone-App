import { Capacitor } from '@capacitor/core';

const DEFAULT_WEB_HOMOGRAPHY_BASE = 'http://localhost:8000';
const DEFAULT_ANDROID_HOMOGRAPHY_BASES = ['http://10.0.2.2:8000', 'http://10.0.3.2:8000'];
const REQUEST_TIMEOUT_MS = 15000;
const REQUEST_TIMEOUT_ANDROID_MS = 120000;
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const HOMOGRAPHY_BASE_KEY = 'biotech.homography_api_base';
const HOMOGRAPHY_FALLBACKS_KEY = 'biotech.homography_api_fallbacks';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const parseBases = (value?: string) => {
	if (!value) return [] as string[];
	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.map(trimTrailingSlash);
};

const deriveHomographyBaseFromApiBase = (apiBase: string) => {
	const trimmed = apiBase.trim();
	if (!trimmed) return null;

	try {
		const url = new URL(trimmed);
		return trimTrailingSlash(`${url.protocol}//${url.hostname}:8000`);
	} catch {
		return null;
	}
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

const getWebDefault = () => {
	if (typeof window === 'undefined') return DEFAULT_WEB_HOMOGRAPHY_BASE;
	const hostname = window.location.hostname;
	if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
		return DEFAULT_WEB_HOMOGRAPHY_BASE;
	}
	return `http://${hostname}:8000`;
};

const getCandidates = () => {
	const localBase = readLocalOverride(HOMOGRAPHY_BASE_KEY).trim();
	const localFallbacks = parseBases(readLocalOverride(HOMOGRAPHY_FALLBACKS_KEY));
	const envBase = (import.meta.env.VITE_HOMOGRAPHY_API_BASE_URL as string | undefined)?.trim() || '';
	const envFallbacks = parseBases(import.meta.env.VITE_HOMOGRAPHY_API_BASE_URL_FALLBACKS as string | undefined);
	const envAndroidBase = (import.meta.env.VITE_ANDROID_HOMOGRAPHY_API_BASE_URL as string | undefined)?.trim() || '';
	const envAndroidFallbacks = parseBases(
		import.meta.env.VITE_ANDROID_HOMOGRAPHY_API_BASE_URL_FALLBACKS as string | undefined,
	);
	const envPublicApiBase = (import.meta.env.VITE_PUBLIC_API_BASE_URL as string | undefined)?.trim() || '';
	const envPublicApiFallbacks = parseBases(
		import.meta.env.VITE_PUBLIC_API_BASE_URL_FALLBACKS as string | undefined,
	);
	const envAndroidApiBase = (import.meta.env.VITE_ANDROID_API_BASE_URL as string | undefined)?.trim() || '';
	const envAndroidApiFallbacks = parseBases(
		import.meta.env.VITE_ANDROID_API_BASE_URL_FALLBACKS as string | undefined,
	);

	const derivedFromApiBases = unique(
		[
			envPublicApiBase,
			envAndroidApiBase,
			...envPublicApiFallbacks,
			...envAndroidApiFallbacks,
		]
			.map((base) => deriveHomographyBaseFromApiBase(base))
			.filter((base): base is string => Boolean(base)),
	);

	const normalizedLocalBase = localBase ? trimTrailingSlash(localBase) : null;
	const normalizedMain = envBase ? trimTrailingSlash(envBase) : null;
	const normalizedAndroidMain = envAndroidBase ? trimTrailingSlash(envAndroidBase) : null;

	if (Capacitor.getPlatform() === 'android') {
		const hasLanLikeTarget = [
			normalizedLocalBase,
			normalizedMain,
			normalizedAndroidMain,
			...localFallbacks,
			...envFallbacks,
			...envAndroidFallbacks,
			...derivedFromApiBases,
		].some((value) => {
			if (!value) return false;
			return /:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(value);
		});

		return unique([
			...(normalizedLocalBase ? [normalizedLocalBase] : []),
			...localFallbacks,
			...(normalizedMain ? [normalizedMain] : []),
			...(normalizedAndroidMain ? [normalizedAndroidMain] : []),
			...envFallbacks,
			...envAndroidFallbacks,
			...derivedFromApiBases,
			...(hasLanLikeTarget ? [] : DEFAULT_ANDROID_HOMOGRAPHY_BASES),
		]);
	}

	return unique([
		...(normalizedLocalBase ? [normalizedLocalBase] : []),
		...localFallbacks,
		...(normalizedMain ? [normalizedMain] : []),
		...envFallbacks,
		...derivedFromApiBases,
		getWebDefault(),
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

const blobToDataUrl = (blob: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Failed to read image result'));
		reader.onload = () => resolve(String(reader.result || ''));
		reader.readAsDataURL(blob);
	});

const loadImageElement = (blob: Blob) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const objectUrl = URL.createObjectURL(blob);
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(objectUrl);
			resolve(image);
		};
		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error('Failed to decode image for compression'));
		};
		image.src = objectUrl;
	});

const compressLargeImageBlob = async (blob: Blob) => {
	if (blob.size <= MAX_UPLOAD_SIZE_BYTES) return blob;

	if (typeof document === 'undefined') return blob;

	try {
		const image = await loadImageElement(blob);
		const longest = Math.max(image.width, image.height) || 1;
		const scale = Math.min(1, MAX_IMAGE_DIMENSION / longest);
		const targetWidth = Math.max(1, Math.round(image.width * scale));
		const targetHeight = Math.max(1, Math.round(image.height * scale));

		const canvas = document.createElement('canvas');
		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) return blob;

		ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

		const compressed = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob((next) => resolve(next), 'image/jpeg', 0.85);
		});

		if (!compressed) return blob;
		return compressed.size < blob.size ? compressed : blob;
	} catch (error) {
		console.warn('Image compression skipped:', error);
		return blob;
	}
};

export const processImageViaHomography = async (imageSrcOrDataUrl: string) => {
	const candidates = getCandidates();
	if (candidates.length === 0) {
		throw new Error('Homography API base URL is not configured');
	}

	const imageResponse = await fetch(imageSrcOrDataUrl);
	if (!imageResponse.ok) {
		throw new Error('Failed to read captured image');
	}

	const originalBlob = await imageResponse.blob();
	const blob = await compressLargeImageBlob(originalBlob);
	const file = new File([blob], 'capture.jpg', { type: blob.type || 'image/jpeg' });

	let lastError: unknown = null;
	const failedBases: string[] = [];
	const timeoutMs =
		Capacitor.getPlatform() === 'android' ? REQUEST_TIMEOUT_ANDROID_MS : REQUEST_TIMEOUT_MS;

	const probeTimeoutMs = 2500;
	const healthyCandidates: string[] = [];
	for (const base of candidates) {
		try {
			const health = await fetchWithTimeout(`${base}/health`, { method: 'GET' }, probeTimeoutMs);
			if (health.ok) healthyCandidates.push(base);
		} catch {
			// ignore probe errors and let main request flow handle fallback
		}
	}

	const orderedCandidates = unique([
		...healthyCandidates,
		...candidates,
	]);

	for (const base of orderedCandidates) {
		try {
			const form = new FormData();
			form.append('file', file);

			const res = await fetchWithTimeout(`${base}/homography?format=jpg`, { method: 'POST', body: form }, timeoutMs);
			if (!res.ok) {
				failedBases.push(`${base} (HTTP ${res.status})`);
				lastError = new Error(`HTTP ${res.status}`);
				continue;
			}

			const outBlob = await res.blob();
			return await blobToDataUrl(outBlob);
		} catch (error) {
			failedBases.push(base);
			lastError = error;
		}
	}

	const reason = lastError instanceof Error ? lastError.message : 'Unknown error';
	const tried = failedBases.length > 0 ? ` Tried: ${failedBases.join(', ')}` : '';
	throw new Error(`Homography request failed: ${reason}.${tried}`);
};
