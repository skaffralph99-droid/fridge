import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewWorker() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'loader' | 'driver'>('loader')
  const [rate, setRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name required'); return }
    if (!rate) { setError('Rate required'); return }
    setSaving(true)
    const { error: err } = await supabase.from('fridge_workers').insert({
      name: name.trim(), phone: phone || null, role, rate: parseFloat(rate) || 0,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    nav('/workers')
  }

  const chip = (sel: boolean) => `px-4 py-2 rounded-full text-sm font-bold border cursor-pointer transition-all ${sel ? 'bg-frost-blue border-frost-blue text-white' : 'bg-frost-elevated border-frost-border text-frost-dim'}`

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => nav(-1)} className="text-frost-blue text-sm font-bold flex items-center gap-1 mb-4"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-xl font-black text-frost-steel mb-6">New Worker</h1>
      <form onSubmit={submit} className="card space-y-4">
        <div><label className="label-f">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input-f" placeholder="e.g. Hassan" /></div>
        <div><label className="label-f">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input-f" placeholder="+961 XX XXX XXX" /></div>
        <div>
          <label className="label-f">Role</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setRole('loader')} className={chip(role === 'loader')}>🏗️ Loader</button>
            <button type="button" onClick={() => setRole('driver')} className={chip(role === 'driver')}>🚛 Driver</button>
          </div>
        </div>
        <div>
          <label className="label-f">Rate ({role === 'driver' ? '$ per trip' : '$ per tonne'})</label>
          <input type="number" step="0.5" value={rate} onChange={e => setRate(e.target.value)} className="input-f" placeholder={role === 'driver' ? 'e.g. 50' : 'e.g. 2'} />
        </div>
        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}
        <button type="submit" disabled={saving} className="btn-blue">{saving ? 'Saving...' : 'Add Worker'}</button>
      </form>
    </div>
  )
}
