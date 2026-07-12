import { NavLink } from 'react-router-dom';
import '../pages/PageStyles.css';
import leadersData from '../data/leaders.json';
import leaderNews from '../data/leaders_news.json';
import politiciansData from '../data/politicians.json';

interface Rating {
  pollster: string;
  value: string;
  metric: string;
  detail: string;
  date: string;
  url: string;
  tone: string;
}

interface NewsItem {
  title: string;
  source: string;
  link: string;
  date: string;
}

const PARTY_COLORS: Record<string, string> = {
  Liberal: '#d71920',
  Conservative: '#1a4782',
};

const fmtNewsDate = (d: string) => {
  const parsed = new Date(d);
  return isNaN(parsed.getTime())
    ? d
    : parsed.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

/** Shared layout for the PM and Opposition Leader pages so both stay consistent. */
export const LeaderPage = ({ who }: { who: 'pm' | 'opposition' }) => {
  const leader = leadersData[who];
  const news: NewsItem[] = (leaderNews as Record<string, NewsItem[]>)[who] || [];
  const color = PARTY_COLORS[leader.party] || '#808080';

  const mp = politiciansData.objects.find((p: { name: string }) => p.name === leader.name);
  const image = mp
    ? `https://openparliament.ca${(mp as { image: string }).image}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}`;

  const rosterLabel = who === 'pm' ? 'The Cabinet' : 'The Shadow Cabinet';
  const rosterBlurb =
    who === 'pm'
      ? 'The Cabinet is the committee of ministers that holds executive power. Chaired by the Prime Minister, it is responsible for the administration of government and the establishment of policy.'
      : 'The Shadow Cabinet is formed by the Official Opposition. Its members act as critics for Cabinet portfolios, holding government ministers accountable for their departments.';

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {/* Profile */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <img
            src={image}
            alt={`${leader.title} ${leader.name}`}
            style={{ width: '120px', height: '160px', borderRadius: '12px', objectFit: 'cover', objectPosition: 'center top', border: `4px solid ${color}`, marginBottom: '16px', boxShadow: `0 8px 24px ${color}66` }}
            onError={(e) => ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}`)}
          />
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: 'white' }}>{leader.honorific} {leader.name}</h1>
          <div style={{ fontSize: '15px', color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            {leader.title}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            MP for {leader.riding} • {leader.party} leader since {leader.leaderSince}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            {leader.bio}
          </p>
        </div>

        {/* Polling */}
        <div style={{ flex: '1.5', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white' }}>📊 Public Opinion</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {(leader.ratings as Rating[]).map(r => (
              <div key={r.pollster} style={{ flex: 1, minWidth: '180px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{r.pollster}</span>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-color)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Source ↗</a>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: r.tone === 'positive' ? '#10b981' : '#f59e0b' }}>{r.value}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{r.metric}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{r.detail}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{r.date}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '11.5px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            Figures are from each pollster’s most recent published wave; metrics differ between firms
            (approval, impressions, preferred PM) and are not directly comparable.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* News */}
        <div style={{ flex: '1.5', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white' }}>📰 In the News</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {news.map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                  {fmtNewsDate(n.date)} • <span style={{ color: 'var(--accent-color)' }}>{n.source || 'News'}</span>
                </div>
                <div style={{ fontSize: '15px', color: 'white', fontWeight: 'bold', lineHeight: 1.4 }}>{n.title}</div>
              </a>
            ))}
            {news.length === 0 && (
              <div style={{ padding: '18px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                No headlines available — run <code>python fetch_leader_news.py</code> to refresh.
              </div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '11.5px', color: 'rgba(255,255,255,0.35)' }}>
            Headlines aggregated from Canadian and international outlets via Google News.
          </p>
        </div>

        {/* Roster link */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'white' }}>{who === 'pm' ? '🏛' : '👥'} {rosterLabel}</h2>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
              {rosterBlurb}
            </p>
            <NavLink to="/parties" style={{ display: 'inline-block', padding: '10px 20px', background: color, color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
              View {rosterLabel} Roster &rarr;
            </NavLink>
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '14px' }}>Key {who === 'pm' ? 'Ministries' : 'Critic Portfolios'}:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.8' }}>
                {(who === 'pm'
                  ? ['Finance', 'Foreign Affairs', 'National Defence', 'Health', 'Environment and Climate Change']
                  : ['Shadow Minister for Finance', 'Shadow Minister for Foreign Affairs', 'Shadow Minister for National Defence', 'Shadow Minister for Health', 'Shadow Minister for Environment and Climate Change']
                ).map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
