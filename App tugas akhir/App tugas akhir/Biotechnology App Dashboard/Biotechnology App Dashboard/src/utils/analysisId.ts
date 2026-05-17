export const compactReportId = (id: string) => {
  const trimmed = typeof id === 'string' ? id.trim() : '';
  if (!trimmed) return '-';

  const withoutPrefix = trimmed.startsWith('AN_') ? trimmed.slice(3) : trimmed;
  const alphanumeric = withoutPrefix.replace(/[^a-zA-Z0-9]/g, '');
  if (!alphanumeric) return withoutPrefix || trimmed;

  if (alphanumeric.length <= 8) {
    return alphanumeric.toUpperCase();
  }

  return alphanumeric.slice(-8).toUpperCase();
};
