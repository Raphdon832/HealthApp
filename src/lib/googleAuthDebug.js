// Firebase Google Auth Diagnostic Helper
// Add ?debugGoogleAuth=1 to URL to see this info

export const checkGoogleAuthConfig = () => {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debugGoogleAuth') !== '1') return;
  
  console.group('🔍 Google Auth Configuration Diagnostic');
  
  // Check environment variables
  console.log('Firebase Config:');
  console.log('- API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('- Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Present' : '❌ Missing');
  console.log('- Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Present' : '❌ Missing');
  
  // Check if running in development
  console.log('Environment:', import.meta.env.DEV ? '🔧 Development' : '🚀 Production');
  
  // Check if we're on localhost (Google Auth may need specific domain config)
  console.log('Host:', window.location.hostname);
  console.log('Protocol:', window.location.protocol);
  
  // Check if popup blockers might be interfering
  console.log('User Agent:', navigator.userAgent.includes('Chrome') ? '✅ Chrome' : 
                            navigator.userAgent.includes('Safari') ? '⚠️ Safari (may have popup restrictions)' :
                            navigator.userAgent.includes('Firefox') ? '⚠️ Firefox (may have popup restrictions)' : '❓ Other');
  
  console.groupEnd();
  
  // Show on page too
  const debugDiv = document.createElement('div');
  debugDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 9999;
    max-width: 300px;
  `;
  debugDiv.innerHTML = `
    <strong>🔍 Google Auth Debug</strong><br>
    API Key: ${import.meta.env.VITE_FIREBASE_API_KEY ? '✅' : '❌'}<br>
    Auth Domain: ${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅' : '❌'}<br>
    Project ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅' : '❌'}<br>
    Host: ${window.location.hostname}<br>
    <small>Add ?debugGoogleAuth=1 to see console logs</small>
  `;
  
  document.body.appendChild(debugDiv);
  
  // Remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(debugDiv)) {
      document.body.removeChild(debugDiv);
    }
  }, 10000);
};