import { NavLink } from 'react-router-dom';
import '../pages/PageStyles.css';
import leadersData from '../data/leaders.json';
import leaderNews from '../data/leaders_news.json';
import leaderVideosRaw from '../data/leaders_videos.json';
import politiciansData from '../data/politicians.json';
import tweetsRaw from '../data/tweets.json';
import profilesRaw from '../data/x_profiles.json';
import { TweetCard, type TweetData } from '../components/TweetCard';

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

interface LeaderVideo {
  videoId: string;
  title: string;
  date: string;
  thumbnail: string | null;
  channel: string;
}

const tweetsData = tweetsRaw as Record<string, TweetData[]>;
const profiles = profilesRaw as Record<string, { name: string; image: string | null }>;
const leaderVideos = leaderVideosRaw as Record<string, { own: LeaderVideo[]; coverage: LeaderVideo[] }>;

const YT_CHANNELS: Record<string, string> = {
  pm: 'CanadianPM',
  opposition: 'PierrePoilievre',
};

const PARTY_COLORS: Record<string, string> = {
  Liberal: '#d71920',
  Conservative: '#1a4782',
};

const X_HANDLES: Record<string, string> = {
  pm: 'MarkJCarney',
  opposition: 'PierrePoilievre',
};

const fmtNewsDate = (d: string) => {
  const parsed = new Date(d);
  return isNaN(parsed.getTime())
    ? d
    : parsed.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

const sectionHeading: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--text-secondary)',
  fontWeight: 700,
};

/** Shared layout for the PM and Opposition Leader pages so both stay consistent. */
export const LeaderPage = ({ who }: { who: 'pm' | 'opposition' }) => {
  const leader = leadersData[who];
  const news: NewsItem[] = (leaderNews as Record<string, NewsItem[]>)[who] || [];
  const color = PARTY_COLORS[leader.party] || '#808080';
  const handle = X_HANDLES[who];
  const posts = (tweetsData[handle] || []).slice(0, 8);
  const xAvatar = profiles[handle]?.image
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}`;

  const mp = politiciansData.objects.find((p: { name: string }) => p.name === leader.name);
  const image = mp
    ? `https://openparliament.ca${(mp as { image: string }).image}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}`;

  const rosterLabel = who === 'pm' ? 'the Cabinet' : 'the Shadow Cabinet';
  const { own = [], coverage = [] } = leaderVideos[who] || {};
  // Their own uploads lead; broadcaster coverage of them fills out the list.
  const videos = [...own.slice(0, 3), ...coverage.slice(0, 3)];
  const ytHandle = YT_CHANNELS[who];

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* ── Identity ── */}
      <div style={{ display: 'flex', gap: '28px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '28px', flexWrap: 'wrap' }}>
        <img
          src={image}
          alt={`${leader.title} ${leader.name}`}
          className="politician-photo"
          style={{ width: '108px', borderRadius: '14px', border: `3px solid ${color}`, boxShadow: `0 8px 24px ${color}55` }}
          onError={(e) => ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}`)}
        />
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ fontSize: '13px', color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {leader.title}
          </div>
          <h1 style={{ margin: '6px 0 4px 0', fontSize: '38px', color: 'white', lineHeight: 1.1 }}>{leader.name}</h1>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            {leader.honorific} • MP for {leader.riding} • {leader.party} leader since {leader.leaderSince}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.55, margin: '12px 0 0 0', maxWidth: '760px' }}>
            {leader.bio}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', marginTop: '28px', flexWrap: 'wrap' }}>

        {/* ── Recent posts ── */}
        <div style={{ flex: 1.15, minWidth: '340px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
            <h2 style={sectionHeading}>Latest Posts</h2>
            <a href={`https://x.com/${handle}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12.5px', color: '#1d9bf0', textDecoration: 'none', fontWeight: 'bold' }}>
              @{handle} on X ↗
            </a>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {posts.length > 0 ? (
              posts.map(t => (
                <TweetCard
                  key={t.id}
                  tweet={t}
                  name={leader.name}
                  handle={handle}
                  avatar={xAvatar}
                />
              ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                No recent posts fetched yet — feeds refresh several times a day.
              </div>
            )}
          </div>
        </div>

        {/* ── Polling + news ── */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={sectionHeading}>Public Opinion</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {(leader.ratings as Rating[]).map(r => (
                <div key={r.pollster} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: r.tone === 'positive' ? '#10b981' : '#f59e0b', lineHeight: 1 }}>{r.value}</div>
                  <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.8)', marginTop: '8px', lineHeight: 1.35 }}>{r.metric}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{r.pollster}</a> • {r.date}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              Most recent published wave per pollster; metrics differ between firms and are not directly comparable.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={sectionHeading}>In the News</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {news.slice(0, 6).map((n, i) => (
                <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{n.source || 'News'}</span> • {fmtNewsDate(n.date)}
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'white', fontWeight: 600, lineHeight: 1.4 }}>{n.title}</div>
                </a>
              ))}
              {news.length === 0 && (
                <div style={{ padding: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  No headlines available yet.
                </div>
              )}
            </div>
          </div>

          {videos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                <h2 style={sectionHeading}>Recent Videos</h2>
                <a href={`https://www.youtube.com/@${ytHandle}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12.5px', color: '#f87171', textDecoration: 'none', fontWeight: 'bold' }}>
                  YouTube channel ↗
                </a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {videos.map(v => (
                  <a key={v.videoId} href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: '12px', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', alignItems: 'center' }}>
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt="" loading="lazy" style={{ width: '104px', borderRadius: '6px', flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '3px' }}>
                        <span style={{ color: '#f87171', fontWeight: 'bold' }}>{v.channel}</span> • {fmtNewsDate(v.date)}
                      </div>
                      <div style={{ fontSize: '13px', color: 'white', fontWeight: 600, lineHeight: 1.4 }}>{v.title}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <NavLink to="/parties" style={{ alignSelf: 'flex-start', padding: '10px 20px', background: color, color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px' }}>
            View {rosterLabel} roster &rarr;
          </NavLink>
        </div>
      </div>
    </div>
  );
};
