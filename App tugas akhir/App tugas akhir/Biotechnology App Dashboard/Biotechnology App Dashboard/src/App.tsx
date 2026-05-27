import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import type { MemberData } from './components/CreateOrganizationMember';
import type {
  ManagedAdminAccount,
  ManagedMemberAccount,
  ManagedOrganizationOption,
} from './components/AccountControl';
import type { AnalyticsData, AnalyticsTrendUnit } from './components/AnalyticsDashboard';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { BarChart3, BookOpen, History as HistoryIcon, Home, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import CustomCamera from './plugins/CustomCamera';
import { processImageViaHomography } from './utils/homographyClient';
import { analyzeImageViaYolo, type YoloMeasurement } from './utils/yoloClient';
import { compareAnalysesBySampleOrder, getAnalysisGroupKey } from './utils/sampleGrouping';
import ErrorBoundary from './components/ErrorBoundary';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Login = lazy(() => import('./components/Login'));
const UserLogin = lazy(() => import('./components/UserLogin'));
const LogOut = lazy(() => import('./components/LogOut'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard.tsx'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const CreateOrganizationName = lazy(() => import('./components/CreateOrganizationName'));
const CreateOrganizationAdmin = lazy(() => import('./components/CreateOrganizationAdmin'));
const CreateOrganizationTeam = lazy(() => import('./components/CreateOrganizationTeam'));
const CreateOrganizationMember = lazy(() => import('./components/CreateOrganizationMember'));
const OrganizationNameEdit = lazy(() => import('./components/OrganizationNameEdit'));
const OrganizationTeamEdit = lazy(() => import('./components/OrganizationTeamEdit'));
const OrganizationMemberEdit = lazy(() => import('./components/OrganizationMemberEdit'));
const Camera = lazy(() => import('./components/Camera'));
const HomographyProcessing = lazy(() => import('./components/HomographyProcessing'));
const Report = lazy(() => import('./components/Report'));
const ReportCreate = lazy(() => import('./components/ReportCreate'));
const History = lazy(() => import('./components/History'));
const Settings = lazy(() => import('./components/Settings'));
const AntibioticsReference = lazy(() => import('./components/AntibioticsReference'));
const AccountControl = lazy(() => import('./components/AccountControl'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));

const DEFAULT_WEB_API_BASE = 'http://localhost/biotech-api';
const DEFAULT_ANDROID_API_BASES = ['http://10.0.2.2/biotech-api', 'http://10.0.3.2/biotech-api'];
const REQUEST_TIMEOUT_MS = 5000;
const SESSION_KEY = 'biotech.session.v1';
const ANALYSES_STORAGE_PREFIX = 'biotech.analyses.v2';
const ANALYTICS_AUTO_REFRESH_MS = 10000;
const ANALYTICS_WINDOW_BY_UNIT: Record<AnalyticsTrendUnit, number> = {
  day: 7,
  week: 12,
  month: 6,
  year: 5,
};

let cachedApiBase: string | null = null;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const parseApiBases = (value?: string) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map(trimTrailingSlash);
};

const uniqueApiBases = (items: string[]) => {
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

const getWebApiBase = () => {
  if (typeof window === 'undefined') return DEFAULT_WEB_API_BASE;
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return DEFAULT_WEB_API_BASE;
  }
  return `http://${hostname}/biotech-api`;
};

const getApiCandidates = () => {
  const envPublicBase = (import.meta.env.VITE_PUBLIC_API_BASE_URL as string | undefined)?.trim() || '';
  const envPublicFallbacks = parseApiBases(import.meta.env.VITE_PUBLIC_API_BASE_URL_FALLBACKS as string | undefined);
  const envAndroidBase = (import.meta.env.VITE_ANDROID_API_BASE_URL as string | undefined)?.trim() || '';
  const envFallbacks = parseApiBases(import.meta.env.VITE_ANDROID_API_BASE_URL_FALLBACKS as string | undefined);
  const normalizedPublicMain = envPublicBase ? trimTrailingSlash(envPublicBase) : null;
  const normalizedAndroidMain = envAndroidBase ? trimTrailingSlash(envAndroidBase) : null;

  if (Capacitor.getPlatform() === 'android') {
    return uniqueApiBases([
      ...(normalizedPublicMain ? [normalizedPublicMain] : []),
      ...(normalizedAndroidMain ? [normalizedAndroidMain] : []),
      ...envPublicFallbacks,
      ...envFallbacks,
      ...DEFAULT_ANDROID_API_BASES,
    ]);
  }

  return uniqueApiBases([
    ...(normalizedPublicMain ? [normalizedPublicMain] : []),
    ...envPublicFallbacks,
    getWebApiBase(),
  ]);
};

const shouldRetryStatus = (status: number) => [404, 429, 502, 503, 504].includes(status);

const isJsonResponse = (response: Response) => {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  return contentType.includes('application/json') || contentType.includes('+json');
};

const withTunnelBypassHeader = (base: string, init: RequestInit): RequestInit => {
  if (!base.includes('.loca.lt')) return init;

  const headers = new Headers(init.headers || {});
  if (!headers.has('bypass-tunnel-reminder')) {
    headers.set('bypass-tunnel-reminder', 'true');
  }

  return {
    ...init,
    headers,
  };
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

const apiRequest = async (
  path: string,
  init: RequestInit,
  options?: { timeoutMs?: number; maxCandidates?: number },
) => {
  const candidates = getApiCandidates();
  const orderedCandidates = cachedApiBase ? uniqueApiBases([cachedApiBase, ...candidates]) : candidates;
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const maxCandidates = options?.maxCandidates ?? orderedCandidates.length;

  let lastError: unknown = null;

  for (const base of orderedCandidates.slice(0, Math.max(1, maxCandidates))) {
    try {
      const requestInit = withTunnelBypassHeader(base, init);
      const response = await fetchWithTimeout(`${base}${path}`, requestInit, timeoutMs);
      const jsonResponse = isJsonResponse(response);

      if (!response.ok && (shouldRetryStatus(response.status) || !jsonResponse)) {
        lastError = new Error(`HTTP ${response.status} from ${base}`);
        continue;
      }

      if (response.ok && !jsonResponse) {
        lastError = new Error(`Unexpected non-JSON response from ${base}`);
        continue;
      }

      cachedApiBase = base;
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Tidak dapat terhubung ke API');
};

export type AnalysisStatus = 'Complete' | 'Failed' | 'Pending';
export type ResistanceResult = 'RESISTEN' | 'RENTAN' | 'INTERMEDIAT';

export interface AnalysisMeasurement {
  id: string;
  index: number;
  label: string;
  result?: ResistanceResult;
  diameterMm?: number;
  diskDiameterPx?: number;
  zoneDiameterPx?: number;
  scaleMmPerPx?: number;
  diskConfidence?: number;
  zoneConfidence?: number;
}

export interface AnalysisData {
  id: string;
  reportGroupId?: string;
  reportDisplayId?: string;
  reportName?: string;
  sampleId?: string;
  tags?: string[];
  bacteriaName: string;
  date: string;
  actionDate?: string;
  status: AnalysisStatus;
  diameter?: number;
  
  antibiotic?: string;
  
  antibioticA?: string;
  antibioticADesc?: string;
  antibioticB?: string;
  antibioticBDesc?: string;
  secondaryResult?: ResistanceResult;
  result?: ResistanceResult;
  originalImage?: string;
  processedImage?: string;
  measurements?: AnalysisMeasurement[];
  
  notes?: string;
  technician?: string;
  specimenType?: string;
}

interface AdminData {
  username: string;
  password: string;
}

type Role = 'member' | 'admin';

interface SessionState {
  role: Role;
  username: string;
  organizationName: string;
  organizationId?: string;
  teamId?: string;
  memberId?: string;
  adminId?: string;
  teamName?: string;
  organizationTeamNames?: string[];
  organizationMemberNames?: string[];
}

const extractPositiveIntFromId = (id: string) => {
  const match = id.match(/\d+/);
  if (!match) return null;
  const value = parseInt(match[0], 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
};

const normalizeReportId = (id: string) => {
  const trimmed = String(id || '').trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  const parsed = parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? String(parsed) : trimmed;
};

const normalizeAnalysisStatus = (status: unknown): AnalysisStatus => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'complete' || normalized === 'completed' || normalized === 'selesai') {
    return 'Complete';
  }
  if (normalized === 'failed' || normalized === 'gagal') {
    return 'Failed';
  }
  if (normalized === 'pending' || normalized === 'processing') {
    return 'Pending';
  }
  return 'Pending';
};

const normalizeDbResult = (value?: unknown): ResistanceResult | undefined => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'resistant' || normalized === 'resisten') return 'RESISTEN';
  if (normalized === 'susceptible' || normalized === 'rentan') return 'RENTAN';
  if (normalized === 'intermediate' || normalized === 'intermediat') return 'INTERMEDIAT';
  return undefined;
};

const toDbResult = (value?: ResistanceResult | string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'resisten' || normalized === 'resistant') return 'resistant';
  if (normalized === 'rentan' || normalized === 'susceptible') return 'susceptible';
  if (normalized === 'intermediat' || normalized === 'intermediate') return 'intermediate';
  return null;
};

const toDbStatus = (value?: AnalysisStatus | string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'complete' || normalized === 'completed' || normalized === 'selesai') return 'completed';
  if (normalized === 'failed' || normalized === 'gagal') return 'failed';
  if (normalized === 'processing') return 'processing';
  return 'pending';
};

