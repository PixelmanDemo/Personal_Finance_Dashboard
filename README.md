# Finance Dashboard

A time-aware, glassmorphic financial topology dashboard with live Google Sheets integration, Three.js 3D visualisation, and an interactive transaction simulator.

## Tech Stack

- **HTML5** + **Tailwind CSS** (CDN) — responsive layout, dark cyberpunk/solarpunk theme
- **ES6+ JavaScript** (native, no bundler) — data fetching, caching, reactive UI
- **Three.js** (CDN r134) — WebGL animated torus knot + particle cloud
- **Google Sheets API** (JSON endpoint) — live financial data source

## Architecture

```
index.html          →  Shell layout (header, 3 tabs, Three.js canvas, footer)
css/custom.css      →  Glassmorphic cards, glow animations, simulator styles, responsive overrides
js/
  api.js            →  Fetch pipeline + localStorage cache layer
  three-scene.js    →  Three.js scene (torus knot, particle cloud, reactive thresholds, smooth transitions)
  app.js            →  Controller: data rendering, tab switching, AMEX & cash colouring, simulator logic
```

## Data Source

The dashboard fetches from a remote JSON endpoint backed by a Google Sheet. The payload shape:

```json
{
  "currentBalance": 732.19,
  "savingsBalance": 12500.00,
  "currentAmexBalance": 111.17,
  "totalOutgoings": 1914.71,
  "remainingOutgoings": 1150.00,
  "balanceAfterExpenses": 650.25,
  "expenses": [
    { "name": "Rent", "dueDay": 1, "amount": 950.00 },
    ...
  ]
}
```

## Caching Strategy

On first load, the app reads from `localStorage` (key: `financeDashboardData`) and renders instantly with zero flicker. An async fetch then resolves in the background — on success the cache is updated and the UI re-renders. If the network fails, cached data persists. A **SYNC** button in the header triggers a manual re-fetch.

## Tabs

### 1. Balances
Six glassmorphic metric cards arranged in a responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`):

| Card | Data Key | Theme |
|---|---|---|
| Current Account Balance | `currentBalance` | Standard white |
| Savings | `savingsBalance` | Emerald green |
| Current AMEX Balance | `currentAmexBalance` | Rose/red (coloured by threshold) |
| Total Outgoings This Month | `totalOutgoings` | Muted grey |
| Remaining Outgoings | `remainingOutgoings` | Amber |
| Cash Left After all Expenses | `balanceAfterExpenses` | Indigo |

**AMEX colour thresholds:** `< 850` green, `850–1199` amber, `≥ 1200` red. At `≥ 1500` a WARNING icon appears.

**Cash colour thresholds:** `≥ 125` indigo, `75–124` amber, `< 75` red.

### 2. Bills & Outgoings
Lists all expenses from the API. Each row shows the name, due day, amount, and a **SETTLED** / **PENDING** badge based on whether `dueDay <= today`. Settled items render at 40% opacity with a strikethrough amount. A **calendar progress bar** beneath the date header shows the percentage of the current month elapsed.

### 3. Simulator
An interactive "Can I Spend This?" calculator. Enter a purchase cost and optionally toggle the AMEX deduction mode:

- **Toggle OFF** (cash purchase): net = `balanceAfterExpenses - cost`
- **Toggle ON** (AMEX purchase): net = `balanceAfterExpenses` (unchanged), simulated AMEX = `currentAmexBalance + cost`

**Verdict rules:**

| Toggle | Condition | Result |
|---|---|---|
| OFF | net ≥ 300 | APPROVED (green) |
| OFF | 100–299 | CAUTION (amber) |
| OFF | < 100 | DENIED (red, flashing) |
| ON | simAmex ≤ 850 | APPROVED (green) |
| ON | 851–1250 | CAUTION (amber) |
| ON | ≥ 1251 | DENIED (red, flashing) |

## Three.js Visualisation

An animated **torus knot wireframe** + **600-particle cloud** rotates continuously in a transparent WebGL canvas above the tab content.

### Reactive thresholds (real balance)

| Balance | Colour | Speed | Scale |
|---|---|---|---|
| > 400 | Indigo `#6366f1` | 1× | 1.0 |
| 150–400 | Amber `#f59e0b` | 1.5× | 1.0 |
| < 150 | Crimson `#f43f5e` | 2.5× | 0.85 |

### Simulator preview

When the simulator is active, the scene smoothly lerps to green/amber/red based on the simulated net balance, giving a visual preview before any real spend.

All colour, speed, and scale transitions are interpolated at 5% per frame for fluid crossfades.

## Card Glows

Each metric card emits a pulsing `box-shadow` glow matching its value colour. The glow animation (`pulse-glow`) breathes between `20px` and `40px` blur radius over 4 seconds. Static cards have their glow set via inline `--glow-color`; dynamic cards (AMEX, Cash Remaining) have it updated in JavaScript alongside their value colour.

## Running the Dashboard

This is a zero-build static site. Open `index.html` in any modern browser:

```
open index.html
```

Or serve locally with any static file server:

```
npx serve .
```

No dependencies to install — Tailwind, Google Fonts, and Three.js are loaded via CDN.

## File Reference

| File | Purpose |
|---|---|
| `index.html` | Application shell, 3 tab panels, Three.js container |
| `css/custom.css` | All custom styles beyond Tailwind (cards, simulator, animations) |
| `js/api.js` | Fetch pipeline, localStorage read/write |
| `js/three-scene.js` | Three.js initialisation, animation loop, threshold state machine |
| `js/app.js` | Controller: DOM wiring, dashboard rendering, tab switching, simulator logic |
