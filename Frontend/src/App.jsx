import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { supabase, getUser } from './lib/supabase'
import Home from './pages/Home'
import Login from './pages/Login'
import TypeSelect from './pages/TypeSelect'
import InputForm from './pages/InputForm'
import Loading from './pages/Loading'
import Preview from './pages/Preview'
import Order from './pages/Order'
import Complete from './pages/Complete'
import ShippingManager from './pages/ShippingManager'
import MyPage from './pages/MyPage'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import AlbumView from './pages/AlbumView'
import Admin from './pages/Admin'
import SharedAlbum from './pages/SharedAlbum'
import Community from './pages/Community'
import CommunityPost from './pages/CommunityPost'
import ReviewPost from './pages/ReviewPost'

export default function App() {
  const { dispatch } = useApp()

  useEffect(() => {
    getUser().then((user) => {
      dispatch({ type: 'SET_USER', payload: user || null })
    })

    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SET_USER', payload: session?.user || null })
    })

    return () => subscription.unsubscribe()
  }, [dispatch])

  return (
    <div className="min-h-screen bg-[#F7F7F5] font-sans text-[#1A1A1A]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/type-select" element={<TypeSelect />} />
        <Route path="/input-form" element={<InputForm />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/album-view" element={<AlbumView />} />
        <Route path="/order" element={<Order />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/shipping" element={<ShippingManager />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/share/:shareCode" element={<SharedAlbum />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/review/:reviewId" element={<ReviewPost />} />
        <Route path="/community/:postId" element={<CommunityPost />} />
      </Routes>
    </div>
  )
}
