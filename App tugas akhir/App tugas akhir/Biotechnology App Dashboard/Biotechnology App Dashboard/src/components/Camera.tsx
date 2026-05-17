import { useState, useRef, useEffect, useCallback } from 'react';
import {
	Upload,
	ArrowLeft,
	AlertTriangle,
	RefreshCw,
	Camera as CameraIcon,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
	Camera as CapacitorCamera,
	CameraResultType,
	CameraSource,
	CameraDirection,
} from '@capacitor/camera';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Alert, AlertDescription } from './ui/alert';
import { CameraPermissions } from '../utils/CameraPermissions';
import { processImageViaHomography } from '../utils/homographyClient';

interface CameraProps {
	onPhotoTaken: (processedImage: string, originalImage?: string) => void;
	onBack: () => void;
	onStartProcessing?: () => void;
}

export default function Camera({ onPhotoTaken, onBack, onStartProcessing }: CameraProps) {
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [isInitializing, setIsInitializing] = useState(false);
	const [isProcessingHomography, setIsProcessingHomography] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [tiltAngleDeg, setTiltAngleDeg] = useState<number | null>(null);
	const [tiltStatus, setTiltStatus] = useState<'oke' | 'buruk'>('buruk');
	const [guideSize, setGuideSize] = useState(74);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const isNative = Capacitor.isNativePlatform();
	const videoRef = useRef<HTMLVideoElement>(null);
	const lastTiltUpdateRef = useRef(0);
	const guideSizeMin = 54;
	const guideSizeMax = 88;

	
	useEffect(() => {
		initializeCamera();
		return () => {
			cleanup();
		};
	}, []);

	useEffect(() => {
		if (cameraError || capturedImage || !isReady) return;

		const thresholdDeg = 15;

		const onOrientation = (event: DeviceOrientationEvent) => {
			if (event.beta == null || event.gamma == null) return;

			const now = Date.now();
			if (now - lastTiltUpdateRef.current < 100) return;
			lastTiltUpdateRef.current = now;

			const pitch = event.beta; // front-back tilt
			const roll = event.gamma; // left-right tilt
			const angle = Math.sqrt(pitch * pitch + roll * roll);

			setTiltAngleDeg(angle);
			setTiltStatus(angle <= thresholdDeg ? 'oke' : 'buruk');
		};

		window.addEventListener('deviceorientation', onOrientation);
		return () => {
			window.removeEventListener('deviceorientation', onOrientation);
		};
	}, [cameraError, capturedImage, isReady]);

	const cleanup = async () => {
		try {
			if (videoRef.current && videoRef.current.srcObject) {
				const stream = videoRef.current.srcObject as MediaStream;
				stream.getTracks().forEach((track) => track.stop());
			}
		} catch (error) {
			console.error('Cleanup error:', error);
		}
	};

	const initializeCamera = async () => {
		setIsInitializing(true);
		setCameraError(null);

		try {
			
			const hasPermission = await CameraPermissions.checkAndRequest();
			if (!hasPermission) {
				setCameraError('Izin kamera diperlukan');
				setIsInitializing(false);
				return;
			}

			
			if (!isNative && videoRef.current) {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({
						video: { facingMode: 'environment' },
						audio: false,
					});
					videoRef.current.srcObject = stream;
					setIsReady(true);
				} catch (error) {
					console.warn('getUserMedia failed:', error);
					
					setIsReady(true);
				}
			} else {
				
				setIsReady(true);
			}

			toast.success('Kamera Siap', {
				description: 'Kamera sudah diinisialisasi',
			});
		} catch (error) {
			console.error('Camera initialization failed:', error);
			setCameraError(`Inisialisasi gagal: ${(error as Error).message}`);
		} finally {
			setIsInitializing(false);
		}
	};

	const handleCapture = async () => {
		if (!isReady) {
			toast.error('Kamera Belum Siap', {
				description: 'Tunggu kamera selesai diinisialisasi',
			});
			return;
		}

		if (tiltStatus !== 'oke') {
			toast.error('Sudut Belum Oke', {
				description: 'Perbaiki kemiringan (maks. 15°) untuk mengambil gambar',
			});
			return;
		}

		try {
			setIsInitializing(true);

			const image = await CapacitorCamera.getPhoto({
				quality: 72,
				allowEditing: false,
				resultType: CameraResultType.DataUrl,
				source: CameraSource.Camera,
				direction: CameraDirection.Rear,
				presentationStyle: 'fullscreen' as any,
				correctOrientation: true,
				width: 820,
				height: 820,
			});

			if (image.dataUrl) {
				setCapturedImage(image.dataUrl);
			} else {
				throw new Error('Tidak ada data gambar');
			}
		} catch (error: any) {
			if (error.message && error.message.includes('User cancelled')) {
				// User cancelled, ignore
				console.log('User cancelled camera');
			} else {
				console.error('Capture failed:', error);
				toast.error('Gagal Mengambil Foto', {
					description: 'Silakan coba gunakan galeri',
				});
			}
		} finally {
			setIsInitializing(false);
		}
	};

	const handleGalleryPick = async () => {
		if (isInitializing || isProcessingHomography) return;

		try {
			const image = await CapacitorCamera.getPhoto({
				quality: 70,
				allowEditing: false,
				resultType: CameraResultType.DataUrl,
				source: CameraSource.Photos,
				width: 820,
				height: 820,
				correctOrientation: true,
				presentationStyle: 'fullscreen' as any,
			});

			if (image.dataUrl) {
				setCapturedImage(image.dataUrl);
				toast.success('Gambar Dipilih', {
					description: 'Gambar dari galeri berhasil dipilih',
				});
			}
		} catch (error: any) {
			if (error.message && error.message.includes('User cancelled')) {
				console.log('User cancelled gallery');
			} else {
				console.error('Gallery selection failed:', error);
				// Fallback to file input for web
				if (!isNative) {
					fileInputRef.current?.click();
				} else {
					toast.error('Gagal Membuka Galeri', {
						description: 'Tidak dapat mengakses galeri',
					});
				}
			}
		}
	};

	const handleGuideSizeChange = (nextSize: number) => {
		setGuideSize(Math.min(guideSizeMax, Math.max(guideSizeMin, nextSize)));
	};

	const handleRetry = async () => {
		setCameraError(null);
		await initializeCamera();
	};

	const handleRetake = () => {
		setCapturedImage(null);
		setIsReady(true);
	};

	const handleBack = useCallback(async () => {
		if (isProcessingHomography) return;
		if (capturedImage) {
			setCapturedImage(null);
			return;
		}
		await cleanup();
		onBack();
	}, [capturedImage, isProcessingHomography, onBack]);

	const handleConfirm = async () => {
		if (!capturedImage || isProcessingHomography) return;

		setIsProcessingHomography(true);
		if (typeof onStartProcessing === 'function') onStartProcessing();
		try {
			const processed = await processImageViaHomography(capturedImage);
			onPhotoTaken(processed, capturedImage);
		} catch (error) {
			console.error('Homography processing failed:', error);
			toast.error('Homografi gagal', {
				description: 'Homografi gagal. Kembali ke workspace.',
			});
			// Do not create a report when homography fails. Return to previous view (member workspace)
			if (typeof onBack === 'function') {
				onBack();
			}
		} finally {
			setIsProcessingHomography(false);
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const imageData = event.target?.result as string;
				setCapturedImage(imageData);
			};
			reader.readAsDataURL(file);
		}
	};

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
						onClick={handleBack}
						aria-label="Back to member dashboard"
					>
						<ArrowLeft className="w-5 h-5" />
					</Button>

					<div>
						<p className="bio-admin-kicker">Sample Capture</p>
						<h1 className="bio-admin-title bio-org-profile-title">Manage Sample Capture</h1>
						<p className="bio-admin-subtitle">Ambil atau pilih gambar sampel untuk memulai analisis.</p>
					</div>

					<Button
						variant="outline"
						size="sm"
						className="bio-camera-gallery-btn"
						onClick={handleGalleryPick}
						disabled={isInitializing || isProcessingHomography}
						aria-label="Choose image from gallery"
					>
						<Upload className="w-4 h-4 mr-2" />
						Galeri
					</Button>
			</div>

				<div className="bio-admin-section bio-org-profile-name-card">
					<p className="bio-org-profile-label">Preview Sample</p>
					<div className="relative h-[46dvh] min-h-[16rem] max-h-[26rem] w-full rounded-xl overflow-hidden bg-gray-900 border border-slate-200/70">
						{cameraError ? (
							<div className="p-6 text-center max-w-sm mx-auto">
								<Alert variant="destructive" className="mb-4">
									<AlertTriangle className="h-4 w-4" />
									<AlertDescription>{cameraError}</AlertDescription>
								</Alert>

								<div className="space-y-3">
									<Button
										variant="outline"
										onClick={() => CameraPermissions.showPermissionInstructions()}
										className="w-full"
									>
										<AlertTriangle className="w-4 h-4 mr-2" />
										Bantuan Izin
									</Button>

									<Button
										variant="outline"
										onClick={handleRetry}
										className="w-full"
										disabled={isInitializing}
									>
										<RefreshCw className={`w-4 h-4 mr-2 ${isInitializing ? 'animate-spin' : ''}`} />
										{isInitializing ? 'Mencoba Ulang...' : 'Coba Lagi'}
									</Button>
								</div>
							</div>
						) : !capturedImage ? (
							<>
								<div
									className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white pointer-events-none"
									aria-live="polite"
								>
									{tiltAngleDeg == null ? 'Kemiringan: —' : `Kemiringan: ${tiltAngleDeg.toFixed(1)}°`} · {tiltStatus}
								</div>

								<div className="absolute inset-0 z-[6] flex items-center justify-center pointer-events-none">
									<div
										className="bio-camera-guide-circle"
										style={{ width: `${guideSize}%`, height: `${guideSize}%` }}
										aria-hidden="true"
									/>
								</div>

								{!isNative && (
									<video
										ref={videoRef}
										autoPlay
										playsInline
										className="absolute inset-0 w-full h-full object-cover"
									/>
								)}

								{isNative && <div id="camera-preview" className="absolute inset-0 w-full h-full bg-black" />}

								<div className="absolute inset-0 bg-black/35" aria-hidden="true" />
							</>
						) : (
							<ImageWithFallback
								src={capturedImage}
								alt="Captured"
								className="max-w-full max-h-full object-contain"
							/>
						)}

						{(isInitializing || isProcessingHomography) && (
							<div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
								<div className="text-center text-white">
									<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
									<p>{isProcessingHomography ? 'Memproses Homografi...' : 'Menginisialisasi Kamera...'}</p>
								</div>
							</div>
						)}
					</div>

							<div className="bio-camera-guide-panel">
								<div className="bio-camera-guide-row">
									<div>
										<p className="bio-camera-guide-label">Ukuran lingkaran</p>
										<p className="bio-camera-guide-caption">Sesuaikan lingkaran dengan cawan petri.</p>
									</div>
									<div className="bio-camera-guide-value">{Math.round(guideSize)}%</div>
								</div>
								<input
									type="range"
									min={guideSizeMin}
									max={guideSizeMax}
									step={1}
									value={guideSize}
									onChange={(event) => handleGuideSizeChange(Number(event.target.value))}
									className="bio-camera-guide-slider"
									aria-label="Adjust petri dish guide size"
								/>
							</div>
				</div>

			{!cameraError && !capturedImage && (
				<div className="bio-org-profile-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
					<Button
						className="bio-org-profile-confirm flex-1"
						onClick={handleCapture}
						disabled={isInitializing || tiltStatus !== 'oke'}
					>
						<CameraIcon className="w-4 h-4 mr-2" />
						Ambil Gambar
					</Button>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleFileUpload}
					/>
				</div>
			)}

			{!cameraError && capturedImage && (
				<div
					className="bio-org-profile-actions"
					style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1.05rem))' }}
				>
						<Button
							variant="outline"
							className="bio-org-profile-cancel"
							onClick={handleRetake}
							disabled={isProcessingHomography}
						>
							Ambil Ulang
						</Button>

						<Button
							className="bio-org-profile-confirm"
							onClick={handleConfirm}
							disabled={isProcessingHomography}
						>
							Gunakan Foto
						</Button>
				</div>
			)}
			</div>
		</div>
	);
}
