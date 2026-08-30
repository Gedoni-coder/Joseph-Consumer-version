/**
 * JOSEPH AI - Micro-Merchant Economic Operating System Engine
 * With proper URL routing
 */

console.log('🟢 app.js loading...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🟢 DOM Content Loaded - Initializing...');

  // ==========================================
  // ROUTING CONFIGURATION
  // ==========================================
  const routes = {
    '/': 'page-landing',
    '/landing': 'page-landing',
    '/dream': 'page-dream',
    '/interpretation': 'page-interpretation',
    '/finance': 'page-finance',
    '/strategy': 'page-strategy'
  };

  const topbar = document.getElementById('topbar');
  const topbarModuleLabel = document.getElementById('topbar-module-label');
  const moduleLabels = {
    'page-dream': 'Module 1: Dream',
    'page-interpretation': 'Module 2: Interpretation',
    'page-finance': 'Module 3: Finance',
    'page-strategy': 'Module 4: Strategy'
  };

  // Navigate to a page
  function navigateTo(pageId) {
    console.log('🔄 Navigating to:', pageId);

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Show/hide topbar based on page
    const floatingWaBtn = document.getElementById('floating-wa-btn');
    if (pageId === 'page-landing') {
      topbar.style.display = 'none';
      if (floatingWaBtn) floatingWaBtn.style.display = 'none';
    } else {
      topbar.style.display = 'flex';
      if (floatingWaBtn) floatingWaBtn.style.display = 'inline-flex';
      if (topbarModuleLabel && moduleLabels[pageId]) {
        topbarModuleLabel.textContent = moduleLabels[pageId];
      }
    }

    // Load module-specific data
    if (pageId === 'page-strategy') {
      loadStrategyDashboard();
    }

    // Update URL without reloading (using pathname since we have SPA support)
    const route = Object.keys(routes).find(key => routes[key] === pageId);
    if (route && window.location.pathname !== route) {
      history.pushState({ pageId }, '', route);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('✅ Navigated to', pageId);
  }

  // Make navigateTo available globally for onclick handlers
  window.navigateTo = navigateTo;

  // Global WhatsApp redirect handler
  window.openWhatsAppBot = async function() {
    try {
      const response = await window.JosephAPI.whatsapp.generateLinkToken();
      if (response && response.success) {
        const token = response.data.token;
        const botPhone = '2347073735341'; // JOSEPH AI bot number
        const waUrl = `https://wa.me/${botPhone}?text=${token}`;
        window.open(waUrl, '_blank');
      } else {
        // Fallback to settings page if token generation fails (e.g. unauthenticated)
        window.location.href = 'settings.html';
      }
    } catch (error) {
      console.error('Failed to generate WhatsApp link:', error);
      window.location.href = 'settings.html';
    }
  };

  // Handle browser back/forward buttons and hash changes
  window.addEventListener('popstate', function(event) {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    const route = hash ? '/' + hash.substring(1) : pathname !== '/' ? pathname : '/';
    const pageId = routes[route] || 'page-landing';
    navigateToPage(pageId);
  });

  function navigateToPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    if (pageId === 'page-landing') {
      topbar.style.display = 'none';
    } else {
      topbar.style.display = 'flex';
      if (topbarModuleLabel && moduleLabels[pageId]) {
        topbarModuleLabel.textContent = moduleLabels[pageId];
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Intercept all link clicks for routing
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href^="/"], a[href^="#"]');
    if (link) {
      const href = link.getAttribute('href');
      // Handle both /dream and #dream formats
      const route = href.startsWith('#') ? '/' + href.substring(1) : href;
      const pageId = routes[route];

      if (pageId) {
        e.preventDefault();
        navigateTo(pageId);
        return false;
      }
    }
  });

  // Handle buttons with data-page attribute
  document.querySelectorAll('[data-page]').forEach(element => {
    element.addEventListener('click', function(e) {
      if (this.tagName !== 'A') {
        const pageName = this.getAttribute('data-page');
        const pageId = 'page-' + pageName;
        navigateTo(pageId);
      }
    });
  });

  // Initialize based on current URL (check both hash and pathname)
  const hash = window.location.hash;
  const pathname = window.location.pathname;
  const route = hash ? '/' + hash.substring(1) : pathname !== '/' ? pathname : '/';
  const initialPage = routes[route] || 'page-landing';

  // Set initial page
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));

  const initialPageElement = document.getElementById(initialPage);
  if (initialPageElement) {
    initialPageElement.classList.add('active');
  }

  // Set initial topbar state
  const floatingWaBtnInit = document.getElementById('floating-wa-btn');
  if (initialPage === 'page-landing') {
    topbar.style.display = 'none';
    if (floatingWaBtnInit) floatingWaBtnInit.style.display = 'none';
  } else {
    topbar.style.display = 'flex';
    if (floatingWaBtnInit) floatingWaBtnInit.style.display = 'inline-flex';
    if (topbarModuleLabel && moduleLabels[initialPage]) {
      topbarModuleLabel.textContent = moduleLabels[initialPage];
    }
  }

  console.log('✅ Initialized on route:', route, '→ page:', initialPage);

  // ==========================================
  // LANDING PAGE BUTTONS
  // ==========================================
  var heroOpenDashboardBtn = document.getElementById('hero-open-dashboard-btn');
  var ctaOpenBtn = document.getElementById('cta-open-btn');

  if (heroOpenDashboardBtn) {
    heroOpenDashboardBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Check if user is logged in
      if (localStorage.getItem('joseph_user')) {
        window.location.href = 'home.html';
      } else {
        window.location.href = 'signup.html';
      }
    });
  }

  if (ctaOpenBtn) {
    ctaOpenBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Check if user is logged in
      if (localStorage.getItem('joseph_user')) {
        window.location.href = 'home.html';
      } else {
        window.location.href = 'signup.html';
      }
    });
  }

  // "How it works" button - scroll to pillars section
  var heroLearnBtn = document.getElementById('hero-learn-btn');
  if (heroLearnBtn) {
    heroLearnBtn.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ==========================================
  // LANDING PAGE BUTTONS (Login & Signup)
  // ==========================================
  var landingLoginTopBtn = document.getElementById('landing-login-btn');
  var landingLoginHeroBtn = document.getElementById('landing-login-hero-btn');
  var landingSignupBtn = document.getElementById('landing-signup-btn');

  function navigateToLogin() {
    console.log('🔄 Navigating to login page...');
    window.location.href = 'login.html';
  }

  function navigateToSignup() {
    console.log('🔄 Navigating to signup page...');
    window.location.href = 'signup.html';
  }

  if (landingLoginTopBtn) {
    landingLoginTopBtn.addEventListener('click', function(e) {
      console.log('✅ Landing top login button clicked');
      navigateToLogin();
    });
  }

  if (landingLoginHeroBtn) {
    landingLoginHeroBtn.addEventListener('click', function(e) {
      console.log('✅ Landing hero login button clicked');
      navigateToLogin();
    });
  }

  if (landingSignupBtn) {
    landingSignupBtn.addEventListener('click', function(e) {
      console.log('✅ Landing signup button clicked');
      navigateToSignup();
    });
  }

  // ==========================================
  // SIDEBAR & HAMBURGER
  // ==========================================
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var landingHamburgerBtn = document.getElementById('landing-hamburger-btn');
  var sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  var sidebarOverlay = document.getElementById('sidebar-overlay');
  var sidebar = document.getElementById('sidebar');

  function openSidebar() {
    if (sidebar) {
      sidebar.classList.add('open');
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.add('active');
    }
  }

  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.remove('open');
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('active');
    }
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openSidebar();
    });
  }

  if (landingHamburgerBtn) {
    landingHamburgerBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openSidebar();
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeSidebar();
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function(e) {
      if (e.target === sidebarOverlay) {
        closeSidebar();
      }
    });
  }

  // ==========================================
  // CHAT WIDGET
  // ==========================================
  var chatToggleBtn = document.getElementById('chat-toggle-btn');
  var chatCloseBtn = document.getElementById('chat-close-btn');
  var chatWidget = document.getElementById('chat-widget');

  if (chatToggleBtn) {
    chatToggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (chatWidget) {
        chatWidget.classList.remove('collapsed');
      }
    });
  }

  if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (chatWidget) {
        chatWidget.classList.add('collapsed');
      }
    });
  }

  // ==========================================
  // HOME BUTTON (← Home in top bar)
  // ==========================================
  var homeBtn = document.getElementById('back-to-home-btn');

  console.log('🔍 Looking for home button...', homeBtn);
  console.log('🔍 All buttons with class:', document.querySelectorAll('.back-to-home-btn'));

  if (homeBtn) {
    console.log('✅ Home button found, adding click listener');
    homeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🏠 HOME BUTTON CLICKED!!! Navigating to landing page');
      console.log('🎯 Event object:', e);
      console.log('🎯 Button element:', homeBtn);
      navigateTo('page-landing');
    });
    // Also add backup click handler
    homeBtn.onclick = function(e) {
      e.preventDefault();
      console.log('🏠 HOME BUTTON onclick fired!');
      navigateTo('page-landing');
      return false;
    };
  } else {
    console.error('❌ Home button NOT found!');
  }

  // ==========================================
  // NEW WORKING HOME BUTTON
  // ==========================================
  var workingHomeBtn = document.getElementById('working-home-btn');
  if (workingHomeBtn) {
    workingHomeBtn.addEventListener('click', function() {
      console.log('✅ Working home button clicked!');
      navigateTo('page-landing');
    });
  }

  // ==========================================
  // FLOATING HOME BUTTON (Separate button at bottom-left)
  // ==========================================
  var floatingHomeBtn = document.getElementById('floating-home-btn');
  if (floatingHomeBtn) {
    floatingHomeBtn.addEventListener('click', function() {
      console.log('🏠 Floating home button clicked!');
      navigateTo('page-landing');
    });
    // Add hover effect
    floatingHomeBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 16px rgba(36, 36, 143, 0.5)';
    });
    floatingHomeBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 12px rgba(36, 36, 143, 0.4)';
    });
  }

  // ==========================================
  // BANK ALERT BUTTON (🔔 Bank Alert in top bar)
  // ==========================================
  var bankAlertBtn = document.getElementById('trigger-bank-alert-btn');

  if (bankAlertBtn) {
    bankAlertBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var modal = document.getElementById('bank-alert-modal');
      if (modal) {
        modal.classList.add('active');
      }
    });
  }

  // ==========================================
  // CLOSE MODAL BUTTONS
  // ==========================================
  var closeModalBtns = document.querySelectorAll('.modal-close');

  for (var i = 0; i < closeModalBtns.length; i++) {
    closeModalBtns[i].addEventListener('click', function(e) {
      e.preventDefault();
      var modal = this.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  }

  // Close modal on overlay click
  var modals = document.querySelectorAll('.modal-overlay');
  for (var i = 0; i < modals.length; i++) {
    modals[i].addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  }

  // ==========================================
  // BACK TO SELECTION FUNCTIONS
  // ==========================================
  window.showInterpretationSelection = function() {
    console.log('🔄 showInterpretationSelection called');
    var selectionScreen = document.getElementById('interpretation-selection-screen');
    var microContent = document.getElementById('interpretation-micro-content');
    var macroContent = document.getElementById('interpretation-macro-content');

    console.log('Selection screen:', selectionScreen);
    console.log('Micro content:', microContent);
    console.log('Macro content:', macroContent);

    if (selectionScreen) {
      selectionScreen.style.display = 'flex';
      console.log('✅ Selection screen shown');
    }

    if (microContent) {
      microContent.classList.remove('active');
      console.log('✅ Micro content hidden');
    }
    if (macroContent) {
      macroContent.classList.remove('active');
      console.log('✅ Macro content hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.showFinanceSelection = function() {
    console.log('🔄 showFinanceSelection called');
    var selectionScreen = document.getElementById('finance-selection-screen');
    var personalContent = document.getElementById('finance-personal-content');
    var businessContent = document.getElementById('finance-business-content');

    console.log('Selection screen:', selectionScreen);
    console.log('Personal content:', personalContent);
    console.log('Business content:', businessContent);

    if (selectionScreen) {
      selectionScreen.style.display = 'flex';
      console.log('✅ Selection screen shown');
    }

    if (personalContent) {
      personalContent.classList.remove('active');
      console.log('✅ Personal content hidden');
    }
    if (businessContent) {
      businessContent.classList.remove('active');
      console.log('✅ Business content hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle interpretation section clicks
  window.showInterpretationSection = function(section) {
    console.log('🔄 showInterpretationSection called with:', section);
    var selectionScreen = document.getElementById('interpretation-selection-screen');
    var contentSection = document.getElementById('interpretation-' + section + '-content');

    console.log('Selection screen:', selectionScreen);
    console.log('Content section:', contentSection);

    if (selectionScreen) {
      selectionScreen.style.display = 'none';
      console.log('✅ Selection screen hidden');
    }

    if (contentSection) {
      contentSection.classList.add('active');
      console.log('✅ Content section shown with active class:', contentSection.classList.contains('active'));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch and render dynamic interpretation content
    if (section === 'micro') {
      loadMicroInterpretation();
    } else if (section === 'macro') {
      loadMacroInterpretation();
    }
  };

  // Handle finance section clicks
  window.showFinanceSection = function(section) {
    var selectionScreen = document.getElementById('finance-selection-screen');
    var contentSection = document.getElementById('finance-' + section + '-content');

    if (selectionScreen) {
      selectionScreen.style.display = 'none';
    }

    if (contentSection) {
      contentSection.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch and render dynamic finance data
    if (section === 'personal') {
      loadPersonalFinance();
    } else if (section === 'business') {
      loadBusinessFinance();
    }
  };

  // Load and render Micro Economic Interpretation (Finance data)
  window.loadMicroInterpretation = async function() {
    console.log('🔄 Loading Micro Economic Interpretation...');
    var scrollBody = document.querySelector('#micro-scroll .scroll-body');

    if (!scrollBody) {
      console.error('❌ Micro scroll body not found');
      return;
    }

    // Show loading state
    scrollBody.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>🔄 Loading your financial story...</p></div>';

    try {
      if (!window.JosephAPI || !window.JosephAPI.interpret) {
        throw new Error('Joseph API not available');
      }

      const response = await window.JosephAPI.interpret.getMicro();
      console.log('Micro interpretation response:', response);

      if (response && response.success && response.interpretation) {
        renderMicroInterpretation(response.interpretation, scrollBody);
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('❌ Error loading micro interpretation:', error);
      scrollBody.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #ef4444;">❌ Unable to load financial data</p>
          <p style="font-size: 13px; color: #6b7280; margin-top: 0.5rem;">${error.message}</p>
          <button onclick="loadMicroInterpretation()" style="margin-top: 1rem; padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">Retry</button>
        </div>
      `;
    }
  };

  // Load and render Macro Economic Interpretation (Dream data)
  window.loadMacroInterpretation = async function() {
    console.log('🔄 Loading Macro Economic Interpretation...');
    var scrollBody = document.querySelector('#macro-scroll .scroll-body');

    if (!scrollBody) {
      console.error('❌ Macro scroll body not found');
      return;
    }

    // Show loading state
    scrollBody.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>🔄 Loading economic intelligence...</p></div>';

    try {
      if (!window.JosephAPI || !window.JosephAPI.interpret) {
        throw new Error('Joseph API not available');
      }

      const response = await window.JosephAPI.interpret.getMacro();
      console.log('Macro interpretation response:', response);

      if (response && response.success && response.interpretation) {
        renderMacroInterpretation(response.interpretation, scrollBody);
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('❌ Error loading macro interpretation:', error);
      scrollBody.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #ef4444;">❌ Unable to load economic data</p>
          <p style="font-size: 13px; color: #6b7280; margin-top: 0.5rem;">${error.message}</p>
          <button onclick="loadMacroInterpretation()" style="margin-top: 1rem; padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;">Retry</button>
        </div>
      `;
    }
  };

  // Render Micro Economic Interpretation
  function renderMicroInterpretation(data, container) {
    console.log('🎨 Rendering micro interpretation:', data);

    let itemsHtml = '';
    let itemNumber = 1;

    data.items.forEach(function(item) {
      let iconHtml = item.icon || '📊';
      let recommendationHtml = item.recommendation
        ? `<span class="item-implication warning">[Action Needed: ${item.recommendation}]</span>`
        : '';

      // Special handling for different item types
      if (item.label.includes('Budget Buckets') && item.breakdown) {
        let breakdownHtml = '<ul style="margin: 0.5rem 0 0 1.5rem; font-size: 13px;">';
        item.breakdown.forEach(function(cat) {
          let percent = cat.percent || 0;
          let color = percent > 100 ? '#ef4444' : percent > 80 ? '#f59e0b' : '#10b981';
          breakdownHtml += `<li style="margin: 0.25rem 0;"><span style="color: ${color};">${cat.category}:</span> ${percent}% (${cat.spent || cat.saved || 0} of ${cat.budget || cat.target || 0})</li>`;
        });
        breakdownHtml += '</ul>';

        itemsHtml += `
          <li class="interpretation-item">
            <span class="item-number">${itemNumber++}</span>
            <span class="item-content">
              <strong>${iconHtml} ${item.label} (${item.value})</strong> — ${item.context}
              ${breakdownHtml}
              ${recommendationHtml}
            </span>
          </li>
        `;
      } else if (item.label.includes('Runway')) {
        let runwayContext = item.context;
        if (item.runwayDays >= 60) {
          runwayContext += ' <span class="item-implication success">[Good News: Your runway is healthy! Keep maintaining this buffer.]</span>';
        } else if (item.runwayDays < 14) {
          runwayContext += ' <span class="item-implication warning">[URGENT: You have less than 2 weeks of cash. Cut all non-essential spending immediately!]</span>';
        }
        itemsHtml += `
          <li class="interpretation-item">
            <span class="item-number">${itemNumber++}</span>
            <span class="item-content">
              <strong>${iconHtml} ${item.label} (${item.value})</strong> — ${runwayContext}
              ${recommendationHtml}
            </span>
          </li>
        `;
      } else {
        itemsHtml += `
          <li class="interpretation-item">
            <span class="item-number">${itemNumber++}</span>
            <span class="item-content">
              <strong>${iconHtml} ${item.label} (${item.value})</strong> — ${item.context}
              ${recommendationHtml}
            </span>
          </li>
        `;
      }
    });

    container.innerHTML = `
      <div class="scroll-section">
        <h4 class="scroll-section-title">🧍 Your Personal Money Story</h4>
        <p class="scroll-intro">Here's what your finances are telling us right now:</p>
        <ol class="numbered-interpretations">
          ${itemsHtml}
        </ol>
      </div>
      <div class="bottom-line-summary" style="margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h4 style="margin: 0 0 0.5rem 0; font-size: 14px;">📌 Summary</h4>
        <p style="margin: 0; font-size: 13px; color: #4b5563;">${data.summary}</p>
      </div>
    `;
  }

  // Render Macro Economic Interpretation
  function renderMacroInterpretation(data, container) {
    console.log('🎨 Rendering macro interpretation:', data);

    let itemsHtml = '';
    let itemNumber = 1;

    data.items.forEach(function(item) {
      let iconHtml = item.icon || '📊';
      let trendHtml = item.trend ? ` (${item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'} ${item.change || ''})` : '';
      let impactHtml = item.impact ? `<br><small style="color: #6b7280;">Impact: ${item.impact}</small>` : '';
      let recommendationHtml = item.recommendation
        ? `<span class="item-implication ${item.value >= 20 ? 'warning' : 'success'}">[${item.recommendation}]</span>`
        : '';

      itemsHtml += `
        <li class="interpretation-item">
          <span class="item-number">${itemNumber++}</span>
          <span class="item-content">
            <strong>${iconHtml} ${item.label}: ${item.value}${trendHtml}</strong> — ${item.context}${impactHtml}
            ${recommendationHtml}
          </span>
        </li>
      `;
    });

    // Add health score if available
    let healthHtml = '';
    if (data.healthScore) {
      let healthColor = data.healthScore >= 70 ? '#10b981' : data.healthScore >= 50 ? '#f59e0b' : '#ef4444';
      healthHtml = `<div style="margin: 1rem 0; padding: 0.75rem; background: #f9fafb; border-radius: 6px; text-align: center;">
        <strong>Economic Health Score:</strong> <span style="color: ${healthColor}; font-size: 18px;">${data.healthScore}/100</span>
        <span style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: ${healthColor}; color: white; border-radius: 4px; font-size: 12px;">${data.overallStress || 'moderate'}</span>
      </div>`;
    }

    container.innerHTML = `
      <div class="scroll-section">
        <h4 class="scroll-section-title">📊 The Economic Weather Report</h4>
        <p class="scroll-intro">Right now, the Nigerian economy is at "${data.healthScore || 72}/100" — here's what's happening around you and why it matters:</p>
        ${healthHtml}
        <ol class="numbered-interpretations">
          ${itemsHtml}
        </ol>
      </div>
      <div class="bottom-line-summary" style="margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h4 style="margin: 0 0 0.5rem 0; font-size: 14px;">📌 Summary</h4>
        <p style="margin: 0; font-size: 13px; color: #4b5563;">${data.summary}</p>
      </div>
    `;
  }

  // ==========================================
  // FINANCE MODULE DYNAMIC LOADING
  // ==========================================

  // Load and render Personal Finance data
  window.loadPersonalFinance = async function() {
    console.log('🔄 Loading Personal Finance data...');

    try {
      if (!window.JosephAPI || !window.JosephAPI.finance) {
        throw new Error('Joseph Finance API not available');
      }

      // Fetch ledger, budget, transactions and goals in parallel
      const [ledgerResponse, transactionsResponse, goalsResponse] = await Promise.allSettled([
        window.JosephAPI.finance.getLedgerByType('life'),
        window.JosephAPI.finance.getTransactions({ ledgerType: 'life', limit: 30 }),
        window.JosephAPI.finance.getGoals()
      ]);

      if (ledgerResponse.status === 'fulfilled' && ledgerResponse.value?.success) {
        renderPersonalFinance(ledgerResponse.value.ledger);
      } else {
        throw new Error('Could not load ledger data');
      }

      if (transactionsResponse.status === 'fulfilled' && transactionsResponse.value?.success) {
        renderTransactionHistory(transactionsResponse.value.transactions);
      }

      if (goalsResponse.status === 'fulfilled' && goalsResponse.value?.success) {
        renderGoalsTable(goalsResponse.value.goals);
      }
    } catch (error) {
      console.error('❌ Error loading personal finance:', error);
      // Show error in survival bar
      updatePersonalFinanceError(error.message);
    }
  };

  // Load and render Business Finance data
  window.loadBusinessFinance = async function() {
    console.log('🔄 Loading Business Finance data...');

    try {
      if (!window.JosephAPI || !window.JosephAPI.finance) {
        throw new Error('Joseph Finance API not available');
      }

      // Fetch ledger and transactions in parallel
      const [ledgerResponse, transactionsResponse] = await Promise.allSettled([
        window.JosephAPI.finance.getLedgerByType('business'),
        window.JosephAPI.finance.getTransactions({ ledgerType: 'business', limit: 30 })
      ]);

      if (ledgerResponse.status === 'fulfilled' && ledgerResponse.value?.success) {
        renderBusinessFinance(ledgerResponse.value.ledger);
      } else {
        throw new Error('Could not load business ledger data');
      }

      if (transactionsResponse.status === 'fulfilled' && transactionsResponse.value?.success) {
        renderBusinessTransactionHistory(transactionsResponse.value.transactions);
      }
    } catch (error) {
      console.error('❌ Error loading business finance:', error);
      updateBusinessFinanceError(error.message);
    }
  };

  // Render Personal Finance data
  function renderPersonalFinance(ledger) {
    console.log('🎨 Rendering personal finance:', ledger);

    const balance = ledger.balance || 0;
    const monthlyBudget = ledger.budget?.monthlyBudget || 0;
    const totalExpenses = ledger.totalExpenses || 0;
    const burnRate = ledger.budget?.burnRate || ledger.runway?.burnRate || 0;
    const runwayDays = ledger.runway?.runwayDays || 0;

    // Calculate Safe-to-Spend
    const remainingBudget = Math.max(0, monthlyBudget - totalExpenses);
    const unallocatedIncome = Math.max(0, (ledger.totalIncome || 0) - monthlyBudget);
    const safeToSpend = remainingBudget + unallocatedIncome;

    // Calculate health score
    const healthScore = calculateHealthScore(balance, monthlyBudget, runwayDays, burnRate);

    // Update survival bar
    updateElement('personal-life-balance', formatCurrency(balance));
    updateElement('personal-safe-to-spend', formatCurrency(safeToSpend));
    updateElement('personal-daily-budget', formatCurrency(monthlyBudget / 30));
    updateElement('personal-savings', formatCurrency(ledger.budget?.categoryTracking?.savings?.saved || 0));
    updateElement('personal-health-score', healthScore);
    updateElement('personal-total-spent', formatCurrency(totalExpenses));

    // Update Safe-to-Spend ring
    updateSafeToSpendRing(safeToSpend, remainingBudget, monthlyBudget);

    // Update Status Quo Gauge
    updateStatusQuoGauge(totalExpenses, monthlyBudget, burnRate);

    // Update Budget Buckets
    updateBudgetBuckets(ledger.budget?.categoryTracking, ledger.budget?.allocation);

    // Update Burn Rate card
    updateBurnRateCard(burnRate, runwayDays, monthlyBudget);

    // Update dynamic Budget by Category table
    renderBudgetTable(ledger.budget?.categoryTracking, ledger.budget?.allocation);

    console.log('✅ Personal finance rendered successfully');
  }


  // Render Business Finance data
  function renderBusinessFinance(ledger) {
    console.log('🎨 Rendering business finance:', ledger);

    const balance = ledger.balance || 0;
    const workingCapital = ledger.capital?.workingCapital || 0;
    const availableCapital = ledger.capital?.availableCapital || 0;
    const runwayDays = ledger.runway?.runwayDays || 0;
    const burnRate = ledger.capital?.businessMetrics || {};

    // Calculate daily burn from expenses
    const monthlyExpenses = ledger.totalExpenses || 0;
    const dailyBurn = monthlyExpenses / 30;

    // Update survival bar
    updateElement('business-balance', formatCurrency(balance));
    updateElement('fin-locked-vault', formatCurrency(workingCapital));
    updateElement('fin-runway-days', formatRunway(runwayDays));
    updateElement('business-available', formatCurrency(availableCapital));

    // Update Available Capital ring
    updateBusinessCapitalRing(availableCapital, balance);

    // Update Vault donut
    updateVaultDonut(workingCapital, availableCapital, balance);

    // Update Burn Rate card
    updateBusinessBurnRateCard(dailyBurn, runwayDays, monthlyExpenses);

    console.log('✅ Business finance rendered successfully');
  }

  // Helper: Update element text content
  function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }

  // Helper: Format currency
  function formatCurrency(amount) {
    return '₦' + (amount || 0).toLocaleString();
  }

  // Helper: Format runway display
  function formatRunway(days) {
    if (days >= 30) {
      return Math.floor(days / 30) + ' Months';
    }
    return days + ' Days';
  }

  // Helper: Calculate health score
  function calculateHealthScore(balance, budget, runway, burnRate) {
    let score = 100;

    // Deduct for low balance
    if (balance < 10000) score -= 20;
    else if (balance < 50000) score -= 10;

    // Deduct for poor runway
    if (runway < 14) score -= 30;
    else if (runway < 30) score -= 15;

    // Deduct for high burn rate
    if (burnRate > (budget / 30) * 1.5) score -= 20;
    else if (burnRate > (budget / 30)) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  // Update Safe-to-Spend ring
  function updateSafeToSpendRing(safeToSpend, remainingBudget, monthlyBudget) {
    const ringText = document.querySelector('.safe-to-spend-ring .ring-svg + div div:first-child');
    const ringFill = document.querySelector('.safe-to-spend-ring .ring-fill');
    const ringStatus = document.querySelector('.safe-to-spend-ring + .ring-status');

    if (ringText) ringText.textContent = formatCurrency(safeToSpend);

    const percentUsed = monthlyBudget > 0 ? ((monthlyBudget - remainingBudget) / monthlyBudget) * 100 : 0;
    const circumference = 2 * Math.PI * 40; // r=40

    if (ringFill) {
      const dashOffset = circumference - (circumference * percentUsed / 100);
      ringFill.style.strokeDashoffset = dashOffset;

      // Update color based on health
      if (percentUsed > 100) {
        ringFill.style.stroke = '#ef4444';
        if (ringStatus) ringStatus.textContent = 'Over Budget';
      } else if (percentUsed > 80) {
        ringFill.style.stroke = '#f59e0b';
        if (ringStatus) ringStatus.textContent = 'Warning';
      } else {
        ringFill.style.stroke = '#10b981';
        if (ringStatus) ringStatus.textContent = 'Healthy';
      }
    }
  }

  // Update Status Quo Gauge
  function updateStatusQuoGauge(totalSpent, monthlyBudget, burnRate) {
    const gaugeFill = document.querySelector('.gauge-fill-horizontal.safe');
    const gaugeMessage = document.querySelector('.gauge-message');

    if (gaugeFill && monthlyBudget > 0) {
      const percentUsed = Math.min(100, (totalSpent / monthlyBudget) * 100);
      gaugeFill.style.width = percentUsed + '%';
    }

    if (gaugeMessage) {
      const remaining = Math.max(0, monthlyBudget - totalSpent);
      gaugeMessage.innerHTML = `You've spent ${formatCurrency(totalSpent)} this month. ${formatCurrency(remaining)} remaining.`;
    }
  }

  // Update Budget Buckets
  function updateBudgetBuckets(categoryTracking, allocation) {
    if (!categoryTracking) return;

    const categories = ['needs', 'wants', 'savings'];
    const icons = { needs: '🏠', wants: '🎯', savings: '🏦' };
    const titles = { needs: 'Needs (50%)', wants: 'Wants (30%)', savings: 'Savings (20%)' };
    const colors = { needs: 'needs', wants: 'wants', savings: 'future' };

    categories.forEach(cat => {
      const tracking = categoryTracking[cat];
      if (!tracking) return;

      const allocated = tracking.budget || 0;
      const spent = tracking.spent || tracking.saved || 0;
      const percent = allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0;

      // Find bucket element by class or update all buckets
      const buckets = document.querySelectorAll('.budget-bucket');
      buckets.forEach((bucket, index) => {
        if (index < 3 && categories[index] === cat) {
          // Update allocated
          const allocatedEl = bucket.querySelector('.bucket-allocated');
          if (allocatedEl) allocatedEl.textContent = `${formatCurrency(allocated)} allocated`;

          // Update spent
          const spentEl = bucket.querySelector('.bucket-spent');
          if (spentEl) spentEl.textContent = `${formatCurrency(spent)} ${cat === 'savings' ? 'saved' : 'spent'}`;

          // Update progress bar
          const progressEl = bucket.querySelector('.bucket-progress-fill');
          if (progressEl) progressEl.style.width = percent + '%';
        }
      });
    });
  }

  // Update Burn Rate card
  function updateBurnRateCard(burnRate, runwayDays, monthlyBudget) {
    const burnRateEl = document.querySelector('.feat-card .gauge-title')?.closest('.feat-card');
    if (!burnRateEl) return;

    // Find the burn rate card by looking for "Live Burn Rate Tracker"
    const cards = document.querySelectorAll('.feat-card');
    cards.forEach(card => {
      const title = card.querySelector('.gauge-title');
      if (title && title.textContent.includes('Live Burn Rate')) {
        const valueEl = card.querySelector('.feat-card > div > div[style*="font-size: 36px"]');
        if (valueEl) valueEl.textContent = formatCurrency(burnRate);

        const runwayEl = card.querySelector('.gauge-labels-horizontal span:first-child');
        if (runwayEl) runwayEl.textContent = `${runwayDays} days runway`;

        const monthlyEl = card.querySelector('.gauge-labels-horizontal span:last-child');
        if (monthlyEl) monthlyEl.textContent = `Monthly: ${formatCurrency(burnRate * 30)}`;
      }
    });
  }

  // Update Business Capital ring
  function updateBusinessCapitalRing(availableCapital, totalBalance) {
    const ringText = document.querySelector('#finance-business-content .safe-to-spend-ring .ring-svg + div div:first-child');
    const ringStatus = document.querySelector('#finance-business-content .safe-to-spend-ring + .ring-status');

    if (ringText) ringText.textContent = formatCurrency(availableCapital);

    if (ringStatus) {
      const vaultPercent = totalBalance > 0 ? ((totalBalance - availableCapital) / totalBalance) * 100 : 70;
      ringStatus.textContent = `${Math.round(vaultPercent)}% in Vault Protected`;
    }
  }

  // Update Vault donut
  function updateVaultDonut(workingCapital, availableCapital, totalBalance) {
    const donutValue = document.querySelector('.donut-value');
    const vaultStats = document.querySelectorAll('.vault-stat-value');

    if (donutValue) donutValue.textContent = formatCurrency(workingCapital);

    if (vaultStats.length >= 3) {
      vaultStats[0].textContent = formatCurrency(totalBalance); // Total Sales
      vaultStats[1].textContent = formatCurrency(workingCapital); // Vault
      vaultStats[2].textContent = formatCurrency(availableCapital); // Available
    }
  }

  // Update Business Burn Rate card
  function updateBusinessBurnRateCard(dailyBurn, runwayDays, monthlyExpenses) {
    const cards = document.querySelectorAll('#finance-business-content .feat-card');

    cards.forEach(card => {
      const title = card.querySelector('.gauge-title');
      if (title && title.textContent.includes('Live Burn Rate')) {
        const valueEl = card.querySelector('.feat-card > div > div[style*="font-size: 36px"]');
        if (valueEl) valueEl.textContent = formatCurrency(dailyBurn);

        const runwayEl = card.querySelector('.gauge-labels-horizontal span:first-child');
        if (runwayEl) runwayEl.textContent = `${runwayDays} days runway`;

        const monthlyEl = card.querySelector('.gauge-labels-horizontal span:last-child');
        if (monthlyEl) monthlyEl.textContent = `Monthly: ${formatCurrency(monthlyExpenses)}`;
      }
    });
  }

  // Update personal finance error state
  function updatePersonalFinanceError(message) {
    updateElement('personal-life-balance', '—');
    updateElement('personal-safe-to-spend', 'Error');
    updateElement('personal-daily-budget', '—');
    updateElement('personal-health-score', '—');
    console.error('Personal finance error:', message);
  }

  // Update business finance error state
  function updateBusinessFinanceError(message) {
    updateElement('business-balance', '—');
    updateElement('fin-locked-vault', 'Error');
    updateElement('fin-runway-days', '—');
    updateElement('business-available', '—');
    console.error('Business finance error:', message);
  }

  // ==========================================
  // DYNAMIC TABLE RENDERERS
  // ==========================================

  /**
   * Render Budget by Category table from API data
   * Expects ledger.budget.categoryTracking = { needs:{budget,spent}, wants:{budget,spent}, savings:{budget,saved} }
   */
  function renderBudgetTable(categoryTracking, allocation) {
    const tbody = document.getElementById('dynamic-budget-table');
    if (!tbody) return;

    if (!categoryTracking) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary)">No budget data yet. Add transactions to see your budget breakdown.</td></tr>`;
      return;
    }

    const cats = [
      { key: 'needs',   label: 'Needs'   },
      { key: 'wants',   label: 'Wants'   },
      { key: 'savings', label: 'Savings' }
    ];

    let html = '';
    cats.forEach(({ key, label }) => {
      const t = categoryTracking[key] || {};
      const budget  = t.budget  || t.target || 0;
      const spent   = t.spent   || t.saved  || 0;
      const balance = budget - spent;
      const pct     = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      const clamp   = Math.min(pct, 100);
      const color   = pct > 100 ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : '#84cc16';
      const balClass= balance < 0 ? 'status-danger' : '';

      html += `
        <tr>
          <td>${label}</td>
          <td>${formatCurrency(budget)}</td>
          <td>${formatCurrency(spent)}</td>
          <td>
            <div class="progress-cell">
              <div class="circ-progress" style="background:conic-gradient(${color} calc(${clamp} * 1%),var(--bg-tertiary) 0);">
                <span class="circ-value" style="color:${color}">${pct}%</span>
              </div>
            </div>
          </td>
          <td class="${balClass}">${balance < 0 ? '-' : ''}${formatCurrency(Math.abs(balance))}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
  }

  /**
   * Render Financial Goals table from API data
   * Expects goals[] from GET /api/finance/goals
   */
  function renderGoalsTable(goals) {
    const tbody = document.getElementById('dynamic-goals-table');
    if (!tbody) return;

    if (!goals || goals.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary)">No goals yet. Click <strong>+ Add Goal</strong> to get started.</td></tr>`;
      return;
    }

    let html = '';
    goals.forEach(goal => {
      const target    = goal.targetValue  || 0;
      const saved     = goal.currentValue || 0;
      const remaining = Math.max(0, target - saved);
      const pct       = target > 0 ? Math.round((saved / target) * 100) : 0;
      const clamp     = Math.min(pct, 100);
      const color     = pct >= 75 ? '#84cc16' : pct >= 40 ? 'var(--primary)' : 'var(--warning)';

      html += `
        <tr>
          <td>${goal.title}</td>
          <td>${formatCurrency(target)}</td>
          <td>${formatCurrency(saved)}</td>
          <td>
            <div class="progress-cell">
              <div class="circ-progress" style="background:conic-gradient(${color} calc(${clamp} * 1%),var(--bg-tertiary) 0);">
                <span class="circ-value" style="color:${color}">${pct}%</span>
              </div>
            </div>
          </td>
          <td>${formatCurrency(remaining)}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
  }

  /**
   * Render Transaction History from API data
   * Expects transactions[] from GET /api/finance/transactions
   */
  function renderTransactionHistory(transactions) {
    const incomingList  = document.getElementById('dynamic-incoming-list');
    const outgoingList  = document.getElementById('dynamic-outgoing-list');
    const incomingTotal = document.getElementById('dynamic-incoming-total');
    const outgoingTotal = document.getElementById('dynamic-outgoing-total');

    if (!incomingList || !outgoingList) return;

    if (!transactions || transactions.length === 0) {
      const empty = `<div style="padding:1rem;color:var(--text-secondary);font-size:13px;">No transactions found.</div>`;
      incomingList.innerHTML = empty;
      outgoingList.innerHTML = empty;
      return;
    }

    const incoming = transactions.filter(t => t.type === 'CREDIT');
    const outgoing = transactions.filter(t => t.type === 'DEBIT');

    const toItem = (t) => {
      const label = t.narration || t.description || t.merchant || t.beneficiary || 'Transaction';
      const date  = t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-NG', { day:'numeric', month:'short' }) : '';
      return `
        <div class="finance-history-item ${t.type === 'CREDIT' ? 'incoming' : 'outgoing'}">
          <span class="finance-history-amount">${formatCurrency(t.amount).replace('₦','')}</span>
          <span class="finance-history-desc">(${label})</span>
          <span style="margin-left:auto;font-size:11px;color:var(--text-secondary)">${date}</span>
        </div>`;
    };

    const sumIn  = incoming.reduce((s, t) => s + t.amount, 0);
    const sumOut = outgoing.reduce((s, t) => s + t.amount, 0);

    incomingList.innerHTML  = incoming.length ? incoming.map(toItem).join('') : '<div style="padding:1rem;color:var(--text-secondary);font-size:13px;">No incoming transactions.</div>';
    outgoingList.innerHTML  = outgoing.length ? outgoing.map(toItem).join('') : '<div style="padding:1rem;color:var(--text-secondary);font-size:13px;">No outgoing transactions.</div>';
    if (incomingTotal) incomingTotal.textContent = `Total: ${formatCurrency(sumIn)}`;
    if (outgoingTotal) outgoingTotal.textContent = `Total: ${formatCurrency(sumOut)}`;
  }

  /**
   * Render Business Transaction History from API data
   */
  function renderBusinessTransactionHistory(transactions) {
    const incomingList  = document.getElementById('business-incoming-list');
    const outgoingList  = document.getElementById('business-outgoing-list');
    const incomingTotal = document.getElementById('business-incoming-total');
    const outgoingTotal = document.getElementById('business-outgoing-total');

    if (!incomingList || !outgoingList) return;

    if (!transactions || transactions.length === 0) {
      const empty = `<div style="padding:1rem;color:var(--text-secondary);font-size:13px;">No business transactions found.</div>`;
      incomingList.innerHTML = empty;
      outgoingList.innerHTML = empty;
      return;
    }

    const incoming = transactions.filter(t => t.type === 'CREDIT');
    const outgoing = transactions.filter(t => t.type === 'DEBIT');

    const toItem = (t) => {
      const label = t.narration || t.description || t.merchant || t.beneficiary || 'Transaction';
      const date  = t.timestamp ? new Date(t.timestamp).toLocaleDateString('en-NG', { day:'numeric', month:'short' }) : '';
      return `
        <div class="finance-history-item ${t.type === 'CREDIT' ? 'incoming' : 'outgoing'}">
          <span class="finance-history-amount">${formatCurrency(t.amount).replace('₦','')}</span>
          <span class="finance-history-desc">(${label})</span>
          <span style="margin-left:auto;font-size:11px;color:var(--text-secondary)">${date}</span>
        </div>`;
    };

    const sumIn  = incoming.reduce((s, t) => s + t.amount, 0);
    const sumOut = outgoing.reduce((s, t) => s + t.amount, 0);

    incomingList.innerHTML  = incoming.length ? incoming.map(toItem).join('') : '<div style="padding:1rem;color:var(--text-secondary);font-size:13px;">No incoming business transactions.</div>';
    outgoingList.innerHTML  = outgoing.length ? outgoing.map(toItem).join('') : '<div style="padding:1rem;color:var(--text-secondary);font-size:13px;">No outgoing business transactions.</div>';
    if (incomingTotal) incomingTotal.textContent = `Total: ${formatCurrency(sumIn)}`;
    if (outgoingTotal) outgoingTotal.textContent = `Total: ${formatCurrency(sumOut)}`;
  }

  // ==========================================
  // STRATEGY MODULE DYNAMIC LOADING
  // ==========================================

  // Load and render Strategy dashboard
  window.loadStrategyDashboard = async function() {
    console.log('🔄 Loading Strategy Dashboard...');

    try {
      if (!window.JosephAPI || !window.JosephAPI.strategy) {
        throw new Error('Joseph Strategy API not available');
      }

      // Fetch multiple data sources in parallel
      const [dashboardResponse, goalsResponse, pricingResponse] = await Promise.allSettled([
        window.JosephAPI.strategy.getDashboard(),
        window.JosephAPI.strategy.getGoals(),
        window.JosephAPI.strategy.getPricingOverview()
      ]);

      // Process dashboard data
      if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value?.success) {
        renderStrategyDashboard(dashboardResponse.value.data);
      }

      // Process goals data
      if (goalsResponse.status === 'fulfilled' && goalsResponse.value?.success) {
        renderStrategyGoals(goalsResponse.value.data);
      }

      // Process pricing data
      if (pricingResponse.status === 'fulfilled' && pricingResponse.value?.success) {
        renderPricingOverview(pricingResponse.value.data);
      }

      // Also get business ledger data for break-even calculations
      const businessLedger = await window.JosephAPI.finance.getLedgerByType('business');
      if (businessLedger?.success && businessLedger.ledger) {
        renderBreakEvenAnalysis(businessLedger.ledger);
      }

      console.log('✅ Strategy dashboard loaded successfully');
    } catch (error) {
      console.error('❌ Error loading strategy dashboard:', error);
    }
  };

  // Render Strategy Dashboard data
  function renderStrategyDashboard(data) {
    console.log('🎨 Rendering strategy dashboard:', data);

    // Update AI Strategy Recommendations if available
    if (data.recommendations && data.recommendations.length > 0) {
      renderStrategyRecommendations(data.recommendations);
    }
  }

  // Render Strategy Goals
  function renderStrategyGoals(goalsData) {
    console.log('🎨 Rendering strategy goals:', goalsData);

    if (!goalsData || !goalsData.goals || goalsData.goals.length === 0) {
      return;
    }

    // Find the active/emergency fund goal
    const activeGoal = goalsData.goals.find(g => g.category === 'emergency_fund' || g.category === 'savings') || goalsData.goals[0];

    if (activeGoal) {
      updateStrategySnapshot(activeGoal);
      renderForecastTimeline(activeGoal);
    }
  }

  // Update Strategy Snapshot card
  function updateStrategySnapshot(goal) {
    const snapshotGoal = document.querySelector('.snapshot-goal');
    const snapshotTarget = document.querySelector('.snapshot-target');
    const snapshotStatus = document.querySelector('.snapshot-status');

    if (snapshotGoal) snapshotGoal.textContent = goal.title || 'Build Emergency Fund';

    if (snapshotTarget) {
      const current = goal.currentAmount || 0;
      const target = goal.targetAmount || goal.target || 0;
      snapshotTarget.textContent = `Current: ${formatCurrency(current)} / Target: ${formatCurrency(target)}`;
    }

    if (snapshotStatus) {
      const progress = goal.progress || 0;
      snapshotStatus.innerHTML = progress >= 70 ? '<span>✓</span> On Track' : '<span>⏳</span> In Progress';
    }

    // Update progress items
    const progressItems = document.querySelectorAll('.progress-item');
    if (progressItems.length >= 3) {
      const current = goal.currentAmount || 0;
      const target = goal.targetAmount || goal.target || 0;
      const remaining = Math.max(0, target - current);
      const progress = Math.min(100, (current / target) * 100);

      progressItems[0].querySelector('.progress-value').textContent = Math.round(progress) + '%';
      progressItems[1].querySelector('.progress-value').textContent = formatCurrency(remaining);
      progressItems[2].querySelector('.progress-value').textContent = (goal.timeline || '6 mo');
    }
  }

  // Render Forecast Timeline
  function renderForecastTimeline(goal) {
    const timelineEvents = document.querySelector('.timeline-events');
    if (!timelineEvents || !goal.milestones) return;

    const milestones = goal.milestones || [];
    let html = '';

    milestones.forEach((milestone, index) => {
      const isReached = milestone.completed || milestone.status === 'completed';
      const isCurrent = index === 0 && !isReached;

      html += `
        <div class="timeline-event ${isReached ? 'reached' : ''} ${isCurrent ? 'current' : ''}">
          ${isReached ? '<div class="timeline-event-check">✓</div>' : ''}
          <div class="timeline-event-date">${milestone.timeline || 'Week ' + (index + 1)}</div>
          <div class="timeline-event-milestone">${formatCurrency(milestone.amount || milestone.target)} ${milestone.title || 'Milestone'}</div>
          <div class="timeline-event-amount">${isReached ? 'Achieved' : isCurrent ? 'On Track' : 'Projected'}</div>
          <div class="timeline-event-description">${milestone.description || 'Milestone ' + (index + 1)}</div>
        </div>
      `;
    });

    timelineEvents.innerHTML = html;
  }

  // Render Strategy Recommendations
  function renderStrategyRecommendations(recommendations) {
    const adviceHub = document.querySelector('.strategy-advice-hub');
    if (!adviceHub) return;

    let html = '';
    recommendations.forEach(rec => {
      const priorityClass = rec.type === 'urgent' ? 'high' : rec.type === 'warning' ? 'medium' : 'low';
      const statusClass = rec.viewed ? '' : 'unread';
      const statusText = rec.viewed ? 'Reviewed' : 'New';

      html += `
        <div class="advice-card ${priorityClass}">
          <div class="advice-content">
            <div class="advice-title">${rec.title}</div>
            <div class="advice-reason">${rec.message}</div>
            <div class="advice-impact">${rec.impact || 'Take action to improve your financial position'}</div>
          </div>
          <div class="advice-actions">
            <div class="advice-status ${statusClass}">${statusText}</div>
          </div>
        </div>
      `;
    });

    adviceHub.innerHTML = html;
  }

  // Render Pricing Overview
  function renderPricingOverview(pricingData) {
    console.log('🎨 Rendering pricing overview:', pricingData);

    if (!pricingData) return;

    // Update procurement options if data available
    if (pricingData.procurement && pricingData.procurement.options) {
      updateProcurementOptions(pricingData.procurement);
    }
  }

  // Render Break-Even Analysis
  function renderBreakEvenAnalysis(businessLedger) {
    console.log('🎨 Rendering break-even analysis:', businessLedger);

    const fixedCosts = 30000; // Default, can be made configurable
    const netProfit = businessLedger.businessMetrics?.netProfit || businessLedger.totalIncome - businessLedger.totalExpenses || 0;
    const remainingToBreakEven = Math.max(0, fixedCosts - netProfit);

    // Update break-even gauge
    const beGaugeFill = document.getElementById('be-gauge-fill');
    const beStatusLabel = document.getElementById('be-status-pill');
    const beTargetLabel = document.getElementById('be-target-lbl');
    const beLoggedProfit = document.getElementById('be-logged-profit');
    const beRemainingGap = document.getElementById('be-remaining-gap');
    const beBannerBox = document.getElementById('be-banner-box');

    if (beGaugeFill) {
      const progress = Math.min(100, (netProfit / fixedCosts) * 100);
      beGaugeFill.style.width = progress + '%';

      // Update color based on progress
      beGaugeFill.className = 'gauge-fill ' + (progress >= 100 ? 'green' : progress >= 70 ? 'amber' : 'red');
    }

    if (beStatusLabel) {
      const percent = Math.min(100, (netProfit / fixedCosts) * 100);
      if (percent >= 100) {
        beStatusLabel.textContent = 'Green Zone';
        beStatusLabel.className = 'pill pill-green';
      } else if (percent >= 70) {
        beStatusLabel.textContent = 'Amber Zone';
        beStatusLabel.className = 'pill pill-gold';
      } else {
        beStatusLabel.textContent = 'Red Zone';
        beStatusLabel.className = 'pill pill-red';
      }
    }

    if (beTargetLabel) beTargetLabel.textContent = 'Target: ' + formatCurrency(fixedCosts);
    if (beLoggedProfit) beLoggedProfit.textContent = formatCurrency(netProfit);
    if (beRemainingGap) beRemainingGap.textContent = formatCurrency(remainingToBreakEven);

    if (beBannerBox) {
      if (remainingToBreakEven <= 0) {
        beBannerBox.className = 'be-banner green';
        beBannerBox.innerHTML = '✅ <strong>Green Zone:</strong> You\'ve broken even! All additional sales are pure profit.';
      } else {
        const bottlesToSell = Math.ceil(remainingToBreakEven / 1000); // Assuming ₦1000 profit per bottle
        beBannerBox.className = 'be-banner amber';
        beBannerBox.innerHTML = '🔴 <strong>Amber Zone:</strong> ' + formatCurrency(remainingToBreakEver) + ' away from break-even. Sell ' + bottlesToSell + ' more bottles to cross into profit!';
      }
    }
  }

  // Update Procurement Options
  function updateProcurementOptions(procurementData) {
    const pOptCurrent = document.getElementById('p-opt-current');
    const pOptWholesale = document.getElementById('p-opt-wholesale');
    const tradeoffText = document.getElementById('tradeoff-text');
    const tradeoffVerdict = document.getElementById('tradeoff-verdict');

    if (procurementData.options && procurementData.options.length >= 2) {
      const currentOption = procurementData.options[0];
      const wholesaleOption = procurementData.options[1];

      if (pOptCurrent) {
        pOptCurrent.querySelector('.p-opt-detail').textContent =
          formatCurrency(currentOption.cost) + ' → Unit COGS: ' + formatCurrency(currentOption.unitCost) + '/bottle';
      }

      if (pOptWholesale) {
        const savings = currentOption.unitCost - wholesaleOption.unitCost;
        const savingsPercent = Math.round((savings / currentOption.unitCost) * 100);
        pOptWholesale.querySelector('.p-opt-detail').textContent =
          formatCurrency(wholesaleOption.cost) + ' → Unit COGS: ' + formatCurrency(wholesaleOption.unitCost) + '/bottle (−' + savingsPercent + '%)';
      }
    }

    if (tradeoffVerdict && procurementData.recommendation) {
      tradeoffVerdict.innerHTML = procurementData.recommendation;
    }
  }

  // Toggle scroll function for fold/unfold buttons
  window.toggleScroll = function(scrollId) {
    var scroll = document.getElementById(scrollId);
    if (scroll) {
      scroll.classList.toggle('folded');
    }
  };

  // Add event listeners for back to selection buttons
  var interpretationBackBtns = document.querySelectorAll('.interpretation-back-btn');
  interpretationBackBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      showInterpretationSelection();
    });
  });

  var financeBackBtns = document.querySelectorAll('.finance-back-btn');
  financeBackBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      showFinanceSelection();
    });
  });

  // Add event listeners for scroll fold buttons
  var scrollFoldBtns = document.querySelectorAll('.scroll-fold-btn');
  scrollFoldBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var scrollId = btn.getAttribute('data-scroll');
      if (scrollId) {
        toggleScroll(scrollId);
      }
    });
  });

  // ==========================================
  // FINANCE SUMMARY - Dynamic Plain English Reports
  // ==========================================

  // Personal Finance Summary Generator
  function updatePersonalFinanceSummary() {
    const summaryEl = document.getElementById('personal-finance-summary');
    if (!summaryEl) return;

    // Get all values from the Personal Finance module
    const personalBalance = document.getElementById('personal-life-balance')?.textContent || '₦0';
    const safeToSpend = document.getElementById('personal-safe-to-spend')?.textContent || '₦0';
    const dailyBudget = document.getElementById('personal-daily-budget')?.textContent || '₦0';
    const savings = document.getElementById('personal-savings')?.textContent || '₦0';
    const healthScore = document.getElementById('personal-health-score')?.textContent || '0';
    const totalSpent = document.getElementById('personal-total-spent')?.textContent || '₦0';

    // Generate plain English summary
    const summary = `
      <p><strong>Your Financial Overview:</strong></p>
      <p>You have a Personal Balance of ${personalBalance}. This is your total available cash across all accounts.</p>
      <p>Your Safe-to-Spend is ${safeToSpend}. This is the amount you can freely spend without affecting your budget or savings goals.</p>
      <p>Your Daily Budget is set at ${dailyBudget}. This is your planned spending limit per day.</p>
      <p>You have saved ${savings} so far. This represents money set aside for your future goals and emergencies.</p>
      <p>Your Financial Health Score is ${healthScore} out of 100. ${healthScore >= 70 ? 'This is a good score indicating healthy financial habits.' : healthScore >= 50 ? 'This score suggests room for improvement in your financial management.' : 'This score indicates you need to review your spending habits.'}</p>
      <p>You have spent ${totalSpent} this month. Tracking your spending helps you stay within budget.</p>
      <p><strong>What this means:</strong> ${parseInt(safeToSpend.replace('₦', '')) > 500 ? 'You are within your safe spending range. Keep tracking your expenses to maintain this healthy position.' : 'Your safe-to-spend amount is getting low. Consider reviewing your spending before the end of the month.'}</p>
    `;

    summaryEl.innerHTML = summary;
  }

  // Business Finance Summary Generator
  function updateBusinessFinanceSummary() {
    const summaryEl = document.getElementById('business-finance-summary');
    if (!summaryEl) return;

    // Get all values from the Business Finance module
    const businessBalance = document.getElementById('business-balance')?.textContent || '₦0';
    const vaultCapital = document.getElementById('fin-locked-vault')?.textContent || '₦0';
    const runway = document.getElementById('fin-runway-days')?.textContent || '0 Days';
    const available = document.getElementById('business-available')?.textContent || '₦0';

    // Generate plain English summary
    const summary = `
      <p><strong>Your Business Financial Overview:</strong></p>
      <p>Your Business Ledger shows ${businessBalance}. This is your total revenue collected this month.</p>
      <p>You have ${vaultCapital} locked in your Working Capital Vault. This money is protected and set aside for restocking inventory. It cannot be spent on operations.</p>
      <p>Your current business runway is ${runway}. This means your business can survive for this many days at current spending levels before needing more revenue.</p>
      <p>You have ${available} available for operations. This is your spendable capital for daily expenses, marketing, and other business needs.</p>
      <p><strong>What this means:</strong> ${parseInt(runway) >= 21 ? 'Your business has a healthy runway. You have time to focus on growth strategies.' : parseInt(runway) >= 14 ? 'Your runway is moderate. Consider increasing sales or reducing expenses to extend it beyond 21 days.' : 'Your runway is critical. Focus on increasing sales immediately to avoid running out of operating capital.'}</p>
      <p><strong>Vault Protection:</strong> By locking 70% of sales (${vaultCapital}) in your vault, you ensure that restock capital is always available. This prevents mixing sales revenue with operational spending.</p>
    `;

    summaryEl.innerHTML = summary;
  }

  // Initialize finance summaries on page load
  updatePersonalFinanceSummary();
  updateBusinessFinanceSummary();

  // Auto-update summaries when values change (using MutationObserver)
  const observeFinanceChanges = function() {
    const personalSection = document.getElementById('finance-personal-content');
    const businessSection = document.getElementById('finance-business-content');

    if (personalSection) {
      const observer = new MutationObserver(() => updatePersonalFinanceSummary());
      observer.observe(personalSection, { subtree: true, characterData: true, childList: true });
    }

    if (businessSection) {
      const observer = new MutationObserver(() => updateBusinessFinanceSummary());
      observer.observe(businessSection, { subtree: true, characterData: true, childList: true });
    }
  };

  observeFinanceChanges();

  // ==========================================
  // SETTINGS DROPDOWN & USER PROFILE
  // ==========================================

  // Toggle settings dropdown
  window.toggleSettings = function() {
    const dropdown = document.getElementById('settings-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('settings-dropdown');
    const settingsBtn = document.getElementById('settings-btn');
    if (dropdown && !dropdown.contains(e.target) && !settingsBtn.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  // Load user profile data (placeholder - would come from backend)
  function loadUserProfile() {
    // In production, this would fetch from your backend
    const user = {
      name: localStorage.getItem('userName') || 'User Name',
      email: localStorage.getItem('userEmail') || 'user@email.com',
      business: localStorage.getItem('userBusiness') || 'My Business'
    };

    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const avatarEl = document.getElementById('user-avatar-icon');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }

  // Load user profile on init
  loadUserProfile();

  // Account Details Modal
  window.openAccountModal = function() {
    const name = localStorage.getItem('userName') || '';
    const email = localStorage.getItem('userEmail') || '';

    const modalHTML = `
      <div class="modal-overlay" onclick="closeAccountModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2>Account Details</h2>
            <button class="modal-close" onclick="closeAccountModal()">✕</button>
          </div>
          <form id="account-form" onsubmit="saveAccountDetails(event)">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="account-name" value="${name}" required>
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="account-email" value="${email}" required>
            </div>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </form>
        </div>
      </div>
    `;

    // Create modal if it doesn't exist
    let modal = document.getElementById('account-modal');
    if (!modal) {
      const modalDiv = document.createElement('div');
      modalDiv.id = 'account-modal';
      modalDiv.innerHTML = modalHTML;
      document.body.appendChild(modalDiv);
    }
    modal.classList.add('show');
    toggleSettings(); // Close dropdown
  };

  window.closeAccountModal = function() {
    const modal = document.getElementById('account-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  };

  window.saveAccountDetails = function(e) {
    e.preventDefault();
    const name = document.getElementById('account-name').value;
    const email = document.getElementById('account-email').value;

    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);

    loadUserProfile();
    closeAccountModal();
    alert('Account details saved successfully!');
  };

  // Business Profile Modal (placeholder)
  window.openBusinessModal = function() {
    alert('Business Profile editor coming soon!');
    toggleSettings();
  };

  // Dark Mode Toggle
  window.toggleDarkMode = function() {
    const body = document.body;
    const toggle = document.getElementById('dark-mode-toggle');

    body.classList.toggle('dark-mode');
    toggle.classList.toggle('active');

    // Save preference
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
  };

  // Load dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.classList.add('active');
  }

  // Language Modal (placeholder)
  window.openLanguageModal = function() {
    alert('Language selector coming soon! Supported languages: English, Pidgin, Hausa, Yoruba, Igbo.');
    toggleSettings();
  };

  // Notifications Modal (placeholder)
  window.openNotificationsModal = function() {
    alert('Notification settings coming soon!');
    toggleSettings();
  };

  // Logout
  window.logout = async function() {
    if (confirm('Are you sure you want to logout?')) {
      if (window.JosephAPI && window.JosephAPI.auth) {
        await window.JosephAPI.auth.logout();
      } else {
        localStorage.removeItem('joseph_user');
        window.location.href = 'login.html';
      }
    }
  };

  // ==========================================
  // MICRO ECONOMIC SCROLL — DYNAMIC VALUE INJECTION
  // ==========================================

  /**
   * Update Micro Economic Interpretation scroll with live values from Finance modules
   * This is a deterministic method — reads directly from DOM, no API calls
   * Uses data-value-source attributes for precise value targeting
   */
  window.updateMicroEconomicScroll = function() {
    console.log('🔄 Updating Micro Economic Scroll with live Finance values...');

    const scrollBody = document.querySelector('#micro-scroll .scroll-body');
    if (!scrollBody) {
      console.log('⏸️ Micro Economic scroll not visible, skipping update');
      return;
    }

    // Find all dynamic value elements
    const dynamicValues = scrollBody.querySelectorAll('.dynamic-value');
    console.log(`📊 Found ${dynamicValues.length} dynamic values to update`);

    let updateCount = 0;
    let skipCount = 0;

    // ==========================================
    // UPDATE EACH DYNAMIC VALUE
    // ==========================================

    dynamicValues.forEach(element => {
      const valueSource = element.getAttribute('data-value-source');
      const calculationType = element.getAttribute('data-calculate');

      if (!valueSource) {
        console.warn('⚠️ Element has .dynamic-value class but no data-value-source attribute');
        return;
      }

      try {
        let newValue = getValueFromSource(valueSource, calculationType);
        const oldValue = element.textContent.trim();

        if (newValue !== null && newValue !== oldValue) {
          element.textContent = newValue;
          updateCount++;
          console.log(`✨ Updated ${valueSource}: "${oldValue}" → "${newValue}"`);
        } else if (newValue === null) {
          skipCount++;
          console.log(`⏭️ Skipped ${valueSource} (source not available)`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${valueSource}:`, error.message);
      }
    });

    console.log(`✅ Micro Economic Scroll updated: ${updateCount} values changed, ${skipCount} skipped`);
  };

  // ==========================================
  // VALUE SOURCE FUNCTIONS
  // ==========================================

  function getValueFromSource(source, calculationType) {
    // If there's a calculation type, handle it
    if (calculationType) {
      return calculateValue(source, calculationType);
    }

    // Direct element lookup
    const element = document.getElementById(source);
    if (element) {
      return element.textContent.trim();
    }

    // Special handling for credit values
    if (source.startsWith('credit-')) {
      return getCreditValue(source);
    }

    // Special handling for calculated values
    if (source.includes('spent') || source.includes('expense')) {
      return getExpenseValue(source);
    }

    console.warn(`⚠️ Source ${source} not found`);
    return null;
  }

  function calculateValue(source, calculationType) {
    switch (calculationType) {
      case 'needs':
        // Sum of needs transactions (rent + food + other)
        const rent = getValueFromSource('personal-rent');
        const food = getValueFromSource('personal-food');
        if (rent && food) {
          // Parse currency values
          const rentValue = parseCurrency(rent);
          const foodValue = parseCurrency(food);
          return formatCurrency(rentValue + foodValue);
        }
        return null;

      case 'wants':
        // Sum of wants transactions (data + snacks + other)
        const data = getValueFromSource('personal-data');
        const snacks = getValueFromSource('personal-snacks');
        if (data && snacks) {
          const dataValue = parseCurrency(data);
          const snacksValue = parseCurrency(snacks);
          return formatCurrency(dataValue + snacksValue);
        }
        return null;

      case 'daily-safe':
        // Calculate: safe-to-spend ÷ days remaining
        const safeToSpend = getValueFromSource('personal-safe-to-spend');
        const daysRemaining = getValueFromSource('days-remaining');
        if (safeToSpend && daysRemaining) {
          const safeValue = parseCurrency(safeToSpend);
          const daysValue = parseInt(daysRemaining);
          if (daysValue > 0) {
            const dailySafe = Math.round(safeValue / daysValue);
            return formatCurrency(dailySafe);
          }
        }
        return null;

      case 'business-daily-safe':
        // Calculate: business-available ÷ runway days
        const businessAvailable = getValueFromSource('business-available');
        const runwayDays = getValueFromSource('fin-runway-days');
        if (businessAvailable && runwayDays) {
          const availableValue = parseCurrency(businessAvailable);
          const daysValue = parseInt(runwayDays);
          if (daysValue > 0) {
            const dailySafe = Math.round(availableValue / daysValue);
            return formatCurrency(dailySafe);
          }
        }
        return null;

      default:
        console.warn(`⚠️ Unknown calculation type: ${calculationType}`);
        return null;
    }
  }

  function getCreditValue(source) {
    // Find credit values from the Business Finance page
    if (source === 'credit-total-owed') {
      const creditOwedEl = document.querySelector('.credit-stat-value.credit-owed');
      return creditOwedEl ? creditOwedEl.textContent.trim() : null;
    }

    if (source === 'credit-fatima-amount') {
      const creditDueEl = document.querySelector('.credit-stat-value.credit-due');
      return creditDueEl ? creditDueEl.textContent.trim() : null;
    }

    if (source === 'credit-fatima-days') {
      // Find Fatima's credit entry and extract days
      const creditEntries = document.querySelectorAll('.credit-entry');
      for (const entry of creditEntries) {
        const nameEl = entry.querySelector('.credit-entry-name');
        if (nameEl && nameEl.textContent.includes('Fatima')) {
          const statusEl = entry.querySelector('.credit-entry-status');
          if (statusEl) {
            const match = statusEl.textContent.match(/(\d+)\s+days/);
            return match ? match[1] : null;
          }
        }
      }
      return null;
    }

    if (source === 'credit-chinedu-amount') {
      // Find Chinedu's credit entry
      const creditEntries = document.querySelectorAll('.credit-entry');
      for (const entry of creditEntries) {
        const nameEl = entry.querySelector('.credit-entry-name');
        if (nameEl && nameEl.textContent.includes('Chinedu')) {
          const amountEl = entry.querySelector('.credit-entry-amount');
          return amountEl ? amountEl.textContent.trim() : null;
        }
      }
      return null;
    }

    if (source === 'credit-chinedu-days') {
      // Find Chinedu's overdue days
      const creditEntries = document.querySelectorAll('.credit-entry');
      for (const entry of creditEntries) {
        const nameEl = entry.querySelector('.credit-entry-name');
        if (nameEl && nameEl.textContent.includes('Chinedu')) {
          const statusEl = entry.querySelector('.credit-entry-status');
          if (statusEl) {
            const match = statusEl.textContent.match(/(\d+)\s+days/);
            return match ? match[1] : null;
          }
        }
      }
      return null;
    }

    return null;
  }

  function getExpenseValue(source) {
    // These would typically come from expense tracking
    // For now, return the default values or calculate if possible
    const expenseDefaults = {
      'personal-needs-spent': '₦5,280',
      'personal-wants-spent': '₦1,890',
      'personal-total-outflow': '₦7,170',
      'personal-burn-rate': '₦850',
      'personal-runway': '18',
      'personal-rent': '₦3,500',
      'personal-food': '₦1,780',
      'personal-data': '₦1,200',
      'personal-snacks': '₦690',
      'personal-emergency': '₦1,500',
      'personal-tech': '₦600',
      'personal-daily-safe-spend': '₦41',
      'days-remaining': '15',
      'business-total-spent': '₦6,000',
      'business-expense-restock': '₦2,500',
      'business-expense-transport': '₦1,500',
      'business-expense-marketing': '₦800',
      'business-expense-packaging': '₦700',
      'business-expense-fees': '₦500',
      'business-burn-rate': '₦1,111',
      'business-daily-safe-spend': '₦333'
    };

    return expenseDefaults[source] || null;
  }

  function parseCurrency(value) {
    // Parse currency string like "₦1,500" to number 1500
    if (typeof value === 'number') return value;
    if (!value) return 0;

    // Remove currency symbol and commas, convert to number
    const cleanValue = value.replace(/[₦,\s]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  function formatCurrency(value) {
    // Format number to currency string like "₦1,500"
    if (typeof value === 'string' && value.startsWith('₦')) return value;
    return '₦' + (value || 0).toLocaleString();
  }

  // Manual refresh function — can be called by user or after data updates
  window.refreshMicroEconomicScroll = function() {
    console.log('🔄 Manually refreshing Micro Economic Scroll values...');
    window.updateMicroEconomicScroll();
  };

  // Auto-update when page becomes visible (user switches tabs, returns to app)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && document.getElementById('micro-scroll')?.offsetParent) {
      console.log('👁️ Page became visible, updating scroll values...');
      setTimeout(() => window.updateMicroEconomicScroll(), 100);
    }
  });

  // Initial update on page load (defer to let Finance modules load first)
  setTimeout(function() {
    if (document.getElementById('micro-scroll')) {
      console.log('🚀 Initial Micro Economic Scroll value update...');
      window.updateMicroEconomicScroll();
    }
  }, 2000);

  // Helper: Escape special regex characters
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Manual refresh function — can be called by user or after data updates
  window.refreshMicroEconomicScroll = function() {
    console.log('🔄 Manually refreshing Micro Economic Scroll values...');
    window.updateMicroEconomicScroll();
  };

  // Auto-update when page becomes visible (user switches tabs, returns to app)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && document.getElementById('micro-scroll')?.offsetParent) {
      console.log('👁️ Page became visible, updating scroll values...');
      setTimeout(() => window.updateMicroEconomicScroll(), 100);
    }
  });

  // Initial update on page load (defer to let Finance modules load first)
  setTimeout(function() {
    if (document.getElementById('micro-scroll')) {
      console.log('🚀 Initial Micro Economic Scroll value update...');
      window.updateMicroEconomicScroll();
    }
  }, 2000);

  // ==========================================
  // TRIGGER POINTS FOR VALUE UPDATE
  // ==========================================

  // Trigger when Personal Finance loads
  const originalLoadPersonalFinance = window.loadPersonalFinance;
  window.loadPersonalFinance = async function(...args) {
    await originalLoadPersonalFinance.apply(this, args);
    console.log('📊 Personal Finance loaded, updating scroll...');
    setTimeout(() => window.updateMicroEconomicScroll(), 500); // Wait for DOM to update
  };

  // Trigger when Business Finance loads
  const originalLoadBusinessFinance = window.loadBusinessFinance;
  window.loadBusinessFinance = async function(...args) {
    await originalLoadBusinessFinance.apply(this, args);
    console.log('💼 Business Finance loaded, updating scroll...');
    setTimeout(() => window.updateMicroEconomicScroll(), 500); // Wait for DOM to update
  };

  // Trigger when Interpretation page is shown
  const originalShowInterpretationContent = window.showInterpretationContent;
  window.showInterpretationContent = function(section) {
    originalShowInterpretationContent.apply(this, [section]);

    // Update scroll values when interpretation page is shown
    if (section === 'micro') {
      console.log('📜 Micro Economic Interpretation opened, updating values...');
      setTimeout(() => window.updateMicroEconomicScroll(), 300);
    }
  };

  console.log('✅ app.js initialized - routing enabled');
});
