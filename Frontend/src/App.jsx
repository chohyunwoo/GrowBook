import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Preview from './pages/Preview'
import EditCover from './pages/EditCover'
import Order from './pages/Order'
import Complete from './pages/Complete'

export default function App() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] font-sans text-[#1A1A1A]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/edit-cover" element={<EditCover />} />
        <Route path="/order" element={<Order />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
    </div>
  )
}
