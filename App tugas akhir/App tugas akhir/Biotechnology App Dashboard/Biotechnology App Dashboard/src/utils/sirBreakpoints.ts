import table2ARaw from '../../../../../../Table 2A.csv?raw';

export type SirAutoResult = 'RESISTEN' | 'RENTAN' | 'INTERMEDIAT';

type CsvRecord = Record<string, string>;

type SirBreakpoint = {
	bacteriaTarget: string;
	antimicrobialAgent: string;
	displayAgent: string;
	agentKeys: string[];
	targetKey: string;
	susceptibleMin?: number;
	sddMin?: number;
	sddMax?: number;
	intermediateMin?: number;
	intermediateMax?: number;
	resistantMax?: number;
	commentsKey: string;
};

const compactWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeKey = (value: string) => compactWhitespace(
	value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/β/g, ' beta ')
		.replace(/[^a-z0-9]+/g, ' '),
);

const normalizeAgentKey = (value: string) => normalizeKey(value)
	.replace(/\bamoxicilin\b/g, 'amoxicillin')
	.replace(/\bclabulanate\b/g, 'clavulanate')
	.replace(/\bampicilin\b/g, 'ampicillin')
	.replace(/\bsubactam\b/g, 'sulbactam')
	.replace(/\bpiperacilin\b/g, 'piperacillin')
	.replace(/\bticarcilin\b/g, 'ticarcillin');

const stripParenthetical = (value: string) => value.replace(/\([^)]*\)/g, ' ');

const parseCsvRows = (raw: string): string[][] => {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let index = 0; index < raw.length; index += 1) {
		const char = raw[index];
		const nextChar = raw[index + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				field += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === ',' && !inQuotes) {
			row.push(field);
			field = '';
			continue;
		}

		if ((char === '\n' || char === '\r') && !inQuotes) {
			if (char === '\r' && nextChar === '\n') {
				index += 1;
			}
			row.push(field);
			if (row.some((value) => value.trim().length > 0)) {
				rows.push(row);
			}
			row = [];
			field = '';
			continue;
		}

		field += char;
	}

	row.push(field);
	if (row.some((value) => value.trim().length > 0)) {
		rows.push(row);
	}

	return rows;
};

const parseCsvRecords = (raw: string): CsvRecord[] => {
	const rows = parseCsvRows(raw);
	const header = rows[0]?.map((value) => value.trim()) ?? [];
	if (header.length === 0) return [];

	return rows.slice(1).map((values) => header.reduce<CsvRecord>((record, column, index) => {
		record[column] = values[index]?.trim() ?? '';
		return record;
	}, {}));
};

