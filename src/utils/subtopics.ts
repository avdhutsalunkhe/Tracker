export interface SubtopicItem {
  id: string;
  title: string;
  done: boolean;
  covered_date?: string | null;
  children?: SubtopicItem[];
}

function normalizeNode(x: unknown, idx: number, prefix = 'sub'): SubtopicItem | null {
  if (!x || typeof x !== 'object') return null;
  const obj = x as Record<string, unknown>;
  if (typeof obj.title !== 'string') return null;

  const id = typeof obj.id === 'string' ? obj.id : `${prefix}-${idx}`;
  const rawChildren = Array.isArray(obj.children) ? obj.children : [];
  const children = rawChildren
    .map((c, cIdx) => normalizeNode(c, cIdx, id))
    .filter((c): c is SubtopicItem => c !== null);

  return {
    id,
    title: obj.title,
    done: Boolean(obj.done),
    covered_date: typeof obj.covered_date === 'string' && obj.covered_date ? obj.covered_date : null,
    ...(children.length > 0 ? { children } : {}),
  };
}

export function parseSubtopics(raw?: string | null): SubtopicItem[] {
  if (!raw || !raw.trim()) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x, idx) => normalizeNode(x, idx))
          .filter((x): x is SubtopicItem => x !== null);
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

export function countSubtopics(items: SubtopicItem[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const item of items) {
    total += 1;
    if (item.done) done += 1;
    if (item.children && item.children.length > 0) {
      const childCounts = countSubtopics(item.children);
      done += childCounts.done;
      total += childCounts.total;
    }
  }
  return { done, total };
}

export function flattenSubtopicTitles(items: SubtopicItem[], prefix = ''): string[] {
  const result: string[] = [];
  for (const item of items) {
    const label = prefix ? `${prefix} > ${item.title}` : item.title;
    result.push(label);
    if (item.children && item.children.length > 0) {
      result.push(...flattenSubtopicTitles(item.children, label));
    }
  }
  return result;
}

export function toggleSubtopicInTree(
  items: SubtopicItem[],
  id: string,
  todayStr: string
): SubtopicItem[] {
  return items.map((item) => {
    if (item.id === id) {
      const nextDone = !item.done;
      return {
        ...item,
        done: nextDone,
        covered_date: nextDone ? item.covered_date || todayStr : item.covered_date,
      };
    }
    if (item.children && item.children.length > 0) {
      return { ...item, children: toggleSubtopicInTree(item.children, id, todayStr) };
    }
    return item;
  });
}

export function updateSubtopicDateInTree(
  items: SubtopicItem[],
  id: string,
  dateValue: string
): SubtopicItem[] {
  return items.map((item) => {
    if (item.id === id) {
      return { ...item, covered_date: dateValue || null };
    }
    if (item.children && item.children.length > 0) {
      return { ...item, children: updateSubtopicDateInTree(item.children, id, dateValue) };
    }
    return item;
  });
}

export function addChildSubtopicInTree(
  items: SubtopicItem[],
  parentId: string,
  child: SubtopicItem
): SubtopicItem[] {
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...(item.children || []), child] };
    }
    if (item.children && item.children.length > 0) {
      return { ...item, children: addChildSubtopicInTree(item.children, parentId, child) };
    }
    return item;
  });
}

export function removeSubtopicInTree(items: SubtopicItem[], id: string): SubtopicItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) =>
      item.children && item.children.length > 0
        ? { ...item, children: removeSubtopicInTree(item.children, id) }
        : item
    );
}
