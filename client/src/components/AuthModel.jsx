import React from 'react'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { FaTimes } from "react-icons/fa";
import Auth from '../pages/Auth';

function AuthModel({onClose}) {
    const {userData} = useSelector((state)=>state.user)

    useEffect(()=>{
        if(userData){
            onClose()
        }

    },[userData , onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '16px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '28rem' }}>
            <button onClick={onClose} style={{
              position: 'absolute', top: '32px', right: '20px', zIndex: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', transition: 'color 120ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
             <FaTimes size={18}/>
            </button>
            <Auth isModel={true}/>


        </div>

      
    </div>
  )
}

export default AuthModel
