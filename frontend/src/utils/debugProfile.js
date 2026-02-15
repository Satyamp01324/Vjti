/**
 * Debug helper to check user profile issues
 * Open browser console and run: window.debugProfile()
 */

export function debugProfile() {
  console.group('🔍 Profile Debug Info');
  
  // Check localStorage
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('access_token');
  
  console.log('📦 localStorage user:', storedUser);
  console.log('🔑 localStorage token:', storedToken ? 'Present' : 'Missing');
  
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      console.log('👤 Parsed user object:', parsed);
      console.log('   - ID:', parsed.id);
      console.log('   - Email:', parsed.email);
      console.log('   - Full Name:', parsed.full_name || '(empty)');
    } catch (e) {
      console.error('❌ Failed to parse user:', e);
    }
  }
  
  console.groupEnd();
  
  return {
    user: storedUser,
    token: storedToken,
    recommendation: !storedUser ? 'Please log in again' : 'Check console logs for profile fetch errors'
  };
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.debugProfile = debugProfile;
}
