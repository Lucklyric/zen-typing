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
  const [showHistory, setShowHistory] = useState(true); // Show history by default
  const [dictationMode, setDictationMode] = useState(false);
  const [theme, setTheme] = useState('normal'); // 'normal' or 'geek'
  const [completedSessions, setCompletedSessions] = useState([]);
  const [activeSection, setActiveSection] = useState('practice'); // 'practice' or 'templates'

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Always handle shortcuts, but prevent default to stop character input
      // Ctrl/Cmd + I: Toggle IPA
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setShowIPA(prev => !prev);
        return;
      }
      // Ctrl/Cmd + S: Toggle sound
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        toggleSound();
        return;
      }
      // Ctrl/Cmd + H: Toggle history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(prev => !prev);
        return;
      }
      // Ctrl/Cmd + D: Toggle dictation mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setDictationMode(prev => !prev);
        return;
      }
      // Ctrl/Cmd + T: Toggle theme
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setTheme(prev => prev === 'normal' ? 'geek' : 'normal');
        return;
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
    <div className={`min-h-screen flex flex-col ${
      theme === 'geek' 
        ? 'bg-black text-green-400 font-mono' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950'
    }`}>
      {/* Fixed Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${
        theme === 'geek'
          ? 'bg-black/90 border-green-500/30 shadow-lg shadow-green-500/10'
          : 'bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={`${import.meta.env.BASE_URL}favicon.png`}
                alt="Zen Typing Logo" 
                className={`w-10 h-10 ${theme === 'geek' ? 'filter brightness-0 invert hue-rotate-90' : ''}`}
              />
              <div>
                <h1 className={`text-2xl font-bold ${
                  theme === 'geek' 
                    ? 'text-green-400 font-mono tracking-wider' 
                    : 'text-gray-800 dark:text-gray-100'
                }`}>
                  {theme === 'geek' ? '> ZEN.TYPING' : 'Zen Typing'}
                </h1>
                <p className={`text-xs ${
                  theme === 'geek' 
                    ? 'text-green-400/70 font-mono' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {theme === 'geek' ? '// hack.your.typing.skills' : 'Master typing with pronunciation'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* IPA Toggle */}
              <button
                onClick={() => setShowIPA(!showIPA)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? `font-mono border ${
                        showIPA 
                          ? 'bg-green-900/50 border-green-400 text-green-400 shadow-lg shadow-green-400/20' 
                          : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                      }`
                    : `rounded-lg ${
                        showIPA 
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`
                }`}
                title="Toggle IPA (Ctrl+I)"
              >
                <span>{theme === 'geek' ? (showIPA ? '[+]' : '[ ]') : (showIPA ? '🔤' : '🔡')}</span>
                <span>{theme === 'geek' ? 'IPA' : 'IPA'}</span>
                <kbd className={`hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs rounded ${
                  theme === 'geek' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {theme === 'geek' ? 'CTRL+I' : '⌘I'}
                </kbd>
              </button>
              
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? `font-mono border ${
                        soundEnabled 
                          ? 'bg-green-900/50 border-green-400 text-green-400 shadow-lg shadow-green-400/20' 
                          : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                      }`
                    : `rounded-lg ${
                        soundEnabled 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`
                }`}
                title="Toggle Sound (Ctrl+S)"
              >
                <span>{theme === 'geek' ? (soundEnabled ? '[♪]' : '[x]') : (soundEnabled ? '🔊' : '🔇')}</span>
                <span>Sound</span>
                <kbd className={`hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs rounded ${
                  theme === 'geek' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {theme === 'geek' ? 'CTRL+S' : '⌘S'}
                </kbd>
              </button>
              
              {/* Dictation Toggle */}
              <button
                onClick={() => setDictationMode(!dictationMode)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? `font-mono border ${
                        dictationMode 
                          ? 'bg-green-900/50 border-green-400 text-green-400 shadow-lg shadow-green-400/20' 
                          : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                      }`
                    : `rounded-lg ${
                        dictationMode 
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`
                }`}
                title="Toggle Dictation Mode (Ctrl+D)"
              >
                <span>{theme === 'geek' ? (dictationMode ? '[●]' : '[○]') : (dictationMode ? '👁️' : '👁️‍🗨️')}</span>
                <span>Dictation</span>
                <kbd className={`hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs rounded ${
                  theme === 'geek' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {theme === 'geek' ? 'CTRL+D' : '⌘D'}
                </kbd>
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(prev => prev === 'normal' ? 'geek' : 'normal')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                  theme === 'geek'
                    ? 'font-mono border bg-green-900/50 border-green-400 text-green-400 shadow-lg shadow-green-400/20'
                    : `rounded-lg ${
                        theme === 'geek' 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`
                }`}
                title="Toggle Theme (Ctrl+T)"
              >
                <span>{theme === 'geek' ? '[T]' : '🎨'}</span>
                <span>{theme === 'geek' ? 'GEEK' : 'Normal'}</span>
                <kbd className={`hidden sm:inline-block ml-1 px-1.5 py-0.5 text-xs rounded ${
                  theme === 'geek' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {theme === 'geek' ? 'CTRL+T' : '⌘T'}
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Dashboard */}
          {completedSessions.length > 0 && (
            <SessionStats completedSessions={completedSessions} theme={theme} />
          )}
          
          {/* Main Typing Area */}
          <div className={`rounded-2xl shadow-xl p-8 mb-8 ${
            theme === 'geek'
              ? 'bg-black border border-green-500/30 shadow-green-500/20'
              : 'bg-white dark:bg-gray-800'
          }`}>

            <TypingArea 
              key={selectedText}
              text={selectedText} 
              onComplete={handleComplete}
              showIPA={showIPA}
              dictationMode={dictationMode}
              theme={theme}
            />
          </div>

          {/* Content Selection with Tabs */}
          <div className={`rounded-2xl shadow-lg p-6 ${
            theme === 'geek'
              ? 'bg-black border border-green-500/30 shadow-green-500/20'
              : 'bg-white dark:bg-gray-800'
          }`}>
            {/* Tab Navigation */}
            <div className={`flex space-x-1 mb-6 p-1 rounded-lg ${
              theme === 'geek'
                ? 'bg-green-900/20 border border-green-500/30'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <button
                onClick={() => setActiveSection('practice')}
                className={`flex-1 px-4 py-2 rounded-md transition-all ${
                  theme === 'geek'
                    ? `font-mono ${
                        activeSection === 'practice'
                          ? 'bg-green-900/50 border border-green-400 text-green-400 shadow-sm'
                          : 'text-green-400/70 hover:text-green-400 hover:bg-green-900/30'
                      }`
                    : `font-medium ${
                        activeSection === 'practice'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`
                }`}
              >
                {theme === 'geek' ? '[>] PRACTICE.TEMPLATES' : 'Practice Templates'}
              </button>
              <button
                onClick={() => setActiveSection('custom')}
                className={`flex-1 px-4 py-2 rounded-md transition-all ${
                  theme === 'geek'
                    ? `font-mono ${
                        activeSection === 'custom'
                          ? 'bg-green-900/50 border border-green-400 text-green-400 shadow-sm'
                          : 'text-green-400/70 hover:text-green-400 hover:bg-green-900/30'
                      }`
                    : `font-medium ${
                        activeSection === 'custom'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`
                }`}
              >
                {theme === 'geek' ? '[+] CUSTOM.TEXT' : 'Custom Text'}
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
                      className={`group p-5 rounded-xl border transition-all duration-300 text-left transform hover:-translate-y-1 ${
                        theme === 'geek'
                          ? 'bg-black border-green-500/30 hover:border-green-400 hover:shadow-lg hover:shadow-green-400/20 font-mono'
                          : 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-750 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg'
                      }`}
                    >
                      <h3 className={`font-semibold transition-colors ${
                        theme === 'geek'
                          ? 'text-green-400 group-hover:text-green-300 font-mono'
                          : 'text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}>
                        {theme === 'geek' ? `> ${text.title.toUpperCase()}` : text.title}
                      </h3>
                      <p className={`text-sm mt-2 line-clamp-2 ${
                        theme === 'geek'
                          ? 'text-green-400/70 font-mono'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {theme === 'geek' ? `// ${text.text}` : text.text}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className={`text-xs px-2 py-1 font-medium ${
                          theme === 'geek'
                            ? `font-mono border ${
                                text.difficulty === 'easy' ? 'border-green-500/50 text-green-400 bg-green-900/20' :
                                text.difficulty === 'medium' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-900/20' :
                                'border-red-500/50 text-red-400 bg-red-900/20'
                              }`
                            : `rounded-full ${
                                text.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                text.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`
                        }`}>
                          {theme === 'geek' ? `[${text.difficulty.toUpperCase()}]` : text.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-1 ${
                          theme === 'geek'
                            ? 'font-mono border border-green-500/30 text-green-400/70 bg-green-900/10'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full'
                        }`}>
                          {theme === 'geek' ? `{${text.category.toUpperCase()}}` : text.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-medium ${
                      theme === 'geek'
                        ? 'text-green-400 font-mono'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {theme === 'geek' ? '> CUSTOM.TEXT.INPUT' : 'Add Your Own Text'}
                    </h3>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className={`px-3 py-1.5 text-sm font-medium transition-all ${
                        theme === 'geek'
                          ? `font-mono border ${
                              showHistory 
                                ? 'bg-green-900/50 border-green-400 text-green-400' 
                                : 'bg-black/50 border-green-500/30 text-green-400/70 hover:border-green-400 hover:text-green-400'
                            }`
                          : `rounded-lg ${
                              showHistory 
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`
                      }`}
                    >
                      {theme === 'geek' 
                        ? (showHistory ? '[HIDE.LOG]' : '[SHOW.LOG]') 
                        : (showHistory ? '📂 History' : '📁 History')
                      }
                    </button>
                  </div>
                  <TextInput onTextSubmit={handleTextSelect} theme={theme} />
                  <CustomTextHistory 
                    isVisible={showHistory} 
                    onSelectText={handleTextSelect} 
                    theme={theme}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions - Minimalist Display */}
          {completedSessions.length > 0 && (
            <div className={`mt-8 rounded-xl shadow-sm p-6 ${
              theme === 'geek'
                ? 'bg-black border border-green-500/30'
                : 'bg-white dark:bg-gray-800'
            }`}>
              <h3 className={`text-sm font-medium mb-4 uppercase tracking-wide ${
                theme === 'geek'
                  ? 'text-green-400 font-mono'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {theme === 'geek' ? '> SESSION.LOG' : 'Recent Sessions'}
              </h3>
              <div className="space-y-3">
                {completedSessions.slice(-3).reverse().map((session, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors ${
                      theme === 'geek'
                        ? 'bg-green-900/10 border border-green-500/20 hover:bg-green-900/20 hover:border-green-500/30'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          theme === 'geek'
                            ? 'text-green-400 font-mono'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {session.netWPM}
                        </div>
                        <div className={`text-xs ${
                          theme === 'geek'
                            ? 'text-green-400/70 font-mono'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {theme === 'geek' ? 'WPM' : 'WPM'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          theme === 'geek'
                            ? 'text-green-400 font-mono'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {session.accuracy}%
                        </div>
                        <div className={`text-xs ${
                          theme === 'geek'
                            ? 'text-green-400/70 font-mono'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {theme === 'geek' ? 'ACC' : 'Accuracy'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm ${
                      theme === 'geek'
                        ? 'text-green-400/60 font-mono'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {theme === 'geek' 
                        ? `[${new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]`
                        : new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer theme={theme} />
    </div>
  );
}

export default App;