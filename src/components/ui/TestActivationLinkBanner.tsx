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
      className={`p-4 rounded-md bg-warning-surface border border-warning-border text-left space-y-2.5 shadow-xs ${className}`}
      role="region"
      aria-label="Lien d'activation mode test"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-warning-border/40">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-warning-surface text-warning-text border border-warning-border">
            <Mail className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold text-warning-text">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold bg-surface text-secondary border border-default hover:bg-surface-subtle hover:text-main transition-colors cursor-pointer focus-halo"
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Lien copié !' : 'Copier'}</span>
          </button>

          <a
            href={actionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold bg-warning text-white hover:opacity-90 transition-opacity shadow-xs focus-halo"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Tester l'activation</span>
          </a>
        </div>
      </div>

      <div className="p-2 rounded-sm bg-surface border border-subtle overflow-hidden">
        <code className="text-xs font-mono text-warning-text break-all select-all block max-h-16 overflow-y-auto">
          {actionLink}
        </code>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        {description}
      </p>
    </div>
  );
};
