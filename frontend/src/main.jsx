import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import Admin from './Admin2.jsx';

const isAdminPage = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminPage ? <Admin /> : <App />}
  </React.StrictMode>
);
