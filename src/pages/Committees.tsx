import { useState, useMemo } from 'react';
import './PageStyles.css';
import politiciansData from '../data/politicians.json';

interface CommitteeStudy {
  title: string;
  topic: string;
  meetingDate: string;
  youtubeUrl: string;
}

interface Committee {
  id: string;
  name: string;
  desc: string;
  chairName: string;
  viceChairs: string[];
  members: string[];
  studies: CommitteeStudy[];
  partySeats: Record<string, number>;
}

const COMMITTEES_DATA: Committee[] = [
  {
    id: 'FINA',
    name: 'Standing Committee on Finance',
    desc: 'Mandated to study and report on all matters relating to the mandate, management and operation of the Department of Finance and the Canada Revenue Agency.',
    chairName: 'Peter Fonseca',
    viceChairs: ['Jasraj Hallan', 'Gabriel Ste-Marie'],
    members: ['Terry Beech', 'Yvan Baker', 'Adam Chambers', 'Kelly McCauley', 'Dan Mazier', 'Heather McPherson', 'Sukh Dhaliwal'],
    studies: [
      {
        title: 'Pre-budget Consultations 2026',
        topic: 'Reviewing public submissions, municipal requests, and economic forecasts to compile the House budget recommendations report for next fiscal year.',
        meetingDate: 'June 4, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Standing+Committee+on+Finance+Pre-budget'
      },
      {
        title: 'Study of Inflationary Pressures and Interest Rates',
        topic: 'Analyzing Bank of Canada monetary decisions, cost of living indices, corporate profitability, and supermarket pricing structures.',
        meetingDate: 'June 11, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Standing+Committee+on+Finance+Inflation'
      },
      {
        title: 'Housing Market Affordability and Credit Access',
        topic: 'Investigating high interest rates impacts on mortgages, municipal zoning barriers, and CMHC loan program funding adjustments.',
        meetingDate: 'June 18, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Standing+Committee+on+Finance+Housing'
      }
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'HESA',
    name: 'Standing Committee on Health',
    desc: 'Oversees the work of Health Canada, Public Health Agency of Canada, and CIHR to study issues related to healthcare systems and health regulations.',
    chairName: 'Sean Casey',
    viceChairs: ['Stephen Ellis', 'Don Davies'],
    members: ['Mark Holland', 'Todd Doherty', 'Stephen Fuhr', 'Hedy Fry', 'Rob Morrison', 'Jenna Sudds', 'Leah Gazan'],
    studies: [
      {
        title: 'Evaluation of the National Pharmacare Rollout',
        topic: 'Assessing pharmaceutical coverage benchmarks, provincial uptake agreements, and initial procurement drug list regulations.',
        meetingDate: 'June 5, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Health+Committee+Pharmacare'
      },
      {
        title: 'Emergency Room Wait Times and Healthcare Staffing Crisis',
        topic: 'Examining nationwide nurse shortages, clinical credential recognition for foreign graduates, and federal health transfers.',
        meetingDate: 'June 12, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Health+Committee+Healthcare+Staffing'
      },
      {
        title: 'Mental Health Supports for Youth in Rural Communities',
        topic: 'Studying digital counseling access bottlenecks, school-based mental health resources, and psychiatric clinic funding distributions.',
        meetingDate: 'June 19, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Health+Committee+Mental+Health'
      }
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'NDP': 1, 'Bloc': 1 }
  },
  {
    id: 'FAAE',
    name: 'Standing Committee on Foreign Affairs',
    desc: 'Studies bills, spending, and policies of Global Affairs Canada and monitors international development assistance programs.',
    chairName: 'Ali Ehsassi',
    viceChairs: ['Michael Chong', 'Simon-Pierre Savard-Tremblay'],
    members: ['Mélanie Joly', 'Garnett Genuis', 'Taleeb Noormohamed', 'Wayne Long', 'John Barlow', 'Ziad Aboultaif', 'Heather McPherson'],
    studies: [
      {
        title: "Canada's Indo-Pacific Strategy Implementation",
        topic: 'Assessing trade expansion incentives, military cooperation pacts, and diplomatic mission placements in allied countries.',
        meetingDate: 'June 8, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Foreign+Affairs+Committee+Indo-Pacific'
      },
      {
        title: 'Arctic Sovereignty, Security, and Relations with Circumpolar Nations',
        topic: 'Analyzing geopolitical changes, northern community infrastructure needs, radar modernization plans, and Northwest Passage patrolling.',
        meetingDate: 'June 15, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Foreign+Affairs+Committee+Arctic+Sovereignty'
      },
      {
        title: 'International Aid Effectiveness in Sub-Saharan Africa',
        topic: 'Reviewing audit evaluations of clean water projects, vaccine distributions, and direct non-profit partnerships in developing zones.',
        meetingDate: 'June 22, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Foreign+Affairs+Committee+International+Aid'
      }
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'NDDN',
    name: 'Standing Committee on National Defence',
    desc: 'Focuses on the Department of National Defence and the Canadian Armed Forces, reviewing operations, defense policy, and military equipment.',
    chairName: 'John McKay',
    viceChairs: ['James Bezan', 'Christine Normandin'],
    members: ['Bill Blair', 'Alex Ruff', 'Pat Kelly', 'Terry Duguid', 'Serge Cormier', 'Marie-France Lalonde', 'Lindsay Mathyssen'],
    studies: [
      {
        title: 'Military Recruitment and Retention Strategies',
        topic: 'Addressing service member culture complaints, housing subsidies on bases, and streamlining recruit application pipelines.',
        meetingDate: 'June 9, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Defence+Committee+Recruitment'
      },
      {
        title: 'Procurement of Surface Combatant and F-35 Fighter Jets',
        topic: 'Auditing shipbuilding timeline overruns, contract renegotiations with Lockheed Martin, and long-term maintenance budgets.',
        meetingDate: 'June 16, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Defence+Committee+Procurement'
      },
      {
        title: 'Cybersecurity Capabilities of the Canadian Armed Forces',
        topic: 'Reviewing critical military network firewalls, counter-espionage squads, and infrastructure protection protocols against state-sponsored attacks.',
        meetingDate: 'June 23, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Defence+Committee+Cybersecurity'
      }
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'PACP',
    name: 'Standing Committee on Public Accounts',
    desc: 'The House oversight committee, chaired by an Opposition member, that reviews the reports of the Auditor General of Canada to ensure government accountability.',
    chairName: 'John Williamson',
    viceChairs: ['Jean-Yves Duclos', 'Nathalie Sinclair-Desgagné'],
    members: ['Kelly Block', 'Blake Richards', 'Kody Blois', 'Peter Fragiskatos', 'Sonia Sidhu', 'Brad Vis', 'Jenny Kwan'],
    studies: [
      {
        title: "Review of the Auditor General's Report on the ArriveCAN App",
        topic: 'Investigating third-party subcontractor fees, GC360 tech contracting methods, and missing invoice sheets.',
        meetingDate: 'June 3, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Public+Accounts+ArriveCAN'
      },
      {
        title: 'Federal Information Technology Procurement Regulations',
        topic: 'Reforming government software engineering sourcing, contractor rate ceilings, and in-house digital capacity building.',
        meetingDate: 'June 10, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Public+Accounts+IT+Procurement'
      },
      {
        title: 'Oversight of Defense Procurement Project Costing',
        topic: 'Reviewing financial models for radar upgrades, naval patrol frigates, and ammunition logistics stockpiling costs.',
        meetingDate: 'June 17, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Public+Accounts+Defence+Costing'
      }
    ],
    partySeats: { 'Conservative': 5, 'Liberal': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'ENVI',
    name: 'Standing Committee on Environment and Sustainable Development',
    desc: 'Mandated to study and report on matters relating to the environment, sustainable development, climate change, and environmental enforcement.',
    chairName: 'Sophie Chatel',
    viceChairs: ['Gérard Deltell', 'Don Davies'],
    members: ['Steven Guilbeault', 'Patrick Weiler', 'Francis Scarpaleggia', 'Patrick Bonin', 'Gord Johns', 'Leah Gazan', 'Marilyn Gladu'],
    studies: [
      {
        title: 'Evaluating the Federal Carbon Pricing Mechanism',
        topic: 'Analyzing industrial emission outputs, small business rebate distributions, and compliance offset markets.',
        meetingDate: 'June 4, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Environment+Committee+Carbon+Pricing'
      },
      {
        title: 'Biodiversity and Ecosystem Protection in National Parks',
        topic: 'Studying wildlife migration corridors, invasive species containment, and funding expansion for conservation rangers.',
        meetingDate: 'June 11, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Environment+Committee+Biodiversity'
      },
      {
        title: 'Impacts of Plastics Pollution on Canadian Waterways',
        topic: 'Evaluating microplastic toxicity levels in the Great Lakes, single-use container bans, and recycling infrastructure subsidization.',
        meetingDate: 'June 18, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Environment+Committee+Plastics'
      }
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'JUST',
    name: 'Standing Committee on Justice and Human Rights',
    desc: 'Mandated to oversee the Department of Justice, federal courts, criminal law, and human rights issues.',
    chairName: 'Lena Metlege Diab',
    viceChairs: ['Frank Caputo', 'Luc Thériault'],
    members: ['Sameer Zuberi', 'Anju Dhillon', 'Michael Cooper', 'Jenny Kwan', 'Lori Idlout', 'Chris Bittle', 'Dan Albas'],
    studies: [
      {
        title: 'Review of Sentencing and Bail Reform Legislation',
        topic: 'Assessing violent crime recidivism statistics, pre-trial detention facilities, and charter compliance safeguards.',
        meetingDate: 'June 5, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Justice+Committee+Bail+Reform'
      },
      {
        title: 'Access to Justice and Legal Aid Funding',
        topic: 'Reviewing provincial legal aid shortage programs, court backlog delays, and virtual witness hearing expansions.',
        meetingDate: 'June 12, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Justice+Committee+Legal+Aid'
      },
      {
        title: 'Human Rights Protections in Federal Penitentiaries',
        topic: 'Investigating administrative segregation alternatives, mental health treatment wings, and prison ombudsman powers.',
        meetingDate: 'June 19, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Justice+Committee+Prison+Rights'
      }
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'RNNR',
    name: 'Standing Committee on Natural Resources',
    desc: 'Mandated to study and report on matters relating to the mandate, management, and operation of the Department of Natural Resources.',
    chairName: 'Kody Blois',
    viceChairs: ['Shannon Stubbs', 'Mario Simard'],
    members: ['Terry Beech', 'Greg McLean', 'Peter Fonseca', 'Viviane Lapointe', 'Heather McPherson', 'Alex Ruff', 'Mona Fortier'],
    studies: [
      {
        title: 'Transitioning to Clean Energy Infrastructure',
        topic: 'Evaluating federal grid connection incentives, nuclear SMR designs, and wind/solar farm regulatory approvals.',
        meetingDate: 'June 8, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Natural+Resources+Clean+Energy'
      },
      {
        title: 'Critical Minerals and Supply Chain Security',
        topic: 'Developing Northern Ontario lithium/cobalt extraction pathways, refinement facility infrastructure, and allied export agreements.',
        meetingDate: 'June 15, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Natural+Resources+Critical+Minerals'
      },
      {
        title: 'Sustainable Forestry Management Practices in Western Canada',
        topic: 'Reviewing wildfire resilience pruning, replanting diversity requirements, and lumber tariff impacts.',
        meetingDate: 'June 22, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Natural+Resources+Forestry'
      }
    ],
    partySeats: { 'Liberal': 5, 'Conservative': 4, 'Bloc': 1, 'NDP': 1 }
  },
  {
    id: 'ETHI',
    name: 'Standing Committee on Access to Information, Privacy and Ethics',
    desc: 'Reviews access to information, privacy commissioner reports, and conflict of interest issues involving public office holders.',
    chairName: 'Pat Kelly',
    viceChairs: ['Mona Fortier', 'Alexis Brunelle-Duceppe'],
    members: ['Michael Barrett', 'Iqra Khalid', 'Gord Johns', 'Yasir Naqvi', 'Tom Kmiec', 'Serge Cormier', 'John Williamson'],
    studies: [
      {
        title: 'Investigation into Federal Government Contracting and Conflict of Interest Guidelines',
        topic: 'Auditing procurement relationships, direct-award contracting loopholes, and lobbying reporting timeliness.',
        meetingDate: 'June 3, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Ethics+Committee+Contracting'
      },
      {
        title: 'Impact of Generative AI on Privacy Rights of Canadian Citizens',
        topic: 'Reviewing scraping laws, training data permissions, facial recognition guidelines, and private privacy legislation drafts.',
        meetingDate: 'June 10, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Ethics+Committee+AI+Privacy'
      },
      {
        title: 'Review of the Conflict of Interest Act Compliance Standards',
        topic: 'Recommending blind trust adjustments, post-office lobbying ban extensions, and ethics commissioner enforcement powers.',
        meetingDate: 'June 17, 2026',
        youtubeUrl: 'https://www.youtube.com/results?search_query=House+of+Commons+Ethics+Committee+Conflict+of+Interest'
      }
    ],
    partySeats: { 'Conservative': 5, 'Liberal': 4, 'Bloc': 1, 'NDP': 1 }
  }
];

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

interface UserComment {
  id: string;
  author: string;
  date: string;
  content: string;
}

export const Committees = () => {
  const [selectedId, setSelectedId] = useState('FINA');
  const politicians = politiciansData.objects as any[];

  // Local comments state, initialized with realistic contributions
  const [comments, setComments] = useState<Record<string, UserComment[]>>({
    'FINA': [
      { id: 'fina-1', author: 'Darren K.', date: 'May 28, 2026', content: 'Pre-budget consultations need to address the rising cost of childcare. Subsidies are great, but waitlists are too long.' },
      { id: 'fina-2', author: 'Sarah M.', date: 'May 30, 2026', content: 'Inflation is hitting seniors hard. We need to look at increasing the GIS threshold.' },
      { id: 'fina-3', author: 'James R.', date: 'May 31, 2026', content: 'We need mortgage reform immediately. Floating rates are crushing middle class homeowners.' }
    ],
    'HESA': [
      { id: 'hesa-1', author: 'Dr. Evelyn R.', date: 'May 29, 2026', content: 'The nursing shortage cannot be fixed without provincial agreements on overtime pay and credentials verification.' },
      { id: 'hesa-2', author: 'Mark T.', date: 'May 30, 2026', content: 'Pharmacare rollout is too slow. Only covering diabetes and contraceptives is a drop in the bucket.' }
    ],
    'FAAE': [
      { id: 'faae-1', author: 'Aris V.', date: 'May 27, 2026', content: 'Arctic Sovereignty is going to be the major geopolitical issue of the next decade. Glad to see they are auditing military capability up North.' }
    ],
    'NDDN': [
      { id: 'nddn-1', author: 'Captain G. (Ret.)', date: 'May 29, 2026', content: 'The F-35 purchase has been delayed for fifteen years under various governments. Just build the base hangers and finalize delivery.' }
    ],
    'PACP': [
      { id: 'pacp-1', author: 'Taxpayer Advocate', date: 'May 26, 2026', content: 'The ArriveCAN app is a symptom of a much larger problem. Government IT consulting procurement is a complete black box.' }
    ],
    'ENVI': [
      { id: 'envi-1', author: 'Chloe S.', date: 'May 30, 2026', content: 'Microplastics in the Great Lakes should be treated with the same urgency as carbon pricing. The ecosystem damage is irreversible.' }
    ],
    'JUST': [
      { id: 'just-1', author: 'Legal Aid Counsel', date: 'May 28, 2026', content: 'Court backlogs are causing active Charter violations because suspects are waiting years for their day in court.' }
    ],
    'RNNR': [
      { id: 'rnnr-1', author: 'Gilles P.', date: 'May 29, 2026', content: 'We cannot talk about critical mineral supply chains without building the road infrastructure into the Ring of Fire.' }
    ],
    'ETHI': [
      { id: 'ethi-1', author: 'Transparency Coalition', date: 'May 29, 2026', content: 'Conflict of interest laws must have teeth. A fine of $500 for failing to report a gift is an absolute joke.' }
    ]
  });

  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');

  const selectedCommittee = useMemo(() => {
    return COMMITTEES_DATA.find(c => c.id === selectedId) || COMMITTEES_DATA[0];
  }, [selectedId]);

  const activeComments = useMemo(() => {
    return comments[selectedId] || [];
  }, [comments, selectedId]);

  const findMP = (name: string) => {
    return politicians.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim()) || null;
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newText.trim()) return;

    const newComment: UserComment = {
      id: `${selectedId}-${Date.now()}`,
      author: newAuthor.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: newText.trim()
    };

    setComments(prev => ({
      ...prev,
      [selectedId]: [newComment, ...(prev[selectedId] || [])]
    }));

    setNewAuthor('');
    setNewText('');
  };

  const renderMPCard = (name: string, role: string) => {
    const mp = findMP(name);
    const party = mp ? mp.current_party.short_name.en : 'Independent';
    const color = getPartyColor(party);
    
    return (
      <div 
        key={name}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: color }} />
        
        <img 
          src={mp && mp.image ? `https://openparliament.ca${mp.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} 
          alt={name} 
          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: `1.5px solid ${color}` }}
          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: 'white', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: '11px', color: color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{party}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{role}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Parliamentary Committees</h1>
        <p>Monitor standing committees, their members from the House database, and current legislative studies.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Left Side: Committee List Selector */}
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, overflowY: 'auto' }}>
          {COMMITTEES_DATA.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                background: selectedId === c.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseEnter={(e) => { if(selectedId !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={(e) => { if(selectedId !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <strong style={{ fontSize: '14px' }}>{c.id}</strong>
              <span style={{ fontSize: '12px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Detailed Dashboard */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '8px' }}>
          
          {/* Top Panel: Header & Party representation */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>{selectedCommittee.name}</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{selectedCommittee.desc}</p>
            </div>

            {/* Seat Distribution Visual Bar */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Committee Seat Distribution</div>
              <div style={{ display: 'flex', height: '18px', borderRadius: '9px', overflow: 'hidden', width: '100%', background: 'rgba(255,255,255,0.1)' }}>
                {Object.entries(selectedCommittee.partySeats).map(([party, seats]) => {
                  const percent = (seats / 11) * 100;
                  return (
                    <div 
                      key={party} 
                      style={{ width: `${percent}%`, background: getPartyColor(party), height: '100%', transition: 'all 0.3s' }}
                      title={`${party}: ${seats} Seats`}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                {Object.entries(selectedCommittee.partySeats).map(([party, seats]) => (
                  <div key={party} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: getPartyColor(party) }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{party} ({seats})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roster & Studies splits */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            
            {/* Committee Leadership & Roster */}
            <div style={{ flex: 2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Committee Roster</h3>
              
              {/* Leadership Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {renderMPCard(selectedCommittee.chairName, 'Chair')}
                {selectedCommittee.viceChairs.map(vcName => renderMPCard(vcName, 'Vice-Chair'))}
              </div>

              {/* General Members List */}
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Regular Members</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {selectedCommittee.members.map(mName => renderMPCard(mName, 'Committee Member'))}
              </div>
            </div>

            {/* Current Studies Panel */}
            <div style={{ flex: 1.5, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Active Committee Studies</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedCommittee.studies.map((study, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      padding: '18px', 
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'transform 0.2s, border-color 0.2s',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', background: 'rgba(76, 175, 80, 0.15)', border: '1px solid rgba(76, 175, 80, 0.3)', color: '#81c784', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Investigation</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Study #{idx + 1}</span>
                    </div>
                    
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'white', fontWeight: 'bold', lineHeight: '1.3' }}>{study.title}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.5' }}>{study.topic}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        📅 Next Hearing: <strong style={{ color: 'white' }}>{study.meetingDate}</strong>
                      </div>
                      <a 
                        href={study.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#ff4d4d',
                          textDecoration: 'none',
                          background: 'rgba(255, 77, 77, 0.1)',
                          border: '1px solid rgba(255, 77, 77, 0.25)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 77, 77, 0.25)';
                          e.currentTarget.style.color = '#ff6666';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)';
                          e.currentTarget.style.color = '#ff4d4d';
                        }}
                      >
                        🎥 Watch Broadcast ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Public Discussion Board */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 Public Consultation Board ({activeComments.length} Contributions)
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              Submit your testimony or opinion on active committee studies. Comments are moderated in accordance with House rules.
            </p>
            
            {/* Comment Roster */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {activeComments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                  No comments posted yet. Be the first to share your input!
                </div>
              ) : (
                activeComments.map(comment => (
                  <div key={comment.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '12px', color: 'white' }}>{comment.author}</strong>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{comment.date}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>{comment.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Your Name (e.g. Jean Dupont)" 
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                required
                style={{ flex: '1', minWidth: '150px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: 'white', fontSize: '13px' }}
              />
              <input 
                type="text" 
                placeholder="Share your perspective on this committee's work..." 
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                required
                style={{ flex: '3', minWidth: '250px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px', color: 'white', fontSize: '13px' }}
              />
              <button 
                type="submit" 
                style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
                onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
              >
                Post Comment
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