const toIsoDateFromTimestamp = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().split('T')[0];
};

const parseNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getSampleLabel = (index: number) => {
  return `Sample ${Math.max(1, Math.floor(index) + 1)}`;
};

const createReportGroupId = () => {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const mapYoloMeasurementToAnalysis = (measurement: YoloMeasurement, index: number): AnalysisMeasurement => ({
  id: `measurement-${index + 1}`,
  index: Number.isFinite(Number(measurement.index)) ? Number(measurement.index) : index + 1,
  label: String(measurement.label || getSampleLabel(index)),
  result: normalizeDbResult(measurement.result),
  diameterMm: parseNumber(measurement.diameterMm),
  diskDiameterPx: parseNumber(measurement.diskDiameterPx),
  zoneDiameterPx: parseNumber(measurement.zoneDiameterPx),
  scaleMmPerPx: parseNumber(measurement.scaleMmPerPx),
  diskConfidence: parseNumber(measurement.diskConfidence),
  zoneConfidence: parseNumber(measurement.zoneConfidence),
});

const mapApiAnalysisToClient = (row: Record<string, unknown>): AnalysisData => {
  const date =
    toIsoDateFromTimestamp(String(row.test_date ?? row.date ?? row.created_at ?? '')) ||
    new Date().toISOString().split('T')[0];
  return {
    id: String(row.id || ''),
    reportGroupId: String(row.report_group_id ?? row.reportGroupId ?? '') || undefined,
    reportDisplayId: String(row.report_display_id ?? row.reportDisplayId ?? '') || undefined,
    reportName: String(row.report_name ?? row.reportName ?? '').trim() || undefined,
    sampleId: String(row.sample_id ?? row.sampleId ?? '').trim() || undefined,
    tags: (() => {
      const raw = row.tags ?? row.report_tags ?? row.reportTags;
      if (Array.isArray(raw)) return raw.map((value) => String(value).trim()).filter((value) => value.length > 0);
      if (typeof raw === 'string' && raw.trim().length > 0) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed.map((value) => String(value).trim()).filter((value) => value.length > 0);
        } catch {
          // fall through to CSV
        }
        return raw.split(',').map((value) => value.trim()).filter((value) => value.length > 0);
      }
      return undefined;
    })(),
    bacteriaName: String(row.bacteria_name ?? row.bacteriaName ?? ''),
    date,
    actionDate: toIsoDateFromTimestamp(String(row.action_date ?? row.actionDate ?? row.test_date ?? '')),
    status: normalizeAnalysisStatus(row.status),
    diameter: parseNumber(row.diameter),
    antibiotic: String(row.antibiotic_a ?? row.antibioticA ?? row.antibiotic ?? ''),
    antibioticA: String(row.antibiotic_a ?? row.antibioticA ?? ''),
    antibioticADesc: String(row.antibiotic_a_desc ?? row.antibioticADesc ?? ''),
    antibioticB: String(row.antibiotic_b ?? row.antibioticB ?? ''),
    antibioticBDesc: String(row.antibiotic_b_desc ?? row.antibioticBDesc ?? ''),
    secondaryResult: normalizeDbResult(row.antibiotic_b_result ?? row.secondaryResult ?? undefined),
    result: normalizeDbResult(row.antibiotic_a_result ?? row.result ?? undefined),
    originalImage: String(row.original_image ?? row.originalImage ?? ''),
    processedImage: String(row.processed_image ?? row.processedImage ?? ''),
    notes: String(row.notes ?? ''),
    technician: String(row.technician ?? ''),
    specimenType: String(row.specimen_type ?? row.specimenType ?? ''),
  };
};

const getNextReportId = (items: AnalysisData[]) => {
  const used = new Set<number>();
  for (const item of items) {
    const value = extractPositiveIntFromId(String(item.id));
    if (value) used.add(value);
  }
  let candidate = 1;
  while (used.has(candidate)) candidate++;
  return String(candidate);
};

const getAnalysesStorageKey = (role: Role, username: string) => {
  const normalizedUsername = username.trim().toLowerCase();
  return `${ANALYSES_STORAGE_PREFIX}.${role}.${normalizedUsername}`;
};

const loadAnalysesFromStorage = (role: Role | null, username: string): AnalysisData[] => {
  const normalizedUsername = username.trim();
  if (!role || normalizedUsername.length === 0) return [];

  const storageKey = getAnalysesStorageKey(role, normalizedUsername);
  const stored = localStorage.getItem(storageKey);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((analysis) => ({
      ...analysis,
      id: normalizeReportId(String((analysis as AnalysisData).id)),
      reportGroupId: String((analysis as AnalysisData).reportGroupId || '').trim() || undefined,
      reportDisplayId: String((analysis as AnalysisData).reportDisplayId || '').trim() || undefined,
      reportName: String((analysis as AnalysisData).reportName || '').trim() || undefined,
      sampleId: String((analysis as AnalysisData).sampleId || '').trim() || undefined,
      tags: Array.isArray((analysis as AnalysisData).tags)
        ? (analysis as AnalysisData).tags!
            .map((value) => String(value).trim())
            .filter((value) => value.length > 0)
        : undefined,
      status: normalizeAnalysisStatus((analysis as Partial<AnalysisData>).status),
    }));
  } catch (error) {
    console.error('Failed to parse analyses from localStorage:', error);
    localStorage.removeItem(storageKey);
    return [];
  }
};

const compactAnalysesForStorage = (items: AnalysisData[], keepFirstImage = true): AnalysisData[] => {
  const seenImageKeys = new Set<string>();

  return items.map((item) => {
    const imageKey = item.reportGroupId || item.processedImage || item.originalImage || item.id;
    const shouldKeepImages = keepFirstImage && !seenImageKeys.has(imageKey);
    seenImageKeys.add(imageKey);

    if (shouldKeepImages) return item;

    return {
      ...item,
      originalImage: '',
      processedImage: '',
    };
  });
};

const persistAnalysesSafely = (storageKey: string, items: AnalysisData[]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
    return true;
  } catch (error) {
    console.warn('Failed to persist full analyses, retrying with compact payload:', error);
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(compactAnalysesForStorage(items, true)));
    return true;
  } catch (error) {
    console.warn('Failed to persist compact analyses, retrying without images:', error);
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(compactAnalysesForStorage(items, false)));
    return true;
  } catch (error) {
    console.error('Failed to persist analyses after all fallbacks:', error);
    return false;
  }
};

const mergeApiAnalysesWithStored = (apiAnalyses: AnalysisData[], storedAnalyses: AnalysisData[]) => {
  if (storedAnalyses.length === 0) return apiAnalyses;

  const storedById = new Map(storedAnalyses.map((item) => [String(item.id), item]));
  const apiIds = new Set(apiAnalyses.map((item) => String(item.id)));
  const merged = apiAnalyses.map((apiItem) => {
    const storedItem = storedById.get(String(apiItem.id));
    if (!storedItem) return apiItem;

    return {
      ...storedItem,
      ...apiItem,
      reportGroupId: apiItem.reportGroupId || storedItem.reportGroupId,
      reportDisplayId: apiItem.reportDisplayId || storedItem.reportDisplayId,
      reportName: apiItem.reportName || storedItem.reportName,
      sampleId: apiItem.sampleId || storedItem.sampleId,
      tags: apiItem.tags && apiItem.tags.length > 0 ? apiItem.tags : storedItem.tags,
      originalImage: apiItem.originalImage || storedItem.originalImage,
      processedImage: apiItem.processedImage || storedItem.processedImage,
      measurements: apiItem.measurements?.length ? apiItem.measurements : storedItem.measurements,
    };
  });

  for (const storedItem of storedAnalyses) {
    if (!apiIds.has(String(storedItem.id)) && storedItem.status === 'Pending') {
      merged.push(storedItem);
    }
  }

  return merged;
};

