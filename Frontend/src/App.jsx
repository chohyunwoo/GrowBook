import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TypeSelect from './pages/TypeSelect'
import InputForm from './pages/InputForm'
import Loading from './pages/Loading'
import Preview from './pages/Preview'
import Order from './pages/Order'
import Complete from './pages/Complete'
import ShippingManager from './pages/ShippingManager'

export default function App() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] font-sans text-[#1A1A1A]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/type-select" element={<TypeSelect />} />
        <Route path="/input-form" element={<InputForm />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/order" element={<Order />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/shipping" element={<ShippingManager />} />
      </Routes>
    </div>
  )
}
