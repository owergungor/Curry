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
  // Profile actions and keyed rendering both identify profiles by id. Legacy
  // settings can contain duplicate IDs, which otherwise aborts Svelte's each
  // block before the Apps view can render.
  const seenIds = new Set<string>();
  const uniqueProfiles = profiles.filter((profile) => {
    if (seenIds.has(profile.id)) return false;
    seenIds.add(profile.id);
    return true;
  });
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = normalizedQuery
    ? uniqueProfiles.filter((profile) =>
        profile.applicationName.toLocaleLowerCase().includes(normalizedQuery) ||
        profile.executableName.toLocaleLowerCase().includes(normalizedQuery),
      )
    : [...uniqueProfiles];

  if (order === 'new') return filtered.reverse();
  if (order === 'old') return filtered;

  return filtered.sort((a, b) => {
    const result = a.applicationName.localeCompare(b.applicationName, undefined, { sensitivity: 'base' });
    return order === 'za' ? -result : result;
  });
}
