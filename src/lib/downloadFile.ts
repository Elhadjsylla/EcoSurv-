/**
 * Utilitaire centralisé de téléchargement de fichiers (PDF, Excel, CSV)
 * Garantit un nom de fichier propre avec extension, sans perte de nom (pas de UUID brut),
 * et un cycle de vie sécurisé de l'URL Blob (évite URL.revokeObjectURL synchrone).
 */

export interface DownloadFileOptions {
  filename: string;
  blobOrData: Blob | Uint8Array | ArrayBuffer | string;
  mimeType?: string;
}

/**
 * Assainit un nom de fichier pour les systèmes de fichiers Windows / macOS / Linux
 */
export function sanitizeFilename(filename: string, defaultExtension = ''): string {
  // Remplacer les caractères interdits sur Windows/Linux
  let safeName = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents pour compatibilité max système de fichiers
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();

  // Si pas d'extension et une defaultExtension est fournie
  if (defaultExtension && !safeName.toLowerCase().endsWith(defaultExtension.toLowerCase())) {
    safeName = `${safeName}${defaultExtension.startsWith('.') ? '' : '.'}${defaultExtension}`;
  }

  return safeName || `fichier_telecharge${defaultExtension ? '.' + defaultExtension.replace(/^\./, '') : ''}`;
}

/**
 * Télécharge un fichier de façon fiable dans le navigateur
 */
export function downloadFile({ filename, blobOrData, mimeType }: DownloadFileOptions): void {
  const cleanFilename = sanitizeFilename(filename);

  let blob: Blob;
  if (blobOrData instanceof Blob) {
    if (mimeType && blobOrData.type !== mimeType) {
      blob = new Blob([blobOrData], { type: mimeType });
    } else {
      blob = blobOrData;
    }
  } else if (typeof blobOrData === 'string') {
    blob = new Blob([blobOrData], { type: mimeType || 'text/plain;charset=utf-8' });
  } else {
    const bytes = blobOrData instanceof Uint8Array ? new Uint8Array(blobOrData) : blobOrData;
    blob = new Blob([bytes], {
      type: mimeType || 'application/octet-stream',
    });
  }

  // Envelopper dans un objet File si possible pour persister le nom dans le registre WebKit du navigateur
  let blobOrFile: Blob | File = blob;
  try {
    blobOrFile = new File([blob], cleanFilename, {
      type: blob.type || mimeType || 'application/octet-stream',
    });
  } catch {
    blobOrFile = blob;
  }

  const blobUrl = URL.createObjectURL(blobOrFile);

  const anchor = document.createElement('a');
  anchor.style.position = 'fixed';
  anchor.style.top = '-9999px';
  anchor.style.left = '-9999px';
  anchor.style.opacity = '0';
  anchor.style.pointerEvents = 'none';
  anchor.href = blobUrl;
  anchor.download = cleanFilename;
  anchor.setAttribute('download', cleanFilename);
  anchor.setAttribute('target', '_self');
  anchor.rel = 'noopener';

  document.body.appendChild(anchor);

  try {
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    anchor.dispatchEvent(clickEvent);
  } catch {
    anchor.click();
  } finally {
    // 60 secondes de rétention avant révocation pour laisser le temps à Chrome/Edge/antivirus
    // de finaliser l'écriture sur le disque sans interrompre la lecture des métadonnées.
    setTimeout(() => {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  }
}
