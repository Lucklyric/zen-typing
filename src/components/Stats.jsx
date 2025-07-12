import React, { useState, useEffect } from 'react';

const Stats = ({ engine, isActive }) => {
  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 100,
    time: 0
  });

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const currentStats = engine.getStats();
      setStats({
        wpm: currentStats.netWPM || 0,
        accuracy: currentStats.accuracy || 100,
        time: currentStats.duration || 0
      });
    }, 100);

    return () => clearInterval(interval);
  }, [engine, isActive]);

  return (
    <div className="flex justify-center gap-8 mb-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{stats.wpm}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">WPM</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{stats.accuracy}%</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{stats.time}s</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
      </div>
    </div>
  );
};

export default Stats;