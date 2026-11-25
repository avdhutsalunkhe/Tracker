import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, X, ExternalLink, ShieldCheck } from 'lucide-react';

interface DemoModeBannerProps {
  onOpenAuth: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onOpenAuth }) => {
  const { isConfigured, isDemoUser, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (isConfigured && !isDemoUser) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-indigo-950/90 border-b border-indigo-500/20 px-4 py-2 text-xs text-indigo-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/30 text-[11px]">
            <Database className="w-3 h-3 text-indigo-400" />
            {!isConfigured ? 'Demo Mode (Offline Local Store)' : 'Guest Mode'}
          </span>
          <span className="text-slate-300">
            {!isConfigured
              ? 'Data persists in your browser. Connect Supabase in .env for cross-device cloud sync with RLS.'
              : `Browsing as guest. Sign in to sync data to your private account.`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAuth}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors"
          >
            {isConfigured ? 'Sign In / Sign Up' : 'Supabase Info'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
