# First Principles（release-builder）

**Dev Mode Passing != Package Works**: The development environment and the packaged runtime environment are completely different. Must test from the installed package, not just from dev mode.

**Privacy is the Bottom Line**: Release artifacts must never contain personal data — database files, sessions, API Keys, developer paths, usernames. No exceptions.

**Test After Installation**: Desktop: install from package to system directory then test. CLI: install globally then test. Web: deploy then test online.

**Web-First**: Package errors should be WebSearched first, especially electron-builder and Vercel CLI version compatibility and signing/notarization issues.
