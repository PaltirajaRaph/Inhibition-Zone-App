import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { AnalysisData } from '../App';

interface AnalysisDetailProps {
  analysis: AnalysisData;
}


const mapResult = (r?: string) => {
  switch (r) {
    case 'RESISTEN':
      return { label: 'Resistant', className: 'bg-red-100 text-red-700' };
    case 'RENTAN':
      return { label: 'Susceptible', className: 'bg-green-100 text-green-700' };
    case 'INTERMEDIAT':
      return { label: 'Intermediate', className: 'bg-yellow-100 text-yellow-700' };
    default:
      return { label: 'Unknown', className: 'bg-gray-100 text-gray-700' };
  }
};

export function AnalysisDetail({ analysis }: AnalysisDetailProps) {
  const primary = mapResult(analysis.result);
  const secondary = mapResult(analysis.secondaryResult);

  const antibioticA = analysis.antibioticA || analysis.antibiotic || '-';
  const antibioticADesc = analysis.antibioticADesc || 'No description yet.';
  const antibioticB = analysis.antibioticB || '-';
  const antibioticBDesc = analysis.antibioticBDesc || 'No description yet.';

  const summaryLines: string[] = [];
  if (analysis.bacteriaName) {
    summaryLines.push(`Bacteria: ${analysis.bacteriaName}`);
  }
  if (antibioticA && analysis.result) {
    summaryLines.push(`Response to ${antibioticA}: ${primary.label}.`);
  }
  if (antibioticB && analysis.secondaryResult) {
    summaryLines.push(`Response to ${antibioticB}: ${secondary.label}.`);
  }
  if (analysis.diameter) {
    summaryLines.push(`Measured inhibition zone diameter: ${analysis.diameter} mm.`);
  }
  if (summaryLines.length === 0) {
    summaryLines.push('Not enough data to build a summary.');
  }

  return (
    <Card className="p-6 bg-white shadow-md">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Analysis Details</h3>
            <p className="text-sm text-gray-600 mt-1">Antibiotic susceptibility test results</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-5 py-3 rounded-xl shadow-lg">
            <div className="text-xs font-medium opacity-90">TEST ID</div>
            <div className="text-xl font-bold">{analysis.id}</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Table 1: Antibiotic A */}
        <Card className="overflow-hidden border-2 border-emerald-200 shadow-xl">
          <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white drop-shadow-md">Antibiotic A</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center justify-center w-5 h-5 bg-white text-emerald-600 rounded-full text-xs font-bold shadow-md">
                      1
                    </span>
                    <p className="text-emerald-50 text-sm font-medium">Primary sensitivity data</p>
                  </div>
                </div>
              </div>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-white border border-white/30 shadow-lg">
                PRIMARY
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-4 bg-gradient-to-br from-white to-emerald-50/30">
            <div className="bg-white rounded-lg p-4 border-l-4 border-emerald-500 shadow-sm">
              <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Antibiotic</p>
              <p className="text-base font-bold text-gray-900">{antibioticA}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
              <p className="text-xs font-bold text-green-700 uppercase mb-2">Mechanism of action</p>
              <p className="text-sm text-gray-700 leading-relaxed">{antibioticADesc}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border-l-4 border-teal-500 shadow-sm">
              <p className="text-xs font-bold text-teal-700 uppercase mb-3">Interpretation</p>
              <Badge className={`${primary.className} font-bold px-4 py-2 text-sm shadow-md`}>
                {primary.label}
              </Badge>
            </div>
          </div>
          
          <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-100">
            <p className="text-xs text-emerald-700 font-medium">
              ℹ️ Primary sensitivity data for antibiotic A
            </p>
          </div>
        </Card>

        {/* Table 2: Antibiotic B */}
        <Card className="overflow-hidden border-2 border-purple-200 shadow-xl">
          <div className="bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white drop-shadow-md">Antibiotic B</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center justify-center w-5 h-5 bg-white text-purple-600 rounded-full text-xs font-bold shadow-md">
                      2
                    </span>
                    <p className="text-purple-50 text-sm font-medium">Supporting sensitivity data</p>
                  </div>
                </div>
              </div>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-white border border-white/30 shadow-lg">
                SECONDARY
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-4 bg-gradient-to-br from-white to-purple-50/30">
            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm">
              <p className="text-xs font-bold text-purple-700 uppercase mb-2">Antibiotic</p>
              <p className="text-base font-bold text-gray-900">{antibioticB}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border-l-4 border-violet-500 shadow-sm">
              <p className="text-xs font-bold text-violet-700 uppercase mb-2">Mechanism of action</p>
              <p className="text-sm text-gray-700 leading-relaxed">{antibioticBDesc}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border-l-4 border-fuchsia-500 shadow-sm">
              <p className="text-xs font-bold text-fuchsia-700 uppercase mb-3">Interpretation</p>
              <Badge className={`${secondary.className} font-bold px-4 py-2 text-sm shadow-md`}>
                {secondary.label}
              </Badge>
            </div>
          </div>
          
          <div className="px-5 py-3 bg-purple-50 border-t border-purple-100">
            <p className="text-xs text-purple-700 font-medium">
              ℹ️ Secondary sensitivity data for antibiotic B
            </p>
          </div>
        </Card>

        {/* Table 3: Summary */}
        <Card className="overflow-hidden border-2 border-blue-200 shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white drop-shadow-md">Analysis Summary</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center justify-center w-5 h-5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-md">
                      3
                    </span>
                    <p className="text-blue-50 text-sm font-medium">Comprehensive conclusion</p>
                  </div>
                </div>
              </div>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-white border border-white/30 shadow-lg">
                CONCLUSION
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-4 bg-gradient-to-br from-white to-blue-50/30">
            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
              <p className="text-xs font-bold text-blue-700 uppercase mb-2">Tested organism</p>
              <p className="text-base font-bold text-gray-900">{analysis.bacteriaName || '-'}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border-l-4 border-cyan-500 shadow-sm">
              <p className="text-xs font-bold text-cyan-700 uppercase mb-3">Summary</p>
              <ul className="space-y-2">
                {summaryLines.map((line, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full mr-2 text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-xs text-blue-700 font-medium">
              ℹ️ This summary combines responses to both antibiotics
            </p>
          </div>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="leading-relaxed">
            Interpretation is based on <span className="font-semibold text-gray-900">CLSI (Clinical and Laboratory Standards Institute)</span> standards, using accurate inhibition zone diameter measurements.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default AnalysisDetail;
