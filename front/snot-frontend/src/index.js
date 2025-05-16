import './index.css';

import { Amplify } from 'aws-amplify';
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';
import awsConfig from './aws-exports';

// Configure Amplify
Amplify.configure(awsConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);