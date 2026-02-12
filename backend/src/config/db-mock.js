// Mock database for testing when PostgreSQL is not available
const mockData = {
  users: [
    { id: 1, username: 'player1' },
    { id: 2, username: 'player2' },
    { id: 3, username: 'player3' },
    { id: 4, username: 'player4' },
    { id: 5, username: 'player5' }
  ],
  leaderboard: [
    { user_id: 3, total_score: 1200, rank: 1 },
    { user_id: 1, total_score: 1000, rank: 2 },
    { user_id: 5, total_score: 900, rank: 3 },
    { user_id: 2, total_score: 800, rank: 4 },
    { user_id: 4, total_score: 600, rank: 5 }
  ]
};

// Mock pool that simulates database queries
const mockPool = {
  query: async (text, params) => {
    console.log(`🔧 Mock Query: ${text}`, params);
    
    // Handle user validation query
    if (text.includes('SELECT') && text.includes('FROM users') && text.includes('WHERE id')) {
      const userId = params?.[0];
      const user = mockData.users.find(u => u.id === userId);
      return { rows: user ? [user] : [] };
    }
    
    // Handle the complex JOIN query for top players
    if (text.includes('SELECT') && text.includes('leaderboard l') && text.includes('JOIN users u')) {
      const limit = params?.[0] || 10;
      const result = mockData.leaderboard.map(entry => {
        const user = mockData.users.find(u => u.id === entry.user_id);
        return {
          user_id: entry.user_id,
          username: user ? user.username : `player${entry.user_id}`,
          total_score: entry.total_score,
          rank: entry.rank
        };
      }).slice(0, limit);
      return { rows: result };
    }
    
    // Simulate different queries
    if (text.includes('SELECT') && text.includes('leaderboard')) {
      if (text.includes('ORDER BY total_score DESC')) {
        return { rows: mockData.leaderboard.slice(0, params?.[0] || 10) };
      }
      if (text.includes('WHERE user_id')) {
        const userId = params?.[0];
        const user = mockData.leaderboard.find(u => u.user_id === userId);
        return { rows: user ? [user] : [] };
      }
    }
    
    if (text.includes('INSERT') && text.includes('game_sessions')) {
      console.log('🎮 Mock: Game session inserted');
      return { rows: [] };
    }
    
    if (text.includes('UPDATE') && text.includes('leaderboard')) {
      console.log('🏆 Mock: Leaderboard updated');
      return { rows: [] };
    }
    
    // Default empty response
    return { rows: [] };
  },
  
  connect: async () => {
    console.log('🔧 Mock: Database connection established');
    return mockPool;
  },
  
  release: async () => {
    console.log('🔧 Mock: Database connection released');
  },
  
  end: async () => {
    console.log('🔧 Mock: Database connection closed');
  }
};

// Mock event handlers
mockPool.on = (event, callback) => {
  if (event === 'connect') {
    console.log('✅ Mock: Connected to mock database');
  }
};

module.exports = mockPool;
