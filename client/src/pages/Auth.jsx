import React from 'react'
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
function Auth({isModel = false}) {
    const dispatch = useDispatch()

    const handleGoogleAuth = async () => {
        try {
            const response = await signInWithPopup(auth,provider)
            let User = response.user
            let name = User.displayName
            let email = User.email
            const result = await axios.post(ServerUrl + "/api/auth/google" , {name , email} , {withCredentials:true})
            dispatch(setUserData(result.data))
            

        } catch (error) {
            console.log(error)
              dispatch(setUserData(null))
        }
    }
  return (
    <div style={{
      width: '100%',
      ...(isModel
        ? { padding: '16px 0' }
        : { minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' })
    }}>
        <motion.div 
        initial={{opacity:0 , y:-40}} 
        animate={{opacity:1 , y:0}} 
        transition={{duration:1.05}}
        style={{
          width: '100%',
          maxWidth: isModel ? '28rem' : '32rem',
          padding: isModel ? '32px' : '48px',
          borderRadius: isModel ? '24px' : '28px',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, #9333EA, #C084FC)', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BsRobot size={18}/>
                </div>
                <h2 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>AIRA Intelligence</h2>
            </div>

            <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, textAlign: 'center', lineHeight: 1.3, marginBottom: '16px', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                Continue with{' '}
                <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid var(--accent-border)' }}>
                    <IoSparkles size={16}/>
                    AI Smart Interview
                </span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '32px', fontFamily: 'Inter, sans-serif' }}>
                Sign in to start AI-powered mock interviews,
        track your progress, and unlock detailed performance insights.
            </p>


            <motion.button 
            onClick={handleGoogleAuth}
            whileHover={{opacity:0.9 , scale:1.03}}
            whileTap={{opacity:1 , scale:0.98}}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '13px',
              background: 'linear-gradient(135deg, #9333EA, #C084FC)',
              color: '#fff',
              borderRadius: '99px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9375rem',
              fontWeight: 600,
              boxShadow: '0 1px 8px rgba(147,51,234,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}>
                <FcGoogle size={20}/>
                Continue with Google

   
            </motion.button>
        </motion.div>

      
    </div>
  )
}

export default Auth
