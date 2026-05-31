import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import politiciansData from '../data/politicians.json';
import rolesMap from '../data/roles.json';

interface Politician {
  name: string;
  url: string;
  current_party: { short_name: { en: string } };
  current_riding: { province: string; name: { en: string } };
  image: string | null;
  role?: string;
  twitter?: string | null;
  email?: string | null;
  voice?: string | null;
}

const getPartyColor = (party: string) => {
  switch (party.toLowerCase()) {
    case 'liberal': return 'var(--party-liberal)';
    case 'conservative': return 'var(--party-conservative)';
    case 'ndp': return 'var(--party-ndp)';
    case 'bloc': return 'var(--party-bloc)';
    case 'green': return 'var(--party-green)';
    default: return 'var(--party-independent)';
  }
};

const CustomDropdown = ({ value, options, onChange, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ 
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', 
          color: 'white', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0, marginLeft: '8px' }} />
      </button>

      {open && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
          background: 'rgba(25,25,25,0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          maxHeight: '220px', overflowY: 'auto', zIndex: 100,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: '4px'
        }}>
          {options.map((opt: any) => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderRadius: '6px',
                background: value === opt.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: value === opt.value ? 'white' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => { if(value !== opt.value) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({ selectedMP, setSelectedMP }: { selectedMP: any, setSelectedMP: (mp: any) => void }) => {
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [cabinetFilter, setCabinetFilter] = useState('');

  const politicians = politiciansData.objects.map((p: any) => ({
    ...p,
    role: (rolesMap as any)[p.name] || undefined
  })) as Politician[];

  const filteredPoliticians = useMemo(() => {
    const q = search.toLowerCase();
    return politicians.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) || 
                          p.current_riding.name.en.toLowerCase().includes(q) ||
                          p.current_party.short_name.en.toLowerCase().includes(q);
      const matchProvince = provinceFilter === '' || p.current_riding.province === provinceFilter;
      
      let matchParty = true;
      if (partyFilter) {
        if (partyFilter === 'Other') {
          matchParty = !['Liberal', 'Conservative', 'NDP', 'Bloc', 'Green'].includes(p.current_party.short_name.en);
        } else {
          matchParty = p.current_party.short_name.en === partyFilter;
        }
      }

      let matchCabinet = true;
      if (cabinetFilter === 'Cabinet') {
        matchCabinet = p.role !== undefined && p.role.toLowerCase().includes('minister') && !p.role.toLowerCase().includes('shadow') && !p.role.toLowerCase().includes('critic');
      } else if (cabinetFilter === 'Shadow Cabinet') {
        matchCabinet = p.role !== undefined && (p.role.toLowerCase().includes('critic') || p.role.toLowerCase().includes('shadow'));
      }

      return matchSearch && matchProvince && matchParty && matchCabinet;
    });
  }, [search, provinceFilter, partyFilter, cabinetFilter, politicians]);

  useEffect(() => {
    if (selectedMP) {
      const safeUrl = selectedMP.url.replace(/\W+/g, '-');
      const element = document.getElementById(`mp-${safeUrl}`);
      if (element) {
        if (window.innerWidth >= 1024) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const listContainer = element.closest('.politician-list');
          if (listContainer) {
            const listRect = listContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const relativeTop = elementRect.top - listRect.top;
            const scrollPos = listContainer.scrollTop + relativeTop - (listContainer.clientHeight / 2) + (elementRect.height / 2);
            
            listContainer.scrollTo({
              top: scrollPos,
              behavior: 'smooth'
            });
          }
        }
      }
    }
  }, [selectedMP]);

  const provinces = useMemo(() => {
    const provs = new Set(politicians.map(p => p.current_riding.province));
    return Array.from(provs).sort();
  }, [politicians]);

  return (
    <div className="sidebar-wrapper">
      <div className="sidebar glass-panel">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Canada Parliament</h1>
          <p className="sidebar-subtitle">Explore Members of Parliament and their Ridings.</p>
          
          <div className="filter-controls" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <CustomDropdown 
              value={provinceFilter} 
              onChange={setProvinceFilter} 
              placeholder="All Provinces"
              options={[{ label: 'All Provinces', value: '' }, ...provinces.map(prov => ({ label: prov, value: prov }))]}
            />
            <CustomDropdown 
              value={partyFilter} 
              onChange={setPartyFilter} 
              placeholder="All Parties"
              options={[
                { label: 'All Parties', value: '' },
                { label: 'Liberal', value: 'Liberal' },
                { label: 'Conservative', value: 'Conservative' },
                { label: 'NDP', value: 'NDP' },
                { label: 'Bloc', value: 'Bloc' },
                { label: 'Green', value: 'Green' },
                { label: 'Other', value: 'Other' },
              ]}
            />
          </div>

          <div className="filter-controls" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
             <CustomDropdown 
                value={cabinetFilter} 
                onChange={setCabinetFilter} 
                placeholder="All Roles"
                options={[
                  { label: 'All Roles', value: '' },
                  { label: 'Cabinet Ministers', value: 'Cabinet' },
                  { label: 'Shadow Cabinet', value: 'Shadow Cabinet' },
                ]}
              />
              <button 
                onClick={() => { setProvinceFilter(''); setPartyFilter(''); setCabinetFilter(''); }} 
                disabled={!provinceFilter && !partyFilter && !cabinetFilter}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: (!provinceFilter && !partyFilter && !cabinetFilter) ? 'default' : 'pointer', fontSize: '13px', transition: 'background 0.2s', fontWeight: 'bold', opacity: (!provinceFilter && !partyFilter && !cabinetFilter) ? 0.5 : 1 }}
                onMouseOver={(e) => { if (provinceFilter || partyFilter || cabinetFilter) e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                Reset Filters
              </button>
          </div>

          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by name, riding, or party..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="politician-list">
          {filteredPoliticians.map((p) => {
            const party = p.current_party.short_name.en;
            const color = getPartyColor(party);
            const isSelected = selectedMP?.url === p.url;
            return (
              <div 
                id={`mp-${p.url.replace(/\W+/g, '-')}`}
                key={p.url} 
                className={`politician-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedMP(p)}
                style={{ 
                  position: 'relative',
                  overflow: 'hidden',
                  border: isSelected ? `1px solid ${color}` : '1px solid transparent',
                  boxShadow: isSelected ? `0 0 12px ${color}40` : ''
                }}
              >
                {/* Swipe Background */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, bottom: 0,
                  width: isSelected ? '100%' : '6px',
                  backgroundColor: color,
                  opacity: isSelected ? 0.8 : 1,
                  transition: 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  zIndex: 0
                }} />
                
                <img 
                  className="politician-image" 
                  src={p.image ? `https://openparliament.ca${p.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`} 
                  alt={p.name} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`;
                  }}
                  style={{ position: 'relative', zIndex: 1, borderColor: isSelected ? 'white' : 'transparent', objectPosition: 'center top' }}
                />
                
                <div className="politician-info" style={{ position: 'relative', zIndex: 1, flex: 1, textShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.8)' : 'none', padding: '0', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <div className="politician-name" style={{ color: 'white', margin: 0, lineHeight: '1.2', fontWeight: 600, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div className="politician-party" style={{ color: isSelected ? 'white' : color, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{party}</div>
                  <div className="politician-riding" style={{ color: isSelected ? '#eee' : 'var(--text-secondary)', margin: 0, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.current_riding.name.en}, {p.current_riding.province}</div>
                  {p.role && !p.role.includes('MP for') && (
                    <div className="politician-role" style={{ fontSize: '12px', color: isSelected ? 'white' : 'var(--accent-color)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.role}
                    </div>
                  )}

                  <div className="politician-contact" style={{ display: 'flex', gap: '12px', marginTop: '2px', alignItems: 'center' }}>
                    {p.twitter && (
                      <a href={`https://x.com/${p.twitter}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: isSelected ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} title="X (Twitter)" onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-color)'} onMouseOut={(e) => e.currentTarget.style.color = isSelected ? 'white' : 'var(--text-secondary)'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    )}
                    {p.email && (
                      <a href={`mailto:${p.email}`} onClick={(e) => e.stopPropagation()} style={{ color: isSelected ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} title="Email" onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-color)'} onMouseOut={(e) => e.currentTarget.style.color = isSelected ? 'white' : 'var(--text-secondary)'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      </a>
                    )}
                    {p.voice && (
                      <a href={`tel:${p.voice.replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} style={{ color: isSelected ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} title="Phone" onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-color)'} onMouseOut={(e) => e.currentTarget.style.color = isSelected ? 'white' : 'var(--text-secondary)'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
