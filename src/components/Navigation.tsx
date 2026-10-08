import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Newspaper, Map, Landmark, FileText, Users, AlertTriangle, History, Menu, X } from 'lucide-react';
import './Navigation.css';

const LINKS: { to: string; label: string; icon: React.ComponentType<{ size?: number }>; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/feed', label: 'The Feed', icon: Newspaper },
  { to: '/pm', label: 'Prime Minister', icon: Users },
  { to: '/opposition-leader', label: 'Opposition Leader', icon: Users },
  { to: '/parties', label: 'Parties', icon: Users },
  { to: '/bills', label: 'Bills', icon: FileText },
  { to: '/scandals', label: 'Scandals', icon: AlertTriangle },
  { to: '/committees', label: 'Committees', icon: Users },
  { to: '/house', label: 'House of Commons', icon: Landmark },
  { to: '/map', label: 'Find Your MP', icon: Map },
  { to: '/history', label: 'History', icon: History },
];

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="main-nav glass-panel">
      <div className="nav-header">
        <NavLink to="/" className="nav-logo" onClick={() => setIsOpen(false)}>
          <span className="logo-text">Parlia</span>
          <span className="logo-text accent">Web</span>
        </NavLink>
        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={28} color="white" /> : <Menu size={28} color="white" />}
        </button>
      </div>
      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
