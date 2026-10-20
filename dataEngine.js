/**
 * JOSEPH AI - Data Engine (Updated for API Integration)
 * Fetches and manages external data for economic indicators, FX rates,
 * commodity prices, and news feeds
 * Now uses backend API when available, with fallback to original logic
 */

// ==========================================
// CONFIGURATION
// ==========================================
const DATA_ENGINE_CONFIG = {
  // Cache duration in milliseconds
  cacheDuration: {
    economic: 3600000,      // 1 hour for economic data
    fx: 1800000,            // 30 minutes for FX rates
    commodities: 3600000,   // 1 hour for commodity prices
    news: 600000            // 10 minutes for news feeds
  },

  // Use backend API or fallback to direct API calls
  useBackendAPI: true,

  // Use real APIs or mock data (for fallback mode)
  useRealAPIs: true,

  // Real API endpoints (Nigerian & Global sources) - for fallback only
  endpoints: {
    // Nigerian economic data
    inflation: {
      url: 'https://nigerianstat.gov.ng/api/inflation',
      fallback: 'https://api.mockdata.local/inflation'
    },
    fx: {
      url: 'https://fmdqgroup.com/api/market-rates',
      fallback: 'https://api.mockdata.local/fx'
    },
    commodities: {
      url: 'https://commodity-exchange.ng/api/prices',
      fallback: 'https://api.mockdata.local/commodities'
    },
    news: {
      url: 'https://newsapi.org/v2/everything',
      fallback: 'https://api.mockdata.local/news'
    },
    fuel: {
      url: 'https://nnpc.com.ng/api/pump-prices',
      fallback: 'https://api.mockdata.local/fuel'
    }
  },

  // API keys (stored in localStorage in production)
  apiKeys: {
    newsAPI: localStorage.getItem('joseph_apikey_news') || '',
    fmdq: localStorage.getItem('joseph_apikey_fmdq') || '',
    commodities: localStorage.getItem('joseph_apikey_commodities') || ''
  },

  // Fallback values if all sources fail
  fallbackValues: {
    inflationRate: 31.7,
    fxRate: 1650,
    groundnutIndex: 142000,
    pumpPrice: 680,
    mpci: 68.2
  }
};

// ==========================================
// CHECK IF BACKEND API IS AVAILABLE
// ==========================================
function isBackendAPIAvailable() {
  return DATA_ENGINE_CONFIG.useBackendAPI &&
         typeof window.JosephAPI !== 'undefined' &&
         window.JosephAPI.economic;
}

// ==========================================
// CACHE STORE (for fallback mode)
// ==========================================
const dataCache = {
  inflation: null,
  fx: null,
  commodities: null,
  news: null,
  fuel: null,

  set(key, value, duration) {
    this[key] = {
      value,
      timestamp: Date.now(),
      duration
    };
  },

  get(key) {
    const cached = this[key];
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > cached.duration) {
      this[key] = null;
      return null;
    }

    return cached.value;
  },

  clear(key) {
    this[key] = null;
  },

  clearAll() {
    Object.keys(this).forEach(key => {
      if (typeof this[key] !== 'function') {
        this[key] = null;
      }
    });
  }
};

// ==========================================
// API-BASED DATA FETCHING (Preferred)
// ==========================================

async function fetchInflationFromAPI() {
  if (!isBackendAPIAvailable()) return null;

  try {
    const response = await window.JosephAPI.economic.getInflation();
    return {
      rate: response.rate,
      change: response.change,
      trend: response.trend,
      lastUpdate: response.lastUpdate,
      source: response.source,
      nextRelease: response.nextRelease
    };
  } catch (error) {
    console.log('Backend API inflation fetch failed, using fallback:', error.message);
    return null;
  }
}

async function fetchFXFromAPI() {
  if (!isBackendAPIAvailable()) return null;

  try {
    const response = await window.JosephAPI.economic.getFXRates();
    return {
      usd: response.usd,
      gbp: response.gbp,
      eur: response.eur,
      change: response.change,
      changeDirection: response.changeDirection,
      lastUpdate: response.lastUpdate,
      source: response.source
    };
  } catch (error) {
    console.log('Backend API FX fetch failed, using fallback:', error.message);
    return null;
  }
}

