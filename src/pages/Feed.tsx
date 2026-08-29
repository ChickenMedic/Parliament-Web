import { useMemo, useState } from 'react';
import tweetsRaw from '../data/tweets.json';
import mpTweetsRaw from '../data/mp_tweets.json';
import feedsRaw from '../data/feeds.json';
import profilesRaw from '../data/x_profiles.json';
import politiciansData from '../data/politicians.json';
import rolesRaw from '../data/roles.json';
import newsRaw from '../data/news.json';
import videosRaw from '../data/youtube_videos.json';
import { TweetCard, type TweetData } from '../components/TweetCard';
import { LinkCard } from '../components/LinkCard';
import './PageStyles.css';

const tweetsData = tweetsRaw as Record<string, TweetData[]>;
const mpTweetsData = mpTweetsRaw as Record<string, TweetData[]>;
const profiles = profilesRaw as Record<string, { name: string; image: string | null }>;
const roles = rolesRaw as Record<string, string>;
interface NewsItem { title: string; source: string; link: string; date: string }
const newsData = newsRaw as unknown as { federal: NewsItem[]; provincial: Record<string, NewsItem[]> };

// Insertion order (west to east, then territories) drives the chip row.
const PROVINCE_CODES: Record<string, string> = {
  'British Columbia': 'BC', 'Alberta': 'AB', 'Saskatchewan': 'SK', 'Manitoba': 'MB',
  'Ontario': 'ON', 'Quebec': 'QC', 'New Brunswick': 'NB', 'Nova Scotia': 'NS',
  'Prince Edward Island': 'PE', 'Newfoundland and Labrador': 'NL',
  'Yukon': 'YT', 'Northwest Territories': 'NT', 'Nunavut': 'NU',
};

const PROVINCES_STORAGE_KEY = 'newsProvinces';
const loadProvinces = (): string[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(PROVINCES_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(p => p in PROVINCE_CODES) : [];
  } catch {
    return [];
  }
};
const videoItems = videosRaw as { channel: string; handle: string; about: string; videoId: string; title: string; date: string; thumbnail: string | null }[];

interface FeedMeta {
  name: string;
  kind: 'party' | 'institution' | 'leader' | 'news' | 'commentator';
  party?: string;
  role?: string;
  avatar?: string;
  /** General-news outlets mix in sports/culture; only show their political posts. */
  curate?: boolean;
}

const POLITICAL_KEYWORDS = /\b(parliament|ottawa|carney|poilievre|blanchet|avi lewis|elizabeth may|liberal|conservative|ndp|bloc|green party|minister|ministry|federal|senate|senator|mp|mps|bill|legislation|budget|tariff|trade|election|byelection|government|policy|riding|caucus|throne|commons|premier|governor general|cabinet|opposition|deficit|tax|immigration|defence|nato|sovereignty)\b/i;
const feeds = feedsRaw as unknown as Record<string, FeedMeta>;

const getPartyColor = (party?: string) => {
  switch ((party || '').toLowerCase()) {
    case 'liberal': return '#d71920';
    case 'conservative': return '#1a4782';
    case 'ndp': return '#f37021';
    case 'bloc québécois':
    case 'bloc': return '#33b2cc';
    case 'green party':
    case 'green': return '#3d9b35';
    default: return '#808080';
  }
};

const KIND_BADGE: Record<string, { label: string; color: string }> = {
  party: { label: 'Party', color: '#94a3b8' },
  institution: { label: 'Official', color: '#94a3b8' },
  leader: { label: 'Leader', color: '#eab308' },
  minister: { label: 'Cabinet', color: '#f472b6' },
  news: { label: 'News', color: '#60a5fa' },
  headline: { label: 'Federal', color: '#60a5fa' },
  provincial: { label: 'Provincial', color: '#38bdf8' },
  commentator: { label: 'Commentary', color: '#a78bfa' },
  video: { label: 'Video', color: '#f87171' },
  mp: { label: 'MP', color: '#34d399' },
};

