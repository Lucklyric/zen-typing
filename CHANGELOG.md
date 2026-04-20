# Changelog

All notable changes to Zen Typing are documented in this file. The format loosely follows [Keep a Changelog](https://keepachangelog.com/), and this project uses [Semantic Versioning](https://semver.org/).

## [0.6.4] - 2026-04-20

### Fixed
- **Header icons wrapping to two lines** in the geek theme. The "off" icon `[ ]` used a regular space, which the browser treated as a line-break opportunity at tight widths — the opening and closing brackets rendered on separate lines, making IPA and Reference buttons double-height. Replaced the inner space with a non-breaking space so the bracket pair stays atomic.

## [0.6.3] - 2026-04-20

### Fixed
- **Header overflow at 1280–1440px in geek theme.** The wide `ZEN.TYPING` title plus six action buttons (IPA / Sound / Dictation / Reference / Theme / Sign In) with inline `CTRL+X` badges overflowed past the viewport on laptop widths, overlapping the title on the left and cutting off the settings gear on the right. Kbd badges are now `2xl:inline-block` (shown at ≥1536px), which is enough width to accommodate them without overlap.
- **Reference toggle icon is language-neutral.** Swapped the Chinese characters (`[原]`/`[译]`, `🀄`) for `📖`/`📕` (normal/cyber themes) and `[R]`/`[ ]` (geek), since reference mode isn't limited to Chinese text.

## [0.6.2] - 2026-04-20

### Added
- **Reference annotation toggle** (desktop + mobile-compact buttons in the header, and `Ctrl/Cmd+B` shortcut). Lets you hide the paired reference text while keeping the typing target unchanged — useful once you've internalized the source and want to practice without visual assistance. Persists in settings; only shown when the selected entry actually has a reference.
- `showReference` setting (default `true`) in `settingsStorage`.

### Changed
- Alignment strategy now prefers **finer** strict match: if both paragraph and sentence strict pairings succeed, the one with more groups wins. Paragraph pairing is only used when sentence-strict fails (e.g. the NRS-style case from 0.6.1 where translation merges sentences within a paragraph). Fixes a 0.6.1 regression where single-paragraph multi-sentence inputs collapsed into one coarse block.

## [0.6.1] - 2026-04-20

### Added
- **Three-tier reference alignment.** Reference Mode now tries each strategy in order until one succeeds:
  1. **Paragraph pairing** (split on `\n`) — handles the common case where source and translation keep the same paragraph structure even when inner sentence counts differ (e.g. translation joins two English sentences into one Chinese sentence).
  2. **Exact sentence pairing** (split on `。！？.!?`) — the 0.6.0 behaviour.
  3. **Fuzzy sentence pairing** — greedy merge of adjacent sentences on the longer side by cumulative character-length ratio, so mismatched sentence counts still align instead of falling back to a flat layout.
- `buildAlignedGroups(referenceText, typingText, engineWords)` public helper and `mergeAdjacentByLength` utility.

### Fixed
- Mixed CJK/English bilingual text with unequal sentence counts per paragraph no longer silently loses the reference annotation.

## [0.6.0] - 2026-04-19

### Added
- **Sentence-aligned reference**: Reference Mode now renders each reference sentence (e.g. Chinese) directly above its corresponding typing sentence (English), inline with the typing flow — similar to how IPA sits above each word. Falls back to a plain typing view when sentence counts don't match.
- **Mobile Dictation quick-toggle**: A compact 44×44 icon in the header (`lg:hidden`) that flips Dictation Mode on/off. Targets iPhone 17 Pro-class viewports and larger.
- `SYNC_STATUS` constants exported from `syncService` to replace scattered string literals (`'synced'`/`'syncing'`/`'offline'`/`'error'`).

### Changed
- **Reference Mode is now single-pane.** `ReferenceWorkspace`, `ReferenceDisplay`, and `SplitPane` are removed; `TypingArea` gained a `referenceText` prop and handles annotation rendering directly. No split pane, no draggable divider, no persisted split ratio. Mobile and desktop use the same layout.
- `forceUseRemoteData` fetches cloud settings and custom texts in parallel (`Promise.all`), roughly halving the user-visible latency of "Use Remote".
- Scrollbars in the geek and default themes now use `scrollbar-color` so modern Chrome/Safari actually render the themed thumb (previously fell back to the system default because `scrollbar-width: thin` without `scrollbar-color` silently disables `::-webkit-scrollbar-thumb`).
- Stripped noise comments in `SyncStatus.jsx` that restated identifiers.

### Fixed
- `forceUseRemoteData` now logs the discarded `textsResult.error` when short-circuiting on a settings load failure, so diagnostic info isn't silently dropped.

### Internal
- New `src/utils/sentencePairing.js` with `splitSentences`, `pairSentences`, and `groupWordsBySentence` helpers (11 unit tests).
- Removed `splitRatio` state, effects, and settings persistence from `App.jsx` (the key is retained as an unused default in `settingsStorage.js` for backward-compatible reads).

## [0.5.5] - Prior
- See git history.
