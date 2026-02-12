import axios from 'axios';

const getApiBaseUrl = () => {
  // Check if VITE_API_URL is explicitly set (for local development or custom config)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For production deployments
  if (import.meta.env.PROD) {
    // Try to get backend URL from Render environment variable first
    const renderBackendUrl = import.meta.env.VITE_RENDER_BACKEND_URL;
    if (renderBackendUrl) {
      return renderBackendUrl;
    }
    
    // For Render: try to construct backend URL
    if (typeof window !== 'undefined') {
      const currentHost = window.location.origin;
      if (currentHost.includes('onrender.com')) {
        // Extract service name and add -backend suffix
        const urlParts = currentHost.split('//');
        const hostParts = urlParts[1].split('.');
        const serviceName = hostParts[0];
        return `${urlParts[0]}//${serviceName}-backend.${hostParts.slice(1).join('.')}/api`;
      }
    }
    
    // Fallback to relative URL (same domain)
    return '/api';
  }
  
  // Development fallback
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug: Log the API base URL
console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', {
  PROD: import.meta.env.PROD,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_RENDER_BACKEND_URL: import.meta.env.VITE_RENDER_BACKEND_URL,
  currentHost: typeof window !== 'undefined' ? window.location.origin : 'N/A'
});

/**
 * API Service
 * Handles all HTTP requests to the backend API
 */

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Leaderboard API calls
 */
export const leaderboardAPI = {
  /**
   * Get top players
   * @param {number} limit - Number of players to fetch
   */
  getTopPlayers: async (limit = 10) => {
    try {
      console.log(`Fetching top players from: ${API_BASE_URL}/leaderboard/top?limit=${limit}`);
      const response = await api.get(`/leaderboard/top?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top players:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        baseURL: error.config?.baseURL,
        url: error.config?.url
      });
      throw error.response?.data || error;
    }
  },

  /**
   * Get player rank
   * @param {number} userId - User ID
   */
  getPlayerRank: async (userId) => {
    try {
      const response = await api.get(`/leaderboard/rank/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Submit score
   * @param {number} userId - User ID
   * @param {number} score - Game score
   * @param {string} gameMode - Game mode
   */
  submitScore: async (userId, score, gameMode = 'solo') => {
    try {
      const response = await api.post('/leaderboard/submit', {
        user_id: userId,
        score: score,
        game_mode: gameMode,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default api;