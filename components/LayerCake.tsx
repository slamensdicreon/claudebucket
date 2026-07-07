import { data } from "@/lib/data";

/** Per-tier presentation. The stack reads top down: light demand layers,
 *  the Dycom anchor in brand blue, and the delivery foundation in ink. */
const THEME: Record<number, { variant: string; kicker: string }> = {
  1: { variant: "light", kicker: "Where capital originates" },
  2: { variant: "light", kicker: "Who funds the work" },
  3: { variant: "anchor", kicker: "The Dycom layer" },
  4: { variant: "base", kicker: "Where work reaches the ground" },
};

/** Captions on the downward connectors between layers. */
const FLOW = ["Capital deployed", "Contracts awarded", "Work delivered"];

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function LayerCake() {
  const tiers = data.value_chain;

  return (
    <div className="cake">
      {tiers.map((t, i) => {
        const theme = THEME[t.tier] || THEME[1];
        return (
          <div key={t.tier}>
            <div className={`layer layer--${theme.variant}`}>
              <span className="layer__watermark" aria-hidden="true">
                {String(t.tier).padStart(2, "0")}
              </span>
              <div className="layer__head">
                <span className="layer__num">{String(t.tier).padStart(2, "0")}</span>
                <h3>{t.label}</h3>
                <span className="layer__kicker">{theme.kicker}</span>
              </div>
              <p className="layer__summary">{t.summary}</p>
              <ul className="layer__items">
                {t.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              {theme.variant === "anchor" && (
                <span className="layer__flag">Recruiting surface Icreon unifies</span>
              )}
            </div>

            {i < tiers.length - 1 && (
              <div className="connector" aria-hidden="true">
                <span className="connector__label">{FLOW[i]}</span>
                <ChevronDown />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
