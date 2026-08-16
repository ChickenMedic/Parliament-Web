import './PageStyles.css';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import billsData from '../data/bills.json';
import billSummariesData from '../data/bill_summaries.json';

interface BillSummary {
  overview: string;
  deepDive: { heading: string; body: string }[];
  hadFullText: boolean;
  generated: string;
}

const BILL_SUMMARIES = billSummariesData as unknown as Record<string, BillSummary>;

interface BillStage {
  key: string;
  label: string;
  date: string | null;
}

interface PartyPosition {
  vote: string;
  disagreement: number;
}

interface BillVote {
  number: number;
  date: string;
  description: string;
  result: string;
  yea: number;
  nay: number;
}

interface MediaItem {
  title: string;
  source: string;
  link: string;
  date: string;
}

interface Bill {
  id: string;
  title: string;
  longTitle: string;
  status: string;
  receivedRoyalAssent: boolean;
  type: string;
  originatingChamber: string;
  category: string;
  sponsor: string | null;
  sponsorParty: string | null;
  latestActivity: string | null;
  latestActivityDate: string | null;
  stages: BillStage[];
  partyPositions: {
    parties: Record<string, PartyPosition>;
    basedOn: string;
    voteDate: string;
    voteResult: string;
    voteUrl: string;
  } | null;
  votes: BillVote[];
  media: MediaItem[];
  link: string;
  text_link: string | null;
}

const BILLS_DATA = billsData as unknown as Bill[];

const PARTY_META: Record<string, { color: string; label: string }> = {
  Liberal: { color: 'var(--party-liberal)', label: 'Liberal Party' },
  Conservative: { color: 'var(--party-conservative)', label: 'Conservative Party' },
  NDP: { color: 'var(--party-ndp)', label: 'New Democratic Party' },
  Bloc: { color: 'var(--party-bloc)', label: 'Bloc Québécois' },
  Green: { color: '#3d9b35', label: 'Green Party' },
};

const sponsorColor = (party: string | null) =>
  (party && PARTY_META[party]?.color) || 'rgba(255,255,255,0.5)';

type StatusFilter = 'All' | 'Active' | 'Passed' | 'Defeated';

const statusBucket = (b: Bill): Exclude<StatusFilter, 'All'> => {
  if (b.receivedRoyalAssent) return 'Passed';
  if (/defeated|not proceeded/i.test(b.status)) return 'Defeated';
  return 'Active';
};

const bucketStyle: Record<string, { bg: string; fg: string }> = {
  Passed: { bg: 'rgba(16, 185, 129, 0.15)', fg: '#10b981' },
  Defeated: { bg: 'rgba(239, 68, 68, 0.15)', fg: '#ef4444' },
  Active: { bg: 'rgba(245, 158, 11, 0.15)', fg: '#f59e0b' },
};

const voteBadge = (vote: string) =>
  vote === 'Yes'
    ? { text: 'VOTED YEA', bg: 'rgba(16,185,129,0.15)', fg: '#10b981' }
    : vote === 'No'
      ? { text: 'VOTED NAY', bg: 'rgba(239,68,68,0.15)', fg: '#ef4444' }
      : { text: vote.toUpperCase(), bg: 'rgba(255,255,255,0.1)', fg: 'rgba(255,255,255,0.7)' };

const fmtDate = (d: string | null) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

