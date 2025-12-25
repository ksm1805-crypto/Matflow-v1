import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // 선생님이 만든 App.jsx (Root 컴포넌트)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);