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

# Or scan an external folder (this attempts to create a local symlink `data_external`)
node generate-data.js /path/to/your/gigs-data

# Or set environment variable
GIGS_DATA_DIR=/path/to/your/gigs-data node generate-data.js
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
- If you provide an external path (CLI arg or `GIGS_DATA_DIR`), the script will attempt to create a project-local symlink named `data_external` that points at the external directory. When that symlink exists, generated media URLs will use `data_external/<folder>/<file>` so the browser can load them via a relative path.
- If the script cannot create the symlink (permission issues, an existing non-symlink file named `data_external`, platform restrictions), it will fall back to writing absolute filesystem paths into `data-structure.js` and print a warning. Absolute filesystem paths usually cannot be loaded by a browser from a static server.

Manual symlink creation (Linux/macOS):

```bash
ln -s /path/to/your/gigs-data data_external
```

If you create the symlink manually, re-run `node generate-data.js` (or update `data-structure.js`) so paths use `data_external/...`.

## Usage notes

- Keyboard: `ArrowLeft` / `ArrowRight` to navigate; `Home` / `End` to jump; `Space` to pause/play videos.
- Click media to toggle browser fullscreen. The app attempts to preserve fullscreen when navigating items.
- The Category / Year sliders are rendered to match visible label order and start at the oldest year by default.

## Troubleshooting

- If images or videos fail to load: ensure either the media files live under the project `data/` folder, or a `data_external` symlink points at your external media folder and `data-structure.js` uses `data_external/...` paths.
- If a non-symlink file or folder named `data_external` already exists, remove or rename it before generating data so the script can create the symlink.
- If you must serve an external absolute path, configure your webserver to serve that path under the project URL namespace.

## Contact / Next steps

If you want I can add a short example `serve` npm script, or update `generate-data.js` to always emit a small warning block at the top of `data-structure.js` explaining which path mode was used.
