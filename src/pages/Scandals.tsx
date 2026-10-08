import { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import initialScandals from '../data/scandals.json';
import politiciansData from '../data/politicians.json';
import './PageStyles.css';
import './Scandals.css';

const getPartyColor = (party: string) => {
  switch (party.toLowerCase()) {
    case 'liberal': return '#d71920';
    case 'conservative': return '#1a4782';
    case 'ndp': return '#f37021';
    case 'bloc québécois':
    case 'bloc': return '#33b2cc';
    case 'green': return '#3d9b35';
    default: return '#808080';
  }
};

const SEVERITY: Record<string, { color: string; level: number }> = {
  critical: { color: '#ef4444', level: 4 },
  high: { color: '#f97316', level: 3 },
  medium: { color: '#eab308', level: 2 },
  low: { color: '#3b82f6', level: 1 },
};
const severityOf = (s: string) => SEVERITY[s.toLowerCase()] || SEVERITY.low;

// Statuses are free text in scandals.json; colour the ones we know and fall
// back to neutral for anything new.
const STATUS_COLORS: Record<string, string> = {
  'under investigation': '#f97316',
  'public inquiry': '#a78bfa',
  'implementation phase': '#a78bfa',
  'under committee review': '#38bdf8',
  'active debate': '#eab308',
  'audited': '#60a5fa',
  'resolved': '#34d399',
};
const statusColor = (status: string) => STATUS_COLORS[status.toLowerCase()] || '#94a3b8';

// Timeline dates look like "Feb 2024"; undated rows ("Ongoing") don't count
// as developments, so stories only rank as fresh when something new happened.
const parseTimelineDate = (d: string): number | null => {
  const t = Date.parse(`1 ${d}`);
  return isNaN(t) ? null : t;
};

const lastDevelopmentTime = (s: { timeline: { date: string }[] }): number | null => {
  let latest: number | null = null;
  for (const step of s.timeline) {
    const t = parseTimelineDate(step.date);
    if (t !== null && (latest === null || t > latest)) latest = t;
  }
  return latest;
};

const recencyInfo = (s: { timeline: { date: string }[] }) => {
  const t = lastDevelopmentTime(s);
  if (t === null) return { label: 'No dated developments', color: 'rgba(255,255,255,0.4)' };
  const when = new Date(t).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
  const months = (Date.now() - t) / (1000 * 60 * 60 * 24 * 30.4);
  if (months <= 3) return { label: `In the news · ${when}`, color: '#34d399' };
  if (months <= 12) return { label: `Last development ${when}`, color: '#f59e0b' };
  return { label: `Quiet since ${when}`, color: 'rgba(255,255,255,0.45)' };
};

interface Scandal {
  id: string;
  title: string;
  party: string;
  status: string;
  severity: string;
  description: string;
  keyFigures: string[];
  timeline: { date: string; event: string }[];
  votes: number;
  latestDevelopments?: string;
  developmentsAsOf?: string;
}

interface MP {
  name: string;
  image: string | null;
  current_party: { short_name: { en: string } };
  current_riding: { name: { en: string } };
}

const scandals = initialScandals as Scandal[];
const politicians = politiciansData.objects as MP[];
const findMP = (name: string) =>
  politicians.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim()) || null;

const PARTIES = ['All', ...Array.from(new Set(scandals.map(s => s.party)))];
const STATUSES = ['All', ...Array.from(new Set(scandals.map(s => s.status)))];

const Figure = ({ name }: { name: string }) => {
  const mp = findMP(name);
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=333&color=fff`;
  return (
    <div className="figure" style={{ '--figure-color': mp ? getPartyColor(mp.current_party.short_name.en) : undefined } as React.CSSProperties}>
      <img
        src={mp?.image ? `https://openparliament.ca${mp.image}` : fallback}
        alt=""
        onError={e => ((e.target as HTMLImageElement).src = fallback)}
      />
      <span>
        {name}
        {mp && <small> · {mp.current_riding.name.en}</small>}
      </span>
    </div>
  );
};

