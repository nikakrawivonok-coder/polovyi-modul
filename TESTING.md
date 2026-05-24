# TESTING.md - Polovyi Modul Standard Testing

Run these checks before finishing a version or code-changing task.

Always run commands from the repository root, where `app.js`, `index.html`, `styles.css`, `README.md`, `ROADMAP.md`, and `DATA_SCHEMA.md` are located.

## 1. Syntax Check

```powershell
node --check app.js
```

This must pass before a release is considered ready.

## 2. Cache-Busting Check

Confirm that the build number in `app.js` matches cache-busting in page files.

```powershell
Select-String -Path .\app.js -Pattern 'BUILD_VERSION|BUILD_NUMBER|BUILD_NAME'
Select-String -Path .\index.html -Pattern 'styles.css\?v=|app.js\?v='
Select-String -Path .\test.html -Pattern 'styles.css\?v=|app.js\?v='
Select-String -Path .\README.md -Pattern 'v=|hard=|room=test'
```

Expected result:

- `BUILD_NUMBER` matches `styles.css?v=...`
- `BUILD_NUMBER` matches `app.js?v=...`
- README GitHub Pages test links use both `v=BUILD_NUMBER` and `hard=BUILD_NUMBER`
- README GitHub Pages test rooms use `room=testBUILD_NUMBER` when appropriate

## 3. Stability Audit

When the app is running:

1. Open the GM link.
2. Open the Stability Audit panel.
3. Press `Запустити аудит`.
4. Confirm there are no critical failed checks.
5. Use `Скопіювати звіт` when a text report is needed.

Warnings are allowed only if they are understood and documented in the final response.

## 4. Mobile Overflow Check

Check the app on narrow/mobile viewports: 360px, 375px, 390px, and 430px.

Verify:

- No horizontal page scroll.
- Navigation fits the screen.
- Quick Actions do not overflow sideways.
- Cards do not overflow sideways.
- Buttons do not cut off important text.
- Panels and modals can be closed comfortably.
- New UI still works with touch-sized controls.

Suggested browser-console checks:

```javascript
document.documentElement.scrollWidth <= window.innerWidth
document.querySelector(".quick-actions")?.scrollWidth <= document.querySelector(".quick-actions")?.clientWidth
```

Expected result: both checks return `true`.

## 5. Privacy Check

For player role, verify the player cannot see GM-only data:

- exact enemy HP, unless explicitly public by design;
- exact enemy ammo;
- `gmNotes`;
- `gmDescription`;
- hidden enemy loot;
- GM debug panels;
- enemy editor controls;
- hidden enemies.

For GM role, verify the GM can still see and control the required data.

## 6. Combat Regression Check

For any release that touches combat-adjacent code, confirm the approved rules still hold:

- 1 bullet: `1d20 +2`, one hit means full damage.
- 2 bullets: `2d20 -1`, first hit full damage, second hit dice-only damage.
- 2 bullets with zero hits: shooter gets `Захист -1` until next turn.
- 3 bullets / burst: `3d20`, recoil `-2 / -4 / -6 / -8`.
- Burst: first hit full damage, next hits dice-only damage.
- Burst into cover has the approved extra penalty.
- After burst, shooter gets `Захист -2` until next turn.

Do not rewrite combat logic during non-combat tasks.

## 7. Final Report

The final response should include:

- what changed;
- what files changed;
- what checks passed;
- what was not checked and why;
- local links, if available;
- GitHub Pages links, if uploaded;
- PR link, if opened.
