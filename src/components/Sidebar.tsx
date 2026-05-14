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
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                  style={{ position: 'relative', zIndex: 1, borderColor: isSelected ? 'white' : 'transparent', objectPosition: 'center 10%' }}
                />
                
                <div className="politician-info" style={{ position: 'relative', zIndex: 1, textShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.8)' : 'none', padding: '4px 0' }}>
                  <div className="politician-name" style={{ color: 'white' }}>{p.name}</div>
                  <div className="politician-riding" style={{ color: isSelected ? '#eee' : 'var(--text-secondary)' }}>{p.current_riding.name.en}, {p.current_riding.province}</div>
                  <div className="politician-party" style={{ color: isSelected ? 'white' : color, fontWeight: 'bold' }}>{party}</div>
                  {p.role && !p.role.includes('MP for') && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: isSelected ? 'white' : 'var(--accent-color)' }}>
                      {p.role}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
