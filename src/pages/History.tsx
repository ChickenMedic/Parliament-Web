import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import pmsRaw from '../data/prime_ministers.json';
import './PageStyles.css';
import './History.css';

interface Term { start: string; end: string | null }
interface PrimeMinister {
  number: number;
  name: string;
  party: string;
  terms: Term[];
  summary: string;
  wiki: string;
  portrait?: string;
}

const pms = pmsRaw as PrimeMinister[];

// The Conservative party has carried several names; the Liberal-Conservatives
// of 1867 and the Progressive Conservatives of 1942–2003 are the same lineage.
const FAMILY: Record<string, 'Liberal' | 'Conservative'> = {
  'Liberal': 'Liberal',
  'Conservative': 'Conservative',
  'Liberal-Conservative': 'Conservative',
  'Progressive Conservative': 'Conservative',
};
const FAMILY_COLOR = { Liberal: '#d71920', Conservative: '#1a4782' };
const familyOf = (pm: PrimeMinister) => FAMILY[pm.party] || 'Conservative';
const colorOf = (pm: PrimeMinister) => FAMILY_COLOR[familyOf(pm)];

const CONFEDERATION = Date.parse('1867-07-01');
const DAY = 24 * 60 * 60 * 1000;
// Read once at load: the page is static, and the lint rules forbid clock
// reads during render.
const NOW = Date.now();
const SPAN = NOW - CONFEDERATION;

