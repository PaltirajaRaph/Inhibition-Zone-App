export const ANALYSIS_IMAGE_MAX_DIMENSION = 1280;
export const ANALYSIS_IMAGE_MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const ANALYSIS_IMAGE_JPEG_QUALITY = 0.84;

export const blobToDataUrl = (blob: Blob) =>
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

export const resizeImageBlobForAnalysis = async (
	blob: Blob,
	options?: {
		maxDimension?: number;
		maxBytes?: number;
		quality?: number;
	},
) => {
	if (typeof document === 'undefined') return blob;

	const maxDimension = options?.maxDimension ?? ANALYSIS_IMAGE_MAX_DIMENSION;
	const maxBytes = options?.maxBytes ?? ANALYSIS_IMAGE_MAX_UPLOAD_BYTES;
	const quality = options?.quality ?? ANALYSIS_IMAGE_JPEG_QUALITY;

	try {
		const image = await loadImageElement(blob);
		const longest = Math.max(image.width, image.height) || 1;
		const shouldResize = longest > maxDimension;
		const shouldRecompress = blob.size > maxBytes;

		if (!shouldResize && !shouldRecompress) return blob;

		const scale = shouldResize ? Math.min(1, maxDimension / longest) : 1;
		const targetWidth = Math.max(1, Math.round(image.width * scale));
		const targetHeight = Math.max(1, Math.round(image.height * scale));

		const canvas = document.createElement('canvas');
		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) return blob;

		ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

		const compressed = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob((next) => resolve(next), 'image/jpeg', quality);
		});

		if (!compressed) return blob;
		return compressed.size < blob.size || shouldResize ? compressed : blob;
	} catch (error) {
		console.warn('Image resize skipped:', error);
		return blob;
	}
};

export const imageSourceToAnalysisBlob = async (imageSrcOrDataUrl: string) => {
	const imageResponse = await fetch(imageSrcOrDataUrl);
	if (!imageResponse.ok) {
		throw new Error('Failed to read captured image');
	}

	const originalBlob = await imageResponse.blob();
	return resizeImageBlobForAnalysis(originalBlob);
};

export const imageSourceToAnalysisDataUrl = async (imageSrcOrDataUrl: string) => {
	const blob = await imageSourceToAnalysisBlob(imageSrcOrDataUrl);
	return blobToDataUrl(blob);
};