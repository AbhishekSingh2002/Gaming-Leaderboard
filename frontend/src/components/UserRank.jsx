import React, { useState } from 'react';
import { leaderboardAPI } from '../services/api';
import './UserRank.css';

/**
 * UserRank Component
 * Allows users to lookup their rank
 */
const UserRank = () => {
  const [userId, setUserId] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId || isNaN(userId)) {
      setError('Please enter a valid user ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await leaderboardAPI.getPlayerRank(parseInt(userId));

      if (response.success) {
        setPlayerData(response.data);
      }
    } catch (err) {
      setError(err.error || 'Failed to fetch player rank');
      setPlayerData(null);
      console.error('Error fetching player rank:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get rank badge color
   */
  const getRankBadgeClass = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    if (rank <= 10) return 'top10';
    if (rank <= 100) return 'top100';
    return 'default';
  };

  return (
    <div className="user-rank-container">
      <div className="user-rank-header">
        <h2>🔍 Check Your Rank</h2>
      </div>

      <form onSubmit={handleSubmit} className="rank-lookup-form">
        <div className="input-group">
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID..."
            className="user-id-input"
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          <span>❌</span>
          <p>{error}</p>
        </div>
      )}

      {playerData && (
        <div className="player-rank-card">
          <div className={`rank-badge ${getRankBadgeClass(playerData.rank)}`}>
            <div className="rank-number">#{playerData.rank}</div>
            <div className="rank-label">Rank</div>
          </div>

          <div className="player-info">
            <div className="info-row">
              <span className="label">Player:</span>
              <span className="value">{playerData.username}</span>
            </div>
            <div className="info-row">
              <span className="label">User ID:</span>
              <span className="value">{playerData.user_id}</span>
            </div>
            <div className="info-row">
              <span className="label">Total Score:</span>
              <span className="value score">
                {playerData.total_score.toLocaleString()}
              </span>
            </div>
          </div>

          {playerData.rank <= 3 && (
            <div className="achievement">
              🏆 Top 3 Player!
            </div>
          )}

          {playerData.rank > 3 && playerData.rank <= 10 && (
            <div className="achievement">
              🌟 Top 10 Player!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRank;