# Dynamic Navigation Dashboard

A small static web app for browsing media by year, month, and category. It uses a JSON-style dataset provided by `data-structure.js`, renders a carousel, and supports keyboard navigation.

## Files

- `index.html` — main page and UI structure
- `style.css` — visual styling for the app and carousel
- `app.js` — application logic for sliders, carousel behavior, and keyboard controls
- `data-structure.js` — dataset used to populate the dashboard
- `data/` — media files that the app loads dynamically

## Features

- Year / month / category filtering
- Carousel display for media items
- Previous / next navigation buttons
- Click an image to toggle browser fullscreen mode
- Target Reference Path now includes the day in the date display, e.g. `21 January 1994`
- Category slider includes explicit first/last markers and label order now matches slider movement
- Keyboard support:
  - `ArrowLeft` / `ArrowRight` to navigate carousel items
  - `Home` / `End` to jump to first/last item
  - `Space` to play/pause the active video
- Graceful handling when data or media is missing

## Run locally

This project is static, so you can use any simple file server.

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

## Notes

- The app expects `style.css` and `app.js` to load from the same folder as `index.html`.
- If `styles.css` is referenced incorrectly, the carousel may display all media items simultaneously.
- The current data source is `data-structure.js`, so updating that file changes the available years/months/categories.
