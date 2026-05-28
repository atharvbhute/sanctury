import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './AuthContext';
import { MediaPlayerProvider } from './MediaPlayerContext';



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MediaPlayerProvider>
        <App />
      </MediaPlayerProvider>
    </AuthProvider>
  </StrictMode>,
);
