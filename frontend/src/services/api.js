import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
      const response = await api.get(`/leaderboard/top?limit=${limit}`);
      return response.data;
    } catch (error) {
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