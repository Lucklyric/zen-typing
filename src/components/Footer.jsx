function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 px-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              About Zen Typing
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Master typing while learning English pronunciation with IPA support.
              Built for learners who want to improve both typing speed and language skills.
            </p>
          </div>

          {/* Links Section */}
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Resources
            </h3>
            <div className="space-y-2">
              <a
                href="https://github.com/Lucklyric/zen-typing"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                GitHub Repository
              </a>
              <a
                href="https://github.com/Lucklyric/zen-typing/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Report an Issue
              </a>
              <a
                href="http://www.speech.cs.cmu.edu/cgi-bin/cmudict"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                CMU Dictionary
              </a>
            </div>
          </div>

          {/* Credits Section */}
          <div className="text-center md:text-right">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Credits
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Created by{' '}
              <a
                href="https://github.com/Lucklyric"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Alvin Sun
              </a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Inspired by{' '}
              <a
                href="https://monkeytype.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                MonkeyType
              </a>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Copyright © {currentYear} Alvin Sun. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Licensed under{' '}
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Apache License 2.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;