import { useState, useEffect } from 'react';

function StatsCard({ title, value, unit, icon, trend, color = 'indigo', theme = 'normal' }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Animate number counting up
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const colorClasses = theme === 'geek' ? {
    indigo: 'bg-green-900/30 border border-green-500/50 text-green-400',
    green: 'bg-green-900/30 border border-green-500/50 text-green-400',
    purple: 'bg-green-900/30 border border-green-500/50 text-green-400',
    yellow: 'bg-green-900/30 border border-green-500/50 text-green-400',
  } : {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 ${
      theme === 'geek'
        ? 'bg-black border border-green-500/30 hover:shadow-green-400/20'
        : 'bg-white dark:bg-gray-800'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {theme === 'geek' ? (
            <span className="text-green-400 font-mono text-lg">
              {color === 'indigo' ? '⚡' : color === 'green' ? '✓' : color === 'purple' ? '🔥' : '📊'}
            </span>
          ) : (
            icon
          )}
        </div>
        {trend && (
          <div className={`text-sm font-medium ${
            theme === 'geek'
              ? trend > 0 ? 'text-green-400' : 'text-red-400'
              : trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          } ${theme === 'geek' ? 'font-mono' : ''}`}>
            {theme === 'geek' 
              ? `[${trend > 0 ? '+' : ''}${trend}%]`
              : `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%`
            }
          </div>
        )}
      </div>
      <h3 className={`text-sm font-medium mb-1 ${
        theme === 'geek'
          ? 'text-green-400/70 font-mono'
          : 'text-gray-600 dark:text-gray-400'
      }`}>
        {title}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${
          theme === 'geek'
            ? 'text-green-400 font-mono'
            : 'text-gray-900 dark:text-gray-100'
        }`}>
          {animatedValue}
        </span>
        {unit && (
          <span className={`text-sm ${
            theme === 'geek'
              ? 'text-green-400/60 font-mono'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatsCard;