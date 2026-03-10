import { Routes, Route } from 'react-router-dom'
import StoryInput from './pages/StoryInput'
import ScriptSequence from './pages/ScriptSequence'
import ShotDesign from './pages/ShotDesign'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StoryInput />} />
      <Route path="/script" element={<ScriptSequence />} />
      <Route path="/shot-design" element={<ShotDesign />} />
    </Routes>
  )
}

export default App
