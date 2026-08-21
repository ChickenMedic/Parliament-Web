import { useMemo, useState } from 'react';
import tweetsRaw from '../data/tweets.json';
import mpTweetsRaw from '../data/mp_tweets.json';
import feedsRaw from '../data/feeds.json';
import profilesRaw from '../data/x_profiles.json';
import politiciansData from '../data/politicians.json';
import { TweetCard, type TweetData } from '../components/TweetCard';
import './PageStyles.css';

const tweetsData = tweetsRaw as Record<string, TweetData[]>;
const mpTweetsData = mpTweetsRaw as Record<string, TweetData[]>;
const profiles = profilesRaw as Record<string, { name: string; image: string | null }>;

interface FeedMeta {
  name: string;
  kind: 'party' | 'institution' | 'leader' | 'news' | 'commentator';
  party?: string;
  role?: string;
  avatar?: string;
}
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
  news: { label: 'News', color: '#60a5fa' },
  commentator: { label: 'Commentary', color: '#a78bfa' },
  mp: { label: 'MP', color: '#34d399' },
};

interface FeedItem {
  tweet: TweetData;
  handle: string;
  name: string;
  subtitle?: string;
  avatar: string;
  avatarShape: 'circle' | 'portrait';
  kind: string;
  party?: string;
  time: number;
}

// Posts older than this fall off the home feed entirely.
const MAX_AGE_DAYS = 90;

type Tab = 'All' | 'Parties' | 'Leaders' | 'News' | 'Commentary' | 'MPs';
const TAB_KINDS: Record<Exclude<Tab, 'All'>, string[]> = {
  Parties: ['party', 'institution'],
  Leaders: ['leader'],
  News: ['news'],
  Commentary: ['commentator'],
  MPs: ['mp'],
};

export const Feed = () => {
  const [tab, setTab] = useState<Tab>('All');

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
        result.push({
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
      for (const tweet of tweets) {
        const time = new Date(tweet.date).getTime();
        if (isNaN(time) || time < cutoff) continue;
        result.push({
          tweet, handle, time,
          name: mp.name,
          subtitle: `MP for ${mp.current_riding.name.en}`,
          avatar: `https://openparliament.ca${mp.image}`,
          avatarShape: 'portrait',
          kind: 'mp',
          party,
        });
      }
    }

    return result.sort((a, b) => b.time - a.time);
  }, []);

  const visible = useMemo(() => {
    if (tab === 'All') return items;
    const kinds = TAB_KINDS[tab];
    return items.filter(i => kinds.includes(i.kind));
  }, [items, tab]);

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: '16px', flexShrink: 0 }}>
        <h1>The Feed</h1>
        <p>The latest posts from parties, leaders, journalists, commentators, and sitting MPs — refreshed throughout the day. MPs appear only when they've posted in the last three months.</p>

        <div style={{ display: 'flex', gap: '6px', marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content', flexWrap: 'wrap' }}>
          {(['All', 'Parties', 'Leaders', 'News', 'Commentary', 'MPs'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ padding: '8px 16px', background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? 'bold' : 'normal', transition: 'all 0.2s' }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {visible.length > 0 ? (
            visible.slice(0, 300).map(item => {
              const badge = KIND_BADGE[item.kind];
              return (
                <TweetCard
                  key={`${item.handle}-${item.tweet.id}`}
                  tweet={item.tweet}
                  name={item.name}
                  handle={item.handle}
                  subtitle={item.subtitle}
                  avatar={item.avatar}
                  avatarShape={item.avatarShape}
                  badge={badge?.label}
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
