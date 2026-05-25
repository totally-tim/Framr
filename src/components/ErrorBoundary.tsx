import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Framr: unhandled render error', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center p-6 bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100"
      >
        <div className="max-w-lg w-full space-y-4">
          <h1 className="text-2xl font-semibold">Something went wrong.</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Framr hit an unexpected error. Your images stayed on this device — nothing was uploaded.
          </p>
          <details className="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded">
            <summary className="cursor-pointer mb-2">Error details</summary>
            <pre className="whitespace-pre-wrap break-words">{error.message}</pre>
          </details>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
