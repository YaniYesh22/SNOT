import React, { useEffect, useState } from 'react';
import { signIn, signOut, signUp, confirmSignUp, getCurrentUser, fetchUserAttributes, updateUserAttributes, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';

function AuthDebugger() {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testAuth() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Test 1: Check if we can get a session
        try {
          const session = await fetchAuthSession();
          const idToken = session.getIdToken();
          const accessToken = session.getAccessToken();
          
          const sessionData = {
            idToken: idToken.getJwtToken().substring(0, 15) + '...',
            idTokenExp: new Date(idToken.getExpiration() * 1000).toLocaleString(),
            accessToken: accessToken.getJwtToken().substring(0, 15) + '...',
            accessTokenExp: new Date(accessToken.getExpiration() * 1000).toLocaleString(),
            username: idToken.payload['cognito:username'],
            email: idToken.payload.email
          };
          
          setSessionInfo(sessionData);
          console.log("Session Data:", sessionData);
          
          // Test 2: Try API call with ID token
          try {
            const testNotebook = {
              NotebookId: `test_${Date.now()}`,
              UserId: sessionData.email,
              Title: "Test Notebook",
              Content: "Test content",
              CreatedAt: new Date().toISOString(),
              UpdatedAt: new Date().toISOString()
            };
            
            // Try with different auth header formats
            const testResults = {};
            
            // Test with Bearer ID token
            try {
              const response1 = await axios.post(
                'https://ch2l8cp5l3.execute-api.eu-central-1.amazonaws.com/createNotbook',
                testNotebook,
                {
                  headers: {
                    'Authorization': `Bearer ${idToken.getJwtToken()}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              testResults.bearerIdToken = { 
                success: true, 
                status: response1.status,
                data: response1.data
              };
            } catch (error) {
              testResults.bearerIdToken = { 
                success: false, 
                status: error.response?.status,
                error: error.message,
                details: error.response?.data
              };
            }
            
            // Test with ID token only (no Bearer)
            try {
              const response2 = await axios.post(
                'https://ch2l8cp5l3.execute-api.eu-central-1.amazonaws.com/createNotbook',
                testNotebook,
                {
                  headers: {
                    'Authorization': idToken.getJwtToken(),
                    'Content-Type': 'application/json'
                  }
                }
              );
              testResults.idTokenOnly = { 
                success: true, 
                status: response2.status,
                data: response2.data
              };
            } catch (error) {
              testResults.idTokenOnly = { 
                success: false, 
                status: error.response?.status,
                error: error.message,
                details: error.response?.data
              };
            }
            
            // Test with Bearer Access token
            try {
              const response3 = await axios.post(
                'https://ch2l8cp5l3.execute-api.eu-central-1.amazonaws.com/createNotbook',
                testNotebook,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken.getJwtToken()}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              testResults.bearerAccessToken = { 
                success: true, 
                status: response3.status,
                data: response3.data
              };
            } catch (error) {
              testResults.bearerAccessToken = { 
                success: false, 
                status: error.response?.status,
                error: error.message,
                details: error.response?.data
              };
            }
            
            setApiTestResult(testResults);
            console.log("API Test Results:", testResults);
            
          } catch (apiError) {
            console.error("API Test Error:", apiError);
            setError(`API Test Error: ${apiError.message}`);
          }
          
        } catch (sessionError) {
          console.error("Session Error:", sessionError);
          setError(`Session Error: ${sessionError.message}`);
        }
        
      } catch (mainError) {
        console.error("Main Error:", mainError);
        setError(`Main Error: ${mainError.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    testAuth();
  }, []);
  
  if (isLoading) {
    return <div>Testing authentication... Please wait.</div>;
  }
  
  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2 style={{ color: '#e63946' }}>Authentication Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Authentication Debugger</h2>
      
      <h3>Session Information</h3>
      {sessionInfo ? (
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      ) : (
        <p>No session information available.</p>
      )}
      
      <h3>API Test Results</h3>
      {apiTestResult ? (
        <div>
          <h4>Test with Bearer ID Token</h4>
          <pre style={{ 
            background: apiTestResult.bearerIdToken.success ? '#e6ffed' : '#ffebe9', 
            padding: '10px', 
            borderRadius: '4px', 
            overflow: 'auto' 
          }}>
            {JSON.stringify(apiTestResult.bearerIdToken, null, 2)}
          </pre>
          
          <h4>Test with ID Token Only (no Bearer)</h4>
          <pre style={{ 
            background: apiTestResult.idTokenOnly.success ? '#e6ffed' : '#ffebe9', 
            padding: '10px', 
            borderRadius: '4px', 
            overflow: 'auto' 
          }}>
            {JSON.stringify(apiTestResult.idTokenOnly, null, 2)}
          </pre>
          
          <h4>Test with Bearer Access Token</h4>
          <pre style={{ 
            background: apiTestResult.bearerAccessToken.success ? '#e6ffed' : '#ffebe9', 
            padding: '10px', 
            borderRadius: '4px', 
            overflow: 'auto' 
          }}>
            {JSON.stringify(apiTestResult.bearerAccessToken, null, 2)}
          </pre>
        </div>
      ) : (
        <p>No API test results available.</p>
      )}
    </div>
  );
}

export default AuthDebugger;