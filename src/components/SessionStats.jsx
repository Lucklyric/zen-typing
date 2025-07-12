import { useState, useEffect } from 'react';
import StatsCard from './StatsCard';

function SessionStats({ completedSessions }) {
  const [stats, setStats] = useState({
    todayWPM: 0,
    todayAccuracy: 0,
    streak: 0,
    totalWords: 0,
    bestWPM: 0,
    avgAccuracy: 0,
    improvementRate: 0,
    sessionsToday: 0
  });

  useEffect(() => {
    calculateStats();
  }, [completedSessions]);

  const calculateStats = () => {
    if (completedSessions.length === 0) return;

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    
    // Today's sessions
    const todaySessions = completedSessions.filter(
      session => new Date(session.timestamp) >= todayStart
    );

    // Calculate streak (consecutive days)
    let streak = 0;
    const uniqueDays = new Set();
    completedSessions.forEach(session => {
      const day = new Date(session.timestamp).toDateString();
      uniqueDays.add(day);
    });
    
    // Simple streak calculation (would need enhancement for real app)
    streak = uniqueDays.size;

    // Calculate averages and totals
    const avgWPM = todaySessions.length > 0
      ? todaySessions.reduce((sum, s) => sum + s.netWPM, 0) / todaySessions.length
      : 0;
    
    const avgAccuracy = todaySessions.length > 0
      ? todaySessions.reduce((sum, s) => sum + s.accuracy, 0) / todaySessions.length
      : 0;

    const bestWPM = Math.max(...completedSessions.map(s => s.netWPM), 0);
    
    // Calculate improvement rate (compare last 5 to previous 5)
    let improvementRate = 0;
    if (completedSessions.length >= 10) {
      const recent = completedSessions.slice(-5);
      const previous = completedSessions.slice(-10, -5);
      const recentAvg = recent.reduce((sum, s) => sum + s.netWPM, 0) / 5;
      const previousAvg = previous.reduce((sum, s) => sum + s.netWPM, 0) / 5;
      improvementRate = ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1);
    }

    setStats({
      todayWPM: Math.round(avgWPM),
      todayAccuracy: Math.round(avgAccuracy),
      streak: streak,
      totalWords: completedSessions.reduce((sum, s) => sum + (s.wordCount || 0), 0),
      bestWPM: Math.round(bestWPM),
      avgAccuracy: Math.round(avgAccuracy),
      improvementRate: parseFloat(improvementRate),
      sessionsToday: todaySessions.length
    });
  };

  const icons = {
    speed: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-7h3l-4 5v-3H7l4-5v3z"/>
      </svg>
    ),
    accuracy: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
      </svg>
    ),
    streak: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
      </svg>
    ),
    total: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a1 1 0 100 2H6a4 4 0 01-4-4V7a4 4 0 014-4h5a4 4 0 014 4v6a4 4 0 01-4 4h-1a1 1 0 110-2h1a2 2 0 002-2V7a2 2 0 00-2-2h-1a1 1 0 110-2h1a4 4 0 014 4v6a4 4 0 01-4 4H6a4 4 0 01-4-4V7z" clipRule="evenodd"/>
      </svg>
    )
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Your Progress
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Speed"
          value={stats.todayWPM}
          unit="WPM"
          icon={icons.speed}
          color="indigo"
          trend={stats.improvementRate}
        />
        <StatsCard
          title="Accuracy"
          value={stats.todayAccuracy}
          unit="%"
          icon={icons.accuracy}
          color="green"
        />
        <StatsCard
          title="Day Streak"
          value={stats.streak}
          unit="days"
          icon={icons.streak}
          color="purple"
        />
        <StatsCard
          title="Sessions Today"
          value={stats.sessionsToday}
          unit=""
          icon={icons.total}
          color="yellow"
        />
      </div>
      
      {stats.bestWPM > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personal Best: <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.bestWPM} WPM</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default SessionStats;