import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Navigation } from './components/Navigation';
import { Home } from './pages/Home';

// Every page is its own chunk so the home page doesn't ship the riding
// boundaries, the feeds and the bill texts along with it.
const lazyPage = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) =>
  lazy(() => load().then(m => ({ default: m[name] as React.ComponentType })));

const Feed = lazyPage(() => import('./pages/Feed'), 'Feed');
const Dashboard = lazyPage(() => import('./pages/Dashboard'), 'Dashboard');
const House = lazyPage(() => import('./pages/House'), 'House');
const Bills = lazyPage(() => import('./pages/Bills'), 'Bills');
const Committees = lazyPage(() => import('./pages/Committees'), 'Committees');
const Parties = lazyPage(() => import('./pages/Parties'), 'Parties');
const Scandals = lazyPage(() => import('./pages/Scandals'), 'Scandals');
const PrimeMinister = lazyPage(() => import('./pages/PrimeMinister'), 'PrimeMinister');
const OppositionLeader = lazyPage(() => import('./pages/OppositionLeader'), 'OppositionLeader');
const History = lazyPage(() => import('./pages/History'), 'History');

const Loading = () => (
  <div className="page-container glass-panel" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
    Loading…
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/map" element={<Dashboard />} />
            <Route path="/house" element={<House />} />
            <Route path="/parties" element={<Parties />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/committees" element={<Committees />} />
            <Route path="/scandals" element={<Scandals />} />
            <Route path="/pm" element={<PrimeMinister />} />
            <Route path="/opposition-leader" element={<OppositionLeader />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
