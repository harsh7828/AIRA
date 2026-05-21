import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/auth'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice'
import axios from 'axios'
import InterviewPage from './pages/InterviewPage'
import InterviewHistory from './pages/InterviewHistory'
import Pricing from './pages/Pricing'
import InterviewReport from './pages/InterviewReport'
import ResumeAnalyzer from './pages/ResumeAnalyzer'
import { motion, AnimatePresence } from 'framer-motion'

export const ServerUrl = "http://localhost:8000"

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await axios.get(ServerUrl + "/api/user/current-user", { withCredentials: true })
        dispatch(setUserData(res.data))
      } catch {
        dispatch(setUserData(null))
      }
    }
    getUser()
  }, [dispatch])

  // Theme init
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light') document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
  }, [])

  return (
    <>
      {/* Faint ambient gradient — supports content, never dominates */}
      <div className="bg-ambient" />
      {/* Subtle film grain texture */}
      <div className="bg-noise" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Routes>
          <Route path='/'                element={<Home />} />
          <Route path='/auth'            element={<Auth />} />
          <Route path='/interview'       element={<InterviewPage />} />
          <Route path='/history'         element={<InterviewHistory />} />
          <Route path='/pricing'         element={<Pricing />} />
          <Route path='/report/:id'      element={<InterviewReport />} />
          <Route path='/resume-analyzer' element={<ResumeAnalyzer />} />
        </Routes>
      </motion.div>
    </>
  )
}

export default App
