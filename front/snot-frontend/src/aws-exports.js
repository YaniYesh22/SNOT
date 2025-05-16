const awsConfig = {
  Auth: {
    region: 'eu-central-1',
    userPoolId: 'eu-central-1_D5UxcuUs5',
    userPoolWebClientId: '5bvj4spbk9t8egjoqskjg9ofv2',
    // This is the key change - store tokens in sessionStorage instead of localStorage
    storage: window.sessionStorage
  }
};

export default awsConfig;