type View =
  | 'login'
  | 'accountControl'
  | 'userLogin'
  | 'adminLogin'
  | 'adminDashboard'
  | 'logout'
  | 'createOrganizationName'
  | 'createOrganizationAdmin'
  | 'createOrganizationTeam'
  | 'createOrganizationMember'
  | 'organizationNameEdit'
  | 'organizationTeamEdit'
  | 'organizationTeamAdd'
  | 'organizationMemberEdit'
  | 'organizationMemberAdd'
  | 'dashboard'
  | 'analytics'
  | 'camera'
  | 'processing'
  | 'reportCreate'
  | 'report'
  | 'history'
  | 'settings'
  | 'antibiotics';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [reportFocusId, setReportFocusId] = useState<string>('');
  const [reportFocusGroupId, setReportFocusGroupId] = useState<string>('');
  const [organizationTeams, setOrganizationTeams] = useState<string[]>([]);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [memberId, setMemberId] = useState<string>('');
  const [adminId, setAdminId] = useState<string>('');
  const [organizationAdmin, setOrganizationAdmin] = useState<AdminData | null>(null);
  const [organizationTeamNames, setOrganizationTeamNames] = useState<string[]>([]);
  const [organizationMemberNames, setOrganizationMemberNames] = useState<string[]>([]);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [memberUsername, setMemberUsername] = useState<string>('');
  const [memberTeam, setMemberTeam] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [antibioticsBackView, setAntibioticsBackView] = useState<'dashboard' | 'adminDashboard' | 'settings'>('dashboard');
	const [cameraBackView, setCameraBackView] = useState<View>('dashboard');
	const [reportCreateBackView, setReportCreateBackView] = useState<View>('dashboard');
	const [reportBackView, setReportBackView] = useState<View>('dashboard');
	const [selectedTeamIndex, setSelectedTeamIndex] = useState<number>(0);
	const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(0);
  const lastBackPressAtRef = useRef(0);
  const currentViewRef = useRef<View>('login');
  const currentRoleRef = useRef<Role | null>(null);
  const antibioticsBackViewRef = useRef<'dashboard' | 'adminDashboard' | 'settings'>('dashboard');
  const cameraBackViewRef = useRef<View>('dashboard');
  const reportCreateBackViewRef = useRef<View>('dashboard');
  const reportBackViewRef = useRef<View>('dashboard');
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [analyticsTrendUnit, setAnalyticsTrendUnit] = useState<AnalyticsTrendUnit>('day');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsUpdatedAt, setAnalyticsUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    currentViewRef.current = currentView;
    currentRoleRef.current = currentRole;
    antibioticsBackViewRef.current = antibioticsBackView;
    cameraBackViewRef.current = cameraBackView;
    reportCreateBackViewRef.current = reportCreateBackView;
    reportBackViewRef.current = reportBackView;
  }, [currentView, currentRole, antibioticsBackView, cameraBackView, reportCreateBackView, reportBackView]);

  const persistAnalysesForCurrentUser = (items: AnalysisData[]) => {
    if (currentRole === 'admin') {
      const username = adminUsername.trim();
      if (!username) return;
      persistAnalysesSafely(getAnalysesStorageKey('admin', username), items);
      return;
    }

    if (currentRole === 'member') {
      const username = memberUsername.trim();
      if (!username) return;
      persistAnalysesSafely(getAnalysesStorageKey('member', username), items);
    }
  };

  const getApiContext = () => ({
    organizationId: organizationId.trim(),
    teamId: teamId.trim(),
    memberId: memberId.trim(),
    adminId: adminId.trim(),
  });

  const buildAnalysisPayload = (analysis: AnalysisData) => {
    const ctx = getApiContext();
    return {
      organization_id: ctx.organizationId || undefined,
      team_id: ctx.teamId || undefined,
      member_id: ctx.memberId || undefined,
      report_group_id: analysis.reportGroupId || undefined,
      report_display_id: analysis.reportDisplayId || undefined,
      bacteria_name: analysis.bacteriaName || undefined,
      specimen_type: analysis.specimenType || undefined,
      report_name: analysis.reportName || undefined,
      sample_id: analysis.sampleId || undefined,
      tags: analysis.tags && analysis.tags.length > 0 ? analysis.tags : undefined,
      status: toDbStatus(analysis.status),
      diameter: analysis.diameter ?? undefined,
      antibiotic_a: analysis.antibioticA || analysis.antibiotic || undefined,
      antibiotic_a_desc: analysis.antibioticADesc || undefined,
      antibiotic_a_result: toDbResult(analysis.result) || undefined,
      antibiotic_b: analysis.antibioticB || undefined,
      antibiotic_b_desc: analysis.antibioticBDesc || undefined,
      antibiotic_b_result: toDbResult(analysis.secondaryResult) || undefined,
      original_image: analysis.originalImage || undefined,
      processed_image: analysis.processedImage || undefined,
      notes: analysis.notes || undefined,
      technician: analysis.technician || undefined,
      test_date: analysis.actionDate || analysis.date || undefined,
    };
  };

  const loadAnalysesFromApi = async (role: Role, ctx: { organizationId: string; teamId: string; memberId: string }) => {
    const params = new URLSearchParams();
    if (role === 'member' && ctx.memberId) {
      params.set('member_id', ctx.memberId);
    }
    if (ctx.organizationId) {
      params.set('organization_id', ctx.organizationId);
    }
    if (ctx.teamId) {
      params.set('team_id', ctx.teamId);
    }

    if (params.toString().length === 0) return null;

    try {
      const response = await apiRequest(`/analyses?${params.toString()}`, { method: 'GET' }, { timeoutMs: 10000 });
      const data = await response.json();
      if (!data?.success || !Array.isArray(data?.data)) return null;
      return data.data.map((row: Record<string, unknown>) => mapApiAnalysisToClient(row));
    } catch (error) {
      console.error('Failed to load analyses from API:', error);
      return null;
    }
  };

  const mapAnalyticsData = (payload: any, fallbackUnit: AnalyticsTrendUnit): AnalyticsData => {
    const overview = payload?.overview ?? {};
    const results = payload?.results ?? {};
    const bacteria = Array.isArray(payload?.bacteria_distribution) ? payload.bacteria_distribution : [];
    const trend = payload?.trend ?? {};
    const points = Array.isArray(trend?.points) ? trend.points : [];

    return {
      overview: {
        totalAnalyses: Number(overview.total_analyses ?? 0),
        completed: Number(overview.completed ?? 0),
        pending: Number(overview.pending ?? 0),
        processing: Number(overview.processing ?? 0),
        failed: Number(overview.failed ?? 0),
        completionRate: Number(overview.completion_rate ?? 0),
      },
      results: {
        resistant: Number(results.resistant ?? 0),
        susceptible: Number(results.susceptible ?? 0),
        intermediate: Number(results.intermediate ?? 0),
        indeterminate: Number(results.indeterminate ?? 0),
      },
      bacteriaDistribution: bacteria.map((item: any) => ({
        name: String(item?.bacteria_name || item?.name || 'Unknown'),
        count: Number(item?.count ?? 0),
      })),
      trend: {
        unit: (trend.unit as AnalyticsTrendUnit) || fallbackUnit,
        window: Number(trend.window ?? 0),
        points: points.map((item: any) => ({
          label: String(item?.label ?? ''),
          count: Number(item?.count ?? 0),
        })),
      },
    };
  };

  const loadAnalyticsFromApi = async (unit: AnalyticsTrendUnit, options?: { silent?: boolean }) => {
    const params = new URLSearchParams();
    if (currentRole === 'member' && memberId.trim()) {
      params.set('member_id', memberId.trim());
    }
    if (organizationId.trim()) {
      params.set('organization_id', organizationId.trim());
    }
    if (!params.toString()) {
      setAnalyticsError('ID organisasi atau member belum tersedia.');
      return;
    }

    params.set('trend', unit);
    params.set('trend_window', String(ANALYTICS_WINDOW_BY_UNIT[unit]));

    if (!options?.silent) {
      setAnalyticsLoading(true);
    }
    setAnalyticsError(null);

    try {
      const response = await apiRequest(`/statistics?${params.toString()}`, { method: 'GET' }, { timeoutMs: 15000 });
      const data = await response.json();
      if (!data?.success || !data?.data) {
        setAnalyticsError(data?.message || 'Gagal memuat analytics');
        return;
      }

      setAnalyticsData(mapAnalyticsData(data.data, unit));
      setAnalyticsUpdatedAt(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalyticsError('Tidak dapat terhubung ke server analytics');
    } finally {
      if (!options?.silent) {
        setAnalyticsLoading(false);
      }
    }
  };

  const createAnalysisInApi = async (analysis: AnalysisData) => {
    const ctx = getApiContext();
    if (!ctx.organizationId && !ctx.memberId) return null;

    try {
      const response = await apiRequest('/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAnalysisPayload(analysis)),
      }, { timeoutMs: 15000 });

      const data = await response.json();
      if (!data?.success || !data?.data) return null;
      return mapApiAnalysisToClient(data.data as Record<string, unknown>);
    } catch (error) {
      console.error('Failed to create analysis in API:', error);
      return null;
    }
  };

  const updateAnalysisInApi = async (analysis: AnalysisData) => {
    if (!analysis.id) return null;

    try {
      const response = await apiRequest(`/analyses/${analysis.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAnalysisPayload(analysis)),
      }, { timeoutMs: 15000 });

      const data = await response.json();
      if (!data?.success || !data?.data) return null;
      return mapApiAnalysisToClient(data.data as Record<string, unknown>);
    } catch (error) {
      console.error('Failed to update analysis in API:', error);
      return null;
    }
  };

  const deleteAnalysisInApi = async (analysisId: string) => {
    if (!analysisId) return false;
    const ctx = getApiContext();
    const params = new URLSearchParams();
    if (ctx.memberId) params.set('member_id', ctx.memberId);
    if (!ctx.memberId && ctx.organizationId) params.set('organization_id', ctx.organizationId);

    try {
      const suffix = params.toString().length ? `?${params.toString()}` : '';
      const response = await apiRequest(`/analyses/${analysisId}${suffix}`, { method: 'DELETE' }, { timeoutMs: 10000 });
      const data = await response.json();
      return Boolean(data?.success);
    } catch (error) {
      console.error('Failed to delete analysis in API:', error);
      return false;
    }
  };

    useEffect(() => {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;

      const hydrateAnalyses = async (role: Role, username: string, ctx: { organizationId: string; teamId: string; memberId: string }) => {
        const storedAnalyses = loadAnalysesFromStorage(role, username);
        const apiAnalyses = await loadAnalysesFromApi(role, ctx);
        if (apiAnalyses && apiAnalyses.length > 0) {
          const mergedAnalyses = mergeApiAnalysesWithStored(apiAnalyses, storedAnalyses);
          setAnalyses(mergedAnalyses);
          persistAnalysesSafely(getAnalysesStorageKey(role, username), mergedAnalyses);
          return;
        }
        setAnalyses(storedAnalyses);
      };

      try {
        const parsed = JSON.parse(raw) as SessionState;
        if (parsed.role === 'admin') {
          const adminName = parsed.username || '';
          const orgId = parsed.organizationId || '';
          setCurrentRole('admin');
          setAdminUsername(adminName);
          setMemberUsername('');
          setMemberTeam('');
          setOrganizationName(parsed.organizationName || '');
          setOrganizationId(orgId);
          setAdminId(parsed.adminId || '');
          setOrganizationTeamNames(Array.isArray(parsed.organizationTeamNames) ? parsed.organizationTeamNames : []);
          setOrganizationMemberNames(Array.isArray(parsed.organizationMemberNames) ? parsed.organizationMemberNames : []);
          setCurrentView('adminDashboard');
          void hydrateAnalyses('admin', adminName, { organizationId: orgId, teamId: '', memberId: '' });
          return;
        }

        if (parsed.role === 'member') {
          const memberName = parsed.username || '';
          const orgId = parsed.organizationId || '';
          const teamIdValue = parsed.teamId || '';
          const memberIdValue = parsed.memberId || '';
          setCurrentRole('member');
          setMemberUsername(memberName);
          setMemberTeam(parsed.teamName || '');
          setAdminUsername('');
          setOrganizationName(parsed.organizationName || '');
          setOrganizationId(orgId);
          setTeamId(teamIdValue);
          setMemberId(memberIdValue);
          setCurrentView('dashboard');
          void hydrateAnalyses('member', memberName, { organizationId: orgId, teamId: teamIdValue, memberId: memberIdValue });
        }
      } catch (error) {
        console.error('Failed to parse session state:', error);
        localStorage.removeItem(SESSION_KEY);
      }
    }, []);

    const saveSession = (value: SessionState) => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    };

    const clearSession = () => {
      localStorage.removeItem(SESSION_KEY);
      setCurrentRole(null);
      setAdminUsername('');
      setMemberUsername('');
      setMemberTeam('');
      setOrganizationId('');
      setTeamId('');
      setMemberId('');
      setAdminId('');
      setAnalyses([]);
    };

  useEffect(() => {
    if (currentView !== 'analytics') return;

    void loadAnalyticsFromApi(analyticsTrendUnit);
    const intervalId = window.setInterval(() => {
      void loadAnalyticsFromApi(analyticsTrendUnit, { silent: true });
    }, ANALYTICS_AUTO_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentView, analyticsTrendUnit, currentRole, organizationId, memberId]);

  const startNewAnalysis = async () => {
    setCameraBackView('dashboard');

    // On Android native, use the existing CameraX flow (NewAnalysisActivity) instead of the system camera.
    if (Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform()) {
      setCurrentView('processing');
      try {
        const result = await CustomCamera.launchNewAnalysis();
        if (result?.success && result.uri) {
          const displaySrc = Capacitor.convertFileSrc(result.uri);
          let processedForAnalysis = displaySrc;

          try {
            processedForAnalysis = await processImageViaHomography(displaySrc);
          } catch (error) {
            console.error('Homography processing failed on native Android, fallback to original image:', error);
            toast.warning('Homografi dilewati', {
              description: 'Gagal memproses homografi. Analisis tetap dilanjutkan dengan foto asli.',
            });
          }

          await handlePhotoTaken(processedForAnalysis, 'dashboard', displaySrc);
          return;
        }

        if (result?.message && result.message.toLowerCase() === 'canceled') {
          setCurrentView('dashboard');
          return;
        }

        toast.error('Kamera', {
          description: result?.message || 'Gagal membuka kamera CameraX',
        });
        setCurrentView('dashboard');
        return;
      } catch (error) {
        console.error('Failed to launch CameraX activity:', error);
        toast.error('Kamera', { description: 'Gagal membuka kamera CameraX' });
        setCurrentView('dashboard');
        return;
      }
    }

    setCurrentView('camera');
  };

  const retakeCurrentAnalysis = async () => {
    if (currentAnalysis) {
      const targetId = currentAnalysis.id;
      setAnalyses((prev) => {
        const next = prev.filter((item) => item.id !== targetId);
        persistAnalysesForCurrentUser(next);
        return next;
      });
      void deleteAnalysisInApi(targetId);
      setCurrentAnalysis(null);
    }
    setReportFocusId('');
    setReportFocusGroupId('');
    await startNewAnalysis();
  };

  const handlePhotoTaken = async (
    processedImage: string,
    backView: View = 'dashboard',
    originalImage?: string,
  ) => {
    const fallbackId = getNextReportId(analyses);
    const reportGroupId = createReportGroupId();
    const original = originalImage || processedImage;
    const today = new Date().toISOString().split('T')[0];

    setCurrentView('processing');

    let yoloData: Awaited<ReturnType<typeof analyzeImageViaYolo>> | null = null;
    try {
      yoloData = await analyzeImageViaYolo(processedImage);
    } catch (error) {
      console.error('YOLO inference failed:', error);
      toast.error('YOLO gagal', {
        description: 'Deteksi YOLO gagal. Anda tetap bisa mengisi laporan manual.',
      });
    }

    const yoloMeasurements = Array.isArray(yoloData?.measurements)
      ? yoloData.measurements.map(mapYoloMeasurementToAnalysis)
      : [];
    const primaryDiameter = yoloMeasurements.find((measurement) => typeof measurement.diameterMm === 'number')?.diameterMm;

    const pendingAnalysis: AnalysisData = {
      id: fallbackId,
      reportGroupId,
      reportDisplayId: fallbackId,
      bacteriaName: '',
      date: today,
      status: 'Pending',
      originalImage: original,
      processedImage: yoloData?.processedImage || processedImage,
      diameter: typeof primaryDiameter === 'number'
        ? primaryDiameter
        : typeof yoloData?.diameterMm === 'number'
          ? yoloData.diameterMm
          : undefined,
      measurements: yoloMeasurements,
      antibiotic: '',
    };

    const savedAnalysis = await createAnalysisInApi(pendingAnalysis);
    const finalAnalysis = {
      ...(savedAnalysis ?? pendingAnalysis),
      reportGroupId,
      reportDisplayId: savedAnalysis?.reportDisplayId || savedAnalysis?.id || pendingAnalysis.reportDisplayId,
      originalImage: (savedAnalysis?.originalImage || pendingAnalysis.originalImage),
      processedImage: (savedAnalysis?.processedImage || pendingAnalysis.processedImage),
      diameter: savedAnalysis?.diameter ?? pendingAnalysis.diameter,
      measurements: yoloMeasurements,
    };

    setCurrentAnalysis(finalAnalysis);
    setReportFocusId(finalAnalysis.id);
    setReportFocusGroupId(finalAnalysis.reportGroupId || '');
    setAnalyses((prev) => {
      const updated = [finalAnalysis, ...prev];
      persistAnalysesForCurrentUser(updated);
      return updated;
    });
    setReportCreateBackView(backView);
    setCurrentView('reportCreate');
  };
	const editCurrentReport = () => {
		if (!currentAnalysis) return;
		setReportCreateBackView('report');
		setCurrentView('reportCreate');
	};
  const editReportSample = (analysis: AnalysisData) => {
    setCurrentAnalysis(analysis);
    setReportFocusId(analysis.id);
    setReportFocusGroupId(analysis.reportGroupId || '');
    setReportCreateBackView('report');
    setCurrentView('reportCreate');
  };
	const viewReport = (analysis: AnalysisData) => {
		const sourceView = currentView === 'history' ? 'history' : 'dashboard';
		setReportBackView(sourceView);
		setCurrentAnalysis(analysis);
    setReportFocusId(analysis.id);
    setReportFocusGroupId(analysis.reportGroupId || '');
		setCurrentView('report');
	};
  const confirmReportCreate = (updated: AnalysisData | AnalysisData[]) => {
    const drafts = (Array.isArray(updated) ? updated : [updated]).filter((item) => Boolean(item?.id));
    if (drafts.length === 0) return;

    const sourceAnalysisId = currentAnalysis?.id || drafts[0].id;
    const draftReportGroupId = currentAnalysis?.reportGroupId || drafts.find((item) => item.reportGroupId)?.reportGroupId || createReportGroupId();
    const draftReportDisplayId = currentAnalysis?.reportDisplayId || drafts.find((item) => item.reportDisplayId)?.reportDisplayId || currentAnalysis?.id || drafts[0].id;
    const optimisticItems = drafts.map((item, index) => ({
      ...item,
      id: index === 0 ? item.id : item.id || `${sourceAnalysisId}-${index + 1}`,
      reportGroupId: item.reportGroupId || draftReportGroupId,
      reportDisplayId: item.reportDisplayId || draftReportDisplayId,
      status: 'Complete' as AnalysisStatus,
    }));

    setAnalyses((prev) => {
      const replaceIds = new Set([sourceAnalysisId, ...optimisticItems.map((item) => item.id)]);
      const next = [...optimisticItems, ...prev.filter((item) => !replaceIds.has(item.id))];
      persistAnalysesForCurrentUser(next);
      return next;
    });
    setCurrentAnalysis(optimisticItems[0]);
    setReportFocusId(optimisticItems[0]?.id || '');
    setReportFocusGroupId(optimisticItems[0]?.reportGroupId || draftReportGroupId || '');
    setReportBackView('dashboard');
    setCurrentView('report');

    void (async () => {
      const savedItems: AnalysisData[] = [];
      const existingIds = new Set(analyses.map((item) => item.id));
      for (let index = 0; index < optimisticItems.length; index += 1) {
        const item = optimisticItems[index];
        const apiSaved = existingIds.has(item.id)
          ? await updateAnalysisInApi(item)
          : await createAnalysisInApi(item);

        savedItems.push({
          ...(apiSaved ?? item),
          reportGroupId: item.reportGroupId,
          reportDisplayId: item.reportDisplayId,
          reportName: item.reportName ?? apiSaved?.reportName,
          sampleId: item.sampleId ?? apiSaved?.sampleId,
          tags: item.tags ?? apiSaved?.tags,
          notes: item.notes ?? apiSaved?.notes,
          originalImage: apiSaved?.originalImage || item.originalImage,
          processedImage: apiSaved?.processedImage || item.processedImage,
          diameter: apiSaved?.diameter ?? item.diameter,
          measurements: item.measurements,
        });
      }

      setAnalyses((prev) => {
        const replaceIds = new Set([sourceAnalysisId, ...optimisticItems.map((item) => item.id)]);
        const next = [...savedItems, ...prev.filter((item) => !replaceIds.has(item.id))];
        persistAnalysesForCurrentUser(next);
        return next;
      });
      if (savedItems[0]) {
        setCurrentAnalysis(savedItems[0]);
        setReportFocusId(savedItems[0].id);
        setReportFocusGroupId(savedItems[0].reportGroupId || '');
      }
    })();
  };

  const deleteAnalysis = (id: string) => {
    const targetAnalysis = analyses.find((item) => item.id === id) || (currentAnalysis?.id === id ? currentAnalysis : null);
    const targetReportItems = targetAnalysis ? getRelatedReportAnalyses(targetAnalysis) : analyses.filter((item) => item.id === id);
    const deleteIds = new Set(targetReportItems.map((item) => item.id));
    if (deleteIds.size === 0 && id) deleteIds.add(id);

    const updatedAnalyses = analyses.filter((a) => !deleteIds.has(a.id));
    setAnalyses(updatedAnalyses);
    persistAnalysesForCurrentUser(updatedAnalyses);
    if (currentAnalysis && deleteIds.has(currentAnalysis.id)) {
      setCurrentAnalysis(null);
    }
    const deletedFocusedGroup = Boolean(
      reportFocusGroupId && targetReportItems.some((item) => item.reportGroupId === reportFocusGroupId),
    );
    if (deleteIds.has(reportFocusId) || deletedFocusedGroup) {
      setReportFocusId('');
      setReportFocusGroupId('');
    }
    setCurrentView('dashboard');
    void Promise.all(Array.from(deleteIds).map((analysisId) => deleteAnalysisInApi(analysisId)));
  };

  const handleApiError = (title: string, fallbackMessage: string, error: unknown) => {
    console.error(title, error);
    toast.error(title, { description: fallbackMessage });
  };

  const handleAccountControlLogin = async (username: string, password: string): Promise<string | null> => {
    try {
      const response = await apiRequest('/auth/account-control-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      const token = String(data?.data?.token || '');
      if (!data?.success || !token) {
        toast.error('Login Gagal', {
          description: data?.message || 'Control username atau password salah',
        });
        return null;
      }

      toast.success('Berhasil', { description: 'Control login berhasil' });
      return token;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return null;
    }
  };

  const loadAccountControlAccounts = async (
    token: string,
  ): Promise<{ admins: ManagedAdminAccount[]; members: ManagedMemberAccount[]; organizations: ManagedOrganizationOption[] } | null> => {
    try {
      const response = await apiRequest('/auth/account-control-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Gagal Memuat Akun', {
          description: data?.message || 'Tidak dapat memuat daftar akun',
        });
        return null;
      }

      const admins: ManagedAdminAccount[] = Array.isArray(data.data?.admins)
        ? data.data.admins.map((item: { id?: string; username?: string; organization_name?: string; last_login?: string | null }) => ({
            id: String(item.id || ''),
            username: String(item.username || ''),
            organizationName: String(item.organization_name || ''),
            lastLogin: item.last_login ?? null,
          }))
        : [];

      const members: ManagedMemberAccount[] = Array.isArray(data.data?.members)
        ? data.data.members.map((item: { id?: string; username?: string; organization_name?: string; team_name?: string; last_login?: string | null }) => ({
            id: String(item.id || ''),
            username: String(item.username || ''),
            organizationName: String(item.organization_name || ''),
            teamName: String(item.team_name || ''),
            lastLogin: item.last_login ?? null,
          }))
        : [];

      const organizations: ManagedOrganizationOption[] = Array.isArray(data.data?.organizations)
        ? data.data.organizations.map((item: {
            id?: string;
            name?: string;
            teams?: Array<{ id?: string; name?: string }>;
          }) => ({
            id: String(item.id || ''),
            name: String(item.name || ''),
            teams: Array.isArray(item.teams)
              ? item.teams.map((team) => ({
                  id: String(team.id || ''),
                  name: String(team.name || ''),
                }))
              : [],
          }))
        : [];

      return { admins, members, organizations };
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return null;
    }
  };

  const createControlledAccount = async (
    token: string,
    payload: {
      type: 'admin' | 'member';
      organizationId: string;
      teamId?: string;
      username: string;
      password: string;
    },
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/account-control-create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          type: payload.type,
          organization_id: payload.organizationId,
          team_id: payload.teamId || '',
          username: payload.username,
          password: payload.password,
        }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Gagal Menambah Akun', {
          description: data?.message || 'Tidak dapat menambah akun baru',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const updateControlledOrganization = async (
    token: string,
    organizationId: string,
    newName: string,
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/account-control-update-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          organization_id: organizationId,
          new_name: newName,
        }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Gagal Rename Organization', {
          description: data?.message || 'Tidak dapat memperbarui nama organization',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const deleteControlledOrganization = async (
    token: string,
    organizationId: string,
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/account-control-delete-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          organization_id: organizationId,
        }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Gagal Hapus Organization', {
          description: data?.message || 'Tidak dapat menghapus organization',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const updateControlledTeam = async (
    token: string,
    teamId: string,
    newName: string,
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/account-control-update-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          team_id: teamId,
          new_name: newName,
        }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Gagal Rename Team', {
          description: data?.message || 'Tidak dapat memperbarui nama team',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const deleteControlledTeam = async (
    token: string,
    teamId: string,
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/account-control-delete-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          team_id: teamId,
        }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Gagal Hapus Team', {
          description: data?.message || 'Tidak dapat menghapus team',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const deleteControlledAccount = async (
    token: string,
    type: 'admin' | 'member',
    accountId: string,
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/account-control-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type, account_id: accountId }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Gagal Hapus Akun', {
          description: data?.message || 'Tidak dapat menghapus akun',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const updateControlledAccountPassword = async (
    token: string,
    type: 'admin' | 'member',
    accountId: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/account-control-update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type, account_id: accountId, new_password: newPassword }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Gagal Update Password', {
          description: data?.message || 'Tidak dapat memperbarui password akun',
        });
        return false;
      }

      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const updateControlCredentials = async (
    token: string,
    currentPassword: string,
    newUsername: string,
    newPassword: string,
  ): Promise<{ token: string; username: string } | null> => {
    try {
      const response = await apiRequest('/auth/account-control-update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          current_password: currentPassword,
          new_username: newUsername,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      const nextToken = String(data?.data?.token || '');
      const nextUsername = String(data?.data?.username || '');

      if (!data?.success || !nextToken || !nextUsername) {
        toast.error('Gagal Update Control Account', {
          description: data?.message || 'Tidak dapat memperbarui username/password control',
        });
        return null;
      }

      return { token: nextToken, username: nextUsername };
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return null;
    }
  };

  const updateSelfAccount = async (
    role: Role,
    currentPassword: string,
    newUsername: string,
    newPassword?: string | null,
  ): Promise<{ username: string } | null> => {
    const activeUsername = role === 'admin' ? adminUsername.trim() : memberUsername.trim();
    if (!activeUsername) {
      toast.error('Session akun tidak valid');
      return null;
    }

    const nextPassword = String(newPassword ?? '').trim();

    try {
      const body: Record<string, unknown> = {
        role,
        current_username: activeUsername,
        current_password: currentPassword,
        new_username: newUsername,
      };

      if (nextPassword) {
        body.new_password = nextPassword;
      }

      const response = await apiRequest('/auth/account-self-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      const nextUsername = String(data?.data?.username || '').trim();
      if (!data?.success || !nextUsername) {
        toast.error('Gagal Update Akun', {
          description: data?.message || 'Tidak dapat memperbarui username/password akun',
        });
        return null;
      }

      if (role === 'admin') {
        const oldKey = getAnalysesStorageKey('admin', activeUsername);
        const newKey = getAnalysesStorageKey('admin', nextUsername);
        const stored = localStorage.getItem(oldKey);
        if (stored !== null && oldKey !== newKey) {
          localStorage.setItem(newKey, stored);
          localStorage.removeItem(oldKey);
        }

        setAdminUsername(nextUsername);
        saveSession({
          role: 'admin',
          username: nextUsername,
          organizationName,
          organizationId,
          adminId,
          organizationTeamNames,
          organizationMemberNames,
        });
      } else {
        const oldKey = getAnalysesStorageKey('member', activeUsername);
        const newKey = getAnalysesStorageKey('member', nextUsername);
        const stored = localStorage.getItem(oldKey);
        if (stored !== null && oldKey !== newKey) {
          localStorage.setItem(newKey, stored);
          localStorage.removeItem(oldKey);
        }

        setMemberUsername(nextUsername);
        saveSession({
          role: 'member',
          username: nextUsername,
          organizationName,
          organizationId,
          teamId,
          memberId,
          teamName: memberTeam,
        });
      }

      return { username: nextUsername };
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return null;
    }
  };

  const showDuplicateAccountToast = (kind: 'admin' | 'member') => {
    toast.error('Akun Sudah Ada', {
      description:
        kind === 'admin'
          ? 'Username admin sudah terdaftar di database. Gunakan username lain.'
          : 'Username member sudah terdaftar di database. Gunakan username lain.',
    });
  };

  const checkAccountExists = async (username: string, kind: 'admin' | 'member') => {
    try {
      const response = await apiRequest('/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, type: kind }),
      });

      const data = await response.json();
      return Boolean(data?.exists);
    } catch (error) {
      console.error('check-account failed:', error);
      return false;
    }
  };

  const registerOrganization = async (members: MemberData[]) => {
    if (!organizationName || !organizationAdmin || organizationTeams.length === 0) {
      toast.error('Error', { description: 'Data organisasi tidak lengkap' });
      return;
    }

    try {
      const response = await apiRequest('/auth/register-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: organizationName,
          admin: organizationAdmin,
          teams: organizationTeams,
          members,
        }),
      });

      const data = await response.json();
      if (!data?.success) {
        const message = String(data?.message || 'Gagal mendaftarkan organisasi').toLowerCase();

        if (message.includes('admin') && (message.includes('exists') || message.includes('sudah'))) {
          showDuplicateAccountToast('admin');
          return;
        }

        if (message.includes('member') && (message.includes('exists') || message.includes('sudah'))) {
          showDuplicateAccountToast('member');
          return;
        }

        if (message.includes('organization') && (message.includes('exists') || message.includes('sudah'))) {
          toast.error('Organisasi Sudah Ada', {
            description: 'Nama organisasi sudah terdaftar. Gunakan nama lain.',
          });
          return;
        }

        toast.error('Gagal', { description: data?.message || 'Gagal mendaftarkan organisasi' });
        return;
      }

      toast.success('Berhasil', { description: 'Organisasi berhasil didaftarkan' });
      setOrganizationName('');
      setOrganizationAdmin(null);
      setOrganizationTeams([]);
      setOrganizationTeamNames([]);
      setOrganizationMemberNames([]);
      setCurrentView('accountControl');
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
    }
  };

  const handleAdminLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Login Gagal', {
          description: data?.message || 'Username atau password salah',
        });
        return false;
      }

      const adminData = data.data?.admin ?? {};
      const adminIdValue = String(adminData.id || '').trim();
      const orgId = String(adminData.organization_id || '').trim();
      const teams = Array.isArray(data.data?.teams)
        ? data.data.teams.map((team: { name?: string }) => String(team.name || '').trim()).filter(Boolean)
        : [];
      const members = Array.isArray(data.data?.members)
        ? data.data.members
            .map((member: { username?: string }) => String(member.username || '').trim())
            .filter(Boolean)
        : [];

      const orgName = String(adminData.organization_name || '').trim();
      const adminName = String(adminData.username || username).trim();

      setCurrentRole('admin');
      setAdminUsername(adminName);
      setMemberUsername('');
      setMemberTeam('');
      setOrganizationName(orgName);
      setOrganizationId(orgId);
      setAdminId(adminIdValue);
      setOrganizationTeamNames(teams);
      setOrganizationMemberNames(members);
      const apiAnalyses = await loadAnalysesFromApi('admin', { organizationId: orgId, teamId: '', memberId: '' });
      const storedAnalyses = loadAnalysesFromStorage('admin', adminName);
      const nextAnalyses = apiAnalyses && apiAnalyses.length > 0
        ? mergeApiAnalysesWithStored(apiAnalyses, storedAnalyses)
        : storedAnalyses;
      setAnalyses(nextAnalyses);
      persistAnalysesSafely(getAnalysesStorageKey('admin', adminName), nextAnalyses);

      saveSession({
        role: 'admin',
        username: adminName,
        organizationName: orgName,
        organizationId: orgId,
        adminId: adminIdValue,
        organizationTeamNames: teams,
        organizationMemberNames: members,
      });

      toast.success('Berhasil', { description: 'Login admin berhasil' });
      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const handleMemberLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/auth/member-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!data?.success) {
        toast.error('Login Gagal', {
          description: data?.message || 'Username atau password salah',
        });
        return false;
      }

      const member = data.data?.member ?? {};
      const memberIdValue = String(member.id || '').trim();
      const orgId = String(member.organization_id || '').trim();
      const teamIdValue = String(member.team_id || '').trim();
      const orgName = String(member.organization_name || '').trim();
      const teamName = String(member.team_name || '').trim();
      const memberName = String(member.username || username).trim();

      setCurrentRole('member');
      setMemberUsername(memberName);
      setMemberTeam(teamName);
      setAdminUsername('');
      setOrganizationName(orgName);
      setOrganizationId(orgId);
      setTeamId(teamIdValue);
      setMemberId(memberIdValue);
      const apiAnalyses = await loadAnalysesFromApi('member', { organizationId: orgId, teamId: teamIdValue, memberId: memberIdValue });
      const storedAnalyses = loadAnalysesFromStorage('member', memberName);
      const nextAnalyses = apiAnalyses && apiAnalyses.length > 0
        ? mergeApiAnalysesWithStored(apiAnalyses, storedAnalyses)
        : storedAnalyses;
      setAnalyses(nextAnalyses);
      persistAnalysesSafely(getAnalysesStorageKey('member', memberName), nextAnalyses);
      saveSession({
        role: 'member',
        username: memberName,
        organizationName: orgName,
        organizationId: orgId,
        teamId: teamIdValue,
        memberId: memberIdValue,
        teamName,
      });

      toast.success('Berhasil', { description: 'Login berhasil' });
      return true;
    } catch (error) {
      handleApiError('Error', 'Tidak dapat terhubung ke server', error);
      return false;
    }
  };

  const openAntibiotics = (from: 'dashboard' | 'adminDashboard' | 'settings') => {
    setAntibioticsBackView(from);
    setCurrentView('antibiotics');
  };

  const getBackTarget = (
    view: View,
    role: Role | null,
    antibioticsBack: 'dashboard' | 'adminDashboard' | 'settings',
    cameraBack: View,
    reportCreateBack: View,
    reportBack: View,
  ) => {
    switch (view) {
      case 'userLogin':
      case 'adminLogin':
        return 'login' as View;
      case 'createOrganizationName':
        return 'accountControl' as View;
      case 'createOrganizationAdmin':
        return 'createOrganizationName' as View;
      case 'createOrganizationTeam':
        return 'createOrganizationAdmin' as View;
      case 'createOrganizationMember':
        return 'createOrganizationTeam' as View;
      case 'organizationNameEdit':
      case 'organizationTeamEdit':
      case 'organizationTeamAdd':
      case 'organizationMemberEdit':
      case 'organizationMemberAdd':
        return 'adminDashboard' as View;
      case 'camera':
        return cameraBack;
      case 'reportCreate':
        return reportCreateBack;
      case 'report':
        return reportBack;
      case 'history':
        return 'dashboard' as View;
      case 'analytics':
        return (role === 'admin' ? 'adminDashboard' : 'dashboard') as View;
      case 'logout':
      case 'settings':
        return (role === 'admin' ? 'adminDashboard' : 'dashboard') as View;
      case 'antibiotics':
        return antibioticsBack as View;
      case 'dashboard':
      case 'adminDashboard':
      case 'accountControl':
      case 'login':
        return null;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let disposed = false;
    let listener: { remove: () => Promise<void> } | null = null;

    const registerListener = async () => {
      try {
        const registeredListener = await CapacitorApp.addListener('backButton', () => {
          const activeView = currentViewRef.current;

          if (activeView === 'accountControl') {
            return;
          }

          const target = getBackTarget(
            activeView,
            currentRoleRef.current,
            antibioticsBackViewRef.current,
            cameraBackViewRef.current,
            reportCreateBackViewRef.current,
            reportBackViewRef.current,
          );

          if (target) {
            setCurrentView(target);
            return;
          }

          if (activeView !== 'dashboard' && activeView !== 'adminDashboard') {
            return;
          }

          const now = Date.now();
          if (now - lastBackPressAtRef.current < 1800) return;

          lastBackPressAtRef.current = now;
          toast.info('Sudah di halaman utama', {
            description: 'Gunakan tombol Home Android untuk meninggalkan aplikasi.',
          });
        });

        if (disposed) {
          void registeredListener.remove();
          return;
        }

        listener = registeredListener;
      } catch (error) {
        console.error('Failed to register back button listener:', error);
      }
    };

    void registerListener();

    return () => {
      disposed = true;
      if (listener) {
        void listener.remove();
      }
    };
  }, []);

  const analyticsTitle = currentRole === 'admin' ? 'Organization Analytics' : 'Member Analytics';
  const analyticsSubtitle =
    currentRole === 'admin'
      ? (organizationName || 'Organization summary')
      : `${memberUsername || 'Member'}${memberTeam ? ` - ${memberTeam}` : ''}`;
  const analyticsUpdatedLabel = analyticsUpdatedAt
    ? analyticsUpdatedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;
  const getRelatedReportAnalyses = (analysis: AnalysisData) => {
    const groupKey = getAnalysisGroupKey(analysis);
    const grouped = analyses
      .filter((item) => getAnalysisGroupKey(item) === groupKey)
      .sort(compareAnalysesBySampleOrder);

    if (!analysis.reportGroupId && grouped.length > 1) {
      const selectedBacteria = (analysis.bacteriaName || '').trim().toLowerCase();
      const nonEmptyBacteria = new Set(
        grouped
          .map((item) => (item.bacteriaName || '').trim().toLowerCase())
          .filter(Boolean),
      );

      if (selectedBacteria) {
        const sameBacteriaGroup = grouped.filter((item) => {
          const bacteriaName = (item.bacteriaName || '').trim().toLowerCase();
          return bacteriaName === selectedBacteria;
        });
        return sameBacteriaGroup.length > 0 ? sameBacteriaGroup : [analysis];
      }

      if (nonEmptyBacteria.size > 1) return [analysis];
    }

    return grouped.length > 0 ? grouped : [analysis];
  };
  const resolveFocusedAnalysis = (fallback: AnalysisData | null) => {
    const focusId = fallback?.id || reportFocusId;
    if (focusId) {
      const matchedById = analyses.find((item) => item.id === focusId);
      if (matchedById) return matchedById;
    }

    const focusGroupId = fallback?.reportGroupId || reportFocusGroupId;
    if (focusGroupId) {
      const matchedByGroup = analyses.find((item) => item.reportGroupId === focusGroupId);
      if (matchedByGroup) return matchedByGroup;
    }

    return fallback;
  };
  const activeHomeView: View = currentRole === 'admin' ? 'adminDashboard' : 'dashboard';
  const reportCreateAnalysis = currentView === 'reportCreate' ? resolveFocusedAnalysis(currentAnalysis) : currentAnalysis;
  const reportCreateBacteriaOptions = useMemo(
    () => Array.from(
      new Set(
        analyses
          .map((item) => (item.bacteriaName || '').trim())
          .filter(Boolean),
      ),
    ).sort((first, second) => first.localeCompare(second)),
    [analyses],
  );
  const reportScreenAnalysis = currentView === 'report' ? resolveFocusedAnalysis(currentAnalysis) : currentAnalysis;
  const memberBottomNavViews: View[] = ['dashboard', 'history', 'antibiotics', 'analytics', 'settings'];
  const showMemberBottomNav = currentRole === 'member' && memberBottomNavViews.includes(currentView);
  const openMemberTab = (target: View) => {
    if (target === 'antibiotics') {
      setAntibioticsBackView('dashboard');
    }
    setCurrentView(target);
  };
  const memberBottomNavItems = [
    { view: 'dashboard' as View, label: 'Home', icon: Home },
    { view: 'history' as View, label: 'History', icon: HistoryIcon },
    { view: 'antibiotics' as View, label: 'AB DB', icon: BookOpen },
    { view: 'analytics' as View, label: 'Analytics', icon: BarChart3 },
    { view: 'settings' as View, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className={`min-h-screen bg-gray-50${showMemberBottomNav ? ' bio-has-member-bottom-nav' : ''}`}>
      <Toaster />
      <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
            Loading...
          </div>
        }
      >
      {currentView === 'login' && (
        <Login
          onLogin={() => setCurrentView('userLogin')}
          onAdminLogin={() => setCurrentView('adminLogin')}
          onAccountControl={() => setCurrentView('accountControl')}
        />
      )}

      {currentView === 'accountControl' && (
        <AccountControl
          onBack={() => setCurrentView('login')}
          onCreateOrganization={() => setCurrentView('createOrganizationName')}
          onLogin={handleAccountControlLogin}
          onLoadAccounts={loadAccountControlAccounts}
          onCreateAccount={createControlledAccount}
          onUpdateOrganization={updateControlledOrganization}
          onDeleteOrganization={deleteControlledOrganization}
          onUpdateTeam={updateControlledTeam}
          onDeleteTeam={deleteControlledTeam}
          onDeleteAccount={deleteControlledAccount}
          onUpdatePassword={updateControlledAccountPassword}
          onUpdateControlCredentials={updateControlCredentials}
        />
      )}

      {currentView === 'userLogin' && (
        <UserLogin
          onBack={() => setCurrentView('login')}
          onConfirm={() => setCurrentView('dashboard')}
          onLogin={handleMemberLogin}
        />
      )}

      {currentView === 'adminLogin' && (
        <AdminLogin
          onBack={() => setCurrentView('login')}
          onConfirm={() => setCurrentView('adminDashboard')}
          onLogin={handleAdminLogin}
        />
      )}

      {currentView === 'createOrganizationName' && (
        <CreateOrganizationName
          onBack={() => setCurrentView('accountControl')}
          onAddOrganization={(name) => {
            setOrganizationName(name);
            setCurrentView('createOrganizationAdmin');
          }}
        />
      )}

      {currentView === 'createOrganizationAdmin' && (
        <CreateOrganizationAdmin
          onBack={() => setCurrentView('createOrganizationName')}
          onConfirm={async (adminData) => {
            const exists = await checkAccountExists(adminData.username, 'admin');
            if (exists) {
              showDuplicateAccountToast('admin');
              return false;
            }

            setOrganizationAdmin(adminData);
            setCurrentView('createOrganizationTeam');
            return true;
          }}
        />
      )}

      {currentView === 'createOrganizationTeam' && (
        <CreateOrganizationTeam
          onBack={() => setCurrentView('createOrganizationAdmin')}
          initialTeams={organizationTeams}
          onConfirm={(teams) => {
            setOrganizationTeams(teams);
            setCurrentView('createOrganizationMember');
          }}
        />
      )}

      {currentView === 'createOrganizationMember' && (
        <CreateOrganizationMember
          onBack={() => setCurrentView('createOrganizationTeam')}
          teams={organizationTeams}
          onConfirm={(members) => {
            void registerOrganization(members);
          }}
        />
      )}

      {currentView === 'organizationNameEdit' && (
        <OrganizationNameEdit
          organizationName={organizationName}
          onBack={() => setCurrentView('adminDashboard')}
          onSaveOrganizationName={(newName) => setOrganizationName(newName)}
          onDeleteOrganization={() => {
            setOrganizationName('');
            setOrganizationTeamNames([]);
            setOrganizationMemberNames([]);
            clearSession();
            setCurrentView('login');
          }}
        />
      )}

      {currentView === 'organizationTeamEdit' && (
        <OrganizationTeamEdit
          onBack={() => setCurrentView('adminDashboard')}
          teamName={organizationTeamNames[selectedTeamIndex] ?? ''}
          onSaveTeamName={(newName) => {
            setOrganizationTeamNames((prev) =>
              prev.map((team, index) => (index === selectedTeamIndex ? newName : team)),
            );
          }}
          onDeleteTeam={() => {
            setOrganizationTeamNames((prev) => prev.filter((_, idx) => idx !== selectedTeamIndex));
            setCurrentView('adminDashboard');
          }}
        />
      )}

      {currentView === 'organizationTeamAdd' && (
        <OrganizationTeamEdit
          onBack={() => setCurrentView('adminDashboard')}
          teamName=""
          onSaveTeamName={(newName) => {
            const trimmed = newName.trim();
            if (!trimmed) return;
            setOrganizationTeamNames((prev) => [...prev, trimmed]);
            setCurrentView('adminDashboard');
          }}
          startInAddMode
        />
      )}

      {currentView === 'organizationMemberEdit' && (
        <OrganizationMemberEdit
          onBack={() => setCurrentView('adminDashboard')}
          memberName={organizationMemberNames[selectedMemberIndex] ?? ''}
          onSaveMemberName={(newName) => {
            setOrganizationMemberNames((prev) =>
              prev.map((member, index) => (index === selectedMemberIndex ? newName : member)),
            );
          }}
          onDeleteMember={() => {
            setOrganizationMemberNames((prev) => prev.filter((_, idx) => idx !== selectedMemberIndex));
            setCurrentView('adminDashboard');
          }}
        />
      )}

      {currentView === 'organizationMemberAdd' && (
        <OrganizationMemberEdit
          onBack={() => setCurrentView('adminDashboard')}
          memberName=""
          onSaveMemberName={(newName) => {
            const trimmed = newName.trim();
            if (!trimmed) return;
            setOrganizationMemberNames((prev) => [...prev, trimmed]);
            setCurrentView('adminDashboard');
          }}
          startInAddMode
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard
          analyses={analyses}
          memberUsername={memberUsername}
          memberTeam={memberTeam}
          memberOrganization={organizationName}
          onStartAnalysis={startNewAnalysis}
          onViewHistory={() => setCurrentView('history')}
          onViewReport={viewReport}
          onViewSettings={() => setCurrentView('settings')}
          onViewAntibiotics={() => openAntibiotics('dashboard')}
          onViewAnalytics={() => setCurrentView('analytics')}
        />
      )}

      {currentView === 'adminDashboard' && (
        <AdminDashboard
          adminUsername={adminUsername}
          organizationName={organizationName}
          organizationTeamNames={organizationTeamNames}
          organizationMemberNames={organizationMemberNames}
          onEditOrganizationName={() => setCurrentView('organizationNameEdit')}
          onEditOrganizationTeamItem={(index: number) => {
            setSelectedTeamIndex(index);
            setCurrentView('organizationTeamEdit');
          }}
          onEditOrganizationMemberItem={(index: number) => {
            setSelectedMemberIndex(index);
            setCurrentView('organizationMemberEdit');
          }}
          onAddOrganizationTeam={() => setCurrentView('organizationTeamAdd')}
          onAddOrganizationMember={() => setCurrentView('organizationMemberAdd')}
          onViewSettings={() => setCurrentView('settings')}
          onViewAnalytics={() => setCurrentView('analytics')}
          onLogout={() => {
            clearSession();
            setCurrentView('login');
          }}
        />
      )}

      {currentView === 'analytics' && (
        <AnalyticsDashboard
          variant={currentRole === 'admin' ? 'admin' : 'member'}
          title={analyticsTitle}
          subtitle={analyticsSubtitle}
          autoRefreshSeconds={Math.floor(ANALYTICS_AUTO_REFRESH_MS / 1000)}
          trendUnit={analyticsTrendUnit}
          data={analyticsData}
          analyses={analyses}
          isLoading={analyticsLoading}
          lastUpdatedLabel={analyticsUpdatedLabel}
          errorMessage={analyticsError}
          onBack={() => setCurrentView(currentRole === 'admin' ? 'adminDashboard' : 'dashboard')}
          onRefresh={() => {
            void loadAnalyticsFromApi(analyticsTrendUnit);
          }}
          onChangeTrend={(value) => {
            setAnalyticsTrendUnit(value);
            void loadAnalyticsFromApi(value);
          }}
          onStartAnalysis={startNewAnalysis}
        />
      )}

      {currentView === 'logout' && (
        <LogOut
          onCancel={() => setCurrentView('dashboard')}
          onLogOut={() => {
            clearSession();
            setCurrentView('login');
          }}
        />
      )}

      {currentView === 'camera' && (
        <Camera
          onPhotoTaken={(processedImage, originalImage) => {
            void handlePhotoTaken(processedImage, 'dashboard', originalImage);
          }}
          onBack={() => setCurrentView(cameraBackView)}
          onStartProcessing={() => setCurrentView('processing')}
        />
      )}

      {currentView === 'processing' && (
        <HomographyProcessing />
      )}

      {currentView === 'reportCreate' && reportCreateAnalysis && (
        <ReportCreate
          analysis={reportCreateAnalysis}
          relatedAnalyses={getRelatedReportAnalyses(reportCreateAnalysis)}
          availableBacteriaOptions={reportCreateBacteriaOptions}
          initialSampleId={reportCreateAnalysis.id}
          onBack={() => setCurrentView(reportCreateBackView)}
          onConfirm={(updated: AnalysisData | AnalysisData[]) => {
            confirmReportCreate(updated);
          }}
          onRetake={retakeCurrentAnalysis}
        />
      )}

      {currentView === 'reportCreate' && !reportCreateAnalysis && (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">Report draft missing</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Draft report tidak ditemukan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Data draft belum siap atau sudah terhapus. Kembali ke dashboard lalu coba analisis ulang.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button className="w-full" onClick={() => setCurrentView(activeHomeView)}>
                Kembali ke Dashboard
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { void startNewAnalysis(); }}>
                Mulai Analisis Lagi
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'report' && reportScreenAnalysis && (
        <Report
          analysis={reportScreenAnalysis}
          relatedAnalyses={getRelatedReportAnalyses(reportScreenAnalysis)}
          onBack={() => setCurrentView(reportBackView)}
          onGoDashboard={() => setCurrentView(activeHomeView)}
          onEdit={editCurrentReport}
          onEditSample={editReportSample}
          onDelete={deleteAnalysis}
        />
      )}

      {currentView === 'report' && !reportScreenAnalysis && (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">Report unavailable</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Report tidak bisa dibuka</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Referensi report hilang sesaat setelah confirm. Aplikasi sekarang menampilkan fallback ini daripada layar putih kosong.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button className="w-full" onClick={() => setCurrentView(reportBackView === 'history' ? 'history' : activeHomeView)}>
                Kembali
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setCurrentView('history')}>
                Buka History
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'history' && (
        <History analyses={analyses} onViewReport={viewReport} onBack={() => setCurrentView('dashboard')} onStartAnalysis={startNewAnalysis} />
      )}

      {currentView === 'settings' && (
        <Settings
          onBack={() => setCurrentView(currentRole === 'admin' ? 'adminDashboard' : 'dashboard')}
          onViewAntibiotics={() => openAntibiotics('settings')}
          currentRole={currentRole}
          currentUsername={currentRole === 'admin' ? adminUsername : memberUsername}
          onUpdateSelfAccount={updateSelfAccount}
          onLogout={() => {
            clearSession();
            setCurrentView('login');
          }}
        />
      )}

      {currentView === 'antibiotics' && (
        <AntibioticsReference onBack={() => setCurrentView(antibioticsBackView)} />
      )}

      {showMemberBottomNav && (
        <nav className="bio-member-bottom-nav" aria-label="Member navigation">
          {memberBottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                type="button"
                className={`bio-member-bottom-nav-item${active ? ' bio-member-bottom-nav-item-active' : ''}`}
                onClick={() => openMemberTab(item.view)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="bio-member-bottom-nav-icon" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
      </Suspense>
      </ErrorBoundary>
    </div>
  );
}
