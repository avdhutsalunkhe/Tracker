import React, { useEffect, useState } from 'react';
import { MathText } from './MathText';
import { getStudyDocumentUrl } from '../../lib/studyDocuments';

const FormulaImage: React.FC<{ storagePath: string }> = ({ storagePath }) => {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getStudyDocumentUrl(storagePath)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  if (!url) {
    return (
      <div className="my-2 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-[11px] text-slate-400">
        Loading formula image...
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block my-2">
      <img
        src={url}
        alt="Formula reference"
        className="max-h-64 w-auto rounded-xl border border-slate-200 dark:border-slate-700 object-contain bg-white dark:bg-slate-950"
      />
    </a>
  );
};

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

function renderInline(line: string): React.ReactNode[] {
  // Split by inline code (`...`), bold (**...**), italic (*...*), or markdown links [label](url)
  const tokens = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length >= 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-300 font-mono text-[11px] border border-slate-200/80 dark:border-slate-700"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length >= 4) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">
          <MathText text={tok.slice(2, -2)} />
        </strong>
      );
    }
    if (tok.startsWith('*') && tok.endsWith('*') && tok.length >= 3) {
      return (
        <em key={i} className="italic">
          <MathText text={tok.slice(1, -1)} />
        </em>
      );
    }
    const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline hover:opacity-80"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <MathText key={i} text={tok} />;
  });
}

/**
 * GitHub-Flavored Markdown + KaTeX math renderer.
 * Supports fenced code blocks, headings, tables, blockquotes, lists, inline code, bold, italic, and LaTeX.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```lang
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || 'code';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <div key={`code-${i}`} className="my-2 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100">
          <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            {lang}
          </div>
          <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed font-mono">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Embedded Supabase Formula Image [[formula-img:path]]
    const imgMatch = line.trim().match(/^\[\[formula-img:(.+)\]\]$/);
    if (imgMatch) {
      blocks.push(<FormulaImage key={`fimg-${i}`} storagePath={imgMatch[1].trim()} />);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={`hr-${i}`} className="my-2.5 border-slate-200 dark:border-slate-800" />);
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const cls =
        level === 1
          ? 'text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-3 mb-1 pb-1 border-b border-slate-200 dark:border-slate-800'
          : level === 2
            ? 'text-[13px] font-bold text-slate-900 dark:text-slate-100 mt-2.5 mb-1'
            : 'text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 mb-0.5';
      blocks.push(
        <div key={`h-${i}`} className={cls}>
          {renderInline(content)}
        </div>
      );
      i++;
      continue;
    }

    // GitHub-style table
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|[\s:-]+\|/.test(lines[i + 1])) {
      const parseRow = (r: string) =>
        r
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
      const headers = parseRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={`tbl-${i}`} className="my-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="bg-slate-100 dark:bg-slate-800/80">
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} className="px-2.5 py-1.5 font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-t border-slate-200/70 dark:border-slate-800">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={`bq-${i}`}
          className="my-1.5 pl-3 border-l-3 border-indigo-400 dark:border-indigo-500 text-slate-600 dark:text-slate-300 italic text-xs"
        >
          {quoteLines.map((ql, qi) => (
            <p key={qi}>{renderInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered list (* or -)
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="my-1.5 pl-4 list-disc space-y-1 text-xs text-slate-700 dark:text-slate-300">
          {items.map((item, ii) => (
            <li key={ii} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list (1. )
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="my-1.5 pl-4 list-decimal space-y-1 text-xs text-slate-700 dark:text-slate-300">
          {items.map((item, ii) => (
            <li key={ii} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    blocks.push(
      <p key={`p-${i}`} className="my-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className={`space-y-0.5 ${className}`}>{blocks}</div>;
};
