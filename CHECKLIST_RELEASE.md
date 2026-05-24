# CHECKLIST_RELEASE.md — Polovyi Modul Release Checklist

Use this checklist for every new version or release patch.

## Version

- [ ] `BUILD_VERSION` updated in `app.js`.
- [ ] `BUILD_NUMBER` updated in `app.js`.
- [ ] `BUILD_NAME` updated in `app.js`.
- [ ] Version name and build number are consistent across docs.

## Cache Busting

- [ ] `index.html` has `styles.css?v=BUILD_NUMBER`.
- [ ] `index.html` has `app.js?v=BUILD_NUMBER`.
- [ ] `test.html` has `styles.css?v=BUILD_NUMBER`, if present.
- [ ] `test.html` has `app.js?v=BUILD_NUMBER`, if present.
- [ ] README GitHub Pages test links use `v=BUILD_NUMBER`.
- [ ] README GitHub Pages test links use `hard=BUILD_NUMBER`.
- [ ] README GitHub Pages test rooms use `room=testBUILD_NUMBER` when appropriate.

## Documentation

- [ ] `README.md` updated.
- [ ] `ROADMAP.md` updated.
- [ ] `DATA_SCHEMA.md` updated if schema changed.
- [ ] `DATA_SCHEMA.md` explicitly says schema unchanged if relevant.
- [ ] New user-facing workflow is documented.

## Required Checks

- [ ] `node --check app.js` passed from repository root.
- [ ] Stability Audit passed or warnings are explained.
- [ ] Mobile overflow check passed.
- [ ] No horizontal overflow on mobile.
- [ ] Player privacy was checked.
- [ ] GM-only data remains hidden from players.

## Combat Lock

- [ ] Combat math was not changed.
- [ ] 1 bullet rule was not changed.
- [ ] 2 bullet rule was not changed.
- [ ] 3 bullet / burst recoil rules were not changed.
- [ ] Damage, critical damage, armor, and cover rules were not changed unless explicitly requested.

## Git / PR

- [ ] Work was done on a `codex/...` branch.
- [ ] `git diff` was reviewed.
- [ ] Commit created with a clear message.
- [ ] Branch pushed.
- [ ] Pull Request opened.
- [ ] `main` was not pushed directly.
- [ ] Merge was not performed without user confirmation.

## Release Output

- [ ] Local GM link provided, if local server was started.
- [ ] Local player link provided, if local server was started.
- [ ] GitHub Pages GM link provided, if uploaded.
- [ ] GitHub Pages player link provided, if uploaded.
- [ ] ZIP created when requested or useful.
- [ ] Final summary includes checks and known limitations.
