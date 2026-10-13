# Navratri Colour Quiz

A static, mobile-first personality quiz for ADS X Jazbaa (Ashoka Data Society and Jazbaa). Plain HTML/CSS/JS: no build step, no backend, no tracking. Scoring runs entirely in the browser.

## Run locally
```
python3 -m http.server 8000      # or: npx serve .
```
Open http://localhost:8000 (on your phone, use your computer's LAN IP). Opening `index.html` directly also works.

## Deploy to Netlify
- **Drag and drop:** go to app.netlify.com/drop and drop this whole folder.
- **Or connect a repo:** push to GitHub/GitLab, then "Add new site → Import". No build command; `netlify.toml` sets the publish directory to `.`.
Vercel works the same way (framework preset "Other", no build command, output directory `.`).
Then point your QR code at the live URL.

## Files
- `quiz-data.js` – all questions, scores, colour points, themes and copy. Edit here.
- `scoring.js` – the pure scoring function, shared by the site and the check script.
- `app.js`, `styles.css`, `index.html` – UI.
- `images/` – 14 outfit photos (see `images/README.md`); placeholders show if missing.
- `scripts/check-distribution.js` – verifies the colour split.

## Editing questions and copy
Open `quiz-data.js`. Change question text, option text, colour headlines/blurbs, outfit lines or theme hex values freely. Option order is displayed as written. Each option has `e` (calm −, loud +) and `v` (classic −, playful +); players never see these.

## Re-run the distribution check after changing any score
Changing any option's `e`/`v`, or any colour's `e`/`v` point, shifts how often each colour wins. Run:
```
node scripts/check-distribution.js
```
It enumerates all 4⁸ = 65,536 answer combinations and each colour should land at roughly 13.5–15%. Last output is in `scripts/distribution-output.txt`.
Note: Yellow/Pink tie exactly on ~1% of combinations; `scoring.js` compares with a small epsilon so the tie goes to the earlier colour (Yellow) reliably.

## Society logos
The "ADS X Jazbaa" lockup and the loading animation show round placeholder badges. To use the real logos, add square PNGs (transparent background works best) to `images/` and set the paths in `quiz-data.js` under `site.societies` (for example `logo: 'images/logo-ads.png'`).