async function fetchCommoditiesFromAPI() {
  if (!isBackendAPIAvailable()) return null;

  try {
    const response = await window.JosephAPI.economic.getCommodities();
    return response;
  } catch (error) {
    console.log('Backend API commodities fetch failed, using fallback:', error.message);
    return null;
  }
}

async function fetchFuelFromAPI() {
  if (!isBackendAPIAvailable()) return null;

  try {
    const response = await window.JosephAPI.economic.getFuelPrices();
    return {
      pumpPrice: response.pumpPrice,
      change: response.change,
      diesel: response.diesel,
      kerosene: response.kerosene,
      lastUpdate: response.lastUpdate,
      source: response.source,
      nextReview: response.nextReview
    };
  } catch (error) {
    console.log('Backend API fuel fetch failed, using fallback:', error.message);
    return null;
  }
}

async function fetchNewsFromAPI() {
  if (!isBackendAPIAvailable()) return null;

  try {
    const response = await window.JosephAPI.economic.getNews();
    return response; // Array of articles
  } catch (error) {
    console.log('Backend API news fetch failed, using fallback:', error.message);
    return null;
  }
}

// ==========================================
// MOCK DATA GENERATORS (Fallback)
// ==========================================

function generateInflationData() {
  const baseInflation = 31.7;
  const variation = (Math.random() - 0.5) * 2;
  const inflation = Math.round((baseInflation + variation) * 10) / 10;

  return {
    rate: inflation,
    change: (Math.random() - 0.5) * 2,
    trend: inflation > 32 ? 'up' : inflation < 31 ? 'down' : 'stable',
    lastUpdate: new Date().toISOString(),
    source: 'Mock Data (Configure API in Settings)',
    nextRelease: addDays(new Date(), 30).toDateString()
  };
}

function generateFXData() {
  const baseRate = 1650;
  const variation = (Math.random() - 0.5) * 50;
  const rate = Math.round(baseRate + variation);
  const changePercent = ((variation / baseRate) * 100);

  return {
    usd: rate,
    gbp: Math.round(rate * 1.27),
    eur: Math.round(rate * 1.08),
    change: Math.abs(changePercent),
    changeDirection: variation > 0 ? 'up' : 'down',
    lastUpdate: new Date().toISOString(),
    source: 'Mock Data (Configure API in Settings)'
  };
}

function generateCommodityData() {
  const groundnutBase = 142000;
  const groundnutVariation = (Math.random() - 0.5) * 10000;
  const groundnutPrice = Math.round(groundnutBase + groundnutVariation);

  return {
    groundnut: {
      price: groundnutPrice,
      change: ((groundnutVariation / groundnutBase) * 100).toFixed(1),
      unit: '100kg bag',
      market: 'Mile 12 / Bodija'
    },
    rice: {
      price: Math.round(75000 + (Math.random() - 0.5) * 5000),
      change: ((Math.random() - 0.5) * 3).toFixed(1),
      unit: '50kg bag',
      market: 'National'
    },
    beans: {
      price: Math.round(85000 + (Math.random() - 0.5) * 6000),
      change: ((Math.random() - 0.5) * 4).toFixed(1),
      unit: '50kg bag',
      market: 'National'
    },
    palmOil: {
      price: Math.round(1200 + (Math.random() - 0.5) * 100),
      change: ((Math.random() - 0.5) * 5).toFixed(1),
      unit: '1 litre',
      market: 'National'
    },
    lastUpdate: new Date().toISOString(),
    source: 'Mock Data (Configure API in Settings)'
  };
}

function generateFuelData() {
  const pumpPriceBase = 680;
  const variation = (Math.random() - 0.5) * 20;

  return {
    pumpPrice: Math.round(pumpPriceBase + variation),
    change: ((variation / pumpPriceBase) * 100).toFixed(2),
    diesel: Math.round(1150 + (Math.random() - 0.5) * 50),
    kerosene: Math.round(1250 + (Math.random() - 0.5) * 50),
    lastUpdate: new Date().toISOString(),
    source: 'Mock Data (Configure API in Settings)',
    nextReview: addDays(new Date(), 45).toDateString()
  };
}

