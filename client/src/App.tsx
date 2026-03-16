import { Routes, Route, Navigate } from 'react-router-dom';
import GenreSelection from './pages/GenreSelection/GenreSelection';
import StoryInput from './pages/StoryInput/StoryInput';
import Screenplay from './pages/Screenplay/Screenplay';
import CastSheet from './pages/CastSheet/CastSheet';
import ShotGeneration from './pages/ShotGeneration/ShotGeneration';
import Storyboard from './pages/Storyboard/Storyboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<StoryInput />} />
      <Route path="/genre" element={<GenreSelection />} />
      <Route path="/screenplay" element={<Screenplay />} />
      <Route path="/cast" element={<CastSheet />} />
      <Route path="/shots" element={<ShotGeneration />} />
      <Route path="/storyboard" element={<Storyboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


export default App;
