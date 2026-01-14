import { version } from '../../package.json';

function Footer({ theme = 'normal' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`mt-auto py-8 px-4 border-t ${
      theme === 'geek'
        ? 'bg-black border-green-500/30'
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
    }`}>
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="text-center md:text-left">
            <h3 className={`font-semibold mb-3 ${
              theme === 'geek'
                ? 'text-green-400 font-mono'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {theme === 'geek' ? '> ABOUT.ZEN.TYPING' : 'About Zen Typing'}
            </h3>
            <p className={`text-sm ${
              theme === 'geek'
                ? 'text-green-400/70 font-mono'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {theme === 'geek' 
                ? '// master.typing() && learn.english.pronunciation(IPA) -> improve.speed && language.skills'
                : 'Master typing while learning English pronunciation with IPA support. Built for learners who want to improve both typing speed and language skills.'
              }
            </p>
          </div>

          {/* Links Section */}
          <div className="text-center">
            <h3 className={`font-semibold mb-3 ${
              theme === 'geek'
                ? 'text-green-400 font-mono'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {theme === 'geek' ? '> RESOURCES.LINKS' : 'Resources'}
            </h3>
            <div className="space-y-2">
              <a
                href="https://github.com/Lucklyric/zen-typing"
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-sm transition-colors ${
                  theme === 'geek'
                    ? 'text-green-400/70 hover:text-green-400 font-mono'
                    : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {theme === 'geek' ? '[GITHUB.REPO]' : 'GitHub Repository'}
              </a>
              <a
                href="https://github.com/Lucklyric/zen-typing/issues"
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-sm transition-colors ${
                  theme === 'geek'
                    ? 'text-green-400/70 hover:text-green-400 font-mono'
                    : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {theme === 'geek' ? '[REPORT.ISSUE]' : 'Report an Issue'}
              </a>
              <a
                href="http://www.speech.cs.cmu.edu/cgi-bin/cmudict"
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-sm transition-colors ${
                  theme === 'geek'
                    ? 'text-green-400/70 hover:text-green-400 font-mono'
                    : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {theme === 'geek' ? '[CMU.DICT]' : 'CMU Dictionary'}
              </a>
            </div>
          </div>

          {/* Credits Section */}
          <div className="text-center md:text-right">
            <h3 className={`font-semibold mb-3 ${
              theme === 'geek'
                ? 'text-green-400 font-mono'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {theme === 'geek' ? '> CREDITS.INFO' : 'Credits'}
            </h3>
            <p className={`text-sm mb-2 ${
              theme === 'geek'
                ? 'text-green-400/70 font-mono'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {theme === 'geek' ? '// created.by: ' : 'Created by '}
              <a
                href="https://github.com/Lucklyric"
                target="_blank"
                rel="noopener noreferrer"
                className={`${
                  theme === 'geek'
                    ? 'text-green-400 hover:text-green-300 font-mono'
                    : 'text-indigo-600 dark:text-indigo-400'
                } hover:underline`}
              >
                {theme === 'geek' ? '[Alvin.Sun]' : 'Alvin Sun'}
              </a>
            </p>
            <p className={`text-sm ${
              theme === 'geek'
                ? 'text-green-400/70 font-mono'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {theme === 'geek' ? '// inspired.by: ' : 'Inspired by '}
              <a
                href="https://monkeytype.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${
                  theme === 'geek'
                    ? 'text-green-400 hover:text-green-300 font-mono'
                    : 'text-indigo-600 dark:text-indigo-400'
                } hover:underline`}
              >
                {theme === 'geek' ? '[MonkeyType]' : 'MonkeyType'}
              </a>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className={`mt-8 pt-8 border-t text-center ${
          theme === 'geek'
            ? 'border-green-500/30'
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <p className={`text-sm ${
            theme === 'geek'
              ? 'text-green-400/60 font-mono'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {theme === 'geek'
              ? `// zen.typing.v${version} | copyright.©.${currentYear}.Alvin.Sun -> all.rights.reserved`
              : `Zen Typing v${version} • Copyright © ${currentYear} Alvin Sun. All rights reserved.`
            }
          </p>
          <p className={`text-xs mt-2 ${
            theme === 'geek'
              ? 'text-green-400/50 font-mono'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {theme === 'geek' ? '// licensed.under: ' : 'Licensed under '}
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${
                theme === 'geek'
                  ? 'text-green-400/70 hover:text-green-400 font-mono'
                  : 'hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {theme === 'geek' ? '[Apache.License.2.0]' : 'Apache License 2.0'}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;