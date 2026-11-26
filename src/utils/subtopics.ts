export interface SubtopicItem {
  id: string;
  title: string;
  done: boolean;
  covered_date?: string | null;
}

export function parseSubtopics(raw?: string | null): SubtopicItem[] {
  if (!raw || !raw.trim()) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((x) => x && typeof x.title === 'string')
          .map((x, idx) => ({
            id: typeof x.id === 'string' ? x.id : `sub-${idx}`,
            title: x.title,
            done: Boolean(x.done),
            covered_date: typeof x.covered_date === 'string' && x.covered_date ? x.covered_date : null,
          }));
      }
    } catch {
      // Fall through to plain text
    }
  }
  return [{ id: 'sub-0', title: trimmed, done: false, covered_date: null }];
}

export function serializeSubtopics(items: SubtopicItem[]): string | null {
  if (!items || items.length === 0) return null;
  return JSON.stringify(items);
}
