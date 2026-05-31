import './PageStyles.css';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface BillComment {
  id: string;
  author: string;
  date: string;
  content: string;
}

interface Bill {
  id: string;
  title: string;
  desc: string;
  status: 'In Progress' | 'Passed' | 'Passed (Royal Assent)';
  category: 'Environment' | 'Social' | 'Finance' | 'Labor' | 'Safety';
  lib: string;
  con: string;
  ndp: string;
  bloc: string;
  aiBreakdown: string;
  comments?: BillComment[];
}

const BILLS_DATA: Bill[] = [
  {
    id: 'C-11',
    title: 'Online Streaming Act',
    desc: 'Amends the Broadcasting Act to bring global online streaming platforms (like Netflix, YouTube, Spotify) under the regulatory oversight of the CRTC, requiring them to contribute to Canadian cultural content.',
    status: 'Passed (Royal Assent)',
    category: 'Social',
    lib: 'Strongly Support: Levels the playing field for domestic broadcasters, funds Canadian artists, and protects local culture.',
    con: 'Strongly Oppose: Heavy-handed internet regulation that risks censorship, hurts user-generated creators, and limits consumer choice.',
    ndp: 'Support with Amendments: Backed the bill after securing changes to protect small, independent digital creators from CRTC red tape.',
    bloc: 'Strongly Support: Essential to protect French-language programming and cultural sovereignty in Quebec against global tech giants.',
    aiBreakdown: 'Bill C-11 modernizes Canada\'s broadcasting regime by extending CRTC oversight to commercial streaming platforms. Key consequences include mandatory funding contributions for Canadian programming and content discoverability algorithms. Critics focus on potential overreach on user-generated content, while proponents emphasize cultural preservation.'
  },
  {
    id: 'C-21',
    title: 'Firearms Act Amendment',
    desc: 'Introduces a national freeze on handguns, targets gun smuggling at the border, creates a "red flag" law to remove firearms from domestic abuse situations, and bans certain semi-automatic firearms.',
    status: 'Passed (Royal Assent)',
    category: 'Safety',
    lib: 'Strongly Support: Urgent and necessary action to address gun violence in urban centers and keep military-style firearms off streets.',
    con: 'Strongly Oppose: Penalizes law-abiding sports shooters and hunters while failing to address gang smuggling across the US border.',
    ndp: 'Support with Caution: Voted in favor after obtaining amendments protecting Indigenous hunting rights and traditional practices.',
    bloc: 'Support: Backs tighter gun controls, but criticized federal communication gaps during the classification amendment process.',
    aiBreakdown: 'Bill C-21 imposes a freeze on the import, sale, and transfer of handguns alongside expanding wiretapping and border controls to stop illegal smuggling. Major debates revolve around whether the definition of restricted firearms unfairly includes common hunting rifles used by rural and Indigenous communities.'
  },
  {
    id: 'C-58',
    title: 'Anti-Scab Workers Act',
    desc: 'Prohibits federally regulated employers (such as telecommunications, air transport, and banking) from hiring replacement workers (scabs) during strikes or lockouts.',
    status: 'In Progress',
    category: 'Labor',
    lib: 'Support: Protects the integrity of collective bargaining and fosters constructive relations between employers and unionized workers.',
    con: 'Oppose with Caution: Warns it could extend strike durations, lead to service disruptions for critical infrastructure, and increase inflation.',
    ndp: 'Strongly Support: A historic victory for labor rights and a key pillar of the NDP\'s legislative demands to support working families.',
    bloc: 'Strongly Support: Aligns federal law with similar anti-scab legislation that has successfully governed Quebec labor relations for decades.',
    aiBreakdown: 'Bill C-58 bans replacement workers in federal sectors during disputes, carrying heavy fines for violations. Expected impact is a shift in negotiation leverage toward unions, though business groups argue it may disrupt services like rail transport and supply chains.'
  },
  {
    id: 'C-63',
    title: 'Online Harms Act',
    desc: 'Creates a Digital Safety Commission to regulate social media platforms, forcing them to minimize exposure to hate speech, cyberbullying, child exploitation, and non-consensual sharing of intimate images.',
    status: 'In Progress',
    category: 'Safety',
    lib: 'Strongly Support: Vital legislation to protect children from online predators, tackle digital hate, and hold big tech companies accountable.',
    con: 'Strongly Oppose: Threatens free expression, introduces draconian speech penalties, and creates a massive, unaccountable bureaucracy.',
    ndp: 'Support in Principle: Agrees with safeguarding kids, but raising flags over privacy rights and potential overreach of digital takedown mandates.',
    bloc: 'Support with Amendments: Agrees with target areas, but insists that the bill must respect Quebec\'s jurisdictional control over education and civil law.',
    aiBreakdown: 'Bill C-63 establishes a regulatory framework for social media platforms with strict safety duties. The controversy centers on amendments to the Criminal Code that introduce steep life-imprisonment penalties for advocating genocide and pre-emptive peace bonds for hate speech concerns.'
  },
  {
    id: 'C-69',
    title: 'Budget Implementation Act 2024',
    desc: 'Enacts the federal budget measures, including an increase to the capital gains tax inclusion rate, major funding allocations for affordable housing, and national school food programs.',
    status: 'Passed',
    category: 'Finance',
    lib: 'Support: Raises revenue from the wealthiest individuals to invest in housing, healthcare, and cost-of-living relief for Gen Z and Millennials.',
    con: 'Strongly Oppose: Inflationary spending that drives interest rates higher, paired with a job-killing tax hike that stifles business investment.',
    ndp: 'Support: Voted to pass in exchange for the inclusion of dental care expansions, school food funding, and tenant protection measures.',
    bloc: 'Oppose: Rejects the bill due to federal interference in provincial jurisdictions (e.g., direct housing funding to Quebec municipalities).',
    aiBreakdown: 'Bill C-69 implements Budget 2024. Most controversially, it raises the capital gains tax inclusion rate from 50% to 66% for individuals on gains over $250k. It also launches the Canadian Renters\' Bill of Rights and a federal school food program.'
  },
  {
    id: 'C-50',
    title: 'Canadian Sustainable Jobs Act',
    desc: 'Establishes an advisory body and administrative framework to help energy sector workers transition to clean energy, net-zero emissions, and sustainable employment.',
    status: 'Passed (Royal Assent)',
    category: 'Environment',
    lib: 'Support: Ensures workers are not left behind in the global clean energy transition, opening up thousands of high-paying jobs.',
    con: 'Strongly Oppose: A central-planning framework designed to phase out Canada\'s world-class oil and gas sector, putting thousands out of work.',
    ndp: 'Support with Amendments: Successfully secured strong requirements for trade union representation on the advisory council and labor standards.',
    bloc: 'Support in Principle: Backs the shift to clean energy but demands that Quebec retain full sovereignty over training funds and economic planning.',
    aiBreakdown: 'Bill C-50 creates a Sustainable Jobs Partnership Council and requires a 5-year action plan for worker retraining. It aims to buffer workers in oil-producing regions (AB, SK) as global markets shift, though critics call it a disguised "Just Transition" targeting resources.'
  },
  {
    id: 'C-35',
    title: 'Early Learning and Child Care Act',
    desc: 'Formally enshrines the federal commitment to long-term funding for the national $10-a-day child care system, aiming to guarantee access and fair wages.',
    status: 'Passed (Royal Assent)',
    category: 'Social',
    lib: 'Strongly Support: Enshrines a transformative program that saves families thousands of dollars annually and boosts women\'s workforce participation.',
    con: 'Support with Caveats: Voted in favor but criticized the lack of support for private daycares and home-based operators, warning of long waiting lists.',
    ndp: 'Strongly Support: A major progressive milestone that guarantees child care worker wage grids and ensures child care is treated as a public good.',
    bloc: 'Support: Voted in favor as the bill includes full financial compensation for Quebec, respecting its pre-existing, successful child care system.',
    aiBreakdown: 'Bill C-35 legislates the long-term federal funding structure for the $10-a-day childcare agreements signed with all provinces. It prioritizes funding for public and non-profit childcare centers, which opponents argue limits parents\' flexibility.'
  },
  {
    id: 'C-233',
    title: 'Keira\'s Law (Domestic Violence Training)',
    desc: 'Requires judges to undergo training on domestic violence, coercive control, and sexual assault law before presiding over family court custody cases.',
    status: 'Passed (Royal Assent)',
    category: 'Safety',
    lib: 'Strongly Support: Vital modernization of judicial training to protect children and prevent family court system failures.',
    con: 'Strongly Support: Co-sponsored and championed as a common-sense measure to safeguard vulnerable children from abusers.',
    ndp: 'Strongly Support: Critical protection that listens to survivors and addresses systemic bias against victims in the family law system.',
    bloc: 'Strongly Support: Bipartisan consensus to protect children and prevent custody tragedies, respecting provincial court operations.',
    aiBreakdown: 'Bill C-233 amends the Judges Act to ensure judicial education includes courses on the dynamics of domestic violence and coercive control. The bill was named in memory of Keira Kagan, who died during a court-ordered visitation with her father.'
  }
];

