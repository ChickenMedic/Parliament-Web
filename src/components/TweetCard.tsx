export interface TweetData {
  id: string;
  content: string;
  date: string;
  metrics?: {
    reply_count: number;
    retweet_count: number;
    like_count: number;
    impression_count: number;
  };
}

// The X API HTML-escapes tweet text (&amp;, &lt;, &gt;).
const decodeEntities = (text: string) =>
  text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** Turns bare URLs, @mentions, and #hashtags into links. */
export const linkifyTweet = (content: string) =>
  decodeEntities(content).split(/\s+/).map((word: string, wIdx: number) => {
    if (word.startsWith('http')) {
      return <a key={wIdx} href={word} target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', fontWeight: 'bold', textDecoration: 'none' }}>{word} </a>;
    }
    if (word.startsWith('@')) {
      const cleanWord = word.replace(/[^a-zA-Z0-9_@]/g, '');
      return <span key={wIdx}><a href={`https://x.com/${cleanWord.substring(1)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', fontWeight: 'bold', textDecoration: 'none' }}>{cleanWord}</a>{word.substring(cleanWord.length)} </span>;
    }
    if (word.startsWith('#')) {
      const cleanWord = word.replace(/[^a-zA-Z0-9_#]/g, '');
      return <span key={wIdx}><a href={`https://x.com/hashtag/${cleanWord.substring(1)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', fontWeight: 'bold', textDecoration: 'none' }}>{cleanWord}</a>{word.substring(cleanWord.length)} </span>;
    }
    return word + ' ';
  });

const relativeDate = (d: string) => {
  const then = new Date(d);
  const diffMs = Date.now() - then.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 1) return `${Math.max(1, Math.round(diffMs / 60000))}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const sameYear = then.getFullYear() === new Date().getFullYear();
  return then.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' });
};

interface TweetCardProps {
  tweet: TweetData;
  name: string;
  handle: string;
  avatar: string;
  /** 'portrait' uses the standard politician headshot crop; 'circle' suits X/logo avatars. */
  avatarShape?: 'circle' | 'portrait';
  badge?: string;
  badgeColor?: string;
  subtitle?: string;
  accentColor?: string;
}

export const TweetCard = ({ tweet, name, handle, avatar, avatarShape = 'circle', badge, badgeColor, subtitle, accentColor }: TweetCardProps) => (
  <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: accentColor ? `3px solid ${accentColor}` : '3px solid transparent', display: 'flex', gap: '12px', textAlign: 'left' }}>
    {avatarShape === 'portrait' ? (
      <img
        src={avatar}
        alt=""
        className="politician-photo"
        style={{ width: '40px' }}
        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`; }}
      />
    ) : (
      <img
        src={avatar}
        alt=""
        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`; }}
      />
    )}
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <strong style={{ color: 'white', fontSize: '14px' }}>{name}</strong>
        <a href={`https://x.com/${handle}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', textDecoration: 'none' }}>@{handle}</a>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12.5px' }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12.5px' }}>{relativeDate(tweet.date)}</span>
        {badge && (
          <span style={{ marginLeft: 'auto', background: `${badgeColor || '#808080'}22`, border: `1px solid ${badgeColor || '#808080'}55`, color: badgeColor || 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', marginTop: '1px' }}>{subtitle}</div>}

      <p style={{ margin: '6px 0 10px 0', fontSize: '14px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.45', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
        {linkifyTweet(tweet.content)}
      </p>

      {tweet.metrics && (
        <div style={{ display: 'flex', gap: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
          <span>💬 {tweet.metrics.reply_count}</span>
          <span>🔁 {tweet.metrics.retweet_count}</span>
          <span>❤️ {tweet.metrics.like_count}</span>
          <span>📊 {tweet.metrics.impression_count}</span>
        </div>
      )}
    </div>
  </div>
);
