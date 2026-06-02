import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Snowflake } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Enter email and password'); return }
    setLoading(true); setError('')
    const err = await signIn(email, password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen bg-frost-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Snowflake className="mx-auto text-frost-cyan" size={56} strokeWidth={1.5} />
          <h1 className="text-3xl font-black text-frost-steel tracking-[6px] mt-4">FRIDGE</h1>
          <p className="text-frost-dim text-sm tracking-widest mt-1">Cold Storage Manager</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <div className="h-1 -mt-4 -mx-4 bg-frost-blue rounded-t-xl mb-4" />
          <div>
            <label className="label-f">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-f" placeholder="admin@fridge.com" />
          </div>
          <div>
            <label className="label-f">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-f" placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
          <button type="submit" disabled={loading} className="btn-blue">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  )
}