export const Bills = () => {
  const [aiEngine, setAiEngine] = useState('Gemini Advanced');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'Passed' | 'Passed (Royal Assent)'>('All');

  // Pre-populated comment database for debate
  const [billComments, setBillComments] = useState<Record<string, BillComment[]>>({
    'C-11': [
      { id: 'c11-1', author: 'Frustrated Creator', date: 'May 28, 2026', content: 'As an independent YouTuber, CRTC regulation terrifies me. The discoverability algorithm rules are going to bury independent content creators in favor of traditional media networks.' },
      { id: 'c11-2', author: 'Union Artiste', date: 'May 29, 2026', content: 'Our artists have been starved of funding for years because tech giants pay zero taxes while profiting off our content. C-11 is a crucial lifeline!' }
    ],
    'C-21': [
      { id: 'c21-1', author: 'Skeptic Urbanite', date: 'May 29, 2026', content: 'Handgun freezes do not solve the illegal gun trade. If you do not lock down the borders, the street supply stays the same.' },
      { id: 'c21-2', author: 'Safety First', date: 'May 30, 2026', content: 'Coercive control and domestic abuse situations are highly lethal when firearms are in the house. Keiras Law and C-21 are critical safeguards.' }
    ],
    'C-58': [
      { id: 'c58-1', author: 'Labour Union Rep', date: 'May 30, 2026', content: 'For decades, employers have prolonged strikes by hiring replacement workers. This bill levels the field.' },
      { id: 'c58-2', author: 'Transit User', date: 'May 31, 2026', content: 'Anti-scab laws sound good until a strike halts the rail system for weeks, shutting down passenger service and ruining food supply chains.' }
    ],
    'C-63': [
      { id: 'c63-1', author: 'FreeSpeechCan', date: 'May 28, 2026', content: 'The online harms bill goes way too far. Lifetime imprisonment options for speech acts is insane and opens the door to political censorship.' },
      { id: 'c63-2', author: 'Worried Parent', date: 'May 29, 2026', content: 'Our kids are being targeted by online predators and algorithmically fed toxic content. Tech giants won’t self-regulate, so we need government mandates.' }
    ],
    'C-69': [
      { id: 'c69-1', author: 'Startup Founder', date: 'May 27, 2026', content: 'Raising the capital gains inclusion rate makes Canada uncompetitive. Why would investors put money into Canadian startups if they get taxed at 66% on exit?' },
      { id: 'c69-2', author: 'Tenant Union', date: 'May 29, 2026', content: 'The Renters Bill of Rights is a step in the right direction. We need history tracking on rent prices so landlords cannot price gouge.' }
    ],
    'C-50': [
      { id: 'c50-1', author: 'Energy Worker AB', date: 'May 28, 2026', content: 'A "Sustainable Jobs Act" is a polite way of saying they are winding down my career. We need transitions that protect our wages, not just retraining programs.' },
      { id: 'c50-2', author: 'GreenTransition Now', date: 'May 30, 2026', content: 'Excellent step forward. Oil is a finite boom-bust commodity. Helping workers transition to geothermal and hydrogen keeps them employed long-term.' }
    ],
    'C-35': [
      { id: 'c35-1', author: 'Working Mom BC', date: 'May 29, 2026', content: 'The $10-a-day childcare saved my household over $1,200 a month. Making this a permanent legislative funding model is huge.' },
      { id: 'c35-2', author: 'Waitlist Survivor', date: 'May 30, 2026', content: 'Great in theory, but the waitlist in Toronto is 2 years long. If you don’t support private and home-care providers, you create a massive shortage.' }
    ],
    'C-233': [
      { id: 'c233-1', author: 'Family Advocate', date: 'May 29, 2026', content: 'Keira Kagan should be alive today. Judges must understand coercive control so they stop ordering custody shares to abusive spouses.' }
    ]
  });

  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');

  const filteredBills = useMemo(() => {
    const q = search.toLowerCase();
    return BILLS_DATA.filter(bill => {
      const matchSearch = bill.id.toLowerCase().includes(q) || 
                          bill.title.toLowerCase().includes(q) ||
                          bill.desc.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || bill.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !newAuthor.trim() || !newText.trim()) return;

    const newComment: BillComment = {
      id: `${selectedBill.id}-${Date.now()}`,
      author: newAuthor.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: newText.trim()
    };

    setBillComments(prev => ({
      ...prev,
      [selectedBill.id]: [newComment, ...(prev[selectedBill.id] || [])]
    }));

    setNewAuthor('');
    setNewText('');
  };

  if (selectedBill) {
    const commentsList = billComments[selectedBill.id] || [];

    return (
      <div className="page-container glass-panel" style={{ overflowY: 'auto' }}>
        <button 
          onClick={() => setSelectedBill(null)} 
          style={{ background: 'transparent', color: 'var(--accent-color)', border: 'none', cursor: 'pointer', marginBottom: '24px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          &larr; Back to all Bills
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: selectedBill.status.includes('Passed') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: selectedBill.status.includes('Passed') ? '#10b981' : '#f59e0b', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                {selectedBill.status}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Category: {selectedBill.category}
              </span>
            </div>
            <h1 style={{ fontSize: '28px', margin: '8px 0 0 0', color: 'white' }}>{selectedBill.id}: {selectedBill.title}</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI Distiller:</span>
            <select 
              value={aiEngine} 
              onChange={(e) => setAiEngine(e.target.value)}
              className="custom-select"
              style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer', outline: 'none', appearance: 'none' }}
            >
              <option>Gemini Advanced</option>
              <option>ChatGPT 4o</option>
              <option>Claude 3.5 Sonnet</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexWrap: 'wrap' }}>
          {/* Left panel: Bill description & AI summary */}
          <div style={{ flex: 2, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '15px' }}>Official Summary</h3>
              <p style={{ lineHeight: '1.6', color: 'rgba(255,255,255,0.85)', fontSize: '14px', margin: 0 }}>{selectedBill.desc}</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                <span>✨</span> AI Analysis & Distillation ({aiEngine})
              </h3>
              <p style={{ lineHeight: '1.7', color: 'rgba(255,255,255,0.9)', fontSize: '14.5px', margin: 0 }}>
                {selectedBill.aiBreakdown}
              </p>
            </div>
          </div>

          {/* Right panel: Party stances */}
          <div style={{ flex: 1.2, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Party Stances</h3>
            
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--party-liberal)' }}>
              <strong style={{ color: 'var(--party-liberal)', display: 'block', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase' }}>Liberal Party</strong>
              <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>{selectedBill.lib}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--party-conservative)' }}>
              <strong style={{ color: 'var(--party-conservative)', display: 'block', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase' }}>Conservative Party</strong>
              <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>{selectedBill.con}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--party-ndp)' }}>
              <strong style={{ color: 'var(--party-ndp)', display: 'block', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase' }}>New Democratic Party</strong>
              <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>{selectedBill.ndp}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--party-bloc)' }}>
              <strong style={{ color: 'var(--party-bloc)', display: 'block', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase' }}>Bloc Québécois</strong>
              <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>{selectedBill.bloc}</span>
            </div>
          </div>
        </div>

        {/* Public Debate & Comments */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            💬 Public Debate Feed ({commentsList.length} Comments)
          </h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Discuss and debate this bill. All viewpoints are welcome, but please remain respectful and abide by community guidelines.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {commentsList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                No debate comments yet. Share your thoughts on Bill {selectedBill.id}!
              </div>
            ) : (
              commentsList.map(c => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12.5px', color: 'white' }}>{c.author}</strong>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)' }}>{c.date}</span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.45' }}>{c.content}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Your Name / Handle" 
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              required
              style={{ flex: '1', minWidth: '150px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '12px', color: 'white', fontSize: '13px' }}
            />
            <input 
              type="text" 
              placeholder={`Share your stance on ${selectedBill.id} (${selectedBill.title})...`} 
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              required
              style={{ flex: '3', minWidth: '250px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '12px', color: 'white', fontSize: '13px' }}
            />
            <button 
              type="submit" 
              style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
            >
              Post Stance
            </button>
          </form>
        </div>

      </div>
    );
  }

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1>Legislative Bills Tracker</h1>
        <p>Track bills currently moving through Parliament, review non-partisan AI summaries, and analyze party-by-party positions.</p>
        
        {/* Controls: Search and filter */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search bills by ID, title, or keywords..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {(['All', 'In Progress', 'Passed', 'Passed (Royal Assent)'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '8px 14px',
                  background: statusFilter === status ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: statusFilter === status ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredBills.map(bill => (
            <div key={bill.id} className="bill-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)' }}>{bill.id}</span>
                  <span style={{ background: bill.status.includes('Passed') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: bill.status.includes('Passed') ? '#10b981' : '#f59e0b', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {bill.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', margin: '0 0 10px 0', color: 'white', lineHeight: '1.3' }}>{bill.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.45', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {bill.desc}
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <span style={{ background: 'rgba(215, 25, 32, 0.1)', color: 'var(--party-liberal)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>LPC Stance</span>
                  <span style={{ background: 'rgba(26, 71, 130, 0.1)', color: 'var(--party-conservative)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>CPC Stance</span>
                  <span style={{ background: 'rgba(243, 112, 33, 0.1)', color: 'var(--party-ndp)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>NDP Stance</span>
                  <span style={{ background: 'rgba(51, 178, 204, 0.1)', color: 'var(--party-bloc)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>BQ Stance</span>
                </div>
              </div>
              <button className="vote-btn" onClick={() => setSelectedBill(bill)} style={{ width: '100%', marginTop: '20px', padding: '10px', background: 'var(--accent-color)' }}>
                View Full Stance & AI Analysis
              </button>
            </div>
          ))}
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
