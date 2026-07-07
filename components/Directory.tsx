"use client";

import { useMemo, useState } from "react";
import { data, regionGroup, type Company, type Confidence } from "@/lib/data";

type Dim = "segment" | "service" | "serve" | "region" | "confidence";
type FilterState = Record<Dim, Set<string>>;

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const PinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const confRank: Record<Confidence, number> = { documented: 0, directional: 1, verify: 2 };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function countBy(companies: Company[], fn: (c: Company) => string[]) {
  const map = new Map<string, number>();
  companies.forEach((c) => fn(c).forEach((k) => map.set(k, (map.get(k) || 0) + 1)));
  return map;
}

export default function Directory() {
  const { companies, service_lines, customer_segments, segments } = data;

  const [filters, setFilters] = useState<FilterState>({
    segment: new Set(),
    service: new Set(),
    serve: new Set(),
    region: new Set(),
    confidence: new Set(),
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");

  const facets = useMemo(() => {
    const seg = countBy(companies, (c) => [c.segment]);
    const svc = countBy(companies, (c) => c.services);
    const srv = countBy(companies, (c) => c.serves);
    const rgn = countBy(companies, (c) => [regionGroup(c.region)]);
    const cnf = countBy(companies, (c) => [c.confidence]);
    return {
      segment: { keys: [...seg.keys()].sort(), counts: seg, label: (k: string) => segments[k] || k },
      service: { keys: Object.keys(service_lines).filter((k) => svc.has(k)), counts: svc, label: (k: string) => service_lines[k] },
      serve: { keys: Object.keys(customer_segments).filter((k) => srv.has(k)), counts: srv, label: (k: string) => customer_segments[k] },
      region: { keys: [...rgn.keys()].sort(), counts: rgn, label: (k: string) => k },
      confidence: { keys: ["documented", "directional", "verify"].filter((k) => cnf.has(k)), counts: cnf, label: cap },
    };
  }, [companies, service_lines, customer_segments, segments]);

  const toggle = (dim: Dim, key: string) => {
    setFilters((prev) => {
      const next = new Set(prev[dim]);
      next.has(key) ? next.delete(key) : next.add(key);
      return { ...prev, [dim]: next };
    });
  };

  const anyFilter = query.trim() !== "" || (Object.values(filters) as Set<string>[]).some((s) => s.size > 0);

  const clearAll = () => {
    setFilters({ segment: new Set(), service: new Set(), serve: new Set(), region: new Set(), confidence: new Set() });
    setQuery("");
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = companies.filter((c) => {
      if (filters.segment.size && !filters.segment.has(c.segment)) return false;
      if (filters.service.size && !c.services.some((s) => filters.service.has(s))) return false;
      if (filters.serve.size && !c.serves.some((s) => filters.serve.has(s))) return false;
      if (filters.region.size && !filters.region.has(regionGroup(c.region))) return false;
      if (filters.confidence.size && !filters.confidence.has(c.confidence)) return false;
      if (q) {
        const hay = [c.name, c.hq, c.region, c.customers, c.notes].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const by: Record<string, (a: Company, b: Company) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      confidence: (a, b) => confRank[a.confidence] - confRank[b.confidence] || a.name.localeCompare(b.name),
      joined: (a, b) => (Number(b.joined) || 0) - (Number(a.joined) || 0) || a.name.localeCompare(b.name),
      segment: (a, b) => a.segment.localeCompare(b.segment) || a.name.localeCompare(b.name),
    };
    return [...list].sort(by[sort] || by.name);
  }, [companies, filters, query, sort]);

  const facetBlocks: Array<{ dim: Dim; label: string }> = [
    { dim: "segment", label: "Segment" },
    { dim: "service", label: "Service line" },
    { dim: "serve", label: "Customer segment" },
    { dim: "region", label: "Region" },
    { dim: "confidence", label: "Confidence" },
  ];

  return (
    <div className="directory">
      <aside className="filters" aria-label="Filters">
        <div className="filters__row">
          <h3>Filters</h3>
          <button className="btn-clear" onClick={clearAll} disabled={!anyFilter}>
            Clear all
          </button>
        </div>
        <div className="search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search name, HQ, customer..."
            aria-label="Search companies"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="facets-wrap">
          {facetBlocks.map(({ dim, label }) => {
            const f = facets[dim];
            return (
              <div className="facet" key={dim}>
                <div className="facet__label">{label}</div>
                {f.keys.map((key) => (
                  <label className="opt" key={key}>
                    <input type="checkbox" checked={filters[dim].has(key)} onChange={() => toggle(dim, key)} />
                    <span className="opt__box">
                      <CheckIcon />
                    </span>
                    <span className="opt__text">{f.label(key)}</span>
                    <span className="opt__count">{f.counts.get(key) || 0}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </aside>

      <div>
        <div className="results__bar">
          <div className="results__count">
            <b>{shown.length}</b> of {companies.length} operating companies
          </div>
          <div className="sort">
            <label htmlFor="sort">Sort</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name">Name (A to Z)</option>
              <option value="confidence">Confidence</option>
              <option value="joined">Year joined (newest)</option>
              <option value="segment">Segment</option>
            </select>
          </div>
        </div>

        <div className="grid">
          {shown.length === 0 ? (
            <div className="empty">
              <h3>No companies match</h3>
              <p>Loosen a filter or clear the search to widen results.</p>
            </div>
          ) : (
            shown.map((c) => <CompanyCard key={c.name} c={c} />)
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ c }: { c: Company }) {
  const { service_lines, customer_segments, segments } = data;
  const [open, setOpen] = useState(false);
  const hasNotes = Boolean(c.notes);
  const segClass = c.segment === "building_systems" ? "badge--bs" : "badge--comm";

  const onActivate = () => hasNotes && setOpen((v) => !v);

  return (
    <article
      className={"card" + (open ? " is-open" : "")}
      tabIndex={hasNotes ? 0 : undefined}
      role={hasNotes ? "button" : undefined}
      style={hasNotes ? undefined : { cursor: "default" }}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (hasNotes && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
    >
      <div className="card__top">
        <div>
          <h3 className="card__name">{c.name}</h3>
          <p className="card__hq">
            <PinIcon /> {c.hq || "HQ pending confirmation"}
            {c.region ? " · " + c.region : ""}
          </p>
        </div>
        <span className={"badge " + segClass}>{segments[c.segment] || c.segment}</span>
      </div>

      <div className="chips">
        {c.services.map((s) => (
          <span className="chip" key={s}>
            {service_lines[s] || s}
          </span>
        ))}
      </div>

      <div className="chips">
        {c.serves.map((s) => (
          <span className="chip chip--serve" key={s}>
            {customer_segments[s] || s}
          </span>
        ))}
      </div>

      <div className="card__customers">
        <b>Serves:</b> {c.customers || "—"}
      </div>

      <div className="card__meta">
        <span className={"conf conf--" + c.confidence}>{cap(c.confidence)}</span>
        {c.joined ? (
          <span className="card__joined">Joined {c.joined}</span>
        ) : c.founded ? (
          <span className="card__joined">Founded {c.founded}</span>
        ) : null}
      </div>

      {hasNotes && <div className="card__notes">{c.notes}</div>}
    </article>
  );
}
