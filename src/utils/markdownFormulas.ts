export interface ParsedMarkdownFormula {
  title: string;
  body: string;
}

const TOPIC_START_DATES_KEY = 'avdhut_topic_start_dates';

export function getStoredTopicStartDate(topicId: string): string {
  try {
    const raw = localStorage.getItem(TOPIC_START_DATES_KEY);
    if (!raw) return '';
    const map = JSON.parse(raw) as Record<string, string>;
    return typeof map[topicId] === 'string' ? map[topicId] : '';
  } catch {
    return '';
  }
}

export function setStoredTopicStartDate(topicId: string, startDate?: string | null): void {
  try {
    const raw = localStorage.getItem(TOPIC_START_DATES_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (startDate) {
      map[topicId] = startDate;
    } else {
      delete map[topicId];
    }
    localStorage.setItem(TOPIC_START_DATES_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Splits a Markdown (.md) file into Formula Vault entries by headings (#, ##, ###).
 * Falls back to a single entry using the filename if no headings are present.
 */
export function parseMarkdownFormulas(mdText: string, fileName: string): ParsedMarkdownFormula[] {
  const normalized = mdText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const lines = normalized.split('\n');
  const sections: ParsedMarkdownFormula[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      if (currentTitle && currentLines.join('\n').trim()) {
        sections.push({
          title: currentTitle,
          body: currentLines.join('\n').trim(),
        });
      }
      currentTitle = headingMatch[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle && currentLines.join('\n').trim()) {
    sections.push({
      title: currentTitle,
      body: currentLines.join('\n').trim(),
    });
  }

  if (sections.length === 0) {
    const baseName = fileName.replace(/\.(md|markdown|txt)$/i, '').trim() || 'Formula Notes';
    return [{ title: baseName, body: normalized }];
  }

  return sections;
}
