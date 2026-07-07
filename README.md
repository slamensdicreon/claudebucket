# Dycom Ecosystem Explorer

Interactive directory of the Dycom Industries operating company portfolio, built by Icreon for the SitecoreAI experience layer and SAP SuccessFactors recruiting pursuit. The explorer maps 41+ separately branded subsidiaries into a single source of truth so the pursuit team can scope a unified employer brand and the 4,000-hire program across two labor pools.

Built in the Icreon design system: brand blue `#386AFF`, the New Hero typeface with an Inter fallback, and the official Icreon wordmark logo.

## What it does

- **Four-tier value chain diagram** rendered from the data contract, with the Dycom segment tier called out as the anchor.
- **Faceted company directory** filterable by segment, service line, customer segment, region, and confidence, plus free-text search across name, HQ, region, customers, and notes.
- **Confidence flags** distinguish documented entries from directional attributions and roster items awaiting confirmation.
- **Expandable cards** surface acquisition history and capability notes on click.
- **Live headline metrics** (operating companies, backlog, revenue, hire target) hydrate from the same JSON.

## Running it

The app fetches its dataset over HTTP, so serve the folder rather than opening the file directly:

```bash
python3 -m http.server 8123
# then open http://127.0.0.1:8123
```

Any static host works. No build step and no dependencies.

## Structure

```
index.html                     Page shell, hero, value chain, directory, pursuit note
assets/css/icreon.css          Icreon design tokens and components
assets/js/app.js               Data load, facet build, filter, sort, render
assets/img/icreon-logo.svg     Official Icreon wordmark (black + blue mark)
assets/img/icreon-logo-light.svg  White wordmark variant for dark surfaces
assets/img/icreon-mark.svg     Blue arrow glyph (favicon)
data/dycom-companies.json      Data contract (section 4 of the brief)
```

## Data contract

`data/dycom-companies.json` is the single source of truth. The UI hardcodes no roster data, so verification updates land in the JSON alone and flow through untouched. The schema follows section 4 of the ecosystem map brief: `meta`, `service_lines`, `customer_segments`, `segments`, `value_chain`, `companies`, and `pending_additions`.

Refresh fiscal figures against the latest 10-K before external use. Customer concentration percentages currently come from fiscal 2025 Q2 and carry a refresh flag in the brief. National Technology Integrators (NTI) sits in `pending_additions` until close details are confirmed, then promotes to company 42.

## Sources

Dycom FY2026 10-K and Exhibit 21.1, Dycom press releases, subsidiary websites, and industry reporting. Confidence flags mark every inference. Logo and brand colors sourced from the Icreon production site (icreon.com), July 2026.
