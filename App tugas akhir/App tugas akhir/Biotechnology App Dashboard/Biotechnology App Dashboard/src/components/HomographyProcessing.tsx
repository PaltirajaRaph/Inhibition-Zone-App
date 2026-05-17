import { RefreshCw } from 'lucide-react';

export default function HomographyProcessing() {
  return (
    <div className="bio-member-shell bio-processing-shell">
      <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
      <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

      <div className="bio-processing-panel">
        <div className="bio-processing-modal">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Processing image...</p>
        </div>
      </div>
    </div>
  );
}
