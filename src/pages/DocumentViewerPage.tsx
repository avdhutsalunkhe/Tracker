import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getStudyDocumentUrl } from '../lib/studyDocuments';
import { ArrowLeft, ExternalLink, FileText, Loader2 } from 'lucide-react';

interface ViewerState {
  storagePath?: string;
  title?: string;
  fileType?: string;
}

export const DocumentViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const state = (location.state as ViewerState | null) || {};
  const storagePath = state.storagePath || searchParams.get('path') || '';
  const title = state.title || searchParams.get('title') || 'Document Viewer';
  const fileType = (state.fileType || searchParams.get('type') || 'pdf').toLowerCase();

  const [signedUrl, setSignedUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!storagePath) {
      setError('No document path provided.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    getStudyDocumentUrl(storagePath)
      .then((url) => {
        if (!cancelled) setSignedUrl(url);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as Error).message || 'Could not load document.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  // Embedded viewer URL prevents Android/mobile browsers from forcing a file download
  const viewerSrc = signedUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(signedUrl)}`
    : '';

  return (
    <div className="space-y-3 animate-in fade-in duration-200 flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder rounded-2xl p-3 shadow-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="min-w-0 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 shrink-0">
              {fileType}
            </span>
          </div>
        </div>

        {signedUrl && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shrink-0 hover:bg-indigo-100"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Direct Link</span>
          </a>
        )}
      </div>

      {/* Inline Document Frame */}
      <div className="flex-1 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder overflow-hidden shadow-sm relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading {fileType.toUpperCase()} viewer...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-500">{error}</div>
        ) : (
          <iframe
            title={title}
            src={viewerSrc}
            className="w-full h-full border-0 bg-slate-50 dark:bg-slate-900"
          />
        )}
      </div>
    </div>
  );
};
