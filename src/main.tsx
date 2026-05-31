import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/globals.css'

// Named handlers so HMR's module-replace cycle can detach the old ones before
// the new module registers replacements — otherwise each edit during dev
// accumulates a fresh pair of global listeners and every runtime error logs
// N times where N is the number of HMR cycles since the page loaded.
const handleGlobalError = (event: ErrorEvent) => {
  console.error('Framr: uncaught error', event.error ?? event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Framr: unhandled promise rejection', event.reason);
};

window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
