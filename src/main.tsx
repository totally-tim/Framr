import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/globals.css'

window.addEventListener('error', (event) => {
  console.error('Framr: uncaught error', event.error ?? event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Framr: unhandled promise rejection', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
