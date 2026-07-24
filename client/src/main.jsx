import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { supabase } from './api/supabase';

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    const { data: { session } } = await supabase.auth.getSession();
    config = config || {};
    config.headers = {
      ...config.headers,
      'Authorization': session ? `Bearer ${session.access_token}` : ''
    };
  }
  return originalFetch(resource, config);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
