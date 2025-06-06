#!/usr/bin/env node
/**
 * TradeTaper Production Readiness Check
 * This script validates that the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

const frontendPath = path.join(__dirname, 'tradetaper-frontend');
const backendPath = path.join(__dirname, 'tradetaper-backend');
const adminPath = path.join(__dirname, 'tradetaper-admin');

const checks = [];

function addCheck(name, status, message) {
  checks.push({ name, status, message });
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

function checkFileExists(filePath, name) {
  const exists = fs.existsSync(filePath);
  addCheck(`${name} exists`, exists, exists ? `Found at ${filePath}` : `Missing: ${filePath}`);
  return exists;
}

function checkPackageJsonScript(packagePath, scriptName, name) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const hasScript = packageJson.scripts && packageJson.scripts[scriptName];
    addCheck(`${name} script`, !!hasScript, hasScript ? `Found: ${scriptName}` : `Missing script: ${scriptName}`);
    return !!hasScript;
  } catch (error) {
    addCheck(`${name} script`, false, `Error reading package.json: ${error.message}`);
    return false;
  }
}

function checkEnvExample(envPath, name) {
  if (!fs.existsSync(envPath)) {
    addCheck(`${name} env example`, false, `Missing: ${envPath}`);
    return false;
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const hasApiUrl = content.includes('API_URL') || content.includes('BACKEND_URL');
  const hasDatabaseUrl = content.includes('DATABASE_URL') || content.includes('DB_');
  const hasJwtSecret = content.includes('JWT_SECRET');
  
  addCheck(`${name} env variables`, hasApiUrl && (name.includes('Backend') ? (hasDatabaseUrl && hasJwtSecret) : true), 
    `API: ${hasApiUrl}, DB: ${hasDatabaseUrl || 'N/A'}, JWT: ${hasJwtSecret || 'N/A'}`);
  
  return true;
}

function checkDeploymentConfig(configPath, name) {
  if (!fs.existsSync(configPath)) {
    addCheck(`${name} deployment config`, false, `Missing: ${configPath}`);
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    addCheck(`${name} deployment config`, true, `Found valid ${path.basename(configPath)}`);
    return true;
  } catch (error) {
    addCheck(`${name} deployment config`, false, `Invalid JSON: ${error.message}`);
    return false;
  }
}

console.log('🔍 TradeTaper Production Readiness Check\n');

// Check Backend
console.log('📊 Backend Checks:');
checkFileExists(path.join(backendPath, 'package.json'), 'Backend package.json');
checkFileExists(path.join(backendPath, 'src/main.ts'), 'Backend entry point');
checkPackageJsonScript(path.join(backendPath, 'package.json'), 'start:prod', 'Backend production start');
checkPackageJsonScript(path.join(backendPath, 'package.json'), 'build', 'Backend build');
checkEnvExample(path.join(backendPath, 'env.example'), 'Backend');
checkDeploymentConfig(path.join(backendPath, 'railway.json'), 'Backend Railway');
checkDeploymentConfig(path.join(backendPath, 'vercel.json'), 'Backend Vercel (alternative)');

console.log('\n🌐 Frontend Checks:');
checkFileExists(path.join(frontendPath, 'package.json'), 'Frontend package.json');
checkFileExists(path.join(frontendPath, 'src/app/layout.tsx'), 'Frontend layout');
checkPackageJsonScript(path.join(frontendPath, 'package.json'), 'build', 'Frontend build');
checkPackageJsonScript(path.join(frontendPath, 'package.json'), 'start', 'Frontend production start');
checkEnvExample(path.join(frontendPath, 'env.example'), 'Frontend');
checkDeploymentConfig(path.join(frontendPath, 'vercel.json'), 'Frontend Vercel');

console.log('\n👨‍💼 Admin Checks:');
checkFileExists(path.join(adminPath, 'package.json'), 'Admin package.json');
checkPackageJsonScript(path.join(adminPath, 'package.json'), 'build', 'Admin build');
checkPackageJsonScript(path.join(adminPath, 'package.json'), 'start', 'Admin production start');
checkDeploymentConfig(path.join(adminPath, 'vercel.json'), 'Admin Vercel');

// Check for potential issues
console.log('\n🔒 Security & Best Practices:');

// Check for environment files that shouldn't be committed
const envFiles = [
  '.env',
  '.env.local', 
  '.env.production',
  'tradetaper-backend/.env',
  'tradetaper-frontend/.env.local',
  'tradetaper-admin/.env.local'
];

envFiles.forEach(envFile => {
  const fullPath = path.join(__dirname, envFile);
  if (fs.existsSync(fullPath)) {
    addCheck('Environment file security', false, `${envFile} exists - ensure it's in .gitignore`);
  }
});

// Check for proper gitignore
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  const hasNodeModules = gitignore.includes('node_modules');
  const hasEnv = gitignore.includes('.env');
  const hasBuild = gitignore.includes('dist') || gitignore.includes('.next');
  
  addCheck('Gitignore completeness', hasNodeModules && hasEnv && hasBuild, 
    `node_modules: ${hasNodeModules}, .env: ${hasEnv}, build: ${hasBuild}`);
}

// Summary
console.log('\n📋 Summary:');
const passed = checks.filter(c => c.status).length;
const total = checks.length;
const passRate = ((passed / total) * 100).toFixed(1);

console.log(`Passed: ${passed}/${total} checks (${passRate}%)`);

if (passRate >= 90) {
  console.log('🎉 Application appears ready for production deployment!');
} else if (passRate >= 80) {
  console.log('⚠️  Application has some issues but may be deployable. Review failed checks.');
} else {
  console.log('❌ Application needs significant work before production deployment.');
}

console.log('\n📚 Next steps:');
console.log('1. Review and fix any failed checks above');
console.log('2. Set up environment variables in your deployment platforms');
console.log('3. Test deployment in staging environment');
console.log('4. Follow the deployment guide in DEPLOYMENT_GUIDE.md');