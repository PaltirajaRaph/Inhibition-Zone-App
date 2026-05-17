import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CreateOrganizationNameProps {
  onBack: () => void;
  onAddOrganization: (organizationName: string) => void;
}

export default function CreateOrganizationName({
  onBack,
  onAddOrganization,
}: CreateOrganizationNameProps) {
  const [name, setName] = useState('');
  const isNameValid = name.trim().length > 0;

  return (
    <div className="bio-login-shell bio-auth-shell">
      <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
      <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

      <div className="bio-auth-panel">
        <div className="bio-auth-header">
          <Button variant="ghost" onClick={onBack} className="bio-auth-back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="bio-auth-step">Step 1 of 4</p>
            <h2 className="bio-auth-title">Create Organization</h2>
          </div>
        </div>

        <p className="bio-auth-subtitle">
          Tentukan nama institusi atau laboratorium yang akan digunakan sebagai workspace utama.
        </p>

        <div className="bio-auth-form">
          <label className="bio-auth-label">Organization Name</label>
          <Input
            placeholder="Contoh: RS Harapan Medika"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bio-auth-input"
          />

          <div className="bio-auth-actions">
            <Button
              className="bio-auth-primary"
              onClick={() => onAddOrganization(name.trim())}
              disabled={!isNameValid}
            >
              Lanjutkan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}