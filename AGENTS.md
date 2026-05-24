# AGENTS.md - Polovyi Modul Codex Rules

Scope: this file applies to the entire repository.

This project is "Polovyi Modul": a lightweight static GitHub Pages web app for a mobile PDA / GM panel for a S.T.A.L.K.E.R.-like tabletop game.

## Core Rules

- Do not change combat math without explicit user approval.
- Do not change the approved 1 / 2 / 3 bullet shooting rules unless the user explicitly asks for a combat-rules change.
- Do not casually change recoil, damage, critical damage, armor, cover, enemy HP privacy, or Firebase schema.
- Keep changes scoped to the requested version or patch.
- Prefer existing helpers and UI patterns over unrelated new systems.

## Versioning

Current stable version must be read from `app.js` / `README.md`, not assumed from memory.

For every new release:

- Update `BUILD_VERSION` in `app.js`.
- Update `BUILD_NUMBER` in `app.js`.
- Update `BUILD_NAME` in `app.js`.
- Use a new logical build/cache number.
- Keep version names clear and human-readable.
- Make README GitHub Pages test links match the new build/cache number.

## Cache Busting

For every release, update GitHub Pages cache-busting:

- `index.html`: `styles.css?v=BUILD_NUMBER`
- `index.html`: `app.js?v=BUILD_NUMBER`
- `test.html`, if present: `styles.css?v=BUILD_NUMBER`
- `test.html`, if present: `app.js?v=BUILD_NUMBER`
- README GitHub Pages test links must use both `v=BUILD_NUMBER` and `hard=BUILD_NUMBER`.
- Example: `...?role=gm&room=testBUILD_NUMBER&v=BUILD_NUMBER&hard=BUILD_NUMBER`

Do not leave mixed cache numbers across release files.

## Documentation

Update documentation whenever behavior, schema, tests, or user workflow changes:

- `README.md`: what changed, how to use it, test links.
- `ROADMAP.md`: version checkpoint and next planned direction.
- `DATA_SCHEMA.md`: schema changes or explicit "schema unchanged" note.
- `TESTING.md`: update only when the standard verification process changes.
- `CHECKLIST_RELEASE.md`: update only when release rules change.

If a version does not change schema, say so explicitly in `DATA_SCHEMA.md`.

## Required Checks

Before finishing any code-changing task:

- Run `node --check app.js` from the repository root.
- Verify cache-busting numbers.
- Run or manually verify Stability Audit when available.
- Check mobile responsive layout for horizontal overflow.
- Confirm combat math was not changed unless requested.
- Confirm player privacy was not weakened.

If a check cannot be run, say exactly why in the final response.

## Mobile Responsive Audit

Always consider mobile first. Before release, verify:

- No horizontal page overflow.
- Buttons and labels fit inside their containers.
- Panels, dialogs, and menus can close comfortably.
- Tap targets remain usable on small screens.
- New cards or grids do not create awkward sideways scrolling.

## Git Workflow

Never push directly to `main` without explicit user confirmation.

Use this workflow:

1. Start from current `main`.
2. Create a branch with prefix `codex/`.
3. Make scoped changes.
4. Review `git diff`.
5. Run required checks.
6. Commit with a clear message.
7. Push the branch.
8. Open a Pull Request.
9. Wait for user confirmation before merge.

If GitHub CLI auth, repository permissions, or filesystem permissions block the workflow, stop and report the blocker. Do not make partial remote updates.

## GitHub Pages Safety

Do not leave GitHub Pages half-updated.

For release changes, page assets must be updated together:

- `app.js`
- `styles.css`, if changed
- `index.html`
- `test.html`, if present
- `README.md`
- `ROADMAP.md`
- `DATA_SCHEMA.md`

If only some files can be uploaded, do not push the partial release. Prepare a ZIP or PR instead.

## Final Response Expectations

For release tasks, include:

- Version and build/cache number.
- Summary of changes.
- Checks performed.
- Local links, if a local server was started.
- GitHub Pages links, if uploaded or available.
- ZIP path, if a ZIP was created.
- PR link, if a PR was opened.
- Clear note for anything not completed.
