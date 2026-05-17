import { Camera, History, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { AnalysisData } from '../App';
import { compareAnalysesBySampleOrder, getAnalysisGroupKey } from '../utils/sampleGrouping';

const STATUS_COLOR_MAP: Record<string, string> = {
  Complete: 'bio-analysis-status-success',
  Pending: 'bio-analysis-status-processing',
  Failed: 'bio-analysis-status-failed',
  Selesai: 'bio-analysis-status-success',
  Completed: 'bio-analysis-status-success',
  Gagal: 'bio-analysis-status-failed',
  Processing: 'bio-analysis-status-processing',
};

const getAnalysisDisplayDate = (analysis: AnalysisData) => {
  return analysis.actionDate || analysis.date;
};

interface DashboardProps {
  analyses: AnalysisData[];
  memberUsername: string;
  memberTeam: string;
  memberOrganization: string;
  onStartAnalysis: () => void;
  onViewHistory: () => void;
  onViewReport: (analysis: AnalysisData) => void;
  onViewSettings: () => void;
  onViewAntibiotics?: () => void;
  onViewAnalytics?: () => void;
  onLogout?: () => void;
}

export default function Dashboard({
  analyses,
  memberUsername,
  memberTeam,
  memberOrganization,
  onStartAnalysis,
  onViewHistory,
  onViewReport,
}: DashboardProps) {
  const recentAnalyses = useMemo(() => analyses.slice(0, 3), [analyses]);
  const groupDisplayDateByKey = useMemo(() => {
    const groups = new Map<string, AnalysisData[]>();
    for (const analysis of analyses) {
      const key = getAnalysisGroupKey(analysis);
      groups.set(key, [...(groups.get(key) || []), analysis]);
    }

    const dates = new Map<string, string>();
    for (const [key, group] of groups.entries()) {
      const first = group.slice().sort(compareAnalysesBySampleOrder)[0];
      dates.set(key, getAnalysisDisplayDate(first));
    }

    return dates;
  }, [analyses]);
  const safeMemberUsername = memberUsername || '';
  const safeMemberTeam = memberTeam || '';
  const safeMemberOrganization = memberOrganization || '';
  const memberNameText = safeMemberUsername.trim().length > 0 ? safeMemberUsername : 'Member';
  const memberInitials = memberNameText
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const getStatusColor = (status: string) => {
		return STATUS_COLOR_MAP[status] || 'bio-analysis-status-default';
  };

  return (
    <div className="bio-member-shell">
      <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
      <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

      <div className="bio-member-panel">
        <div className="bio-member-header">
          <div>
            <p className="bio-member-kicker">Member Workspace</p>
            <h1 className="bio-member-title">Antibiotic Resistance Intelligence</h1>
            <p className="bio-member-subtitle">Clinical analysis and report review for microbiology operations.</p>
          </div>
        </div>

        <div className="bio-member-profile">
          <div className="bio-member-avatar">{memberInitials || 'M'}</div>
          <div>
            <p className="bio-member-name">{memberNameText}</p>
            <p className="bio-member-meta">
              {safeMemberTeam || 'No Team'} • {safeMemberOrganization || 'No Organization'}
            </p>
          </div>
        </div>

        <div className="bio-member-section">
          <div className="bio-member-section-head">
            <h3 className="bio-member-section-title">Recent Analysis</h3>
            <Button variant="ghost" className="bio-member-see-all" onClick={onViewHistory}>
              <History className="w-4 h-4" />
              See All
            </Button>
          </div>

          <div className="bio-member-history-list">
            {recentAnalyses.length === 0 ? (
              <Card className="bio-member-empty">
                <p className="bio-member-empty-title">No analysis history</p>
                <p className="bio-member-empty-subtitle">Start your first analysis from the action card above.</p>
              </Card>
            ) : (
              recentAnalyses.map((analysis) => {
                const antibioticName = analysis.antibiotic || analysis.antibioticA || 'Antibiotic pending';
                const displayDate = groupDisplayDateByKey.get(getAnalysisGroupKey(analysis)) || getAnalysisDisplayDate(analysis);
                return (
                <Card
                  key={analysis.id}
                  className="bio-member-history-card bio-member-history-card-clickable"
                  onClick={() => onViewReport(analysis)}
                >
                  <div className="bio-member-history-row">
                    <div className="bio-member-history-meta">
                      <div className="bio-member-history-head">
                        <span className="bio-member-history-id">{antibioticName}</span>
                        <Badge className={getStatusColor(analysis.status)}>{analysis.status}</Badge>
                      </div>
                      <p className="bio-member-history-name">{(analysis.bacteriaName ?? '').trim()}</p>
                      <div className="bio-member-history-chips">
                        <span className="bio-member-history-chip">
                          {analysis.diameter ? `${analysis.diameter} mm` : 'Diameter -'}
                        </span>
                      </div>
                      <p className="bio-member-history-date">{displayDate}</p>
                    </div>
                    <div className="bio-member-history-arrow-wrap">
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                </Card>
                );
              })
            )}
          </div>
        </div>

        <Card className="bio-member-cta" onClick={onStartAnalysis}>
          <div className="bio-member-cta-row">
            <div className="bio-member-cta-icon">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h2 className="bio-member-cta-title">Start New Analysis</h2>
              <p className="bio-member-cta-subtitle">Capture sample image and run susceptibility workflow.</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
