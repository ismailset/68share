import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/Toast.tsx';
import { PWAManager } from './components/PWAManager.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <PWAManager>
        <App />
      </PWAManager>
    </ToastProvider>
  </StrictMode>,
);
