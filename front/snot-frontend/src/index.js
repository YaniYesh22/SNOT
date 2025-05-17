import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App';
import awsConfig from './aws-exports';
import './index.css';

// Create a proper Amplify v6 config
const amplifyConfig = {
  Auth: {
    Cognito: {
      region: awsConfig.Auth.region,
      userPoolId: awsConfig.Auth.userPoolId,
      userPoolClientId: awsConfig.Auth.userPoolWebClientId,
      loginWith: {
        email: true,
        username: true
      }
    }
  }
};

// Configure Amplify
Amplify.configure(amplifyConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);