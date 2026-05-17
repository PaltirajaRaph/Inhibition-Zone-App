import { useEffect, useState } from 'react';
import { Microscope } from 'lucide-react';
import { Progress } from './ui/progress';
import type { AnalysisData } from '../App';

interface LoadingScreenProps {
  onComplete: (result: Partial<AnalysisData>) => void;
}

const loadingSteps = [
  { message: 'Mengoreksi sudut foto...', duration: 1500, progress: 20 },
  { message: 'Mendeteksi zona hambat...', duration: 2000, progress: 45 },
  { message: 'Mengukur diameter...', duration: 1500, progress: 70 },
  { message: 'Mengakses database...', duration: 1500, progress: 85 },
  { message: 'Menghasilkan laporan...', duration: 1000, progress: 100 }
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= loadingSteps.length) {
        
        const mockResults: Partial<AnalysisData> = {
          bacteriaName: 'E. coli',
          diameter: 12,
          antibiotic: 'Tetracycline',
          result: Math.random() > 0.5 ? 'RESISTEN' : 'RENTAN',
        };
        
        setTimeout(() => {
          onComplete(mockResults);
        }, 500);
        return;
      }

      const step = loadingSteps[stepIndex];
      setCurrentStep(stepIndex);
      
      
      const startProgress = stepIndex > 0 ? loadingSteps[stepIndex - 1].progress : 0;
      const endProgress = step.progress;
      const steps = 20;
      const increment = (endProgress - startProgress) / steps;
      let current = startProgress;

      progressInterval = setInterval(() => {
        current += increment;
        if (current >= endProgress) {
          setProgress(endProgress);
          clearInterval(progressInterval);
        } else {
          setProgress(Math.floor(current));
        }
      }, step.duration / steps);

      stepTimeout = setTimeout(() => {
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="bio-loading-shell">
      <div className="bio-loading-card">
        <div className="bio-loading-orb-wrap">
          <div className="bio-loading-orb">
            <Microscope className="w-10 h-10" />
          </div>
        </div>

        <div>
          <p className="bio-loading-brand">Antibiogram AI</p>
          <h2 className="bio-loading-title">Memproses Analisis</h2>
          <p className="bio-loading-subtitle">Mohon tunggu sebentar...</p>
        </div>

        <div>
          <Progress value={progress} className="h-2 mb-2" />
          <div className="bio-loading-progress-row">
            <span>Progres</span>
            <span className="bio-loading-progress-value">{progress}%</span>
          </div>
        </div>

        <div className="bio-loading-step-card">
          <span className="bio-loading-step-dot" />
          <div>
            <p className="bio-loading-step-message">
              {loadingSteps[currentStep]?.message}
            </p>
            <p className="bio-loading-step-meta">
              Langkah {currentStep + 1} dari {loadingSteps.length}
            </p>
          </div>
        </div>

        <div className="bio-loading-steps-list">
          {loadingSteps.map((step, index) => {
            const state =
              index < currentStep ? 'is-done' : index === currentStep ? 'is-active' : 'is-pending';
            return (
              <div
                key={index}
                className={`bio-loading-step-row ${index > currentStep ? 'is-pending' : ''}`}
              >
                <span className={`bio-loading-step-tick ${state}`}>
                  {index < currentStep && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <span>{step.message}</span>
              </div>
            );
          })}
        </div>

        <p className="bio-loading-step-meta" style={{ textAlign: 'center' }}>
          Algoritma homographic projection dan circle detection sedang bekerja
        </p>
      </div>
    </div>
  );
}
