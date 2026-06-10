'use client'

import { useState } from 'react'
import { CATEGORIES } from '../constants/categories'

const empty = {
  name: '', phone: '', email: '',
  category: '', subcategory: '',
  location: '', description: '', rgpd: false
}

const CAT_META: Record<string, { icon: string; desc: string; color: string }> = {
  Jurídico:     { icon: '⚖', desc: 'Abogados y asesores legales', color: '#6366F1' },
  Inmobiliario: { icon: '🏠', desc: 'Agentes y gestores inmobiliarios', color: '#0EA5E9' },
  Reformas:     { icon: '🔧', desc: 'Empresas de reformas y construcción', color: '#F97316' },
  Seguros:      { icon: '🛡', desc: 'Corredores y agentes de seguros', color: '#10B981' },
}

export default function Home() {
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const set = (k: string, v: string | boolean) => setForm(f => ({
    ...f, [k]: v, ...(k === 'category' ? { subcategory: '' } : {})
  }))

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!form.category) e.category = 'Selecciona una categoría'
    if (!form.subcategory) e.subcategory = 'Selecciona una subcategoría'
    return e
  }

  function validateStep2() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nombre requerido'
    if (!/^[6-9]\d{8}$/.test(form.phone)) e.phone = 'Teléfono inválido (9 dígitos)'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    if (!form.location.trim()) e.location = 'Localización requerida'
    if (!form.rgpd) e.rgpd = 'Debes aceptar el tratamiento de datos'
    return e
  }

  function handleNext() {
    const e = validateStep1()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep(2)
  }

  async function handleSubmit() {
    const e = validateStep2()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ip: '0.0.0.0' })
      })
      const data: { id: string; error?: string } = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
      setSubmittedId(data.id)
      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      alert('Error: ' + message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #A7F3D0' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Solicitud enviada</h2>
        <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
          Tu solicitud <strong style={{ color: '#6366F1' }}>{submittedId}</strong> ha sido registrada correctamente.
        </p>
        <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 36 }}>
          Conectaremos contigo con los mejores profesionales en menos de 24 horas.
        </p>
        <button onClick={() => { setForm({ ...empty }); setSubmitted(false); setErrors({}); setStep(1) }}
          style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Enviar otra solicitud
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)' }}>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #E2E8F0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#6366F1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', letterSpacing: '-0.3px' }}>LeadFlow</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 4, borderRadius: 2, background: step >= 1 ? '#6366F1' : '#E2E8F0' }}/>
            <div style={{ width: 28, height: 4, borderRadius: 2, background: step >= 2 ? '#6366F1' : '#E2E8F0' }}/>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        {step === 1 ? (
          <>
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Paso 1 de 2</p>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.5px' }}>
                ¿En qué podemos ayudarte?
              </h1>
              <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.6 }}>
                Selecciona el área en la que necesitas asesoramiento profesional.
              </p>
            </div>

            {/* Categorías */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {Object.entries(CAT_META).map(([cat, meta]) => (
                <button key={cat} onClick={() => set('category', cat)}
                  style={{ padding: '20px', borderRadius: 12, border: `2px solid ${form.category === cat ? meta.color : '#E2E8F0'}`, background: form.category === cat ? meta.color + '08' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{meta.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>{cat}</div>
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>{meta.desc}</div>
                </button>
              ))}
            </div>
            {errors.category && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{errors.category}</p>}

            {/* Subcategoría */}
            {form.category && (
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                  Tipo de consulta
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(CATEGORIES[form.category as keyof typeof CATEGORIES] || []).map(s => (
                    <button key={s} onClick={() => set('subcategory', s)}
                      style={{ padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${form.subcategory === s ? '#6366F1' : '#E2E8F0'}`, background: form.subcategory === s ? '#EEF2FF' : '#fff', color: form.subcategory === s ? '#6366F1' : '#374151', fontSize: 13, fontWeight: form.subcategory === s ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {s}
                    </button>
                  ))}
                </div>
                {errors.subcategory && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{errors.subcategory}</p>}
              </div>
            )}

            <button onClick={handleNext}
              style={{ width: '100%', padding: '14px', background: form.category && form.subcategory ? '#6366F1' : '#E2E8F0', color: form.category && form.subcategory ? '#fff' : '#94A3B8', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: form.category && form.subcategory ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
              Continuar →
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Volver
              </button>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Paso 2 de 2</p>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: 8, letterSpacing: '-0.5px' }}>
                Tus datos de contacto
              </h1>
              <p style={{ color: '#64748B', fontSize: 15 }}>
                Consulta sobre <strong style={{ color: CAT_META[form.category]?.color }}>{form.category}</strong> · {form.subcategory}
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: '28px', marginBottom: 20 }}>
              <div style={{ display: 'grid', gap: 20 }}>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>Nombre completo *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ana García López"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1.5px solid ${errors.name ? '#EF4444' : '#E2E8F0'}`, fontSize: 14, outline: 'none', transition: 'border 0.15s' }}
                    onFocus={e => e.target.style.borderColor = '#6366F1'} onBlur={e => e.target.style.borderColor = errors.name ? '#EF4444' : '#E2E8F0'} />
                  {errors.name && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 5 }}>{errors.name}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>Teléfono *</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="612 345 678"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1.5px solid ${errors.phone ? '#EF4444' : '#E2E8F0'}`, fontSize: 14, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#6366F1'} onBlur={e => e.target.style.borderColor = errors.phone ? '#EF4444' : '#E2E8F0'} />
                    {errors.phone && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 5 }}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>Email *</label>
                    <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="ana@email.com"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1.5px solid ${errors.email ? '#EF4444' : '#E2E8F0'}`, fontSize: 14, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#6366F1'} onBlur={e => e.target.style.borderColor = errors.email ? '#EF4444' : '#E2E8F0'} />
                    {errors.email && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 5 }}>{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>Localización *</label>
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Madrid, Barrio de Salamanca"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `1.5px solid ${errors.location ? '#EF4444' : '#E2E8F0'}`, fontSize: 14, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#6366F1'} onBlur={e => e.target.style.borderColor = errors.location ? '#EF4444' : '#E2E8F0'} />
                  {errors.location && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 5 }}>{errors.location}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>Descripción <span style={{ color: '#94A3B8', fontWeight: 400 }}>(opcional)</span></label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Cuéntanos brevemente tu situación para que los profesionales puedan prepararse mejor..."
                    rows={3}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = '#6366F1'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: 20 }}>
              <label style={{ display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
                <input type="checkbox" checked={form.rgpd} onChange={e => set('rgpd', e.target.checked)}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: '#6366F1', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                  Acepto que mis datos sean tratados conforme al <strong>Reglamento General de Protección de Datos (RGPD)</strong> y puedan ser cedidos a empresas colaboradores para gestionar mi solicitud. Los datos se registran con IP y marca temporal.
                </span>
              </label>
              {errors.rgpd && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 8, marginLeft: 28 }}>{errors.rgpd}</p>}
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#A5B4FC' : '#6366F1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 16 }}>
              Recibirás respuesta en menos de 24 horas · Servicio gratuito
            </p>
          </>
        )}
      </div>
    </div>
  )
}