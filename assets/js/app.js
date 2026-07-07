/* ============================================================
   Dycom Ecosystem Explorer
   Data contract: data/dycom-companies.json (section 4 of the brief).
   The UI never hardcodes roster data. Verification updates land
   in the JSON alone and flow through untouched.
   ============================================================ */

const DATA_URL = "data/dycom-companies.json";

const state = {
  data: null,
  filters: { segment: new Set(), service: new Set(), serve: new Set(), region: new Set(), confidence: new Set() },
  query: "",
  sort: "name",
};

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

const CHECK = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const PIN = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

/* Region grouping keeps the facet short and legible. */
function regionGroup(region) {
  const r = (region || "").toLowerCase();
  if (/(southeast|florida|gulf|carolina|tennessee|georgia)/.test(r)) return "Southeast + Gulf";
  if (/(northeast|new england|mid-atlantic|ny|new hampshire|vermont)/.test(r)) return "Northeast + Mid-Atlantic";
  if (/(midwest|illinois|wisconsin|minnesota)/.test(r)) return "Midwest";
  if (/(pacific|oregon|washington|western|california)/.test(r)) return "West + Pacific NW";
  if (/(southwest|texas|arizona|phoenix)/.test(r)) return "Southwest";
  if (/(mountain|colorado|utah|front range)/.test(r)) return "Mountain West";
  if (/canada/.test(r)) return "Canada";
  if (/national/.test(r)) return "National footprint";
  return "Other / regional";
}

async function boot() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    state.data = await res.json();
  } catch (err) {
    document.getElementById("grid").innerHTML =
      '<div class="empty"><h3>Dataset failed to load</h3><p>Serve the folder over HTTP (for example: <code>python3 -m http.server</code>) so the browser can read <code>' +
      DATA_URL + "</code>.</p></div>";
    console.error(err);
    return;
  }
  hydrateMeta();
  buildFilters();
  bindControls();
  render();
}

function fmtUSD(n) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
  return "$" + n.toLocaleString();
}

