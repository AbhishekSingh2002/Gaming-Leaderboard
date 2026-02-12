import React from 'react';
import Leaderboard from '../components/Leaderboard';
import UserRank from '../components/UserRank';
import './Home.css';

/**
 * Home Page
 * Main page that displays both leaderboard and rank lookup
 */
const Home = () => {
  return (
    <div className="home-page">
      <header className="app-header">
        <h1>🎮 Gaming Leaderboard System</h1>
        <p>Real-time competitive rankings for millions of players</p>
      </header>

      <main className="main-content">
        <Leaderboard />
        <UserRank />
      </main>

      <footer className="app-footer">
        <p>
          Built with React + Node.js + PostgreSQL + Redis
        </p>
        <p className="tech-stack">
          <span>⚡ Optimized for performance</span>
          <span>🔒 Atomic transactions</span>
          <span>📊 Real-time updates</span>
        </p>
      </footer>
    </div>
  );
};

export default Home;