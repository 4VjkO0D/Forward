# Forward

Move forward on the areas of life that matter — one small goal at a time.

**This is a plain website: just `index.html`, `styles.css` and `app.js`.**
No build step, no npm, no framework, no dependencies.

## Open it

**Double-click `index.html`.** That's it — Chrome, Edge, Firefox and Safari all run it
straight from your disk.

> **Still see nothing?** Then the file isn't being opened in a *browser*. If your editor
> (VS Code) is showing you the text of the file, right-click it → *Reveal in File Explorer*
> (or *Open in Finder*) and double-click it from there. A completely blank page means it
> opened somewhere that isn't a browser — if JavaScript were disabled you'd instead see a
> "Please enable JavaScript" note.

## How it works

- **Pages** are areas of life (Health, School, …). **Swipe left/right** to move between
  them, tap the dots at the bottom, or press ← / →.
- Each page holds one or more **roads** — the path you want to take.
- A road is an ordered list of **small goals** ("Walk 30 min").
- **Tap a goal and it turns green.** Tap it again if you didn't hold that level and it goes
  grey again — the record stays honest.
- **+ Add road** / **+ Add goal** build things out. **✎** renames, **↑ ↓** reorders,
  **✕** / **🗑** delete.

Your data lives in your browser's `localStorage`, on this device only. Nothing is uploaded
anywhere.

## Install it as an app (optional)

A PWA needs a real web address, so serve this folder over HTTP:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Chrome/Edge: install icon in the address bar. iOS Safari: Share → Add to Home Screen. It
then launches full-screen and works offline.

`sw.js` (the offline cache) only registers over http(s) — opening from disk skips it, which
is why double-clicking works with no errors.

## Files

```
index.html              the app (markup)
styles.css              all styling
app.js                  all logic
manifest.webmanifest    PWA metadata
sw.js                   service worker — offline cache (http/https only)
favicon.svg             icon
icons/                  PNG app icons
react-version/          an earlier React + TypeScript version (not used)
```

## `react-version/` (not used)

An earlier version of this app built with React + Vite + TypeScript, including its own unit
and UI tests. It is completely independent of the plain app above — ignore or delete it. If
you ever want it back: `cd react-version && npm install && npm run dev`.
