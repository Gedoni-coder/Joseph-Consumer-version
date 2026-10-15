import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import App from './App';
import './application.css';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
