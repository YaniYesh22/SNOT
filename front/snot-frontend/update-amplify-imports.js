const fs = require('fs');
const path = require('path');

// Directory to scan
const srcDir = path.resolve(__dirname, 'src');

// Function to recursively find all JS/JSX files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Find all JS/JSX files
const files = findFiles(srcDir);

// Update imports in each file
files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace old style Auth imports
  if (content.includes("import { Auth } from 'aws-amplify'")) {
    console.log(`Updating Auth import in ${filePath}`);
    content = content.replace(
      "import { Auth } from 'aws-amplify'",
      "import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchUserAttributes, updateUserAttributes, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth'"
    );
    modified = true;
  }
  
  // Replace Auth.method() calls with direct method calls
  if (content.includes("Auth.signIn")) {
    content = content.replace(/Auth\.signIn\(([^,)]+),\s*([^)]+)\)/g, "signIn({ username: $1, password: $2 })");
    modified = true;
  }
  
  if (content.includes("Auth.signUp")) {
    content = content.replace(/Auth\.signUp\(\{([^}]+)\}\)/g, "signUp({$1})");
    modified = true;
  }
  
  if (content.includes("Auth.signOut")) {
    content = content.replace(/Auth\.signOut\(\)/g, "signOut()");
    modified = true;
  }
  
  if (content.includes("Auth.currentAuthenticatedUser")) {
    content = content.replace(/await Auth\.currentAuthenticatedUser\(([^)]*)\)/g, 
      "await getCurrentUser();\n  const attributes = await fetchUserAttributes();\n  const user = { attributes }");
    modified = true;
  }
  
  if (content.includes("Auth.updateUserAttributes")) {
    content = content.replace(/Auth\.updateUserAttributes\(([^,]+),\s*([^)]+)\)/g, 
      "updateUserAttributes({ userAttributes: $2 })");
    modified = true;
  }
  
  if (content.includes("Auth.forgotPassword")) {
    content = content.replace(/Auth\.forgotPassword\(([^)]+)\)/g, "resetPassword({ username: $1 })");
    modified = true;
  }
  
  if (content.includes("Auth.forgotPasswordSubmit")) {
    content = content.replace(/Auth\.forgotPasswordSubmit\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 
      "confirmResetPassword({ username: $1, confirmationCode: $2, newPassword: $3 })");
    modified = true;
  }
  
  if (content.includes("Auth.currentSession")) {
    content = content.replace(/Auth\.currentSession\(\)/g, "fetchAuthSession()");
    modified = true;
  }
  
  // Save file if modified
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});

console.log('Import update completed!');
