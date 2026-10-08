import { NavLink } from 'react-router-dom';
import { Newspaper, Users, FileText, AlertTriangle, Landmark, Map, History, ArrowRight, ChevronRight } from 'lucide-react';
import leadersData from '../data/leaders.json';
import politiciansData from '../data/politicians.json';
import './PageStyles.css';
import './Home.css';

const TOTAL_SEATS = 343;

const PARTY_COLORS: Record<string, string> = {
  Liberal: '#d71920',
  Conservative: '#1a4782',
  Bloc: '#33b2cc',
  NDP: '#f37021',
  Green: '#3d9b35',
};
const partyColor = (party: string) => PARTY_COLORS[party] || '#808080';

interface Politician {
  name: string;
  image: string | null;
  current_party: { short_name: { en: string } };
}

const politicians = politiciansData.objects as Politician[];

// Seat counts by party, largest first, with "Other" for independents and
// the empty seats awaiting a by-election at the end.
const standings = (() => {
  const counts: Record<string, number> = {};
  for (const p of politicians) {
    const party = p.current_party.short_name.en;
    const key = party in PARTY_COLORS ? party : 'Other';
    counts[key] = (counts[key] || 0) + 1;
  }
  const rows = Object.entries(counts)
    .map(([party, seats]) => ({ party, seats, color: partyColor(party) }))
    .sort((a, b) => b.seats - a.seats);
  const vacant = TOTAL_SEATS - politicians.length;
  if (vacant > 0) rows.push({ party: 'Vacant', seats: vacant, color: 'rgba(255,255,255,0.15)' });
  return rows;
})();

const portraitFor = (name: string) => {
  const mp = politicians.find(p => p.name === name);
  return mp?.image ? `https://openparliament.ca${mp.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
};

const SECTIONS = [
  { to: '/feed', icon: Newspaper, title: 'The Feed', text: 'Headlines, video coverage and posts from the parties, leaders and MPs, in one stream.' },
  { to: '/bills', icon: FileText, title: 'Bills', text: 'Every bill before Parliament, where it is in the process, and a plain-language summary.' },
  { to: '/parties', icon: Users, title: 'Parties', text: 'Caucus rosters, the Cabinet and the Shadow Cabinet, with contact details for each member.' },
  { to: '/house', icon: Landmark, title: 'House & Senate', text: 'The seating plan of the Commons and the make-up of the Senate, seat by seat.' },
  { to: '/map', icon: Map, title: 'Find Your MP', text: 'A riding map of the whole country. Click where you live to find who represents you.' },
  { to: '/scandals', icon: AlertTriangle, title: 'Scandals', text: 'Ongoing inquiries, audits and ethics findings, with a timeline for each.' },
  { to: '/committees', icon: Users, title: 'Committees', text: 'The standing committees of the House and who sits on them.' },
  { to: '/history', icon: History, title: 'History', text: 'Every prime minister since Confederation, and the milestones of Canadian democracy.' },
];

const WORK: { status: 'live' | 'progress' | 'paused'; label: string; title: string; text: string }[] = [
  { status: 'live', label: 'Live', title: 'Daily data refresh', text: 'Bills, committees, senators, the MP roster and the seating plan are rebuilt from official sources every morning. News and video coverage refresh every four hours.' },
  { status: 'progress', label: 'In progress', title: 'History section', text: 'The prime ministers timeline is the first piece. General elections, governors general and the Speakers are next.' },
  { status: 'progress', label: 'In progress', title: 'Scandal tracker', text: 'Each story is checked for new developments on a schedule; the aim is a reliable, sourced record rather than a rumour mill.' },
  { status: 'paused', label: 'Paused', title: 'Posts from X', text: 'The X feed is paused while the API account is out of credits. Existing posts remain visible; news and YouTube coverage are unaffected.' },
];

export const Home = () => {
  const pm = leadersData.pm;
  const opp = leadersData.opposition;
  const majority = Math.floor(TOTAL_SEATS / 2) + 1;

  return (
    <div className="page-container glass-panel home">

      <section className="home-hero">
        <div>
          <div className="home-eyebrow">Canada's Parliament, in one place</div>
          <h1>Follow Parliament without the noise.</h1>
          <p className="home-lede">
            ParliaWeb gathers the official record of the House of Commons, who sits in it, what it is
            voting on, and what is being said about it, into one independent, plain-language site.
            No account, no ads, no party line.
          </p>
          <div className="home-actions">
            <NavLink to="/map" className="home-btn primary">Find your MP <ArrowRight size={16} /></NavLink>
            <NavLink to="/feed" className="home-btn secondary">Today's feed</NavLink>
          </div>
        </div>

        <div className="home-standings">
          <div className="home-panel-title">
            <h2>House of Commons</h2>
            <span>{TOTAL_SEATS} seats · 45th Parliament</span>
          </div>
          <div className="seat-bar" role="img" aria-label="Seats by party">
            {standings.map(s => (
              <div key={s.party} style={{ width: `${(s.seats / TOTAL_SEATS) * 100}%`, background: s.color }} title={`${s.party}: ${s.seats}`} />
            ))}
          </div>
          <div className="seat-legend">
            {standings.map(s => (
              <div key={s.party} className="seat-legend-item">
                <i style={{ background: s.color }} />
                {s.party === 'Bloc' ? 'Bloc Québécois' : s.party}
                <b>{s.seats}</b>
              </div>
            ))}
          </div>
          <div className="home-majority">{majority} seats needed for a majority.</div>
        </div>
      </section>

      <section className="home-leaders">
        {([
          { who: pm, to: '/pm' },
          { who: opp, to: '/opposition-leader' },
        ] as const).map(({ who, to }) => (
          <NavLink key={to} to={to} className="leader-card" style={{ '--leader-color': partyColor(who.party) } as React.CSSProperties}>
            <img
              src={portraitFor(who.name)}
              alt={who.name}
              className="politician-photo"
              onError={(e) => ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(who.name)}`)}
            />
            <div style={{ minWidth: 0 }}>
              <div className="leader-card-title">{who.title}</div>
              <div className="leader-card-name">{who.name}</div>
              <div className="leader-card-meta">{who.party} · {who.riding}</div>
            </div>
            <ChevronRight size={20} />
          </NavLink>
        ))}
      </section>

      <section className="home-section">
        <h2>Explore</h2>
        <p>Each section draws on the same official data and keeps to the facts.</p>
        <div className="explore-grid">
          {SECTIONS.map(({ to, icon: Icon, title, text }) => (
            <NavLink key={to} to={to} className="explore-card">
              <div className="explore-icon"><Icon size={19} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>What we're working on</h2>
        <p>ParliaWeb is a work in progress. This is where things stand.</p>
        <ul className="work-list">
          {WORK.map(w => (
            <li key={w.title}>
              <span className={`work-status ${w.status}`}>{w.label}</span>
              <div>
                <strong>{w.title}</strong>
                <span>{w.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="home-sources">
        Sources: House of Commons (members, constituencies, seating plan), openparliament.ca (member profiles),
        LEGISinfo (bills), Senate of Canada (senators), Google News and YouTube (coverage), Wikipedia (historical portraits).
        ParliaWeb is independent and not affiliated with any party or with Parliament.
      </p>
    </div>
  );
};
