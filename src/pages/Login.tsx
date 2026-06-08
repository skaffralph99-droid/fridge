import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Snowflake } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setErr(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #0A1628 40%, #081220 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 animate-fade-up">
          <div className="animate-float">
            <Snowflake className="mx-auto text-frost-cyan" size={64} strokeWidth={1.2} />
          </div>
          <h1 className="text-3xl font-black tracking-[8px] mt-5 animate-fade-up delay-1"><span className="text-gradient-blue">FRIDGE</span></h1>
          <p className="text-frost-dim text-xs tracking-[0.3em] mt-2 animate-fade-up delay-2">إدارة التبريد</p>
        </div>
        <form onSubmit={submit} className="space-y-4 animate-fade-up delay-3">
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(19,34,56,0.9), rgba(13,27,42,0.95))', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div className="h-1 bg-gradient-to-l from-frost-blue via-frost-cyan to-blue-400 rounded-full -mt-4 -mx-4 mb-6 rounded-b-none" />
            <div className="space-y-4">
              <div>
                <label className="label-f">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-f" placeholder="your@email.com" />
              </div>
              <div>
                <label className="label-f">كلمة المرور</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-f" placeholder="••••••" />
              </div>
              {err && <p className="text-red-400 text-sm font-semibold animate-fade-in">{err}</p>}
              <button type="submit" disabled={loading} className="btn-blue text-base mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الدخول...
                  </span>
                ) : 'دخول ←'}
              </button>
            </div>
          </div>
        </form>
        <p className="text-center text-frost-dim/40 text-[10px] mt-10 animate-fade-in delay-5">Fridge Manager v1.0 · TrendzLB</p>
      </div>
    </div>
  )
}
