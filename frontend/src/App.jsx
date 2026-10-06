import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Scanner from './components/Scanner';
import Photographer from './components/Photographer';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      {/* Hidden Dev Navigation (Remove in production!) */}
      <div style={{ padding: '20px', display: 'flex', gap: '20px', justifyContent: 'center', borderBottom: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)' }}>
        <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>Guest Scanner View</Link>
        <Link to="/photographer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>Photographer View</Link>
      </div>
      
      <Routes>
        <Route path="/" element={<Scanner />} />
        <Route path="/photographer" element={<Photographer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
