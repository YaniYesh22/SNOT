import './index.css';
import './styles/HoverStyles.css'

import { Amplify } from 'aws-amplify';
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';
import awsConfig from './aws-exports';
import reportWebVitals from './reportWebVitals';

Amplify.configure(awsConfig);




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
