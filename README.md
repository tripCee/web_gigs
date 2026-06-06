# Dynamic Navigation Dashboard

A small static web app for browsing media by year, month, and category. It loads a generated dataset from `data-structure.js`, renders a carousel, and supports keyboard and fullscreen navigation.

## Files

- `index.html` — main page and UI structure
- `style.css` — visual styling for the app and carousel
- `app.js` — application logic for sliders, carousel behavior, and keyboard controls
- `generate-data.js` — Node script that scans a `data` folder and writes `data-structure.js`
- `data-structure.js` — generated dataset used to populate the dashboard
- `data/` — default media folder (project-local)

## Quick Start

1. Generate the dataset (optional if `data-structure.js` already exists):

```bash
# Use a project-local data folder (default)
node generate-data.js

# Scan an external folder and use the default local alias `data_external`
node generate-data.js /path/to/your/gigs-data

# Scan an external folder and emit a custom web alias path
node generate-data.js /path/to/your/gigs-data /gigs-data

# Or set environment variables
GIGS_DATA_DIR=/path/to/your/gigs-data GIGS_DATA_ALIAS=/gigs-data node generate-data.js
```

2. Serve the project root with any static server and open `index.html`:

```bash
# Simple Python server
python3 -m http.server 8000
```

Then visit:

http://localhost:8000/index.html

## External data and symlink behaviour

- By default the script scans the local `data/` directory and generates relative web paths like `data/<folder>/<file>` in `data-structure.js`.
- If you provide an external data path and no alias, the script attempts to create a local `data_external` symlink and generate paths like `data_external/<folder>/<file>`.
- If you provide an alias path via the second CLI arg or `GIGS_DATA_ALIAS`, the script scans the physical folder but emits web paths using that alias.
  - Example: `node generate-data.js /mnt/external/gigs-data /gigs-data` will scan `/mnt/external/gigs-data` and generate `/gigs-data/<folder>/<file>`.
  - This is useful when nginx uses `alias` to map a URL path to an external filesystem location.
- If the script cannot create a local symlink for a relative alias path, it will still emit the alias path but print a warning. For absolute alias roots (like `/gigs-data`), no symlink is created.

Example nginx config:

```nginx
location /gigs-data/ {
    alias /mnt/external/gigs-data/;
    autoindex off;
}
```

Use the same alias path in `generate-data.js` and nginx so the browser URL matches the server alias.

Manual symlink creation (Linux/macOS):

```bash
ln -s /path/to/your/gigs-data data_external
```

If you create the symlink manually, re-run `node generate-data.js` (or update `data-structure.js`) so paths use `data_external/...`.

## Usage notes

- **Navigation**: `ArrowLeft` / `ArrowRight` to navigate; `Home` / `End` to jump; `Space` to pause/play videos.
- **Fullscreen**: Click any media to toggle browser fullscreen. The app preserves fullscreen when navigating items.
- **Fullscreen zoom** (desktop):
  - Scroll wheel or `+` / `-` keys to zoom in/out.
  - `0` key to reset zoom and pan.
  - Middle mouse button drag to pan around the zoomed image.
  - `Esc` to exit fullscreen.
- **Fullscreen zoom** (touch devices):
  - Two-finger pinch gesture to zoom in/out.
  - One-finger drag to pan around the zoomed image.
  - Tap the back button or `Esc` to exit fullscreen.
- **Sliders**: The Category / Year sliders are rendered to match visible label order and start at the oldest year by default.

## Troubleshooting

- If images or videos fail to load: ensure either the media files live under the project `data/` folder, or a `data_external` symlink points at your external media folder and `data-structure.js` uses `data_external/...` paths.
- If a non-symlink file or folder named `data_external` already exists, remove or rename it before generating data so the script can create the symlink.
- If you must serve an external absolute path, configure your webserver to serve that path under the project URL namespace.

## Contact / Next steps

If you want I can add a short example `serve` npm script, or update `generate-data.js` to always emit a small warning block at the top of `data-structure.js` explaining which path mode was used.
