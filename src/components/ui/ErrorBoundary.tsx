import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[EcoSurv ErrorBoundary${this.props.name ? ` : ${this.props.name}` : ''}]`,
      error,
      errorInfo
    );
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-page-bg text-main antialiased">
          <div className="max-w-md w-full bg-surface-elevated border border-subtle rounded-md p-6 sm:p-8 shadow-elevated text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm bg-warning-surface border border-warning-border text-warning-text">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-main">
                Affichage momentanément indisponible
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Une anomalie d'affichage est survenue dans cette partie de l'application. Vos données scolaires et financières restent intactes.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-surface-subtle p-3 rounded-sm border border-subtle text-xs font-mono text-danger-text overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer focus-halo"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Recharger la page</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  window.location.href = '/';
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-surface-subtle hover:bg-surface border border-subtle text-secondary hover:text-main text-xs font-semibold transition-colors cursor-pointer focus-halo"
              >
                <Home className="h-4 w-4" />
                <span>Page d'accueil</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
