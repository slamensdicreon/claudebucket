import { data } from "@/lib/data";

export default function ValueChain() {
  return (
    <div className="chain">
      {data.value_chain.map((t) => (
        <div className={"tier" + (t.tier === 3 ? " tier--anchor" : "")} key={t.tier}>
          <span className="tier__n">{t.tier}</span>
          <h3>{t.label}</h3>
          <p className="tier__summary">{t.summary}</p>
          <ul>
            {t.items.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