function hydrateMeta() {
  const m = state.data.meta;
  const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  set("stat-companies", m.operating_companies + "+");
  set("stat-backlog", fmtUSD(m.backlog_total_usd));
  set("stat-revenue", fmtUSD(m.revenue_ttm_usd));
  set("stat-hires", m.hire_target.toLocaleString());
  set("meta-asof", new Date(m.as_of + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
}

/* ---- Facet construction --------------------------------- */
function buildFilters() {
  const d = state.data;
  const companies = d.companies;

  const countBy = (fn) => {
    const map = new Map();
    companies.forEach((c) => fn(c).forEach((k) => map.set(k, (map.get(k) || 0) + 1)));
    return map;
  };

  const segCounts = countBy((c) => [c.segment]);
  const svcCounts = countBy((c) => c.services);
  const srvCounts = countBy((c) => c.serves);
  const rgnCounts = countBy((c) => [regionGroup(c.region)]);
  const cnfCounts = countBy((c) => [c.confidence]);

  renderFacet("facet-segment", "segment", [...segCounts.keys()].sort(), segCounts, (k) => d.segments[k] || k);
  renderFacet("facet-service", "service", Object.keys(d.service_lines).filter((k) => svcCounts.has(k)), svcCounts, (k) => d.service_lines[k]);
  renderFacet("facet-serve", "serve", Object.keys(d.customer_segments).filter((k) => srvCounts.has(k)), srvCounts, (k) => d.customer_segments[k]);
  renderFacet("facet-region", "region", [...rgnCounts.keys()].sort(), rgnCounts, (k) => k);
  const confOrder = ["documented", "directional", "verify"].filter((k) => cnfCounts.has(k));
  renderFacet("facet-confidence", "confidence", confOrder, cnfCounts, (k) => k.charAt(0).toUpperCase() + k.slice(1));
}

function renderFacet(containerId, dim, keys, counts, labelFn) {
  const box = document.getElementById(containerId);
  box.innerHTML = "";
  keys.forEach((key) => {
    const label = el("label", "opt");
    const input = el("input");
    input.type = "checkbox";
    input.value = key;
    input.addEventListener("change", () => {
      input.checked ? state.filters[dim].add(key) : state.filters[dim].delete(key);
      render();
    });
    const box2 = el("span", "opt__box", CHECK);
    const text = el("span", "opt__text", labelFn(key));
    const cnt = el("span", "opt__count", String(counts.get(key) || 0));
    label.append(input, box2, text, cnt);
    box.append(label);
  });
}

/* ---- Filtering + sort ----------------------------------- */
function matches(c) {
  const f = state.filters;
  if (f.segment.size && !f.segment.has(c.segment)) return false;
  if (f.service.size && !c.services.some((s) => f.service.has(s))) return false;
  if (f.serve.size && !c.serves.some((s) => f.serve.has(s))) return false;
  if (f.region.size && !f.region.has(regionGroup(c.region))) return false;
  if (f.confidence.size && !f.confidence.has(c.confidence)) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = [c.name, c.hq, c.region, c.customers, c.notes].filter(Boolean).join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

const confRank = { documented: 0, directional: 1, verify: 2 };
function sortCompanies(list) {
  const s = state.sort;
  const by = {
    name: (a, b) => a.name.localeCompare(b.name),
    confidence: (a, b) => confRank[a.confidence] - confRank[b.confidence] || a.name.localeCompare(b.name),
    joined: (a, b) => (b.joined || 0) - (a.joined || 0) || a.name.localeCompare(b.name),
    segment: (a, b) => a.segment.localeCompare(b.segment) || a.name.localeCompare(b.name),
  };
  return [...list].sort(by[s] || by.name);
}

/* ---- Render --------------------------------------------- */
function render() {
  const d = state.data;
  const shown = sortCompanies(d.companies.filter(matches));

  const countEl = document.getElementById("result-count");
  countEl.innerHTML = "<b>" + shown.length + "</b> of " + d.companies.length + " operating companies";

  const anyFilter = state.query || Object.values(state.filters).some((s) => s.size);
  const clearBtn = document.getElementById("clear");
  clearBtn.disabled = !anyFilter;

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  if (!shown.length) {
    grid.append(el("div", "empty", "<h3>No companies match</h3><p>Loosen a filter or clear the search to widen results.</p>"));
    return;
  }
  shown.forEach((c) => grid.append(card(c, d)));
}

function card(c, d) {
  const node = el("article", "card");
  node.setAttribute("tabindex", "0");
  node.setAttribute("role", "button");

  const segClass = c.segment === "building_systems" ? "badge--bs" : "badge--comm";
  const segLabel = d.segments[c.segment] || c.segment;

  const top = el("div", "card__top");
  const head = el("div");
  head.append(el("h3", "card__name", c.name));
  head.append(el("p", "card__hq", (c.hq ? PIN + " " + c.hq : PIN + " HQ pending confirmation") + (c.region ? " &middot; " + c.region : "")));
  top.append(head, el("span", "badge " + segClass, segLabel));

  const svc = el("div", "chips");
  c.services.forEach((s) => svc.append(el("span", "chip", d.service_lines[s] || s)));

  const serve = el("div", "chips");
  c.serves.forEach((s) => serve.append(el("span", "chip chip--serve", d.customer_segments[s] || s)));

  const cust = el("div", "card__customers", "<b>Serves:</b> " + (c.customers || "—"));

  const meta = el("div", "card__meta");
  meta.append(el("span", "conf conf--" + c.confidence, c.confidence.charAt(0).toUpperCase() + c.confidence.slice(1)));
  if (c.joined) meta.append(el("span", "card__joined", "Joined " + c.joined));
  else if (c.founded) meta.append(el("span", "card__joined", "Founded " + c.founded));

  node.append(top, svc, serve, cust, meta);

  if (c.notes) {
    node.append(el("div", "card__notes", c.notes));
    const toggle = () => node.classList.toggle("is-open");
    node.addEventListener("click", toggle);
    node.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  } else {
    node.style.cursor = "default";
    node.removeAttribute("role");
  }
  return node;
}

/* ---- Controls ------------------------------------------- */
function bindControls() {
  const search = document.getElementById("search");
  search.addEventListener("input", (e) => { state.query = e.target.value.trim(); render(); });

  document.getElementById("sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });

  document.getElementById("clear").addEventListener("click", () => {
    state.query = "";
    document.getElementById("search").value = "";
    Object.values(state.filters).forEach((s) => s.clear());
    document.querySelectorAll(".facet input[type=checkbox]").forEach((i) => (i.checked = false));
    render();
  });
}

document.addEventListener("DOMContentLoaded", boot);
