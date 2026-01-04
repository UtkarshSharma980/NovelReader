import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NovelDetail from './pages/NovelDetail'
import ChapterReader from './pages/ChapterReader'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:novelId" element={<NovelDetail />} />
        <Route path="/:novelId/:chapterOrder" element={<ChapterReader />} />
      </Routes>
    </div>
  )
}

export default App
