import { useState } from 'react';
import TypingArea from './components/TypingArea';
import TextInput from './components/TextInput';
import { sampleTexts } from './data/sampleTexts';
import { audioManager } from './utils/audioManager';

function App() {
  const [selectedText, setSelectedText] = useState(sampleTexts[0].text);
  const [showIPA, setShowIPA] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState([]);

  const handleTextSelect = (text) => {
    setSelectedText(text);
  };

  const handleComplete = (stats) => {
    setCompletedSessions([...completedSessions, { ...stats, timestamp: Date.now() }]);
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    audioManager.setEnabled(newSoundEnabled);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/favicon.png" 
              alt="Zen Typing Logo" 
              className="w-16 h-16"
            />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
              Zen Typing
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Practice typing while learning English pronunciation
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setShowIPA(!showIPA)}
              className={`px-4 py-2 rounded transition-colors ${
                showIPA 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {showIPA ? 'Hide' : 'Show'} IPA Pronunciation
            </button>
            
            <button
              onClick={toggleSound}
              className={`px-4 py-2 rounded transition-colors ${
                soundEnabled 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🔊 {soundEnabled ? 'Sound On' : 'Sound Off'}
            </button>
          </div>

          <TypingArea 
            key={selectedText}
            text={selectedText} 
            onComplete={handleComplete}
            showIPA={showIPA}
          />

          <div className="mt-12 mb-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-center">Custom Text:</h2>
              <div className="text-center">
                <TextInput onTextSubmit={handleTextSelect} />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4 text-center">Choose a Template:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {sampleTexts.map((text) => (
                <button
                  key={text.id}
                  onClick={() => handleTextSelect(text.text)}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                >
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {text.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {text.text.substring(0, 60)}...
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      text.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      text.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {text.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {text.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {completedSessions.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-4 text-center">Recent Sessions</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="space-y-2">
                  {completedSessions.slice(-5).reverse().map((session, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div className="flex gap-4">
                        <span className="text-gray-600 dark:text-gray-400">{session.netWPM} WPM</span>
                        <span className="text-gray-600 dark:text-gray-400">{session.accuracy}% accuracy</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {new Date(session.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;