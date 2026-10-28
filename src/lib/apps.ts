export interface SortableApplicationProfile {
  id: string;
  applicationName: string;
  executableName: string;
}

export type ApplicationSortOrder = 'az' | 'za' | 'new' | 'old';

/**
 * Sort profiles without inventing install dates. The persisted profile array is
 * insertion ordered: scans append newly discovered profiles, so New/Old use
 * that order as a deterministic proxy (reverse/forward respectively).
 */
export function filterAndSortProfiles<T extends SortableApplicationProfile>(
  profiles: readonly T[],
  query: string,
  order: ApplicationSortOrder,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = normalizedQuery
    ? profiles.filter((profile) =>
        profile.applicationName.toLocaleLowerCase().includes(normalizedQuery) ||
        profile.executableName.toLocaleLowerCase().includes(normalizedQuery),
      )
    : [...profiles];

  if (order === 'new') return filtered.reverse();
  if (order === 'old') return filtered;

  return filtered.sort((a, b) => {
    const result = a.applicationName.localeCompare(b.applicationName, undefined, { sensitivity: 'base' });
    return order === 'za' ? -result : result;
  });
}