interface FeedItem {
  key: string;
  name: string;
  subtitle?: string;
  avatar: string;
  avatarShape: 'circle' | 'portrait';
  kind: string;
  party?: string;
  time: number;
  /** Overrides the kind's default badge text (e.g. Shadow Cabinet). */
  badgeLabel?: string;
  /** X post items. */
  tweet?: TweetData;
  handle?: string;
  /** External items (headlines, videos). */
  link?: { title: string; url: string; date: string; thumbnail?: string | null };
  /** Provincial headlines only: which province, for the chip filter. */
  province?: string;
}

// Posts older than this fall off the home feed entirely.
const MAX_AGE_DAYS = 90;

type Tab = 'All' | 'Parties' | 'Leaders' | 'Front Bench' | 'News' | 'Commentary' | 'Videos' | 'MPs';
const TAB_KINDS: Record<Exclude<Tab, 'All'>, string[]> = {
  Parties: ['party', 'institution'],
  Leaders: ['leader'],
  'Front Bench': ['minister'],
  News: ['news', 'headline', 'provincial'],
  Commentary: ['commentator'],
  Videos: ['video'],
  MPs: ['mp'],
};

export const Feed = () => {
  const [tab, setTab] = useState<Tab>('All');
  const [provinces, setProvinces] = useState<string[]>(loadProvinces);

  const toggleProvince = (province: string) => {
    setProvinces(prev => {
      const next = prev.includes(province) ? prev.filter(p => p !== province) : [...prev, province];
      try { localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };

  const items = useMemo(() => {
    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const politicians = politiciansData.objects as any[];
    const result: FeedItem[] = [];

    for (const [handle, tweets] of Object.entries(tweetsData)) {
      const meta = feeds[handle];
      if (!meta) continue;
      const avatar = meta.avatar
        || profiles[handle]?.image
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name)}&background=random`;
      for (const tweet of tweets) {
        const time = new Date(tweet.date).getTime();
        if (isNaN(time) || time < cutoff) continue;
        if (meta.curate && !POLITICAL_KEYWORDS.test(tweet.content)) continue;
        result.push({
          key: `${handle}-${tweet.id}`,
          tweet, handle, time,
          name: meta.name,
          subtitle: meta.role,
          avatar,
          avatarShape: 'circle',
          kind: meta.kind,
          party: meta.party,
        });
      }
    }

    for (const [handle, tweets] of Object.entries(mpTweetsData)) {
      const mp = politicians.find(p => (p.twitter || '').toLowerCase() === handle.toLowerCase());
      if (!mp) continue;
      const party = mp.current_party.short_name.en;
      // Front-bench MPs (cabinet, secretaries of state, opposition critics)
      // get their own kind so they surface above the backbench.
      const role = roles[mp.name];
      const isShadow = !!role && /shadow|opposition/i.test(role);
      for (const tweet of tweets) {
        const time = new Date(tweet.date).getTime();
        if (isNaN(time) || time < cutoff) continue;
        result.push({
          key: `${handle}-${tweet.id}`,
          tweet, handle, time,
          name: mp.name,
          subtitle: role || `MP for ${mp.current_riding.name.en}`,
          avatar: profiles[handle]?.image || `https://openparliament.ca${mp.image}`,
          avatarShape: 'circle',
          kind: role ? 'minister' : 'mp',
          badgeLabel: isShadow ? 'Shadow Cabinet' : undefined,
          party,
        });
      }
    }

    const pushHeadline = (item: NewsItem, key: string, kind: string, province?: string) => {
      const time = new Date(item.date).getTime();
      if (isNaN(time) || time < cutoff) return;
      result.push({
        key, time, kind, province,
        name: item.source || 'Google News',
        subtitle: province,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.source || 'News')}&background=random`,
        avatarShape: 'circle',
        badgeLabel: province ? PROVINCE_CODES[province] : undefined,
        link: { title: item.title, url: item.link, date: item.date },
      });
    };
    newsData.federal.forEach((item, idx) => pushHeadline(item, `news-${idx}`, 'headline'));
    for (const [province, items] of Object.entries(newsData.provincial)) {
      items.forEach((item, idx) => pushHeadline(item, `${PROVINCE_CODES[province] || province}-${idx}`, 'provincial', province));
    }

    for (const video of videoItems) {
      const time = new Date(video.date).getTime();
      if (isNaN(time) || time < cutoff) continue;
      result.push({
        key: `yt-${video.videoId}`,
        time,
        name: video.channel,
        subtitle: video.about,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channel)}&background=random`,
        avatarShape: 'circle',
        kind: 'video',
        link: {
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          date: video.date,
          thumbnail: video.thumbnail,
        },
      });
    }

    return result.sort((a, b) => b.time - a.time);
  }, []);

  const visible = useMemo(() => {
    // Provincial headlines live in the News tab only, gated by the chip filter.
    const base = tab === 'All'
      ? items.filter(i => i.kind !== 'provincial')
      : items.filter(i => TAB_KINDS[tab].includes(i.kind));
    return base.filter(i => i.kind !== 'provincial' || provinces.includes(i.province!));
  }, [items, tab, provinces]);

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: '16px', flexShrink: 0 }}>
        <h1>The Feed</h1>
        <p>Posts from parties, leaders, the front bench, and sitting MPs — alongside the day's headlines and recent coverage from independent voices across the spectrum, so you can compare how the same story is being told. Pick your provinces under the News tab to follow provincial politics too.</p>

        <div style={{ display: 'flex', gap: '6px', marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content', flexWrap: 'wrap' }}>
          {(['All', 'Parties', 'Leaders', 'Front Bench', 'News', 'Commentary', 'Videos', 'MPs'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ padding: '8px 16px', background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? 'bold' : 'normal', transition: 'all 0.2s' }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'News' && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)' }}>Provincial news:</span>
            {Object.entries(PROVINCE_CODES).map(([province, code]) => {
              const active = provinces.includes(province);
              return (
                <button
                  key={code}
                  onClick={() => toggleProvince(province)}
                  title={province}
                  aria-pressed={active}
                  style={{
                    padding: '4px 10px',
                    background: active ? 'rgba(56,189,248,0.25)' : 'rgba(0,0,0,0.2)',
                    color: active ? '#7dd3fc' : 'rgba(255,255,255,0.6)',
                    border: active ? '1px solid rgba(56,189,248,0.6)' : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: active ? 'bold' : 'normal',
                    transition: 'all 0.15s',
                  }}
                >
                  {active ? '✓ ' : ''}{code}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {visible.length > 0 ? (
            visible.slice(0, 300).map(item => {
              const badge = KIND_BADGE[item.kind];
              const badgeLabel = item.badgeLabel || badge?.label;
              if (item.link) {
                return (
                  <LinkCard
                    key={item.key}
                    title={item.link.title}
                    url={item.link.url}
                    date={item.link.date}
                    name={item.name}
                    subtitle={item.subtitle}
                    avatar={item.avatar}
                    badge={badgeLabel}
                    badgeColor={badge?.color}
                    thumbnail={item.link.thumbnail}
                  />
                );
              }
              return (
                <TweetCard
                  key={item.key}
                  tweet={item.tweet!}
                  name={item.name}
                  handle={item.handle!}
                  subtitle={item.subtitle}
                  avatar={item.avatar}
                  avatarShape={item.avatarShape}
                  badge={badgeLabel}
                  badgeColor={badge?.color}
                  accentColor={item.party ? getPartyColor(item.party) : undefined}
                />
              );
            })
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              <p>No posts yet for this filter.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Feeds refresh automatically; run <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>node fetch-tweets.js --mps</code> to populate locally.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
