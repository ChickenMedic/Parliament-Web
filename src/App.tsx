
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { House } from './pages/House';
import { Bills } from './pages/Bills';
import { Committees } from './pages/Committees';
import { Parties } from './pages/Parties';
import { Scandals } from './pages/Scandals';
import { PrimeMinister } from './pages/PrimeMinister';
import { OppositionLeader } from './pages/OppositionLeader';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/house" element={<House />} />
          <Route path="/parties" element={<Parties />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/committees" element={<Committees />} />
          <Route path="/scandals" element={<Scandals />} />
          <Route path="/pm" element={<PrimeMinister />} />
          <Route path="/opposition-leader" element={<OppositionLeader />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
