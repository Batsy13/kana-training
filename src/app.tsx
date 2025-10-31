import { Routes, Route } from 'react-router';
import GameLayout from './pages/game-layout';
import { katakanaData, hiraganaData } from './lib/kanaData';
import { Home } from './pages/home';

const App  = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/katakana"
        element={<GameLayout data={katakanaData} gameTitle="Katakana" />}
      />
      <Route
        path="/hiragana"
        element={<GameLayout data={hiraganaData} gameTitle="Hiragana" />}
      />
    </Routes>
  );
};

export default App;