function generateNewsData() {
  const newsTemplates = [
    {
      type: 'urgent',
      tag: '🔴 Scarcity Alert',
      title: 'Northern Groundnut Harvest Season Delay',
      content: 'Heavy rains in Kaduna extended drying times by 2 weeks. Expect 15-20% wholesale price hike in Mile 12 & Bodija markets.',
      category: 'commodities'
    },
    {
      type: 'info',
      tag: '🔵 FX Market',
      title: 'Naira Strengthens at Official Window',
      content: 'CBN injected $500m into the official market. Naira gained 2.3% to trade at ₦1,645/$. Parallel market follows trend.',
      category: 'fx'
    },
    {
      type: 'success',
      tag: '🟢 Campus Trends',
      title: 'University Resumption Surge Expected',
      content: 'Students returning for 2nd semester next Monday. Historical snack velocity jumps 2.4× during first fortnight of resumption.',
      category: 'demand'
    },
    {
      type: 'warning',
      tag: '⚠️ Inflation Alert',
      title: 'Food Inflation Rises to 32.1%',
      content: 'NBS reports food inflation accelerated for third consecutive month. Essential commodities affected include bread, cereals, and oils.',
      category: 'inflation'
    },
    {
      type: 'info',
      tag: '🔵 Packaging Market',
      title: 'PET Plastics Import Tariff Drop',
      content: 'Local bottle manufacturers report improved FX liquidity. 35cl peanut bottles wholesale price down ₦5/unit in Lagos.',
      category: 'logistics'
    },
    {
      type: 'success',
      tag: '🟢 Policy',
      title: 'CBN Expands MSME Loan Facility',
      content: 'Central Bank increases intervention fund for micro-businesses. Application portal opens next week with reduced collateral requirements.',
      category: 'policy'
    },
    {
      type: 'urgent',
      tag: '🔴 Fuel Update',
      title: 'Petrol Price Adjustment Imminent',
      content: 'Industry sources suggest potential pump price review following global crude movements. Deregulation continues.',
      category: 'energy'
    },
    {
      type: 'info',
      tag: '🔵 Market Intelligence',
      title: 'Lagos Trader Associations Announce Price Controls',
      content: 'Major market unions discuss price stabilization measures amid rising inflation. Could affect wholesale pricing structures.',
      category: 'policy'
    }
  ];

  const count = 4 + Math.floor(Math.random() * 3);
  const shuffled = newsTemplates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((news, index) => ({
    id: Date.now() + index,
    ...news,
    timeAgo: getTimeAgo(index * 2 + Math.floor(Math.random() * 12)),
    publishedAt: new Date(Date.now() - (index * 2 + Math.floor(Math.random() * 12)) * 3600000).toISOString()
  }));
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getTimeAgo(hours) {
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (hours < 48) return 'Yesterday';
  if (hours < 168) return `${Math.round(hours / 24)} days ago`;
  return '1 week ago';
}

function getTimeAgoFromISO(isoString) {
  const now = new Date();
  const past = new Date(isoString);
  const hours = Math.floor((now - past) / (1000 * 60 * 60));
  return getTimeAgo(hours);
}

// ==========================================
// MAIN FETCH FUNCTIONS (with API + Mock fallback)
// ==========================================

async function fetchEconomicIndicators() {
  try {
    // Try backend API first
    let data = await fetchInflationFromAPI();

    // Fallback to mock data if API failed
    if (!data) {
      data = generateInflationData();
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch inflation data:', error);
    return {
      rate: DATA_ENGINE_CONFIG.fallbackValues.inflationRate,
      change: 0,
      trend: 'unknown',
      lastUpdate: new Date().toISOString(),
      source: 'Fallback (Cached Data)'
    };
  }
}

async function fetchFXRates() {
  try {
    // Try backend API first
    let data = await fetchFXFromAPI();

    // Fallback to mock data if API failed
    if (!data) {
      data = generateFXData();
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch FX data:', error);
    return {
      usd: DATA_ENGINE_CONFIG.fallbackValues.fxRate,
      change: 0,
      changeDirection: 'unknown',
      lastUpdate: new Date().toISOString(),
      source: 'Fallback (Cached Data)'
    };
  }
}

async function fetchCommodityPrices() {
  try {
    // Try backend API first
    let data = await fetchCommoditiesFromAPI();

    // Fallback to mock data if API failed
    if (!data) {
      data = generateCommodityData();
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch commodity data:', error);
    return {
      groundnut: {
        price: DATA_ENGINE_CONFIG.fallbackValues.groundnutIndex,
        change: 0,
        unit: '100kg bag',
        market: 'Unknown'
      },
      lastUpdate: new Date().toISOString(),
      source: 'Fallback (Cached Data)'
    };
  }
}

async function fetchFuelPrices() {
  try {
    // Try backend API first
    let data = await fetchFuelFromAPI();

    // Fallback to mock data if API failed
    if (!data) {
      data = generateFuelData();
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch fuel data:', error);
    return {
      pumpPrice: DATA_ENGINE_CONFIG.fallbackValues.pumpPrice,
      change: 0,
      lastUpdate: new Date().toISOString(),
      source: 'Fallback (Cached Data)'
    };
  }
}

async function fetchNewsFeed() {
  try {
    // Try backend API first
    let data = await fetchNewsFromAPI();

    // Fallback to mock data if API failed
    if (!data) {
      data = generateNewsData();
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch news data:', error);
    return [];
  }
}

async function fetchDreamModuleData() {
  try {
    const [inflation, fx, commodities, fuel, news] = await Promise.all([
      fetchEconomicIndicators(),
      fetchFXRates(),
      fetchCommodityPrices(),
      fetchFuelPrices(),
      fetchNewsFeed()
    ]);

    return {
      inflation,
      fx,
      commodities,
      fuel,
      news,
      lastFetch: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch Dream module data:', error);
    throw error;
  }
}

// ==========================================
// SETTINGS MANAGEMENT
// ==========================================

function saveAPIKey(service, key) {
  localStorage.setItem(`joseph_apikey_${service}`, key);
  DATA_ENGINE_CONFIG.apiKeys[service] = key;
}

function getAPIKey(service) {
  return DATA_ENGINE_CONFIG.apiKeys[service] || '';
}

function setUseRealAPIs(use) {
  DATA_ENGINE_CONFIG.useRealAPIs = use;
  localStorage.setItem('joseph_userealapis', use);
}

function setUseBackendAPI(use) {
  DATA_ENGINE_CONFIG.useBackendAPI = use;
  localStorage.setItem('joseph_usebackendapi', use);
}

// Load settings from localStorage
const savedUseRealAPIs = localStorage.getItem('joseph_userealapis');
if (savedUseRealAPIs !== null) {
  DATA_ENGINE_CONFIG.useRealAPIs = savedUseRealAPIs === 'true';
}

const savedUseBackendAPI = localStorage.getItem('joseph_usebackendapi');
if (savedUseBackendAPI !== null) {
  DATA_ENGINE_CONFIG.useBackendAPI = savedUseBackendAPI === 'true';
}

// ==========================================
// EXPORTS
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchEconomicIndicators,
    fetchFXRates,
    fetchCommodityPrices,
    fetchFuelPrices,
    fetchNewsFeed,
    fetchDreamModuleData,
    dataCache,
    DATA_ENGINE_CONFIG,
    saveAPIKey,
    getAPIKey,
    setUseRealAPIs,
    setUseBackendAPI
  };
}

// Also expose to window for use in app.js
window.dataEngineExports = {
  fetchEconomicIndicators,
  fetchFXRates,
  fetchCommodityPrices,
  fetchFuelPrices,
  fetchNewsFeed,
  fetchDreamModuleData,
  dataCache,
  DATA_ENGINE_CONFIG,
  saveAPIKey,
  getAPIKey,
  setUseRealAPIs,
  setUseBackendAPI
};

// SR
