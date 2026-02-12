import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';
import './Leaderboard.css';

/**
 * Leaderboard Component
 * Displays top players with live updates
 */
const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Fetch top players from API
   */
  const fetchTopPlayers = async () => {
    try {
      setLoading(true);
      const response = await leaderboardAPI.getTopPlayers(10);
      
      if (response.success) {
        setPlayers(response.data);
        setSource(response.source);
        setError(null);
      }
    } catch (err) {
      setError(err.error || 'Failed to fetch leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial load and auto-refresh setup
   */
  useEffect(() => {
    fetchTopPlayers();

    // Auto-refresh every 5 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchTopPlayers();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  /**
   * Get medal emoji for top 3
   */
  const getMedal = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  /**
   * Render loading state
   */
  if (loading && players.length === 0) {
    return (
      <div className="leaderboard-container">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchTopPlayers}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>🏆 Top 10 Leaderboard</h2>
        <div className="controls">
          <button onClick={fetchTopPlayers} disabled={loading}>
            {loading ? '⟳ Refreshing...' : '🔄 Refresh'}
          </button>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          {source && (
            <span className="source-badge">
              {source === 'cache' ? '⚡ Cached' : '💾 Database'}
            </span>
          )}
        </div>
      </div>

      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Total Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.user_id} className={`rank-${player.rank}`}>
                <td className="rank-cell">
                  <span className="rank-number">{player.rank}</span>
                  <span className="medal">{getMedal(player.rank)}</span>
                </td>
                <td className="player-cell">
                  <span className="player-name">{player.username}</span>
                  <span className="user-id">ID: {player.user_id}</span>
                </td>
                <td className="score-cell">
                  {player.total_score.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {players.length === 0 && !loading && (
        <div className="no-data">
          <p>No players found</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;