/** Horizontal stepper showing how far along the legislative process a bill is. */
const StageTracker = ({ bill, compact }: { bill: Bill; compact?: boolean }) => {
  const bucket = statusBucket(bill);
  // A stage is "reached" if it has a date; the current stage is inferred from status text.
  const lastDone = bill.stages.reduce((acc, s, i) => (s.date ? i : acc), -1);
  return (
    <div style={{ display: 'flex', alignItems: compact ? 'center' : 'flex-start', gap: '2px', width: '100%' }}>
      {bill.stages.map((s, i) => {
        const done = s.date !== null;
        const isCurrent = !done && i === lastDone + 1 && bucket === 'Active';
        const color = done ? '#10b981' : isCurrent ? '#f59e0b' : bucket === 'Defeated' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.15)';
        return (
          <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 1, height: '2px', background: i === 0 ? 'transparent' : color }} />
              <div
                title={`${s.label}${s.date ? ` — ${fmtDate(s.date)}` : ''}`}
                style={{
                  width: compact ? '10px' : '14px',
                  height: compact ? '10px' : '14px',
                  borderRadius: '50%',
                  background: done ? '#10b981' : isCurrent ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                  border: isCurrent ? '2px solid #f59e0b' : '2px solid transparent',
                  boxSizing: 'border-box',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, height: '2px', background: i === bill.stages.length - 1 ? 'transparent' : (bill.stages[i + 1].date ? '#10b981' : 'rgba(255,255,255,0.12)') }} />
            </div>
            {!compact && (
              <div style={{ fontSize: '10px', textAlign: 'center', color: done || isCurrent ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)', lineHeight: 1.25 }}>
                {s.label}
                {s.date && <div style={{ color: 'rgba(255,255,255,0.45)' }}>{fmtDate(s.date)}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const Bills = () => {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Government' | 'Private / Senate'>('Government');
  const [showDeepDive, setShowDeepDive] = useState(false);

  const filteredBills = useMemo(() => {
    const q = search.toLowerCase();
    return BILLS_DATA.filter(bill => {
      const matchSearch =
        bill.id.toLowerCase().includes(q) ||
        bill.title.toLowerCase().includes(q) ||
        bill.longTitle.toLowerCase().includes(q) ||
        (bill.sponsor || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || statusBucket(bill) === statusFilter;
      const matchType =
        typeFilter === 'All' ||
        (typeFilter === 'Government' ? bill.type === 'Government Bill' : bill.type !== 'Government Bill');
      return matchSearch && matchStatus && matchType;
    });
  }, [search, statusFilter, typeFilter]);

  if (selectedBill) {
    const bucket = statusBucket(selectedBill);
    const style = bucketStyle[bucket];
    const positions = selectedBill.partyPositions;

    return (
      <div className="page-container glass-panel" style={{ overflowY: 'auto' }}>
        <button
          onClick={() => setSelectedBill(null)}
          style={{ background: 'transparent', color: 'var(--accent-color)', border: 'none', cursor: 'pointer', marginBottom: '24px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          &larr; Back to all Bills
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <div style={{ minWidth: '280px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ background: style.bg, color: style.fg, fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                {selectedBill.status}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {selectedBill.type} • {selectedBill.category}
              </span>
            </div>
            <h1 style={{ fontSize: '28px', margin: '8px 0 0 0', color: 'white' }}>{selectedBill.id}: {selectedBill.title}</h1>
            {selectedBill.title !== selectedBill.longTitle && (
              <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.5 }}>{selectedBill.longTitle}</p>
            )}
            {selectedBill.sponsor && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Sponsor: <strong style={{ color: sponsorColor(selectedBill.sponsorParty) }}>{selectedBill.sponsor}</strong>
                {selectedBill.sponsorParty && selectedBill.sponsorParty !== 'Senator' && ` (${selectedBill.sponsorParty})`}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedBill.text_link ? (
              <a href={selectedBill.text_link} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)' }}>
                View Full Text
              </a>
            ) : (
              <span
                title="The text of this bill has not been published by Parliament yet."
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.08)', cursor: 'not-allowed' }}
              >
                Text Not Yet Published
              </span>
            )}
            <a href={selectedBill.link} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: 'var(--accent-color)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
              LEGISinfo Page
            </a>
          </div>
        </div>

        {/* Plain-language summary */}
        {BILL_SUMMARIES[selectedBill.id] && (
          <div style={{ background: 'rgba(96,165,250,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.15)', marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '15px' }}>What This Bill Does</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>
              {BILL_SUMMARIES[selectedBill.id].overview}
            </p>
            {BILL_SUMMARIES[selectedBill.id].deepDive.length > 0 && (
              <>
                <button
                  onClick={() => setShowDeepDive(!showDeepDive)}
                  style={{ marginTop: '14px', background: 'transparent', border: '1px solid rgba(96,165,250,0.4)', color: '#60a5fa', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 'bold' }}
                >
                  {showDeepDive ? 'Hide Executive Summary ▲' : 'Read the Executive Summary ▼'}
                </button>
                {showDeepDive && (
                  <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {BILL_SUMMARIES[selectedBill.id].deepDive.map((section, i) => (
                      <div key={i}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{section.heading}</h4>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{section.body}</p>
                      </div>
                    ))}
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      AI-generated plain-language summary based on the {BILL_SUMMARIES[selectedBill.id].hadFullText ? 'published bill text' : 'bill title (full text not yet published)'} — verify against the official text.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Progress through Parliament */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '15px' }}>Progress through Parliament</h3>
          {selectedBill.latestActivity && (
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
              Latest activity: {selectedBill.latestActivity}
            </p>
          )}
          <StageTracker bill={selectedBill} />
        </div>

        <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexWrap: 'wrap' }}>
          {/* Left: party positions from recorded votes */}
          <div style={{ flex: 1.2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Party Positions</h3>
            {positions ? (
              <>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  From the recorded division on {fmtDate(positions.voteDate)}: “{positions.basedOn}” ({positions.voteResult}).{' '}
                  <a href={positions.voteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)' }}>Full vote breakdown ↗</a>
                </p>
                {Object.entries(positions.parties).map(([party, pos]) => {
                  const meta = PARTY_META[party] || { color: '#808080', label: party };
                  const badge = voteBadge(pos.vote);
                  return (
                    <div key={party} style={{ background: 'rgba(255,255,255,0.04)', padding: '14px 16px', borderRadius: '8px', borderLeft: `4px solid ${meta.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <strong style={{ color: meta.color, display: 'block', fontSize: '13px', textTransform: 'uppercase' }}>{meta.label}</strong>
                        {pos.disagreement > 0 && (
                          <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)' }}>
                            {Math.round(pos.disagreement * 100)}% of caucus broke ranks
                          </span>
                        )}
                      </div>
                      <span style={{ background: badge.bg, color: badge.fg, fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                        {badge.text}
                      </span>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                No recorded division on this bill yet, so official party positions aren’t available.
                Positions appear here automatically once the House holds a standing vote.
              </div>
            )}

            {selectedBill.votes.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Recorded Votes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedBill.votes.slice().reverse().map(v => (
                    <div key={v.number} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px' }}>
                      <div style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '4px', lineHeight: 1.4 }}>{v.description}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {fmtDate(v.date)} • <span style={{ color: v.result === 'Passed' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{v.result}</span> — {v.yea} yea / {v.nay} nay
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: media coverage */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Media Coverage</h3>
            {selectedBill.media.length > 0 ? (
              selectedBill.media.map((m, i) => (
                <a key={i} href={m.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: '4px' }}>
                    {m.source || 'News'}
                    {m.date && <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'normal' }}> • {new Date(m.date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>}
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'white', lineHeight: 1.45 }}>{m.title}</div>
                </a>
              ))
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '13.5px', color: 'rgba(255,255,255,0.6)' }}>
                No recent coverage found for this bill.
              </div>
            )}
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              Headlines aggregated from Canadian outlets via Google News. Search more:{' '}
              <a href={`https://www.cbc.ca/search?q=${encodeURIComponent('Bill ' + selectedBill.id)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.55)' }}>CBC</a>,{' '}
              <a href={`https://www.ctvnews.ca/search?q=${encodeURIComponent('Bill ' + selectedBill.id)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.55)' }}>CTV</a>,{' '}
              <a href={`https://globalnews.ca/?s=${encodeURIComponent('Bill ' + selectedBill.id)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.55)' }}>Global News</a>,{' '}
              <a href={`https://www.theglobeandmail.com/search/?q=${encodeURIComponent('Bill ' + selectedBill.id)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.55)' }}>Globe &amp; Mail</a>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1>Legislative Bills Tracker</h1>
        <p>The current docket of the 45th Parliament: where each bill sits in the legislative process, how the parties voted, and what the press is saying. Data from LEGISinfo and openparliament.ca.</p>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search bills by number, title, or sponsor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['All', 'Active', 'Passed', 'Defeated'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{ padding: '8px 14px', background: statusFilter === status ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: statusFilter === status ? 'bold' : 'normal', transition: 'all 0.2s' }}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['Government', 'Private / Senate', 'All'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{ padding: '8px 14px', background: typeFilter === t ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: typeFilter === t ? 'bold' : 'normal', transition: 'all 0.2s' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredBills.map(bill => {
            const bucket = statusBucket(bill);
            const style = bucketStyle[bucket];
            return (
              <div key={bill.id} className="bill-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>{bill.id}</span>
                    <span style={{ background: style.bg, color: style.fg, fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', textAlign: 'right' }}>
                      {bill.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '17px', margin: '0 0 8px 0', color: 'white', lineHeight: '1.3' }}>{bill.title}</h3>
                  {bill.sponsor && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
                      {bill.type} • <span style={{ color: sponsorColor(bill.sponsorParty) }}>{bill.sponsor}</span>
                    </div>
                  )}
                  <div style={{ margin: '14px 0 4px 0' }}>
                    <StageTracker bill={bill} compact />
                  </div>
                  {bill.latestActivity && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.45', margin: '10px 0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {bill.latestActivity}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {bill.partyPositions && (
                      <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>PARTY VOTES</span>
                    )}
                    {bill.media.length > 0 && (
                      <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>MEDIA ({bill.media.length})</span>
                    )}
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>{bill.category.toUpperCase()}</span>
                  </div>
                </div>
                <button className="vote-btn" onClick={() => { setSelectedBill(bill); setShowDeepDive(false); }} style={{ width: '100%', marginTop: '16px', padding: '10px', background: 'var(--accent-color)' }}>
                  View Progress, Votes &amp; Coverage
                </button>
              </div>
            );
          })}
        </div>
        {filteredBills.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No bills found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
