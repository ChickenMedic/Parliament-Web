import { relativeDate } from './TweetCard';

interface LinkCardProps {
  title: string;
  url: string;
  /** Source outlet or channel name. */
  name: string;
  subtitle?: string;
  date: string;
  avatar?: string;
  badge?: string;
  badgeColor?: string;
  thumbnail?: string | null;
  accentColor?: string;
}

/** External-content card (news headline or video) matching TweetCard's look. */
export const LinkCard = ({ title, url, name, subtitle, date, avatar, badge, badgeColor, thumbnail, accentColor }: LinkCardProps) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: accentColor ? `3px solid ${accentColor}` : '3px solid transparent', textAlign: 'left', textDecoration: 'none' }}
  >
    <img
      src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
      alt=""
      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`; }}
    />
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <strong style={{ color: 'white', fontSize: '14px' }}>{name}</strong>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12.5px' }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12.5px' }}>{relativeDate(date)}</span>
        {badge && (
          <span style={{ marginLeft: 'auto', background: `${badgeColor || '#808080'}22`, border: `1px solid ${badgeColor || '#808080'}55`, color: badgeColor || 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', marginTop: '1px' }}>{subtitle}</div>}
      <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.45', wordBreak: 'break-word' }}>
        {title}
      </p>
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          style={{ marginTop: '10px', width: '100%', maxWidth: '420px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', display: 'block' }}
        />
      )}
    </div>
  </a>
);