const parseNumber = (value?: string) => {
	const normalized = String(value ?? '').trim().replace(',', '.');
	if (!normalized || normalized === '-') return undefined;
	const parsed = Number.parseFloat(normalized);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const uniqueStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const createAgentKeys = (agent: string) => uniqueStrings([
	normalizeAgentKey(agent),
	normalizeAgentKey(stripParenthetical(agent)),
]);

const createLookupAgentKeys = (agent: string) => {
	const keys = createAgentKeys(agent);
	if (keys.includes('amoxicillin')) {
		keys.push('ampicillin');
	}
	return uniqueStrings(keys);
};

const createBreakpoint = (record: CsvRecord): SirBreakpoint | null => {
	const bacteriaTarget = record['Bakteri Target'] ?? '';
	const antimicrobialAgent = record['Antimicrobial Agent'] ?? '';
	if (!bacteriaTarget || !antimicrobialAgent) return null;

	const breakpoint: SirBreakpoint = {
		bacteriaTarget,
		antimicrobialAgent,
		displayAgent: compactWhitespace(antimicrobialAgent),
		agentKeys: createAgentKeys(antimicrobialAgent),
		targetKey: normalizeKey(bacteriaTarget),
		susceptibleMin: parseNumber(record['Zone Diameter IC - S']),
		sddMin: parseNumber(record['Zone Diameter IC - SDD - BB']),
		sddMax: parseNumber(record['Zone Diameter IC - SDD - BA']),
		intermediateMin: parseNumber(record['Zone Diameter IC - I - BB']),
		intermediateMax: parseNumber(record['Zone Diameter IC - I - BA']),
		resistantMax: parseNumber(record['Zone Diameter IC - R']),
		commentsKey: normalizeKey(record.Comments ?? ''),
	};

	const hasZoneBreakpoint = [
		breakpoint.susceptibleMin,
		breakpoint.sddMin,
		breakpoint.sddMax,
		breakpoint.intermediateMin,
		breakpoint.intermediateMax,
		breakpoint.resistantMax,
	].some((value) => typeof value === 'number');

	return hasZoneBreakpoint ? breakpoint : null;
};

const SIR_BREAKPOINTS = parseCsvRecords(table2ARaw)
	.map(createBreakpoint)
	.filter((breakpoint): breakpoint is SirBreakpoint => Boolean(breakpoint));

export const sirAntibioticOptions = Array.from(
	new Map(SIR_BREAKPOINTS.map((breakpoint) => [normalizeAgentKey(breakpoint.displayAgent), breakpoint.displayAgent])).values(),
).sort((first, second) => first.localeCompare(second));

const enterobacteriaceaeAliases = [
	'enterobacteriaceae',
	'escherichia coli',
	'e coli',
	'ecoli',
	'klebsiella',
	'k pneumoniae',
	'proteus',
	'p mirabilis',
	'salmonella',
	'shigella',
	'enterobacter',
	'citrobacter',
	'morganella',
	'providencia',
	'serratia',
	'yersinia',
];

const isEnterobacteriaceae = (bacteriaKey: string) => enterobacteriaceaeAliases.some((alias) => bacteriaKey.includes(alias));
const isEColi = (bacteriaKey: string) => bacteriaKey.includes('e coli') || bacteriaKey.includes('ecoli') || bacteriaKey.includes('escherichia coli');
const isSalmonella = (bacteriaKey: string) => bacteriaKey.includes('salmonella');

const bacteriaMatches = (breakpoint: SirBreakpoint, bacteriaKey: string) => {
	if (!bacteriaKey) return false;
	if (breakpoint.targetKey === bacteriaKey) return true;
	if (breakpoint.targetKey === 'enterobacteriaceae') return isEnterobacteriaceae(bacteriaKey);
	return bacteriaKey.includes(breakpoint.targetKey) || breakpoint.targetKey.includes(bacteriaKey);
};

const commentAllowsBacteria = (breakpoint: SirBreakpoint, bacteriaKey: string) => {
	if (breakpoint.commentsKey.includes('except for salmonella') && isSalmonella(bacteriaKey)) return false;
	if (
		breakpoint.commentsKey.includes('salmonella spp')
		&& !breakpoint.commentsKey.includes('except for salmonella')
		&& !isSalmonella(bacteriaKey)
	) {
		return false;
	}
	if (breakpoint.commentsKey.includes('e coli urinary tract isolates only') && !isEColi(bacteriaKey)) return false;
	return true;
};

const breakpointScore = (breakpoint: SirBreakpoint, bacteriaKey: string, agentKeys: string[]) => {
	let score = 0;
	if (breakpoint.agentKeys.some((key) => agentKeys.includes(key))) score -= 10;
	if (breakpoint.targetKey === bacteriaKey) score -= 20;
	if (isSalmonella(bacteriaKey) && breakpoint.commentsKey.includes('salmonella spp')) score -= 8;
	if (breakpoint.commentsKey.includes('urinary tract isolates only')) score += 2;
	return score;
};

const findBreakpoint = (bacteriaName: string, antibiotic: string) => {
	const bacteriaKey = normalizeKey(bacteriaName);
	const agentKeys = createLookupAgentKeys(antibiotic);
	if (!bacteriaKey || agentKeys.length === 0) return undefined;

	return SIR_BREAKPOINTS
		.filter((breakpoint) => breakpoint.agentKeys.some((key) => agentKeys.includes(key)))
		.filter((breakpoint) => bacteriaMatches(breakpoint, bacteriaKey))
		.filter((breakpoint) => commentAllowsBacteria(breakpoint, bacteriaKey))
		.sort((first, second) => breakpointScore(first, bacteriaKey, agentKeys) - breakpointScore(second, bacteriaKey, agentKeys))[0];
};

const isInRange = (value: number, min?: number, max?: number) => (
	typeof min === 'number' && typeof max === 'number' && value >= min && value <= max
);

export const inferSirResult = ({
	bacteriaName,
	antibiotic,
	diameterMm,
}: {
	bacteriaName: string;
	antibiotic: string;
	diameterMm?: number;
}): SirAutoResult | '' => {
	if (typeof diameterMm !== 'number' || !Number.isFinite(diameterMm)) return '';
	const breakpoint = findBreakpoint(bacteriaName, antibiotic);
	if (!breakpoint) return '';

	const diameter = Math.round(diameterMm);
	if (typeof breakpoint.susceptibleMin === 'number' && diameter >= breakpoint.susceptibleMin) return 'RENTAN';
	if (typeof breakpoint.resistantMax === 'number' && diameter <= breakpoint.resistantMax) return 'RESISTEN';
	if (isInRange(diameter, breakpoint.intermediateMin, breakpoint.intermediateMax)) return 'INTERMEDIAT';
	if (isInRange(diameter, breakpoint.sddMin, breakpoint.sddMax)) return 'INTERMEDIAT';

	return '';
};