export const Scandals = () => {
  const [search, setSearch] = useState('');
  const [selectedParty, setSelectedParty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scandals
      .filter(s => {
        const matchSearch = !q
          || s.title.toLowerCase().includes(q)
          || s.description.toLowerCase().includes(q)
          || s.keyFigures.some(name => name.toLowerCase().includes(q));
        const matchParty = selectedParty === 'All' || s.party === selectedParty;
        const matchStatus = selectedStatus === 'All' || s.status === selectedStatus;
        return matchSearch && matchParty && matchStatus;
      })
      // Most recently developing stories first; undated-only stories last.
      .sort((a, b) => (lastDevelopmentTime(b) ?? 0) - (lastDevelopmentTime(a) ?? 0));
  }, [search, selectedParty, selectedStatus]);

  return (
    <div className="page-container glass-panel scandals">

      <div className="scandals-header">
        <h1>Ethics &amp; Scandal Tracker</h1>
        <p>
          Inquiries, audits and ethics complaints involving the federal parties, with what has actually
          been established so far and a dated timeline for each. Stories with recent developments come first.
        </p>
      </div>

      <div className="scandals-toolbar">
        <div className="scandals-search">
          <Search size={17} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, details or person…"
          />
        </div>
        <div className="chip-row">
          <span>Party</span>
          {PARTIES.map(party => (
            <button
              key={party}
              className={`chip ${selectedParty === party ? 'active' : ''}`}
              style={{ '--chip-color': party === 'All' ? undefined : getPartyColor(party) } as React.CSSProperties}
              onClick={() => setSelectedParty(party)}
            >
              {party}
            </button>
          ))}
        </div>
        <div className="chip-row">
          <span>Status</span>
          {STATUSES.map(status => (
            <button
              key={status}
              className={`chip ${selectedStatus === status ? 'active' : ''}`}
              style={{ '--chip-color': status === 'All' ? undefined : `${statusColor(status)}55` } as React.CSSProperties}
              onClick={() => setSelectedStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="scandals-count">
          Showing {filtered.length} of {scandals.length} stories
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="scandals-empty">No stories match these filters.</div>
      ) : (
        <div className="scandal-grid">
          {filtered.map(s => {
            const expanded = expandedId === s.id;
            const sev = severityOf(s.severity);
            const recency = recencyInfo(s);
            const vars = {
              '--party-color': getPartyColor(s.party),
              '--status-color': statusColor(s.status),
              '--severity-color': sev.color,
              '--recency-color': recency.color,
            } as React.CSSProperties;

            return (
              <article key={s.id} className={`scandal-card ${expanded ? 'expanded' : ''}`} style={vars}>
                <div className="scandal-main">
                  <div className="scandal-tags">
                    <span className="tag party">{s.party}</span>
                    <span className="tag status">{s.status}</span>
                    <span className="severity" title={`${s.severity} severity`}>
                      <i>{[1, 2, 3, 4].map(n => <b key={n} className={n <= sev.level ? 'on' : ''} />)}</i>
                      {s.severity}
                    </span>
                  </div>
                  <h3>{s.title}</h3>
                  <p className="scandal-desc">{s.description}</p>
                  <div className="scandal-figures">
                    {s.keyFigures.map(name => <Figure key={name} name={name} />)}
                  </div>
                </div>

                <div className="scandal-footer">
                  <span className="recency">{recency.label}</span>
                  <button
                    className="details-btn"
                    onClick={() => setExpandedId(expanded ? null : s.id)}
                    aria-expanded={expanded}
                  >
                    {expanded ? 'Close' : `Full story · ${s.timeline.length} events`}
                    <ChevronDown size={15} />
                  </button>
                </div>

                {expanded && (
                  <div className="scandal-drawer">
                    <div className="drawer-col">
                      {s.latestDevelopments && (
                        <div className="now-box">
                          <h4>
                            What's happening now
                            {s.developmentsAsOf && <small>as of {s.developmentsAsOf}</small>}
                          </h4>
                          <p>{s.latestDevelopments}</p>
                        </div>
                      )}
                      <div>
                        <h4>Background</h4>
                        <p>{s.description}</p>
                      </div>
                    </div>

                    <div className="drawer-col">
                      <div>
                        <h4>Timeline</h4>
                        <div className="timeline">
                          {s.timeline.map((step, idx) => {
                            const undated = parseTimelineDate(step.date) === null;
                            return (
                              <div key={idx} className="timeline-step">
                                <div className="timeline-rail">
                                  <i className={undated ? 'ongoing' : ''} />
                                  {idx < s.timeline.length - 1 && <span />}
                                </div>
                                <div>
                                  <div className="timeline-date">{step.date}</div>
                                  <p className="timeline-event">{step.event}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
