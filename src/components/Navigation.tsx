import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, AlertTriangle } from 'lucide-react';
import './Navigation.css';

export const Navigation: React.FC = () => {
  return (
    <nav className="main-nav glass-panel">
      <div className="nav-logo">
        <span className="logo-text">Parlia</span>
        <span className="logo-text accent">Web</span>
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Overview Map</span>
        </NavLink>
        <NavLink to="/house" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>House of Commons</span>
        </NavLink>
        <NavLink to="/bills" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Bills</span>
        </NavLink>
        <NavLink to="/parties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Parties</span>
        </NavLink>
        <NavLink to="/committees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Committees</span>
        </NavLink>
        <NavLink to="/scandals" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={20} />
          <span>Scandals</span>
        </NavLink>
      </div>
    </nav>
  );
};
