import React, { useState } from 'react';
import { Mail, Copy, Check, ExternalLink } from 'lucide-react';

interface TestActivationLinkBannerProps {
  actionLink?: string | null;
  title?: string;
  description?: string;
  className?: string;
}

export const TestActivationLinkBanner: React.FC<TestActivationLinkBannerProps> = ({
  actionLink,
  title = "Lien d'activation (Mode Test & Diagnostic)",
  description = "Ce lien d'accès direct est généré car la variable de test (ALLOW_TEST_ACTION_LINKS) est activée sur le serveur. En production réelle, aucun lien n'apparaît à l'écran et l'invitation transite uniquement par email.",
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  if (!actionLink) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(actionLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-left space-y-2.5 shadow-2xs ${className}`}
      role="region"
      aria-label="Lien d'activation mode test"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-amber-200/60 dark:border-amber-900/40">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
            <Mail className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Lien copié !' : 'Copier'}</span>
          </button>

          <a
            href={actionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Tester l'activation</span>
          </a>
        </div>
      </div>

      <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/30 overflow-hidden">
        <code className="text-[10px] font-mono text-amber-900 dark:text-amber-300 break-all select-all block max-h-16 overflow-y-auto">
          {actionLink}
        </code>
      </div>

      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
