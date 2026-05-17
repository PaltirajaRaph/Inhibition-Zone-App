/**
 * Utility functions for API response data transformation and normalization.
 * Reduces code duplication in App.tsx for common data mapping patterns.
 */

export const mapAdminAccount = (item: any) => ({
  id: String(item?.id || ''),
  username: String(item?.username || ''),
  organizationName: String(item?.organization_name || ''),
  lastLogin: item?.last_login ?? null,
});

export const mapMemberAccount = (item: any) => ({
  id: String(item?.id || ''),
  username: String(item?.username || ''),
  organizationName: String(item?.organization_name || ''),
  teamName: String(item?.team_name || ''),
  lastLogin: item?.last_login ?? null,
});

export const mapOrganization = (item: any) => ({
  id: String(item?.id || ''),
  name: String(item?.name || ''),
  teams: Array.isArray(item?.teams)
    ? item.teams.map((team: any) => ({
        id: String(team?.id || ''),
        name: String(team?.name || ''),
      }))
    : [],
});

export const toArrayIfNeeded = <T,>(value: T[] | unknown): T[] => {
  return Array.isArray(value) ? value : [];
};

export const toStringTrimmed = (value: unknown): string => {
  return String(value || '').trim();
};
