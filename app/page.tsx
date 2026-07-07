import IcreonLogo from "@/components/IcreonLogo";
import LayerCake from "@/components/LayerCake";
import Directory from "@/components/Directory";
import { data, fmtUSD } from "@/lib/data";

const CheckMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export default function Home() {
  const m = data.meta;
  const asOf = new Date(m.as_of + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* App bar */}
      <header className="appbar">
        <div className="appbar__inner">
          <a className="appbar__logo" href="https://www.icreon.com" aria-label="Icreon home" target="_blank" rel="noreferrer">
            <IcreonLogo width={117} />
          </a>
          <span className="appbar__divider" />
          <div className="appbar__title">
            Dycom Ecosystem Explorer
            <small>Operating company intelligence for the recruiting pursuit</small>
          </div>
          <span className="appbar__spacer" />
          <nav className="appbar__nav" aria-label="Sections">
            <a href="#ecosystem">Ecosystem</a>
            <a href="#directory">Directory</a>
          </nav>
          <span className="appbar__tag">
            <b>Icreon</b> × Dycom pursuit
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero__inner">
          <p className="eyebrow">SitecoreAI experience layer · SAP SuccessFactors pipeline</p>
          <h1>
            One recruiting experience across <span className="accent">41+ Dycom brands</span>.
          </h1>
          <p className="hero__lede">
            Dycom runs its acquired firms as separately branded subsidiaries, each carrying its own career site and
            candidate journey. The explorer maps the portfolio into a single source of truth so the pursuit team can
            scope a unified employer brand and hire 4,000 people across two labor pools.
          </p>
          <div className="stats">
            <div className="stat">
              <div className="stat__value">{m.operating_companies}+</div>
              <div className="stat__label">Operating companies</div>
              <div className="stat__sub">Plus NTI, acquired May 2026</div>
            </div>
            <div className="stat">
              <div className="stat__value">{fmtUSD(m.backlog_total_usd)}</div>
              <div className="stat__label">Total backlog</div>
              <div className="stat__sub">Up 23.0% year over year</div>
            </div>
            <div className="stat">
              <div className="stat__value">{fmtUSD(m.revenue_ttm_usd)}</div>
              <div className="stat__label">Revenue, trailing twelve months</div>
              <div className="stat__sub">
                FY2027 guide {fmtUSD(m.fy2027_guidance_low_usd)} to {fmtUSD(m.fy2027_guidance_high_usd)}
              </div>
            </div>
            <div className="stat">
              <div className="stat__value">{m.hire_target.toLocaleString()}</div>
              <div className="stat__label">Target hires across the portfolio</div>
              <div className="stat__sub">Outside plant crews and data center electricians</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem layer cake */}
      <section id="ecosystem" className="block" style={{ background: "var(--surface-2)" }}>
        <div className="wrap">
          <div className="section-head" style={{ textAlign: "center", margin: "0 auto 32px" }}>
            <h2>The ecosystem, top to bottom</h2>
            <p style={{ marginInline: "auto" }}>
              Read the four tiers as a layer cake. Capital enters at the demand layer and converts into built
              infrastructure and hires by the delivery layer. Dycom occupies the middle layer, where carrier and public
              capex becomes field labor demand and the recruiting surface Icreon unifies.
            </p>
          </div>
          <LayerCake />
          <div className="cake-cta">
            <a href="#directory">
              Explore the 41+ operating companies
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Directory */}
      <section id="directory" className="block" style={{ background: "var(--surface)" }}>
        <div className="wrap">
          <div className="section-head">
            <h2>Operating company directory</h2>
            <p>
              Filter the portfolio by segment, service line, customer segment, region, and confidence. Confidence flags
              mark documented entries against roster items that still need independent confirmation. Open a card to read
              the acquisition and capability notes.
            </p>
            <div className="legend">
              <span className="conf conf--documented">Documented in filings or company sources</span>
              <span className="conf conf--directional">Directional, geography-based attribution</span>
              <span className="conf conf--verify">Verify against the subsidiary directory</span>
            </div>
          </div>
          <Directory />
        </div>
      </section>

      {/* Pursuit note */}
      <section className="block" style={{ background: "var(--surface-2)" }}>
        <div className="wrap">
          <div className="pursuit">
            <div>
              <h2>Why the pursuit lands</h2>
              <p>
                Fragmentation is the opportunity. <strong>41+ separately branded career sites</strong> deliver an
                inconsistent candidate experience with no unified employer brand. Parkside and TelCom share one
                Clearwater, Minnesota base and even share job postings, so candidates in one town meet multiple Dycom
                brands competing for the same labor pool.
              </p>
              <p>
                A <span className="accent">SitecoreAI</span> experience layer serves localized per-company recruiting
                front ends. <strong>SAP SuccessFactors</strong> runs underneath as the single applicant pipeline. One
                architecture now answers two recruiting motions: outside plant field crews and data center electricians.
              </p>
            </div>
            <div className="pursuit__points">
              <div className="pursuit__point">
                <CheckMark />
                <div>
                  <b>Two labor pools, one experience layer</b>
                  <span>Building Systems adds data center electricians to existing outside plant crew demand.</span>
                </div>
              </div>
              <div className="pursuit__point">
                <CheckMark />
                <div>
                  <b>Lumpy regional demand</b>
                  <span>A Gigapower market win at Ansco creates hundreds of hires in one metro on short notice.</span>
                </div>
              </div>
              <div className="pursuit__point">
                <CheckMark />
                <div>
                  <b>Employer brand upside</b>
                  <span>A credible, unified recruiting experience closes a reputational gap, not only an efficiency gap.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <IcreonLogo width={90} />
            <span>Your Digital Velocity Partner</span>
          </div>
          <div className="footer__meta">
            Data compiled from the Dycom FY2026 10-K, press releases, and subsidiary sources. Last updated {asOf}.
            Refresh fiscal figures against the latest 10-K before external use. Confidence flags mark every inference.
          </div>
        </div>
      </footer>
    </>
  );
}
