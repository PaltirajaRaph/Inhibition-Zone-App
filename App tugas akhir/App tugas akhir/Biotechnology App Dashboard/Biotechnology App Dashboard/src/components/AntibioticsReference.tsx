import { ArrowLeft, Search, Pill, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface AntibioticsReferenceProps {
  onBack: () => void;
}

interface AntibioticInfo {
  name: string;
  class: string;
  mechanism: string;
  spectrum: string;
  clsiStandards: {
    bacteria: string;
    susceptible: string;
    intermediate: string;
    resistant: string;
  }[];
}

export const antibioticsData: AntibioticInfo[] = [
  {
    name: 'Amoxicillin',
    class: 'Beta-Lactam (Penisilin)',
    mechanism: 'Menghambat sintesis dinding sel bakteri dengan mengikat protein pengikat penisilin (PBP)',
    spectrum: 'Spektrum sedang - efektif terhadap bakteri Gram-positif dan beberapa Gram-negatif',
    clsiStandards: [
      { bacteria: 'E. coli', susceptible: '≥17 mm', intermediate: '14-16 mm', resistant: '≤13 mm' },
      { bacteria: 'S. aureus', susceptible: '≥29 mm', intermediate: '-', resistant: '≤28 mm' },
    ]
  },
  {
    name: 'Ciprofloxacin',
    class: 'Fluoroquinolone',
    mechanism: 'Menghambat DNA gyrase dan topoisomerase IV, mencegah replikasi DNA bakteri',
    spectrum: 'Spektrum luas - sangat efektif terhadap bakteri Gram-negatif dan beberapa Gram-positif',
    clsiStandards: [
      { bacteria: 'E. coli', susceptible: '≥21 mm', intermediate: '16-20 mm', resistant: '≤15 mm' },
      { bacteria: 'P. aeruginosa', susceptible: '≥21 mm', intermediate: '16-20 mm', resistant: '≤15 mm' },
    ]
  },
  {
    name: 'Vancomycin',
    class: 'Glycopeptide',
    mechanism: 'Menghambat sintesis peptidoglikan pada dinding sel bakteri',
    spectrum: 'Spektrum sempit - efektif terhadap bakteri Gram-positif, termasuk MRSA',
    clsiStandards: [
      { bacteria: 'S. aureus', susceptible: '≥15 mm', intermediate: '13-14 mm', resistant: '≤12 mm' },
      { bacteria: 'Enterococcus spp.', susceptible: '≥17 mm', intermediate: '15-16 mm', resistant: '≤14 mm' },
    ]
  },
  {
    name: 'Gentamicin',
    class: 'Aminoglycoside',
    mechanism: 'Mengikat ribosom 30S, menghambat sintesis protein bakteri',
    spectrum: 'Spektrum luas - efektif terhadap bakteri Gram-negatif aerob',
    clsiStandards: [
      { bacteria: 'E. coli', susceptible: '≥15 mm', intermediate: '13-14 mm', resistant: '≤12 mm' },
      { bacteria: 'P. aeruginosa', susceptible: '≥15 mm', intermediate: '13-14 mm', resistant: '≤12 mm' },
    ]
  },
  {
    name: 'Tetracycline',
    class: 'Tetracycline',
    mechanism: 'Menghambat sintesis protein dengan mengikat ribosom 30S',
    spectrum: 'Spektrum luas - efektif terhadap bakteri Gram-positif dan Gram-negatif',
    clsiStandards: [
      { bacteria: 'E. coli', susceptible: '≥15 mm', intermediate: '12-14 mm', resistant: '≤11 mm' },
      { bacteria: 'S. aureus', susceptible: '≥19 mm', intermediate: '15-18 mm', resistant: '≤14 mm' },
    ]
  },
  {
    name: 'Azithromycin',
    class: 'Macrolide',
    mechanism: 'Menghambat sintesis protein dengan mengikat ribosom 50S',
    spectrum: 'Spektrum sedang - efektif terhadap bakteri Gram-positif dan beberapa Gram-negatif',
    clsiStandards: [
      { bacteria: 'S. aureus', susceptible: '≥18 mm', intermediate: '14-17 mm', resistant: '≤13 mm' },
      { bacteria: 'H. influenzae', susceptible: '≥12 mm', intermediate: '-', resistant: '≤11 mm' },
    ]
  },
  {
    name: 'Ceftriaxone',
    class: 'Cephalosporin (Generasi 3)',
    mechanism: 'Menghambat sintesis dinding sel bakteri (beta-laktam)',
    spectrum: 'Spektrum luas - sangat efektif terhadap bakteri Gram-negatif',
    clsiStandards: [
      { bacteria: 'E. coli', susceptible: '≥23 mm', intermediate: '20-22 mm', resistant: '≤19 mm' },
      { bacteria: 'K. pneumoniae', susceptible: '≥23 mm', intermediate: '20-22 mm', resistant: '≤19 mm' },
    ]
  },
  {
    name: 'Meropenem',
    class: 'Carbapenem',
    mechanism: 'Menghambat sintesis dinding sel bakteri dengan spektrum sangat luas',
    spectrum: 'Spektrum sangat luas - termasuk bakteri penghasil beta-laktamase',
    clsiStandards: [
      { bacteria: 'E. coli', susceptible: '≥23 mm', intermediate: '20-22 mm', resistant: '≤19 mm' },
      { bacteria: 'P. aeruginosa', susceptible: '≥19 mm', intermediate: '16-18 mm', resistant: '≤15 mm' },
    ]
  },
];

export default function AntibioticsReference({ onBack }: AntibioticsReferenceProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAntibiotics = useMemo(() => {
    const queryLower = searchQuery.toLowerCase();
    return antibioticsData.filter(
      (ab) =>
        ab.name.toLowerCase().includes(queryLower) ||
        ab.class.toLowerCase().includes(queryLower) ||
        ab.mechanism.toLowerCase().includes(queryLower),
    );
  }, [searchQuery]);

  return (
    <div className="bio-member-shell">
      <div className="bio-login-orb bio-login-orb-a" aria-hidden="true" />
      <div className="bio-login-orb bio-login-orb-b" aria-hidden="true" />

      <div className="bio-member-panel bio-antibiotics-panel">
        <div className="bio-antibiotics-header">
          <div className="bio-antibiotics-topbar">
            <Button variant="ghost" size="icon" onClick={onBack} className="bio-member-settings-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="bio-member-kicker">Clinical Reference</p>
              <h1 className="bio-antibiotics-title">Antibiotics Database</h1>
              <p className="bio-antibiotics-subtitle">Reference and CLSI standards for susceptibility testing</p>
            </div>
          </div>

          <div className="relative">
            <Search className="bio-antibiotics-search-icon" />
            <Input
              type="text"
              placeholder="Search antibiotic name, class, or mechanism"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bio-antibiotics-search-input pl-10"
            />
          </div>
        </div>

        <div className="bio-antibiotics-content bio-antibiotics-list">
          <Card className="bio-antibiotics-info-card">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">CLSI Standards</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Inhibition zones are measured in millimeters (mm) based on Clinical and Laboratory
                  Standards Institute (CLSI) standards.
                </p>
              </div>
            </div>
          </Card>

          <div className="bio-antibiotics-count-row">
            <p className="bio-antibiotics-count-text">{filteredAntibiotics.length} antibiotics found</p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {filteredAntibiotics.map((antibiotic, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-none">
                <Card className="bio-antibiotics-item-card overflow-hidden">
                  <AccordionTrigger className="bio-antibiotics-item-trigger hover:no-underline">
                    <div className="bio-antibiotics-item-head text-left">
                      <div className="bio-antibiotics-item-icon">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="bio-antibiotics-item-title">{antibiotic.name}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {antibiotic.class}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Mechanism of action</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{antibiotic.mechanism}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Spectrum</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{antibiotic.spectrum}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">CLSI standards (Inhibition zone diameter)</p>
                        <div className="space-y-2">
                          {antibiotic.clsiStandards.map((standard, idx) => (
                            <div key={idx} className="bio-antibiotics-standard-card">
                              <p className="text-sm font-semibold text-gray-900 mb-2">{standard.bacteria}</p>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="w-full bg-green-100 text-green-700 rounded px-2 py-1 font-medium">
                                    Susceptible
                                  </div>
                                  <p className="text-gray-600 mt-1">{standard.susceptible}</p>
                                </div>
                                {standard.intermediate !== '-' && (
                                  <div className="text-center">
                                    <div className="w-full bg-yellow-100 text-yellow-700 rounded px-2 py-1 font-medium">
                                      Intermediate
                                    </div>
                                    <p className="text-gray-600 mt-1">{standard.intermediate}</p>
                                  </div>
                                )}
                                <div className="text-center">
                                  <div className="w-full bg-red-100 text-red-700 rounded px-2 py-1 font-medium">
                                    Resistant
                                  </div>
                                  <p className="text-gray-600 mt-1">{standard.resistant}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredAntibiotics.length === 0 && (
            <Card className="bio-member-empty bio-antibiotics-empty">
              <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="bio-member-empty-title">No antibiotics found</p>
              <p className="bio-member-empty-subtitle">Try a different keyword</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
