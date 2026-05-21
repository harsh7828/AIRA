import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

const ease = [0.22, 1, 0.36, 1]

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 6l3 3 5-5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const plans = [
  {
    id: 'free', name: 'Starter', tagline: 'Begin your preparation',
    price: '₹0', period: 'no cost', credits: 100, isDefault: true,
    features: ['100 AI interview credits', 'Voice interview access', 'Basic performance report', '7-day history access'],
  },
  {
    id: 'basic', name: 'Professional', tagline: 'Structured improvement',
    price: '₹100', period: 'one-time', credits: 150, badge: 'Popular',
    features: ['150 AI interview credits', 'Detailed AI feedback', 'Performance analytics', 'Full interview history'],
  },
  {
    id: 'pro', name: 'Executive', tagline: 'Enterprise-grade preparation',
    price: '₹500', period: 'one-time', credits: 650, badge: 'Best Value', featured: true,
    features: ['650 AI interview credits', 'Advanced AI feedback', 'Behavioral telemetry', 'Skill trend analysis', 'Priority processing', 'PDF executive reports'],
  },
]

export default function Pricing() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(null)

  const pay = async (plan) => {
    if (plan.isDefault) return
    try {
      setLoading(plan.id)
      const amount = plan.id === 'basic' ? 100 : 500
      const res = await axios.post(ServerUrl + '/api/payment/order', { planId: plan.id, amount, credits: plan.credits }, { withCredentials: true })
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: res.data.amount, currency: 'INR',
        name: 'AIRA', description: `${plan.name} · ${plan.credits} Credits`,
        order_id: res.data.id,
        handler: async (r) => {
          const v = await axios.post(ServerUrl + '/api/payment/verify', r, { withCredentials: true })
          dispatch(setUserData(v.data.user))
          alert('Payment successful — credits added.')
          navigate('/')
        },
        theme: { color: '#9333EA' },
      }
      new window.Razorpay(options).open()
      setLoading(null)
    } catch { setLoading(null) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '80px 32px 104px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease }}
          style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '14px' }}>
            Pricing
          </span>
          <h1 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 2.875rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto', lineHeight: 1.7 }}>
            Credit-based. No subscriptions. No lock-in.<br />Pay once, use when you need.
          </p>
        </motion.div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'stretch', maxWidth: '960px', margin: '0 auto 48px' }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.07, ease }}
              style={{
                background: plan.featured ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                border: `1px solid ${plan.featured ? 'var(--border-strong)' : 'var(--border)'}`,
                borderRadius: '20px', padding: '32px',
                position: 'relative',
                boxShadow: plan.featured ? 'var(--shadow-md)' : 'none',
                display: 'flex', flexDirection: 'column',
                transform: plan.featured ? 'translateY(-4px)' : 'none',
              }}
            >
              {/* Featured top accent */}
              {plan.featured && (
                <div style={{ position: 'absolute', top: 0, left: '24px', right: '24px', height: '2px', background: 'var(--accent)', borderRadius: '0 0 2px 2px' }} />
              )}

              {/* Badge */}
              <div style={{ height: '26px', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                {plan.badge && (
                  <span className={`badge ${plan.featured ? 'badge-accent' : 'badge-neutral'}`}>{plan.badge}</span>
                )}
              </div>

              {/* Identity */}
              <h3 style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '4px' }}>{plan.name}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'Inter', marginBottom: '24px' }}>{plan.tagline}</p>

              {/* Price */}
              <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontFamily: 'Satoshi, Inter, sans-serif', fontWeight: 800, fontSize: '2.25rem', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'Inter' }}>/ {plan.period}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: '0.7rem', color: 'var(--gold)' }}>{plan.credits} credits included</span>
                </div>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'Inter' }}>
                    <Check />{f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.isDefault ? (
                <div style={{ padding: '10px', textAlign: 'center', borderRadius: '9px', border: '1px solid var(--border)', fontFamily: "'IBM Plex Mono'", fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  Current plan
                </div>
              ) : (
                <button
                  id={`pricing-${plan.id}-btn`}
                  onClick={() => pay(plan)}
                  disabled={loading === plan.id}
                  className={plan.featured ? 'btn-primary' : 'btn-ghost'}
                  style={{ width: '100%', justifyContent: 'center', padding: '11px', opacity: loading === plan.id ? 0.5 : 1 }}
                >
                  {loading === plan.id ? 'Processing…' : 'Get started'}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontFamily: "'IBM Plex Mono'", fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          Payments processed securely via Razorpay · Credits never expire
        </p>
      </main>
      <Footer />
    </div>
  )
}
