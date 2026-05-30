# Release Strategy

Select the release flow based on project type. Privacy audit steps → `release-checklist.md` § Privacy Audit.

## Web Project Release

1. Build — determine command/output from framework config
2. Privacy audit
3. Configure production environment variables (Vercel / Netlify / platform dashboard; no secrets in code)
4. Deploy — `vercel --prod`, `netlify deploy --prod --dir=[BUILD_DIR]`, or static upload; record URL
5. Online verification — page loads, no white screen
6. Smoke test — core features from Product-Spec.md if available

## Desktop Project Release (Electron)

1. Build frontend artifacts
2. Package — macOS signing/notarization per electron-builder config; inform user if unsigned
3. Privacy audit on packaged output
4. Installation test — user installs from DMG/installer to system directory (AI cannot operate DMG)
5. Functional smoke test — Product-Spec features or main pages + core operations; Playwright if available

## CLI Project Release

1. Build → verify artifacts
2. Privacy audit
3. Publish — `npm whoami` → `npm publish`, or binary via pkg/esbuild
4. Installation test — `npm install -g [package-name]`
5. Functional smoke test — each core command