const fmtDate = (iso: string | null) =>
  iso === null
    ? 'present'
    : new Date(iso + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

const termMs = (t: Term) => (t.end ? Date.parse(t.end) : NOW) - Date.parse(t.start);

const fmtDuration = (ms: number) => {
  const days = Math.round(ms / DAY);
  if (days < 365) return `${days} days`;
  const years = Math.floor(days / 365.25);
  const months = Math.floor((days - years * 365.25) / 30.44);
  return months > 0 ? `${years} yr ${months} mo` : `${years} yr`;
};

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const MILESTONES = [
  { year: 1867, what: 'Confederation. The British North America Act unites Ontario, Quebec, Nova Scotia and New Brunswick; the first Parliament meets in November.' },
  { year: 1918, what: 'Most women win the right to vote in federal elections; Agnes Macphail becomes the first woman elected to the Commons in 1921.' },
  { year: 1931, what: 'The Statute of Westminster gives Canada full control over its own laws and foreign policy.' },
  { year: 1949, what: 'Newfoundland joins Confederation as the tenth province.' },
  { year: 1960, what: 'The Canadian Bill of Rights is passed, and the federal vote is extended to all First Nations people without conditions.' },
  { year: 1965, what: 'The Maple Leaf flag is raised on Parliament Hill for the first time.' },
  { year: 1982, what: 'The Constitution is patriated with the Charter of Rights and Freedoms.' },
  { year: 1999, what: 'Nunavut is created, giving the territory its own seat in the Commons.' },
  { year: 2025, what: 'The House grows to 343 seats under the 2023 Representation Order at the April general election.' },
];

type Filter = 'All' | 'Liberal' | 'Conservative';

export const History = () => {
  const [filter, setFilter] = useState<Filter>('All');
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const [hovered, setHovered] = useState<PrimeMinister | null>(null);

  // One segment per term, in date order, so the bar reads left to right.
  const segments = useMemo(() => pms
    .flatMap(pm => pm.terms.map(t => ({ pm, t })))
    .sort((a, b) => Date.parse(a.t.start) - Date.parse(b.t.start))
    .map(({ pm, t }) => ({ pm, t, width: (termMs(t) / SPAN) * 100 })), []);

  const decades = useMemo(() => {
    const out: { year: number; left: number }[] = [];
    for (let y = 1880; y <= new Date(NOW).getFullYear(); y += 20) {
      out.push({ year: y, left: ((Date.parse(`${y}-01-01`) - CONFEDERATION) / SPAN) * 100 });
    }
    return out;
  }, []);

  const visible = useMemo(() => {
    const list = pms.filter(pm => filter === 'All' || familyOf(pm) === filter);
    return order === 'newest' ? [...list].reverse() : list;
  }, [filter, order]);

  const counts = { Liberal: pms.filter(p => familyOf(p) === 'Liberal').length, Conservative: pms.filter(p => familyOf(p) === 'Conservative').length };

  return (
    <div className="page-container glass-panel history">

      <div className="history-header">
        <h1>History</h1>
        <p>
          Canada has had {pms.length} prime ministers since Confederation: {counts.Liberal} Liberals and {counts.Conservative} from
          the Conservative tradition. Hover the bar to see who held office when, or browse the full list below.
        </p>
      </div>

      <section>
        <div className="history-section-title">
          <h2>Prime Ministers, 1867 to today</h2>
        </div>
        <div className="era-bar-wrap">
          <div className="era-bar" onMouseLeave={() => setHovered(null)}>
            {segments.map(({ pm, t, width }) => {
              const dim = filter !== 'All' && familyOf(pm) !== filter;
              return (
                <button
                  key={`${pm.number}-${t.start}`}
                  className={`${hovered === pm ? 'active' : ''} ${dim ? 'dimmed' : ''}`}
                  style={{ width: `${width}%`, background: colorOf(pm) }}
                  title={`${pm.name}, ${fmtDate(t.start)} – ${fmtDate(t.end)}`}
                  aria-label={pm.name}
                  onMouseEnter={() => setHovered(pm)}
                  onFocus={() => setHovered(pm)}
                  onClick={() => document.getElementById(`pm-${pm.number}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
              );
            })}
          </div>
          <div className="era-ticks">
            {decades.map(d => <span key={d.year} style={{ left: `${d.left}%` }}>{d.year}</span>)}
          </div>
          <div className="era-caption">
            {hovered ? (
              <><b>{hovered.name}</b> · {hovered.party} · {hovered.terms.map(t => `${fmtDate(t.start)} – ${fmtDate(t.end)}`).join('; ')}</>
            ) : (
              'Each block is one term in office. Click a block to jump to that prime minister.'
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="history-section-title">
          <h2>All {pms.length} prime ministers</h2>
          <div className="history-filters">
            {(['All', 'Liberal', 'Conservative'] as Filter[]).map(f => (
              <button
                key={f}
                className={`chip ${filter === f ? 'active' : ''}`}
                style={{ '--chip-color': f === 'All' ? undefined : FAMILY_COLOR[f] } as React.CSSProperties}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
            <button className="chip" onClick={() => setOrder(o => (o === 'newest' ? 'oldest' : 'newest'))}>
              {order === 'newest' ? 'Newest first' : 'Oldest first'} ⇅
            </button>
          </div>
        </div>

        <div className="pm-grid">
          {visible.map(pm => {
            const current = pm.terms.some(t => t.end === null);
            const total = pm.terms.reduce((sum, t) => sum + termMs(t), 0);
            return (
              <article
                key={pm.number}
                id={`pm-${pm.number}`}
                className={`pm-card ${current ? 'current' : ''}`}
                style={{ '--pm-color': colorOf(pm) } as React.CSSProperties}
              >
                <img
                  className="pm-portrait"
                  src={pm.portrait || `https://ui-avatars.com/api/?name=${encodeURIComponent(pm.name)}&background=333&color=fff`}
                  alt={pm.name}
                  loading="lazy"
                  onError={(e) => ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pm.name)}&background=333&color=fff`)}
                />
                <div className="pm-body">
                  <div className="pm-ordinal">
                    <span>{ordinal(pm.number)} Prime Minister</span>
                    <span className="pm-party">{pm.party}</span>
                    {current && <span className="pm-now">In office</span>}
                  </div>
                  <h3>{pm.name}</h3>
                  <div className="pm-terms">
                    {pm.terms.map((t, i) => (
                      <div key={i}>
                        {fmtDate(t.start)} – {fmtDate(t.end)}
                        {pm.terms.length > 1 && <small>{fmtDuration(termMs(t))}</small>}
                      </div>
                    ))}
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '2px' }}>
                      {fmtDuration(total)} in office{pm.terms.length > 1 ? ` across ${pm.terms.length} terms` : ''}
                    </div>
                  </div>
                  <p className="pm-summary">{pm.summary}</p>
                  <a className="pm-link" href={`https://en.wikipedia.org/wiki/${pm.wiki}`} target="_blank" rel="noopener noreferrer">
                    Read more on Wikipedia <ExternalLink size={12} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="history-section-title">
          <h2>Milestones</h2>
        </div>
        <div className="milestones">
          {MILESTONES.map(m => (
            <div key={m.year} className="milestone">
              <div className="year">{m.year}</div>
              <div className="what">{m.what}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
