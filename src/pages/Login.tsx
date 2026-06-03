import { useLang } from '../lib/i18n'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Snowflake } from 'lucide-react'

export default function Login() {
  const { tr, dir } = useLang()
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  useEffect(() => { if (user) navigate('/') }, [user, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('أدخل البريد وكلمة المرور'); return }
    setLoading(true); setError('')
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) { setError(err.message); setLoading(false); return }
        setError('')
        navigate('/')
      } else {
        const err = await signIn(email, password)
        if (err) { setError(err); setLoading(false); return }
        navigate('/')
      }
    } catch (e: any) {
      setError(e?.message ?? 'حدث خطأ')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-frost-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Snowflake className="mx-auto text-frost-cyan" size={56} strokeWidth={1.5} />
          <h1 className="text-3xl font-black text-frost-steel tracking-[6px] mt-4">FRIDGE</h1>
          <p className="text-frost-dim text-sm tracking-widest mt-1">إدارة التبريد</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <div className="h-1 -mt-4 -mx-4 bg-frost-blue rounded-t-xl mb-4" />
          <div>
            <label className="label-f">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-f" placeholder="your@email.com" />
          </div>
          <div>
            <label className="label-f">كلمة المرور</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-f" placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
          <button type="submit" disabled={loading} className="btn-blue">
            {loading ? 'جاري التحميل...' : mode === 'login' ? tr('signIn') : 'إنشاء حساب'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="w-full text-frost-dim text-sm text-center py-2 hover:text-frost-blue transition-colors">
            {mode === 'login' ? 'ليس لديك حساب؟ سجّل الآن' : 'لديك حساب؟ سجّل دخولك'}
          </button>
        </form>
      </div>
    </div>
  )
}
