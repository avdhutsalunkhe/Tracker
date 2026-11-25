import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders plain text mixed with inline ($...$) and block ($$...$$) LaTeX math via KaTeX.
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const tex = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(tex, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={idx}
                className="block my-1.5 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={idx}>{part}</span>;
          }
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const tex = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(tex, {
              displayMode: false,
              throwOnError: false,
            });
            return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={idx}>{part}</span>;
          }
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
};
