import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import HostDashboard from './pages/HostDashboard';
import QuizBuilder from './pages/QuizBuilder';
import HostLobby from './pages/HostLobby';
import PlayerJoin from './pages/PlayerJoin';
import PlayerGameView from './pages/PlayerGameView';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/host/build" element={<QuizBuilder />} />
        <Route path="/host/lobby/:pin" element={<HostLobby />} />
        <Route path="/play" element={<PlayerJoin />} />
        <Route path="/play/:pin" element={<PlayerGameView />} />
      </Routes>
    </div>
  );
}

export default App;
