import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, AlertTriangle, Menu, X } from 'lucide-react';
import './Navigation.css';

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="main-nav glass-panel">
      <div className="nav-header">
        <div className="nav-logo">
          <span className="logo-text">Parlia</span>
          <span className="logo-text accent">Web</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} color="white" /> : <Menu size={28} color="white" />}
        </button>
      </div>
      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Overview Map</span>
        </NavLink>
        <NavLink to="/house" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>House of Commons</span>
        </NavLink>
        <NavLink to="/parties" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Parties</span>
        </NavLink>
        <NavLink to="/pm" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Prime Minister</span>
        </NavLink>
        <NavLink to="/opposition-leader" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Opposition Leader</span>
        </NavLink>
        <NavLink to="/committees" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Committees</span>
        </NavLink>
        <NavLink to="/scandals" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={20} />
          <span>Scandals</span>
        </NavLink>
        <NavLink to="/bills" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Bills</span>
        </NavLink>
        
        {/* Debug Links */}
        <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
          <NavLink to="/bills-debug" onClick={() => setIsOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ opacity: 0.5, fontSize: '12px' }}>
            <FileText size={14} />
            <span>XML Index (Debug)</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
