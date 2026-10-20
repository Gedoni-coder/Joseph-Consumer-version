/**
 * JOSEPH AI - App Bootstrap
 * Initializes the application, checks authentication status,
 * and sets up global event listeners
 */

(function() {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const APP_CONFIG = {
    apiBaseURL: 'http://localhost:4000',
    loginPath: 'login.html',
    signupPath: 'signup.html',
    homePath: 'home.html'
  };

  // ==========================================
  // AUTH EVENT LISTENERS
  // ==========================================

  /**
   * Handle successful login
   */
  function handleLogin(event) {
    const user = event.detail;
    console.log('✅ User logged in:', user.email);

    // Store user data
    if (window.JosephAPI && window.JosephAPI.auth) {
      window.JosephAPI.auth.storeUser(user);
    }

    // Update UI
    updateAuthUI(user);

    // Redirect to home if on login/signup page
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
      window.location.href = APP_CONFIG.homePath;
    }
  }

  /**
   * Handle logout
   */
  function handleLogout() {
    console.log('👋 User logged out');

    // Clear user data
    if (window.JosephAPI && window.JosephAPI.auth) {
      window.JosephAPI.auth.clearUser();
    }

    // Update UI
    updateAuthUI(null);

    // Redirect to login if not already there
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = APP_CONFIG.loginPath;
    }
  }

  /**
   * Update UI based on auth status
   */
  function updateAuthUI(user) {
    // Update nav elements
    const loginLink = document.querySelector('[data-auth="login"]');
    const signupLink = document.querySelector('[data-auth="signup"]');
    const logoutLink = document.querySelector('[data-auth="logout"]');
    const userProfile = document.querySelector('[data-auth="profile"]');
    const userGreeting = document.querySelector('[data-auth="greeting"]');

    if (user) {
      // Show logged-in elements
      if (loginLink) loginLink.style.display = 'none';
      if (signupLink) signupLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'block';
      if (userProfile) userProfile.style.display = 'block';
      if (userGreeting) {
        userGreeting.textContent = `Hi, ${user.name?.split(' ')[0] || 'User'}`;
        userGreeting.style.display = 'block';
      }
    } else {
      // Show logged-out elements
      if (loginLink) loginLink.style.display = 'block';
      if (signupLink) signupLink.style.display = 'block';
      if (logoutLink) logoutLink.style.display = 'none';
      if (userProfile) userProfile.style.display = 'none';
      if (userGreeting) userGreeting.style.display = 'none';
    }
  }

  // ==========================================
  // TOKEN REFRESH ON PAGE LOAD
  // ==========================================

  /**
   * Check if access token needs refresh
   */
  async function checkTokenRefresh() {
    if (!window.JosephAPI || !window.JosephAPI.auth.isAuthenticated()) {
      return;
    }

    try {
      // Try to get current user (will refresh token if needed)
      const user = await window.JosephAPI.auth.getCurrentUser();
      window.JosephAPI.auth.storeUser(user);
      updateAuthUI(user);
    } catch (error) {
      console.error('Token check failed:', error);
      // If token refresh fails, clear auth and redirect to login
      if (window.JosephAPI) {
        window.JosephAPI.auth.clearUser();
      }
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = APP_CONFIG.loginPath;
      }
    }
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  /**
   * Initialize the app
   */
  async function initApp() {
    console.log('🚀 Initializing JOSEPH AI...');

    // Wait for API client to load
    if (typeof window.JosephAPI === 'undefined') {
      console.log('⏳ Waiting for API client...');
      await new Promise(resolve => {
        if (typeof window.JosephAPI !== 'undefined') {
          resolve();
        } else {
          window.addEventListener('joseph-api:loaded', resolve);
          // Fallback timeout
          setTimeout(resolve, 2000);
        }
      });
    }

    // Check authentication status
    if (window.JosephAPI && window.JosephAPI.auth) {
      if (window.JosephAPI.auth.isAuthenticated()) {
        await checkTokenRefresh();
      } else {
        // Try to restore user from localStorage
        const storedUser = window.JosephAPI.auth.getStoredUser();
        if (storedUser) {
          updateAuthUI(storedUser);
        }
      }
    }

    // Setup logout button handler
    const logoutBtn = document.querySelector('[data-auth="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.JosephAPI && window.JosephAPI.auth) {
          await window.JosephAPI.auth.logout();
        }
      });
    }

    // Setup login redirect for protected pages
    setupProtectedRoutes();

    console.log('✅ JOSEPH AI initialized');
  }

  /**
   * Setup protected route handling
   */
  function setupProtectedRoutes() {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('signup.html');

    // If authenticated and on auth page, redirect to home
    if (window.JosephAPI && window.JosephAPI.auth.isAuthenticated() && isAuthPage) {
      window.location.href = APP_CONFIG.homePath;
      return;
    }

    // If not authenticated and on protected page, redirect to login
    // (Add your protected pages here as needed)
    const protectedPages = ['settings.html'];
    const isProtectedPage = protectedPages.some(page => currentPath.includes(page));

    if (isProtectedPage && (!window.JosephAPI || !window.JosephAPI.auth.isAuthenticated())) {
      window.location.href = APP_CONFIG.loginPath;
    }
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  // Listen for login events
  window.addEventListener('auth:login', handleLogin);

  // Listen for logout events
  window.addEventListener('auth:logout', handleLogout);

  // Listen for API client load
  window.addEventListener('joseph-api:loaded', () => {
    console.log('✅ Joseph API Client loaded');
  });

  // ==========================================
  // START INITIALIZATION
  // ==========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // Expose config globally
  window.JosephAppConfig = APP_CONFIG;

})();

// SR
