import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('ErrorBoundary caught:', error, info);
	}

	private handleReload = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback ?? (
					<div
						style={{
							minHeight: '100dvh',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '1.5rem',
							background: '#f8fafc',
						}}
					>
						<div
							style={{
								maxWidth: '28rem',
								width: '100%',
								background: '#ffffff',
								border: '1px solid #fecaca',
								borderRadius: '0.75rem',
								padding: '1.25rem',
								boxShadow: '0 10px 25px -15px rgba(0,0,0,0.15)',
							}}
						>
							<p
								style={{
									fontSize: '0.75rem',
									fontWeight: 700,
									textTransform: 'uppercase',
									letterSpacing: '0.05em',
									color: '#b91c1c',
									marginBottom: '0.35rem',
								}}
							>
								Aplikasi mengalami error
							</p>
							<h2
								style={{
									fontSize: '1.05rem',
									fontWeight: 700,
									color: '#0f172a',
									marginBottom: '0.5rem',
								}}
							>
								Layar ini gagal dirender
							</h2>
							<p
								style={{
									fontSize: '0.85rem',
									color: '#475569',
									marginBottom: '0.75rem',
									lineHeight: 1.5,
								}}
							>
								{this.state.error?.message || 'Terjadi kesalahan tidak terduga.'}
							</p>
							<button
								type="button"
								onClick={this.handleReload}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '0.4rem',
									padding: '0.5rem 0.9rem',
									borderRadius: '9999px',
									background: 'linear-gradient(90deg, #14b8a6 0%, #0ea5b7 100%)',
									color: '#ffffff',
									fontWeight: 600,
									fontSize: '0.85rem',
									border: 'none',
									boxShadow: '0 6px 18px -8px rgba(14, 165, 183, 0.55)',
								}}
							>
								Coba lagi
							</button>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
