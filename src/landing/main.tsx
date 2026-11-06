import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingApp } from './LandingApp';
import './styles/landing.css';

ReactDOM.createRoot(document.getElementById('landing-root') as HTMLElement).render(
  <React.StrictMode>
    <LandingApp />
  </React.StrictMode>
);
