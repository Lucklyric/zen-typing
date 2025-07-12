import { useState, useEffect } from 'react';
import TypingArea from './components/TypingArea';
import TextInput from './components/TextInput';
import CustomTextHistory from './components/CustomTextHistory';
import SessionStats from './components/SessionStats';
import Footer from './components/Footer';
import { sampleTexts } from './data/sampleTexts';
import { audioManager } from './utils/audioManager';

function App() {
  const [selectedText, setSelectedText] = useState(sampleTexts[0].text);
  const [showIPA, setShowIPA] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [activeSection, setActiveSection] = useState('practice'); // 'practice' or 'templates'

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + I: Toggle IPA
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setShowIPA(prev => !prev);
      }
      // Ctrl/Cmd + S: Toggle sound
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        toggleSound();
      }
      // Ctrl/Cmd + H: Toggle history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundEnabled]);

  const handleTextSelect = (text) => {
    setSelectedText(text);
  };

  const handleComplete = (stats) => {
    const wordCount = selectedText.trim().split(/\s+/).length;
    setCompletedSessions([...completedSessions, { 
      ...stats, 
      timestamp: Date.now(),
      wordCount 
    }]);
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    audioManager.setEnabled(newSoundEnabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={`${import.meta.env.BASE_URL}favicon.png`}
                alt="Zen Typing Logo" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Zen Typing
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Master typing with pronunciation
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowIPA(!showIPA)}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  showIPA 
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {showIPA ? '🔤' : '🔡'} IPA
              </button>
              
              <button
                onClick={toggleSound}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  soundEnabled 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
              
              {/* Keyboard shortcuts hint */}
              <div className="hidden lg:flex items-center text-xs text-gray-500 dark:text-gray-400">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+I</kbd>
                <span className="mx-1">IPA</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded ml-2">Ctrl+S</kbd>
                <span className="mx-1">Sound</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Dashboard */}
          {completedSessions.length > 0 && (
            <SessionStats completedSessions={completedSessions} />
          )}
          
          {/* Main Typing Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">

            <TypingArea 
              key={selectedText}
              text={selectedText} 
              onComplete={handleComplete}
              showIPA={showIPA}
            />
          </div>

          {/* Content Selection with Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setActiveSection('practice')}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                  activeSection === 'practice'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Practice Templates
              </button>
              <button
                onClick={() => setActiveSection('custom')}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                  activeSection === 'custom'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Custom Text
              </button>
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300">
              {activeSection === 'practice' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sampleTexts.map((text) => (
                    <button
                      key={text.id}
                      onClick={() => handleTextSelect(text.text)}
                      className="group p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-750 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1"
                    >
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {text.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {text.text}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          text.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          text.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {text.difficulty}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                          {text.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Add Your Own Text
                    </h3>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        showHistory 
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {showHistory ? '📂' : '📁'} History
                    </button>
                  </div>
                  <TextInput onTextSubmit={handleTextSelect} />
                  <CustomTextHistory 
                    isVisible={showHistory} 
                    onSelectText={handleTextSelect} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions - Minimalist Display */}
          {completedSessions.length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
                Recent Sessions
              </h3>
              <div className="space-y-3">
                {completedSessions.slice(-3).reverse().map((session, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {session.netWPM}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">WPM</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {session.accuracy}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Accuracy</div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default App;