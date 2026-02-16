import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Only enable StrictMode in development (prevents double renders breaking GSAP/ScrollTrigger/modal state in production)
const rootElement = document.getElementById('root')!;

createRoot(rootElement).render(
  import.meta.env.DEV ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
);
