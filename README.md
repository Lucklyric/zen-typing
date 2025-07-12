# Zen Typing

<div align="center">
  <img src="zentyping.png" alt="Zen Typing Logo" width="128" height="128">
  
  A typing practice application that combines MonkeyType-style typing mechanics with English language learning through IPA (International Phonetic Alphabet) pronunciation display.

  [![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
  [![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://lucklyric.github.io/zen-typing/)
  [![GitHub](https://img.shields.io/badge/github-source-black.svg)](https://github.com/Lucklyric/zen-typing)
</div>

## Features

- **Typing Practice**: Real-time keystroke validation with visual feedback
- **IPA Pronunciation**: Toggle American English IPA pronunciation for each word
- **Custom Texts**: Add your own English paragraphs for practice
- **Statistics Tracking**: Monitor WPM, accuracy, and session history
- **Dark Mode**: Full dark mode support for comfortable practice
- **Offline Capable**: Works offline after initial load
- **Keyboard Shortcuts**: Quick access to features (Ctrl+I for IPA, Ctrl+S for sound)
- **Audio Feedback**: Typing sounds for enhanced experience
- **Progress Tracking**: Visual progress bars and session statistics

## Getting Started

### Prerequisites

- Node.js 16+ and Yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Lucklyric/zen-typing.git
cd zen-typing

# Install dependencies
yarn install

# Start development server
yarn dev
```

### Building for Production

```bash
# Run tests
yarn test

# Build for production
yarn build

# Deploy to GitHub Pages
yarn deploy
```

## Technology Stack

- **Frontend Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v3
- **State Management**: React Hooks
- **Data Storage**: LocalStorage for custom texts
- **Audio**: Web Audio API
- **Testing**: Vitest
- **Deployment**: GitHub Pages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- IPA data sourced from [CMU Pronouncing Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict)
- Inspired by [MonkeyType](https://monkeytype.com/)
- Built with ❤️ by [Alvin Sun](https://github.com/Lucklyric)

---

<div align="center">
  Copyright © 2024 Alvin Sun. All rights reserved.
</div>